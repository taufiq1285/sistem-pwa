/**
 * Nilai Validation Schemas
 * Zod schemas for grades system form validation
 */

import { z } from "zod";
import type { BobotNilai } from "@/types/kelas.types";

// ============================================================================
// CONSTANTS FOR VALIDATION
// ============================================================================

const MIN_GRADE = 0;
const MAX_GRADE = 100;

// ============================================================================
// GRADE VALIDATION HELPERS
// ============================================================================

/**
 * Helper schema for grade value (0-100)
 */
const gradeValueSchema = z
  .number()
  .min(MIN_GRADE, "Nilai tidak boleh kurang dari 0")
  .max(MAX_GRADE, "Nilai tidak boleh lebih dari 100")
  .or(
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return 0;
      return Math.max(MIN_GRADE, Math.min(MAX_GRADE, num));
    }),
  );

/**
 * Optional grade value (can be null or undefined)
 */
const optionalGradeSchema = gradeValueSchema.optional().nullable().default(0);

// ============================================================================
// MAIN SCHEMAS
// ============================================================================

/**
 * Schema for creating or updating nilai
 */
export const nilaiFormSchema = z.object({
  mahasiswa_id: z.string().uuid("Mahasiswa ID tidak valid"),

  kelas_id: z.string().uuid("Kelas ID tidak valid"),

  nilai_kuis: optionalGradeSchema,
  nilai_tugas: optionalGradeSchema,
  nilai_uts: optionalGradeSchema,
  nilai_uas: optionalGradeSchema,
  nilai_praktikum: optionalGradeSchema,
  nilai_kehadiran: optionalGradeSchema,

  keterangan: z
    .string()
    .max(500, "Keterangan maksimal 500 karakter")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema for batch update nilai (multiple students at once)
 */
export const batchNilaiSchema = z.object({
  kelas_id: z.string().uuid("Kelas ID tidak valid"),

  nilai_list: z
    .array(
      z.object({
        mahasiswa_id: z.string().uuid("Mahasiswa ID tidak valid"),
        nilai_kuis: optionalGradeSchema,
        nilai_tugas: optionalGradeSchema,
        nilai_uts: optionalGradeSchema,
        nilai_uas: optionalGradeSchema,
        nilai_praktikum: optionalGradeSchema,
        nilai_kehadiran: optionalGradeSchema,
        keterangan: z.string().optional().nullable(),
      }),
    )
    .min(1, "Minimal harus ada satu mahasiswa"),
});

/**
 * Schema for filtering nilai
 */
export const nilaiFilterSchema = z.object({
  kelas_id: z.string().uuid().optional(),
  mahasiswa_id: z.string().uuid().optional(),
  min_nilai: z.number().min(0).max(100).optional(),
  max_nilai: z.number().min(0).max(100).optional(),
});

/**
 * Schema for bobot nilai (grade weights)
 * Must total to 100%
 */
export const bobotNilaiSchema = z
  .object({
    kuis: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
    tugas: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
    uts: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
    uas: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
    praktikum: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
    kehadiran: z.number().min(0).max(100, "Bobot tidak boleh lebih dari 100%"),
  })
  .refine(
    (data) => {
      const total =
        data.kuis +
        data.tugas +
        data.uts +
        data.uas +
        data.praktikum +
        data.kehadiran;
      return total === 100;
    },
    {
      message: "Total bobot nilai harus 100%",
    },
  );

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type NilaiFormData = z.infer<typeof nilaiFormSchema>;
export type BatchNilaiData = z.infer<typeof batchNilaiSchema>;
export type NilaiFilterData = z.infer<typeof nilaiFilterSchema>;
export type BobotNilaiData = z.infer<typeof bobotNilaiSchema>;

// ============================================================================
// GRADE CALCULATION HELPERS
// ============================================================================

/**
 * Calculate final grade (nilai_akhir) based on components
 * UPDATED WEIGHTS (nilai_kuis & nilai_tugas NOT USED):
 * - Kuis: 0% (NOT USED - field kept for backward compatibility)
 * - Tugas: 0% (NOT USED - field kept for backward compatibility)
 * - UTS: 25%
 * - UAS: 30%
 * - Praktikum: 40% (AUTO-SYNCED from tugas praktikum attempts)
 * - Kehadiran: 5%
 *
 * @param nilai_kuis - NOT USED (kept for backward compatibility)
 * @param nilai_tugas - NOT USED (kept for backward compatibility)
 * @param nilai_uts - Midterm grade (0-100)
 * @param nilai_uas - Final exam grade (0-100)
 * @param nilai_praktikum - Practicum grade (0-100) - AUTO from attempts
 * @param nilai_kehadiran - Attendance grade (0-100)
 * @param customWeights - Custom weights (optional, must total to 100%)
 */
export function calculateNilaiAkhir(
  nilai_kuis: number = 0,
  nilai_tugas: number = 0,
  nilai_uts: number = 0,
  nilai_uas: number = 0,
  nilai_praktikum: number = 0,
  nilai_kehadiran: number = 0,
  customWeights?: BobotNilai | null,
): number {
  // Convert percentage weights to decimal (e.g., 25% -> 0.25)
  // NOTE: nilai_kuis & nilai_tugas weights set to 0 (NOT USED)
  const weights = {
    kuis: (customWeights?.kuis ?? 0) / 100, // ❌ NOT USED
    tugas: (customWeights?.tugas ?? 0) / 100, // ❌ NOT USED
    uts: (customWeights?.uts ?? 25) / 100,
    uas: (customWeights?.uas ?? 30) / 100,
    praktikum: (customWeights?.praktikum ?? 40) / 100, // ✅ AUTO-SYNCED
    kehadiran: (customWeights?.kehadiran ?? 5) / 100,
  };

  const nilaiAkhir =
    nilai_kuis * weights.kuis + // Will be 0
    nilai_tugas * weights.tugas + // Will be 0
    nilai_uts * weights.uts +
    nilai_uas * weights.uas +
    nilai_praktikum * weights.praktikum +
    nilai_kehadiran * weights.kehadiran;

  return Math.round(nilaiAkhir * 100) / 100; // Round to 2 decimal places
}

/**
 * Get default bobot nilai (grade weights)
 * UPDATED: nilai_kuis & nilai_tugas set to 0
 */
export function getDefaultBobotNilai(): BobotNilai {
  return {
    kuis: 0, // ❌ NOT USED
    tugas: 0, // ❌ NOT USED
    uts: 25,
    uas: 30,
    praktikum: 40, // ✅ AUTO-SYNCED from tugas praktikum
    kehadiran: 5,
  };
}

/**
 * Validate that bobot nilai totals to 100%
 */
export function validateBobotNilai(bobot: BobotNilai): {
  valid: boolean;
  total: number;
} {
  const total =
    bobot.kuis +
    bobot.tugas +
    bobot.uts +
    bobot.uas +
    bobot.praktikum +
    bobot.kehadiran;
  return {
    valid: total === 100,
    total,
  };
}

/**
 * Convert numeric grade to letter grade
 */
export function getNilaiHuruf(nilaiAkhir: number): string {
  if (nilaiAkhir >= 85) return "A";
  if (nilaiAkhir >= 80) return "A-";
  if (nilaiAkhir >= 75) return "B+";
  if (nilaiAkhir >= 70) return "B";
  if (nilaiAkhir >= 65) return "B-";
  if (nilaiAkhir >= 60) return "C+";
  if (nilaiAkhir >= 55) return "C";
  if (nilaiAkhir >= 50) return "C-";
  if (nilaiAkhir >= 40) return "D";
  return "E";
}

/**
 * Get grade status (Lulus/Tidak Lulus)
 */
export function getGradeStatus(
  nilaiAkhir: number,
  passingGrade: number = 60,
): {
  status: "Lulus" | "Tidak Lulus";
  color: "green" | "red";
} {
  const isPass = nilaiAkhir >= passingGrade;
  return {
    status: isPass ? "Lulus" : "Tidak Lulus",
    color: isPass ? "green" : "red",
  };
}
