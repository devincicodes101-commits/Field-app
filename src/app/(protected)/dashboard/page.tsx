import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, type Job, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldWorkerTabs } from "@/components/dashboard/field-worker-tabs";
import { LowRatingAlerts } from "@/components/dashboard/low-rating-alerts";

/* ── Status maps ── */
const STATUS_BORDER: Record<Job["status"], string> = {
  quote_sent:  "border-l-sky-400",
  accepted:    "border-l-teal-500",
  scheduled:   "border-l-amber-400",
  in_progress: "border-l-indigo-500",
  completed:   "border-l-emerald-500",
  cancelled:   "border-l-rose-400",
};

const STATUS_PILL_BG: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-100 text-sky-700 border border-sky-200",
  accepted:    "bg-teal-100 text-teal-700 border border-teal-200",
  scheduled:   "bg-amber-100 text-amber-700 border border-amber-200",
  in_progress: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  completed:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled:   "bg-rose-100 text-rose-700 border border-rose-200",
};

const STATUS_DOT: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-400",
  accepted:    "bg-teal-500",
  scheduled:   "bg-amber-400",
  in_progress: "bg-indigo-500",
  completed:   "bg-emerald-500",
  cancelled:   "bg-rose-400",
};

const STATUS_CARD_TINT: Record<Job["status"], string> = {
  quote_sent:  "from-sky-50/60",
  accepted:    "from-teal-50/60",
  scheduled:   "from-amber-50/60",
  in_progress: "from-indigo-50/60",
  completed:   "from-emerald-50/60",
  cancelled:   "from-rose-50/60",
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
    return `Today · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
    ` · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function greet(name: string) {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]}`;
}

/* ── Gradient stat card ── */
function StatCard({
  label,
  value,
  gradient,
  icon,
  sub,
}: {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden text-white shadow-md"
      style={{ background: gradient }}
    >
      {/* Watermark icon */}
      <div className="absolute -right-3 -bottom-4 opacity-[0.12] scale-[2.4] pointer-events-none">
        {icon}
      </div>

      {/* Content */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">
        {label}
      </p>
      <p className="text-4xl font-black leading-none">{value}</p>
      {sub && (
        <p className="text-[11px] text-white/55 mt-1.5 font-medium">{sub}</p>
      )}

      {/* Icon badge top right */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

/* ── Job card ── */
function JobCard({ job, showClient }: { job: Job; showClient: boolean }) {
  const today = isToday(job.scheduled_date);

  return (
    <Link href={`/jobs/${job.id}`} className="group block h-full">
      <div
        className={cn(
          "relative bg-white rounded-2xl border border-slate-200 border-l-[5px] h-full flex flex-col",
          "shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden",
          STATUS_BORDER[job.status]
        )}
      >
        {/* Subtle status tint gradient at top */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent pointer-events-none",
            STATUS_CARD_TINT[job.status]
          )}
        />

        {/* Header */}
        <div className="relative p-5 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {today && (
              <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                <span className="w-1 h-1 rounded-full bg-white/70 animate-pulse" />
                Today
              </span>
            )}
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
              {job.title}
            </h3>
            {showClient && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">{job.client_name}</p>
            )}
          </div>

          {/* Status pill */}
          <div
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
              STATUS_PILL_BG[job.status]
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[job.status])} />
            {JOB_STATUS_LABELS[job.status]}
          </div>
        </div>

        {/* Meta */}
        <div className="relative px-5 pb-4 space-y-2 flex-1">
          <MetaItem icon={<PinIcon />} text={job.address} />
          <MetaItem
            icon={<CalIcon />}
            text={formatScheduled(job.scheduled_date)}
            highlight={today}
          />
          {job.total_value != null && (
            <MetaItem
              icon={<PoundIcon />}
              text={`£${job.total_value.toLocaleString("en-GB", { minimumFractionDigits: 2 })} + VAT`}
            />
          )}
          {job.assigned_team && (
            <MetaItem icon={<TeamIcon />} text={job.assigned_team} />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-b-2xl">
          <span className="text-[11px] text-slate-400 font-medium">
            {job.completed_at
              ? `Completed ${new Date(job.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              : job.scheduled_date
                ? formatScheduled(job.scheduled_date)
                : "Awaiting schedule"}
          </span>
          <div className="w-6 h-6 rounded-full bg-slate-200 group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
            <ChevronIcon className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MetaItem({
  icon,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 shrink-0 mt-px">{icon}</span>
      <span className={cn("text-xs leading-snug", highlight ? "text-indigo-600 font-semibold" : "text-slate-600")}>
        {text}
      </span>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ isOffice }: { isOffice: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5 text-4xl shadow-inner">
        📋
      </div>
      <h3 className="font-extrabold text-slate-800 text-xl">
        {isOffice ? "No jobs yet" : "No jobs assigned to you yet"}
      </h3>
      <p className="text-slate-500 text-sm mt-2 max-w-xs leading-relaxed">
        {isOffice
          ? "Create your first job to get the workflow started."
          : "Jobs will appear here once assigned to your team."}
      </p>
      {isOffice && (
        <Button render={<Link href="/jobs/new" />} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold px-6">
          + Create first job
        </Button>
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
    .order("scheduled_date", { ascending: true, nullsFirst: false });

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
    <div className="space-y-7">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
            {isOffice ? greet(profile.full_name || "there") : "My diary"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isOffice
              ? `${stats.inProgress} job${stats.inProgress !== 1 ? "s" : ""} in progress · ${todayCount} today`
              : `${list.length} job${list.length !== 1 ? "s" : ""} assigned · ${todayCount} today`}
          </p>
        </div>
        {isOffice && (
          <Button
            render={<Link href="/jobs/new" />}
            className="shrink-0 h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold text-sm px-5"
          >
            + New job
          </Button>
        )}
      </div>

      {/* ── Stat cards ── */}
      {isOffice && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total jobs"
            value={stats.total}
            gradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)"
            icon={<GridIcon />}
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            gradient="linear-gradient(135deg, #4338ca 0%, #818cf8 100%)"
            icon={<PlayIcon />}
            sub={stats.inProgress > 0 ? "Active on site" : "None active"}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            gradient="linear-gradient(135deg, #059669 0%, #34d399 100%)"
            icon={<CheckIcon />}
            sub={stats.completed > 0 ? "Invoiced & done" : "None yet"}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            gradient="linear-gradient(135deg, #d97706 0%, #fbbf24 100%)"
            icon={<ClockIcon />}
            sub={stats.pending > 0 ? "Awaiting start" : "Clear"}
          />
        </div>
      )}

      {/* ── Field worker mini stat ── */}
      {!isOffice && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-slate-900">{list.length}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Total</p>
          </div>
          <div className="bg-indigo-600 rounded-2xl shadow-md p-4 text-center">
            <p className="text-2xl font-black text-white">{todayCount}</p>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">Today</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-black text-emerald-600">
              {list.filter(j => j.status === "completed").length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Done</p>
          </div>
        </div>
      )}

      {/* ── Low-rating alerts (office only) ── */}
      {isOffice && <LowRatingAlerts jobs={list} />}

      {/* ── Field worker: tabbed diary ── */}
      {!isOffice && <FieldWorkerTabs jobs={list} />}

      {/* ── Office: jobs grid ── */}
      {isOffice && (
        <>
          {/* Divider with count */}
          {list.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                {`${list.length} job${list.length !== 1 ? "s" : ""}`}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}
          {!list.length && <EmptyState isOffice={isOffice} />}
          {list.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map(job => (
                <JobCard key={job.id} job={job} showClient={isOffice} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Icons ── */
function PinIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PoundIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 8a3 3 0 10-6 0v5H7m2 0h6m-6 4h8" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

function GridIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
