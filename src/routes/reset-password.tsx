import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordIssues } from "@/lib/validation";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — NovaAI" },
      { name: "description", content: "Choose a new password for your NovaAI account." },
      { property: "og:title", content: "Set new password — NovaAI" },
      { property: "og:description", content: "Choose a new NovaAI password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pi = passwordIssues(p);
    if (pi.length) return setErr("Password needs " + pi.join(", ") + ".");
    if (p !== c) return setErr("Passwords don't match.");
    const { error } = await supabase.auth.updateUser({ password: p });
    if (error) return setErr(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };
  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2"><Label htmlFor="p">New password</Label><Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="c">Confirm password</Label><Input id="c" type="password" value={c} onChange={(e) => setC(e.target.value)} /></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </AuthShell>
  );
}
