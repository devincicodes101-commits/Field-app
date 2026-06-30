import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import type { Profile } from "@/lib/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar profile={profile} />
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
