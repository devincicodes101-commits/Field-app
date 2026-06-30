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
    .select("*, profiles!contractors_user_id_fkey(full_name, email, phone)")
    .order("company_name")
    .returns<(Contractor & { profiles: Pick<Profile, "full_name" | "email" | "phone"> })[]>();

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
                <div>{c.profiles?.full_name}</div>
                <div className="text-sm text-muted-foreground">{c.profiles?.email}</div>
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
