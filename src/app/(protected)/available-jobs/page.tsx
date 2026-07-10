import { createClient } from "@/lib/supabase/server";
import type { Job, JobBid } from "@/lib/types";
import { AvailableJobsClient } from "./client";
import { redirect } from "next/navigation";

function extractPostcodeArea(address: string): string {
  const match = address.match(/\b([A-Z]{1,2})\d/i);
  return match ? match[1].toUpperCase() : "";
}

export default async function AvailableJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role === "office") redirect("/dashboard");

  // Get contractor's coverage settings
  const { data: contractor } = await supabase
    .from("contractors")
    .select("coverage_type, coverage_radius_miles, coverage_postcodes")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .in("status", ["accepted", "scheduled"])
    .eq("assignment_type", "auction")
    .is("assigned_team", null)
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  const { data: bids } = await supabase
    .from("job_bids")
    .select("*")
    .in("job_id", (jobs ?? []).map(j => j.id));

  let filteredJobs = (jobs ?? []) as Job[];

  // Coverage area filtering
  if (contractor && contractor.coverage_type === "postcode_list" && contractor.coverage_postcodes) {
    const allowed = contractor.coverage_postcodes
      .split(",")
      .map((p: string) => p.trim().toUpperCase())
      .filter(Boolean);
    filteredJobs = filteredJobs.filter((j) => {
      const area = extractPostcodeArea(j.address);
      return allowed.some((a: string) => area.startsWith(a) || a.startsWith(area));
    });
  }
  // national or radius: show all (radius would need geocoding)

  const bidsByJob: Record<string, JobBid[]> = {};
  for (const bid of (bids ?? []) as JobBid[]) {
    if (!bidsByJob[bid.job_id]) bidsByJob[bid.job_id] = [];
    bidsByJob[bid.job_id].push(bid);
  }

  return (
    <AvailableJobsClient
      jobs={filteredJobs}
      bidsByJob={bidsByJob}
      currentUserId={user.id}
    />
  );
}
