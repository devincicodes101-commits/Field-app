"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M4.929 4.929l14.142 14.142M9.172 9.172A4 4 0 008 12c0 .94.325 1.8.86 2.476" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">You&apos;re offline</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-7">
          No internet connection detected. Your work is saved and will sync when you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg shadow-[0_0_20px_oklch(0.56_0.24_266/0.4)] transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}