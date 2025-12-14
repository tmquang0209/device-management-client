import { z } from "zod";

export const createMaintenanceReturnSlipSchema = z.object({
  maintenanceSlipId: z.string().min(1, "Vui lòng chọn phiếu bảo trì"),
  returnDate: z.string().min(1, "Vui lòng chọn ngày nhận"),
  note: z.string().optional(),
  devices: z
    .array(
      z.object({
        deviceId: z.string(),
        status: z.number().min(2).max(3), // 2: RETURNED, 3: BROKEN
        note: z.string().optional(),
      }),
    )
    .min(1, "Vui lòng chọn ít nhất một thiết bị để nhận"),
});

export type CreateMaintenanceReturnSlipFormValues = z.infer<
  typeof createMaintenanceReturnSlipSchema
>;

export const updateMaintenanceReturnSlipSchema = z.object({
  note: z.string().optional(),
});

export type UpdateMaintenanceReturnSlipFormValues = z.infer<
  typeof updateMaintenanceReturnSlipSchema
>;
