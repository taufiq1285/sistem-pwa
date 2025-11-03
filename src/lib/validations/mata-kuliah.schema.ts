/**
 * Mata Kuliah Validation Schemas
 * Zod schemas for mata kuliah form validation
 * 
 * FIXED: BUG #1 - Added minimum 10 characters validation for nama_mk
 */

import { z } from 'zod';
import {
  PROGRAM_STUDI_OPTIONS,
  isValidKodeMK,
  isValidSemester,
  isValidSKS,
} from '@/types/mata-kuliah.types';

// ============================================================================
// BASE SCHEMA
// ============================================================================

/**
 * Base mata kuliah schema (shared fields)
 */
const baseMataKuliahSchema = z.object({
  kode_mk: z
    .string()
    .min(1, 'Kode MK is required')
    .regex(
      /^[A-Z]{2,5}\d{3}$/,
      'Kode MK must be 2-5 uppercase letters followed by 3 digits (e.g., BID201, MK001)'
    )
    .length(5, 'Kode MK must be exactly 5 or 6 characters')
    .refine(
      (val) => isValidKodeMK(val),
      'Invalid Kode MK format'
    ),
  
  nama_mk: z
    .string()
    .min(1, 'Nama mata kuliah harus diisi')
    // ✅ FIXED: Changed from min(3) to min(10)
    .min(10, 'Nama mata kuliah minimal 10 karakter untuk nama yang jelas dan profesional')
    .max(100, 'Nama mata kuliah maksimal 100 karakter')
    .trim()
    .refine(
      (val) => val.length >= 10,
      'Nama mata kuliah harus minimal 10 karakter (contoh: "Asuhan Kebidanan I")'
    ),
  
  sks: z
    .number({
      message: 'SKS is required and must be a number',
    })
    .int('SKS must be an integer')
    .min(1, 'SKS must be at least 1')
    .max(6, 'SKS must not exceed 6')
    .refine(
      (val) => isValidSKS(val),
      'SKS must be between 1 and 6'
    ),
  
  semester: z
    .number({
      message: 'Semester is required and must be a number',
    })
    .int('Semester must be an integer')
    .min(1, 'Semester must be at least 1')
    .max(14, 'Semester must not exceed 14')
    .refine(
      (val) => isValidSemester(val),
      'Semester must be between 1 and 14'
    ),
  
  program_studi: z
    .enum(PROGRAM_STUDI_OPTIONS as any, {
      message: 'Program studi is required',
    }),
  
  deskripsi: z
    .string()
    .max(500, 'Deskripsi must not exceed 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating mata kuliah
 */
export const createMataKuliahSchema = baseMataKuliahSchema;

export type CreateMataKuliahFormData = z.infer<typeof createMataKuliahSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating mata kuliah
 * All fields are optional for partial updates
 */
export const updateMataKuliahSchema = baseMataKuliahSchema.partial();

export type UpdateMataKuliahFormData = z.infer<typeof updateMataKuliahSchema>;

// ============================================================================
// FILTER SCHEMA
// ============================================================================

/**
 * Schema for filtering mata kuliah
 */
export const mataKuliahFilterSchema = z.object({
  search: z.string().optional(),
  
  program_studi: z
    .enum([...PROGRAM_STUDI_OPTIONS] as any)
    .optional(),
  
  semester: z
    .number()
    .int()
    .min(1)
    .max(14)
    .optional(),
  
  sks: z
    .number()
    .int()
    .min(1)
    .max(6)
    .optional(),
  
  sortBy: z
    .enum(['kode_mk', 'nama_mk', 'semester', 'sks', 'created_at'])
    .optional()
    .default('kode_mk'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

export type MataKuliahFilterFormData = z.infer<typeof mataKuliahFilterSchema>;

// ============================================================================
// ASSIGN MAHASISWA SCHEMA
// ============================================================================

/**
 * Schema for assigning mahasiswa to mata kuliah
 */
export const assignMahasiswaSchema = z.object({
  mata_kuliah_id: z
    .string()
    .uuid('Invalid mata kuliah ID'),
  
  mahasiswa_ids: z
    .array(z.string().uuid('Invalid mahasiswa ID'))
    .min(1, 'Select at least one mahasiswa')
    .max(100, 'Cannot assign more than 100 mahasiswa at once'),
  
  kelas_id: z
    .string()
    .uuid('Invalid kelas ID')
    .optional(),
});

export type AssignMahasiswaFormData = z.infer<typeof assignMahasiswaSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMA
// ============================================================================

/**
 * Schema for bulk delete mata kuliah
 */
export const bulkDeleteMataKuliahSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid ID'))
    .min(1, 'Select at least one mata kuliah')
    .max(50, 'Cannot delete more than 50 mata kuliah at once'),
});

export type BulkDeleteMataKuliahFormData = z.infer<typeof bulkDeleteMataKuliahSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate kode_mk uniqueness (async)
 * This should be called separately with API check
 */
export async function validateKodeMKUnique(
  _kode_mk: string,
  _excludeId?: string
): Promise<boolean> {
  // TODO: Implement API check for uniqueness
  // Example: const exists = await checkKodeMKExists(kode_mk, excludeId);
  // return !exists;
  return true; // Placeholder
}

/**
 * Parse and validate form data
 */
export function parseCreateMataKuliahForm(data: unknown): CreateMataKuliahFormData {
  return createMataKuliahSchema.parse(data);
}

export function parseUpdateMataKuliahForm(data: unknown): UpdateMataKuliahFormData {
  return updateMataKuliahSchema.parse(data);
}

export function parseMataKuliahFilters(data: unknown): MataKuliahFilterFormData {
  return mataKuliahFilterSchema.parse(data);
}

// ============================================================================
// SAFE PARSE (NO THROW)
// ============================================================================

/**
 * Safe parse (returns result object instead of throwing)
 */
export function safeParseCreateMataKuliah(data: unknown) {
  return createMataKuliahSchema.safeParse(data);
}

export function safeParseUpdateMataKuliah(data: unknown) {
  return updateMataKuliahSchema.safeParse(data);
}