"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessage,
  requestExtraWork,
  decideExtraWork,
  rescheduleJob,
  updateJobStatus,
  assignContractor,
  assignTeam,
  startJob,
} from "./actions";
import { CompletionWizard } from "@/components/jobs/completion-wizard";
import { ChecklistTab } from "@/components/jobs/checklist-tab";
import { MaterialsTab } from "@/components/jobs/materials-tab";
import { GpsCheckin } from "@/components/jobs/gps-checkin";
import type {
  Job,
  JobMessage,
  JobPhoto,
  ExtraWorkRequest,
  Profile,
  JobStatus,
  ChecklistItem,
  Material,
  JobSiteCheck,
} from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PhotoWithUrl = JobPhoto & { signedUrl: string | null };

const STATUS_OPTIONS: JobStatus[] = [
  "quote_sent",
  "accepted",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

const STATUS_COLORS: Record<JobStatus, string> = {
  quote_sent: "bg-sky-100 text-sky-700 border-sky-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  scheduled: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-indigo-100 text-indigo-700 border-indigo-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold",
        STATUS_COLORS[status]
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function JobDetail({
  job,
  profile,
  messages,
  photos,
  extraWork,
  contractors,
  checklistItems,
  materials,
  siteChecks,
}: {
  job: Job;
  profile: Profile;
  messages: JobMessage[];
  photos: PhotoWithUrl[];
  extraWork: ExtraWorkRequest[];
  contractors: { user_id: string; company_name: string }[];
  checklistItems: ChecklistItem[];
  materials: Material[];
  siteChecks: JobSiteCheck[];
}) {
  const router = useRouter();
  const isOffice = profile.role === "office";
  const isAssignedContractor = profile.role === "contractor" && job.contractor_id === profile.id;
  const isAssignedOperative =
    profile.role === "operative" && job.assigned_team === profile.full_name;
  const isAssignedWorker = isAssignedContractor || isAssignedOperative;

  const referencePhotos = photos.filter((p) => p.kind === "client_reference");
  const completionPhotos = photos.filter((p) => p.kind === "completion");

  return (
    <div className="space-y-5">
      {/* ─── Job Header Card ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Colored top bar based on status */}
        <div
          className="h-1.5"
          style={{
            background:
              job.status === "completed"
                ? "linear-gradient(90deg,#10b981,#34d399)"
                : job.status === "in_progress"
                  ? "linear-gradient(90deg,#4338ca,#818cf8)"
                  : job.status === "cancelled"
                    ? "linear-gradient(90deg,#ef4444,#f87171)"
                    : "linear-gradient(90deg,#f59e0b,#fbbf24)",
          }}
        />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPinIcon />
                {job.address}
              </p>
            </div>
            <StatusPill status={job.status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-2.5">
              <DetailRow label="Client" value={job.client_name} />
              {job.client_email && <DetailRow label="Email" value={job.client_email} />}
              {job.client_phone && <DetailRow label="Phone" value={job.client_phone} />}
            </div>
            <div className="space-y-2.5">
              <DetailRow label="Scheduled" value={formatDate(job.scheduled_date)} />
              {job.total_value != null && (
                <DetailRow label="Job value" value={`£${job.total_value.toFixed(2)} + VAT`} />
              )}
              {job.assigned_team && (
                <DetailRow label="Assigned team" value={job.assigned_team} />
              )}
            </div>
          </div>

          {/* ─── Office controls ─── */}
          {isOffice && (
            <div className="mt-5 pt-4 border-t border-slate-100 grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={job.status}
                  onValueChange={async (v) => {
                    const result = await updateJobStatus(job.id, v as JobStatus);
                    if (result && "error" in result) toast.error(result.error);
                    else router.refresh();
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {JOB_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contractor
                </label>
                <Select
                  value={job.contractor_id ?? "none"}
                  onValueChange={async (v) => {
                    const result = await assignContractor(job.id, v === "none" ? null : v);
                    if (result && "error" in result) toast.error(result.error);
                    else router.refresh();
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {contractors.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AssignTeamField jobId={job.id} currentTeam={job.assigned_team} />
            </div>
          )}

          {/* ─── Field worker action buttons ─── */}
          {isAssignedWorker && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              {job.status === "scheduled" && (
                <StartJobButton jobId={job.id} />
              )}
              {job.status === "in_progress" && (
                <CompletionWizard job={job} />
              )}
              {isAssignedContractor && job.status !== "completed" && (
                <RescheduleDialog jobId={job.id} currentDate={job.scheduled_date} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Certificate link (completed jobs) ─── */}
      {job.status === "completed" && (
        <a
          href={`/jobs/${job.id}/certificate`}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          View & print Certificate of Completion
        </a>
      )}

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="messages">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex-wrap h-auto gap-0.5">
          <TabsTrigger value="messages" className="rounded-lg text-sm">
            Messages
          </TabsTrigger>
          <TabsTrigger value="photos" className="rounded-lg text-sm">
            Photos
          </TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-lg text-sm">
            Checklist
            {checklistItems.length > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full px-1.5">
                {checklistItems.filter(i => i.is_completed).length}/{checklistItems.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg text-sm">
            Materials
            {materials.length > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full px-1.5">
                {materials.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="gps" className="rounded-lg text-sm">
            GPS
          </TabsTrigger>
          <TabsTrigger value="extra-work" className="rounded-lg text-sm">
            Extra work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-3">
          <MessagesPanel jobId={job.id} messages={messages} />
        </TabsContent>

        <TabsContent value="photos" className="mt-3">
          <PhotosPanel
            jobId={job.id}
            referencePhotos={referencePhotos}
            completionPhotos={completionPhotos}
            canUploadCompletion={isAssignedWorker}
          />
        </TabsContent>

        <TabsContent value="checklist" className="mt-3">
          <ChecklistTab jobId={job.id} items={checklistItems} isOffice={isOffice} />
        </TabsContent>

        <TabsContent value="materials" className="mt-3">
          <MaterialsTab jobId={job.id} materials={materials} isOffice={isOffice} />
        </TabsContent>

        <TabsContent value="gps" className="mt-3">
          <GpsCheckin jobId={job.id} checks={siteChecks} />
        </TabsContent>

        <TabsContent value="extra-work" className="mt-3">
          <ExtraWorkPanel
            jobId={job.id}
            requests={extraWork}
            canRequest={isAssignedContractor}
            canDecide={isOffice}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Small helper components ─── */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 shrink-0 w-20">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function StartJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const result = await startJob(jobId);
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Job started!");
      router.refresh();
    }
  }

  return (
    <Button
      onClick={handleStart}
      disabled={loading}
      size="sm"
      className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold shadow-sm gap-1.5"
    >
      <span>▶</span>
      {loading ? "Starting…" : "Start Job"}
    </Button>
  );
}

function AssignTeamField({ jobId, currentTeam }: { jobId: string; currentTeam: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(currentTeam ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await assignTeam(jobId, value.trim() || null);
    setSaving(false);
    if (result && "error" in result) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Assigned team
      </label>
      <div className="flex gap-1.5">
        <Input
          placeholder="Operative name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="bg-slate-50 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0"
        >
          {saving ? "…" : "Set"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Messages panel ─── */

function MessagesPanel({ jobId, messages }: { jobId: string; messages: JobMessage[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    const result = await sendMessage({ job_id: jobId, body });
    setSending(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  const roleColor: Record<string, string> = {
    office: "bg-indigo-100 text-indigo-700",
    contractor: "bg-amber-100 text-amber-700",
    operative: "bg-sky-100 text-sky-700",
    client: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {!messages.length && (
          <p className="text-sm text-slate-400 py-6 text-center">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-800">{m.sender_name}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    roleColor[m.sender_role] ?? "bg-slate-200 text-slate-600"
                  )}
                >
                  {m.sender_role}
                </span>
              </div>
              <span className="text-xs text-slate-400 shrink-0">{formatDate(m.created_at)}</span>
            </div>
            <p className="text-sm text-slate-700">{m.body}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 p-4 flex gap-2.5">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={2}
          className="resize-none bg-slate-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="self-end shrink-0"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

/* ─── Photos panel ─── */

function PhotosPanel({
  jobId,
  referencePhotos,
  completionPhotos,
  canUploadCompletion,
}: {
  jobId: string;
  referencePhotos: PhotoWithUrl[];
  completionPhotos: PhotoWithUrl[];
  canUploadCompletion: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function uploadCompletionPhoto(file: File) {
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${jobId}/completion-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file);
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("job_photos").insert({
      job_id: jobId,
      kind: "completion",
      uploaded_by: user.id,
      storage_path: path,
    });
    setUploading(false);
    if (insertError) {
      toast.error(insertError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <PhotoCard
        title="Client reference photos"
        photos={referencePhotos}
        empty="No photos uploaded by the client yet."
      />
      <PhotoCard
        title="Completion photos"
        photos={completionPhotos}
        empty="No completion photos yet."
      >
        {canUploadCompletion && (
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors mt-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCompletionPhoto(file);
              }}
            />
            <span className="text-xl">📸</span>
            <span className="text-sm font-medium text-slate-600">
              {uploading ? "Uploading…" : "Add completion photo"}
            </span>
          </label>
        )}
      </PhotoCard>
    </div>
  );
}

function PhotoCard({
  title,
  photos,
  empty,
  children,
}: {
  title: string;
  photos: PhotoWithUrl[];
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-3 text-sm">{title}</h3>
      {!photos.length ? (
        <p className="text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) =>
            p.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.signedUrl}
                alt={p.caption ?? "Job photo"}
                className="aspect-square rounded-xl border border-slate-200 object-cover"
              />
            ) : null
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Extra work panel ─── */

function ExtraWorkPanel({
  jobId,
  requests,
  canRequest,
  canDecide,
}: {
  jobId: string;
  requests: ExtraWorkRequest[];
  canRequest: boolean;
  canDecide: boolean;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const result = await requestExtraWork({
      job_id: jobId,
      description,
      amount: Number(amount),
    });
    setSubmitting(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setDescription("");
    setAmount("");
    router.refresh();
  }

  async function handleDecide(id: string, decision: "approved" | "rejected") {
    const result = await decideExtraWork(id, jobId, decision);
    if (result && "error" in result) toast.error(result.error);
    else router.refresh();
  }

  const statusColor = (s: string) =>
    s === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : s === "rejected"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {!requests.length && (
        <p className="text-sm text-slate-400 text-center py-4">No extra work requested.</p>
      )}
      {requests.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">£{r.amount.toFixed(2)}</p>
            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold", statusColor(r.status))}>
              {r.status}
            </span>
          </div>
          <p className="text-sm text-slate-600">{r.description}</p>
          {canDecide && r.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => handleDecide(r.id, "approved")} className="flex-1">
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecide(r.id, "rejected")}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}

      {canRequest && (
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <p className="text-sm font-semibold text-slate-700">Request extra work</p>
          <Textarea
            placeholder="Describe what extra work is needed…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="resize-none bg-slate-50"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Amount (£)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-50"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !description.trim() || !amount}
            className="w-full"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Reschedule dialog ─── */

function RescheduleDialog({
  jobId,
  currentDate,
}: {
  jobId: string;
  currentDate: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!newDate) return;
    setSubmitting(true);
    const result = await rescheduleJob(
      { job_id: jobId, new_date: new Date(newDate).toISOString(), reason },
      currentDate
    );
    setSubmitting(false);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Reschedule
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newDate}
            className="w-full"
          >
            {submitting ? "Saving…" : "Confirm new date"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}