import { z } from "zod";

const statusTransform = (val: boolean | number): number => {
  if (typeof val === "boolean") {
    return val ? 1 : 0;
  }
  return val;
};

export const createRackSchema = z.object({
  code: z
    .string()
    .min(1, "Mã rack là bắt buộc")
    .min(1, "Mã rack phải có ít nhất 1 ký tự")
    .max(100, "Mã rack không được vượt quá 100 ký tự"),
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
    .min(1, "Mã rack phải có ít nhất 1 ký tự")
    .max(100, "Mã rack không được vượt quá 100 ký tự"),
  status: z
    .union([z.boolean(), z.number()])
    .transform(statusTransform)
    .optional(),
});

export type UpdateRackFormValues = z.infer<typeof updateRackSchema>;
