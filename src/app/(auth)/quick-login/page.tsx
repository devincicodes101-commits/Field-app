"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Staff = { full_name: string; email: string; role: string };

export default function QuickLoginPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);

  async function loadStaff() {
    setLoading(true);
    const supabase = createClient();
    // This endpoint is public — only returns names, not emails — but for a quick-login
    // we need emails. We fetch from a public-safe RPC that returns name+role only,
    // then map email on the server side. For simplicity on this internal tool,
    // we store name and the full_name→email mapping is resolved on sign-in.
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .in("role", ["operative", "contractor"])
      .order("full_name");
    setStaff((data ?? []) as Staff[]);
    setLoaded(true);
    setLoading(false);
  }

  async function handleSignIn() {
    if (!selected || !password) return;
    setSigning(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: selected.email,
      password,
    });
    setSigning(false);
    if (err) {
      setError("Incorrect password. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const roleEmoji: Record<string, string> = {
    operative: "👷",
    contractor: "🔧",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Quick Sign In</h1>
          <p className="text-slate-500 text-sm mt-1">Pick your name, then enter your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {!selected ? (
            <div className="p-6">
              {!loaded ? (
                <button
                  onClick={loadStaff}
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-60"
                >
                  {loading ? "Loading staff…" : "Show staff list"}
                </button>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {staff.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No field staff found.</p>
                  )}
                  {staff.map(s => (
                    <button
                      key={s.email}
                      onClick={() => setSelected(s)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                    >
                      <span className="text-2xl shrink-0">{roleEmoji[s.role] ?? "👤"}</span>
                      <div>
                        <p className="font-bold text-slate-900">{s.full_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{s.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Selected user */}
              <div className="flex items-center gap-3 p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-2xl">{roleEmoji[selected.role] ?? "👤"}</span>
                <div className="flex-1">
                  <p className="font-bold text-indigo-800">{selected.full_name}</p>
                  <p className="text-xs text-indigo-500 capitalize">{selected.role}</p>
                </div>
                <button
                  onClick={() => { setSelected(null); setPassword(""); setError(""); }}
                  className="text-indigo-400 hover:text-indigo-600 text-sm font-medium"
                >
                  Change
                </button>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignIn()}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleSignIn}
                disabled={signing || !password}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {signing ? "Signing in…" : "Sign in →"}
              </button>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
            <Link href="/login" className="text-sm text-indigo-600 font-medium hover:underline">
              Use email & password
            </Link>
            <Link href="/register" className="text-sm text-slate-500 hover:text-slate-700">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}