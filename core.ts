import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  loveNotes, milestones, moodEntries, bucketListItems, dateIdeas, savedDateIdeas,
} from "../../drizzle/schema";
import {
  awardXp, getCoupleByUserId, getDb, getLoveNotes, getMilestones,
  getMoodEntries, getBucketList, getDateIdeas, isPremium, getPartnerUserId,
  createNotification,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Love Notes ───────────────────────────────────────────────────────────────
export const loveNotesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getLoveNotes(couple.id);
  }),

  send: protectedProcedure
    .input(z.object({ title: z.string().optional(), content: z.string().min(1), mood: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const partnerId = await getPartnerUserId(couple.id, ctx.user.id);
      if (!partnerId) throw new TRPCError({ code: "BAD_REQUEST", message: "Partner not connected yet" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(loveNotes).values({
        coupleId: couple.id, senderId: ctx.user.id, receiverId: partnerId,
        title: input.title, content: input.content, mood: input.mood,
      });
      await awardXp(couple.id, ctx.user.id, 20, "love_note_sent", "Sent a love note 💌", premium);
      await createNotification({ userId: partnerId, coupleId: couple.id, type: "love_note", title: "New Love Note 💌", message: `${ctx.user.name} sent you a love note!` });
      return { success: true };
    }),

  markRead: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(loveNotes).set({ isRead: true }).where(and(eq(loveNotes.id, input.noteId), eq(loveNotes.receiverId, ctx.user.id)));
      return { success: true };
    }),

  pin: protectedProcedure
    .input(z.object({ noteId: z.number(), pinned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(loveNotes).set({ isPinned: input.pinned }).where(eq(loveNotes.id, input.noteId));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(loveNotes).where(and(eq(loveNotes.id, input.noteId), eq(loveNotes.senderId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestonesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getMilestones(couple.id);
  }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1), description: z.string().optional(),
      date: z.string(), category: z.enum(["anniversary", "first_date", "engagement", "wedding", "travel", "achievement", "custom"]),
      emoji: z.string().optional(), isRecurring: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(milestones).values({ ...input, date: new Date(input.date), coupleId: couple.id });
      await awardXp(couple.id, ctx.user.id, 30, "milestone_added", `Added milestone: ${input.title} 🎉`, premium);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(milestones).where(and(eq(milestones.id, input.id), eq(milestones.coupleId, couple.id)));
      return { success: true };
    }),
});

// ─── Mood Tracker ─────────────────────────────────────────────────────────────
export const moodRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getMoodEntries(couple.id);
  }),

  log: protectedProcedure
    .input(z.object({
      mood: z.enum(["ecstatic", "happy", "content", "neutral", "sad", "anxious", "frustrated", "angry"]),
      energy: z.number().min(1).max(10).optional(),
      note: z.string().optional(),
      date: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(moodEntries).values({ ...input, coupleId: couple.id, userId: ctx.user.id });
      await awardXp(couple.id, ctx.user.id, 10, "mood_logged", "Logged your mood 🌈", premium);
      return { success: true };
    }),
});

// ─── Bucket List ──────────────────────────────────────────────────────────────
export const bucketListRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getBucketList(couple.id);
  }),

  add: protectedProcedure
    .input(z.object({
      title: z.string().min(1), description: z.string().optional(),
      category: z.string().optional(), priority: z.enum(["low", "medium", "high"]).optional(),
      targetDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.insert(bucketListItems).values({
        ...input, coupleId: couple.id, addedById: ctx.user.id,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      });
      await awardXp(couple.id, ctx.user.id, 10, "bucket_added", `Added to bucket list: ${input.title} 🪣`, premium);
      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.update(bucketListItems).set({ isCompleted: true, completedAt: new Date() })
        .where(and(eq(bucketListItems.id, input.id), eq(bucketListItems.coupleId, couple.id)));
      await awardXp(couple.id, ctx.user.id, 50, "bucket_completed", "Completed a bucket list item! 🎊", premium);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(bucketListItems).where(and(eq(bucketListItems.id, input.id), eq(bucketListItems.coupleId, couple.id)));
      return { success: true };
    }),
});

// ─── Date Ideas ───────────────────────────────────────────────────────────────
export const dateIdeasRouter = router({
  list: protectedProcedure
    .input(z.object({ budget: z.string().optional(), locationType: z.string().optional(), category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getDateIdeas(input || {});
    }),

  save: protectedProcedure
    .input(z.object({ dateIdeaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(savedDateIdeas).values({ coupleId: couple.id, dateIdeaId: input.dateIdeaId });
      return { success: true };
    }),

  getSaved: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    const db = await getDb();
    if (!db) return [];
    return db.select().from(savedDateIdeas).where(eq(savedDateIdeas.coupleId, couple.id));
  }),

  complete: protectedProcedure
    .input(z.object({ savedId: z.number(), rating: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const premium = await isPremium(ctx.user.id);
      await db.update(savedDateIdeas).set({ isCompleted: true, completedAt: new Date(), rating: input.rating, notes: input.notes })
        .where(and(eq(savedDateIdeas.id, input.savedId), eq(savedDateIdeas.coupleId, couple.id)));
      await awardXp(couple.id, ctx.user.id, 40, "date_completed", "Went on a date! 💑", premium);
      return { success: true };
    }),
});
