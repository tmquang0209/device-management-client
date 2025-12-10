import { z } from "zod";

const statusTransform = (val: boolean | number): number => {
  if (typeof val === "boolean") {
    return val ? 1 : 0;
  }
  return val;
};

export const createDeviceLocationSchema = z
  .object({
    rackId: z.any(),
    xPosition: z
      .string()
      .max(50, "Vị trí X không được vượt quá 50 ký tự")
      .optional(),
    yPosition: z
      .string()
      .max(50, "Vị trí Y không được vượt quá 50 ký tự")
      .optional(),
    status: z
      .union([z.boolean(), z.number()])
      .transform(statusTransform)
      .optional()
      .default(1),
  })
  .refine(
    (data) => {
      return data.rackId?.value;
    },
    {
      message: "Vui lòng chọn rack",
    },
  );

export type CreateDeviceLocationFormValues = z.infer<
  typeof createDeviceLocationSchema
>;

export const updateDeviceLocationSchema = z.object({
  id: z.string(),
  rackId: z.string().min(1, "Vui lòng chọn rack"),
  xPosition: z
    .string()
    .max(50, "Vị trí X không được vượt quá 50 ký tự")
    .optional(),
  yPosition: z
    .string()
    .max(50, "Vị trí Y không được vượt quá 50 ký tự")
    .optional(),
  status: z
    .union([z.boolean(), z.number()])
    .transform(statusTransform)
    .optional(),
});

export type UpdateDeviceLocationFormValues = z.infer<
  typeof updateDeviceLocationSchema
>;
