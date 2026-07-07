"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

const JobsMap = dynamic(
  () => import("@/components/route-planning/jobs-map").then(m => m.JobsMap),
  { ssr: false, loading: () => <div className="w-full h-96 rounded-xl bg-secondary animate-pulse" /> }
);

type GeoJob = Job & { lat: number; lng: number };

function extractPostcode(address: string): string | null {
  const m = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return m ? m[0].replace(/\s/g, "") : null;
}

const STATUS_PILL: Record<string, string> = {
  scheduled:   "bg-amber-400/15 text-amber-400",
  in_progress: "bg-primary/15 text-primary",
  accepted:    "bg-teal-400/15 text-teal-400",
};

export function RoutePlanningClient({ jobs }: { jobs: Job[] }) {
  const [geoJobs, setGeoJobs] = useState<GeoJob[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocoded, setGeocoded] = useState(false);
  const [order, setOrder] = useState<string[]>(jobs.map(j => j.id));

  async function geocodeAll() {
    setGeocoding(true);
    const results: GeoJob[] = [];
    for (const job of jobs) {
      const pc = extractPostcode(job.address);
      if (!pc) continue;
      try {
        const res = await fetch(`https://api.postcodes.io/postcodes/${pc}`);
        const json = await res.json();
        if (json.result) {
          results.push({ ...job, lat: json.result.latitude, lng: json.result.longitude });
        }
      } catch { /* skip */ }
    }
    setGeoJobs(results);
    setOrder(results.map(j => j.id));
    setGeocoded(true);
    setGeocoding(false);
  }

  const orderedJobs = order
    .map(id => geoJobs.find(j => j.id === id))
    .filter((j): j is GeoJob => j !== undefined);

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
  }
  function moveDown(i: number) {
    if (i === order.length - 1) return;
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setOrder(next);
  }

  function fmtTime(d: string | null) {
    if (!d) return "TBC";
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Route Planning</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} scheduled for today
          </p>
        </div>
        {!geocoded && jobs.length > 0 && (
          <button
            onClick={geocodeAll}
            disabled={geocoding}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg shadow-[0_0_16px_oklch(0.56_0.24_266/0.35)] disabled:opacity-60 transition-all"
          >
            {geocoding ? "Geocoding…" : "Plot on map"}
          </button>
        )}
      </div>

      {geocoded && (
        <div className="space-y-2">
          <JobsMap jobs={orderedJobs} />
          <p className="text-xs text-muted-foreground text-center">
            Dashed line shows suggested route order · Click markers for job details
          </p>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="font-bold text-foreground">No jobs scheduled for today</p>
          <p className="text-sm text-muted-foreground mt-1">Jobs scheduled for today with status scheduled/in progress will appear here.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-bold text-foreground">
              {geocoded ? "Route order — use ▲▼ to reorder" : "Today's jobs"}
            </p>
          </div>
          <div className="divide-y divide-border">
            {(geocoded ? orderedJobs : jobs).map((job, i) => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.address} · {fmtTime(job.scheduled_date)}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", STATUS_PILL[job.status] ?? "bg-muted text-muted-foreground")}>
                  {job.status.replace("_", " ")}
                </span>
                {geocoded && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === orderedJobs.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                )}
                <a href={`/jobs/${job.id}`} className="text-primary text-xs font-semibold hover:underline shrink-0">
                  View →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}