import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { LayoutDashboard, MessageSquarePlus, MessagesSquare, LogOut, Star, BarChart3, User as UserIcon, Settings, ShieldCheck, Moon, Sun } from "lucide-react";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } as never });
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const name = (user.user_metadata?.["full_name"] as string) || user.email || "You";

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  const { data: isAdmin } = useIsAdmin(user.id);
  const { theme, toggle } = useTheme();
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: path === "/dashboard" },
    { to: "/chat", label: "New chat", icon: MessageSquarePlus, active: path === "/chat" },
    { to: "/chat", label: "Conversations", icon: MessagesSquare, active: path.startsWith("/chat/") },
    { to: "/favorites", label: "Favorites", icon: Star, active: path === "/favorites" },
    { to: "/analytics", label: "Analytics", icon: BarChart3, active: path === "/analytics" },
    { to: "/profile", label: "Profile", icon: UserIcon, active: path === "/profile" },
    { to: "/settings", label: "Settings", icon: Settings, active: path === "/settings" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck, active: path === "/admin" }] as const : []),
  ] as const;

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-5"><Link to="/dashboard"><Logo light /></Link></div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <Link key={n.label} to={n.to} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", n.active && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <n.icon className={cn("h-4 w-4", n.active && "text-sidebar-primary")} />{n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">{name.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-sidebar-accent-foreground">{name}</p>
              <p className="truncate text-xs opacity-60">{user.email}</p>
            </div>
          </div>
          <button onClick={toggle} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Link to="/dashboard"><Logo /></Link>
          <div className="flex gap-3 text-sm">
            <Link to="/dashboard">Dashboard</Link><Link to="/chat">Chat</Link><Link to="/settings">Settings</Link>
            <button onClick={signOut}>Log out</button>
          </div>
        </div>
        <main className="min-h-0 flex-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
