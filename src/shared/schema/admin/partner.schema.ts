import { z } from "zod";

// CreatePartner schema
export const createPartnerSchema = z.object({
  userId: z.any(),
  partnerType: z.union([
    z.number().int().min(0, "Partner type must be a valid number"),
    z.string().transform((val) => Number.parseInt(val, 10)),
  ]),
  status: z
    .union([
      z.number().int(),
      z.string().transform((val) => Number.parseInt(val, 10)),
    ])
    .optional()
    .default(1),
});

export type CreatePartnerFormValues = z.infer<typeof createPartnerSchema>;

// UpdatePartner schema
export const updatePartnerSchema = z.object({
  // id: z.string(),
  userId: z.any(),
  partnerType: z
    .union([
      z.number().int().min(0, "Partner type must be a valid number"),
      z.string().transform((val) => Number.parseInt(val, 10)),
    ])
    .optional(),
  status: z
    .union([
      z.number().int(),
      z.string().transform((val) => Number.parseInt(val, 10)),
    ])
    .optional(),
});

export type UpdatePartnerFormValues = z.infer<typeof updatePartnerSchema>;
