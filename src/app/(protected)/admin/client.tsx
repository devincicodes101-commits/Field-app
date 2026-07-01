"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_PILL: Record<string, string> = {
  admin:      "bg-purple-100 text-purple-700",
  office:     "bg-indigo-100 text-indigo-700",
  contractor: "bg-amber-100 text-amber-700",
  operative:  "bg-sky-100 text-sky-700",
  telesales:  "bg-rose-100 text-rose-700",
};

const ALL_ROLES = ["admin", "office", "contractor", "operative", "telesales"] as const;
type Role = (typeof ALL_ROLES)[number];

export function AdminClient({ users }: { users: Profile[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function changeRole(userId: string, newRole: Role) {
    setUpdating(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    router.refresh();
  }

  const counts = ALL_ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
      </div>

      {/* Role summary pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map(r => (
          <div key={r} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", ROLE_PILL[r])}>
            <span className="capitalize">{r}</span>
            <span className="font-black">{counts[r]}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{u.email}</td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value as Role)}
                      disabled={updating === u.id}
                      className={cn(
                        "border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer",
                        ROLE_PILL[u.role] ?? "bg-slate-100 text-slate-600"
                      )}
                    >
                      {ALL_ROLES.map(r => (
                        <option key={r} value={r} className="bg-white text-slate-900 font-normal">
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}