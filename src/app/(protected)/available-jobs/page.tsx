import { createClient } from "@/lib/supabase/server";
import type { Job, JobBid } from "@/lib/types";
import { AvailableJobsClient } from "./client";
import { redirect } from "next/navigation";
import { extractPostcode, geocodePostcode, milesBetween } from "@/lib/geocode";
import { settleEndedAuctions } from "@/lib/settle-auctions";

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

  // Award any auctions whose 5-minute window has elapsed before showing the board.
  await settleEndedAuctions();

  // Get contractor's coverage settings
  const { data: contractor } = await supabase
    .from("contractors")
    .select("coverage_type, coverage_radius_miles, coverage_postcodes, postcode")
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
      const area = extractPostcodeArea(j.postcode || j.address);
      return allowed.some((a: string) => area.startsWith(a) || a.startsWith(area));
    });
  } else if (
    contractor &&
    contractor.coverage_type === "radius" &&
    contractor.coverage_radius_miles &&
    contractor.postcode
  ) {
    // Radius: keep jobs whose postcode is within N miles of the contractor's base.
    const radius = contractor.coverage_radius_miles;
    const center = await geocodePostcode(contractor.postcode);
    if (center) {
      const inRange = await Promise.all(
        filteredJobs.map(async (j) => {
          const pc = j.postcode || extractPostcode(j.address);
          if (!pc) return false;
          const loc = await geocodePostcode(pc);
          return loc ? milesBetween(center, loc) <= radius : false;
        })
      );
      filteredJobs = filteredJobs.filter((_, i) => inRange[i]);
    }
    // If the contractor's base can't be geocoded, leave jobs unfiltered rather than hide everything.
  }
  // national: show all

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
      userRole={profile.role}
    />
  );
}
