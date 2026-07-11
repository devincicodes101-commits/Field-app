import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Contractor, Profile } from "@/lib/types";

export default async function ContractorsPage() {
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
  if (profile?.role !== "office") redirect("/dashboard");

  const { data: contractors } = await supabase
    .from("contractors")
    .select("*")
    .order("company_name")
    .returns<Contractor[]>();

  // contractors.user_id and profiles.id both reference auth.users, so there's no
  // direct FK to embed on — fetch the linked profiles separately and map them.
  const userIds = (contractors ?? []).map((c) => c.user_id);
  const { data: profileRows } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds)
        .returns<Pick<Profile, "id" | "full_name" | "email" | "phone">[]>()
    : { data: [] as Pick<Profile, "id" | "full_name" | "email" | "phone">[] };
  const profileById = new Map((profileRows ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contractors</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>VAT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractors?.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.company_name}</TableCell>
              <TableCell>
                <div>{profileById.get(c.user_id)?.full_name}</div>
                <div className="text-sm text-muted-foreground">{profileById.get(c.user_id)?.email}</div>
              </TableCell>
              <TableCell>
                {c.address_line1}, {c.city} {c.postcode}
              </TableCell>
              <TableCell>
                {c.vat_registered ? (
                  <Badge variant="secondary">{c.vat_number || "VAT registered"}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Not registered</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {!contractors?.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No contractors registered yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
