"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LocRow = {
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  is_tracking: boolean;
  updated_at: string;
  profiles: { full_name: string; role: string } | null;
};

function timeAgo(d: string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export function TrackingClient({
  locations: initial,
  currentUserId,
  isOffice,
}: {
  locations: LocRow[];
  currentUserId: string;
  isOffice: boolean;
}) {
  const [locations, setLocations] = useState(initial);
  const [tracking, setTracking] = useState(false);
  const watchRef = useRef<number | null>(null);
  const supabase = createClient();

  // Real-time subscription for office view
  useEffect(() => {
    if (!isOffice) return;
    const channel = supabase
      .channel("operative_locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "operative_locations" },
        payload => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newRow = payload.new as LocRow;
            setLocations(prev => {
              const idx = prev.findIndex(l => l.user_id === newRow.user_id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...prev[idx], ...newRow };
                return next;
              }
              return [newRow, ...prev];
            });
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOffice, supabase]);

  async function startTracking() {
    if (!navigator.geolocation) { toast.error("GPS not supported"); return; }
    setTracking(true);

    // Upsert initial location
    const upsert = async (lat: number, lng: number, acc: number) => {
      await supabase.from("operative_locations").upsert({
        user_id: currentUserId,
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        is_tracking: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };

    watchRef.current = navigator.geolocation.watchPosition(
      pos => upsert(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      err => { toast.error(`GPS error: ${err.message}`); stopTracking(); },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    toast.success("Location tracking started");
  }

  async function stopTracking() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTracking(false);
    await supabase.from("operative_locations").upsert({
      user_id: currentUserId,
      is_tracking: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    toast.success("Location tracking stopped");
  }

  const activeCount = locations.filter(l => l.is_tracking).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Live Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOffice ? `${activeCount} operative${activeCount !== 1 ? "s" : ""} currently tracking` : "Your live GPS location"}
          </p>
        </div>

        {/* Field worker: tracking toggle */}
        {!isOffice && (
          <button
            onClick={tracking ? stopTracking : startTracking}
            className={cn(
              "px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-md",
              tracking
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {tracking ? "Stop sharing" : "Share location"}
          </button>
        )}
      </div>

      {/* Live indicator */}
      {activeCount > 0 && isOffice && (
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">{activeCount} live</span>
        </div>
      )}

      {/* Location list */}
      <div className="space-y-3">
        {locations.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📍</div>
            <p className="font-bold text-slate-700">No locations yet</p>
            <p className="text-sm text-slate-400 mt-1">Field workers share their location when on site.</p>
          </div>
        )}
        {locations.map(loc => (
          <div key={loc.user_id} className={cn(
            "bg-white rounded-2xl border shadow-sm overflow-hidden",
            loc.is_tracking ? "border-emerald-200" : "border-slate-200"
          )}>
            <div className="flex items-center gap-4 p-4">
              {/* Avatar */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                loc.is_tracking ? "bg-emerald-500" : "bg-slate-400"
              )}>
                {(loc.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 truncate">{loc.profiles?.full_name ?? "Unknown"}</p>
                  {loc.is_tracking && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {loc.latitude && loc.longitude
                    ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                    : "No coordinates yet"}
                  {" · "}
                  Updated {timeAgo(loc.updated_at)}
                </p>
              </div>

              {loc.latitude && loc.longitude && (
                <a
                  href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Map →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}