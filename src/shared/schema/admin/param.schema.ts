import { z } from "zod";

export const createParamSchema = z.object({
  type: z.string().min(1, "Type is required").max(100),
  code: z.string().min(1, "Code is required").max(100),
  value: z.string().min(1, "Value is required").max(1000),
  status: z.coerce.number().int().min(0).max(1).optional().default(1),
});

export type CreateParamFormValues = z.infer<typeof createParamSchema>;

export const updateParamSchema = z.object({
  id: z.string(),
  type: z.string().min(1, "Type is required").max(100).optional(),
  code: z.string().min(1, "Code is required").max(100).optional(),
  value: z.string().min(1, "Value is required").max(1000).optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
});

export type UpdateParamFormValues = z.infer<typeof updateParamSchema>;
