import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { photos } from "../../drizzle/schema";
import { awardXp, getCoupleByUserId, getDb, isPremium } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const photosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Photo Storage is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    const db = await getDb();
    if (!db) return [];
    return db.select().from(photos).where(eq(photos.coupleId, couple.id)).orderBy(desc(photos.createdAt));
  }),

  upload: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string(), caption: z.string().optional(), milestoneId: z.number().optional(), takenAt: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Photo Storage is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `couples/${couple.id}/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.insert(photos).values({
        coupleId: couple.id, uploadedById: ctx.user.id, url, fileKey: key,
        caption: input.caption, milestoneId: input.milestoneId,
        takenAt: input.takenAt ? new Date(input.takenAt) : undefined,
      });
      await awardXp(couple.id, ctx.user.id, 15, "photo_uploaded", "Uploaded a memory photo 📸", premium);
      return { success: true, url };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(photos).where(and(eq(photos.id, input.id), eq(photos.coupleId, couple.id)));
      return { success: true };
    }),
});
