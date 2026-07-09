import { createClient } from "@/lib/supabase/server";
import type { Job, Profile } from "@/lib/types";
import { AvailableJobsClient } from "./client";
import { redirect } from "next/navigation";

export default async function AvailableJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile || profile.role === "office") redirect("/dashboard");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .in("status", ["accepted", "scheduled"])
    .eq("assignment_type", "auction")
    .is("assigned_team", null)
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  return <AvailableJobsClient jobs={(jobs ?? []) as Job[]} />;
}