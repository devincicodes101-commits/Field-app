"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractorInsertSchema, type ContractorInsert } from "@/lib/schemas/contractors";
import { completeOnboarding } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const form = useForm<ContractorInsert>({
    resolver: zodResolver(contractorInsertSchema),
    defaultValues: {
      company_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postcode: "",
      bank_account_name: "",
      bank_sort_code: "",
      bank_account_number: "",
      vat_registered: false,
      vat_number: "",
    },
  });

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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving..." : "Complete registration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
