import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — NOVA AI" }, { name: "description", content: "Your NOVA AI usage over time." }, { property: "og:title", content: "Analytics — NOVA AI" }, { property: "og:description", content: "Your NOVA AI usage over time." }] }),
  component: Analytics,
});

function Analytics() {
  const { user } = Route.useRouteContext();
  const since = new Date(Date.now() - 13 * 864e5);
  since.setHours(0, 0, 0, 0);
  const { data } = useQuery({
    queryKey: ["analytics", user.id],
    queryFn: async () => {
      const [{ data: msgs }, { count: convs }, { count: favs }] = await Promise.all([
        supabase.from("messages").select("sender, created_at, feedback").gte("created_at", since.toISOString()),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("is_favorite", true),
      ]);
      return { msgs: msgs ?? [], convs: convs ?? 0, favs: favs ?? 0 };
    },
  });
  const msgs = data?.msgs ?? [];
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 864e5);
    const k = d.toDateString();
    return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), n: msgs.filter((m) => m.sender === "user" && new Date(m.created_at).toDateString() === k).length };
  });
  const max = Math.max(1, ...days.map((d) => d.n));
  const likes = msgs.filter((m) => m.feedback === "like").length;
  const dislikes = msgs.filter((m) => m.feedback === "dislike").length;
  const stats = [
    ["Questions (14 days)", msgs.filter((m) => m.sender === "user").length],
    ["Total conversations", data?.convs ?? 0],
    ["Favorites", data?.favs ?? 0],
    ["Helpful replies", likes + dislikes ? `${Math.round((likes / (likes + dislikes)) * 100)}%` : "—"],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your activity over the last 14 days.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p></div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Questions per day</h2>
        <div className="mt-6 flex h-48 items-end gap-2">
          {days.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">{d.n || ""}</span>
              <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.n / max) * 140}px`, minHeight: 2 }} />
              <span className="hidden text-[10px] text-muted-foreground sm:block">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
