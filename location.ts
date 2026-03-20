import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { locationShares, meetMePins } from "../../drizzle/schema";
import { getCoupleByUserId, getDb, isPremium } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const locationRouter = router({
  // Get partner's current location and own location
  getLocations: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Location Sharing is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return { myLocation: null, partnerLocation: null, pins: [] };
    const db = await getDb();
    if (!db) return { myLocation: null, partnerLocation: null, pins: [] };

    const partnerId = couple.user1Id === ctx.user.id ? couple.user2Id : couple.user1Id;

    const myLoc = (await db.select().from(locationShares)
      .where(and(eq(locationShares.coupleId, couple.id), eq(locationShares.userId, ctx.user.id)))
      .limit(1))[0] || null;

    const partnerLoc = partnerId ? (await db.select().from(locationShares)
      .where(and(eq(locationShares.coupleId, couple.id), eq(locationShares.userId, partnerId), eq(locationShares.isSharing, true)))
      .limit(1))[0] || null : null;

    const pins = await db.select().from(meetMePins)
      .where(and(eq(meetMePins.coupleId, couple.id), eq(meetMePins.isActive, true)));

    return { myLocation: myLoc, partnerLocation: partnerLoc, pins };
  }),

  // Update own location
  updateLocation: protectedProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number(), accuracy: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Location Sharing is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = (await db.select().from(locationShares)
        .where(and(eq(locationShares.coupleId, couple.id), eq(locationShares.userId, ctx.user.id)))
        .limit(1))[0];

      if (existing) {
        await db.update(locationShares)
          .set({ latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy, isSharing: true })
          .where(eq(locationShares.id, existing.id));
      } else {
        await db.insert(locationShares).values({
          coupleId: couple.id, userId: ctx.user.id,
          latitude: input.latitude, longitude: input.longitude, accuracy: input.accuracy, isSharing: true,
        });
      }
      return { success: true };
    }),

  // Toggle sharing on/off
  toggleSharing: protectedProcedure
    .input(z.object({ isSharing: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(locationShares)
        .set({ isSharing: input.isSharing })
        .where(and(eq(locationShares.coupleId, couple.id), eq(locationShares.userId, ctx.user.id)));
      return { success: true };
    }),

  // Drop a "Meet Me Here" pin
  dropPin: protectedProcedure
    .input(z.object({ latitude: z.number(), longitude: z.number(), label: z.string().optional(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Location Sharing is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Deactivate old pins from this user
      await db.update(meetMePins).set({ isActive: false })
        .where(and(eq(meetMePins.coupleId, couple.id), eq(meetMePins.createdById, ctx.user.id)));
      // Create new pin
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hr expiry
      await db.insert(meetMePins).values({
        coupleId: couple.id, createdById: ctx.user.id,
        latitude: input.latitude, longitude: input.longitude,
        label: input.label || "Meet Me Here 📍", message: input.message, isActive: true, expiresAt,
      });
      return { success: true };
    }),

  // Remove a pin
  removePin: protectedProcedure
    .input(z.object({ pinId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(meetMePins).set({ isActive: false })
        .where(and(eq(meetMePins.id, input.pinId), eq(meetMePins.coupleId, couple.id)));
      return { success: true };
    }),
});
