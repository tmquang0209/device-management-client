import { z } from "zod";

// CreatePartner schema
export const createPartnerSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  email: z.string().email("Email không hợp lệ"),
  partnerType: z.any(),
  status: z
    .union([z.number().int(), z.boolean().transform((val) => (val ? 1 : 0))])
    .optional()
    .default(1),
});

export type CreatePartnerFormValues = z.infer<typeof createPartnerSchema>;

// UpdatePartner schema
export const updatePartnerSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  partnerType: z.any(),
  status: z
    .union([
      z.number().int(),
      z.string().transform((val) => Number.parseInt(val, 10)),
    ])
    .optional(),
});

export type UpdatePartnerFormValues = z.infer<typeof updatePartnerSchema>;
