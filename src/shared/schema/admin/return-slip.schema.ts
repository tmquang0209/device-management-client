import { z } from "zod";

export const createReturnSlipSchema = z.object({
  loanSlipId: z.string().min(1, "Vui lòng chọn mã giao dịch mượn"),
  returnerId: z.string().min(1, "Vui lòng chọn người trả thiết bị"),
  returnDate: z.string().min(1, "Vui lòng chọn ngày trả"),
  note: z.string().optional(),
  devices: z
    .array(
      z.object({
        deviceId: z.string(),
        note: z.string().optional(),
      }),
    )
    .min(1, "Vui lòng chọn ít nhất một thiết bị để trả"),
});

export type CreateReturnSlipFormValues = z.infer<typeof createReturnSlipSchema>;

export const updateReturnSlipSchema = z.object({
  returnerId: z.string().min(1, "Vui lòng chọn người trả thiết bị").optional(),
  note: z.string().optional(),
});

export type UpdateReturnSlipFormValues = z.infer<typeof updateReturnSlipSchema>;
