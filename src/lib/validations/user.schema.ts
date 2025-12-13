/**
 * User Validation Schemas
 * Zod schemas for user profile validation
 */

import { z } from "zod";

// Profile update schema (basic info that all users can update)
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Full name must be at least 3 characters"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s()]*$/.test(val),
      "Invalid phone number format",
    ),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Email update schema
export const emailUpdateSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type EmailUpdateFormData = z.infer<typeof emailUpdateSchema>;
