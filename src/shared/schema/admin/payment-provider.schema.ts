import { z } from "zod";

export const createPaymentProviderSchema = z.object({
  code: z.string().min(1, "Provider code is required"),
  name: z.string().min(1, "Provider name is required"),
  isActive: z.boolean().optional(),
  authorizedKey: z.string().optional(),
});

export const updatePaymentProviderSchema = z.object({
  id: z.string().min(1, "Provider ID is required"),
  code: z.string().min(1, "Provider code is required").optional(),
  name: z.string().min(1, "Provider name is required").optional(),
  isActive: z.boolean().optional(),
  authorizedKey: z.string().optional(),
});