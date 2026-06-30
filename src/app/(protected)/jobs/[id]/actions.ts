"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  messageInsertSchema,
  extraWorkInsertSchema,
  rescheduleInsertSchema,
  type MessageInsert,
  type ExtraWorkInsert,
  type RescheduleInsert,
} from "@/lib/schemas/jobs";
import type { JobStatus } from "@/lib/types";

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  return { supabase, user, profile };
}

export async function sendMessage(values: MessageInsert) {
  const parsed = messageInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message" };

  const { supabase, user, profile } = await requireProfile();

  const { error } = await supabase.from("job_messages").insert({
    job_id: parsed.data.job_id,
    sender_role: profile.role,
    sender_id: user.id,
    sender_name: profile.full_name || profile.email,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${parsed.data.job_id}`);
}

export async function requestExtraWork(values: ExtraWorkInsert) {
  const parsed = extraWorkInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request" };

  const { supabase, user, profile } = await requireProfile();
  if (profile.role !== "contractor") return { error: "Only contractors can request extra work" };

  const { error } = await supabase.from("extra_work_requests").insert({
    job_id: parsed.data.job_id,
    contractor_id: user.id,
    description: parsed.data.description,
    amount: parsed.data.amount,
  });

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${parsed.data.job_id}`);
}

export async function decideExtraWork(
  requestId: string,
  jobId: string,
  decision: "approved" | "rejected"
) {
  const { supabase, user, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can decide on extra work" };

  const { error } = await supabase
    .from("extra_work_requests")
    .update({ status: decision, decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

// Default (unconfirmed by Paul): contractor can move the job directly, no client approval.
export async function rescheduleJob(values: RescheduleInsert, oldDate: string | null) {
  const parsed = rescheduleInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid date" };

  const { supabase, user } = await requireProfile();

  const { error: logError } = await supabase.from("job_reschedules").insert({
    job_id: parsed.data.job_id,
    old_date: oldDate,
    new_date: parsed.data.new_date,
    changed_by: user.id,
    reason: parsed.data.reason || null,
  });
  if (logError) return { error: logError.message };

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ scheduled_date: parsed.data.new_date, status: "scheduled" })
    .eq("id", parsed.data.job_id);
  if (jobError) return { error: jobError.message };

  revalidatePath(`/jobs/${parsed.data.job_id}`);
}

export async function assignContractor(jobId: string, contractorUserId: string | null) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can assign contractors" };

  const { error } = await supabase
    .from("jobs")
    .update({ contractor_id: contractorUserId })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can change job status" };

  const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

// Default (unconfirmed by Paul): requires >=1 completion photo, enforced again
// by a DB trigger (see 20260630000009_job_completion_guard.sql) in case this is bypassed.
export async function completeJob(jobId: string, notes: string) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "contractor") return { error: "Only the assigned contractor can complete a job" };

  const { count } = await supabase
    .from("job_photos")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId)
    .eq("kind", "completion");

  if (!count) {
    return { error: "Add at least one completion photo before marking the job done" };
  }

  const { error } = await supabase
    .from("jobs")
    .update({ status: "completed", completion_notes: notes || null })
    .eq("id", jobId);

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}
