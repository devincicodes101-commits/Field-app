"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">You're offline</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          No internet connection. Check your connection and try again — your work is safe and will sync when you're back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
}