"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_BORDER: Record<Job["status"], string> = {
  quote_sent: "border-l-sky-400", accepted: "border-l-teal-500",
  scheduled: "border-l-amber-400", in_progress: "border-l-indigo-500",
  completed: "border-l-emerald-500", cancelled: "border-l-rose-400",
};
const STATUS_PILL: Record<Job["status"], string> = {
  quote_sent: "bg-sky-100 text-sky-700", accepted: "bg-teal-100 text-teal-700",
  scheduled: "bg-amber-100 text-amber-700", in_progress: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-rose-100 text-rose-700",
};
const STATUS_DOT: Record<Job["status"], string> = {
  quote_sent: "bg-sky-400", accepted: "bg-teal-500", scheduled: "bg-amber-400",
  in_progress: "bg-indigo-500", completed: "bg-emerald-500", cancelled: "bg-rose-400",
};

function isTodayFn(d: string | null) {
  if (!d) return false;
  const dt = new Date(d), now = new Date();
  return dt.getDate() === now.getDate() && dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
}

function formatSched(d: string | null) {
  if (!d) return "Not scheduled";
  const dt = new Date(d);
  if (isTodayFn(d)) return `Today · ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    ` · ${dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

const TABS = [
  { key: "today",    label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all",      label: "All jobs" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function FieldWorkerTabs({ jobs }: { jobs: Job[] }) {
  const [tab, setTab] = useState<TabKey>("today");

  const todayJobs     = jobs.filter(j => isTodayFn(j.scheduled_date) && j.status !== "completed" && j.status !== "cancelled");
  const upcomingJobs  = jobs.filter(j => {
    if (!j.scheduled_date) return false;
    const d = new Date(j.scheduled_date);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0);
    return d >= tomorrow && j.status !== "completed" && j.status !== "cancelled";
  });
  const allJobs = jobs;

  const counts = { today: todayJobs.length, upcoming: upcomingJobs.length, all: allJobs.length };
  const visible = tab === "today" ? todayJobs : tab === "upcoming" ? upcomingJobs : allJobs;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all",
              tab === t.key
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            {t.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-bold",
              tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Job list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="text-4xl mb-3">
            {tab === "today" ? "☀️" : tab === "upcoming" ? "📅" : "📋"}
          </div>
          <p className="font-bold text-slate-700">
            {tab === "today" ? "No jobs today" : tab === "upcoming" ? "Nothing upcoming" : "No jobs yet"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {tab === "today" ? "Enjoy your day!" : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="group block h-full">
              <div className={cn(
                "bg-white rounded-2xl border border-slate-200 border-l-[5px] h-full flex flex-col",
                "shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200",
                STATUS_BORDER[job.status]
              )}>
                <div className="p-5 flex-1 space-y-3">
                  {isTodayFn(job.scheduled_date) && tab !== "today" && (
                    <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-white/70 animate-pulse" /> Today
                    </span>
                  )}
                  <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_PILL[job.status])}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[job.status])} />
                    {JOB_STATUS_LABELS[job.status]}
                  </div>
                  <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-indigo-700 transition-colors">
                    {job.title}
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">📍 {job.address}</p>
                    <p className={cn("flex items-center gap-1.5", isTodayFn(job.scheduled_date) && "text-indigo-600 font-semibold")}>
                      📅 {formatSched(job.scheduled_date)}
                    </p>
                    {job.total_value != null && (
                      <p className="flex items-center gap-1.5">💷 £{job.total_value.toFixed(2)} + VAT</p>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{formatSched(job.scheduled_date)}</span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
                    <svg className="w-3 h-3 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
