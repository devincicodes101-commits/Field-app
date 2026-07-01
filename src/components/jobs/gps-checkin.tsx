"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { JobSiteCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

type CheckEvent = { event_type: "check_in" | "check_out"; created_at: string; confirmed_on_site: boolean; latitude: number | null; longitude: number | null };

export function GpsCheckin({
  jobId,
  checks: initial,
}: {
  jobId: string;
  checks: JobSiteCheck[];
}) {
  const [checks, setChecks] = useState<CheckEvent[]>(
    initial.map(c => ({
      event_type: c.event_type,
      created_at: c.created_at,
      confirmed_on_site: c.confirmed_on_site,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
    }))
  );
  const [loading, setLoading] = useState(false);

  const lastCheck = checks.at(-1);
  const isClockedIn = lastCheck?.event_type === "check_in";

  async function record(eventType: "check_in" | "check_out") {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("job_site_checks")
        .insert({
          job_id: jobId,
          user_id: user?.id,
          event_type: eventType,
          latitude,
          longitude,
          confirmed_on_site: true,
        })
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      setChecks(prev => [...prev, {
        event_type: eventType,
        created_at: data.created_at,
        confirmed_on_site: true,
        latitude,
        longitude,
      }]);
      toast.success(eventType === "check_in" ? "Checked in on site ✓" : "Checked out ✓");
    } catch {
      toast.error("Could not get your location. Please enable GPS.");
    } finally {
      setLoading(false);
    }
  }

  function fmt(d: string) {
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Status banner */}
      <div className={cn(
        "px-5 py-4 flex items-center justify-between",
        isClockedIn ? "bg-emerald-50 border-b border-emerald-100" : "bg-slate-50 border-b border-slate-100"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
          )} />
          <span className={cn("font-bold text-sm", isClockedIn ? "text-emerald-700" : "text-slate-500")}>
            {isClockedIn ? "On site" : "Not checked in"}
          </span>
          {lastCheck && (
            <span className="text-xs text-slate-400">since {fmt(lastCheck.created_at)}</span>
          )}
        </div>
        <button
          onClick={() => record(isClockedIn ? "check_out" : "check_in")}
          disabled={loading}
          className={cn(
            "px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm",
            isClockedIn
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white",
            loading && "opacity-60 cursor-not-allowed"
          )}
        >
          {loading ? "Getting GPS…" : isClockedIn ? "Check out" : "Check in"}
        </button>
      </div>

      {/* Log */}
      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {!checks.length && (
          <p className="text-sm text-slate-400 text-center py-8">No site visits recorded.</p>
        )}
        {[...checks].reverse().map((c, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-3">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0",
              c.event_type === "check_in" ? "bg-emerald-100" : "bg-rose-100"
            )}>
              {c.event_type === "check_in" ? "→" : "←"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", c.event_type === "check_in" ? "text-emerald-700" : "text-rose-700")}>
                {c.event_type === "check_in" ? "Checked in" : "Checked out"}
              </p>
              <p className="text-xs text-slate-400">{fmtDate(c.created_at)} · {fmt(c.created_at)}</p>
            </div>
            {c.latitude && c.longitude && (
              <a
                href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 underline shrink-0"
              >
                Map
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}