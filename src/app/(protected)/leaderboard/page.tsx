import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";
import { LeaderboardClient } from "./client";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/login");

  // All field worker profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["operative", "contractor"])
    .order("full_name");

  // All completions (with star ratings)
  const { data: completions } = await supabase
    .from("job_completions")
    .select("completed_by, operative_name, star_rating, completed_at");

  // All completed jobs (for commission calculation)
  const { data: jobs } = await supabase
    .from("jobs")
    .select("assigned_team, contractor_id, total_value, status")
    .eq("status", "completed");

  return (
    <LeaderboardClient
      profiles={(profiles ?? []) as { id: string; full_name: string; role: string }[]}
      completions={(completions ?? []) as { completed_by: string | null; operative_name: string | null; star_rating: number | null; completed_at: string }[]}
      jobs={(jobs ?? []) as { assigned_team: string | null; contractor_id: string | null; total_value: number | null; status: string }[]}
      currentProfile={profile}
    />
  );
}