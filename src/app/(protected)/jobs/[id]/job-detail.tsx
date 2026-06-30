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
  completeJob,
} from "./actions";
import type {
  Job,
  JobMessage,
  JobPhoto,
  ExtraWorkRequest,
  Profile,
  JobStatus,
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

type PhotoWithUrl = JobPhoto & { signedUrl: string | null };

const STATUS_OPTIONS: JobStatus[] = [
  "quote_sent",
  "accepted",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

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
}: {
  job: Job;
  profile: Profile;
  messages: JobMessage[];
  photos: PhotoWithUrl[];
  extraWork: ExtraWorkRequest[];
  contractors: { user_id: string; company_name: string }[];
}) {
  const router = useRouter();
  const isOffice = profile.role === "office";
  const isAssignedContractor = profile.role === "contractor" && job.contractor_id === profile.id;

  const referencePhotos = photos.filter((p) => p.kind === "client_reference");
  const completionPhotos = photos.filter((p) => p.kind === "completion");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{job.address}</p>
          </div>
          <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Client</p>
            <p>{job.client_name}</p>
            {job.client_email && <p className="text-muted-foreground">{job.client_email}</p>}
            {job.client_phone && <p className="text-muted-foreground">{job.client_phone}</p>}
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Scheduled</p>
            <p>{formatDate(job.scheduled_date)}</p>
            {job.total_value != null && (
              <p className="text-muted-foreground">Quoted: £{job.total_value.toFixed(2)}</p>
            )}
          </div>

          {isOffice && (
            <div className="space-y-1.5 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Status</p>
                <Select
                  value={job.status}
                  onValueChange={async (v) => {
                    const result = await updateJobStatus(job.id, v as JobStatus);
                    if (result && "error" in result) toast.error(result.error);
                    else router.refresh();
                  }}
                >
                  <SelectTrigger className="w-full">
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
                <p className="text-sm text-muted-foreground">Contractor</p>
                <Select
                  value={job.contractor_id ?? "none"}
                  onValueChange={async (v) => {
                    const result = await assignContractor(job.id, v === "none" ? null : v);
                    if (result && "error" in result) toast.error(result.error);
                    else router.refresh();
                  }}
                >
                  <SelectTrigger className="w-full">
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
            </div>
          )}

          {isAssignedContractor && (
            <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2 border-t">
              <RescheduleDialog jobId={job.id} currentDate={job.scheduled_date} />
              {job.status !== "completed" && (
                <CompleteJobDialog jobId={job.id} hasCompletionPhoto={completionPhotos.length > 0} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="extra-work">Extra work</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <MessagesPanel jobId={job.id} messages={messages} />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosPanel
            jobId={job.id}
            referencePhotos={referencePhotos}
            completionPhotos={completionPhotos}
            canUploadCompletion={isAssignedContractor}
          />
        </TabsContent>

        <TabsContent value="extra-work">
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

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {!messages.length && (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {m.sender_name} · {m.sender_role}
                </span>
                <span>{formatDate(m.created_at)}</span>
              </div>
              <p className="mt-1 text-sm">{m.body}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message..."
            rows={2}
          />
          <Button onClick={handleSend} disabled={sending}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

    const path = `${jobId}/completion-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(path, file);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client reference photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGrid photos={referencePhotos} empty="No photos uploaded by the client yet." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PhotoGrid photos={completionPhotos} empty="No completion photos yet." />
          {canUploadCompletion && (
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCompletionPhoto(file);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoGrid({ photos, empty }: { photos: PhotoWithUrl[]; empty: string }) {
  if (!photos.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {photos.map((p) =>
        p.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.signedUrl}
            alt={p.caption ?? "Job photo"}
            className="aspect-square rounded-md border object-cover"
          />
        ) : null
      )}
    </div>
  );
}

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
    const result = await requestExtraWork({ job_id: jobId, description, amount: Number(amount) });
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

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {!requests.length && (
          <p className="text-sm text-muted-foreground">No extra work requested.</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">£{r.amount.toFixed(2)}</p>
              <Badge
                variant={
                  r.status === "approved"
                    ? "default"
                    : r.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {r.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{r.description}</p>
            {canDecide && r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleDecide(r.id, "approved")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecide(r.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}

        {canRequest && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Request extra work</p>
            <Textarea
              placeholder="What extra work is needed?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Amount (£)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || !description.trim() || !amount}
            >
              Submit request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={handleSubmit} disabled={submitting || !newDate} className="w-full">
            Confirm new date
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompleteJobDialog({
  jobId,
  hasCompletionPhoto,
}: {
  jobId: string;
  hasCompletionPhoto: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const result = await completeJob(jobId, notes);
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
      <DialogTrigger render={<Button size="sm" />}>Mark complete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete job</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!hasCompletionPhoto && (
            <p className="text-sm text-destructive">
              Add at least one completion photo in the Photos tab first.
            </p>
          )}
          <Textarea
            placeholder="Completion notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasCompletionPhoto}
            className="w-full"
          >
            Confirm completion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
