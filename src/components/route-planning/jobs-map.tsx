"use client";

import { useEffect, useRef } from "react";

type MapJob = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#f59e0b",
  in_progress: "#6366f1",
  completed: "#10b981",
  accepted: "#14b8a6",
  quote_sent: "#38bdf8",
  cancelled: "#f87171",
};

export function JobsMap({ jobs }: { jobs: MapJob[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then(L => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = jobs.length > 0
        ? [jobs.reduce((s, j) => s + j.lat, 0) / jobs.length, jobs.reduce((s, j) => s + j.lng, 0) / jobs.length]
        : [51.5074, -0.1278];

      const map = L.map(mapRef.current!).setView(center, 11);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      jobs.forEach((job, i) => {
        const color = STATUS_COLORS[job.status] ?? "#6366f1";
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:32px;height:32px;border-radius:50%;background:${color};
            border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:900;font-size:13px;font-family:sans-serif;
          ">${i + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([job.lat, job.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px;font-family:sans-serif">
              <p style="font-weight:700;margin:0 0 4px">${job.title}</p>
              <p style="color:#64748b;font-size:12px;margin:0">${job.address}</p>
              <a href="/jobs/${job.id}" style="display:inline-block;margin-top:8px;color:#4f46e5;font-size:12px;font-weight:600">View job →</a>
            </div>
          `);
      });

      // Draw route line if multiple jobs
      if (jobs.length > 1) {
        const latlngs = jobs.map(j => [j.lat, j.lng] as [number, number]);
        L.polyline(latlngs, { color: "#6366f1", weight: 2, opacity: 0.6, dashArray: "6 4" }).addTo(map);
      }
    });

    return () => {
      if (mapInstance.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstance.current as any).remove();
        mapInstance.current = null;
      }
    };
  }, [jobs]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-96 rounded-2xl border border-slate-200 shadow-sm overflow-hidden" />
    </>
  );
}