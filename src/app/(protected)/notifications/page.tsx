import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Mark all as read on open
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  revalidatePath("/notifications");

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {notifications?.length ?? 0} notification{notifications?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {(!notifications || notifications.length === 0) && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="font-bold text-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            You will be notified when jobs are assigned to you or auctions open.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(notifications ?? []).map((n) => (
          <div
            key={n.id}
            className="rounded-xl border border-border bg-card p-4 space-y-1 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-sm text-foreground">{n.title}</p>
              <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{n.body}</p>
            {n.job_id && (
              <Link
                href={`/jobs/${n.job_id}`}
                className="inline-block text-xs font-semibold text-primary hover:underline mt-1"
              >
                View job →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
