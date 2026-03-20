import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, couples, coupleXp, xpTransactions, badges, earnedBadges,
  shopItems, ownedItems, checkInQuestions, checkInResponses, loveNotes, milestones,
  moodEntries, bucketListItems, dateIdeas, resolutions, coachConversations, coachMessages,
  weeklyReports, notifications, premiumSubscriptions, funEvents, completedFunEvents,
  questionTopics, topicUnlocks, quizQuestions, activityFeed,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch { _db = null; }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((f) => {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Couples ──────────────────────────────────────────────────────────────────
export async function getCoupleByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(couples).where(
    sql`(${couples.user1Id} = ${userId} OR ${couples.user2Id} = ${userId})`
  ).limit(1);
  return r[0] || null;
}

export async function getCoupleById(coupleId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(couples).where(eq(couples.id, coupleId)).limit(1);
  return r[0] || null;
}

export async function getPartnerUserId(coupleId: number, userId: number): Promise<number | null> {
  const couple = await getCoupleById(coupleId);
  if (!couple) return null;
  if (couple.user1Id === userId) return couple.user2Id || null;
  return couple.user1Id;
}

// ─── Premium ──────────────────────────────────────────────────────────────────
export async function isPremium(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const r = await db.select().from(premiumSubscriptions).where(and(eq(premiumSubscriptions.userId, userId), eq(premiumSubscriptions.status, "active"))).limit(1);
  return r.length > 0;
}

export async function activatePremium(userId: number, coupleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(premiumSubscriptions).values({ userId, coupleId, status: "active" }).onDuplicateKeyUpdate({ set: { status: "active" } });
}

// ─── XP & Levels ─────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: "Spark", minXp: 0 },
  { level: 2, name: "Flame", minXp: 200 },
  { level: 3, name: "Bonded", minXp: 500 },
  { level: 4, name: "Devoted", minXp: 1000 },
  { level: 5, name: "Cherished", minXp: 2000 },
  { level: 6, name: "Adored", minXp: 3500 },
  { level: 7, name: "Soulmates", minXp: 5000 },
  { level: 8, name: "Eternal", minXp: 8000 },
  { level: 9, name: "Legendary", minXp: 12000 },
  { level: 10, name: "Transcendent", minXp: 20000 },
];

export function getLevelInfo(totalXp: number) {
  let current = LEVELS[0]!;
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i]!.minXp) { current = LEVELS[i]!; next = LEVELS[i + 1]; break; }
  }
  const progress = next ? Math.round(((totalXp - current.minXp) / (next.minXp - current.minXp)) * 100) : 100;
  return { level: current.level, levelName: current.name, nextLevel: next?.name || "Max", nextXp: next?.minXp || current.minXp, progress };
}

export async function getCoupleXp(coupleId: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(coupleXp).where(eq(coupleXp.coupleId, coupleId)).limit(1);
  return r[0] || null;
}

export async function awardXp(coupleId: number, userId: number, amount: number, action: string, description: string, _premium: boolean = false): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getCoupleXp(coupleId);
  const newTotal = (existing?.totalXp || 0) + amount;
  const levelInfo = getLevelInfo(newTotal);
  const couple = await getCoupleById(coupleId);
  const isUser1 = couple?.user1Id === userId;
  if (existing) {
    await db.update(coupleXp).set({
      totalXp: newTotal, level: levelInfo.level, levelName: levelInfo.levelName,
      user1Xp: isUser1 ? (existing.user1Xp + amount) : existing.user1Xp,
      user2Xp: !isUser1 ? (existing.user2Xp + amount) : existing.user2Xp,
    }).where(eq(coupleXp.coupleId, coupleId));
  } else {
    await db.insert(coupleXp).values({ coupleId, totalXp: amount, level: levelInfo.level, levelName: levelInfo.levelName, user1Xp: isUser1 ? amount : 0, user2Xp: !isUser1 ? amount : 0 });
  }
  await db.insert(xpTransactions).values({ coupleId, userId, amount, action, description });
  // Log to activity feed
  await db.insert(activityFeed).values({ coupleId, activityType: action, description, xpEarned: amount, isPublic: true });
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges).orderBy(badges.rarity);
}

export async function getEarnedBadges(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(earnedBadges).where(eq(earnedBadges.coupleId, coupleId));
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
export async function getShopItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopItems).where(eq(shopItems.isActive, true)).orderBy(shopItems.xpCost);
}

export async function getOwnedItems(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ownedItems).where(eq(ownedItems.coupleId, coupleId));
}

// ─── Check-ins ────────────────────────────────────────────────────────────────
export async function getDailyQuestionCount(coupleId: number, date: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ count: sql<number>`COUNT(*)` }).from(checkInResponses)
    .where(and(eq(checkInResponses.coupleId, coupleId), eq(checkInResponses.date, date)));
  return r[0]?.count || 0;
}

export async function getCheckInQuestions(coupleId: number, category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [sql`(${checkInQuestions.coupleId} IS NULL OR ${checkInQuestions.coupleId} = ${coupleId})`];
  if (category) conditions.push(eq(checkInQuestions.category, category));
  return db.select().from(checkInQuestions).where(and(...conditions)).orderBy(sql`RAND()`).limit(10);
}

export async function getCheckInResponses(coupleId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(checkInResponses.coupleId, coupleId)];
  if (date) conditions.push(eq(checkInResponses.date, date));
  return db.select().from(checkInResponses).where(and(...conditions)).orderBy(desc(checkInResponses.createdAt)).limit(50);
}

export async function getQuestionTopics() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionTopics).orderBy(questionTopics.sortOrder);
}

export async function getUnlockedTopics(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(topicUnlocks).where(eq(topicUnlocks.coupleId, coupleId));
}

// ─── Love Notes ───────────────────────────────────────────────────────────────
export async function getLoveNotes(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loveNotes).where(eq(loveNotes.coupleId, coupleId)).orderBy(desc(loveNotes.createdAt)).limit(50);
}

// ─── Milestones ───────────────────────────────────────────────────────────────
export async function getMilestones(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(milestones).where(eq(milestones.coupleId, coupleId)).orderBy(desc(milestones.date));
}

// ─── Mood ─────────────────────────────────────────────────────────────────────
export async function getMoodEntries(coupleId: number, days?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(moodEntries.coupleId, coupleId)];
  if (days) {
    const since = new Date(); since.setDate(since.getDate() - days);
    conditions.push(gte(moodEntries.createdAt, since));
  }
  return db.select().from(moodEntries).where(and(...conditions)).orderBy(desc(moodEntries.createdAt)).limit(60);
}

// ─── Bucket List ──────────────────────────────────────────────────────────────
export async function getBucketList(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bucketListItems).where(eq(bucketListItems.coupleId, coupleId)).orderBy(desc(bucketListItems.createdAt));
}

// ─── Date Ideas ───────────────────────────────────────────────────────────────
export async function getDateIdeas(filters: { budget?: string; locationType?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(dateIdeas.isCurated, true)];
  if (filters.budget) conditions.push(eq(dateIdeas.budget, filters.budget as any));
  if (filters.locationType) conditions.push(eq(dateIdeas.locationType, filters.locationType as any));
  if (filters.category) conditions.push(eq(dateIdeas.category, filters.category));
  return db.select().from(dateIdeas).where(and(...conditions)).orderBy(sql`RAND()`).limit(20);
}

// ─── Resolutions ──────────────────────────────────────────────────────────────
export async function getResolutions(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resolutions).where(eq(resolutions.coupleId, coupleId)).orderBy(desc(resolutions.createdAt));
}

export async function getResolutionCount(coupleId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const r = await db.select({ count: sql<number>`COUNT(*)` }).from(resolutions).where(eq(resolutions.coupleId, coupleId));
  return r[0]?.count || 0;
}

// ─── Coach ────────────────────────────────────────────────────────────────────
export async function getCoachConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachConversations).where(eq(coachConversations.userId, userId)).orderBy(desc(coachConversations.updatedAt));
}

export async function getCoachMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachMessages).where(eq(coachMessages.conversationId, conversationId)).orderBy(coachMessages.createdAt);
}

// ─── Weekly Reports ───────────────────────────────────────────────────────────
export async function getWeeklyReports(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyReports).where(eq(weeklyReports.coupleId, coupleId)).orderBy(desc(weeklyReports.createdAt));
}

// ─── Fun Events ───────────────────────────────────────────────────────────────
export async function getFunEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(funEvents).orderBy(funEvents.xpReward);
}

export async function getCompletedFunEvents(coupleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(completedFunEvents).where(eq(completedFunEvents.coupleId, coupleId));
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export async function getQuizQuestions(category?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = category ? [eq(quizQuestions.category, category)] : [];
  return db.select().from(quizQuestions).where(conditions.length ? and(...conditions) : undefined).orderBy(sql`RAND()`).limit(10);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: { userId: number; coupleId?: number; type: "milestone" | "check_in" | "love_note" | "quiz" | "resolution" | "report" | "widget" | "general"; title: string; message: string; relatedId?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}
