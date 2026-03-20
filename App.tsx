import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import AppLayout from "./components/AppLayout";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CheckIns = lazy(() => import("./pages/CheckIns"));
const LoveNotes = lazy(() => import("./pages/LoveNotes"));
const Milestones = lazy(() => import("./pages/Milestones"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const BucketList = lazy(() => import("./pages/BucketList"));
const DateIdeas = lazy(() => import("./pages/DateIdeas"));
const Quiz = lazy(() => import("./pages/Quiz"));
const MiniGames = lazy(() => import("./pages/MiniGames"));
const Gamification = lazy(() => import("./pages/Gamification"));
const ResolutionCenter = lazy(() => import("./pages/ResolutionCenter"));
const AICoach = lazy(() => import("./pages/AICoach"));
const WeeklyReports = lazy(() => import("./pages/WeeklyReports"));
const Photos = lazy(() => import("./pages/Photos"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Widget = lazy(() => import("./pages/Widget"));
const LocationSharing = lazy(() => import("./pages/LocationSharing"));
const CommunityProfiles = lazy(() => import("./pages/CommunityProfiles"));
const CoupleProfile = lazy(() => import("./pages/CoupleProfile"));
const CouplesLounge = lazy(() => import("./pages/CouplesLounge"));
const WeeklyChallenges = lazy(() => import("./pages/WeeklyChallenges"));
const PremiumUpgrade = lazy(() => import("./pages/PremiumUpgrade"));
const PremiumSuccess = lazy(() => import("./pages/PremiumSuccess"));
const CommunityMarketplace = lazy(() => import("./pages/CommunityMarketplace"));
const RelationshipStats = lazy(() => import("./pages/RelationshipStats"));
const Notifications = lazy(() => import("./pages/Notifications"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl">🌿</div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading Ivy Connect...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/premium" component={PremiumUpgrade} />
        <Route path="/premium/success" component={PremiumSuccess} />
        <Route path="/dashboard"><AppLayout><Dashboard /></AppLayout></Route>
        <Route path="/check-ins"><AppLayout><CheckIns /></AppLayout></Route>
        <Route path="/love-notes"><AppLayout><LoveNotes /></AppLayout></Route>
        <Route path="/milestones"><AppLayout><Milestones /></AppLayout></Route>
        <Route path="/mood"><AppLayout><MoodTracker /></AppLayout></Route>
        <Route path="/bucket-list"><AppLayout><BucketList /></AppLayout></Route>
        <Route path="/date-ideas"><AppLayout><DateIdeas /></AppLayout></Route>
        <Route path="/quiz"><AppLayout><Quiz /></AppLayout></Route>
        <Route path="/games"><AppLayout><MiniGames /></AppLayout></Route>
        <Route path="/rewards"><AppLayout><Gamification /></AppLayout></Route>
        <Route path="/resolution"><AppLayout><ResolutionCenter /></AppLayout></Route>
        <Route path="/coach"><AppLayout><AICoach /></AppLayout></Route>
        <Route path="/reports"><AppLayout><WeeklyReports /></AppLayout></Route>
        <Route path="/photos"><AppLayout><Photos /></AppLayout></Route>
        <Route path="/calendar"><AppLayout><Calendar /></AppLayout></Route>
        <Route path="/widget"><AppLayout><Widget /></AppLayout></Route>
        <Route path="/location"><AppLayout><LocationSharing /></AppLayout></Route>
        <Route path="/community"><AppLayout><CommunityProfiles /></AppLayout></Route>
        <Route path="/profile/:coupleId"><AppLayout><CoupleProfile /></AppLayout></Route>
        <Route path="/lounge"><AppLayout><CouplesLounge /></AppLayout></Route>
        <Route path="/challenges"><AppLayout><WeeklyChallenges /></AppLayout></Route>
        <Route path="/marketplace"><AppLayout><CommunityMarketplace /></AppLayout></Route>
        <Route path="/stats"><AppLayout><RelationshipStats /></AppLayout></Route>
        <Route path="/notifications"><AppLayout><Notifications /></AppLayout></Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
