import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const baseSelectSchema = z.object({
  id: uuidSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type BaseSelect = z.infer<typeof baseSelectSchema>;
