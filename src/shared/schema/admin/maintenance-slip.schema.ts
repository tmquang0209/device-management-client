import { z } from "zod";

export const createMaintenanceSlipSchema = z.object({
  partnerId: z.string().uuid().optional(),
  reason: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  requestDate: z.coerce
    .date({ message: "Ngày yêu cầu không hợp lệ" })
    .optional(),
  deviceIds: z
    .array(z.string().uuid())
    .min(1, "Vui lòng chọn ít nhất một thiết bị"),
});

export type CreateMaintenanceSlipFormValues = z.infer<
  typeof createMaintenanceSlipSchema
>;

export const updateMaintenanceSlipSchema = z.object({
  id: z.string(),
  partnerId: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
  requestDate: z.coerce.date().optional(),
  status: z.coerce.number().int().min(1).max(4).optional(),
});

export type UpdateMaintenanceSlipFormValues = z.infer<
  typeof updateMaintenanceSlipSchema
>;

export const returnMaintenanceSlipSchema = z.object({
  items: z
    .array(
      z.object({
        deviceId: z.string().uuid(),
        status: z.coerce.number().int().min(2).max(3), // 2: RETURNED, 3: BROKEN
        note: z.string().optional(),
      }),
    )
    .min(1, "Vui lòng chọn ít nhất một thiết bị"),
});

export type ReturnMaintenanceSlipFormValues = z.infer<
  typeof returnMaintenanceSlipSchema
>;
