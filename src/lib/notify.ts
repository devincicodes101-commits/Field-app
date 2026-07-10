import { createClient } from "@supabase/supabase-js";

/**
 * Create in-app notifications for the given users. Uses the service role so it
 * can write rows owned by other users (RLS only lets a user read/mark their own).
 * No-ops safely if env is missing or the list is empty.
 */
export async function notify(
  userIds: string[],
  n: { title: string; body?: string; link?: string }
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!url || !key || ids.length === 0) return;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  await supabase.from("notifications").insert(
    ids.map((user_id) => ({
      user_id,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    }))
  );
}
