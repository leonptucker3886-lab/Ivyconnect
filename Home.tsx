import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl, PRICING, LIFETIME_OFFER_EXPIRY } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Heart, MessageCircle, Star, Gamepad2, Trophy, Shield, Brain,
  Crown, Sparkles, CheckCircle, ArrowRight, Users, Camera,
  MapPin, Calendar, Gift
} from "lucide-react";

function Countdown({ target }: { target: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });
  useEffect(() => {
    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [target]);
  return (
    <div className="flex items-center gap-2 text-sm font-mono">
      {[{ v: timeLeft.days, l: "days" }, { v: timeLeft.hours, l: "hrs" }, { v: timeLeft.mins, l: "min" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center bg-white/10 rounded-lg px-2 py-1 min-w-[40px]">
          <span className="text-lg font-bold text-white">{String(v).padStart(2, "0")}</span>
          <span className="text-[10px] text-white/60 uppercase">{l}</span>
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  { icon: CheckCircle, title: "Daily Check-ins", desc: "10 fun questions/day free. Premium unlocks unlimited topics including 18+ intimacy questions.", color: "text-rose-500" },
  { icon: MessageCircle, title: "Love Notes", desc: "Send rich, heartfelt messages to your partner anytime.", color: "text-pink-500" },
  { icon: Star, title: "Milestones", desc: "Track anniversaries, first dates, and special moments with countdown timers.", color: "text-amber-500" },
  { icon: Gamepad2, title: "Mini-Games", desc: "Memory Match, Would You Rather, Truth or Dare, Couple Trivia — earn XP for every game!", color: "text-purple-500" },
  { icon: Trophy, title: "Gamification", desc: "Earn XP, level up from Spark to Transcendent, unlock badges and gifts for your partner.", color: "text-orange-500" },
  { icon: Shield, title: "AI Resolution Center", desc: "Both partners submit their case. AI suggests a fair resolution. Both must agree to follow it.", color: "text-blue-500" },
  { icon: Brain, title: "AI Relationship Coach", desc: "Personalized advice, conflict guidance, and growth tips from your AI coach. (Premium)", color: "text-violet-500" },
  { icon: Users, title: "Couples Lounge", desc: "Connect with other premium couples, do virtual double dates, and compete for Couple of the Week!", color: "text-teal-500" },
  { icon: MapPin, title: "Live Location Sharing", desc: "Share your real-time location with your partner and drop ‘Meet Me Here’ pins. (Premium)", color: "text-green-500" },
  { icon: Camera, title: "Shared Photo Gallery", desc: "Unlimited cloud storage for couple memories, auto-organized by date and milestone. (Premium)", color: "text-cyan-500" },
  { icon: Calendar, title: "Shared Calendar", desc: "Plan dates, track events, and never miss an important moment together. (Premium)", color: "text-indigo-500" },
  { icon: Sparkles, title: "Shared Widget", desc: "Your partner updates a note that appears as a live widget on your dashboard. (Premium)", color: "text-rose-400" },
];

const TESTIMONIALS = [
  { quote: "The AI Resolution Center saved us from our biggest fight. It was fair, calm, and we actually followed through!", couple: "Sarah & James", level: "Soulmates 🌟" },
  { quote: "We’ve done the daily check-ins every single day for 6 months. It’s become our favorite ritual.", couple: "Mia & Carlos", level: "Bonded 💞" },
  { quote: "Winning Couple of the Week was the most fun we’ve had together in years. The community is so warm!", couple: "Priya & Alex", level: "Cherished 💎" },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient min-h-screen flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-rose-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-lg">🌿</span>
            <span className="text-white/80 text-sm font-medium">The Couples App That Grows With You</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ivy Connect
            <span className="block text-3xl md:text-4xl font-normal italic text-rose-300 mt-2">Grow Together</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Daily check-ins, love notes, AI conflict resolution, mini-games, live location sharing, and a vibrant couples community — everything you need to build a deeper, more joyful relationship.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-500/30 px-8 py-6 text-base font-semibold rounded-xl"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-xl bg-transparent"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              See All Features
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Free to start</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> No credit card required</div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Invite your partner</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">Everything You Need</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Built for Real Couples</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From playful daily rituals to serious conflict resolution — Ivy Connect has it all.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">Simple Pricing</Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Invest in Your Relationship</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free. Upgrade when you’re ready to unlock everything.</p>
          </div>
          <div className="max-w-lg mx-auto mb-10 p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-center">
            <p className="text-white font-semibold mb-2">⏳ Lifetime deal expires in:</p>
            <div className="flex justify-center"><Countdown target={LIFETIME_OFFER_EXPIRY} /></div>
            <p className="text-white/70 text-xs mt-2">Only available for the first 6 months after launch</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <h3 className="text-lg font-bold text-foreground mb-1">Free</h3>
              <p className="text-3xl font-bold text-foreground mb-4">$0<span className="text-base font-normal text-muted-foreground"> forever</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {["10 daily check-in questions", "Love notes & milestones", "Mood tracker & bucket list", "Mini-games & quizzes", "Basic XP & badges", "1 AI resolution (lifetime)", "Community profiles"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = getLoginUrl()}>Get Started Free</Button>
            </div>
            <div className="p-6 rounded-2xl border-2 border-primary bg-card relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Popular</Badge>
              <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-400" /><h3 className="text-lg font-bold text-foreground">Premium Monthly</h3></div>
              <p className="text-3xl font-bold text-foreground mb-4">${PRICING.monthly.price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {["Everything in Free", "Unlimited questions + 18+ topics", "Shared widget & calendar", "Photo gallery (unlimited)", "Live location sharing", "AI Relationship Coach", "Couples Lounge & double dates", "Weekly health reports", "Custom questions & marketplace"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rose-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0" onClick={() => navigate("/premium")}>Upgrade Now</Button>
            </div>
            <div className="p-6 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
              <Badge className="mb-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0">⏳ Limited Time</Badge>
              <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-500" /><h3 className="text-lg font-bold text-foreground">Lifetime Access</h3></div>
              <p className="text-3xl font-bold text-foreground mb-1">${PRICING.lifetime.price}<span className="text-base font-normal text-muted-foreground"> one-time</span></p>
              <p className="text-xs text-amber-600 mb-4 font-medium">First 6 months only — then gone forever</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {["Everything in Premium", "Pay once, own forever", "All future features included", "Priority support"].map(f => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 hover:from-amber-500 hover:to-orange-500" onClick={() => navigate("/premium")}>
                <Gift className="w-4 h-4 mr-2" /> Claim Lifetime Deal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Couples Love Ivy Connect</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.couple} className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex mb-3">{[...Array(5)].map((_, i) => <Heart key={i} className="w-4 h-4 text-rose-400 fill-rose-400" />)}</div>
                <p className="text-sm text-foreground italic mb-4">"{t.quote}"</p>
                <div><p className="text-sm font-semibold text-foreground">{t.couple}</p><p className="text-xs text-muted-foreground">{t.level}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-hero-gradient text-center">
        <div className="container mx-auto px-6">
          <div className="text-6xl mb-6">🌿</div>
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Ready to Grow Together?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Join thousands of couples building stronger, more joyful relationships with Ivy Connect.</p>
          <Button size="lg" className="bg-white text-rose-600 hover:bg-white/90 px-10 py-6 text-base font-semibold rounded-xl shadow-xl" onClick={() => window.location.href = getLoginUrl()}>
            Start Free — No Credit Card Needed <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="text-xl">🌿</span><span className="font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Ivy Connect</span></div>
          <p className="text-sm text-muted-foreground">© 2026 Ivy Connect. Made with 💕 for couples everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
