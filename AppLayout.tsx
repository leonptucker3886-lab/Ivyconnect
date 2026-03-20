import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart, MessageCircle, Calendar, Camera, MapPin, Star, Gamepad2,
  Trophy, Zap, Users, Shield, Brain, BarChart3, Bell, Crown,
  Home, CheckSquare, ListTodo, Smile, Lightbulb, HelpCircle,
  Menu, X, ChevronRight, Sparkles, Gift, BookOpen, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  premium?: boolean;
}

const FREE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Daily Check-ins", href: "/check-ins", icon: CheckSquare },
  { label: "Love Notes", href: "/love-notes", icon: MessageCircle },
  { label: "Milestones", href: "/milestones", icon: Star },
  { label: "Mood Tracker", href: "/mood", icon: Smile },
  { label: "Bucket List", href: "/bucket-list", icon: ListTodo },
  { label: "Date Ideas", href: "/date-ideas", icon: Lightbulb },
  { label: "Quiz", href: "/quiz", icon: HelpCircle },
  { label: "Mini-Games", href: "/games", icon: Gamepad2 },
  { label: "Rewards & XP", href: "/rewards", icon: Trophy },
  { label: "Resolution Center", href: "/resolution", icon: Shield },
  { label: "Community", href: "/community", icon: Globe },
  { label: "Stats", href: "/stats", icon: BarChart3 },
];

const PREMIUM_NAV: NavItem[] = [
  { label: "Shared Widget", href: "/widget", icon: Sparkles, premium: true },
  { label: "Calendar", href: "/calendar", icon: Calendar, premium: true },
  { label: "Photo Gallery", href: "/photos", icon: Camera, premium: true },
  { label: "Location Sharing", href: "/location", icon: MapPin, premium: true },
  { label: "AI Coach", href: "/coach", icon: Brain, premium: true },
  { label: "Weekly Reports", href: "/reports", icon: BarChart3, premium: true },
  { label: "Couples Lounge", href: "/lounge", icon: Users, premium: true },
  { label: "Challenges", href: "/challenges", icon: Zap, premium: true },
  { label: "Marketplace", href: "/marketplace", icon: BookOpen, premium: true },
];

function XpBar({ coupleId: _coupleId }: { coupleId: number }) {
  const { data: xpData } = trpc.gamification.getXp.useQuery(undefined, { staleTime: 30000 });
  if (!xpData) return null;
  return (
    <div className="px-3 py-2 bg-sidebar-accent/50 rounded-lg mx-2 mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-sidebar-foreground/80">{xpData.levelName}</span>
        <span className="text-xs text-sidebar-foreground/60">{xpData.totalXp} XP</span>
      </div>
      <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(xpData.progress, 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Zap className="w-3 h-3 text-amber-400" />
        <span className="text-xs text-sidebar-foreground/60">Level {xpData.level}</span>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: premiumData } = trpc.premium.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const { data: coupleData } = trpc.couples.getMine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: notifData } = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30000 });

  const isPremium = premiumData?.isPremium || false;
  const unreadCount = notifData?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🌿</div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location === item.href;
    const isLocked = item.premium && !isPremium;
    return (
      <Link href={isLocked ? "/premium" : item.href}>
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isLocked && "opacity-60"
        )}>
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{item.label}</span>
          {isLocked && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          {item.badge && <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">{item.badge}</Badge>}
        </div>
      </Link>
    );
  };

  const Sidebar = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", className)}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          🌿
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Ivy Connect</h1>
          <p className="text-xs text-sidebar-foreground/50">Grow Together</p>
        </div>
        {isPremium && (
          <Badge className="ml-auto text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 px-1.5">
            <Crown className="w-2.5 h-2.5 mr-1" />PRO
          </Badge>
        )}
      </div>

      {/* XP Bar */}
      <div className="pt-2">
        <XpBar coupleId={0} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-2">
          <p className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Main</p>
          {FREE_NAV.map(item => <NavLink key={item.href} item={item} />)}
        </div>
        <div className="space-y-0.5 py-2 border-t border-sidebar-border mt-2">
          <p className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> Premium
          </p>
          {PREMIUM_NAV.map(item => <NavLink key={item.href} item={item} />)}
        </div>
      </ScrollArea>

      {/* Bottom: User + Upgrade */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!isPremium && (
          <Link href="/premium">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/20 cursor-pointer hover:from-rose-500/30 hover:to-pink-500/30 transition-all">
              <Crown className="w-4 h-4 text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground">Upgrade to Premium</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">From $8/mo</p>
              </div>
              <ChevronRight className="w-3 h-3 text-sidebar-foreground/40 shrink-0" />
            </div>
          </Link>
        )}
        <div className="flex items-center gap-2 px-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name || "You"}</p>
          </div>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="w-7 h-7 relative text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col shadow-2xl">
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span className="text-sm font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Ivy Connect</span>
          </div>
          <Link href="/notifications">
            <button className="p-1.5 rounded-lg hover:bg-muted relative">
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
