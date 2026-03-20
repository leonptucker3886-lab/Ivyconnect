import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageCircle, Send, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoveNotes() {
  const [note, setNote] = useState("");
  const { data: notes, refetch } = trpc.loveNotes.list.useQuery();
  const sendMut = trpc.loveNotes.send.useMutation({
    onSuccess: () => { toast.success("Love note sent! 💕"); setNote(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.loveNotes.delete.useMutation({ onSuccess: () => { toast.success("Note deleted"); refetch(); } });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Playfair Display,serif" }}>Love Notes</h1>
          <p className="text-sm text-muted-foreground">Send heartfelt messages to your partner</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Write something sweet... 💕"
            rows={3}
            className="resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{note.length}/500</span>
            <Button
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0"
              onClick={() => sendMut.mutate({ content: note })}
              disabled={!note.trim() || sendMut.isPending}
            >
              <Send className="w-4 h-4 mr-2" />Send Note
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Notes</h2>
        {!notes || notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="w-8 h-8 text-pink-200 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No notes yet. Send your first love note!</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((n: any) => (
            <Card key={n.id} className={cn("border", n.isMine ? "border-rose-200 bg-rose-50/50" : "border-pink-200 bg-pink-50/50")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className={cn("w-3.5 h-3.5", n.isMine ? "text-rose-500" : "text-pink-500")} />
                      <span className="text-xs font-medium text-muted-foreground">{n.isMine ? "You" : "Your Partner"}</span>
                      <span className="text-xs text-muted-foreground">· {new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{n.content}</p>
                  </div>
                  {n.isMine && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteMut.mutate({ id: n.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
