import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/use-is-admin";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — NOVA AI" }, { name: "description", content: "Manage NOVA AI users and conversations." }, { property: "og:title", content: "Admin — NOVA AI" }, { property: "og:description", content: "Manage NOVA AI users and conversations." }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { user } = Route.useRouteContext();
  const { data: isAdmin, isLoading } = useIsAdmin(user.id);
  if (isLoading) return <p className="p-10 text-sm text-muted-foreground">Loading…</p>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md p-10 text-center"><h1 className="text-xl font-semibold">Admins only</h1><p className="mt-2 text-sm text-muted-foreground">You don't have access to this page.</p><Button asChild className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button></div>
  );
  return <AdminPanel />;
}

function AdminPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const [{ data: profiles }, { data: convs }, { count: msgCount }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("conversations").select("id, title, user_id, updated_at").order("updated_at", { ascending: false }).limit(50),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      return { profiles: profiles ?? [], convs: convs ?? [], msgCount: msgCount ?? 0, admins: new Set((roles ?? []).map((r) => r.user_id)) };
    },
  });
  const profiles = data?.profiles ?? [];
  const nameOf = (id: string) => { const p = profiles.find((x) => x.id === id); return p?.full_name || p?.email || "Unknown"; };
  const del = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete");
    toast.success("Conversation deleted");
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <div><h1 className="text-2xl font-semibold">Admin</h1><p className="mt-1 text-sm text-muted-foreground">Everyone using NOVA AI.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Users", profiles.length], ["Conversations", data?.convs.length ?? 0], ["Messages", data?.msgCount ?? 0]].map(([l, v]) => (
          <div key={l} className="rounded-xl border bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-2 font-display text-3xl font-semibold">{v}</p></div>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border bg-card shadow-card">
        <h2 className="border-b px-5 py-3 font-semibold">Users</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2 font-medium">Name</th><th className="px-5 py-2 font-medium">Email</th><th className="px-5 py-2 font-medium">Joined</th><th className="px-5 py-2 font-medium">Role</th></tr></thead>
          <tbody>{profiles.map((p) => (
            <tr key={p.id} className="border-t"><td className="px-5 py-2">{p.full_name || "—"}</td><td className="px-5 py-2">{p.email}</td><td className="px-5 py-2">{new Date(p.created_at).toLocaleDateString()}</td><td className="px-5 py-2">{data?.admins.has(p.id) ? <span className="inline-flex items-center gap-1 text-primary"><ShieldCheck className="h-3.5 w-3.5" />Admin</span> : "User"}</td></tr>
          ))}</tbody>
        </table>
      </section>
      <section className="overflow-hidden rounded-xl border bg-card shadow-card">
        <h2 className="border-b px-5 py-3 font-semibold">Recent conversations</h2>
        <ul>{(data?.convs ?? []).map((c) => (
          <li key={c.id} className="flex items-center gap-3 border-t px-5 py-2 text-sm first:border-t-0">
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{c.title}</p><p className="text-xs text-muted-foreground">{nameOf(c.user_id)} · {new Date(c.updated_at).toLocaleString()}</p></div>
            <Button variant="ghost" size="icon" aria-label="Delete conversation" onClick={() => del(c.id)}><Trash2 /></Button>
          </li>
        ))}</ul>
      </section>
    </div>
  );
}
