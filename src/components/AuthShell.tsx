import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-end">
        <div className="grid-fade pointer-events-none absolute inset-0 opacity-20" />
        <blockquote className="relative max-w-md">
          <p className="font-display text-2xl leading-snug">"NovaAI answers the questions our team used to spend hours on — instantly, and in our tone."</p>
          <footer className="mt-4 text-sm opacity-60">Example customer quote</footer>
        </blockquote>
      </div>
    </div>
  );
}

export function SocialButtons() {
  const go = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/login" });
    if (r.error) toast.error(r.error.message ?? "Sign-in failed");
  };
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={() => go("google")}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c6.93 0 9.5-4.87 9.5-7.4 0-.5-.05-.88-.15-1.25z"/></svg>
        Continue with Google
      </Button>
      <button type="button" className="lovable-auth-button w-full" onClick={() => go("lovable")}>Continue with Lovable</button>
      <div className="flex items-center gap-3 py-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    </div>
  );
}
