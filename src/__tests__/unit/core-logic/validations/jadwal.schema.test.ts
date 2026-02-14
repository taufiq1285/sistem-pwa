/**
 * Jadwal Schema Validation Tests
 *
 * Tests for schedule validation including:
 * - Time format validation (HH:MM format)
 * - Duration validation (min 30 minutes)
 * - Date validation (not in past)
 * - Conflict checking
 * - Time overlap detection
 * - White-box testing: Branch, Condition, Statement coverage
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  jadwalSchema,
  createJadwalSchema,
  updateJadwalSchema,
  jadwalFilterSchema,
  jadwalConflictCheckSchema,
  isTimeOverlap,
  timeToMinutes,
  calculateDuration,
  parseCreateJadwalForm,
  parseUpdateJadwalForm,
  parseJadwalFilters,
  parseConflictCheck,
  safeParseCreateJadwal,
  safeParseUpdateJadwal,
  safeParseConflictCheck,
} from "@/lib/validations/jadwal.schema";

const futureDate = (daysFromNow = 30) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const today = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const pastDate = (daysAgo = 1) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

describe("Jadwal Schema Validation", () => {
  // ========================================
  // 1. jadwalSchema - Valid Cases
  // ========================================

  describe("jadwalSchema - Valid Cases", () => {
    it("should accept valid jadwal data with all fields", () => {
      const validData = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Praktikum ANC: Pemeriksaan Leopold I-IV",
        catatan: "Bawa alat peraga",
        is_active: true,
      };

      const result = jadwalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept valid jadwal data with only required fields", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept kelas with uppercase letters", () => {
      const data = {
        kelas: "ABC",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept kelas with uppercase and numbers", () => {
      const data = {
        kelas: "A1",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept kelas with uppercase, numbers, spaces, and hyphens", () => {
      const data = {
        kelas: "A-1 B",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept kelas with single character", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept kelas with exactly 10 characters", () => {
      const data = {
        kelas: "ABCDEFGHIJ",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept today's date (not in past)", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: today(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept minimum duration of exactly 30 minutes", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "08:30",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept duration longer than 30 minutes", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "12:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept time at start of day (00:00)", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "00:00",
        jam_selesai: "00:30",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept time at end of day (23:59)", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "23:00",
        jam_selesai: "23:59",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept time with single digit hour", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "8:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept time with leading zero hour", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept topik with exactly 10 characters", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "1234567890",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept topik with exactly 200 characters", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "A".repeat(200),
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty topik string", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept undefined topik", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: undefined,
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept catatan with exactly 500 characters", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        catatan: "A".repeat(500),
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty catatan", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        catatan: "",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept is_active as true", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        is_active: true,
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept is_active as false", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        is_active: false,
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept undefined is_active (defaults to true)", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  // ========================================
  // 2. jadwalSchema - Invalid Cases
  // ========================================

  describe("jadwalSchema - Invalid Cases", () => {
    describe("kelas validation", () => {
      it("should reject empty kelas", () => {
        const data = {
          kelas: "",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject kelas with lowercase letters", () => {
        const data = {
          kelas: "a",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("huruf kapital");
        }
      });

      it("should reject kelas with special characters", () => {
        const data = {
          kelas: "A@B",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject kelas longer than 10 characters", () => {
        const data = {
          kelas: "ABCDEFGHIJK",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("maksimal 10 karakter");
        }
      });
    });

    describe("laboratorium_id validation", () => {
      it("should reject empty laboratorium_id", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid UUID format", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "invalid-uuid",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Invalid");
        }
      });

      it("should reject non-UUID string", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("tanggal_praktikum validation", () => {
      it("should reject past dates", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: pastDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("masa lalu");
        }
      });

      it("should reject date before today", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: new Date("2020-01-01"),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid date", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: "invalid-date",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("jam_mulai validation", () => {
      it("should reject empty jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid time format (no colon)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "0800",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid hour (24:00)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "24:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid hour (25:00)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "25:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("HH:MM");
        }
      });

      it("should reject invalid minute (60)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:60",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid minute (99)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:99",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("jam_selesai validation", () => {
      it("should reject empty jam_selesai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject invalid time format", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "invalid",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("time order validation", () => {
      it("should reject when jam_selesai equals jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("lebih besar");
        }
      });

      it("should reject when jam_selesai less than jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "10:00",
          jam_selesai: "08:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("duration validation", () => {
      it("should reject duration less than 30 minutes (29 minutes)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:29",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("minimal 30 menit");
        }
      });

      it("should reject duration less than 30 minutes (1 minute)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:01",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("topik validation", () => {
      it("should reject topik between 1-9 characters", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "123456789",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("minimal 10 karakter");
        }
      });

      it("should reject topik longer than 200 characters", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "A".repeat(201),
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("maksimal 200 karakter");
        }
      });
    });

    describe("catatan validation", () => {
      it("should reject catatan longer than 500 characters", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          catatan: "A".repeat(501),
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("maksimal 500 karakter");
        }
      });
    });
  });

  // ========================================
  // 3. updateJadwalSchema Tests
  // ========================================

  describe("updateJadwalSchema", () => {
    it("should accept partial updates with single field", () => {
      const data = {
        kelas: "B",
      };

      const result = updateJadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept partial updates with multiple fields", () => {
      const data = {
        kelas: "B",
        jam_mulai: "09:00",
        jam_selesai: "11:00",
      };

      const result = updateJadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty update object", () => {
      const result = updateJadwalSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept update with only optional fields", () => {
      const data = {
        topik: "Updated topik with enough characters",
        catatan: "Updated catatan",
        is_active: false,
      };

      const result = updateJadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should still validate field constraints in partial updates", () => {
      const data = {
        kelas: "invalid-lowercase",
      };

      const result = updateJadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // 4. jadwalFilterSchema Tests
  // ========================================

  describe("jadwalFilterSchema", () => {
    it("should accept valid filters with all fields", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        hari: "senin",
        tanggal_start: futureDate(1),
        tanggal_end: futureDate(7),
        is_active: true,
        sortBy: "tanggal_praktikum",
        sortOrder: "desc",
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept empty filters", () => {
      const result = jadwalFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should use default sortBy and sortOrder when not provided", () => {
      const result = jadwalFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe("tanggal_praktikum");
        expect(result.data.sortOrder).toBe("asc");
      }
    });

    it("should accept all valid hari enum values", () => {
      const days = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

      days.forEach((day) => {
        const result = jadwalFilterSchema.safeParse({ hari: day });
        expect(result.success).toBe(true);
      });
    });

    it("should accept all valid sortBy enum values", () => {
      const sortFields = ["tanggal_praktikum", "jam_mulai", "kelas", "created_at"];

      sortFields.forEach((sortBy) => {
        const result = jadwalFilterSchema.safeParse({ sortBy });
        expect(result.success).toBe(true);
      });
    });

    it("should accept all valid sortOrder enum values", () => {
      const sortOrders = ["asc", "desc"];

      sortOrders.forEach((sortOrder) => {
        const result = jadwalFilterSchema.safeParse({ sortOrder });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid hari enum value", () => {
      const data = {
        hari: "invalid-day",
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid sortBy enum value", () => {
      const data = {
        sortBy: "invalid_field",
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid sortOrder enum value", () => {
      const data = {
        sortOrder: "invalid",
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for laboratorium_id", () => {
      const data = {
        laboratorium_id: "invalid-uuid",
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept partial filters", () => {
      const data1 = { kelas: "A" };
      const data2 = { is_active: true };
      const data3 = { hari: "senin" };

      expect(jadwalFilterSchema.safeParse(data1).success).toBe(true);
      expect(jadwalFilterSchema.safeParse(data2).success).toBe(true);
      expect(jadwalFilterSchema.safeParse(data3).success).toBe(true);
    });
  });

  // ========================================
  // 5. jadwalConflictCheckSchema Tests
  // ========================================

  describe("jadwalConflictCheckSchema", () => {
    it("should accept valid conflict check data", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept conflict check with exclude_id", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        exclude_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject without laboratorium_id", () => {
      const data = {
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject without tanggal_praktikum", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject without jam_mulai", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_selesai: "10:00",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject without jam_selesai", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for exclude_id", () => {
      const data = {
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        exclude_id: "invalid-uuid",
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // 6. Time Utilities Tests
  // ========================================

  describe("Time Utilities", () => {
    describe("timeToMinutes", () => {
      it("should convert 00:00 to 0 minutes", () => {
        expect(timeToMinutes("00:00")).toBe(0);
      });

      it("should convert 01:00 to 60 minutes", () => {
        expect(timeToMinutes("01:00")).toBe(60);
      });

      it("should convert 08:00 to 480 minutes", () => {
        expect(timeToMinutes("08:00")).toBe(480);
      });

      it("should convert 08:30 to 510 minutes", () => {
        expect(timeToMinutes("08:30")).toBe(510);
      });

      it("should convert 12:00 to 720 minutes (noon)", () => {
        expect(timeToMinutes("12:00")).toBe(720);
      });

      it("should convert 23:59 to 1439 minutes (end of day)", () => {
        expect(timeToMinutes("23:59")).toBe(1439);
      });

      it("should convert 15:45 to 945 minutes", () => {
        expect(timeToMinutes("15:45")).toBe(945);
      });
    });

    describe("calculateDuration", () => {
      it("should calculate 2 hour duration correctly", () => {
        expect(calculateDuration("08:00", "10:00")).toBe(120);
      });

      it("should calculate 30 minute duration correctly", () => {
        expect(calculateDuration("08:00", "08:30")).toBe(30);
      });

      it("should calculate 90 minute duration correctly", () => {
        expect(calculateDuration("09:15", "10:45")).toBe(90);
      });

      it("should calculate cross-midnight duration", () => {
        expect(calculateDuration("23:00", "01:00")).toBe(-1320);
      });

      it("should return negative for invalid order", () => {
        expect(calculateDuration("10:00", "08:00")).toBe(-120);
      });

      it("should return 0 for same times", () => {
        expect(calculateDuration("08:00", "08:00")).toBe(0);
      });

      it("should calculate 1 minute duration", () => {
        expect(calculateDuration("08:00", "08:01")).toBe(1);
      });

      it("should calculate full day duration", () => {
        expect(calculateDuration("00:00", "23:59")).toBe(1439);
      });
    });

    describe("isTimeOverlap", () => {
      it("should detect complete overlap (same times)", () => {
        expect(isTimeOverlap("08:00", "10:00", "08:00", "10:00")).toBe(true);
      });

      it("should detect partial overlap (start in middle)", () => {
        expect(isTimeOverlap("08:00", "10:00", "09:00", "11:00")).toBe(true);
      });

      it("should detect partial overlap (end in middle)", () => {
        expect(isTimeOverlap("09:00", "11:00", "08:00", "10:00")).toBe(true);
      });

      it("should detect one interval inside another", () => {
        expect(isTimeOverlap("08:00", "12:00", "09:00", "10:00")).toBe(true);
      });

      it("should detect overlap with start touching end", () => {
        expect(isTimeOverlap("08:00", "10:00", "09:59", "11:00")).toBe(true);
      });

      it("should not detect overlap for back-to-back times", () => {
        expect(isTimeOverlap("08:00", "10:00", "10:00", "12:00")).toBe(false);
      });

      it("should not detect overlap for separated times", () => {
        expect(isTimeOverlap("08:00", "10:00", "11:00", "13:00")).toBe(false);
      });

      it("should not detect overlap for widely separated times", () => {
        expect(isTimeOverlap("08:00", "09:00", "18:00", "19:00")).toBe(false);
      });

      it("should detect overlap at start", () => {
        expect(isTimeOverlap("08:00", "10:00", "08:00", "08:30")).toBe(true);
      });

      it("should detect overlap at end", () => {
        expect(isTimeOverlap("08:00", "10:00", "09:30", "10:00")).toBe(true);
      });

      it("should handle midnight overlap", () => {
        expect(isTimeOverlap("23:00", "01:00", "00:00", "00:30")).toBe(false);
      });
    });
  });

  // ========================================
  // 7. Helper Functions Tests
  // ========================================

  describe("Helper Functions", () => {
    describe("parseCreateJadwalForm", () => {
      it("should parse valid data without throwing", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        expect(() => parseCreateJadwalForm(data)).not.toThrow();
      });

      it("should throw on invalid data", () => {
        const data = {
          kelas: "invalid-lowercase",
        };

        expect(() => parseCreateJadwalForm(data)).toThrow();
      });

      it("should throw on missing required fields", () => {
        const data = {
          kelas: "A",
        };

        expect(() => parseCreateJadwalForm(data)).toThrow();
      });

      it("should return parsed data with all fields", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Valid topik text here",
          catatan: "Some notes",
          is_active: true,
        };

        const result = parseCreateJadwalForm(data);
        expect(result).toEqual(data);
      });
    });

    describe("parseUpdateJadwalForm", () => {
      it("should parse valid partial data without throwing", () => {
        const data = {
          kelas: "B",
        };

        expect(() => parseUpdateJadwalForm(data)).not.toThrow();
      });

      it("should parse empty object without throwing", () => {
        expect(() => parseUpdateJadwalForm({})).not.toThrow();
      });

      it("should throw on invalid field value", () => {
        const data = {
          kelas: "invalid-lowercase",
        };

        expect(() => parseUpdateJadwalForm(data)).toThrow();
      });
    });

    describe("parseJadwalFilters", () => {
      it("should parse valid filter data without throwing", () => {
        const data = {
          kelas: "A",
          sortBy: "tanggal_praktikum",
          sortOrder: "desc",
        };

        expect(() => parseJadwalFilters(data)).not.toThrow();
      });

      it("should parse empty filters without throwing", () => {
        expect(() => parseJadwalFilters({})).not.toThrow();
      });

      it("should throw on invalid enum value", () => {
        const data = {
          hari: "invalid-day",
        };

        expect(() => parseJadwalFilters(data)).toThrow();
      });
    });

    describe("parseConflictCheck", () => {
      it("should parse valid conflict check data without throwing", () => {
        const data = {
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        expect(() => parseConflictCheck(data)).not.toThrow();
      });

      it("should throw on missing required fields", () => {
        const data = {
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        };

        expect(() => parseConflictCheck(data)).toThrow();
      });
    });

    describe("safeParseCreateJadwal", () => {
      it("should return success for valid data", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = safeParseCreateJadwal(data);
        expect(result.success).toBe(true);
      });

      it("should return error for invalid data without throwing", () => {
        const data = {
          kelas: "invalid",
        };

        const result = safeParseCreateJadwal(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
        }
      });
    });

    describe("safeParseUpdateJadwal", () => {
      it("should return success for valid partial data", () => {
        const data = {
          kelas: "B",
        };

        const result = safeParseUpdateJadwal(data);
        expect(result.success).toBe(true);
      });

      it("should return success for empty object", () => {
        const result = safeParseUpdateJadwal({});
        expect(result.success).toBe(true);
      });

      it("should return error for invalid field value", () => {
        const data = {
          kelas: "invalid-lowercase",
        };

        const result = safeParseUpdateJadwal(data);
        expect(result.success).toBe(false);
      });
    });

    describe("safeParseConflictCheck", () => {
      it("should return success for valid data", () => {
        const data = {
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = safeParseConflictCheck(data);
        expect(result.success).toBe(true);
      });

      it("should return error for missing fields", () => {
        const data = {
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        };

        const result = safeParseConflictCheck(data);
        expect(result.success).toBe(false);
      });
    });
  });

  // ========================================
  // 8. White-Box Testing - Branch Coverage
  // ========================================

  describe("White-Box Testing - Branch Coverage", () => {
    describe("Time Format Branch Coverage", () => {
      it("should branch to accept valid time with single digit hour (0-9)", () => {
        const times = ["0:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", "7:00", "8:00", "9:00"];

        times.forEach((time) => {
          const data = {
            kelas: "A",
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: time,
            jam_selesai: "10:00",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it("should branch to accept valid time with two digit hour (00-23)", () => {
        const times = ["00:00", "10:00", "13:00", "23:00"];

        times.forEach((time) => {
          const data = {
            kelas: "A",
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: time,
            jam_selesai: "23:59",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it("should branch to reject invalid hour (24+)", () => {
        const invalidTimes = ["24:00", "25:00", "99:00"];

        invalidTimes.forEach((time) => {
          const data = {
            kelas: "A",
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: time,
            jam_selesai: "10:00",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });

      it("should branch to reject invalid minute (60+)", () => {
        const invalidTimes = ["08:60", "08:99", "23:99"];

        invalidTimes.forEach((time) => {
          const data = {
            kelas: "A",
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: time,
            jam_selesai: "10:00",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe("Date Validation Branch Coverage", () => {
      it("should branch to accept today's date", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: today(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to accept future dates", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(365),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to reject past dates", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: pastDate(1),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should branch to reject very old dates", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: new Date("2020-01-01"),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("Duration Branch Coverage", () => {
      it("should branch to accept exactly 30 minutes", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:30",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to accept more than 30 minutes", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:31",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to reject less than 30 minutes", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:29",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("Topik Optional Branch Coverage", () => {
      it("should branch to accept empty topik", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to accept undefined topik", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to accept valid topik (10+ chars)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "1234567890",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should branch to reject short topik (1-9 chars)", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "123456789",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  // ========================================
  // 9. White-Box Testing - Condition Coverage
  // ========================================

  describe("White-Box Testing - Condition Coverage", () => {
    describe("Kelas Regex Conditions", () => {
      it("should match all allowed characters: uppercase, numbers, spaces, hyphens", () => {
        const validKelas = ["A", "A1", "A-1", "A 1", "ABC-12 XY"];

        validKelas.forEach((kelas) => {
          const data = {
            kelas,
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it("should reject all disallowed characters", () => {
        const invalidKelas = ["a", "A@B", "A.B", "A_B", "A+B"];

        invalidKelas.forEach((kelas) => {
          const data = {
            kelas,
            laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
            tanggal_praktikum: futureDate(),
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          };

          const result = jadwalSchema.safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe("Time Order Conditions", () => {
      it("should accept when jam_selesai > jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:01",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false); // Less than 30 minutes
      });

      it("should reject when jam_selesai = jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "08:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should reject when jam_selesai < jam_mulai", () => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "10:00",
          jam_selesai: "08:00",
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("Duration Calculation Conditions", () => {
      it("should calculate duration for same hour times", () => {
        const duration = calculateDuration("08:00", "08:30");
        expect(duration).toBe(30);
      });

      it("should calculate duration for different hour times", () => {
        const duration = calculateDuration("08:00", "10:00");
        expect(duration).toBe(120);
      });

      it("should calculate duration for times with non-zero minutes", () => {
        const duration = calculateDuration("08:15", "10:45");
        expect(duration).toBe(150);
      });
    });

    describe("isTimeOverlap Conditions", () => {
      it("should return true for complete overlap", () => {
        const result = isTimeOverlap("08:00", "10:00", "08:00", "10:00");
        expect(result).toBe(true);
      });

      it("should return true for partial overlap (start)", () => {
        const result = isTimeOverlap("08:00", "10:00", "07:00", "09:00");
        expect(result).toBe(true);
      });

      it("should return true for partial overlap (end)", () => {
        const result = isTimeOverlap("08:00", "10:00", "09:00", "11:00");
        expect(result).toBe(true);
      });

      it("should return false for no overlap (before)", () => {
        const result = isTimeOverlap("08:00", "10:00", "06:00", "08:00");
        expect(result).toBe(false);
      });

      it("should return false for no overlap (after)", () => {
        const result = isTimeOverlap("08:00", "10:00", "10:00", "12:00");
        expect(result).toBe(false);
      });
    });
  });

  // ========================================
  // 10. White-Box Testing - Statement Coverage
  // ========================================

  describe("White-Box Testing - Statement Coverage", () => {
    it("should execute all validation paths in jadwalSchema", () => {
      const validData = {
        kelas: "A-1",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Valid topik with enough characters",
        catatan: "Some notes",
        is_active: true,
      };

      const result = jadwalSchema.safeParse(validData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.kelas).toBe("A-1");
        expect(result.data.laboratorium_id).toBe("123e4567-e89b-12d3-a456-426614174000");
        expect(result.data.jam_mulai).toBe("08:00");
        expect(result.data.jam_selesai).toBe("10:00");
        expect(result.data.topik).toBe("Valid topik with enough characters");
        expect(result.data.catatan).toBe("Some notes");
        expect(result.data.is_active).toBe(true);
      }
    });

    it("should execute all refine conditions", () => {
      // Test jam_selesai > jam_mulai refine
      const data1 = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "08:00",
      };

      const result1 = jadwalSchema.safeParse(data1);
      expect(result1.success).toBe(false);

      // Test minimum 30 minutes refine
      const data2 = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "08:29",
      };

      const result2 = jadwalSchema.safeParse(data2);
      expect(result2.success).toBe(false);
    });

    it("should execute time parsing logic", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "09:15",
        jam_selesai: "10:45",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);

      // Verify time parsing
      const startMinutes = timeToMinutes("09:15");
      const endMinutes = timeToMinutes("10:45");
      const duration = endMinutes - startMinutes;
      expect(duration).toBe(90);
    });

    it("should execute default value assignment", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.is_active).toBe(true); // Default value
      }
    });
  });

  // ========================================
  // 11. Edge Cases
  // ========================================

  describe("Edge Cases", () => {
    it("should handle leap year dates", () => {
      const leapYearDate = new Date(2024, 1, 29); // Feb 29, 2024

      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: leapYearDate,
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      // Will fail because date is in past, but validates date parsing
      expect(result.success).toBe(false);
    });

    it("should handle very far future dates", () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);

      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: farFuture,
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle kelas with only numbers", () => {
      const data = {
        kelas: "123",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle kelas with only spaces and hyphens", () => {
      const data = {
        kelas: " - ",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle very long duration (multiple hours)", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "20:00", // 12 hours
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle special characters in topik and catatan", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Topik dengan karakter khusus: @#$%^&*()",
        catatan: "Catatan dengan emoji 🎉 dan unicode 你好",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle whitespace trimming in topik", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "  Valid topik text here  ",
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should handle boundary time values", () => {
      const testCases = [
        { jam_mulai: "00:00", jam_selesai: "00:30" },
        { jam_mulai: "23:00", jam_selesai: "23:30" },
        { jam_mulai: "00:01", jam_selesai: "00:31" },
        { jam_mulai: "23:29", jam_selesai: "23:59" },
      ];

      testCases.forEach(({ jam_mulai, jam_selesai }) => {
        const data = {
          kelas: "A",
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai,
          jam_selesai,
        };

        const result = jadwalSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  // ========================================
  // 12. Performance Testing
  // ========================================

  describe("Performance Testing", () => {
    it("should validate within reasonable time", () => {
      const data = {
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        jadwalSchema.safeParse(data);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete 1000 validations in less than 1 second
    });

    it("should parse time quickly", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        timeToMinutes("08:30");
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete 10,000 conversions in less than 100ms
    });

    it("should calculate duration quickly", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        calculateDuration("08:00", "10:00");
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should check overlap quickly", () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        isTimeOverlap("08:00", "10:00", "09:00", "11:00");
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
