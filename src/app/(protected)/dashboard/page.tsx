import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, type Job, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Status colour maps ── */
const STATUS_LEFT_BORDER: Record<Job["status"], string> = {
  quote_sent:  "border-l-sky-400",
  accepted:    "border-l-teal-400",
  scheduled:   "border-l-amber-400",
  in_progress: "border-l-indigo-500",
  completed:   "border-l-emerald-500",
  cancelled:   "border-l-red-400",
};

const STATUS_DOT: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-400",
  accepted:    "bg-teal-400",
  scheduled:   "bg-amber-400",
  in_progress: "bg-indigo-500",
  completed:   "bg-emerald-500",
  cancelled:   "bg-red-400",
};

const STATUS_TEXT: Record<Job["status"], string> = {
  quote_sent:  "text-sky-700",
  accepted:    "text-teal-700",
  scheduled:   "text-amber-700",
  in_progress: "text-indigo-700",
  completed:   "text-emerald-700",
  cancelled:   "text-red-600",
};

const STATUS_BG: Record<Job["status"], string> = {
  quote_sent:  "bg-sky-50",
  accepted:    "bg-teal-50",
  scheduled:   "bg-amber-50",
  in_progress: "bg-indigo-50",
  completed:   "bg-emerald-50",
  cancelled:   "bg-red-50",
};

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function greet(name: string) {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name.split(" ")[0]}`;
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Job card ── */
function JobCard({ job, showClient }: { job: Job; showClient: boolean }) {
  return (
    <Link href={`/jobs/${job.id}`} className="group block">
      <div
        className={cn(
          "bg-white rounded-2xl border border-slate-200 border-l-4 shadow-sm",
          "hover:shadow-md hover:border-slate-300 transition-all duration-150",
          "h-full flex flex-col",
          STATUS_LEFT_BORDER[job.status]
        )}
      >
        {/* Top */}
        <div className="p-5 flex-1 space-y-3">
          {/* Status pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              STATUS_BG[job.status],
              STATUS_TEXT[job.status]
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[job.status])} />
            {JOB_STATUS_LABELS[job.status]}
          </div>

          {/* Title */}
          <div>
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-indigo-700 transition-colors">
              {job.title}
            </h3>
            {showClient && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{job.client_name}</p>
            )}
          </div>

          {/* Meta rows */}
          <div className="space-y-1.5">
            <MetaRow icon={<MapPinIcon />} text={job.address} />
            {job.scheduled_date ? (
              <MetaRow
                icon={<CalendarIcon />}
                text={`${formatDate(job.scheduled_date)}${formatTime(job.scheduled_date) ? ` · ${formatTime(job.scheduled_date)}` : ""}`}
              />
            ) : (
              <MetaRow icon={<CalendarIcon />} text="Not scheduled" muted />
            )}
            {job.total_value != null && (
              <MetaRow
                icon={<PoundIcon />}
                text={`£${job.total_value.toLocaleString("en-GB", { minimumFractionDigits: 2 })} + VAT`}
              />
            )}
            {job.assigned_team && (
              <MetaRow icon={<TeamIcon />} text={job.assigned_team} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {job.completed_at
              ? `Done ${formatDate(job.completed_at)}`
              : job.scheduled_date
                ? `Scheduled ${formatDate(job.scheduled_date)}`
                : "Awaiting schedule"}
          </span>
          <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function MetaRow({
  icon,
  text,
  muted,
}: {
  icon: React.ReactNode;
  text: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 shrink-0 mt-px">{icon}</span>
      <span className={cn("text-xs leading-snug", muted ? "text-slate-400" : "text-slate-600")}>
        {text}
      </span>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ isOffice }: { isOffice: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-3xl">
        📋
      </div>
      <h3 className="font-bold text-slate-800 text-lg">
        {isOffice ? "No jobs yet" : "No jobs assigned to you yet"}
      </h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs">
        {isOffice
          ? "Create your first job to get started."
          : "Jobs assigned to you will appear here."}
      </p>
      {isOffice && (
        <Button render={<Link href="/jobs/new" />} className="mt-5">
          Create first job
        </Button>
      )}
    </div>
  );
}

/* ── Page ── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  const query = supabase
    .from("jobs")
    .select("*")
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  const filteredQuery =
    profile.role === "contractor"
      ? query.eq("contractor_id", user.id)
      : profile.role === "operative"
        ? query.eq("assigned_team", profile.full_name)
        : query;

  const { data: jobs } = await filteredQuery.returns<Job[]>();

  const isOffice = profile.role === "office";
  const list = jobs ?? [];

  /* Stats for office */
  const stats = {
    total:      list.length,
    inProgress: list.filter((j) => j.status === "in_progress").length,
    completed:  list.filter((j) => j.status === "completed").length,
    pending:    list.filter((j) => ["quote_sent", "accepted", "scheduled"].includes(j.status)).length,
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isOffice ? greet(profile.full_name || "there") : "My diary"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isOffice
              ? `You have ${stats.inProgress} job${stats.inProgress !== 1 ? "s" : ""} in progress`
              : `${list.length} job${list.length !== 1 ? "s" : ""} assigned to you`}
          </p>
        </div>
        {isOffice && (
          <Button
            render={<Link href="/jobs/new" />}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-bold"
          >
            + New job
          </Button>
        )}
      </div>

      {/* ── Stats strip (office only) ── */}
      {isOffice && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total jobs"
            value={stats.total}
            color="bg-slate-100 text-slate-600"
            icon={<GridIcon />}
          />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            color="bg-indigo-100 text-indigo-600"
            icon={<PlayIcon />}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="bg-emerald-100 text-emerald-600"
            icon={<CheckIcon />}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="bg-amber-100 text-amber-600"
            icon={<ClockIcon />}
          />
        </div>
      )}

      {/* ── Section divider ── */}
      {isOffice && list.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            All jobs
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!list.length && <EmptyState isOffice={isOffice} />}

      {/* ── Job grid ── */}
      {list.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((job) => (
            <JobCard key={job.id} job={job} showClient={isOffice} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SVG icon helpers ── */
function MapPinIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon() {
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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