"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Topbar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const links =
    profile.role === "office"
      ? [
          { href: "/dashboard", label: "Jobs" },
          { href: "/contractors", label: "Contractors" },
        ]
      : [{ href: "/dashboard", label: "My diary" }];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    office: "Office",
    contractor: "Contractor",
    operative: "Operative",
  };

  const rolePillColor: Record<string, string> = {
    office: "bg-indigo-100 text-indigo-700",
    contractor: "bg-amber-100 text-amber-700",
    operative: "bg-sky-100 text-sky-700",
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 lg:px-6 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-[15px] tracking-tight hidden sm:block">
            Field Service
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right side: user info + sign out */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-800 leading-tight">
            {profile.full_name || profile.email}
          </span>
          <span
            className={cn(
              "text-xs px-1.5 py-px rounded font-medium",
              rolePillColor[profile.role] ?? "bg-slate-100 text-slate-600"
            )}
          >
            {roleLabel[profile.role] ?? profile.role}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}