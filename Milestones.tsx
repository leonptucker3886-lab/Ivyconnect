import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, Plus, Calendar, Clock } from "lucide-react";

function getDaysUntil(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const next = new Date(date);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const EMOJIS = ["⭐", "💍", "💕", "🎂", "🏠", "✈️", "🎉", "💑", "🌹", "🎊"];

export default function Milestones() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", emoji: "⭐", description: "" });
  const { data: milestones, refetch } = trpc.milestones.list.useQuery();
  const createMut = trpc.milestones.create.useMutation({
    onSuccess: () => { toast.success("Milestone added! 🌟"); setOpen(false); setForm({ title: "", date: "", emoji: "⭐", description: "" }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "Playfair Display,serif" }}>Milestones</h1>
            <p className="text-sm text-muted-foreground">Your special moments together</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0">
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a Milestone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Our First Date" className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="The day we met..." className="mt-1" />
              </div>
              <div>
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} className={"text-xl p-1.5 rounded-lg border-2 transition-all " + (form.emoji === e ? "border-rose-400 bg-rose-50" : "border-transparent hover:border-muted")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0" onClick={() => createMut.mutate(form)} disabled={!form.title.trim() || !form.date || createMut.isPending}>
                Add Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!milestones || milestones.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Star className="w-8 h-8 text-amber-200 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No milestones yet. Add your first special moment!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((m: any) => {
            const days = getDaysUntil(m.date);
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{m.emoji || "⭐"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{m.title}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-rose-600">
                          <Clock className="w-3 h-3" />{days === 0 ? "Today! 🎉" : `${days} days`}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
