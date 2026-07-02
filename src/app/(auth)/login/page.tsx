"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithPassword } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginWithPassword, null);

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[420px] flex-col justify-between p-10 bg-slate-900 text-white shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <ClipboardIcon className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Field Service</span>
        </div>

        {/* Middle content */}
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Operations platform
            </p>
            <h1 className="text-3xl font-bold leading-snug text-white">
              Manage every job,<br />start to finish.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              One platform for your office team, contractors, and operatives — from first quote to final invoice.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { title: "Job lifecycle",     desc: "Quote → schedule → complete in one flow" },
              { title: "Digital sign-off",  desc: "Customer signatures and star ratings" },
              { title: "Auto invoicing",    desc: "VAT invoices generated at completion" },
              { title: "Team management",   desc: "Contractors and operatives in sync" },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <CheckIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="text-xs text-slate-500">
          Devinci Codes &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <ClipboardIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-[15px]">Field Service</span>
          </div>

          <div className="mb-7">
            <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-10 bg-white border-slate-300 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10 bg-white border-slate-300 text-sm"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded transition-colors flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            href="/quick-login"
            className="flex items-center justify-center gap-2 w-full py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded text-sm font-medium text-slate-700 transition-colors"
          >
            <UsersIcon className="w-4 h-4 text-slate-500" />
            Quick sign in — pick your name
          </Link>

          <p className="text-center text-sm text-slate-500 mt-5">
            New contractor?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Register here
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-6">
            Office and operative accounts are created by your manager.
          </p>
        </div>
      </div>
    </div>
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}