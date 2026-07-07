"use client";

import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type Completion = { completed_by: string | null; operative_name: string | null; star_rating: number | null; completed_at: string };
type JobRow = { assigned_team: string | null; contractor_id: string | null; total_value: number | null; status: string };
type ProfileRow = { id: string; full_name: string; role: string };

function buildLeaderboard(profiles: ProfileRow[], completions: Completion[], jobs: JobRow[]) {
  return profiles.map(p => {
    const userCompletions = completions.filter(c => c.completed_by === p.id || c.operative_name === p.full_name);
    const jobsDone = userCompletions.length;
    const ratings = userCompletions.map(c => c.star_rating).filter((r): r is number => r !== null);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const commission = jobs
      .filter(j => j.assigned_team === p.full_name || j.contractor_id === p.id)
      .reduce((s, j) => s + (j.total_value ?? 0) * 0.1, 0);
    return { ...p, jobsDone, avgRating, commission, ratingCount: ratings.length };
  }).sort((a, b) => b.jobsDone - a.jobsDone || b.avgRating - a.avgRating);
}

const RANK_LABELS = ["1st", "2nd", "3rd"];
const RANK_COLORS = [
  "bg-amber-400/20 text-amber-400 border-amber-400/30",
  "bg-slate-400/20 text-slate-400 border-slate-400/30",
  "bg-orange-400/20 text-orange-400 border-orange-400/30",
];

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
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Rankings based on jobs completed and customer ratings</p>
      </div>

      {/* My stats card (field workers only) */}
      {myEntry && currentProfile.role !== "office" && (
        <div className="bg-card border border-amber-400/20 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-amber-400" />
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-4">Your stats</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-foreground">#{myRank}</p>
              <p className="text-xs text-muted-foreground mt-1">Rank</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{myEntry.jobsDone}</p>
              <p className="text-xs text-muted-foreground mt-1">Jobs done</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-400">£{myEntry.commission.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Commission</p>
            </div>
          </div>
          {myEntry.avgRating > 0 && (
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <span className="text-amber-400">★</span>
              <span className="text-foreground font-bold text-sm">{stars(myEntry.avgRating)}</span>
              <span className="text-muted-foreground text-xs">avg rating ({myEntry.ratingCount} reviews)</span>
            </div>
          )}
        </div>
      )}

      {/* Top 3 podium */}
      {board.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-muted-foreground mb-2">2nd</p>
            <div className="bg-card border border-border rounded-t-xl pt-6 pb-4 px-2">
              <p className="font-bold text-sm text-foreground truncate">{board[1]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{board[1]?.jobsDone} jobs</p>
            </div>
          </div>
          {/* 1st */}
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-amber-400 mb-2">1st</p>
            <div className="bg-card border border-amber-400/30 rounded-t-xl pt-10 pb-4 px-2">
              <p className="font-bold text-sm text-amber-400 truncate">{board[0]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{board[0]?.jobsDone} jobs</p>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-muted-foreground mb-2">3rd</p>
            <div className="bg-card border border-border rounded-t-xl pt-4 pb-4 px-2">
              <p className="font-bold text-sm text-foreground truncate">{board[2]?.full_name.split(" ")[0]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{board[2]?.jobsDone} jobs</p>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-secondary/30">
          <span className="w-10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">Rank</span>
          <span className="flex-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Name</span>
          <span className="w-14 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">Jobs</span>
          <span className="w-16 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center shrink-0">Rating</span>
          <span className="w-20 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right shrink-0">Earned</span>
        </div>

        {board.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No rankings yet — complete some jobs to appear here.</p>
        )}

        {board.map((entry, i) => {
          const isMe = entry.id === currentProfile.id;
          return (
            <div key={entry.id} className={cn(
              "flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 transition-colors",
              isMe ? "bg-primary/5" : "hover:bg-secondary/30"
            )}>
              <div className="w-10 shrink-0">
                {i < 3 ? (
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold border",
                    RANK_COLORS[i]
                  )}>
                    {RANK_LABELS[i]}
                  </span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm truncate", isMe ? "text-primary" : "text-foreground")}>
                  {entry.full_name}
                  {isMe && <span className="ml-2 text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{entry.role}</p>
              </div>
              <div className="w-14 text-center shrink-0">
                <p className="font-bold text-foreground">{entry.jobsDone}</p>
                <p className="text-[10px] text-muted-foreground">jobs</p>
              </div>
              <div className="w-16 text-center shrink-0">
                {entry.avgRating > 0 ? (
                  <>
                    <p className="font-bold text-amber-400 text-sm">★ {stars(entry.avgRating)}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.ratingCount} reviews</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
              <div className="w-20 text-right shrink-0">
                <p className="font-bold text-emerald-400 text-sm">£{entry.commission.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">earned</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}