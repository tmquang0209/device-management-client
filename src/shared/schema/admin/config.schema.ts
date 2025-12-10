import { z } from "zod";

export const createConfigSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.union([z.string().min(1, "Value is required"), z.boolean()]),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  valueType: z.string().optional(),
});

export const updateConfigSchema = z.object({
  key: z.string().min(1, "Key is required").optional(),
  value: z.union([z.string().min(1, "Value is required"), z.boolean()]),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  valueType: z.string().optional(),
});