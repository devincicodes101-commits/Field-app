"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { coverageCoversAddress } from "@/lib/geocode";

export async function selfAssignJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  if (!profile?.full_name) return { error: "Profile not found" };

  const { error } = await supabase
    .from("jobs")
    .update({ assigned_team: profile.full_name, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .is("assigned_team", null);

  if (error) return { error: error.message };
  revalidatePath("/available-jobs");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function placeBid(jobId: string, amount: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile?.full_name) return { error: "Profile not found" };
  if (profile.role !== "contractor") return { error: "Only contractors can bid on jobs" };

  // Check auction is still live
  const { data: job } = await supabase
    .from("jobs")
    .select("address, postcode, auction_ends_at, auction_start_bid")
    .eq("id", jobId)
    .single();

  if (!job) return { error: "Job not found" };
  if (!job.auction_ends_at || new Date(job.auction_ends_at) <= new Date()) {
    return { error: "This auction has already ended" };
  }

  // Enforce coverage — a contractor can't bid on a job outside their area
  const { data: coverage } = await supabase
    .from("contractors")
    .select("coverage_type, coverage_radius_miles, coverage_postcodes, postcode")
    .eq("user_id", user.id)
    .maybeSingle();
  if (coverage && !(await coverageCoversAddress(coverage, job.postcode || job.address))) {
    return { error: "This job is outside your coverage area" };
  }

  // Check bid is above current highest
  const { data: topBid } = await supabase
    .from("job_bids")
    .select("amount")
    .eq("job_id", jobId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const floor = topBid ? topBid.amount : (job.auction_start_bid ?? 0);
  if (amount <= floor) {
    return { error: `Your bid must be above £${floor.toFixed(2)}` };
  }

  const { error } = await supabase.from("job_bids").insert({
    job_id: jobId,
    contractor_id: user.id,
    contractor_name: profile.full_name,
    amount,
  });

  if (error) return { error: error.message };
  revalidatePath("/available-jobs");
  return { ok: true };
}
