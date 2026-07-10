import { createClient } from "@supabase/supabase-js";

/**
 * Awards any auction whose countdown has ended to its highest bidder.
 *
 * Runs with the service role (so RLS doesn't block the assignment) and is safe
 * to call on page loads — it only writes when there are ended, un-awarded
 * auctions, and guards against double-awarding with an `assigned_team IS NULL`
 * check. Auctions that ended with no bids are left for the office to re-assign.
 */
export async function settleEndedAuctions(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const nowIso = new Date().toISOString();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("assignment_type", "auction")
    .is("assigned_team", null)
    .not("auction_ends_at", "is", null)
    .lt("auction_ends_at", nowIso);

  if (!jobs?.length) return;

  for (const job of jobs) {
    const { data: top } = await supabase
      .from("job_bids")
      .select("contractor_id, contractor_name")
      .eq("job_id", job.id)
      .order("amount", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!top) continue; // no bids — leave for the office

    await supabase
      .from("jobs")
      .update({ contractor_id: top.contractor_id, assigned_team: top.contractor_name })
      .eq("id", job.id)
      .is("assigned_team", null); // guard against a concurrent award
  }
}
