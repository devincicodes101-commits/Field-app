import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const supabase = await createClient();

  // List every contractor account (from profiles), labelled by company name
  // if they've completed onboarding, otherwise by their name/email — so a
  // contractor is assignable as soon as they register.
  const [{ data: contractorProfiles }, { data: companies }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("role", "contractor").order("full_name"),
    supabase.from("contractors").select("user_id, company_name"),
  ]);
  const companyMap = new Map((companies ?? []).map((c) => [c.user_id, c.company_name]));
  const contractors = (contractorProfiles ?? []).map((p) => ({
    user_id: p.id,
    company_name: companyMap.get(p.id) || p.full_name || p.email,
  }));

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
