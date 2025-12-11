import { z } from "zod";

export const createWarrantySchema = z.object({
  deviceId: z.any(),
  reason: z.string().min(1, "Lý do là bắt buộc").max(1000),
  requestDate: z.coerce.date({
    message: "Ngày yêu cầu không hợp lệ",
  }),
});

export type CreateWarrantyFormValues = z.infer<typeof createWarrantySchema>;

export const updateWarrantySchema = z.object({
  id: z.string(),
  reason: z.string().min(1, "Lý do là bắt buộc").max(1000).optional(),
  requestDate: z.coerce.date().optional(),
  status: z.coerce.number().int().min(1).max(4).optional(),
});

export type UpdateWarrantyFormValues = z.infer<typeof updateWarrantySchema>;
