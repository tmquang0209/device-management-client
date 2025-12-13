import { z } from "zod";

const dateTransform = (val: unknown) => {
  if (!val || val === "") return undefined;
  if (typeof val === "string") {
    return new Date(val);
  }
  return val;
};

export const createDeviceSchema = z.object({
  deviceName: z
    .string()
    .min(2, "Tên thiết bị phải có ít nhất 2 ký tự")
    .max(100, "Tên thiết bị không được vượt quá 100 ký tự"),
  serial: z
    .string()
    .max(100, "Số sê-ri không được vượt quá 100 ký tự")
    .optional(),
  model: z.string().max(100, "Mẫu không được vượt quá 100 ký tự").optional(),
  deviceTypeId: z.string().min(1, "Vui lòng chọn loại thiết bị"),
  deviceLocationId: z.string().optional(),
  supplier: z.string().optional(),
  status: z.number().optional(),
  purchaseDate: z.string().or(z.date()).optional().transform(dateTransform),
  warrantyExpirationDate: z
    .string()
    .or(z.date())
    .optional()
    .transform(dateTransform),
  notes: z
    .string()
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
    .optional(),
});

export type CreateDeviceFormValues = z.infer<typeof createDeviceSchema>;

export const updateDeviceSchema = z.object({
  id: z.string(),
  deviceName: z
    .string()
    .min(2, "Tên thiết bị phải có ít nhất 2 ký tự")
    .max(100, "Tên thiết bị không được vượt quá 100 ký tự"),
  serial: z
    .string()
    .max(100, "Số sê-ri không được vượt quá 100 ký tự")
    .optional(),
  model: z.string().max(100, "Mẫu không được vượt quá 100 ký tự").optional(),
  deviceTypeId: z.string().min(1, "Vui lòng chọn loại thiết bị"),
  deviceLocationId: z.string().optional(),
  supplier: z.string().optional(),
  status: z.number().optional(),
  purchaseDate: z.string().or(z.date()).optional().transform(dateTransform),
  warrantyExpirationDate: z
    .string()
    .or(z.date())
    .optional()
    .transform(dateTransform),
  notes: z
    .string()
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
    .optional(),
});

export type UpdateDeviceFormValues = z.infer<typeof updateDeviceSchema>;
