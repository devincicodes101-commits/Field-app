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

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 lg:px-6">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Field Service App</span>
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground",
                pathname === link.href && "text-foreground font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{profile.full_name || profile.email}</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
