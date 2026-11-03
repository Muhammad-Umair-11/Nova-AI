import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, SocialButtons } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";
import { passwordIssues } from "@/lib/validation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — NovaAI" },
      { name: "description", content: "Create your free NovaAI account." },
      { property: "og:title", content: "Create account — NovaAI" },
      { property: "og:description", content: "Start using your AI support assistant." },
    ],
  }),
  component: Register,
});

function Register() {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.name.trim()) er.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email address.";
    const pi = passwordIssues(f.password);
    if (pi.length) er.password = "Password needs " + pi.join(", ") + ".";
    if (f.password !== f.confirm) er.confirm = "Passwords don't match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: window.location.origin + "/login", data: { full_name: f.name.trim() } },
    });
    setLoading(false);
    if (error) return setErrors({ form: error.message });
    setSent(true);
  };

  if (sent)
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${f.email}.`} footer={<Link to="/login" className="font-medium text-primary">Back to log in</Link>}>
        <div className="flex items-center gap-3 rounded-lg border bg-primary-soft p-4 text-sm"><MailCheck className="h-5 w-5 text-primary" />Click the link to activate your account, then log in.</div>
      </AuthShell>
    );

  const field = (k: keyof typeof f, label: string, type = "text", ac?: string) => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} autoComplete={ac} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthShell title="Create your account" subtitle="Start supporting customers with NovaAI." footer={<>Already have an account? <Link to="/login" className="font-medium text-primary">Log in</Link></>}>
      <SocialButtons />
      <form onSubmit={submit} className="space-y-4" noValidate>
        {field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", "new-password")}
        {field("confirm", "Confirm password", "password", "new-password")}
        {errors.form && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />}Create account</Button>
      </form>
    </AuthShell>
  );
}
