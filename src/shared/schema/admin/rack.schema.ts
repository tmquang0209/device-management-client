import { z } from "zod";

const statusTransform = (val: boolean | number): number => {
  if (typeof val === "boolean") {
    return val ? 1 : 0;
  }
  return val;
};

export const createRackSchema = z.object({
  rows: z
    .number({ message: "Số hàng phải là số" })
    .min(1, "Số hàng phải lớn hơn 0")
    .max(100, "Số hàng không được vượt quá 100"),
  cols: z
    .number({ message: "Số cột phải là số" })
    .min(1, "Số cột phải lớn hơn 0")
    .max(100, "Số cột không được vượt quá 100"),
  status: z
    .union([z.boolean(), z.number()])
    .transform(statusTransform)
    .optional()
    .default(1),
});

export type CreateRackFormValues = z.infer<typeof createRackSchema>;

export const updateRackSchema = z.object({
  id: z.string(),
  code: z
    .string()
    .min(1, "Mã kệ phải có ít nhất 1 ký tự")
    .max(100, "Mã kệ không được vượt quá 100 ký tự")
    .optional(),
  rows: z
    .number({ message: "Số hàng phải là số" })
    .min(1, "Số hàng phải lớn hơn 0")
    .max(100, "Số hàng không được vượt quá 100")
    .optional(),
  cols: z
    .number({ message: "Số cột phải là số" })
    .min(1, "Số cột phải lớn hơn 0")
    .max(100, "Số cột không được vượt quá 100")
    .optional(),
  status: z
    .union([z.boolean(), z.number()])
    .transform(statusTransform)
    .optional(),
});

export type UpdateRackFormValues = z.infer<typeof updateRackSchema>;
