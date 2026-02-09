/**
 * Kuis Validation Schemas
 * Zod schemas for quiz system form validation
 * FIXED: All field types match database and form exactly
 */

import { z } from "zod";
import { TIPE_SOAL } from "@/types/kuis.types";

// ============================================================================
// CONSTANTS FOR VALIDATION
// ============================================================================

const MIN_QUIZ_DURATION = 5; // minutes
const MAX_QUIZ_DURATION = 300; // 5 hours
const MIN_PASSING_GRADE = 0;
const MAX_PASSING_GRADE = 100;
const MIN_MAX_ATTEMPTS = 1;
const MAX_MAX_ATTEMPTS = 10;
const MIN_QUESTION_POINTS = 1;
const MAX_QUESTION_POINTS = 100;
const MIN_OPTIONS_COUNT = 2;
const MAX_OPTIONS_COUNT = 6;

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base quiz schema (shared fields)
 */
const baseKuisSchema = z.object({
  judul: z
    .string()
    .min(1, "Judul kuis harus diisi")
    .min(5, "Judul kuis minimal 5 karakter")
    .max(200, "Judul kuis maksimal 200 karakter")
    .trim(),

  deskripsi: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .trim()
    .optional()
    .or(z.literal("")),

  kelas_id: z.string().uuid("Kelas ID tidak valid"),

  // ✅ NEW: Tipe kuis (essay = laporan, pilihan_ganda = tes CBT, campuran = mixed)
  tipe_kuis: z
    .enum(["essay", "pilihan_ganda", "campuran"] as const, {
      message: "Tipe kuis tidak valid",
    })
    .optional(),

  // UPDATED: Durasi always required (no default to avoid optional type)
  // Untuk CBT: 60 menit, untuk laporan: 10080 menit (1 minggu)
  durasi_menit: z
    .number({
      message: "Durasi harus diisi dan berupa angka",
    })
    .int("Durasi harus berupa bilangan bulat")
    .min(MIN_QUIZ_DURATION, `Durasi minimal ${MIN_QUIZ_DURATION} menit`)
    .max(10080, `Durasi maksimal 10080 menit (1 minggu)`),

  tanggal_mulai: z.string().optional().nullable(),

  tanggal_selesai: z.string().optional().nullable(),

  // FIXED: Make these consistent with form defaults
  passing_score: z
    .number({
      message: "Passing score harus berupa angka",
    })
    .int("Passing score harus berupa bilangan bulat")
    .min(MIN_PASSING_GRADE, `Passing score minimal ${MIN_PASSING_GRADE}`)
    .max(MAX_PASSING_GRADE, `Passing score maksimal ${MAX_PASSING_GRADE}`)
    .nullable()
    .optional(),

  max_attempts: z
    .number({
      message: "Maksimal percobaan harus berupa angka",
    })
    .int("Maksimal percobaan harus berupa bilangan bulat")
    .min(MIN_MAX_ATTEMPTS, `Minimal ${MIN_MAX_ATTEMPTS} percobaan`)
    .max(MAX_MAX_ATTEMPTS, `Maksimal ${MAX_MAX_ATTEMPTS} percobaan`)
    .nullable()
    .optional(),

  randomize_questions: z.boolean().nullable().optional(),

  randomize_options: z.boolean().nullable().optional(),

  show_results_immediately: z.boolean().nullable().optional(),

  status: z
    .enum(["draft", "published", "archived"] as const)
    .nullable()
    .optional(),
});

/**
 * Opsi Jawaban schema for multiple choice
 */
const opsiJawabanSchema = z.object({
  id: z.string().min(1, "ID opsi tidak valid"),
  label: z.string().min(1, "Label opsi harus diisi"),
  text: z
    .string()
    .min(1, "Teks opsi harus diisi")
    .max(500, "Teks opsi maksimal 500 karakter"),
  is_correct: z.boolean().optional(),
});

/**
 * Base soal (question) schema
 */
const baseSoalSchema = z.object({
  pertanyaan: z
    .string()
    .min(1, "Pertanyaan harus diisi")
    .min(10, "Pertanyaan minimal 10 karakter untuk kejelasan")
    .max(2000, "Pertanyaan maksimal 2000 karakter")
    .trim(),

  tipe_soal: z.enum(
    [
      TIPE_SOAL.PILIHAN_GANDA,
      TIPE_SOAL.ESSAY,
      TIPE_SOAL.BENAR_SALAH,
      TIPE_SOAL.JAWABAN_SINGKAT,
    ] as any,
    { message: "Tipe soal tidak valid" },
  ),

  poin: z
    .number({
      message: "Poin harus diisi dan berupa angka",
    })
    .int("Poin harus berupa bilangan bulat")
    .min(MIN_QUESTION_POINTS, `Poin minimal ${MIN_QUESTION_POINTS}`)
    .max(MAX_QUESTION_POINTS, `Poin maksimal ${MAX_QUESTION_POINTS}`),

  urutan: z
    .number({
      message: "Urutan harus diisi dan berupa angka",
    })
    .int("Urutan harus berupa bilangan bulat")
    .min(1, "Urutan minimal 1"),

  penjelasan: z
    .string()
    .max(1000, "Penjelasan maksimal 1000 karakter")
    .trim()
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// CREATE QUIZ SCHEMA
// ============================================================================

/**
 * Schema for creating new quiz
 */
export const createKuisSchema = baseKuisSchema
  .extend({
    dosen_id: z.string().uuid("Dosen ID tidak valid"),
  })
  .refine(
    (data) => {
      // Validate tanggal_selesai > tanggal_mulai
      if (data.tanggal_mulai && data.tanggal_selesai) {
        const mulai = new Date(data.tanggal_mulai);
        const selesai = new Date(data.tanggal_selesai);
        return selesai > mulai;
      }
      return true;
    },
    {
      message: "Tanggal selesai harus lebih besar dari tanggal mulai",
      path: ["tanggal_selesai"],
    },
  );

export type CreateKuisFormData = z.infer<typeof createKuisSchema>;

// ============================================================================
// UPDATE QUIZ SCHEMA
// ============================================================================

/**
 * Schema for updating quiz
 */
export const updateKuisSchema = baseKuisSchema
  .partial()
  .extend({
    id: z.string().uuid("ID kuis tidak valid"),
  })
  .refine(
    (data) => {
      if (data.tanggal_mulai && data.tanggal_selesai) {
        const start = new Date(data.tanggal_mulai);
        const end = new Date(data.tanggal_selesai);
        return end > start;
      }
      return true;
    },
    {
      message: "Tanggal selesai harus setelah tanggal mulai",
      path: ["tanggal_selesai"],
    },
  );

export type UpdateKuisFormData = z.infer<typeof updateKuisSchema>;

// ============================================================================
// CREATE QUESTION SCHEMAS (BY TYPE)
// ============================================================================

/**
 * Schema for Multiple Choice question
 */
export const createSoalPilihanGandaSchema = baseSoalSchema
  .extend({
    kuis_id: z.string().uuid("ID kuis tidak valid"),
    tipe_soal: z.literal(TIPE_SOAL.PILIHAN_GANDA as any),
    opsi_jawaban: z
      .array(opsiJawabanSchema)
      .min(MIN_OPTIONS_COUNT, `Minimal ${MIN_OPTIONS_COUNT} opsi jawaban`)
      .max(MAX_OPTIONS_COUNT, `Maksimal ${MAX_OPTIONS_COUNT} opsi jawaban`),
  })
  .refine(
    (data) => {
      const correctAnswers = data.opsi_jawaban.filter((opt) => opt.is_correct);
      return correctAnswers.length === 1;
    },
    {
      message: "Harus ada tepat 1 jawaban yang benar untuk pilihan ganda",
      path: ["opsi_jawaban"],
    },
  );

export type CreateSoalPilihanGandaFormData = z.infer<
  typeof createSoalPilihanGandaSchema
>;

/**
 * Schema for Essay question
 */
export const createSoalEssaySchema = baseSoalSchema.extend({
  kuis_id: z.string().uuid("ID kuis tidak valid"),
  tipe_soal: z.literal(TIPE_SOAL.ESSAY as any),
  jawaban_benar: z
    .string()
    .max(2000, "Kunci jawaban maksimal 2000 karakter")
    .optional()
    .or(z.literal("")),
});

export type CreateSoalEssayFormData = z.infer<typeof createSoalEssaySchema>;

/**
 * Schema for True/False question
 */
export const createSoalBenarSalahSchema = baseSoalSchema.extend({
  kuis_id: z.string().uuid("ID kuis tidak valid"),
  tipe_soal: z.literal(TIPE_SOAL.BENAR_SALAH as any),
  jawaban_benar: z.enum(["true", "false"], {
    message: "Jawaban benar harus 'true' atau 'false'",
  }),
});

export type CreateSoalBenarSalahFormData = z.infer<
  typeof createSoalBenarSalahSchema
>;

/**
 * Schema for Short Answer question
 */
export const createSoalJawabanSingkatSchema = baseSoalSchema.extend({
  kuis_id: z.string().uuid("ID kuis tidak valid"),
  tipe_soal: z.literal(TIPE_SOAL.JAWABAN_SINGKAT as any),
  jawaban_benar: z
    .string()
    .min(1, "Kunci jawaban harus diisi")
    .max(500, "Kunci jawaban maksimal 500 karakter"),
});

export type CreateSoalJawabanSingkatFormData = z.infer<
  typeof createSoalJawabanSingkatSchema
>;

/**
 * Generic create question schema (union of all types)
 */
export const createSoalSchema = z.discriminatedUnion("tipe_soal", [
  createSoalPilihanGandaSchema,
  createSoalEssaySchema,
  createSoalBenarSalahSchema,
  createSoalJawabanSingkatSchema,
]);

export type CreateSoalFormData = z.infer<typeof createSoalSchema>;

// ============================================================================
// UPDATE QUESTION SCHEMA
// ============================================================================

export const updateSoalSchema = z.discriminatedUnion("tipe_soal", [
  createSoalPilihanGandaSchema.partial().extend({
    id: z.string().uuid("ID soal tidak valid"),
    tipe_soal: z.literal(TIPE_SOAL.PILIHAN_GANDA as any),
  }),
  createSoalEssaySchema.partial().extend({
    id: z.string().uuid("ID soal tidak valid"),
    tipe_soal: z.literal(TIPE_SOAL.ESSAY as any),
  }),
  createSoalBenarSalahSchema.partial().extend({
    id: z.string().uuid("ID soal tidak valid"),
    tipe_soal: z.literal(TIPE_SOAL.BENAR_SALAH as any),
  }),
  createSoalJawabanSingkatSchema.partial().extend({
    id: z.string().uuid("ID soal tidak valid"),
    tipe_soal: z.literal(TIPE_SOAL.JAWABAN_SINGKAT as any),
  }),
]);

export type UpdateSoalFormData = z.infer<typeof updateSoalSchema>;

// ============================================================================
// QUIZ ATTEMPT SCHEMAS
// ============================================================================

export const startAttemptSchema = z.object({
  kuis_id: z.string().uuid("ID kuis tidak valid"),
  mahasiswa_id: z.string().uuid("ID mahasiswa tidak valid"),
});

export type StartAttemptFormData = z.infer<typeof startAttemptSchema>;

export const submitAnswerSchema = z.object({
  attempt_id: z.string().uuid("ID attempt tidak valid"),
  soal_id: z.string().uuid("ID soal tidak valid"),
  jawaban: z
    .string()
    .min(1, "Jawaban harus diisi")
    .max(5000, "Jawaban maksimal 5000 karakter"),
});

export type SubmitAnswerFormData = z.infer<typeof submitAnswerSchema>;

export const submitQuizSchema = z.object({
  attempt_id: z.string().uuid("ID attempt tidak valid"),
  time_spent: z
    .number()
    .int("Waktu harus berupa bilangan bulat")
    .min(0, "Waktu tidak boleh negatif"),
});

export type SubmitQuizFormData = z.infer<typeof submitQuizSchema>;

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

export const kuisFilterSchema = z.object({
  search: z.string().optional(),
  kelas_id: z.string().uuid("Kelas ID tidak valid").optional(),
  dosen_id: z.string().uuid("Dosen ID tidak valid").optional(),
  status_db: z.enum(["draft", "published", "archived"] as any).optional(),
  status_waktu: z.enum(["upcoming", "ongoing", "past"] as any).optional(),
  sortBy: z
    .enum(["judul", "tanggal_mulai", "tanggal_selesai", "created_at"])
    .optional()
    .default("tanggal_mulai"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type KuisFilterFormData = z.infer<typeof kuisFilterSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

export const bulkDeleteKuisSchema = z.object({
  ids: z
    .array(z.string().uuid("ID tidak valid"))
    .min(1, "Pilih minimal 1 kuis")
    .max(50, "Maksimal 50 kuis"),
});

export type BulkDeleteKuisFormData = z.infer<typeof bulkDeleteKuisSchema>;

export const bulkDeleteSoalSchema = z.object({
  ids: z
    .array(z.string().uuid("ID tidak valid"))
    .min(1, "Pilih minimal 1 soal")
    .max(100, "Maksimal 100 soal"),
});

export type BulkDeleteSoalFormData = z.infer<typeof bulkDeleteSoalSchema>;

// ============================================================================
// VALIDATION CONSTANTS EXPORT
// ============================================================================

export const VALIDATION_CONSTANTS = {
  MIN_QUIZ_DURATION,
  MAX_QUIZ_DURATION,
  MIN_PASSING_GRADE,
  MAX_PASSING_GRADE,
  MIN_MAX_ATTEMPTS,
  MAX_MAX_ATTEMPTS,
  MIN_QUESTION_POINTS,
  MAX_QUESTION_POINTS,
  MIN_OPTIONS_COUNT,
  MAX_OPTIONS_COUNT,
} as const;
