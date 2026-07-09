import { z } from "zod";
import { baseSelectSchema } from "./common";

export const COVERAGE_TYPES = ["national", "radius", "postcode_list"] as const;

export const contractorInsertSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  logo_url: z.string().url().nullable().optional(),
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().nullable().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  bank_account_name: z.string().nullable().optional(),
  bank_sort_code: z.string().nullable().optional(),
  bank_account_number: z.string().nullable().optional(),
  vat_registered: z.boolean(),
  vat_number: z.string().nullable().optional(),
  coverage_type: z.enum(COVERAGE_TYPES).default("national"),
  coverage_radius_miles: z.number().int().positive().nullable().optional(),
  coverage_postcodes: z.string().nullable().optional(),
});

export const contractorSelectSchema = baseSelectSchema.extend({
  user_id: z.string().uuid(),
  ...contractorInsertSchema.shape,
});

export type ContractorInsert = z.infer<typeof contractorInsertSchema>;
export type Contractor = z.infer<typeof contractorSelectSchema>;
