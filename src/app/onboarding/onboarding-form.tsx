"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractorInsertSchema, type ContractorInsert } from "@/lib/schemas/contractors";
import { completeOnboarding } from "./actions";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ContractorInsert>({
    resolver: zodResolver(contractorInsertSchema),
    defaultValues: {
      company_name: "",
      logo_url: null,
      address_line1: "",
      address_line2: "",
      city: "",
      postcode: "",
      bank_account_name: "",
      bank_sort_code: "",
      bank_account_number: "",
      vat_registered: false,
      vat_number: "",
      coverage_type: "national",
      coverage_radius_miles: null,
      coverage_postcodes: null,
    },
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2 MB.");
      return;
    }

    setLogoUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `logos/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from("contractor-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError(`Logo upload failed: ${uploadError.message}`);
      setLogoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("contractor-assets")
      .getPublicUrl(data.path);

    form.setValue("logo_url", urlData.publicUrl);
    setLogoPreview(urlData.publicUrl);
    setLogoUploading(false);
  }

  async function onSubmit(values: ContractorInsert) {
    setSubmitting(true);
    setError(null);
    const result = await completeOnboarding(values);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Your company details</CardTitle>
        <CardDescription>
          We use this to assign jobs to you and, later, for invoicing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Company logo (optional)</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo"
                    className="h-16 w-16 rounded-lg object-contain border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                    No logo
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={logoUploading}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoUploading ? "Uploading..." : "Upload logo"}
                  </Button>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 2 MB</span>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 2 (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Banking details</p>
              <FormField
                control={form.control}
                name="bank_account_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bank_sort_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="00-00-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <FormField
                control={form.control}
                name="vat_registered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">VAT registered</FormLabel>
                  </FormItem>
                )}
              />
              {form.watch("vat_registered") && (
                <FormField
                  control={form.control}
                  name="vat_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Coverage area */}
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Coverage area</p>
              <FormField
                control={form.control}
                name="coverage_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How do you cover jobs?</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="national">National — anywhere in the UK</SelectItem>
                        <SelectItem value="radius">Radius — within X miles of my postcode</SelectItem>
                        <SelectItem value="postcode_list">Specific postcodes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("coverage_type") === "radius" && (
                <FormField
                  control={form.control}
                  name="coverage_radius_miles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radius (miles)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="e.g. 25"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("coverage_type") === "postcode_list" && (
                <FormField
                  control={form.control}
                  name="coverage_postcodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode areas you cover</FormLabel>
                      <FormControl>
                        <PostcodeAreaSelect
                          value={field.value ?? null}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting || logoUploading}>
              {submitting ? "Saving..." : "Complete registration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}