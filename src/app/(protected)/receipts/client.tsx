"use client";

import { useState } from "react";
import { toast } from "sonner";
import { decideReceipt } from "./actions";
import type { Receipt } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReceiptWithUrl = Receipt & { signedUrl: string | null };

const STATUS_PILL: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export function ReceiptsClient({ receipts: initial }: { receipts: ReceiptWithUrl[] }) {
  const [receipts, setReceipts] = useState(initial);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [preview, setPreview] = useState<string | null>(null);

  const visible = filter === "all" ? receipts : receipts.filter(r => r.status === filter);
  const pending = receipts.filter(r => r.status === "pending").length;

  async function decide(id: string, decision: "approved" | "rejected") {
    setDeciding(id);
    const result = await decideReceipt(id, decision);
    setDeciding(null);
    if ("error" in result) { toast.error(result.error); return; }
    setReceipts(prev =>
      prev.map(r => r.id === id ? { ...r, status: decision } : r)
    );
    toast.success(decision === "approved" ? "Receipt approved" : "Receipt rejected");
  }

  function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  const totalApproved = receipts
    .filter(r => r.status === "approved")
    .reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Receipts</h1>
          <p className="text-slate-500 text-sm mt-1">
            {pending > 0 ? `${pending} pending approval · ` : ""}
            £{totalApproved.toFixed(2)} total approved
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all",
              filter === f ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            )}
          >
            {f}
            {f === "pending" && pending > 0 && (
              <span className={cn("ml-1.5 text-xs px-1.5 py-px rounded-full font-bold",
                filter === f ? "bg-white/20" : "bg-amber-100 text-amber-700"
              )}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty */}
      {!visible.length && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="font-bold text-slate-700">No receipts</p>
          <p className="text-sm text-slate-400 mt-1">Receipts submitted by operatives will appear here.</p>
        </div>
      )}

      {/* Receipts grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Receipt image */}
            {r.signedUrl ? (
              <button
                className="w-full aspect-video bg-slate-100 overflow-hidden relative"
                onClick={() => setPreview(r.signedUrl)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.signedUrl} alt="Receipt" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">View</span>
                </div>
              </button>
            ) : (
              <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-300 text-4xl">
                🧾
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-xl text-slate-900">
                  {r.amount != null ? `£${r.amount.toFixed(2)}` : "£—"}
                </span>
                <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold capitalize", STATUS_PILL[r.status])}>
                  {r.status}
                </span>
              </div>
              {r.description && (
                <p className="text-sm text-slate-600">{r.description}</p>
              )}
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>By: {r.operative_name ?? "Unknown"}</p>
                <p>Purchase date: {fmtDate(r.purchase_date)}</p>
                <p>Submitted: {fmtDate(r.created_at)}</p>
              </div>

              {r.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => decide(r.id, "approved")}
                    disabled={deciding === r.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, "rejected")}
                    disabled={deciding === r.id}
                    className="flex-1 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Receipt" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}