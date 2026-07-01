"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

const JobsMap = dynamic(
  () => import("@/components/route-planning/jobs-map").then(m => m.JobsMap),
  { ssr: false, loading: () => <div className="w-full h-96 rounded-2xl bg-slate-100 animate-pulse" /> }
);

type GeoJob = Job & { lat: number; lng: number };

// Extract UK postcode from address
function extractPostcode(address: string): string | null {
  const m = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return m ? m[0].replace(/\s/g, "") : null;
}

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
      } catch { /* skip if geocode fails */ }
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

  const STATUS_PILL: Record<string, string> = {
    scheduled: "bg-amber-100 text-amber-700",
    in_progress: "bg-indigo-100 text-indigo-700",
    accepted: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Route Planning</h1>
          <p className="text-slate-500 text-sm mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} scheduled for today
          </p>
        </div>
        {!geocoded && jobs.length > 0 && (
          <button
            onClick={geocodeAll}
            disabled={geocoding}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-60 transition-all"
          >
            {geocoding ? "Geocoding…" : "📍 Plot on map"}
          </button>
        )}
      </div>

      {/* Map */}
      {geocoded && (
        <div className="space-y-3">
          <JobsMap jobs={orderedJobs} />
          <p className="text-xs text-slate-400 text-center">
            Dashed line shows suggested route order · Click markers for job details
          </p>
        </div>
      )}

      {/* Empty */}
      {jobs.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-bold text-slate-700">No jobs scheduled for today</p>
          <p className="text-sm text-slate-400 mt-1">Jobs scheduled for today with status scheduled/in progress will appear here.</p>
        </div>
      )}

      {/* Ordered stop list */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-bold text-slate-700">
              {geocoded ? "Route order (drag to reorder)" : "Today's jobs"}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {(geocoded ? orderedJobs : jobs).map((job, i) => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 truncate">{job.address} · {fmtTime(job.scheduled_date)}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", STATUS_PILL[job.status] ?? "bg-slate-100 text-slate-600")}>
                  {job.status.replace("_", " ")}
                </span>
                {geocoded && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none">▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === orderedJobs.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none">▼</button>
                  </div>
                )}
                <a href={`/jobs/${job.id}`} className="text-indigo-600 text-xs font-semibold hover:underline shrink-0">
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}