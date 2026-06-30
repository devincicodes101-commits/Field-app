"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobInsertSchema, type JobInsert } from "@/lib/schemas/jobs";
import { createJob } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type ContractorOption = { user_id: string; company_name: string };

export function JobForm({ contractors }: { contractors: ContractorOption[] }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<JobInsert>({
    resolver: zodResolver(jobInsertSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      client_name: "",
      client_email: "",
      client_phone: "",
      contractor_id: null,
      scheduled_date: "",
      total_value: undefined,
    },
  });

  async function onSubmit(values: JobInsert) {
    setSubmitting(true);
    setError(null);
    const result = await createJob(values);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium">Client</p>
          <FormField
            control={form.control}
            name="client_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client phone</FormLabel>
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
            name="contractor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign contractor (optional)</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  value={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {contractors.map((c) => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        {c.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="total_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quoted value (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
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
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create job"}
        </Button>
      </form>
    </Form>
  );
}
