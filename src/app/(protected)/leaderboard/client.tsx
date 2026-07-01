"use client";

import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type Completion = { completed_by: string | null; operative_name: string | null; star_rating: number | null; completed_at: string };
type JobRow = { assigned_team: string | null; contractor_id: string | null; total_value: number | null; status: string };
type ProfileRow = { id: string; full_name: string; role: string };

const MEDALS = ["🥇", "🥈", "🥉"];

function buildLeaderboard(profiles: ProfileRow[], completions: Completion[], jobs: JobRow[]) {
  return profiles.map(p => {
    const userCompletions = completions.filter(c => c.completed_by === p.id || c.operative_name === p.full_name);
    const jobsDone = userCompletions.length;
    const ratings = userCompletions.map(c => c.star_rating).filter((r): r is number => r !== null);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Commission: 10% of job values for their assigned/completed jobs
    const commission = jobs
      .filter(j => j.assigned_team === p.full_name || j.contractor_id === p.id)
      .reduce((s, j) => s + (j.total_value ?? 0) * 0.1, 0);

    return { ...p, jobsDone, avgRating, commission, ratingCount: ratings.length };
  }).sort((a, b) => b.jobsDone - a.jobsDone || b.avgRating - a.avgRating);
}

export function LeaderboardClient({
  profiles,
  completions,
  jobs,
  currentProfile,
}: {
  profiles: ProfileRow[];
  completions: Completion[];
  jobs: JobRow[];
  currentProfile: Profile;
}) {
  const board = buildLeaderboard(profiles, completions, jobs);
  const myEntry = board.find(e => e.id === currentProfile.id);
  const myRank = board.findIndex(e => e.id === currentProfile.id) + 1;

  const stars = (n: number) => n.toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Leaderboard</h1>
        <p className="text-slate-500 text-sm mt-1">Rankings based on jobs completed and customer ratings</p>
      </div>

      {/* My commission card (field workers only) */}
      {myEntry && currentProfile.role !== "office" && (
        <div className="rounded-2xl overflow-hidden shadow-md"
          style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" }}>
          <div className="px-6 py-5 text-white">
            <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-3">Your Stats</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-black">#{myRank}</p>
                <p className="text-amber-200 text-xs mt-0.5">Rank</p>
              </div>
              <div>
                <p className="text-3xl font-black">{myEntry.jobsDone}</p>
                <p className="text-amber-200 text-xs mt-0.5">Jobs done</p>
              </div>
              <div>
                <p className="text-3xl font-black">£{myEntry.commission.toFixed(0)}</p>
                <p className="text-amber-200 text-xs mt-0.5">Commission</p>
              </div>
            </div>
            {myEntry.avgRating > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-amber-300">★</span>
                <span className="text-white font-bold">{stars(myEntry.avgRating)}</span>
                <span className="text-amber-200 text-xs">avg rating ({myEntry.ratingCount} reviews)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      {board.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          <div className="flex-1 text-center">
            <p className="text-2xl mb-1">🥈</p>
            <div className="bg-slate-200 rounded-t-2xl pt-8 pb-4 px-2">
              <p className="font-bold text-sm text-slate-800 truncate">{board[1]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-slate-500">{board[1]?.jobsDone} jobs</p>
            </div>
          </div>
          {/* 1st */}
          <div className="flex-1 text-center">
            <p className="text-3xl mb-1">🥇</p>
            <div className="rounded-t-2xl pt-12 pb-4 px-2 shadow-lg"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}>
              <p className="font-black text-sm text-white truncate">{board[0]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-amber-100">{board[0]?.jobsDone} jobs</p>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex-1 text-center">
            <p className="text-2xl mb-1">🥉</p>
            <div className="bg-orange-100 rounded-t-2xl pt-6 pb-4 px-2">
              <p className="font-bold text-sm text-orange-800 truncate">{board[2]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-orange-600">{board[2]?.jobsDone} jobs</p>
            </div>
          </div>
        </div>
      )}

      {/* Full rankings list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {board.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">No rankings yet. Complete some jobs to appear here!</p>
          )}
          {board.map((entry, i) => {
            const isMe = entry.id === currentProfile.id;
            return (
              <div key={entry.id} className={cn(
                "flex items-center gap-4 px-5 py-4",
                isMe && "bg-indigo-50"
              )}>
                <div className="w-8 text-center shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{MEDALS[i]}</span>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-bold text-sm truncate", isMe ? "text-indigo-700" : "text-slate-900")}>
                    {entry.full_name}
                    {isMe && <span className="ml-2 text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">You</span>}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">{entry.role}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="font-black text-slate-900">{entry.jobsDone}</p>
                  <p className="text-[10px] text-slate-400">jobs</p>
                </div>
                <div className="text-center shrink-0">
                  {entry.avgRating > 0 ? (
                    <>
                      <p className="font-black text-amber-500">★ {stars(entry.avgRating)}</p>
                      <p className="text-[10px] text-slate-400">{entry.ratingCount} reviews</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-300">—</p>
                  )}
                </div>
                <div className="text-center shrink-0">
                  <p className="font-black text-emerald-700 text-sm">£{entry.commission.toFixed(0)}</p>
                  <p className="text-[10px] text-slate-400">earned</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}