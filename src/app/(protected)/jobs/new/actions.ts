"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { jobInsertSchema, type JobInsert } from "@/lib/schemas/jobs";

export async function createJob(values: JobInsert): Promise<{ error: string } | void> {
  const parsed = jobInsertSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { client_email, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      client_email: client_email || null,
      created_by: user.id,
      status: "quote_sent",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/jobs/${data.id}`);
}
