"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { contractorInsertSchema } from "@/lib/schemas/contractors";
import type { ContractorInsert } from "@/lib/schemas/contractors";

export async function updateContractorProfile(values: ContractorInsert) {
  const parsed = contractorInsertSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("contractors")
    .update({
      company_name: parsed.data.company_name,
      logo_url: parsed.data.logo_url ?? null,
      address_line1: parsed.data.address_line1,
      address_line2: parsed.data.address_line2 ?? null,
      city: parsed.data.city,
      postcode: parsed.data.postcode,
      bank_account_name: parsed.data.bank_account_name ?? null,
      bank_sort_code: parsed.data.bank_sort_code ?? null,
      bank_account_number: parsed.data.bank_account_number ?? null,
      vat_registered: parsed.data.vat_registered,
      vat_number: parsed.data.vat_number ?? null,
      coverage_type: parsed.data.coverage_type,
      coverage_radius_miles: parsed.data.coverage_radius_miles ?? null,
      coverage_postcodes: parsed.data.coverage_postcodes ?? null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}

export async function updateProfile(values: { full_name: string; phone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.full_name.trim(),
      phone: values.phone.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
