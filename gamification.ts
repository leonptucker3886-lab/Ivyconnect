import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  badges, earnedBadges, shopItems, ownedItems, miniGameSessions,
  quizQuestions, quizSessions, quizAnswers, funEvents, completedFunEvents, topicUnlocks,
} from "../../drizzle/schema";
import {
  awardXp, getCoupleByUserId, getDb, getAllBadges, getEarnedBadges,
  getShopItems, getOwnedItems, getCoupleXp, getLevelInfo, isPremium,
  getFunEvents, getCompletedFunEvents, getQuizQuestions,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const gamificationRouter = router({
  getXp: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return null;
    const xp = await getCoupleXp(couple.id);
    if (!xp) return { totalXp: 0, level: 1, levelName: "Spark", progress: 0, nextLevel: "Flame", nextXp: 200 };
    const info = getLevelInfo(xp.totalXp);
    return { ...xp, ...info };
  }),

  getBadges: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    const all = await getAllBadges();
    const earned = couple ? await getEarnedBadges(couple.id) : [];
    const earnedIds = new Set(earned.map((e) => e.badgeId));
    return all.map((b) => ({ ...b, isEarned: earnedIds.has(b.id) }));
  }),

  getShop: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Gift shop is a Premium feature. Upgrade to unlock!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    const items = await getShopItems();
    const owned = couple ? await getOwnedItems(couple.id) : [];
    const ownedIds = new Set(owned.map((o) => o.shopItemId));
    const xp = couple ? await getCoupleXp(couple.id) : null;
    return { items: items.map((i) => ({ ...i, isOwned: ownedIds.has(i.id) })), totalXp: xp?.totalXp || 0 };
  }),

  buyItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Gift shop requires Premium!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const item = (await db.select().from(shopItems).where(eq(shopItems.id, input.itemId)).limit(1))[0];
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      const xp = await getCoupleXp(couple.id);
      if (!xp || xp.totalXp < item.xpCost) throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough XP!" });
      // Deduct XP
      const { coupleXp } = await import("../../drizzle/schema");
      await db.update(coupleXp).set({ totalXp: xp.totalXp - item.xpCost }).where(eq(coupleXp.coupleId, couple.id));
      await db.insert(ownedItems).values({ coupleId: couple.id, userId: ctx.user.id, shopItemId: input.itemId });
      return { success: true };
    }),

  giftItem: protectedProcedure
    .input(z.object({ ownedItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Gifting requires Premium!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const partnerId = couple.user1Id === ctx.user.id ? couple.user2Id : couple.user1Id;
      await db.update(ownedItems).set({ isGifted: true, giftedToId: partnerId })
        .where(and(eq(ownedItems.id, input.ownedItemId), eq(ownedItems.userId, ctx.user.id)));
      return { success: true };
    }),

  getOwnedItems: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getOwnedItems(couple.id);
  }),
});

// ─── Fun Events ───────────────────────────────────────────────────────────────
export const funEventsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    const events = await getFunEvents();
    const completed = couple ? await getCompletedFunEvents(couple.id) : [];
    const completedIds = new Set(completed.map((c) => c.funEventId));
    return events.map((e) => ({ ...e, isCompleted: completedIds.has(e.id) }));
  }),

  complete: protectedProcedure
    .input(z.object({ funEventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      const event = (await db.select().from(funEvents).where(eq(funEvents.id, input.funEventId)).limit(1))[0];
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      await db.insert(completedFunEvents).values({ coupleId: couple.id, funEventId: input.funEventId });
      await awardXp(couple.id, ctx.user.id, event.xpReward, "fun_event", `Completed fun event: ${event.title} 🎉`, premium);
      // Unlock topic if applicable
      if (event.unlocksTopicCategory) {
        const { questionTopics } = await import("../../drizzle/schema");
        const topic = (await db.select().from(questionTopics).where(eq(questionTopics.category, event.unlocksTopicCategory)).limit(1))[0];
        if (topic) {
          await db.insert(topicUnlocks).values({ coupleId: couple.id, topicId: topic.id });
        }
      }
      return { success: true, xpEarned: event.xpReward };
    }),
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizRouter = router({
  getQuestions: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getQuizQuestions(input.category);
    }),

  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(quizSessions).values({ coupleId: couple.id, status: "in_progress" });
    const session = (await db.select().from(quizSessions).where(eq(quizSessions.coupleId, couple.id)).limit(1))[0];
    return session;
  }),

  submitAnswer: protectedProcedure
    .input(z.object({ sessionId: z.number(), questionId: z.number(), answer: z.string(), subjectId: z.number(), isCorrect: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(quizAnswers).values({ ...input, answererId: ctx.user.id });
      return { success: true };
    }),

  completeSession: protectedProcedure
    .input(z.object({ sessionId: z.number(), score: z.number(), totalQuestions: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.update(quizSessions).set({ status: "completed", score: input.score, totalQuestions: input.totalQuestions, completedAt: new Date() })
        .where(eq(quizSessions.id, input.sessionId));
      const xp = Math.round((input.score / Math.max(input.totalQuestions, 1)) * 50) + 10;
      await awardXp(couple.id, ctx.user.id, xp, "quiz_completed", `Completed a relationship quiz! 🧠`, premium);
      return { success: true, xpEarned: xp };
    }),
});

// ─── Mini Games ───────────────────────────────────────────────────────────────
export const miniGamesRouter = router({
  recordSession: protectedProcedure
    .input(z.object({
      gameType: z.enum(["memory_match", "would_you_rather", "truth_or_dare", "couple_trivia", "love_language"]),
      score: z.number().optional(), duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      const xpReward = 25;
      await db.insert(miniGameSessions).values({ coupleId: couple.id, userId: ctx.user.id, ...input, xpEarned: xpReward });
      await awardXp(couple.id, ctx.user.id, xpReward, "mini_game", `Played ${input.gameType.replace(/_/g, " ")}! 🎮`, premium);
      return { success: true, xpEarned: xpReward };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    const db = await getDb();
    if (!db) return [];
    const { desc } = await import("drizzle-orm");
    return db.select().from(miniGameSessions).where(eq(miniGameSessions.coupleId, couple.id)).orderBy(desc(miniGameSessions.completedAt)).limit(20);
  }),
});
