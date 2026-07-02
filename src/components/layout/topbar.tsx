"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Topbar({ profile }: { profile: Profile }) {
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">

        {/* Brand */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <ClipboardIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-[15px] tracking-tight hidden sm:block">
              Field Service
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-stretch h-14 gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center px-3 text-sm transition-colors",
                    active
                      ? "text-slate-900 font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 inset-x-3 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {profile.full_name || profile.email}
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                {roleLabel[profile.role] ?? profile.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}