"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function decideReceipt(receiptId: string, decision: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "office") return { error: "Only office can approve receipts" };

  const { error } = await supabase
    .from("receipts")
    .update({ status: decision, updated_at: new Date().toISOString() })
    .eq("id", receiptId);

  if (error) return { error: error.message };
  revalidatePath("/receipts");
  return { ok: true };
}