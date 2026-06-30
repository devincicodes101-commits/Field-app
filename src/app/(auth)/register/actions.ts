"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type RegisterActionState = { error: string } | { success: true } | null;

export async function registerContractor(
  _prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "contractor" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return { success: true };
}
