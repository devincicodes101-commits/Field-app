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

  // Today's scheduled/in_progress jobs, anchored to the UK business day (Europe/London).
  const TZ = "Europe/London";
  const londonDate = (value: string | number | Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));

  const now = new Date();
  const todayLondon = londonDate(now);
  // Coarse UTC prefilter (±1 day covers the whole London day regardless of BST/GMT),
  // then match the exact London calendar day in JS.
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .in("status", ["scheduled", "in_progress", "accepted"])
    .gte("scheduled_date", from)
    .lt("scheduled_date", to)
    .order("scheduled_date", { ascending: true });

  const jobs = (data ?? []).filter(
    (j) => j.scheduled_date && londonDate(j.scheduled_date) === todayLondon
  );

  return <RoutePlanningClient jobs={jobs as Job[]} />;
}