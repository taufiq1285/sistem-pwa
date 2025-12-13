/**
 * Auth Validation Schemas - UPDATED for NIDN/NUPTK
 * Zod schemas for auth forms validation
 */

import { z } from "zod";

// Login schema
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Base register schema
const baseRegisterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
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
  role: z.enum(["mahasiswa", "dosen", "laboran"], {
    message: "Please select a role",
  }),
});

// Mahasiswa-specific fields
const mahasiswaFields = z.object({
  nim: z
    .string()
    .min(1, "NIM is required")
    .regex(
      /^[A-Z]{2}\d{7}$/,
      "NIM must be in format: BD2321001 (2 letters + 7 digits)",
    )
    .length(9, "NIM must be exactly 9 characters"),
  program_studi: z.string().min(1, "Program studi is required"),
  angkatan: z
    .number()
    .min(2020, "Invalid year")
    .max(new Date().getFullYear() + 1, "Invalid year"),
  semester: z
    .number()
    .min(1, "Semester must be at least 1")
    .max(14, "Semester must not exceed 14"),
});

// ✅ UPDATED: Dosen fields - NIDN/NUPTK instead of NIP
const dosenFields = z.object({
  nidn: z
    .string()
    .min(1, "NIDN is required")
    .regex(/^\d{10}$/, "NIDN must be exactly 10 digits"),
  nuptk: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{16}$/.test(val),
      "NUPTK must be exactly 16 digits if provided",
    ),
  nip: z.string().optional(), // NIP opsional (hanya untuk PNS)
  gelar_depan: z.string().optional(),
  gelar_belakang: z.string().optional(),
  fakultas: z.string().optional(),
  program_studi: z.string().optional(),
});

// Laboran fields - need NIP
const laboranFields = z.object({
  nip: z
    .string()
    .min(1, "NIP is required")
    .regex(/^\d{10,18}$/, "NIP must be 10-18 digits"),
});

// Full register schema with conditional validation
export const registerSchema = baseRegisterSchema
  .and(
    z.discriminatedUnion("role", [
      z.object({ role: z.literal("mahasiswa") }).merge(mahasiswaFields),
      z.object({ role: z.literal("dosen") }).merge(dosenFields),
      z.object({ role: z.literal("laboran") }).merge(laboranFields),
    ]),
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// Password update schema
export const passwordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;
