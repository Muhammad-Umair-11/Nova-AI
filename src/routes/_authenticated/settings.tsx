import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { passwordIssues } from "@/lib/validation";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — NOVA AI" }, { name: "description", content: "Appearance, password and data settings." }, { property: "og:title", content: "Settings — NOVA AI" }, { property: "og:description", content: "Appearance, password and data settings." }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [p, setP] = useState("");
  const [c, setC] = useState("");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pi = passwordIssues(p);
    if (pi.length) return toast.error("Password needs " + pi.join(", ") + ".");
    if (p !== c) return toast.error("Passwords don't match.");
    const { error } = await supabase.auth.updateUser({ password: p });
    if (error) return toast.error(error.message);
    setP(""); setC("");
    toast.success("Password updated");
  };

  const clearHistory = async () => {
    const { error } = await supabase.from("conversations").delete().eq("user_id", user.id);
    if (error) return toast.error("Couldn't delete your conversations.");
    toast.success("All conversations deleted");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-10">
      <div><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage how NOVA AI works for you.</p></div>
      <section className="flex items-center justify-between rounded-xl border bg-card p-6 shadow-card">
        <div><h2 className="font-semibold">Dark mode</h2><p className="text-sm text-muted-foreground">Easier on the eyes at night.</p></div>
        <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} aria-label="Dark mode" />
      </section>
      <form onSubmit={changePassword} className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Change password</h2>
        <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="cp">Confirm password</Label><Input id="cp" type="password" value={c} onChange={(e) => setC(e.target.value)} /></div>
        <Button type="submit">Update password</Button>
      </form>
      <section className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="font-semibold text-destructive">Delete all conversations</h2>
        <p className="mt-1 text-sm text-muted-foreground">This permanently removes your entire chat history.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive" className="mt-4">Delete history</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete all conversations?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={clearHistory}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
