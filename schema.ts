import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Couples ─────────────────────────────────────────────────────────────────
export const couples = mysqlTable("couples", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id"),
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "active", "paused"]).default("pending").notNull(),
  relationshipStartDate: timestamp("relationshipStartDate"),
  coupleNickname: varchar("coupleNickname", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Couple = typeof couples.$inferSelect;
export type InsertCouple = typeof couples.$inferInsert;

// ─── Shared Widget ────────────────────────────────────────────────────────────
export const sharedWidget = mysqlTable("shared_widget", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  emoji: varchar("emoji", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedWidget = typeof sharedWidget.$inferSelect;

// ─── Daily Check-ins ──────────────────────────────────────────────────────────
export const checkInQuestions = mysqlTable("check_in_questions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId"),
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  isCustom: boolean("isCustom").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const checkInResponses = mysqlTable("check_in_responses", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  response: text("response").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckInQuestion = typeof checkInQuestions.$inferSelect;
export type CheckInResponse = typeof checkInResponses.$inferSelect;

// ─── Love Notes ───────────────────────────────────────────────────────────────
export const loveNotes = mysqlTable("love_notes", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  isPinned: boolean("isPinned").default(false),
  mood: varchar("mood", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoveNote = typeof loveNotes.$inferSelect;

// ─── Milestones ───────────────────────────────────────────────────────────────
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  category: mysqlEnum("category", ["anniversary", "first_date", "engagement", "wedding", "travel", "achievement", "custom"]).default("custom").notNull(),
  emoji: varchar("emoji", { length: 10 }),
  isRecurring: boolean("isRecurring").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  options: json("options").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizSessions = mysqlTable("quiz_sessions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  score: int("score").default(0),
  totalQuestions: int("totalQuestions").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const quizAnswers = mysqlTable("quiz_answers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: int("questionId").notNull(),
  answererId: int("answererId").notNull(),
  subjectId: int("subjectId").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("isCorrect"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizSession = typeof quizSessions.$inferSelect;

// ─── Bucket List ──────────────────────────────────────────────────────────────
export const bucketListItems = mysqlTable("bucket_list_items", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  addedById: int("addedById").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("adventure"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  targetDate: timestamp("targetDate"),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BucketListItem = typeof bucketListItems.$inferSelect;

// ─── Mood Tracker ─────────────────────────────────────────────────────────────
export const moodEntries = mysqlTable("mood_entries", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  mood: mysqlEnum("mood", ["ecstatic", "happy", "content", "neutral", "sad", "anxious", "frustrated", "angry"]).notNull(),
  energy: int("energy").default(5), // 1-10
  note: text("note"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoodEntry = typeof moodEntries.$inferSelect;

// ─── Date Ideas ───────────────────────────────────────────────────────────────
export const dateIdeas = mysqlTable("date_ideas", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  budget: mysqlEnum("budget", ["free", "low", "medium", "high"]).notNull(),
  locationType: mysqlEnum("locationType", ["indoor", "outdoor", "virtual", "travel"]).notNull(),
  duration: varchar("duration", { length: 50 }),
  season: varchar("season", { length: 50 }),
  emoji: varchar("emoji", { length: 10 }),
  imageUrl: text("imageUrl"),
  isCurated: boolean("isCurated").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedDateIdeas = mysqlTable("saved_date_ideas", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  dateIdeaId: int("dateIdeaId").notNull(),
  isCompleted: boolean("isCompleted").default(false),
  completedAt: timestamp("completedAt"),
  rating: int("rating"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DateIdea = typeof dateIdeas.$inferSelect;
export type SavedDateIdea = typeof savedDateIdeas.$inferSelect;

// ─── AI Resolution Center ─────────────────────────────────────────────────────
export const resolutions = mysqlTable("resolutions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  initiatorId: int("initiatorId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["awaiting_partner", "ai_processing", "suggestion_ready", "both_agreed", "one_declined", "resolved"]).default("awaiting_partner").notNull(),
  initiatorCase: text("initiatorCase"),
  partnerCase: text("partnerCase"),
  aiSuggestion: text("aiSuggestion"),
  initiatorAgreed: boolean("initiatorAgreed").default(false),
  partnerAgreed: boolean("partnerAgreed").default(false),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resolution = typeof resolutions.$inferSelect;

// ─── Photos ───────────────────────────────────────────────────────────────────
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  uploadedById: int("uploadedById").notNull(),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  caption: text("caption"),
  milestoneId: int("milestoneId"),
  takenAt: timestamp("takenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;

// ─── Weekly Reports ───────────────────────────────────────────────────────────
export const weeklyReports = mysqlTable("weekly_reports", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  weekEnd: varchar("weekEnd", { length: 10 }).notNull(),
  reportContent: text("reportContent"),
  checkInCount: int("checkInCount").default(0),
  noteCount: int("noteCount").default(0),
  avgMoodScore: float("avgMoodScore"),
  milestonesAchieved: int("milestonesAchieved").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyReport = typeof weeklyReports.$inferSelect;

// ─── Gamification ────────────────────────────────────────────────────────────
export const coupleXp = mysqlTable("couple_xp", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  levelName: varchar("levelName", { length: 50 }).default("Spark").notNull(),
  user1Xp: int("user1Xp").default(0).notNull(),
  user2Xp: int("user2Xp").default(0).notNull(),
  checkInStreak: int("checkInStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastCheckInDate: varchar("lastCheckInDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const xpTransactions = mysqlTable("xp_transactions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  requirement: text("requirement").notNull(),
  xpReward: int("xpReward").default(0).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const earnedBadges = mysqlTable("earned_badges", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  isShowcased: boolean("isShowcased").default(false),
});

export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 10 }),
  imageUrl: text("imageUrl"),
  category: mysqlEnum("category", ["gift", "frame", "sticker", "theme", "special"]).notNull(),
  xpCost: int("xpCost").notNull(),
  levelRequired: int("levelRequired").default(1).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const ownedItems = mysqlTable("owned_items", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  shopItemId: int("shopItemId").notNull(),
  isGifted: boolean("isGifted").default(false),
  giftedToId: int("giftedToId"),
  isShowcased: boolean("isShowcased").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export const miniGameSessions = mysqlTable("mini_game_sessions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  gameType: mysqlEnum("gameType", ["memory_match", "would_you_rather", "truth_or_dare", "couple_trivia", "love_language"]).notNull(),
  score: int("score").default(0),
  xpEarned: int("xpEarned").default(0),
  duration: int("duration"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type CoupleXp = typeof coupleXp.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type ShopItem = typeof shopItems.$inferSelect;
export type OwnedItem = typeof ownedItems.$inferSelect;
export type MiniGameSession = typeof miniGameSessions.$inferSelect;

// ─── Premium & Community ─────────────────────────────────────────────────────
export const premiumSubscriptions = mysqlTable("premium_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  coupleId: int("coupleId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communityQuestions = mysqlTable("community_questions", {
  id: int("id").autoincrement().primaryKey(),
  authorCoupleId: int("authorCoupleId").notNull(),
  authorId: int("authorId").notNull(),
  question: text("question").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  answerType: mysqlEnum("answerType", ["text", "scale", "multiple_choice", "yes_no"]).default("text").notNull(),
  answerOptions: json("answerOptions").$type<string[]>(),
  expectedAnswer: text("expectedAnswer"),
  isPublished: boolean("isPublished").default(false),
  likesCount: int("likesCount").default(0),
  downloadsCount: int("downloadsCount").default(0),
  isPremiumOnly: boolean("isPremiumOnly").default(false),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const communityQuestionLikes = mysqlTable("community_question_likes", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const downloadedQuestions = mysqlTable("downloaded_questions", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  communityQuestionId: int("communityQuestionId").notNull(),
  addedToRotation: boolean("addedToRotation").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const coachConversations = mysqlTable("coach_conversations", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const coachMessages = mysqlTable("coach_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PremiumSubscription = typeof premiumSubscriptions.$inferSelect;
export type CommunityQuestion = typeof communityQuestions.$inferSelect;
export type CoachConversation = typeof coachConversations.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  coupleId: int("coupleId"),
  type: mysqlEnum("type", ["milestone", "check_in", "love_note", "quiz", "resolution", "report", "widget", "general"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Interactive Profiles ─────────────────────────────────────────────────────
export const coupleProfiles = mysqlTable("couple_profiles", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull().unique(),
  tagline: varchar("tagline", { length: 200 }),
  avatarFrame: varchar("avatarFrame", { length: 100 }),
  featuredBadgeId: int("featuredBadgeId"),
  vibesScore: int("vibesScore").default(0).notNull(),
  profileVisits: int("profileVisits").default(0).notNull(),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const profileReactions = mysqlTable("profile_reactions", {
  id: int("id").autoincrement().primaryKey(),
  targetCoupleId: int("targetCoupleId").notNull(),
  fromCoupleId: int("fromCoupleId").notNull(),
  reactionType: mysqlEnum("reactionType", ["heart", "fire", "sparkle", "clap"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const profileEndorsements = mysqlTable("profile_endorsements", {
  id: int("id").autoincrement().primaryKey(),
  targetCoupleId: int("targetCoupleId").notNull(),
  fromCoupleId: int("fromCoupleId").notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const profileFeedback = mysqlTable("profile_feedback", {
  id: int("id").autoincrement().primaryKey(),
  targetCoupleId: int("targetCoupleId").notNull(),
  fromCoupleId: int("fromCoupleId").notNull(),
  message: text("message").notNull(),
  isApproved: boolean("isApproved").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityFeed = mysqlTable("activity_feed", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  xpEarned: int("xpEarned").default(0),
  isPublic: boolean("isPublic").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoupleProfile = typeof coupleProfiles.$inferSelect;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;

// ─── Couples Lounge ───────────────────────────────────────────────────────────
export const loungeRooms = mysqlTable("lounge_rooms", {
  id: int("id").autoincrement().primaryKey(),
  couple1Id: int("couple1Id").notNull(),
  couple2Id: int("couple2Id"),
  name: varchar("name", { length: 100 }),
  status: mysqlEnum("status", ["open", "active", "closed"]).default("open").notNull(),
  gameType: varchar("gameType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const loungeMessages = mysqlTable("lounge_messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  coupleId: int("coupleId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoungeRoom = typeof loungeRooms.$inferSelect;
export type LoungeMessage = typeof loungeMessages.$inferSelect;

// ─── Weekly Challenges ────────────────────────────────────────────────────────
export const weeklyChallenges = mysqlTable("weekly_challenges", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  weekEnd: varchar("weekEnd", { length: 10 }).notNull(),
  isActive: boolean("isActive").default(true),
  winnerId: int("winnerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const challengeSubmissions = mysqlTable("challenge_submissions", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  coupleId: int("coupleId").notNull(),
  content: text("content").notNull(),
  emoji: varchar("emoji", { length: 20 }),
  votesCount: int("votesCount").default(0).notNull(),
  isWinner: boolean("isWinner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const challengeVotes = mysqlTable("challenge_votes", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  votedByCoupleId: int("votedByCoupleId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const coupleOfWeek = mysqlTable("couple_of_week", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  challengeId: int("challengeId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  xpPrize: int("xpPrize").default(500).notNull(),
  badgeName: varchar("badgeName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type ChallengeSubmission = typeof challengeSubmissions.$inferSelect;
export type CoupleOfWeek = typeof coupleOfWeek.$inferSelect;

// ─── Fun Events & Question Topics ─────────────────────────────────────────────
export const funEvents = mysqlTable("fun_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  instruction: text("instruction").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  xpReward: int("xpReward").default(25).notNull(),
  unlocksTopicCategory: varchar("unlocksTopicCategory", { length: 50 }),
  emoji: varchar("emoji", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const completedFunEvents = mysqlTable("completed_fun_events", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  funEventId: int("funEventId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export const questionTopics = mysqlTable("question_topics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }),
  category: varchar("category", { length: 50 }).notNull(),
  isPremium: boolean("isPremium").default(false),
  isAdult: boolean("isAdult").default(false),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const topicUnlocks = mysqlTable("topic_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  topicId: int("topicId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type FunEvent = typeof funEvents.$inferSelect;
export type QuestionTopic = typeof questionTopics.$inferSelect;

// ─── Shared Calendar ──────────────────────────────────────────────────────────
export const sharedCalendar = mysqlTable("shared_calendar", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  createdById: int("createdById").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  isRecurring: boolean("isRecurring").default(false),
  recurringType: mysqlEnum("recurringType", ["daily", "weekly", "monthly", "yearly"]),
  emoji: varchar("emoji", { length: 10 }),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedCalendarEvent = typeof sharedCalendar.$inferSelect;

// ─── Stripe Orders ────────────────────────────────────────────────────────────
export const stripeOrders = mysqlTable("stripe_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StripeOrder = typeof stripeOrders.$inferSelect;

// ─── Location Sharing (PREMIUM) ───────────────────────────────────────────────
export const locationShares = mysqlTable("location_shares", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  userId: int("userId").notNull(),
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),
  accuracy: float("accuracy"),
  isSharing: boolean("isSharing").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const meetMePins = mysqlTable("meet_me_pins", {
  id: int("id").autoincrement().primaryKey(),
  coupleId: int("coupleId").notNull(),
  createdById: int("createdById").notNull(),
  latitude: float("latitude").notNull(),
  longitude: float("longitude").notNull(),
  label: varchar("label", { length: 200 }),
  message: text("message"),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LocationShare = typeof locationShares.$inferSelect;
export type MeetMePin = typeof meetMePins.$inferSelect;
