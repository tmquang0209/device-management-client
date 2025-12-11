import { z } from "zod";

export const createMaintenanceSlipSchema = z.object({
  deviceId: z.any(),
  transferStatus: z.string().max(255, "Tối đa 255 ký tự").optional(),
  partnerId: z.any().optional(),
  reason: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  requestDate: z.coerce
    .date({ message: "Ngày yêu cầu không hợp lệ" })
    .optional(),
});

export type CreateMaintenanceSlipFormValues = z.infer<
  typeof createMaintenanceSlipSchema
>;

export const updateMaintenanceSlipSchema = z.object({
  id: z.string(),
  deviceId: z.any().optional(),
  transferStatus: z.string().max(255).optional(),
  partnerId: z.any().optional(),
  reason: z.string().max(1000).optional(),
  requestDate: z.coerce.date().optional(),
  status: z.coerce.number().int().min(0).max(1).optional(),
});

export type UpdateMaintenanceSlipFormValues = z.infer<
  typeof updateMaintenanceSlipSchema
>;
