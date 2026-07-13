import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Contractor, Profile } from "@/lib/types";
import { ContractorProfileForm, BasicProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) redirect("/login");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<Contractor>();

  const roleLabel: Record<string, string> = {
    office:     "Office",
    contractor: "Contractor",
    operative:  "Operative",
    admin:      "Admin",
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {roleLabel[profile.role] ?? profile.role} · {profile.email}
        </p>
      </div>

      {/* Basic info for all roles */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground">Personal details</h2>
        <BasicProfileForm profile={profile} />
      </div>

      {/* Company profile for contractors */}
      {profile.role === "contractor" && contractor && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Company profile</h2>
          <ContractorProfileForm contractor={contractor} />
        </div>
      )}
    </div>
  );
}
