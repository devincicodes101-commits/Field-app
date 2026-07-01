"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

type Alert = { jobId: string; title: string; rating: number; address: string };

export function LowRatingAlerts({ jobs }: { jobs: Job[] }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = localStorage.getItem("dismissed-rating-alerts");
    if (raw) setDismissed(new Set(JSON.parse(raw)));
  }, []);

  useEffect(() => {
    if (!jobs.length) return;
    const completedIds = jobs.filter(j => j.status === "completed").map(j => j.id);
    if (!completedIds.length) return;

    const supabase = createClient();
    supabase
      .from("job_completions")
      .select("job_id, star_rating")
      .in("job_id", completedIds)
      .lte("star_rating", 2)
      .not("star_rating", "is", null)
      .then(({ data }) => {
        if (!data) return;
        const built: Alert[] = data.slice(0, 3).map(row => {
          const job = jobs.find(j => j.id === row.job_id)!;
          return { jobId: row.job_id, title: job?.title ?? "Job", rating: row.star_rating, address: job?.address ?? "" };
        });
        setAlerts(built);
      });
  }, [jobs]);

  const visible = alerts.filter(a => !dismissed.has(a.jobId));
  if (!visible.length) return null;

  function dismiss(jobId: string) {
    const next = new Set([...dismissed, jobId]);
    setDismissed(next);
    localStorage.setItem("dismissed-rating-alerts", JSON.stringify([...next]));
  }

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  return (
    <div className="space-y-2">
      {visible.map(a => (
        <div
          key={a.jobId}
          className={cn(
            "flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          )}
        >
          <span className="text-rose-500 text-lg shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-800">{a.title}</p>
            <p className="text-xs text-rose-600 mt-0.5">{a.address} · Rating: <span className="font-mono">{stars(a.rating)}</span></p>
          </div>
          <a
            href={`/jobs/${a.jobId}`}
            className="shrink-0 text-xs font-semibold text-rose-700 underline underline-offset-2"
          >
            View
          </a>
          <button
            onClick={() => dismiss(a.jobId)}
            className="shrink-0 text-rose-400 hover:text-rose-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
