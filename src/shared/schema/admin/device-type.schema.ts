import { z } from "zod";

export const createDeviceTypeSchema = z.object({
  deviceTypeName: z
    .string()
    .min(2, "Tên loại thiết bị phải có ít nhất 2 ký tự")
    .max(100, "Tên loại thiết bị không được vượt quá 100 ký tự"),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional(),
  status: z.number().optional().default(1),
});

export type CreateDeviceTypeFormValues = z.infer<typeof createDeviceTypeSchema>;

export const updateDeviceTypeSchema = z.object({
  id: z.string(),
  deviceTypeName: z
    .string()
    .min(2, "Tên loại thiết bị phải có ít nhất 2 ký tự")
    .max(100, "Tên loại thiết bị không được vượt quá 100 ký tự"),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional(),
  status: z.number().optional(),
});

export type UpdateDeviceTypeFormValues = z.infer<typeof updateDeviceTypeSchema>;
