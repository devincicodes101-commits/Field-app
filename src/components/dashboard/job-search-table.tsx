"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job, JobStatus } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<JobStatus, string> = {
  quote_sent:  "bg-sky-400",
  accepted:    "bg-teal-400",
  scheduled:   "bg-amber-400",
  in_progress: "bg-primary shadow-[0_0_8px_oklch(0.56_0.24_266/0.7)]",
  completed:   "bg-emerald-400",
  cancelled:   "bg-rose-400",
};

const STATUS_TEXT: Record<JobStatus, string> = {
  quote_sent:  "text-sky-400",
  accepted:    "text-teal-400",
  scheduled:   "text-amber-400",
  in_progress: "text-primary",
  completed:   "text-emerald-400",
  cancelled:   "text-rose-400",
};

const TZ = "Europe/London";

function londonDate(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}

function isToday(dateStr: string | null) {
  return dateStr ? londonDate(dateStr) === londonDate(new Date()) : false;
}

function formatScheduled(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const time = d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  if (isToday(value)) return `Today · ${time}`;
  return d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }) + ` · ${time}`;
}

const ALL_STATUSES: JobStatus[] = ["quote_sent", "accepted", "scheduled", "in_progress", "completed", "cancelled"];

export function JobSearchTable({ jobs }: { jobs: Job[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.address.toLowerCase().includes(q) ||
      j.client_name.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, clients, addresses…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as JobStatus | "all")}
          className="text-sm rounded-lg border border-border bg-card text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-secondary/30">
          <span className="w-2 shrink-0" />
          <span className="flex-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Job</span>
          <span className="hidden md:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[170px] shrink-0">Address</span>
          <span className="hidden sm:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36 text-right shrink-0">Scheduled</span>
          <span className="hidden lg:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-24 text-right shrink-0">Value</span>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-20 text-right shrink-0">Status</span>
          <span className="w-4 shrink-0" />
        </div>

        {!filtered.length ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {jobs.length === 0 ? "No jobs yet." : "No jobs match your search."}
          </div>
        ) : (
          filtered.map((job) => {
            const today = isToday(job.scheduled_date);
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[job.status])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {job.title}
                    {today && (
                      <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{job.client_name}</p>
                </div>
                <p className="hidden md:block text-xs text-muted-foreground truncate max-w-[170px] shrink-0">{job.address}</p>
                <p className={cn("hidden sm:block text-xs shrink-0 w-36 text-right", today ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {formatScheduled(job.scheduled_date)}
                </p>
                {job.total_value != null ? (
                  <p className="hidden lg:block text-xs font-semibold text-foreground shrink-0 w-24 text-right">
                    £{job.total_value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                  </p>
                ) : (
                  <span className="hidden lg:block w-24 shrink-0" />
                )}
                <span className={cn("shrink-0 text-xs font-semibold w-20 text-right", STATUS_TEXT[job.status])}>
                  {JOB_STATUS_LABELS[job.status]}
                </span>
                <svg className="w-4 h-4 text-border group-hover:text-primary shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })
        )}
      </div>

      {filtered.length > 0 && filtered.length < jobs.length && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filtered.length} of {jobs.length} jobs
        </p>
      )}
    </div>
  );
}
