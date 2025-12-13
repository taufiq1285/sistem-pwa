/**
 * Kuis Validation Schema Unit Tests
 * Comprehensive tests for quiz validation
 */

import { describe, it, expect } from "vitest";
import {
  createKuisSchema,
  updateKuisSchema,
  createSoalPilihanGandaSchema,
  createSoalBenarSalahSchema,
  createSoalEssaySchema,
  createSoalJawabanSingkatSchema,
  startAttemptSchema,
  submitAnswerSchema,
  submitQuizSchema,
  VALIDATION_CONSTANTS,
} from "../../../lib/validations/kuis.schema";
import { TIPE_SOAL } from "../../../types/kuis.types";

describe("Kuis Validation Schemas", () => {
  describe("createKuisSchema", () => {
    it("should validate correct quiz data", () => {
      const validData = {
        judul: "Quiz Pemrograman Dasar",
        deskripsi: "Quiz tentang konsep dasar pemrograman",
        kelas_id: "123e4567-e89b-12d3-a456-426614174000",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 60,
        tanggal_mulai: "2024-12-01T10:00:00Z",
        tanggal_selesai: "2024-12-01T12:00:00Z",
        passing_score: 75,
        max_attempts: 3,
        randomize_questions: true,
        randomize_options: true,
        show_results_immediately: false,
        status: "draft" as const,
      };

      const result = createKuisSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject judul shorter than 5 characters", () => {
      const invalidData = {
        judul: "Quiz",
        kelas_id: "123e4567-e89b-12d3-a456-426614174000",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 60,
        tanggal_mulai: new Date().toISOString(),
        tanggal_selesai: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const result = createKuisSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject durasi below minimum", () => {
      const invalidData = {
        judul: "Quiz Pemrograman",
        kelas_id: "123e4567-e89b-12d3-a456-426614174000",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 3,
        tanggal_mulai: new Date().toISOString(),
        tanggal_selesai: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const result = createKuisSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("minimal");
      }
    });

    it("should reject durasi above maximum", () => {
      const invalidData = {
        judul: "Quiz Pemrograman",
        kelas_id: "123e4567-e89b-12d3-a456-426614174000",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 400,
        tanggal_mulai: new Date().toISOString(),
        tanggal_selesai: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const result = createKuisSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("maksimal");
      }
    });

    it("should reject invalid UUID for kelas_id", () => {
      const invalidData = {
        judul: "Quiz Pemrograman",
        kelas_id: "invalid-uuid",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 60,
        tanggal_mulai: new Date().toISOString(),
        tanggal_selesai: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      const result = createKuisSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should accept optional fields as null", () => {
      const validData = {
        judul: "Quiz Pemrograman",
        kelas_id: "123e4567-e89b-12d3-a456-426614174000",
        dosen_id: "123e4567-e89b-12d3-a456-426614174001",
        durasi_menit: 60,
        tanggal_mulai: new Date().toISOString(),
        tanggal_selesai: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        passing_score: null,
        max_attempts: null,
        randomize_questions: null,
      };

      const result = createKuisSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("updateKuisSchema", () => {
    it("should validate quiz update", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        judul: "Updated Quiz Title",
        durasi_menit: 90,
      };

      const result = updateKuisSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should validate tanggal_selesai after tanggal_mulai", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_mulai: "2024-12-01T12:00:00Z",
        tanggal_selesai: "2024-12-01T10:00:00Z",
      };

      const result = updateKuisSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("setelah");
      }
    });

    it("should allow partial updates", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        passing_score: 80,
      };

      const result = updateKuisSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("createSoalPilihanGandaSchema", () => {
    it("should validate multiple choice question", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Apa yang dimaksud dengan variable dalam pemrograman?",
        tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
        poin: 10,
        urutan: 1,
        opsi_jawaban: [
          {
            id: "1",
            label: "A",
            text: "Tempat menyimpan data",
            is_correct: true,
          },
          { id: "2", label: "B", text: "Fungsi matematika", is_correct: false },
          { id: "3", label: "C", text: "Loop statement", is_correct: false },
          { id: "4", label: "D", text: "Kondisi if-else", is_correct: false },
        ],
      };

      const result = createSoalPilihanGandaSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject with less than 2 options", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Test question?",
        tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
        poin: 10,
        urutan: 1,
        opsi_jawaban: [
          { id: "1", label: "A", text: "Only one option", is_correct: true },
        ],
      };

      const result = createSoalPilihanGandaSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Minimal");
      }
    });

    it("should reject with no correct answer", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Test question?",
        tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
        poin: 10,
        urutan: 1,
        opsi_jawaban: [
          { id: "1", label: "A", text: "Option 1", is_correct: false },
          { id: "2", label: "B", text: "Option 2", is_correct: false },
        ],
      };

      const result = createSoalPilihanGandaSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tepat 1");
      }
    });

    it("should reject with multiple correct answers", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Test question?",
        tipe_soal: TIPE_SOAL.PILIHAN_GANDA,
        poin: 10,
        urutan: 1,
        opsi_jawaban: [
          { id: "1", label: "A", text: "Option 1", is_correct: true },
          { id: "2", label: "B", text: "Option 2", is_correct: true },
        ],
      };

      const result = createSoalPilihanGandaSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("createSoalBenarSalahSchema", () => {
    it("should validate true/false question", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Variable dapat menyimpan data?",
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 5,
        urutan: 1,
        jawaban_benar: "true" as const,
      };

      const result = createSoalBenarSalahSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject invalid jawaban_benar", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Test question?",
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 5,
        urutan: 1,
        jawaban_benar: "maybe",
      };

      const result = createSoalBenarSalahSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("createSoalEssaySchema", () => {
    it("should validate essay question", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Jelaskan konsep Object Oriented Programming",
        tipe_soal: TIPE_SOAL.ESSAY,
        poin: 20,
        urutan: 1,
        jawaban_benar: "OOP adalah paradigma pemrograman...",
      };

      const result = createSoalEssaySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should allow empty jawaban_benar for essay", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Jelaskan konsep OOP",
        tipe_soal: TIPE_SOAL.ESSAY,
        poin: 20,
        urutan: 1,
        jawaban_benar: "",
      };

      const result = createSoalEssaySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("createSoalJawabanSingkatSchema", () => {
    it("should validate short answer question", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Apa kepanjangan dari OOP?",
        tipe_soal: TIPE_SOAL.JAWABAN_SINGKAT,
        poin: 5,
        urutan: 1,
        jawaban_benar: "Object Oriented Programming",
      };

      const result = createSoalJawabanSingkatSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject empty jawaban_benar", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "What is OOP?",
        tipe_soal: TIPE_SOAL.JAWABAN_SINGKAT,
        poin: 5,
        urutan: 1,
        jawaban_benar: "",
      };

      const result = createSoalJawabanSingkatSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("startAttemptSchema", () => {
    it("should validate start attempt data", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        mahasiswa_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = startAttemptSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalidData = {
        kuis_id: "invalid-uuid",
        mahasiswa_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = startAttemptSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("submitAnswerSchema", () => {
    it("should validate submit answer data", () => {
      const validData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        soal_id: "123e4567-e89b-12d3-a456-426614174001",
        jawaban: "A",
      };

      const result = submitAnswerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject empty jawaban", () => {
      const invalidData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        soal_id: "123e4567-e89b-12d3-a456-426614174001",
        jawaban: "",
      };

      const result = submitAnswerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject jawaban longer than 5000 characters", () => {
      const invalidData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        soal_id: "123e4567-e89b-12d3-a456-426614174001",
        jawaban: "a".repeat(5001),
      };

      const result = submitAnswerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("submitQuizSchema", () => {
    it("should validate submit quiz data", () => {
      const validData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        time_spent: 3600,
      };

      const result = submitQuizSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject negative time_spent", () => {
      const invalidData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        time_spent: -100,
      };

      const result = submitQuizSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject non-integer time_spent", () => {
      const invalidData = {
        attempt_id: "123e4567-e89b-12d3-a456-426614174000",
        time_spent: 3600.5,
      };

      const result = submitQuizSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("VALIDATION_CONSTANTS", () => {
    it("should export all validation constants", () => {
      expect(VALIDATION_CONSTANTS.MIN_QUIZ_DURATION).toBe(5);
      expect(VALIDATION_CONSTANTS.MAX_QUIZ_DURATION).toBe(300);
      expect(VALIDATION_CONSTANTS.MIN_PASSING_GRADE).toBe(0);
      expect(VALIDATION_CONSTANTS.MAX_PASSING_GRADE).toBe(100);
      expect(VALIDATION_CONSTANTS.MIN_MAX_ATTEMPTS).toBe(1);
      expect(VALIDATION_CONSTANTS.MAX_MAX_ATTEMPTS).toBe(10);
      expect(VALIDATION_CONSTANTS.MIN_QUESTION_POINTS).toBe(1);
      expect(VALIDATION_CONSTANTS.MAX_QUESTION_POINTS).toBe(100);
      expect(VALIDATION_CONSTANTS.MIN_OPTIONS_COUNT).toBe(2);
      expect(VALIDATION_CONSTANTS.MAX_OPTIONS_COUNT).toBe(6);
    });
  });

  describe("Edge Cases", () => {
    it("should handle pertanyaan at minimum length", () => {
      const validData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Short que?", // 10 characters (minimum)
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 5,
        urutan: 1,
        jawaban_benar: "true" as const,
      };

      const result = createSoalBenarSalahSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject pertanyaan shorter than minimum", () => {
      const invalidData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "Short?", // 6 characters
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 5,
        urutan: 1,
        jawaban_benar: "true",
      };

      const result = createSoalBenarSalahSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should handle poin at boundaries", () => {
      const minPoinData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "What is programming?",
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 1, // Minimum
        urutan: 1,
        jawaban_benar: "true" as const,
      };

      const maxPoinData = {
        kuis_id: "123e4567-e89b-12d3-a456-426614174000",
        pertanyaan: "What is programming?",
        tipe_soal: TIPE_SOAL.BENAR_SALAH,
        poin: 100, // Maximum
        urutan: 1,
        jawaban_benar: "true" as const,
      };

      expect(createSoalBenarSalahSchema.safeParse(minPoinData).success).toBe(
        true,
      );
      expect(createSoalBenarSalahSchema.safeParse(maxPoinData).success).toBe(
        true,
      );
    });
  });
});
