import { z } from "zod";

export const jobInsertSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  address: z.string().min(1, "Address is required"),
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email().nullable().optional().or(z.literal("")),
  client_phone: z.string().nullable().optional(),
  contractor_id: z.string().uuid().nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  total_value: z.number().min(0).nullable().optional(),
});

export type JobInsert = z.infer<typeof jobInsertSchema>;

export const extraWorkInsertSchema = z.object({
  job_id: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

export type ExtraWorkInsert = z.infer<typeof extraWorkInsertSchema>;

export const messageInsertSchema = z.object({
  job_id: z.string().uuid(),
  body: z.string().min(1, "Message can't be empty"),
});

export type MessageInsert = z.infer<typeof messageInsertSchema>;

export const rescheduleInsertSchema = z.object({
  job_id: z.string().uuid(),
  new_date: z.string().min(1, "New date is required"),
  reason: z.string().nullable().optional(),
});

export type RescheduleInsert = z.infer<typeof rescheduleInsertSchema>;
