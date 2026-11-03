import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, Pencil, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat — NovaAI" }, { name: "description", content: "Chat with NovaAI." }, { property: "og:title", content: "Chat — NovaAI" }, { property: "og:description", content: "Chat with NovaAI." }] }),
  component: ChatLayout,
});

const conversationsKey = ["conversations"];

function ChatLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const { data: convs = [] } = useQuery({
    queryKey: conversationsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("id, title, updated_at, is_favorite").eq("is_archived", false).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; patch: { title?: string; is_favorite?: boolean } }) => {
      const { error } = await supabase.from("conversations").update(v.patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: conversationsKey }),
    onError: () => toast.error("Couldn't update conversation"),
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete conversation");
    qc.invalidateQueries({ queryKey: conversationsKey });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (params.id === id) navigate({ to: "/chat" });
    toast.success("Conversation deleted");
  };

  const groups = useMemo(() => {
    const filtered = convs.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
    const today = new Date().toDateString();
    return [
      ["Favorites", filtered.filter((c) => c.is_favorite)],
      ["Today", filtered.filter((c) => !c.is_favorite && new Date(c.updated_at).toDateString() === today)],
      ["Previous", filtered.filter((c) => !c.is_favorite && new Date(c.updated_at).toDateString() !== today)],
    ] as const;
  }, [convs, q]);

  return (
    <div className="flex h-full">
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="space-y-3 p-4">
          <Button className="w-full" asChild><Link to="/chat"><Plus />New chat</Link></Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {convs.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">No conversations yet</p>}
          {groups.map(([label, items]) =>
            items.length ? (
              <div key={label} className="mb-3">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                {items.map((c) => {
                  const active = params.id === c.id;
                  if (editing?.id === c.id)
                    return (
                      <form key={c.id} className="flex items-center gap-1 px-1 py-1" onSubmit={(e) => { e.preventDefault(); const t = editing.title.trim(); if (t) update.mutate({ id: c.id, patch: { title: t } }); setEditing(null); }}>
                        <Input autoFocus value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} onBlur={() => setEditing(null)} className="h-8" />
                        <Button size="icon" variant="ghost" className="h-8 w-8" type="submit" onMouseDown={(e) => e.preventDefault()}><Check /></Button>
                      </form>
                    );
                  return (
                    <div key={c.id} className={cn("group flex items-center rounded-lg pr-1 hover:bg-muted", active && "bg-accent text-accent-foreground")}>
                      <Link to="/chat/$id" params={{ id: c.id }} className="min-w-0 flex-1 truncate px-3 py-2 text-sm">{c.title}</Link>
                      <div className="hidden items-center group-hover:flex">
                        <button aria-label="Favorite" onClick={() => update.mutate({ id: c.id, patch: { is_favorite: !c.is_favorite } })} className="rounded p-1 text-muted-foreground hover:text-foreground"><Star className={cn("h-3.5 w-3.5", c.is_favorite && "fill-current text-primary")} /></button>
                        <button aria-label="Rename" onClick={() => setEditing({ id: c.id, title: c.title })} className="rounded p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button aria-label="Delete" onClick={() => setToDelete(c.id)} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null,
          )}
        </div>
      </aside>
      <section className="min-w-0 flex-1"><Outlet /></section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>All messages in it will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) remove(toDelete); setToDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
