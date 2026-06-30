"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Job, JobMessage, JobPhoto, JobStatus } from "@/lib/types";
import { JOB_STATUS_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PhotoWithUrl = JobPhoto & { signedUrl: string | null };

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

const CAN_UPLOAD: JobStatus[] = ["accepted", "scheduled", "in_progress", "completed"];

export function ClientPortal({
  token,
  job,
  messages,
  photos,
}: {
  token: string;
  job: Job;
  messages: JobMessage[];
  photos: PhotoWithUrl[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const canUpload = CAN_UPLOAD.includes(job.status);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/client/${token}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to send message");
      return;
    }
    setBody("");
    router.refresh();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch(`/api/client/${token}/photo`, { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to upload photo");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{job.address}</p>
          </div>
          <Badge>{JOB_STATUS_LABELS[job.status]}</Badge>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Scheduled: {formatDate(job.scheduled_date)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos for the job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload photos so whoever attends the job knows what to expect.
          </p>
          {!photos.length && (
            <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) =>
              p.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id}
                  src={p.signedUrl}
                  alt="Job reference"
                  className="aspect-square rounded-md border object-cover"
                />
              ) : null
            )}
          </div>
          {canUpload ? (
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Photos can be added once your quote is accepted.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {!messages.length && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {m.sender_role === "client" ? "You" : m.sender_name}
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
              placeholder="Message the office or contractor..."
              rows={2}
            />
            <Button onClick={handleSend} disabled={sending}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
