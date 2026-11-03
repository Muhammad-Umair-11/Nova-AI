import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — NovaAI" },
      { name: "description", content: "Get a link to reset your NovaAI password." },
      { property: "og:title", content: "Reset password — NovaAI" },
      { property: "og:description", content: "Recover access to your NovaAI account." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
    setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setErr(error.message);
    else setMsg("If an account exists for that email, a reset link is on its way.");
  };
  return (
    <AuthShell title="Forgot your password?" subtitle="We'll email you a link to reset it." footer={<Link to="/login" className="font-medium text-primary">Back to log in</Link>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {msg && <p className="rounded-md bg-primary-soft px-3 py-2 text-sm">{msg}</p>}
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
    </AuthShell>
  );
}
