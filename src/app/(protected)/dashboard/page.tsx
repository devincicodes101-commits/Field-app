import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, type Job, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldWorkerTabs } from "@/components/dashboard/field-worker-tabs";
import { LowRatingAlerts } from "@/components/dashboard/low-rating-alerts";

/* ── Status tokens ── */
const STATUS_DOT: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-400",
  accepted:    "bg-teal-400",
  scheduled:   "bg-amber-400",
  in_progress: "bg-primary shadow-[0_0_8px_oklch(0.56_0.24_266/0.7)]",
  completed:   "bg-emerald-400",
  cancelled:   "bg-rose-400",
};

const STATUS_TEXT: Record<Job["status"], string> = {
  quote_sent:  "text-sky-400",
  accepted:    "text-teal-400",
  scheduled:   "text-amber-400",
  in_progress: "text-primary",
  completed:   "text-emerald-400",
  cancelled:   "text-rose-400",
};

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

function formatScheduled(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const time = d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  if (isToday(value)) {
    return `Today · ${time}`;
  }
  return d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }) +
    ` · ${time}`;
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

/* ── Job row ── */
function JobRow({ job, showClient }: { job: Job; showClient: boolean }) {
  const today = isToday(job.scheduled_date);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0"
    >
      <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[job.status])} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {job.title}
          {today && (
            <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 uppercase tracking-wide">
              Today
            </span>
          )}
        </p>
        {showClient && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{job.client_name}</p>
        )}
      </div>

      <p className="hidden md:block text-xs text-muted-foreground truncate max-w-[170px] shrink-0">
        {job.address}
      </p>

      <p className={cn(
        "hidden sm:block text-xs shrink-0 w-36 text-right",
        today ? "text-primary font-semibold" : "text-muted-foreground"
      )}>
        {formatScheduled(job.scheduled_date)}
      </p>

      {job.total_value != null && (
        <p className="hidden lg:block text-xs font-semibold text-foreground shrink-0 w-24 text-right">
          £{job.total_value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
        </p>
      )}

      <span className={cn("shrink-0 text-xs font-semibold w-20 text-right", STATUS_TEXT[job.status])}>
        {JOB_STATUS_LABELS[job.status]}
      </span>

      <ChevronIcon className="w-4 h-4 text-border group-hover:text-primary shrink-0 transition-colors" />
    </Link>
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
          {list.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Column headings */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-secondary/30">
                <span className="w-2 shrink-0" />
                <span className="flex-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Job</span>
                <span className="hidden md:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[170px] shrink-0">Address</span>
                <span className="hidden sm:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36 text-right shrink-0">Scheduled</span>
                <span className="hidden lg:block text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-24 text-right shrink-0">Value</span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-20 text-right shrink-0">Status</span>
                <span className="w-4 shrink-0" />
              </div>

              {list.map(job => (
                <JobRow key={job.id} job={job} showClient={isOffice} />
              ))}
            </div>
          )}
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}