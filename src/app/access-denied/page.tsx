import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Your account doesn't have access to this area. Contact your administrator if you think this is a mistake.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}