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
    const upsert = async (lat: number, lng: number, acc: number) => {
      await supabase.from("operative_locations").upsert({
        user_id: currentUserId, latitude: lat, longitude: lng,
        accuracy: acc, is_tracking: true, updated_at: new Date().toISOString(),
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
      user_id: currentUserId, is_tracking: false, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    toast.success("Location tracking stopped");
  }

  const activeCount = locations.filter(l => l.is_tracking).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isOffice
              ? `${activeCount} operative${activeCount !== 1 ? "s" : ""} currently tracking`
              : "Your live GPS location"}
          </p>
        </div>
        {!isOffice && (
          <button
            onClick={tracking ? stopTracking : startTracking}
            className={cn(
              "px-5 py-2 rounded-lg font-bold text-sm transition-all",
              tracking
                ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
            )}
          >
            {tracking ? "Stop sharing" : "Share location"}
          </button>
        )}
      </div>

      {/* Live indicator */}
      {activeCount > 0 && isOffice && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-sm font-semibold text-emerald-400">{activeCount} live</span>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {locations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-bold text-foreground">No locations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Field workers share their location when on site.</p>
          </div>
        )}

        {locations.map(loc => (
          <div key={loc.user_id} className={cn(
            "bg-card border rounded-xl overflow-hidden transition-colors",
            loc.is_tracking ? "border-emerald-500/30" : "border-border"
          )}>
            <div className="flex items-center gap-4 p-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm",
                loc.is_tracking ? "bg-emerald-500 shadow-[0_0_12px_#34d399]" : "bg-muted text-muted-foreground"
              )}>
                {(loc.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground truncate">{loc.profiles?.full_name ?? "Unknown"}</p>
                  {loc.is_tracking && (
                    <span className="text-[10px] font-bold bg-emerald-400/15 text-emerald-400 px-1.5 py-0.5 rounded-full shrink-0">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loc.latitude && loc.longitude
                    ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                    : "No coordinates yet"}
                  {" · "}Updated {timeAgo(loc.updated_at)}
                </p>
              </div>

              {loc.latitude && loc.longitude && (
                <a
                  href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
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