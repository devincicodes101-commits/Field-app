"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function clockIn() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("attendance_logs").insert({
    user_id: user.id,
    work_date: today,
    clock_in: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { ok: true };
}

export async function clockOut(logId: string, earlyLeave = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("attendance_logs")
    .update({
      clock_out: new Date().toISOString(),
      early_leave: earlyLeave,
    })
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/attendance");
  return { ok: true };
}