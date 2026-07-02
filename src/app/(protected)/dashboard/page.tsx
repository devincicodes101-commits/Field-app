import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS, type Job, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldWorkerTabs } from "@/components/dashboard/field-worker-tabs";
import { LowRatingAlerts } from "@/components/dashboard/low-rating-alerts";

/* ── Status colour tokens ── */
const STATUS_DOT: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-400",
  accepted:    "bg-teal-500",
  scheduled:   "bg-amber-400",
  in_progress: "bg-blue-500",
  completed:   "bg-emerald-500",
  cancelled:   "bg-rose-400",
};

const STATUS_TEXT: Record<Job["status"], string> = {
  quote_sent:  "text-sky-700",
  accepted:    "text-teal-700",
  scheduled:   "text-amber-700",
  in_progress: "text-blue-700",
  completed:   "text-emerald-700",
  cancelled:   "text-rose-600",
};

/* ── Helpers ── */
function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function formatScheduled(value: string | null) {
  if (!value) return "Not scheduled";
  const d = new Date(value);
  if (isToday(value)) {
    return `Today at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    ` · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function greet(name: string) {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]}`;
}

/* ── Stat card — clean bordered, no gradient ── */
function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <p className={cn("text-3xl font-bold leading-none", accent ?? "text-slate-900")}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}

/* ── Job row — list-style, not card grid ── */
function JobRow({ job, showClient }: { job: Job; showClient: boolean }) {
  const today = isToday(job.scheduled_date);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
    >
      {/* Status dot */}
      <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[job.status])} />

      {/* Title + client */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
          {job.title}
          {today && (
            <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 uppercase tracking-wide">
              Today
            </span>
          )}
        </p>
        {showClient && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{job.client_name}</p>
        )}
      </div>

      {/* Address */}
      <p className="hidden md:block text-xs text-slate-500 truncate max-w-[180px] shrink-0">
        {job.address}
      </p>

      {/* Date */}
      <p className={cn(
        "hidden sm:block text-xs shrink-0 w-36 text-right",
        today ? "text-blue-600 font-semibold" : "text-slate-500"
      )}>
        {formatScheduled(job.scheduled_date)}
      </p>

      {/* Value */}
      {job.total_value != null && (
        <p className="hidden lg:block text-xs font-semibold text-slate-700 shrink-0 w-24 text-right">
          £{job.total_value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
        </p>
      )}

      {/* Status label */}
      <span className={cn(
        "shrink-0 text-xs font-semibold w-20 text-right",
        STATUS_TEXT[job.status]
      )}>
        {JOB_STATUS_LABELS[job.status]}
      </span>

      {/* Arrow */}
      <ChevronIcon className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ isOffice }: { isOffice: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-700 text-base">
        {isOffice ? "No jobs yet" : "No jobs assigned yet"}
      </h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">
        {isOffice
          ? "Create your first job to get the workflow started."
          : "Jobs will appear here once assigned to your team."}
      </p>
      {isOffice && (
        <Link
          href="/jobs/new"
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
        >
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

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isOffice ? greet(profile.full_name || "there") : "My diary"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isOffice
              ? `${stats.inProgress} in progress · ${todayCount} scheduled today`
              : `${list.length} job${list.length !== 1 ? "s" : ""} assigned · ${todayCount} today`}
          </p>
        </div>
        {isOffice && (
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
          >
            <PlusIcon />
            New job
          </Link>
        )}
      </div>

      {/* ── Office stat cards ── */}
      {isOffice && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total jobs"  value={stats.total}      />
          <StatCard label="In progress" value={stats.inProgress} accent="text-blue-600"    sub={stats.inProgress > 0 ? "Active on site" : undefined} />
          <StatCard label="Completed"   value={stats.completed}  accent="text-emerald-600" sub={stats.completed > 0 ? "Invoiced & done" : undefined} />
          <StatCard label="Pending"     value={stats.pending}    accent="text-amber-600"   sub={stats.pending > 0 ? "Awaiting start" : undefined} />
        </div>
      )}

      {/* ── Field worker mini stats ── */}
      {!isOffice && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{list.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total</p>
          </div>
          <div className="bg-blue-600 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{todayCount}</p>
            <p className="text-xs text-blue-200 mt-0.5">Today</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{list.filter(j => j.status === "completed").length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Done</p>
          </div>
        </div>
      )}

      {/* ── Low-rating alerts (office only) ── */}
      {isOffice && <LowRatingAlerts jobs={list} />}

      {/* ── Field worker tabbed diary ── */}
      {!isOffice && <FieldWorkerTabs jobs={list} />}

      {/* ── Office jobs list ── */}
      {isOffice && (
        <>
          {!list.length && <EmptyState isOffice />}
          {list.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className="w-2 shrink-0" />
                <span className="flex-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Job</span>
                <span className="hidden md:block text-[11px] font-semibold text-slate-400 uppercase tracking-wide max-w-[180px] shrink-0">Address</span>
                <span className="hidden sm:block text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-36 text-right shrink-0">Scheduled</span>
                <span className="hidden lg:block text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-24 text-right shrink-0">Value</span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-20 text-right shrink-0">Status</span>
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

/* ── Icons ── */
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