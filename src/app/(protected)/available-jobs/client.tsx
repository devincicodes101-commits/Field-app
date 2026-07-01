"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { selfAssignJob } from "./actions";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmtDate(d: string | null) {
  if (!d) return "TBC";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    ` · ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function AvailableJobsClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [claiming, setClaiming] = useState<string | null>(null);

  async function claim(jobId: string) {
    setClaiming(jobId);
    const result = await selfAssignJob(jobId);
    setClaiming(null);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Job claimed! Check your diary.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Available jobs</h1>
        <p className="text-slate-500 text-sm mt-1">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} available to claim · Earn 10% commission
        </p>
      </div>

      {/* Commission banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 p-4 flex items-center gap-4 shadow-md text-white">
        <div className="text-3xl">💰</div>
        <div>
          <p className="font-bold">Earn 10% commission</p>
          <p className="text-sm text-amber-100">Claim a job to add it to your diary and earn 10% of the job value.</p>
        </div>
      </div>

      {/* Empty */}
      {!jobs.length && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="font-bold text-slate-700">No available jobs right now</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon — new jobs are posted regularly.</p>
        </div>
      )}

      {/* Job cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => {
          const commission = job.total_value ? job.total_value * 0.1 : null;
          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Amber accent */}
              <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-300" />
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-[15px]">{job.title}</h3>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">📍 {job.address}</p>
                  <p className="flex items-center gap-1.5">📅 {fmtDate(job.scheduled_date)}</p>
                  {job.client_name && (
                    <p className="flex items-center gap-1.5">👤 {job.client_name}</p>
                  )}
                </div>
                {/* Financials */}
                {job.total_value && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job value</p>
                      <p className="font-black text-slate-800 text-base mt-0.5">£{job.total_value.toFixed(0)}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5 text-center">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Your cut</p>
                      <p className="font-black text-amber-700 text-base mt-0.5">
                        £{commission!.toFixed(0)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => claim(job.id)}
                  disabled={claiming === job.id}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-bold transition-all",
                    claiming === job.id
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  )}
                >
                  {claiming === job.id ? "Claiming…" : "Claim this job"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}