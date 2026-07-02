"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithPassword } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginWithPassword, null);

  return (
    <div className="min-h-screen flex bg-background">

      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        {/* Glow orb */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_24px_oklch(0.56_0.24_266/0.6)]">
            <ClipboardIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-[16px] tracking-tight">Field Service</span>
        </div>

        {/* Main copy */}
        <div className="relative space-y-6">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
            Operations platform
          </p>
          <h1 className="text-[42px] font-extrabold leading-[1.1] text-foreground">
            Manage every job,<br />
            <span className="text-primary">start to finish.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
            One platform for your office team, contractors, and operatives — from first quote to final invoice.
          </p>

          {/* Feature list */}
          <ul className="space-y-4 pt-2">
            {[
              { title: "Job lifecycle",    desc: "Quote → schedule → complete in one flow" },
              { title: "Digital sign-off", desc: "Customer signatures & star ratings" },
              { title: "Auto invoicing",   desc: "VAT invoices generated at job completion" },
              { title: "Live tracking",    desc: "GPS operatives, live status updates" },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <CheckIcon className="w-3 h-3 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Stat strip */}
        <div className="relative flex items-center gap-8 pt-6 border-t border-border">
          {[
            { value: "5", label: "User roles" },
            { value: "VAT", label: "Auto-invoicing" },
            { value: "Live", label: "GPS tracking" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_18px_oklch(0.56_0.24_266/0.5)]">
              <ClipboardIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-[15px]">Field Service</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your workspace</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-11 bg-secondary border-border focus-visible:border-primary focus-visible:ring-primary/20 text-sm placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 bg-secondary border-border focus-visible:border-primary focus-visible:ring-primary/20 text-sm"
              />
            </div>

            {state?.error && (
              <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 rounded-lg px-3.5 py-3">
                <AlertIcon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-bold rounded-lg shadow-[0_0_24px_oklch(0.56_0.24_266/0.4)] hover:shadow-[0_0_32px_oklch(0.56_0.24_266/0.55)] transition-all flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link
            href="/quick-login"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-border hover:border-primary/50 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-semibold text-foreground transition-all"
          >
            <UsersIcon className="w-4 h-4 text-muted-foreground" />
            Quick sign in — pick your name
          </Link>

          <p className="text-center text-sm text-muted-foreground mt-6">
            New contractor?{" "}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Register here
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            Office &amp; operative accounts are created by your manager.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */
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

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
