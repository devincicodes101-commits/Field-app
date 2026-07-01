import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, type Job, type Profile } from "@/lib/types";

function statusVariant(status: Job["status"]) {
  if (status === "completed") return "default" as const;
  if (status === "cancelled") return "destructive" as const;
  return "secondary" as const;
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  const query = supabase
    .from("jobs")
    .select("*")
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  const filteredQuery =
    profile.role === "contractor"
      ? query.eq("contractor_id", user.id)
      : profile.role === "operative"
        ? query.eq("assigned_team", profile.full_name)
        : query;

  const { data: jobs } = await filteredQuery.returns<Job[]>();

  const isOffice = profile.role === "office";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isOffice ? "Jobs" : "My diary"}
        </h1>
        {isOffice && (
          <Button render={<Link href="/jobs/new" />}>New job</Button>
        )}
      </div>

      {!jobs?.length && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isOffice ? "No jobs yet." : "No jobs assigned to you yet."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="h-full transition-colors hover:border-foreground/30">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  <Badge variant={statusVariant(job.status)}>
                    {JOB_STATUS_LABELS[job.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{job.address}</p>
                <p>{formatDate(job.scheduled_date)}</p>
                {isOffice && <p>{job.client_name}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
