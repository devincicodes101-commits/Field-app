"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M4.929 4.929l14.142 14.142M9.172 9.172A4 4 0 008 12c0 .94.325 1.8.86 2.476" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">You&apos;re offline</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          No internet connection detected. Your work is saved and will sync when you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}