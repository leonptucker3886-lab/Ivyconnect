import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { checkInQuestions, checkInResponses, questionTopics, topicUnlocks } from "../../drizzle/schema";
import {
  awardXp, getCoupleByUserId, getDb, getDailyQuestionCount, isPremium,
  getCheckInQuestions, getCheckInResponses, getQuestionTopics, getUnlockedTopics,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const FREE_DAILY_LIMIT = 10;

export const checkInsRouter = router({
  getTopics: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    const premium = await isPremium(ctx.user.id);
    const topics = await getQuestionTopics();
    const unlocked = couple ? await getUnlockedTopics(couple.id) : [];
    const unlockedIds = new Set(unlocked.map((u) => u.topicId));

    return topics.map((t) => ({
      ...t,
      isUnlocked: premium || t.sortOrder === 0 || unlockedIds.has(t.id),
      requiresPremium: t.isPremium || t.isAdult,
    }));
  }),

  getQuestions: protectedProcedure
    .input(z.object({ topicId: z.number().optional(), category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND", message: "No couple found" });
      const premium = await isPremium(ctx.user.id);
      const today = new Date().toISOString().split("T")[0];
      const count = await getDailyQuestionCount(couple.id, today);

      if (!premium && count >= FREE_DAILY_LIMIT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Daily limit reached. Upgrade to Premium for unlimited questions!" });
      }

      const questions = await getCheckInQuestions(couple.id, input.category);
      return { questions, dailyCount: count, dailyLimit: FREE_DAILY_LIMIT, isPremium: premium };
    }),

  respond: protectedProcedure
    .input(z.object({ questionId: z.number(), response: z.string().min(1), date: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const premium = await isPremium(ctx.user.id);
      const count = await getDailyQuestionCount(couple.id, input.date);

      if (!premium && count >= FREE_DAILY_LIMIT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Daily limit reached!" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.insert(checkInResponses).values({
        coupleId: couple.id, userId: ctx.user.id,
        questionId: input.questionId, response: input.response, date: input.date,
      });

      await awardXp(couple.id, ctx.user.id, 15, "check_in", "Answered a daily question 💬", premium);
      return { success: true, newCount: count + 1 };
    }),

  getTodayResponses: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    const today = new Date().toISOString().split("T")[0];
    return getCheckInResponses(couple.id, today);
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getCheckInResponses(couple.id);
  }),

  getDailyStatus: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return { count: 0, limit: FREE_DAILY_LIMIT, isPremium: false };
    const premium = await isPremium(ctx.user.id);
    const today = new Date().toISOString().split("T")[0];
    const count = await getDailyQuestionCount(couple.id, today);
    return { count, limit: premium ? Infinity : FREE_DAILY_LIMIT, isPremium: premium };
  }),
});
