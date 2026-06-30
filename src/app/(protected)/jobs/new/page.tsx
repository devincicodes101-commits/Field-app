import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const supabase = await createClient();
  const { data: contractors } = await supabase
    .from("contractors")
    .select("user_id, company_name")
    .order("company_name");

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New job</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm contractors={contractors ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
