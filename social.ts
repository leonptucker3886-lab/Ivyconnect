import { TRPCError } from "@trpc/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import {
  coupleProfiles, profileReactions, profileEndorsements, profileFeedback,
  activityFeed, loungeRooms, loungeMessages, weeklyChallenges, challengeSubmissions,
  challengeVotes, coupleOfWeek, sharedWidget, sharedCalendar, notifications,
  premiumSubscriptions, stripeOrders, users, couples, communityQuestions,
  communityQuestionLikes, downloadedQuestions,
} from "../../drizzle/schema";
import {
  awardXp, getCoupleByUserId, getDb, isPremium, getPartnerUserId,
  createNotification, getCoupleById,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Interactive Profiles ─────────────────────────────────────────────────────
export const profilesRouter = router({
  getPublic: protectedProcedure
    .input(z.object({ coupleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const profile = (await db.select().from(coupleProfiles).where(eq(coupleProfiles.coupleId, input.coupleId)).limit(1))[0];
      const couple = await getCoupleById(input.coupleId);
      const reactions = await db.select().from(profileReactions).where(eq(profileReactions.targetCoupleId, input.coupleId));
      const endorsements = await db.select().from(profileEndorsements).where(eq(profileEndorsements.targetCoupleId, input.coupleId));
      const feedback = await db.select().from(profileFeedback).where(and(eq(profileFeedback.targetCoupleId, input.coupleId), eq(profileFeedback.isApproved, true)));
      const feed = await db.select().from(activityFeed).where(and(eq(activityFeed.coupleId, input.coupleId), eq(activityFeed.isPublic, true))).orderBy(desc(activityFeed.createdAt)).limit(10);
      return { profile, couple, reactions, endorsements, feedback, feed };
    }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return null;
    const db = await getDb();
    if (!db) return null;
    const profile = (await db.select().from(coupleProfiles).where(eq(coupleProfiles.coupleId, couple.id)).limit(1))[0];
    return profile || null;
  }),

  update: protectedProcedure
    .input(z.object({ tagline: z.string().optional(), isPublic: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(coupleProfiles).values({ coupleId: couple.id, ...input })
        .onDuplicateKeyUpdate({ set: input });
      return { success: true };
    }),

  react: protectedProcedure
    .input(z.object({ targetCoupleId: z.number(), reactionType: z.enum(["heart", "fire", "sparkle", "clap"]) }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      if (couple.id === input.targetCoupleId) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot react to your own profile" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(profileReactions).values({ targetCoupleId: input.targetCoupleId, fromCoupleId: couple.id, reactionType: input.reactionType });
      await awardXp(couple.id, ctx.user.id, 5, "profile_reaction", "Reacted to a couple's profile ✨", premium);
      // Update vibes score
      await db.update(coupleProfiles).set({ vibesScore: sql`vibesScore + 1` }).where(eq(coupleProfiles.coupleId, input.targetCoupleId));
      return { success: true };
    }),

  endorse: protectedProcedure
    .input(z.object({ targetCoupleId: z.number(), tag: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      if (couple.id === input.targetCoupleId) throw new TRPCError({ code: "BAD_REQUEST" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(profileEndorsements).values({ targetCoupleId: input.targetCoupleId, fromCoupleId: couple.id, tag: input.tag });
      await awardXp(couple.id, ctx.user.id, 5, "profile_endorse", "Endorsed another couple 💪", premium);
      await db.update(coupleProfiles).set({ vibesScore: sql`vibesScore + 2` }).where(eq(coupleProfiles.coupleId, input.targetCoupleId));
      return { success: true };
    }),

  leaveFeedback: protectedProcedure
    .input(z.object({ targetCoupleId: z.number(), message: z.string().min(5).max(300) }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      if (couple.id === input.targetCoupleId) throw new TRPCError({ code: "BAD_REQUEST" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(profileFeedback).values({ targetCoupleId: input.targetCoupleId, fromCoupleId: couple.id, message: input.message });
      await awardXp(couple.id, ctx.user.id, 10, "profile_feedback", "Left feedback for a couple 💬", premium);
      return { success: true };
    }),

  getSpotlight: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    // Get top couples by vibes score
    const top = await db.select().from(coupleProfiles).where(eq(coupleProfiles.isPublic, true)).orderBy(desc(coupleProfiles.vibesScore)).limit(6);
    return top;
  }),
});

// ─── Couples Lounge ───────────────────────────────────────────────────────────
export const loungeRouter = router({
  getRooms: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Couples Lounge is a Premium feature!" });
    const db = await getDb();
    if (!db) return [];
    return db.select().from(loungeRooms).where(eq(loungeRooms.status, "open")).orderBy(desc(loungeRooms.createdAt)).limit(20);
  }),

  createRoom: protectedProcedure
    .input(z.object({ name: z.string().optional(), gameType: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Couples Lounge is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(loungeRooms).values({ couple1Id: couple.id, name: input.name, gameType: input.gameType, status: "open" });
      return { success: true };
    }),

  joinRoom: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Couples Lounge is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(loungeRooms).set({ couple2Id: couple.id, status: "active" }).where(eq(loungeRooms.id, input.roomId));
      return { success: true };
    }),

  getMessages: protectedProcedure
    .input(z.object({ roomId: z.number() }))
    .query(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      return db.select().from(loungeMessages).where(eq(loungeMessages.roomId, input.roomId)).orderBy(desc(loungeMessages.createdAt)).limit(50);
    }),

  sendMessage: protectedProcedure
    .input(z.object({ roomId: z.number(), content: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(loungeMessages).values({ roomId: input.roomId, coupleId: couple.id, senderId: ctx.user.id, content: input.content });
      return { success: true };
    }),
});

// ─── Weekly Challenges ────────────────────────────────────────────────────────
export const challengesRouter = router({
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const challenge = (await db.select().from(weeklyChallenges).where(eq(weeklyChallenges.isActive, true)).orderBy(desc(weeklyChallenges.createdAt)).limit(1))[0];
    if (!challenge) return null;
    const submissions = await db.select().from(challengeSubmissions).where(eq(challengeSubmissions.challengeId, challenge.id)).orderBy(desc(challengeSubmissions.votesCount));
    return { challenge, submissions };
  }),

  submit: protectedProcedure
    .input(z.object({ challengeId: z.number(), content: z.string().min(5).max(500), emoji: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Weekly Challenges require Premium!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(challengeSubmissions).values({ challengeId: input.challengeId, coupleId: couple.id, content: input.content, emoji: input.emoji });
      await awardXp(couple.id, ctx.user.id, 30, "challenge_submitted", "Submitted a weekly challenge entry! 🏆", premium);
      return { success: true };
    }),

  vote: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Voting requires Premium!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(challengeVotes).values({ submissionId: input.submissionId, votedByCoupleId: couple.id });
      await db.update(challengeSubmissions).set({ votesCount: sql`votesCount + 1` }).where(eq(challengeSubmissions.id, input.submissionId));
      await awardXp(couple.id, ctx.user.id, 5, "challenge_voted", "Voted in weekly challenge 🗳️", premium);
      return { success: true };
    }),

  getCoupleOfWeek: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    return db.select().from(coupleOfWeek).orderBy(desc(coupleOfWeek.createdAt)).limit(1);
  }),
});

// ─── Shared Widget (PREMIUM) ──────────────────────────────────────────────────
export const widgetRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Shared Widget is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return null;
    const db = await getDb();
    if (!db) return null;
    const widget = (await db.select().from(sharedWidget).where(eq(sharedWidget.coupleId, couple.id)).orderBy(desc(sharedWidget.updatedAt)).limit(1))[0];
    return widget || null;
  }),

  update: protectedProcedure
    .input(z.object({ content: z.string().min(1).max(500), emoji: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Shared Widget is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await db.select().from(sharedWidget).where(eq(sharedWidget.coupleId, couple.id)).limit(1))[0];
      if (existing) {
        await db.update(sharedWidget).set({ content: input.content, emoji: input.emoji, authorId: ctx.user.id }).where(eq(sharedWidget.id, existing.id));
      } else {
        await db.insert(sharedWidget).values({ coupleId: couple.id, authorId: ctx.user.id, content: input.content, emoji: input.emoji });
      }
      return { success: true };
    }),
});

// ─── Shared Calendar (PREMIUM) ────────────────────────────────────────────────
export const calendarRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Shared Calendar is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    const db = await getDb();
    if (!db) return [];
    return db.select().from(sharedCalendar).where(eq(sharedCalendar.coupleId, couple.id)).orderBy(sharedCalendar.eventDate);
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), description: z.string().optional(), eventDate: z.string(), isRecurring: z.boolean().optional(), recurringType: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(), emoji: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Shared Calendar is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(sharedCalendar).values({ ...input, eventDate: new Date(input.eventDate), coupleId: couple.id, createdById: ctx.user.id });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(sharedCalendar).where(and(eq(sharedCalendar.id, input.id), eq(sharedCalendar.coupleId, couple.id)));
      return { success: true };
    }),
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(30);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),
});

// ─── Premium & Stripe ─────────────────────────────────────────────────────────
export const premiumRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    return { isPremium: premium };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["monthly", "yearly", "lifetime"]) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await isPremium(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already a Premium member!" });
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const origin = ctx.req.headers.origin as string || "https://localhost:3000";

      const PLANS = {
        monthly: { name: "Ivy Connect Premium — Monthly", description: "Billed monthly. Cancel anytime.", amount: 800, mode: "subscription" as const, interval: "month" as const },
        yearly: { name: "Ivy Connect Premium — Annual", description: "Billed annually. Save 48% vs monthly!", amount: 2500, mode: "subscription" as const, interval: "year" as const },
        lifetime: { name: "Ivy Connect Premium — Lifetime Access ⏳ Limited Offer", description: "One-time payment. Unlock everything forever! First 6 months only.", amount: 4000, mode: "payment" as const, interval: null },
      };

      const plan = PLANS[input.plan];
      let session;

      if (plan.mode === "subscription") {
        // Create a price on the fly for subscription
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: plan.amount,
          recurring: { interval: plan.interval! },
          product_data: { name: plan.name },
        });
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [{ price: price.id, quantity: 1 }],
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: { user_id: ctx.user.id.toString(), plan: input.plan, customer_email: ctx.user.email || "", customer_name: ctx.user.name || "" },
          allow_promotion_codes: true,
          success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/premium`,
        });
      } else {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [{ price_data: { currency: "usd", product_data: { name: plan.name, description: plan.description }, unit_amount: plan.amount }, quantity: 1 }],
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: { user_id: ctx.user.id.toString(), plan: input.plan, customer_email: ctx.user.email || "", customer_name: ctx.user.name || "" },
          allow_promotion_codes: true,
          success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/premium`,
        });
      }

      return { url: session.url };
    }),

  getOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(stripeOrders).where(eq(stripeOrders.userId, ctx.user.id)).orderBy(desc(stripeOrders.createdAt));
  }),
});

// ─── Community Questions ──────────────────────────────────────────────────────
export const communityRouter = router({
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Community Marketplace is a Premium feature!" });
      const db = await getDb();
      if (!db) return [];
      return db.select().from(communityQuestions).where(eq(communityQuestions.isPublished, true)).orderBy(desc(communityQuestions.likesCount)).limit(50);
    }),

  create: protectedProcedure
    .input(z.object({ question: z.string().min(5), category: z.string().optional(), answerType: z.enum(["text", "scale", "multiple_choice", "yes_no"]).optional(), expectedAnswer: z.string().optional(), isPublished: z.boolean().optional(), tags: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Custom questions require Premium!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(communityQuestions).values({ ...input, authorCoupleId: couple.id, authorId: ctx.user.id });
      return { success: true };
    }),

  like: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(communityQuestionLikes).values({ questionId: input.questionId, userId: ctx.user.id });
      await db.update(communityQuestions).set({ likesCount: sql`likesCount + 1` }).where(eq(communityQuestions.id, input.questionId));
      return { success: true };
    }),

  download: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(downloadedQuestions).values({ coupleId: couple.id, communityQuestionId: input.questionId });
      await db.update(communityQuestions).set({ downloadsCount: sql`downloadsCount + 1` }).where(eq(communityQuestions.id, input.questionId));
      return { success: true };
    }),
});
