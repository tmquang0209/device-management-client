import { z } from "zod";

// CreateUser schema
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .optional(),
  roleType: z.string().optional(),
  status: z.boolean().optional().default(true),
  partnerId: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

// UpdateUser schema
export const updateUserSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address")
    .max(255, "Email must be less than 255 characters")
    .optional(),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .optional(),
  roleType: z.string().optional(),
  status: z.boolean().optional(),
  partnerId: z.string().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
