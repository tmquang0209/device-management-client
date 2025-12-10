import { z } from "zod";

// CreateRole schema
export const createRoleSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});
export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

// UpdateRole schema
export const updateRoleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean(),
  permissions: z.array(z.string()),
});
export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>;
