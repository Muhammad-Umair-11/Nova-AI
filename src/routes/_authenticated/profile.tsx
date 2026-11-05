import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — NOVA AI" }, { name: "description", content: "Manage your NOVA AI profile." }, { property: "og:title", content: "Profile — NOVA AI" }, { property: "og:description", content: "Manage your NOVA AI profile." }] }),
  component: Profile,
});

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => (await supabase.from("profiles").select("full_name, avatar_url, created_at").eq("id", user.id).maybeSingle()).data,
  });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setName(profile?.full_name ?? ""); setAvatar(profile?.avatar_url ?? ""); }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 80) { toast.error("Name is too long."); return; }
    if (avatar && !/^https:\/\/\S+$/.test(avatar)) { toast.error("Photo link must start with https://"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name.trim() || null, avatar_url: avatar || null, updated_at: new Date().toISOString() });
    await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) { toast.error("Couldn't save your profile."); return; }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
  };

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">How you appear in NOVA AI.</p>
      <form onSubmit={save} className="mt-8 space-y-5 rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          {avatar ? <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">{(name || user.email || "?").slice(0, 1).toUpperCase()}</span>}
          <div><p className="font-medium">{name || "Unnamed"}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
        </div>
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="avatar">Photo link</Label><Input id="avatar" placeholder="https://…" value={avatar} onChange={(e) => setAvatar(e.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
        {profile?.created_at && <p className="text-xs text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </form>
    </div>
  );
}
