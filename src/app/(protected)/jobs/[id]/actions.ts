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
import { sendQuoteEmailToClient, sendMessageNotificationToClient } from "@/lib/email";
import { notify } from "@/lib/notify";
import { coverageCoversAddress } from "@/lib/geocode";

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

  const senderName = profile.full_name || profile.email;

  const { error } = await supabase.from("job_messages").insert({
    job_id: parsed.data.job_id,
    sender_role: profile.role,
    sender_id: user.id,
    sender_name: senderName,
    body: parsed.data.body,
  });

  if (error) return { error: error.message };

  // Email the client a notification so they know to check their portal
  const { data: job } = await supabase
    .from("jobs")
    .select("title, client_name, client_email, client_access_token")
    .eq("id", parsed.data.job_id)
    .single();

  if (job?.client_email) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const portalUrl = `${baseUrl}/client/${job.client_access_token}`;
    // Fire and forget — don't block the message send if email fails
    sendMessageNotificationToClient({
      clientName: job.client_name,
      clientEmail: job.client_email,
      senderName,
      jobTitle: job.title,
      messageBody: parsed.data.body,
      portalUrl,
    }).catch(() => null);
  }

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

  const { supabase, user, profile } = await requireProfile();

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

  // Auto-post to job thread so office sees the change without manually checking
  const newDateStr = new Date(parsed.data.new_date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const autoMsg = parsed.data.reason
    ? `Job rescheduled to ${newDateStr}. Reason: ${parsed.data.reason}`
    : `Job rescheduled to ${newDateStr}.`;
  await supabase.from("job_messages").insert({
    job_id: parsed.data.job_id,
    sender_role: profile.role,
    sender_id: user.id,
    sender_name: profile.full_name || profile.email,
    body: `[Reschedule] ${autoMsg}`,
  });

  revalidatePath(`/jobs/${parsed.data.job_id}`);
  revalidatePath("/dashboard");
}

export async function sendQuoteEmail(jobId: string) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can send quote emails" };

  const { data: job } = await supabase
    .from("jobs")
    .select("title, address, client_name, client_email, client_access_token, total_value")
    .eq("id", jobId)
    .single();

  if (!job) return { error: "Job not found" };
  if (!job.client_email) return { error: "This job has no client email address" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const portalUrl = `${baseUrl}/client/${job.client_access_token}`;

  const net = Number(job.total_value ?? 0);
  const vat = net * 0.2;
  const total = net + vat;
  const quoteNumber = "QT-" + String(job.client_access_token).slice(0, 8).toUpperCase();

  try {
    await sendQuoteEmailToClient({
      clientName: job.client_name,
      clientEmail: job.client_email,
      jobTitle: job.title,
      portalUrl,
      quoteNumber,
      address: job.address,
      netAmount: net,
      vatAmount: vat,
      totalAmount: total,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

export async function assignContractor(jobId: string, contractorUserId: string | null) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can assign contractors" };

  const { error } = await supabase
    .from("jobs")
    .update({ contractor_id: contractorUserId })
    .eq("id", jobId);
  if (error) return { error: error.message };

  if (contractorUserId) {
    const { data: job } = await supabase.from("jobs").select("title").eq("id", jobId).single();
    await notify([contractorUserId], {
      title: "New job assigned",
      body: job?.title ? `You've been assigned "${job.title}".` : "You've been assigned a job.",
      link: `/jobs/${jobId}`,
    });
  }
  revalidatePath(`/jobs/${jobId}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can change job status" };

  const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

export async function startJob(jobId: string) {
  const { supabase, profile } = await requireProfile();
  if (profile.role === "office") return { error: "Only field staff can start jobs" };

  const { error } = await supabase
    .from("jobs")
    .update({ status: "in_progress" })
    .eq("id", jobId);

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

export async function setAssignmentType(jobId: string, type: "operative" | "contractor" | "auction") {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can change assignment type" };

  const { error } = await supabase
    .from("jobs")
    .update({ assignment_type: type })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/available-jobs");
}

export async function setContractorPercentage(jobId: string, percentage: number) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can set contractor percentage" };
  if (percentage < 0 || percentage > 100) return { error: "Percentage must be 0–100" };

  const { error } = await supabase
    .from("jobs")
    .update({ contractor_percentage: percentage })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

export async function openAuction(jobId: string, startBid: number) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can open an auction" };
  if (startBid <= 0) return { error: "Starting bid must be greater than zero" };

  const endsAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("jobs")
    .update({ assignment_type: "auction", auction_start_bid: startBid, auction_ends_at: endsAt })
    .eq("id", jobId);
  if (error) return { error: error.message };

  // Notify every contractor whose coverage area includes this job.
  const { data: job } = await supabase.from("jobs").select("title, address, postcode").eq("id", jobId).single();
  if (job) {
    const { data: contractors } = await supabase
      .from("contractors")
      .select("user_id, coverage_type, coverage_radius_miles, coverage_postcodes, postcode");
    const matches: string[] = [];
    for (const c of contractors ?? []) {
      if (await coverageCoversAddress(c, job.postcode || job.address)) matches.push(c.user_id);
    }
    await notify(matches, {
      title: "New job up for auction",
      body: `"${job.title}" is open for bidding (start £${startBid.toFixed(2)}).`,
      link: "/available-jobs",
    });
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/available-jobs");
}

export async function assignTeam(jobId: string, teamName: string | null) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== "office") return { error: "Only office can assign teams" };

  const { error } = await supabase
    .from("jobs")
    .update({ assigned_team: teamName || null })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidatePath(`/jobs/${jobId}`);
}

export async function submitCompletion(payload: {
  jobId: string;
  netAmount: number;
  vatRate: number;
  signature: string;
  satisfaction: string;
  starRating: number;
  feedback: string;
  additionalComments?: string;
  photoStoragePaths: string[];
  videoUrl?: string;
  receipts: Array<{
    storagePath: string;
    amount: number;
    description: string;
    purchaseDate: string;
  }>;
}) {
  const { supabase, user, profile } = await requireProfile();
  if (profile.role === "office") return { error: "Office cannot submit job completions" };

  const vatAmount = payload.netAmount * (payload.vatRate / 100);
  const totalAmount = payload.netAmount + vatAmount;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      job_id: payload.jobId,
      net_amount: payload.netAmount,
      vat_rate: payload.vatRate / 100, // column is a fraction (numeric(5,4)): 20% -> 0.20
      vat_amount: vatAmount,
      total_amount: totalAmount,
      status: "draft",
      created_by: user.id,
    })
    .select("id, invoice_number")
    .single();

  if (invoiceError) return { error: invoiceError.message };

  const { error: completionError } = await supabase.from("job_completions").insert({
    job_id: payload.jobId,
    invoice_id: invoice.id,
    completed_by: user.id,
    operative_name: profile.full_name,
    customer_signature: payload.signature || null,
    customer_satisfaction: payload.satisfaction,
    star_rating: payload.starRating,
    feedback: payload.feedback,
    additional_comments: payload.additionalComments || null,
    before_after_photos: payload.photoStoragePaths,
    video_url: payload.videoUrl ?? null,
    completed_at: new Date().toISOString(),
  });

  if (completionError) return { error: completionError.message };

  if (payload.photoStoragePaths.length > 0) {
    await supabase.from("job_photos").insert(
      payload.photoStoragePaths.map((path) => ({
        job_id: payload.jobId,
        kind: "completion",
        uploaded_by: user.id,
        uploaded_by_name: profile.full_name,
        storage_path: path,
      }))
    );
  }

  if (payload.receipts.length > 0) {
    const { error: receiptsError } = await supabase.from("receipts").insert(
      payload.receipts.map((r) => ({
        job_id: payload.jobId,
        submitted_by: user.id,
        operative_name: profile.full_name,
        storage_path: r.storagePath,
        amount: r.amount,
        description: r.description,
        purchase_date: r.purchaseDate || null,
      }))
    );
    if (receiptsError) return { error: receiptsError.message };
  }

  const { error: jobError } = await supabase
    .from("jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", payload.jobId);

  if (jobError) return { error: jobError.message };

  revalidatePath(`/jobs/${payload.jobId}`);
  return { invoiceNumber: invoice.invoice_number as string };
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
