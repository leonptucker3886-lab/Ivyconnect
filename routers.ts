import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { couplesRouter } from "./routers/couples";
import { checkInsRouter } from "./routers/checkIns";
import { loveNotesRouter, milestonesRouter, moodRouter, bucketListRouter, dateIdeasRouter } from "./routers/core";
import { gamificationRouter, funEventsRouter, quizRouter, miniGamesRouter } from "./routers/gamification";
import { resolutionRouter, coachRouter, aiDateRouter, weeklyReportsRouter } from "./routers/ai";
import { profilesRouter, loungeRouter, challengesRouter, widgetRouter, calendarRouter, notificationsRouter, premiumRouter, communityRouter } from "./routers/social";
import { photosRouter } from "./routers/photos";
import { locationRouter } from "./routers/location";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  couples: couplesRouter,
  checkIns: checkInsRouter,
  loveNotes: loveNotesRouter,
  milestones: milestonesRouter,
  mood: moodRouter,
  bucketList: bucketListRouter,
  dateIdeas: dateIdeasRouter,
  gamification: gamificationRouter,
  funEvents: funEventsRouter,
  quiz: quizRouter,
  miniGames: miniGamesRouter,
  resolution: resolutionRouter,
  coach: coachRouter,
  aiDate: aiDateRouter,
  weeklyReports: weeklyReportsRouter,
  profiles: profilesRouter,
  lounge: loungeRouter,
  challenges: challengesRouter,
  widget: widgetRouter,
  calendar: calendarRouter,
  notifications: notificationsRouter,
  premium: premiumRouter,
  community: communityRouter,
  photos: photosRouter,
  location: locationRouter,
});

export type AppRouter = typeof appRouter;
