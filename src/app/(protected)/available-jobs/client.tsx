"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { placeBid, selfAssignJob } from "./actions";
import type { Job, JobBid } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmtDate(d: string | null) {
  if (!d) return "TBC";
  const dt = new Date(d);
  return (
    dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    ` · ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => {
      setSecs((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secs]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 60;

  if (secs === 0) return <span className="text-xs font-bold text-rose-500">Auction ended</span>;

  return (
    <span className={cn("text-xs font-black tabular-nums", urgent ? "text-rose-500" : "text-amber-500")}>
      {m}:{String(s).padStart(2, "0")} left
    </span>
  );
}

function BidPanel({
  job,
  bids,
  currentUserId,
}: {
  job: Job;
  bids: JobBid[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [placing, setPlacing] = useState(false);

  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
  const topBid = sortedBids[0] ?? null;
  const myBid = sortedBids.find((b) => b.contractor_id === currentUserId) ?? null;
  const isEnded = job.auction_ends_at ? new Date(job.auction_ends_at) <= new Date() : false;
  const floor = topBid ? topBid.amount : (job.auction_start_bid ?? 0);

  async function handleBid() {
    const num = Number(amount);
    if (!num || num <= 0) { toast.error("Enter a valid bid amount"); return; }
    setPlacing(true);
    const result = await placeBid(job.id, num);
    setPlacing(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(`Bid of £${num.toFixed(2)} placed!`);
      setAmount("");
      router.refresh();
    }
  }

  return (
    <div className="border-t border-slate-100 p-4 space-y-3">
      {/* Current bid */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current highest bid</p>
          <p className="font-black text-slate-800 text-lg">
            £{topBid ? topBid.amount.toFixed(0) : (job.auction_start_bid?.toFixed(0) ?? "—")}
          </p>
          {topBid && <p className="text-[10px] text-slate-400">{topBid.contractor_name}</p>}
        </div>
        {job.auction_ends_at && <Countdown endsAt={job.auction_ends_at} />}
      </div>

      {myBid && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-600 font-semibold">
          Your current bid: £{myBid.amount.toFixed(2)}
        </div>
      )}

      {!isEnded ? (
        <div className="flex gap-1.5">
          <input
            type="number"
            min={floor + 1}
            step={1}
            placeholder={`Above £${floor.toFixed(0)}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleBid}
            disabled={placing}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              placing
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
            )}
          >
            {placing ? "Placing…" : "Bid"}
          </button>
        </div>
      ) : (
        <p className="text-xs text-rose-500 font-semibold">
          Auction closed.{" "}
          {sortedBids[0]
            ? `Winner: ${sortedBids[0].contractor_name} at £${sortedBids[0].amount.toFixed(2)}`
            : "No bids were placed."}
        </p>
      )}

      {/* Bid history */}
      {sortedBids.length > 1 && (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer select-none">
            {sortedBids.length} bids placed
          </summary>
          <ul className="mt-1 space-y-0.5 pl-2">
            {sortedBids.map((b) => (
              <li key={b.id}>
                £{b.amount.toFixed(2)} — {b.contractor_name}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function TakeJobPanel({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [taking, setTaking] = useState(false);

  async function handle() {
    setTaking(true);
    const result = await selfAssignJob(jobId);
    setTaking(false);
    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Job taken — check your diary!");
      router.refresh();
    }
  }

  return (
    <div className="border-t border-slate-100 p-4">
      <button
        onClick={handle}
        disabled={taking}
        className={cn(
          "w-full py-2.5 rounded-lg text-sm font-bold transition-all",
          taking
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
        )}
      >
        {taking ? "Taking job…" : "Take this job"}
      </button>
    </div>
  );
}

export function AvailableJobsClient({
  jobs,
  bidsByJob,
  currentUserId,
  userRole,
}: {
  jobs: Job[];
  bidsByJob: Record<string, JobBid[]>;
  currentUserId: string;
  userRole: string;
}) {
  const isOperative = userRole === "operative";
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Available jobs</h1>
        <p className="text-slate-500 text-sm mt-1">
          {jobs.length} auction job{jobs.length !== 1 ? "s" : ""} open for bidding
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-4 flex items-center gap-4 shadow-md text-white">
        <div className="text-3xl">{isOperative ? "✋" : "🏆"}</div>
        <div>
          <p className="font-bold">{isOperative ? "Self-assign open jobs" : "Place the highest bid to win"}</p>
          <p className="text-sm text-indigo-100">
            {isOperative
              ? "Jobs open for auction in your area appear here. Click Take this job to assign it to yourself."
              : "Each auction runs for 5 minutes. The highest bidder wins the job and gets paid their bid amount."}
          </p>
        </div>
      </div>

      {/* Empty */}
      {!jobs.length && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-bold text-slate-700">No auction jobs right now</p>
          <p className="text-sm text-slate-400 mt-1">
            Jobs in your coverage area will appear here when the office opens an auction.
          </p>
        </div>
      )}

      {/* Job cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const bids = bidsByJob[job.id] ?? [];
          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-[15px]">{job.title}</h3>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">📍 {job.address}</p>
                  <p className="flex items-center gap-1.5">📅 {fmtDate(job.scheduled_date)}</p>
                  {job.client_name && (
                    <p className="flex items-center gap-1.5">👤 {job.client_name}</p>
                  )}
                </div>
                {job.total_value && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full job value</p>
                    <p className="font-black text-slate-800 text-base mt-0.5">
                      £{job.total_value.toFixed(0)}
                    </p>
                  </div>
                )}
              </div>
              {isOperative
                ? <TakeJobPanel jobId={job.id} />
                : <BidPanel job={job} bids={bids} currentUserId={currentUserId} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
