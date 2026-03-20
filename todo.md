# Ivy Connect — Project TODO

## Setup & Configuration
- [ ] Update app title/branding to "Ivy Connect"
- [ ] Design system: elegant rose/blush color palette, typography, global CSS
- [ ] Landing page with hero, features, pricing, and CTA

## Authentication & Couple Pairing
- [ ] User authentication (Manus OAuth)
- [ ] Couple pairing system (invite code / link)
- [ ] Partner profile pages
- [ ] Onboarding flow for new couples

## Free vs Premium Tier
- [ ] Free tier: 10 fun/exciting daily questions (24hr cooldown after limit)
- [ ] Free tier: must complete a "Fun Event" challenge to unlock the next question topic
- [ ] Free tier: limited reward system (capped XP 50/day, basic badges only, no gift shop)
- [ ] Free tier: 1 AI resolution lifetime (hard gate after first use)
- [ ] Premium tier ($8/month OR $25/year OR $40 lifetime limited-time): open path through all topics, no Fun Event gate required
- [ ] Premium tier: 18+ intimate questions category (exclusive to premium)
- [ ] Premium tier: unlimited questions, full rewards, all locked features
- [ ] Premium tier: shared widget, calendar, gift shop, photo storage
- [ ] Premium tier: AI features (coach, date recs, weekly reports, unlimited resolutions)
- [ ] Premium tier: custom questions and community marketplace
- [ ] Premium gate UI: lock icon + elegant upgrade prompt on locked features
- [ ] Rate limit enforcement on backend (10 questions/day for free)
- [ ] Resolution count enforcement on backend (1 free, unlimited premium)

## Stripe Payment
- [ ] Stripe integration: $8/month plan, $25/year plan, $40 lifetime plan
- [ ] Lifetime plan: limited-time offer (first 6 months after launch) with countdown timer
- [ ] Stripe webhook to activate premium on successful payment
- [ ] Premium upgrade page with plan comparison, pricing cards, and urgency timer for lifetime deal
- [ ] Post-purchase confirmation and premium activation
- [ ] Orders/billing history page

## Question System
- [ ] Fun, exciting question bank with multiple topic categories
- [ ] Topics: Icebreakers, Dreams & Goals, Memories, Funny & Playful, Deep Connection, Adventures, Love & Appreciation, Future Plans, Challenges & Growth, Intimacy (premium), 18+ (premium only)
- [ ] Topic progression: free users must complete a Fun Event to unlock next topic
- [ ] Fun Event challenges: mini activities couples do together to earn topic unlock (e.g. "Send your partner a voice note", "Share a childhood photo", "Do a 60-second dance together")
- [ ] Premium users: open path — browse and answer any topic freely
- [ ] Question seeding: 20+ fun/exciting questions per topic category

## Core Features
- [ ] Daily check-in questions with topic progression UI
- [ ] Private love notes messaging with rich text support
- [ ] Relationship milestones tracker with countdown timers
- [ ] Relationship statistics dashboard

## Engagement Features
- [ ] Interactive relationship quiz game (partners answer about each other)
- [ ] Shared bucket list (add, track, complete experiences)
- [ ] Mood tracker (daily emotional state + pattern visualization)
- [ ] Curated date ideas library (filters: category, budget, location type)

## Gamification System
- [ ] XP points system (earn points for every action)
- [ ] Free tier: capped XP earn rate (max 50 XP/day)
- [ ] Premium: unlimited XP earn rate
- [ ] Level progression: Spark → Flame → Bonded → Devoted → Soulmates → Eternal
- [ ] Badges: basic badges free, rare/epic/legendary premium only
- [ ] Gift shop: spend XP to unlock virtual gifts, frames, stickers, themes (PREMIUM)
- [ ] Send unlocked gifts to partner (PREMIUM)
- [ ] Partner showcase / trophy wall (display earned badges and gifts)
- [ ] Streak tracker (daily check-in streaks, login streaks)

## Mini-Games
- [ ] Memory Match game (flip cards with couple emojis)
- [ ] Would You Rather for couples
- [ ] Truth or Dare for couples
- [ ] Couple Trivia challenge (timed quiz)
- [ ] Love Language Quiz mini-game
- [ ] All mini-games award XP on completion

## Premium Features
- [ ] Shared widget: partner updates a live note displayed on other partner's dashboard (PREMIUM)
- [ ] Shared calendar: important dates, events, countdowns (PREMIUM)
- [ ] Cloud-based shared photo storage organized by date and milestone (PREMIUM)
- [ ] AI Resolution Center: both partners submit case, AI suggests resolution, both must agree (1 free / unlimited premium)
- [ ] AI-powered personalized date recommendations (PREMIUM)
- [ ] Automated weekly relationship health reports (PREMIUM)
- [ ] Notification system (important dates, daily check-in reminders)
- [ ] Live location sharing (PREMIUM): share real-time location with partner on a map
- [ ] Partner location map: see each other's live position on Google Maps
- [ ] "Meet Me Here" pin: drop a pin to invite partner to a location
- [ ] Location sharing toggle: start/stop sharing with one tap
- [ ] Location history: see where you've been together (last 7 days)
- [ ] Location sharing privacy: only visible to paired partner, never public

## Premium Hub
- [ ] Premium tier flag on user/couple accounts
- [ ] Custom question creator with answer types (text, scale, multiple choice, yes/no)
- [ ] Custom answer input: define expected answers for custom questions
- [ ] AI Relationship Coach: conversational AI chat (PREMIUM)
- [ ] Community Question Marketplace: browse questions by other couples (PREMIUM)
- [ ] Download/import community questions into your rotation (PREMIUM)
- [ ] Publish custom questions to community marketplace (PREMIUM)
- [ ] Like/rate community questions (PREMIUM)
- [ ] Premium badge and visual indicator on profile

## Interactive Profiles & Community Feedback
- [ ] Interactive couple profile page: animated level badge, XP progress bar, trophy wall, activity feed
- [ ] Profile customization: couple nickname, tagline, avatar frame (unlocked via shop), featured badge
- [ ] Activity feed on profile: recent achievements, completed challenges, milestones, games played
- [ ] Community reactions on public profiles: send heart, fire, sparkle, clap reactions to other couples
- [ ] Endorsements: other couples can endorse yours with tags like "Goals 💕", "Inspiring ✨", "Fun Couple 🎉"
- [ ] Feedback wall: couples can leave a short public compliment/message on another couple's profile
- [ ] Participation rewards: earn XP for reacting, endorsing, leaving feedback, voting in challenges
- [ ] "Couple Vibes" score: calculated from community reactions and endorsements received
- [ ] Profile visit counter: see how many couples visited your profile this week
- [ ] Spotlight section: featured couples, most endorsed, most active this week
- [ ] Report/block system for safe community interactions

## Couples Lounge (PREMIUM)
- [ ] Couples Lounge social space: browse and connect with other premium couples
- [ ] Couple public profile card (nickname, level, badges, join date — no personal info)
- [ ] Virtual double date rooms: two couples join a shared chat/activity room
- [ ] Double date icebreaker games: joint trivia, Would You Rather battles, couple vs couple quiz
- [ ] Weekly Couple Challenge: all premium couples compete in a fun weekly challenge (e.g. best date idea, funniest couple story, trivia battle)
- [ ] Voting system: community votes on weekly challenge submissions
- [ ] Couple of the Week: winner announced every Sunday, featured on homepage spotlight
- [ ] Couple of the Week prizes: XP bonus, exclusive badge, featured trophy, special frame
- [ ] Leaderboard: top couples ranked by weekly challenge score and votes
- [ ] Challenge submission: couples submit text/emoji responses to weekly challenge prompt
- [ ] Double date room chat (text-based, fun and safe)

## GitHub Integration
- [ ] Ensure clean project structure ready for GitHub export
- [ ] .gitignore covers env files, node_modules, build artifacts
- [ ] README.md with setup instructions, feature list, and tech stack
- [ ] GitHub export available via Settings panel in Management UI

## Bug Fixes
- [ ] Fix dark theme contrast - text invisible against dark background, switch to proper light theme

## Testing
- [ ] Vitest unit tests for all major backend procedures
- [ ] End-to-end flow verification
