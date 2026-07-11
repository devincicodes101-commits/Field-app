import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { NotificationsBell } from "@/components/layout/notifications-bell";
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

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Topbar
        profile={profile}
        notificationsBell={<NotificationsBell initialCount={unreadCount ?? 0} />}
      />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}