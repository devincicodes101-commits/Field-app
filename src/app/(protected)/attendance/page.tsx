import { createClient } from "@/lib/supabase/server";
import type { AttendanceLog, Profile } from "@/lib/types";
import { redirect } from "next/navigation";
import { AttendanceClient } from "./client";

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/login");

  // Last 28 days
  const since = new Date();
  since.setDate(since.getDate() - 28);

  const { data: logs } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("work_date", since.toISOString().slice(0, 10))
    .order("work_date", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = (logs ?? []).find((l: AttendanceLog) => l.work_date === today) ?? null;

  return (
    <AttendanceClient
      logs={(logs ?? []) as AttendanceLog[]}
      todayLog={todayLog as AttendanceLog | null}
      profile={profile}
    />
  );
}