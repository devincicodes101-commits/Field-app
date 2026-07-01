import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Job, Profile } from "@/lib/types";
import { RoutePlanningClient } from "./client";

export default async function RoutePlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile || profile.role !== "office") redirect("/dashboard");

  // Today's scheduled/in_progress jobs
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .in("status", ["scheduled", "in_progress", "accepted"])
    .gte("scheduled_date", today + "T00:00:00")
    .lt("scheduled_date", tomorrow.toISOString().slice(0, 10) + "T00:00:00")
    .order("scheduled_date", { ascending: true });

  return <RoutePlanningClient jobs={(jobs ?? []) as Job[]} />;
}