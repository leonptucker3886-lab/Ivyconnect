import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  resolutions, coachConversations, coachMessages, weeklyReports, dateIdeas,
} from "../../drizzle/schema";
import {
  awardXp, getCoupleByUserId, getDb, getResolutionCount, getResolutions,
  getCoachConversations, getCoachMessages, getWeeklyReports, isPremium,
  getPartnerUserId, createNotification, getMoodEntries, getCheckInResponses,
  getLoveNotes,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const FREE_RESOLUTION_LIMIT = 1;

// ─── AI Resolution Center ─────────────────────────────────────────────────────
export const resolutionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getResolutions(couple.id);
  }),

  getCount: protectedProcedure.query(async ({ ctx }) => {
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return { count: 0, limit: FREE_RESOLUTION_LIMIT, isPremium: false };
    const premium = await isPremium(ctx.user.id);
    const count = await getResolutionCount(couple.id);
    return { count, limit: premium ? Infinity : FREE_RESOLUTION_LIMIT, isPremium: premium };
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1), initiatorCase: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const premium = await isPremium(ctx.user.id);
      const count = await getResolutionCount(couple.id);
      if (!premium && count >= FREE_RESOLUTION_LIMIT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Free tier allows 1 resolution. Upgrade to Premium for unlimited!" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(resolutions).values({
        coupleId: couple.id, initiatorId: ctx.user.id,
        title: input.title, initiatorCase: input.initiatorCase, status: "awaiting_partner",
      });
      const partnerId = await getPartnerUserId(couple.id, ctx.user.id);
      if (partnerId) {
        await createNotification({ userId: partnerId, coupleId: couple.id, type: "resolution", title: "Resolution Request 🤝", message: `${ctx.user.name} has submitted a resolution request. Please share your side.` });
      }
      return { success: true };
    }),

  submitPartnerCase: protectedProcedure
    .input(z.object({ resolutionId: z.number(), partnerCase: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const res = (await db.select().from(resolutions).where(eq(resolutions.id, input.resolutionId)).limit(1))[0];
      if (!res) throw new TRPCError({ code: "NOT_FOUND" });
      await db.update(resolutions).set({ partnerCase: input.partnerCase, status: "ai_processing" }).where(eq(resolutions.id, input.resolutionId));
      // Generate AI suggestion
      const aiResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a compassionate relationship counselor. Both partners have submitted their perspectives on a conflict. Provide a balanced, empathetic, and actionable resolution suggestion. Be specific, fair, and constructive. Format your response in 3 sections: 1) Understanding Both Sides, 2) The Core Issue, 3) Suggested Resolution Steps." },
          { role: "user", content: `Conflict: "${res.title}"\n\nPartner 1's perspective: ${res.initiatorCase}\n\nPartner 2's perspective: ${input.partnerCase}\n\nPlease provide a fair resolution suggestion.` },
        ],
      });
      const rawSuggestion = aiResponse.choices[0]?.message?.content;
      const suggestion = typeof rawSuggestion === 'string' ? rawSuggestion : "Unable to generate suggestion at this time.";
      await db.update(resolutions).set({ aiSuggestion: suggestion, status: "suggestion_ready" }).where(eq(resolutions.id, input.resolutionId));
      // Notify both partners
      await createNotification({ userId: res.initiatorId, coupleId: res.coupleId, type: "resolution", title: "AI Resolution Ready 🤖", message: "The AI has reviewed both sides and has a suggestion ready!" });
      return { success: true };
    }),

  agree: protectedProcedure
    .input(z.object({ resolutionId: z.number(), agree: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const res = (await db.select().from(resolutions).where(eq(resolutions.id, input.resolutionId)).limit(1))[0];
      if (!res) throw new TRPCError({ code: "NOT_FOUND" });
      const isInitiator = res.initiatorId === ctx.user.id;
      const updateData = isInitiator ? { initiatorAgreed: input.agree } : { partnerAgreed: input.agree };
      await db.update(resolutions).set(updateData).where(eq(resolutions.id, input.resolutionId));
      // Check if both agreed
      const updated = (await db.select().from(resolutions).where(eq(resolutions.id, input.resolutionId)).limit(1))[0];
      if (updated?.initiatorAgreed && updated?.partnerAgreed) {
        const premium = await isPremium(ctx.user.id);
        await db.update(resolutions).set({ status: "both_agreed", resolvedAt: new Date() }).where(eq(resolutions.id, input.resolutionId));
        await awardXp(couple.id, ctx.user.id, 100, "resolution_agreed", "Both agreed on a resolution! 🕊️", premium);
      } else if (!input.agree) {
        await db.update(resolutions).set({ status: "one_declined" }).where(eq(resolutions.id, input.resolutionId));
      }
      return { success: true };
    }),
});

// ─── AI Relationship Coach ────────────────────────────────────────────────────
export const coachRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "AI Relationship Coach is a Premium feature!" });
    return getCoachConversations(ctx.user.id);
  }),

  startConversation: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "AI Relationship Coach is a Premium feature!" });
      const couple = await getCoupleByUserId(ctx.user.id);
      if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(coachConversations).values({ coupleId: couple.id, userId: ctx.user.id, title: input.title || "New Conversation" });
      const conv = (await db.select().from(coachConversations).where(eq(coachConversations.userId, ctx.user.id)).limit(1))[0];
      return conv;
    }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN" });
      return getCoachMessages(input.conversationId);
    }),

  sendMessage: protectedProcedure
    .input(z.object({ conversationId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const premium = await isPremium(ctx.user.id);
      if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "AI Relationship Coach is a Premium feature!" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Save user message
      await db.insert(coachMessages).values({ conversationId: input.conversationId, role: "user" as const, content: input.message });
      // Get history for context
      const history = await getCoachMessages(input.conversationId);
      const messages = [
        { role: "system" as const, content: "You are Ivy, a warm, empathetic, and expert relationship coach. You help couples communicate better, resolve conflicts, grow together, and deepen their bond. You are supportive, non-judgmental, and always focus on healthy relationship dynamics. Give practical, actionable advice." },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];
      const aiResponse = await invokeLLM({ messages });
      const rawReply = aiResponse.choices[0]?.message?.content;
      const reply = typeof rawReply === 'string' ? rawReply : "I'm here to help. Could you tell me more?";
      await db.insert(coachMessages).values({ conversationId: input.conversationId, role: "assistant" as const, content: reply });
      return { reply };
    }),
});

// ─── AI Date Recommendations ──────────────────────────────────────────────────
export const aiDateRouter = router({
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "AI Date Recommendations is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
    const [moods, checkIns] = await Promise.all([
      getMoodEntries(couple.id, 7),
      getCheckInResponses(couple.id),
    ]);
    const moodSummary = moods.map((m) => m.mood).join(", ") || "happy";
    const aiResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a creative date planner for couples. Generate 5 personalized date ideas as JSON array." },
        { role: "user", content: `Based on this couple's recent moods (${moodSummary}) and relationship level, suggest 5 creative date ideas. Return JSON: [{title, description, category, budget, locationType, emoji, duration}]` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "date_ideas",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ideas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" }, description: { type: "string" },
                    category: { type: "string" }, budget: { type: "string" },
                    locationType: { type: "string" }, emoji: { type: "string" }, duration: { type: "string" },
                  },
                  required: ["title", "description", "category", "budget", "locationType", "emoji", "duration"],
                  additionalProperties: false,
                },
              },
            },
            required: ["ideas"],
            additionalProperties: false,
          },
        },
      },
    });
    const rawIdeas = aiResponse.choices[0]?.message?.content;
    const content = typeof rawIdeas === 'string' ? rawIdeas : '{"ideas":[]}';
    const parsed = JSON.parse(content);
    return parsed.ideas || [];
  }),
});

// ─── Weekly Reports ───────────────────────────────────────────────────────────
export const weeklyReportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Weekly Reports is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) return [];
    return getWeeklyReports(couple.id);
  }),

  generate: protectedProcedure.mutation(async ({ ctx }) => {
    const premium = await isPremium(ctx.user.id);
    if (!premium) throw new TRPCError({ code: "FORBIDDEN", message: "Weekly Reports is a Premium feature!" });
    const couple = await getCoupleByUserId(ctx.user.id);
    if (!couple) throw new TRPCError({ code: "NOT_FOUND" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const [moods, notes, checkIns] = await Promise.all([
      getMoodEntries(couple.id, 7),
      getLoveNotes(couple.id),
      getCheckInResponses(couple.id),
    ]);
    const moodSummary = moods.map((m) => `${m.mood}(energy:${m.energy})`).join(", ") || "no mood data";
    const aiResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a relationship wellness analyst. Generate a warm, encouraging weekly relationship health report." },
        { role: "user", content: `Generate a weekly relationship health report for a couple. Data: ${moods.length} mood entries (${moodSummary}), ${notes.length} love notes sent, ${checkIns.length} check-in responses. Include: mood trends, engagement highlights, growth observations, and 3 actionable tips for next week. Be warm and encouraging.` },
      ],
    });
    const rawContent = aiResponse.choices[0]?.message?.content;
    const reportContent = typeof rawContent === 'string' ? rawContent : "Unable to generate report.";
    const ws = weekStart.toISOString().split("T")[0];
    const we = now.toISOString().split("T")[0];
    await db.insert(weeklyReports).values({
      coupleId: couple.id, weekStart: ws, weekEnd: we,
      reportContent, checkInCount: checkIns.length, noteCount: notes.length,
      avgMoodScore: moods.length ? moods.reduce((a, m) => a + (m.energy || 5), 0) / moods.length : undefined,
    });
    return { success: true };
  }),
});
