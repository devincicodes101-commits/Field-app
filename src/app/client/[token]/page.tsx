import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Job, JobMessage, JobPhoto } from "@/lib/types";
import { ClientPortal } from "./client-portal";

export default async function ClientJobPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("client_access_token", token)
    .single<Job>();
  if (!job) notFound();

  const [{ data: messages }, { data: photos }] = await Promise.all([
    supabase
      .from("job_messages")
      .select("*")
      .eq("job_id", job.id)
      .order("created_at", { ascending: true })
      .returns<JobMessage[]>(),
    supabase
      .from("job_photos")
      .select("*")
      .eq("job_id", job.id)
      .eq("kind", "client_reference")
      .order("created_at", { ascending: false })
      .returns<JobPhoto[]>(),
  ]);

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(photo.storage_path, 60 * 60);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <ClientPortal
      token={token}
      job={job}
      messages={messages ?? []}
      photos={photosWithUrls}
    />
  );
}