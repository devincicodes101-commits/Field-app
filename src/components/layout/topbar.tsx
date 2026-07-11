"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-bell";

export function Topbar({ profile, notificationsBell }: { profile: Profile; notificationsBell?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const links =
    profile.role === "office"
      ? [
          { href: "/dashboard",      label: "Jobs" },
          { href: "/contractors",    label: "Contractors" },
          { href: "/receipts",       label: "Receipts" },
          { href: "/route-planning", label: "Route" },
          { href: "/tracking",       label: "Tracking" },
          { href: "/leaderboard",    label: "Leaderboard" },
        ]
      : profile.role === "admin"
        ? [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/admin",     label: "Admin" },
          ]
        : [
            { href: "/dashboard",      label: "My diary" },
            { href: "/available-jobs", label: "Available" },
            { href: "/attendance",     label: "Attendance" },
            { href: "/tracking",       label: "Tracking" },
            { href: "/leaderboard",    label: "Leaderboard" },
            { href: "/notifications",  label: "Notifications" },
          ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    office:     "Office",
    contractor: "Contractor",
    operative:  "Operative",
    admin:      "Admin",
    telesales:  "Telesales",
  };

  /* role badge color */
  const roleBadge: Record<string, string> = {
    office:     "bg-primary/15 text-primary",
    contractor: "bg-amber-400/15 text-amber-400",
    operative:  "bg-emerald-400/15 text-emerald-400",
    admin:      "bg-purple-400/15 text-purple-400",
    telesales:  "bg-rose-400/15 text-rose-400",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">

        {/* Brand */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_16px_oklch(0.56_0.24_266/0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-foreground text-[15px] tracking-tight hidden sm:block">
              Field Service
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-stretch h-14 gap-0.5">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center px-3.5 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 inset-x-3.5 h-[2px] bg-primary rounded-t shadow-[0_0_8px_oklch(0.56_0.24_266/0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold text-foreground leading-tight">
              {profile.full_name || profile.email}
            </span>
            <span className={cn(
              "text-[11px] font-semibold px-2 py-px rounded-full leading-tight",
              roleBadge[profile.role] ?? "bg-muted text-muted-foreground"
            )}>
              {roleLabel[profile.role] ?? profile.role}
            </span>
          </div>
          {notificationsBell}
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}