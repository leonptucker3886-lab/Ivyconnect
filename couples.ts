import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  couples, coupleProfiles, users,
  premiumSubscriptions, coupleXp,
} from "../../drizzle/schema";
import {
  activatePremium, awardXp, getCoupleByUserId, getCoupleById,
  getDb, getLevelInfo, isPremium,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const couplesRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return null;
    const db = await getDb();
    if (!db) return couple;
    const partner = couple.user1Id === ctx.user.id ? couple.user2Id : couple.user1Id;
    const partnerUser = partner ? (await db.select().from(users).where(eq(users.id, partner)).limit(1))[0] : null;
    const xp = await (async () => {
      const r = await db.select().from(coupleXp).where(eq(coupleXp.coupleId, couple.id)).limit(1);
      return r[0] || null;
    })();
    const premium = await isPremium(ctx.user.id);
    return { ...couple, partner: partnerUser, xp, isPremium: premium };
  }),

  create: protectedProcedure
    .input(z.object({ coupleNickname: z.string().optional(), relationshipStartDate: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getCoupleByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already in a couple" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const inviteCode = nanoid(8).toUpperCase();
      await db.insert(couples).values({
        user1Id: ctx.user.id,
        inviteCode,
        coupleNickname: input.coupleNickname,
        relationshipStartDate: input.relationshipStartDate ? new Date(input.relationshipStartDate) : undefined,
        status: "pending",
      });
      const couple = await getCoupleByUserId(ctx.user.id);
      return couple;
    }),

  join: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await getCoupleByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already in a couple" });
      const found = await db.select().from(couples).where(eq(couples.inviteCode, input.inviteCode.toUpperCase())).limit(1);
      if (!found.length) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code" });
      const couple = found[0];
      if (couple.user1Id === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot join your own couple" });
      if (couple.user2Id) throw new TRPCError({ code: "CONFLICT", message: "This couple is already full" });
      await db.update(couples).set({ user2Id: ctx.user.id, status: "active" }).where(eq(couples.id, couple.id));
      // Create couple profile
      await db.insert(coupleProfiles).values({ coupleId: couple.id }).onDuplicateKeyUpdate({ set: { coupleId: couple.id } });
      // Award XP for pairing
      await awardXp(couple.id, ctx.user.id, 50, "couple_joined", "Joined as a couple! 💕", false);
      return { success: true, coupleId: couple.id };
    }),

  update: protectedProcedure
    .input(z.object({ coupleNickname: z.string().optional(), relationshipStartDate: z.string().optional(), tagline: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.coupleNickname !== undefined || input.relationshipStartDate !== undefined) {
        await db.update(couples).set({
          coupleNickname: input.coupleNickname,
          relationshipStartDate: input.relationshipStartDate ? new Date(input.relationshipStartDate) : undefined,
        }).where(eq(couples.id, couple.id));
      }
      if (input.tagline !== undefined) {
        await db.insert(coupleProfiles).values({ coupleId: couple.id, tagline: input.tagline })
          .onDuplicateKeyUpdate({ set: { tagline: input.tagline } });
      }
      return { success: true };
    }),

  getInviteCode: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
    return { inviteCode: couple.inviteCode };
  }),
});
