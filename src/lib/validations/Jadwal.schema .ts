/**
 * Jadwal Validation Schemas
 * Zod schemas for jadwal praktikum form validation
 * 
 * FIXED: BUG #2 - Added minimum 10 characters validation for topik
 * 
 * This file should be created at:
 * src/lib/validations/jadwal.schema.ts
 */

import { z } from 'zod';

// ============================================================================
// JADWAL SCHEMA
// ============================================================================

/**
 * Schema for jadwal praktikum
 * Used in JadwalPage.tsx for Create & Edit forms
 */
export const jadwalSchema = z.object({
  kelas: z
    .string()
    .min(1, 'Kelas harus diisi')
    .max(10, 'Kelas maksimal 10 karakter')
    .regex(
      /^[A-Z0-9\s\-]+$/,
      'Kelas hanya boleh huruf kapital, angka, spasi, dan tanda hubung'
    ),
  
  laboratorium_id: z
    .string()
    .min(1, 'Laboratorium harus dipilih')
    .uuid('Invalid laboratorium ID'),
  
  tanggal_praktikum: z
    .date({
      message: 'Tanggal praktikum harus dipilih',
    })
    .refine(
      (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
      'Tanggal praktikum tidak boleh di masa lalu'
    ),
  
  jam_mulai: z
    .string()
    .min(1, 'Jam mulai harus dipilih')
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Format jam harus HH:MM (contoh: 08:00)'
    ),
  
  jam_selesai: z
    .string()
    .min(1, 'Jam selesai harus dipilih')
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Format jam harus HH:MM (contoh: 10:00)'
    ),
  
  // ✅ FIXED: Added minimum 10 characters validation for topik
  topik: z
    .string()
    .min(10, 'Topik minimal 10 karakter untuk menjelaskan materi praktikum dengan jelas')
    .max(200, 'Topik maksimal 200 karakter')
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || val.length >= 10,
      'Jika diisi, topik harus minimal 10 karakter (contoh: "Praktikum ANC: Pemeriksaan Leopold I-IV")'
    ),
  
  catatan: z
    .string()
    .max(500, 'Catatan maksimal 500 karakter')
    .trim()
    .optional()
    .or(z.literal('')),
  
  is_active: z
    .boolean()
    .optional()
    .default(true),
})
.refine(
  (data) => data.jam_mulai < data.jam_selesai,
  {
    message: 'Jam selesai harus lebih besar dari jam mulai',
    path: ['jam_selesai'],
  }
)
.refine(
  (data) => {
    // Validate minimum duration (at least 30 minutes)
    const [startHour, startMin] = data.jam_mulai.split(':').map(Number);
    const [endHour, endMin] = data.jam_selesai.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) >= 30;
  },
  {
    message: 'Durasi praktikum minimal 30 menit',
    path: ['jam_selesai'],
  }
);

export type JadwalFormData = z.infer<typeof jadwalSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating jadwal
 */
export const createJadwalSchema = jadwalSchema;

export type CreateJadwalFormData = z.infer<typeof createJadwalSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating jadwal
 * All fields are optional for partial updates
 */
export const updateJadwalSchema = jadwalSchema.partial();

export type UpdateJadwalFormData = z.infer<typeof updateJadwalSchema>;

// ============================================================================
// FILTER SCHEMA
// ============================================================================

/**
 * Schema for filtering jadwal
 */
export const jadwalFilterSchema = z.object({
  kelas: z.string().optional(),
  
  laboratorium_id: z
    .string()
    .uuid('Invalid laboratorium ID')
    .optional(),
  
  hari: z
    .enum(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'])
    .optional(),
  
  tanggal_start: z.date().optional(),
  
  tanggal_end: z.date().optional(),
  
  is_active: z.boolean().optional(),
  
  sortBy: z
    .enum(['tanggal_praktikum', 'jam_mulai', 'kelas', 'created_at'])
    .optional()
    .default('tanggal_praktikum'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

export type JadwalFilterFormData = z.infer<typeof jadwalFilterSchema>;

// ============================================================================
// CONFLICT CHECK SCHEMA
// ============================================================================

/**
 * Schema for checking jadwal conflicts
 * Used to validate before creating/updating jadwal
 */
export const jadwalConflictCheckSchema = z.object({
  laboratorium_id: z
    .string()
    .uuid('Invalid laboratorium ID'),
  
  tanggal_praktikum: z.date(),
  
  jam_mulai: z.string(),
  
  jam_selesai: z.string(),
  
  exclude_id: z
    .string()
    .uuid('Invalid jadwal ID')
    .optional(), // For update operations
});

export type JadwalConflictCheckData = z.infer<typeof jadwalConflictCheckSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Parse and validate form data
 */
export function parseCreateJadwalForm(data: unknown): CreateJadwalFormData {
  return createJadwalSchema.parse(data);
}

export function parseUpdateJadwalForm(data: unknown): UpdateJadwalFormData {
  return updateJadwalSchema.parse(data);
}

export function parseJadwalFilters(data: unknown): JadwalFilterFormData {
  return jadwalFilterSchema.parse(data);
}

export function parseConflictCheck(data: unknown): JadwalConflictCheckData {
  return jadwalConflictCheckSchema.parse(data);
}

// ============================================================================
// SAFE PARSE (NO THROW)
// ============================================================================

/**
 * Safe parse (returns result object instead of throwing)
 */
export function safeParseCreateJadwal(data: unknown) {
  return createJadwalSchema.safeParse(data);
}

export function safeParseUpdateJadwal(data: unknown) {
  return updateJadwalSchema.safeParse(data);
}

export function safeParseConflictCheck(data: unknown) {
  return jadwalConflictCheckSchema.safeParse(data);
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Check if two time ranges overlap
 */
export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const [s1Hour, s1Min] = start1.split(':').map(Number);
  const [e1Hour, e1Min] = end1.split(':').map(Number);
  const [s2Hour, s2Min] = start2.split(':').map(Number);
  const [e2Hour, e2Min] = end2.split(':').map(Number);
  
  const s1Minutes = s1Hour * 60 + s1Min;
  const e1Minutes = e1Hour * 60 + e1Min;
  const s2Minutes = s2Hour * 60 + s2Min;
  const e2Minutes = e2Hour * 60 + e2Min;
  
  // Check overlap: (start1 < end2) AND (start2 < end1)
  return s1Minutes < e2Minutes && s2Minutes < e1Minutes;
}

/**
 * Convert time string to minutes
 */
export function timeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number);
  return hour * 60 + min;
}

/**
 * Calculate duration in minutes
 */
export function calculateDuration(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// In JadwalPage.tsx:

import { jadwalSchema, type JadwalFormData } from '@/lib/validations/jadwal.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const form = useForm<JadwalFormData>({
  resolver: zodResolver(jadwalSchema),
  defaultValues: {
    kelas: '',
    laboratorium_id: '',
    tanggal_praktikum: new Date(),
    jam_mulai: '08:00',
    jam_selesai: '10:00',
    topik: '',
    catatan: '',
    is_active: true,
  },
});

// Conflict check before submit:
const handleCreate = async (data: JadwalFormData) => {
  // Check for conflicts
  const conflicts = await checkJadwalConflict({
    laboratorium_id: data.laboratorium_id,
    tanggal_praktikum: data.tanggal_praktikum,
    jam_mulai: data.jam_mulai,
    jam_selesai: data.jam_selesai,
  });
  
  if (conflicts.length > 0) {
    toast.error('Jadwal bentrok!', {
      description: 'Lab sudah dibooking pada waktu tersebut',
    });
    return;
  }
  
  // Create jadwal
  await createJadwal(data);
};
*/