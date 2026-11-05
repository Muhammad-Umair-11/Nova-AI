import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessagesSquare, MessageCircle, Activity, CalendarDays, MessageSquarePlus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NOVA AI" }, { name: "description", content: "Your NOVA AI overview." }, { property: "og:title", content: "Dashboard — NOVA AI" }, { property: "og:description", content: "Your NOVA AI overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const since = new Date(Date.now() - 6 * 864e5);
      since.setHours(0, 0, 0, 0);
      const [convs, msgs, recentMsgs] = await Promise.all([
        supabase.from("conversations").select("id, title, updated_at, is_archived").order("updated_at", { ascending: false }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("created_at, sender").gte("created_at", since.toISOString()),
      ]);
      const list = convs.data ?? [];
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(since.getTime() + i * 864e5);
        return { label: d.toLocaleDateString(undefined, { weekday: "short" }), key: d.toDateString(), count: 0 };
      });
      for (const m of recentMsgs.data ?? []) {
        const d = days.find((x) => x.key === new Date(m.created_at).toDateString());
        if (d && m.sender === "user") d.count++;
      }
      const weekAgo = Date.now() - 7 * 864e5;
      return {
        total: list.length,
        messages: msgs.count ?? 0,
        active: list.filter((c) => !c.is_archived && new Date(c.updated_at).getTime() > weekAgo).length,
        week: days.reduce((a, d) => a + d.count, 0),
        days,
        recent: list.slice(0, 5),
      };
    },
  });

  const name = ((user.user_metadata?.["full_name"] as string) || "").split(" ")[0];
  const max = Math.max(1, ...(data?.days.map((d) => d.count) ?? [1]));
  const stats = [
    { label: "Total conversations", value: data?.total, icon: MessagesSquare },
    { label: "Total messages", value: data?.messages, icon: MessageCircle },
    { label: "Active this week", value: data?.active, icon: Activity },
    { label: "Questions (7 days)", value: data?.week, icon: CalendarDays },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Welcome back{name ? `, ${name}` : ""}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your support assistant.</p>
        </div>
        <Button asChild><Link to="/chat"><MessageSquarePlus />New chat</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-sm text-muted-foreground">{s.label}<s.icon className="h-4 w-4 text-primary" /></div>
            <p className="mt-3 font-display text-3xl font-semibold">{s.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-base font-semibold">Usage — last 7 days</h2>
          <p className="text-xs text-muted-foreground">Questions you asked NOVA AI per day</p>
          <div className="mt-6 flex h-44 items-end gap-3">
            {data?.days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">{d.count || ""}</span>
                <div className="w-full rounded-md bg-primary/85" style={{ height: `${Math.max(4, (d.count / max) * 130)}px` }} />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent conversations</h2>
            <Link to="/chat" className="text-xs font-medium text-primary">View all</Link>
          </div>
          <ul className="mt-4 divide-y">
            {data?.recent.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No conversations yet. Start your first chat.</li>}
            {data?.recent.map((c) => (
              <li key={c.id}>
                <Link to="/chat/$id" params={{ id: c.id }} className="group flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
