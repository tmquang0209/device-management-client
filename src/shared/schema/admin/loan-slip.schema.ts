import { z } from "zod";

export const createLoanSlipSchema = z.object({
  borrowerId: z.string().min(1, "Vui lòng chọn người mượn"),
  loanerId: z.string().min(1, "Vui lòng chọn người cho mượn"),
  deviceIds: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất một thiết bị để mượn"),
});

export type CreateLoanSlipFormValues = z.infer<typeof createLoanSlipSchema>;

export const updateLoanSlipSchema = z.object({
  id: z.string(),
  borrowerId: z.string().min(1, "Vui lòng chọn người mượn"),
  loanerId: z.string().min(1, "Vui lòng chọn người cho mượn"),
  deviceIds: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất một thiết bị để mượn"),
});

export type UpdateLoanSlipFormValues = z.infer<typeof updateLoanSlipSchema>;

export const returnLoanSlipSchema = z.object({
  items: z
    .array(
      z.object({
        deviceId: z.string(),
        status: z.number().min(2).max(3), // 2: RETURNED, 3: BROKEN
        note: z.string().optional(),
      }),
    )
    .min(1, "Vui lòng chọn ít nhất một thiết bị để trả"),
});

export type ReturnLoanSlipFormValues = z.infer<typeof returnLoanSlipSchema>;
