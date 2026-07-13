"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractorInsertSchema, type ContractorInsert } from "@/lib/schemas/contractors";
import { updateContractorProfile, updateProfile } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { PostcodeAreaSelect } from "@/components/postcode-area-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { Contractor, Profile } from "@/lib/types";

/* ─── Contractor profile form ─── */

export function ContractorProfileForm({
  contractor,
}: {
  contractor: Contractor;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(contractor.logo_url ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ContractorInsert>({
    resolver: zodResolver(contractorInsertSchema),
    defaultValues: {
      company_name: contractor.company_name,
      logo_url: contractor.logo_url ?? null,
      address_line1: contractor.address_line1,
      address_line2: contractor.address_line2 ?? "",
      city: contractor.city,
      postcode: contractor.postcode,
      bank_account_name: contractor.bank_account_name ?? "",
      bank_sort_code: contractor.bank_sort_code ?? "",
      bank_account_number: contractor.bank_account_number ?? "",
      vat_registered: contractor.vat_registered,
      vat_number: contractor.vat_number ?? "",
      coverage_type: contractor.coverage_type ?? "national",
      coverage_radius_miles: contractor.coverage_radius_miles ?? null,
      coverage_postcodes: contractor.coverage_postcodes ?? null,
    },
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2 MB."); return; }

    setLogoUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `logos/${Date.now()}.${ext}`;
    const { data, error: uploadError } = await supabase.storage
      .from("contractor-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) { toast.error(`Logo upload failed: ${uploadError.message}`); setLogoUploading(false); return; }

    const { data: urlData } = supabase.storage.from("contractor-assets").getPublicUrl(data.path);
    form.setValue("logo_url", urlData.publicUrl);
    setLogoPreview(urlData.publicUrl);
    setLogoUploading(false);
    toast.success("Logo uploaded");
  }

  async function onSubmit(values: ContractorInsert) {
    setSubmitting(true);
    const result = await updateContractorProfile(values);
    setSubmitting(false);
    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company logo</label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Button type="button" variant="outline" size="sm" disabled={logoUploading} onClick={() => logoInputRef.current?.click()}>
                {logoUploading ? "Uploading…" : "Change logo"}
              </Button>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 2 MB</span>
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="address_line1" render={({ field }) => (
            <FormItem><FormLabel>Address line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="address_line2" render={({ field }) => (
            <FormItem><FormLabel>Address line 2</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="postcode" render={({ field }) => (
            <FormItem><FormLabel>Postcode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        {/* Banking */}
        <div className="border-t border-border pt-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Banking details</p>
          <FormField control={form.control} name="bank_account_name" render={({ field }) => (
            <FormItem><FormLabel>Account name</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="bank_sort_code" render={({ field }) => (
              <FormItem><FormLabel>Sort code</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="00-00-00" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bank_account_number" render={({ field }) => (
              <FormItem><FormLabel>Account number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        {/* VAT */}
        <div className="border-t border-border pt-5 space-y-4">
          <FormField control={form.control} name="vat_registered" render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4" />
              </FormControl>
              <FormLabel className="!mt-0">VAT registered</FormLabel>
            </FormItem>
          )} />
          {form.watch("vat_registered") && (
            <FormField control={form.control} name="vat_number" render={({ field }) => (
              <FormItem><FormLabel>VAT number</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
          )}
        </div>

        {/* Coverage */}
        <div className="border-t border-border pt-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Coverage area</p>
          <FormField control={form.control} name="coverage_type" render={({ field }) => (
            <FormItem>
              <FormLabel>How do you cover jobs?</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="national">National — anywhere in the UK</SelectItem>
                  <SelectItem value="radius">Radius — within X miles of my postcode</SelectItem>
                  <SelectItem value="postcode_list">Specific postcodes</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          {form.watch("coverage_type") === "radius" && (
            <FormField control={form.control} name="coverage_radius_miles" render={({ field }) => (
              <FormItem>
                <FormLabel>Radius (miles)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="e.g. 25" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
          {form.watch("coverage_type") === "postcode_list" && (
            <FormField control={form.control} name="coverage_postcodes" render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode areas you cover</FormLabel>
                <FormControl>
                  <PostcodeAreaSelect value={field.value ?? null} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting || logoUploading}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}

/* ─── Basic profile form (operative / non-contractor roles) ─── */

export function BasicProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!fullName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const result = await updateProfile({ full_name: fullName, phone });
    setSaving(false);
    if (result && "error" in result) toast.error(result.error);
    else toast.success("Profile updated");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Full name</label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Phone number</label>
        <Input type="tel" placeholder="+44 7xxx xxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <Input value={profile.email} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
