"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contractorInsertSchema, type ContractorInsert } from "@/lib/schemas/contractors";

export async function completeOnboarding(
  values: ContractorInsert
): Promise<{ error: string } | void> {
  const parsed = contractorInsertSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("contractors")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
