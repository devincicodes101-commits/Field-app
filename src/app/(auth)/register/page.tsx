"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerContractor } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerContractor, null);

  if (state && "success" in state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto shadow-inner">
            <span className="text-3xl">✉️</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Check your email</h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              We&apos;ve sent a confirmation link to your email. Click it to activate your account,
              then complete your contractor profile.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 overflow-hidden text-white"
        style={{ background: "linear-gradient(145deg, #312e81 0%, #4338ca 45%, #6366f1 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner border border-white/20">
              <ClipboardIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Field Service</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Contractor portal
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              Join the platform,<br />
              <span className="text-indigo-200">start getting jobs.</span>
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
              Create your contractor account in seconds and get access to your assigned jobs, messaging, and invoicing.
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="relative z-10 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
            What happens next
          </p>
          {[
            { step: "01", title: "Confirm your email", desc: "Click the link we send after registration" },
            { step: "02", title: "Add company details", desc: "VAT number, bank account, address" },
            { step: "03", title: "Start receiving jobs", desc: "Office assigns jobs directly to you" },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{s.title}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="relative z-10 pt-6 border-t border-white/10">
          <p className="text-xs text-indigo-300">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline underline-offset-2">
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <ClipboardIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Field Service</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create your account
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Contractor sign-up · takes 30 seconds
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-semibold text-slate-700">
                Full name
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <PersonIcon className="w-4 h-4" />
                </div>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  autoComplete="name"
                  placeholder="John Smith"
                  className="pl-9 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email address
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MailIcon className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockIcon className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="pl-9 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Use at least 8 characters</p>
            </div>

            {state && "error" in state && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertIcon className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all mt-2"
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create account →"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2 transition-colors"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            Office and operative accounts are created<br />by your administrator.
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
