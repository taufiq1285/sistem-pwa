import { describe, it, expect } from "vitest";
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

const validJadwal = () => ({
  kelas: "A-1",
  laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
  tanggal_praktikum: futureDate(),
  jam_mulai: "08:00",
  jam_selesai: "10:00",
  topik: "Praktikum ANC Pemeriksaan Leopold",
});

describe("Jadwal Schema Validation", () => {
  describe("jadwalSchema", () => {
    it("menerima data valid dengan field wajib", () => {
      const result = jadwalSchema.safeParse(validJadwal());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it("menerima data valid dengan semua field aktif", () => {
      const result = jadwalSchema.safeParse({
        ...validJadwal(),
        is_active: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(false);
      }
    });

    it("menerima kelas kapital, angka, spasi, dan tanda hubung", () => {
      const validKelas = ["A", "ABC", "A1", "A-1", "A 1", "AB-12 XY"];

      validKelas.forEach((kelas) => {
        expect(
          jadwalSchema.safeParse({
            ...validJadwal(),
            kelas,
          }).success,
        ).toBe(true);
      });
    });

    it("menolak kelas yang mengandung karakter kecil atau simbol terlarang", () => {
      const invalidKelas = ["a", "A@B", "A.B", "A_B", "A+B"];

      invalidKelas.forEach((kelas) => {
        expect(
          jadwalSchema.safeParse({
            ...validJadwal(),
            kelas,
          }).success,
        ).toBe(false);
      });
    });

    it("menolak kelas lebih dari 10 karakter", () => {
      const result = jadwalSchema.safeParse({
        ...validJadwal(),
        kelas: "ABCDEFGHIJK",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "maksimal 10 karakter",
        );
      }
    });

    it("menerima tanggal hari ini dan tanggal masa depan", () => {
      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          tanggal_praktikum: today(),
        }).success,
      ).toBe(true);

      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          tanggal_praktikum: futureDate(365),
        }).success,
      ).toBe(true);
    });

    it("menolak tanggal di masa lalu", () => {
      const result = jadwalSchema.safeParse({
        ...validJadwal(),
        tanggal_praktikum: pastDate(),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("masa lalu");
      }
    });

    it("menerima format jam satu digit dan dua digit", () => {
      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          jam_mulai: "8:00",
          jam_selesai: "10:00",
        }).success,
      ).toBe(true);

      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        }).success,
      ).toBe(true);
    });

    it("menolak format jam yang tidak valid", () => {
      const invalidTimes = ["0800", "24:00", "25:00", "08:60", "08:99"];

      invalidTimes.forEach((jam_mulai) => {
        expect(
          jadwalSchema.safeParse({
            ...validJadwal(),
            jam_mulai,
          }).success,
        ).toBe(false);
      });
    });

    it("menolak bila jam selesai tidak lebih besar dari jam mulai", () => {
      const equalResult = jadwalSchema.safeParse({
        ...validJadwal(),
        jam_mulai: "08:00",
        jam_selesai: "08:00",
      });
      const earlierResult = jadwalSchema.safeParse({
        ...validJadwal(),
        jam_mulai: "10:00",
        jam_selesai: "08:00",
      });

      expect(equalResult.success).toBe(false);
      expect(earlierResult.success).toBe(false);

      if (!equalResult.success) {
        expect(
          equalResult.error.issues.some((issue) =>
            issue.message.includes("lebih besar"),
          ),
        ).toBe(true);
      }
    });

    it("menerima durasi minimal 30 menit dan menolak yang lebih pendek", () => {
      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          jam_mulai: "08:00",
          jam_selesai: "08:30",
        }).success,
      ).toBe(true);

      const shortDuration = jadwalSchema.safeParse({
        ...validJadwal(),
        jam_mulai: "08:00",
        jam_selesai: "08:29",
      });

      expect(shortDuration.success).toBe(false);
      if (!shortDuration.success) {
        expect(
          shortDuration.error.issues.some((issue) =>
            issue.message.includes("minimal 30 menit"),
          ),
        ).toBe(true);
      }
    });

    it("mewajibkan topik, trim nilai, dan membatasi maksimal 200 karakter", () => {
      const trimmed = jadwalSchema.safeParse({
        ...validJadwal(),
        topik: "  Praktikum ANC Pemeriksaan Leopold  ",
      });
      const empty = jadwalSchema.safeParse({
        ...validJadwal(),
        topik: "",
      });
      const tooLong = jadwalSchema.safeParse({
        ...validJadwal(),
        topik: "A".repeat(201),
      });

      expect(trimmed.success).toBe(true);
      if (trimmed.success) {
        expect(trimmed.data.topik).toBe("Praktikum ANC Pemeriksaan Leopold");
      }
      expect(empty.success).toBe(false);
      expect(tooLong.success).toBe(false);
    });
  });

  describe("createJadwalSchema", () => {
    it("setara dengan schema utama untuk input valid", () => {
      expect(createJadwalSchema.safeParse(validJadwal()).success).toBe(true);
    });
  });

  describe("updateJadwalSchema", () => {
    it("menerima partial update dan object kosong", () => {
      expect(updateJadwalSchema.safeParse({ jam_mulai: "09:00" }).success).toBe(
        true,
      );
      expect(updateJadwalSchema.safeParse({}).success).toBe(true);
    });

    it("tetap memvalidasi field yang dikirim", () => {
      expect(updateJadwalSchema.safeParse({ kelas: "a" }).success).toBe(false);
      expect(
        updateJadwalSchema.safeParse({ laboratorium_id: "invalid" }).success,
      ).toBe(false);
    });
  });

  describe("jadwalFilterSchema", () => {
    it("mengisi default sortBy dan sortOrder", () => {
      const result = jadwalFilterSchema.parse({});

      expect(result.sortBy).toBe("tanggal_praktikum");
      expect(result.sortOrder).toBe("asc");
    });

    it("menerima filter valid lengkap", () => {
      const result = jadwalFilterSchema.safeParse({
        kelas: "A",
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        hari: "senin",
        tanggal_start: today(),
        tanggal_end: futureDate(),
        is_active: true,
        sortBy: "jam_mulai",
        sortOrder: "desc",
      });

      expect(result.success).toBe(true);
    });

    it("menolak enum dan uuid filter yang tidak valid", () => {
      expect(
        jadwalFilterSchema.safeParse({
          hari: "senen",
        }).success,
      ).toBe(false);

      expect(
        jadwalFilterSchema.safeParse({
          laboratorium_id: "invalid",
        }).success,
      ).toBe(false);
    });
  });

  describe("jadwalConflictCheckSchema", () => {
    it("menerima data conflict check valid", () => {
      expect(
        jadwalConflictCheckSchema.safeParse({
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          exclude_id: "123e4567-e89b-12d3-a456-426614174001",
        }).success,
      ).toBe(true);
    });

    it("menolak exclude_id atau laboratorium_id yang bukan uuid", () => {
      expect(
        jadwalConflictCheckSchema.safeParse({
          laboratorium_id: "invalid",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        }).success,
      ).toBe(false);

      expect(
        jadwalConflictCheckSchema.safeParse({
          laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          exclude_id: "invalid",
        }).success,
      ).toBe(false);
    });
  });

  describe("helper parse functions", () => {
    it("parseCreateJadwalForm mengembalikan data yang sudah dinormalisasi", () => {
      const result = parseCreateJadwalForm({
        ...validJadwal(),
        topik: "  Praktikum ANC Pemeriksaan Leopold  ",
      });

      expect(result.topik).toBe("Praktikum ANC Pemeriksaan Leopold");
      expect(result.is_active).toBe(true);
    });

    it("parseUpdateJadwalForm menerima partial update", () => {
      const result = parseUpdateJadwalForm({ jam_mulai: "09:00" });

      expect(result).toEqual({ jam_mulai: "09:00", is_active: true });
    });

    it("parseJadwalFilters dan parseConflictCheck mengikuti schema aktif", () => {
      const filters = parseJadwalFilters({ kelas: "A" });
      const conflict = parseConflictCheck({
        laboratorium_id: "123e4567-e89b-12d3-a456-426614174000",
        tanggal_praktikum: futureDate(),
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      });

      expect(filters.sortBy).toBe("tanggal_praktikum");
      expect(conflict.jam_mulai).toBe("08:00");
    });

    it("parseCreateJadwalForm melempar untuk data invalid", () => {
      expect(() =>
        parseCreateJadwalForm({
          ...validJadwal(),
          topik: "",
        }),
      ).toThrow();
    });
  });

  describe("safe parse helpers", () => {
    it("safeParseCreateJadwal sukses untuk data valid", () => {
      expect(safeParseCreateJadwal(validJadwal()).success).toBe(true);
    });

    it("safeParseUpdateJadwal dan safeParseConflictCheck gagal untuk data invalid", () => {
      expect(safeParseUpdateJadwal({ kelas: "a" }).success).toBe(false);
      expect(
        safeParseConflictCheck({
          laboratorium_id: "invalid",
          tanggal_praktikum: futureDate(),
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        }).success,
      ).toBe(false);
    });
  });

  describe("time utilities", () => {
    it("timeToMinutes mengubah jam ke menit", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("08:30")).toBe(510);
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    it("calculateDuration menghitung selisih menit", () => {
      expect(calculateDuration("08:00", "08:30")).toBe(30);
      expect(calculateDuration("08:15", "10:45")).toBe(150);
      expect(calculateDuration("10:00", "08:00")).toBe(-120);
    });

    it("isTimeOverlap mendeteksi overlap dan non-overlap", () => {
      expect(isTimeOverlap("08:00", "10:00", "09:00", "11:00")).toBe(true);
      expect(isTimeOverlap("08:00", "10:00", "10:00", "12:00")).toBe(false);
      expect(isTimeOverlap("08:00", "10:00", "06:00", "08:00")).toBe(false);
      expect(isTimeOverlap("08:00", "10:00", "08:00", "10:00")).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("menerima durasi panjang dan batas waktu yang sah", () => {
      const cases = [
        { jam_mulai: "00:00", jam_selesai: "00:30" },
        { jam_mulai: "23:00", jam_selesai: "23:59" },
        { jam_mulai: "08:00", jam_selesai: "20:00" },
      ];

      cases.forEach(({ jam_mulai, jam_selesai }) => {
        expect(
          jadwalSchema.safeParse({
            ...validJadwal(),
            jam_mulai,
            jam_selesai,
          }).success,
        ).toBe(true);
      });
    });

    it("menolak kelas yang hanya berisi spasi atau simbol kosong secara semantik", () => {
      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          kelas: " - ",
        }).success,
      ).toBe(true);
    });

    it("menerima tanggal masa depan yang sangat jauh", () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      farFuture.setHours(0, 0, 0, 0);

      expect(
        jadwalSchema.safeParse({
          ...validJadwal(),
          tanggal_praktikum: farFuture,
        }).success,
      ).toBe(true);
    });
  });
});
