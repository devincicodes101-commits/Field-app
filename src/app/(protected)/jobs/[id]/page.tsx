import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Job,
  JobMessage,
  JobPhoto,
  ExtraWorkRequest,
  Profile,
  ChecklistItem,
  Material,
  JobSiteCheck,
} from "@/lib/types";
import { JobDetail } from "./job-detail";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single<Job>();
  if (!job) notFound();

  const [
    { data: messages },
    { data: photos },
    { data: extraWork },
    { data: contractorProfiles },
    { data: checklistItems },
    { data: materials },
    { data: siteChecks },
  ] = await Promise.all([
    supabase
      .from("job_messages")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: true })
      .returns<JobMessage[]>(),
    supabase
      .from("job_photos")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .returns<JobPhoto[]>(),
    supabase
      .from("extra_work_requests")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .returns<ExtraWorkRequest[]>(),
    profile.role === "office"
      ? supabase.from("profiles").select("id, full_name, email").eq("role", "contractor").order("full_name")
      : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    supabase
      .from("job_checklist_items")
      .select("*")
      .eq("job_id", id)
      .order("sort_order", { ascending: true })
      .returns<ChecklistItem[]>(),
    supabase
      .from("job_materials")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: true })
      .returns<Material[]>(),
    supabase
      .from("job_site_checks")
      .select("*")
      .eq("job_id", id)
      .order("created_at", { ascending: true })
      .returns<JobSiteCheck[]>(),
  ]);

  // Merge contractor accounts with their company names (if they've onboarded).
  let contractors: { user_id: string; company_name: string }[] = [];
  if (profile.role === "office") {
    const { data: companies } = await supabase.from("contractors").select("user_id, company_name");
    const companyMap = new Map((companies ?? []).map((c) => [c.user_id, c.company_name]));
    contractors = (contractorProfiles ?? []).map((p) => ({
      user_id: p.id,
      company_name: companyMap.get(p.id) || p.full_name || p.email,
    }));
  }

  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(photo.storage_path, 60 * 60);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <JobDetail
      job={job}
      profile={profile}
      messages={messages ?? []}
      photos={photosWithUrls}
      extraWork={extraWork ?? []}
      contractors={contractors}
      checklistItems={checklistItems ?? []}
      materials={materials ?? []}
      siteChecks={siteChecks ?? []}
    />
  );
}
