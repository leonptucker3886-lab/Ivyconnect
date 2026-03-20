export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_NAME = "Ivy Connect";
export const APP_TAGLINE = "Grow Together";

export const LEVELS = [
  { level: 1, name: "Spark", emoji: "✨", color: "from-rose-400 to-pink-400" },
  { level: 2, name: "Flame", emoji: "🔥", color: "from-orange-400 to-rose-400" },
  { level: 3, name: "Bonded", emoji: "💞", color: "from-pink-400 to-rose-500" },
  { level: 4, name: "Devoted", emoji: "💝", color: "from-rose-500 to-red-400" },
  { level: 5, name: "Cherished", emoji: "💎", color: "from-purple-400 to-pink-400" },
  { level: 6, name: "Adored", emoji: "👑", color: "from-amber-400 to-orange-400" },
  { level: 7, name: "Soulmates", emoji: "🌟", color: "from-yellow-400 to-amber-400" },
  { level: 8, name: "Eternal", emoji: "♾️", color: "from-cyan-400 to-blue-400" },
  { level: 9, name: "Legendary", emoji: "🏆", color: "from-amber-300 to-yellow-300" },
  { level: 10, name: "Transcendent", emoji: "🌈", color: "from-violet-400 to-purple-400" },
];

export const PRICING = {
  monthly: { price: 8, label: "Monthly", period: "/ month", description: "Billed monthly. Cancel anytime." },
  yearly: { price: 25, label: "Annual", period: "/ year", description: "Save 48% vs monthly!", badge: "Best Value" },
  lifetime: { price: 40, label: "Lifetime", period: "one-time", description: "Limited time — first 6 months only!", badge: "⏳ Limited Offer" },
};

export const APP_LAUNCH_DATE = new Date("2026-03-20T00:00:00Z");
export const LIFETIME_OFFER_EXPIRY = new Date(APP_LAUNCH_DATE.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
export const FREE_DAILY_QUESTION_LIMIT = 10;
export const FREE_RESOLUTION_LIMIT = 1;
export const FREE_DAILY_XP_CAP = 50;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
