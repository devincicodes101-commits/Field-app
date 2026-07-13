import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type Job, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldWorkerTabs } from "@/components/dashboard/field-worker-tabs";
import { LowRatingAlerts } from "@/components/dashboard/low-rating-alerts";
import { JobSearchTable } from "@/components/dashboard/job-search-table";
import { settleEndedAuctions } from "@/lib/settle-auctions";

/* ── Helpers ── */
// Business day is the UK working day, regardless of where the office user sits.
const TZ = "Europe/London";

function londonDate(value: string | number | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  return londonDate(dateStr) === londonDate(new Date());
}

function greet(name: string) {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date())
  );
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]} 👋`;
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  accent,
  sub,
  glow,
}: {
  label: string;
  value: number;
  accent: string;
  sub?: string;
  glow?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      {/* Subtle top border accent */}
      <div className={cn("absolute inset-x-0 top-0 h-[2px]", accent)} />
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
        {label}
      </p>
      <p className={cn("text-4xl font-extrabold leading-none", glow ?? "text-foreground")}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ isOffice }: { isOffice: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="font-bold text-foreground text-base">
        {isOffice ? "No jobs yet" : "No jobs assigned yet"}
      </h3>
      <p className="text-muted-foreground text-sm mt-1 max-w-xs">
        {isOffice
          ? "Create your first job to get the workflow started."
          : "Jobs will appear here once assigned to your team."}
      </p>
      {isOffice && (
        <Link
          href="/jobs/new"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-[0_0_20px_oklch(0.56_0.24_266/0.35)] transition-all"
        >
          <PlusIcon />
          Create first job
        </Link>
      )}
    </div>
  );
}

/* ── Page ── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Award any auctions whose window has elapsed (office view triggers settlement too).
  await settleEndedAuctions();

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return null;

  const baseQuery = supabase.from("jobs").select("*")
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .limit(50);

  const filteredQuery =
    profile.role === "contractor"
      ? baseQuery.eq("contractor_id", user.id)
      : profile.role === "operative"
        ? baseQuery.eq("assigned_team", profile.full_name)
        : baseQuery;

  const { data: jobs } = await filteredQuery.returns<Job[]>();

  const isOffice = profile.role === "office";
  const list = jobs ?? [];

  const stats = {
    total:      list.length,
    inProgress: list.filter(j => j.status === "in_progress").length,
    completed:  list.filter(j => j.status === "completed").length,
    pending:    list.filter(j => ["quote_sent", "accepted", "scheduled"].includes(j.status)).length,
  };
  const todayCount = list.filter(j => isToday(j.scheduled_date)).length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {isOffice ? greet(profile.full_name || "there") : "My diary"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isOffice
              ? `${stats.inProgress} in progress · ${todayCount} scheduled today`
              : `${list.length} job${list.length !== 1 ? "s" : ""} assigned · ${todayCount} today`}
          </p>
        </div>
        {isOffice && (
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg shadow-[0_0_20px_oklch(0.56_0.24_266/0.4)] transition-all"
          >
            <PlusIcon />
            New job
          </Link>
        )}
      </div>

      {/* ── Office stat cards ── */}
      {isOffice && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total jobs"
            value={stats.total}
            accent="bg-border"
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            accent="bg-primary"
            glow="text-primary"
            sub={stats.inProgress > 0 ? "Active on site" : undefined}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            accent="bg-emerald-500"
            glow="text-emerald-400"
            sub={stats.completed > 0 ? "Invoiced & done" : undefined}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            accent="bg-amber-400"
            glow="text-amber-400"
            sub={stats.pending > 0 ? "Awaiting start" : undefined}
          />
        </div>
      )}

      {/* ── Field worker mini stats ── */}
      {!isOffice && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">{list.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="bg-primary rounded-xl p-4 text-center shadow-[0_0_24px_oklch(0.56_0.24_266/0.5)]">
            <p className="text-2xl font-extrabold text-primary-foreground">{todayCount}</p>
            <p className="text-xs text-primary-foreground/60 mt-1">Today</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-400">
              {list.filter(j => j.status === "completed").length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Done</p>
          </div>
        </div>
      )}

      {/* ── Alerts (office only) ── */}
      {isOffice && <LowRatingAlerts jobs={list} />}

      {/* ── Field worker diary ── */}
      {!isOffice && <FieldWorkerTabs jobs={list} />}

      {/* ── Office job table ── */}
      {isOffice && (
        <>
          {!list.length && <EmptyState isOffice />}
          {list.length > 0 && <JobSearchTable jobs={list} />}
        </>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
    </svg>
  );
}

