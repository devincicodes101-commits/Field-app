import { createClient } from "@/lib/supabase/server";
import type { Receipt, Profile } from "@/lib/types";
import { redirect } from "next/navigation";
import { ReceiptsClient } from "./client";

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile || profile.role !== "office") redirect("/dashboard");

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch signed URLs for receipt images
  const withUrls = await Promise.all(
    (receipts ?? []).map(async (r: Receipt) => {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(r.storage_path, 3600);
      return { ...r, signedUrl: data?.signedUrl ?? null };
    })
  );

  return <ReceiptsClient receipts={withUrls as (Receipt & { signedUrl: string | null })[]} />;
}