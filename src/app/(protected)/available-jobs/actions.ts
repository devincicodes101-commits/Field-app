"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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