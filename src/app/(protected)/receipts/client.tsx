"use client";

import { useState } from "react";
import { toast } from "sonner";
import { decideReceipt } from "./actions";
import type { Receipt } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReceiptWithUrl = Receipt & { signedUrl: string | null };

const STATUS_PILL: Record<string, string> = {
  pending:  "bg-amber-400/15 text-amber-400",
  approved: "bg-emerald-400/15 text-emerald-400",
  rejected: "bg-rose-400/15 text-rose-400",
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
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Receipts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pending > 0 ? `${pending} pending approval · ` : ""}
          £{totalApproved.toFixed(2)} total approved
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all",
              filter === f
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
            {f === "pending" && pending > 0 && (
              <span className={cn("ml-1.5 text-xs px-1.5 py-px rounded-full font-bold",
                filter === f ? "bg-white/20" : "bg-amber-400/15 text-amber-400"
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
          <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <p className="font-bold text-foreground">No receipts</p>
          <p className="text-sm text-muted-foreground mt-1">Receipts submitted by operatives will appear here.</p>
        </div>
      )}

      {/* Receipts grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Image */}
            {r.signedUrl ? (
              <button
                className="w-full aspect-video bg-secondary overflow-hidden relative"
                onClick={() => setPreview(r.signedUrl)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.signedUrl} alt="Receipt" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </button>
            ) : (
              <div className="w-full aspect-video bg-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl text-foreground">
                  {r.amount != null ? `£${r.amount.toFixed(2)}` : "£—"}
                </span>
                <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold capitalize", STATUS_PILL[r.status])}>
                  {r.status}
                </span>
              </div>
              {r.description && (
                <p className="text-sm text-muted-foreground">{r.description}</p>
              )}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>By: {r.operative_name ?? "Unknown"}</p>
                <p>Purchase date: {fmtDate(r.purchase_date)}</p>
                <p>Submitted: {fmtDate(r.created_at)}</p>
              </div>

              {r.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => decide(r.id, "approved")}
                    disabled={deciding === r.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, "rejected")}
                    disabled={deciding === r.id}
                    className="flex-1 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-sm font-bold rounded-lg transition-colors disabled:opacity-40"
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