"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clockIn, clockOut } from "./actions";
import type { AttendanceLog, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

function hoursWorked(clockIn: string, clockOut: string | null) {
  if (!clockOut) return null;
  const diff = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 1000 / 60 / 60;
  return diff;
}

function fmtHours(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// Group logs by ISO week
function weekStart(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

export function AttendanceClient({
  logs: initial,
  todayLog: initialToday,
  profile,
}: {
  logs: AttendanceLog[];
  todayLog: AttendanceLog | null;
  profile: Profile;
}) {
  const router = useRouter();
  const [logs, setLogs] = useState(initial);
  const [todayLog, setTodayLog] = useState(initialToday);
  const [loading, setLoading] = useState(false);
  const [earlyLeave, setEarlyLeave] = useState(false);

  const isClockedIn = !!todayLog && !todayLog.clock_out;

  async function handleClockIn() {
    setLoading(true);
    const result = await clockIn();
    setLoading(false);
    if ("error" in result) { toast.error(result.error); return; }
    toast.success("Clocked in!");
    router.refresh();
  }

  async function handleClockOut() {
    if (!todayLog) return;
    setLoading(true);
    const result = await clockOut(todayLog.id, earlyLeave);
    setLoading(false);
    if ("error" in result) { toast.error(result.error); return; }
    toast.success("Clocked out!");
    router.refresh();
  }

  // Weekly summary
  const weekMap: Record<string, AttendanceLog[]> = {};
  for (const log of logs) {
    const ws = weekStart(log.work_date);
    if (!weekMap[ws]) weekMap[ws] = [];
    weekMap[ws].push(log);
  }
  const weeks = Object.entries(weekMap).sort((a, b) => b[0].localeCompare(a[0]));

  const totalHoursThisWeek = (() => {
    const thisWeek = weekMap[weekStart(new Date().toISOString().slice(0, 10))] ?? [];
    return thisWeek.reduce((s, l) => {
      const h = l.clock_out ? hoursWorked(l.clock_in, l.clock_out) : 0;
      return s + (h ?? 0);
    }, 0);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">
          {profile.full_name} · {fmtHours(totalHoursThisWeek)} this week
        </p>
      </div>

      {/* Clock in/out card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={cn(
          "px-6 py-6 text-center",
          isClockedIn ? "bg-emerald-50" : "bg-slate-50"
        )}>
          {/* Live clock indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isClockedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
            )} />
            <span className={cn("font-bold text-lg", isClockedIn ? "text-emerald-700" : "text-slate-500")}>
              {isClockedIn ? "Clocked in" : todayLog?.clock_out ? "Clocked out today" : "Not clocked in"}
            </span>
          </div>

          {todayLog && (
            <div className="flex items-center justify-center gap-6 mb-5 text-sm">
              <div className="text-center">
                <p className="text-slate-400 text-xs font-medium mb-0.5">Clock in</p>
                <p className="font-bold text-slate-800 text-xl">{fmtTime(todayLog.clock_in)}</p>
              </div>
              {todayLog.clock_out && (
                <>
                  <div className="w-8 h-px bg-slate-300" />
                  <div className="text-center">
                    <p className="text-slate-400 text-xs font-medium mb-0.5">Clock out</p>
                    <p className="font-bold text-slate-800 text-xl">{fmtTime(todayLog.clock_out)}</p>
                  </div>
                  <div className="w-8 h-px bg-slate-300" />
                  <div className="text-center">
                    <p className="text-slate-400 text-xs font-medium mb-0.5">Hours</p>
                    <p className="font-bold text-indigo-700 text-xl">
                      {fmtHours(hoursWorked(todayLog.clock_in, todayLog.clock_out)!)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action */}
          {!todayLog && (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {loading ? "Clocking in…" : "Clock in"}
            </button>
          )}

          {isClockedIn && (
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={earlyLeave}
                  onChange={e => setEarlyLeave(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500"
                />
                <span className="text-sm text-slate-600 font-medium">Early leave</span>
              </label>
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="px-10 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
              >
                {loading ? "Clocking out…" : "Clock out"}
              </button>
            </div>
          )}

          {todayLog?.clock_out && (
            <p className="text-sm text-emerald-600 font-semibold mt-2">
              Great work today! See you tomorrow 👋
            </p>
          )}
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-700">Last 4 weeks</h2>
        {weeks.map(([ws, weekLogs]) => {
          const weekTotal = weekLogs.reduce((s, l) => {
            const h = l.clock_out ? hoursWorked(l.clock_in, l.clock_out) : 0;
            return s + (h ?? 0);
          }, 0);
          const weekEnd = new Date(ws);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return (
            <div key={ws} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-bold text-slate-700">
                  {fmtDay(ws)} – {fmtDay(weekEnd.toISOString().slice(0, 10))}
                </span>
                <span className="text-sm font-black text-indigo-700">{fmtHours(weekTotal)}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {weekLogs.map(log => {
                  const hrs = log.clock_out ? hoursWorked(log.clock_in, log.clock_out) : null;
                  return (
                    <div key={log.id} className="flex items-center px-5 py-3.5 gap-4">
                      <div className="w-20 shrink-0">
                        <p className="text-xs font-bold text-slate-700">{fmtDay(log.work_date)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 flex-1">
                        <span>{fmtTime(log.clock_in)}</span>
                        <span className="text-slate-300">→</span>
                        <span>{log.clock_out ? fmtTime(log.clock_out) : <span className="text-indigo-500 font-semibold">Active</span>}</span>
                      </div>
                      <div className="text-right shrink-0">
                        {hrs != null ? (
                          <span className="text-sm font-bold text-slate-800">{fmtHours(hrs)}</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                        {log.early_leave && (
                          <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                            Early
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!logs.length && (
          <div className="text-center py-12 text-slate-400">No attendance records in the last 4 weeks.</div>
        )}
      </div>
    </div>
  );
}