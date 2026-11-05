import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/Logo";
import {
  MessageSquareText, History, BarChart3, ShieldCheck, Zap, Users, ArrowRight, Send, Github,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVA AI — AI-Powered Customer Support, Simplified" },
      { name: "description", content: "NOVA AI helps businesses deliver fast, accurate AI-powered customer support with conversation history and analytics." },
      { property: "og:title", content: "NOVA AI — AI-Powered Customer Support, Simplified" },
      { property: "og:description", content: "Your intelligent customer support assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: MessageSquareText, title: "AI-powered conversations", body: "Natural, accurate answers grounded in the full context of each conversation." },
  { icon: History, title: "Conversation history", body: "Every chat is saved securely so you can pick up exactly where you left off." },
  { icon: BarChart3, title: "Smart analytics", body: "Understand volume and engagement with clear, at-a-glance usage insights." },
  { icon: ShieldCheck, title: "Secure authentication", body: "Encrypted sessions and per-user data isolation keep conversations private." },
  { icon: Zap, title: "Fast responses", body: "Replies in seconds, so customers never wait in a queue again." },
  { icon: Users, title: "Admin management", body: "Oversee users and conversations from a dedicated admin workspace." },
];

const steps = [
  ["Create an account", "Sign up in seconds with email or Google."],
  ["Start a conversation", "Ask anything — or pick a suggested prompt."],
  ["NOVA AI processes it", "Your request is handled securely on our servers."],
  ["Get your answer", "Receive a clear, well-formatted response instantly."],
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#stats" className="hover:text-foreground">Product</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
            <Button asChild><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-fade pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-20 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Your intelligent customer support assistant
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] md:text-6xl">
              AI-Powered Customer Support, <span className="text-primary">Simplified.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              NOVA AI gives your customers instant, accurate answers around the clock — with every conversation saved, searchable, and measurable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/register">Get started <ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/login">Explore demo</Link></Button>
            </div>
          </div>
          <ChatPreview />
        </div>
      </section>

      <section id="features" className="border-t bg-card/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold text-primary">Features</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold md:text-4xl">Everything you need to support customers at scale</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">From question to answer in four steps</h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-4">
            {steps.map(([t, b], i) => (
              <li key={t} className="rounded-xl border bg-card p-6">
                <span className="font-display text-sm font-semibold text-primary">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="stats" className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 rounded-2xl bg-ink px-8 py-12 text-ink-foreground md:grid-cols-3">
            {[["10K+", "conversations"], ["99.9%", "uptime target"], ["24/7", "availability"]].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-4xl font-semibold">{n}</div>
                <div className="mt-1 text-sm opacity-70">{l}</div>
              </div>
            ))}
            <p className="text-xs opacity-50 md:col-span-3">Illustrative product figures for demo purposes.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 text-sm md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-muted-foreground">Your intelligent customer support assistant.</p>
          </div>
          {[["Product", ["Features", "How it works"]], ["Company", ["About", "Contact"]], ["Resources", ["Docs", "GitHub"]]].map(([h, items]) => (
            <div key={h as string}>
              <p className="font-semibold">{h}</p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                {(items as string[]).map((i) => <li key={i}>{i === "GitHub" ? <span className="inline-flex items-center gap-1"><Github className="h-3.5 w-3.5" />GitHub</span> : i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-6 text-xs text-muted-foreground">© {new Date().getFullYear()} NOVA AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="rounded-2xl border bg-card shadow-lift">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <LogoMark />
        <div>
          <p className="text-sm font-semibold">NOVA AI Assistant</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-success" />Online</p>
        </div>
      </div>
      <div className="space-y-4 p-5 text-sm">
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-ink-foreground">
          Hi! I was charged twice for my order #4821.
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted px-4 py-3">
          I'm sorry about that. I can see two charges on order <b>#4821</b>. Here's what happens next:
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>The duplicate charge is refunded automatically</li>
            <li>You'll see it within 3–5 business days</li>
          </ul>
        </div>
        <div className="flex gap-1 px-1 py-2">
          {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" style={{ animationDelay: `${i * 150}ms` }} />)}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t p-4">
        <div className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">Ask NOVA AI anything…</div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></span>
      </div>
    </div>
  );
}
