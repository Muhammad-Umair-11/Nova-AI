import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — NOVA AI" }, { name: "description", content: "Your starred NOVA AI conversations." }, { property: "og:title", content: "Favorites — NOVA AI" }, { property: "og:description", content: "Your starred NOVA AI conversations." }] }),
  component: Favorites,
});

function Favorites() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["conversations", "favorites"],
    queryFn: async () => (await supabase.from("conversations").select("id, title, updated_at").eq("is_favorite", true).order("updated_at", { ascending: false })).data ?? [],
  });
  const unstar = async (id: string) => {
    await supabase.from("conversations").update({ is_favorite: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  };
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">Conversations you've starred.</p>
      <div className="mt-8 space-y-2">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : data.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No favorites yet. Star a conversation to keep it here.<div className="mt-4"><Button asChild size="sm"><Link to="/chat">Start a chat</Link></Button></div></div>
        ) : data.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
            <Link to="/chat/$id" params={{ id: c.id }} className="min-w-0 flex-1"><p className="truncate font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</p></Link>
            <Button variant="ghost" size="icon" aria-label="Remove from favorites" onClick={() => unstar(c.id)}><Star className="fill-primary text-primary" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
