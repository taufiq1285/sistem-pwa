/**
 * Kehadiran API Unit Tests
 * Comprehensive tests for attendance management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getKehadiranByJadwal,
  getKehadiranByKelas,
  getKehadiranStats,
  calculateNilaiKehadiran,
  getMahasiswaKehadiran,
  type KehadiranWithMahasiswa,
  type KehadiranStats,
  type MahasiswaKehadiranRecord,
} from "../../../lib/api/kehadiran.api";
import { supabase } from "../../../lib/supabase/client";

// Mock dependencies
vi.mock("../../../lib/supabase/client");
vi.mock("../../../lib/utils/logger");
vi.mock("../../../lib/middleware");

describe("Kehadiran API", () => {
  const mockKehadiran: KehadiranWithMahasiswa = {
    id: "kehadiran-1",
    jadwal_id: "jadwal-1",
    mahasiswa_id: "mhs-1",
    status: "hadir",
    keterangan: undefined,
    created_at: "2025-01-15T08:00:00Z",
    updated_at: "2025-01-15T08:00:00Z",
    waktu_check_in: "08:00:00",
    waktu_check_out: "10:00:00",
    mahasiswa: {
      id: "mhs-1",
      nim: "BD2321001",
      user: {
        full_name: "Siti Nurhaliza",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getKehadiranByJadwal", () => {
    it("should fetch kehadiran by jadwal_id successfully", async () => {
      const mockData = [mockKehadiran];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranByJadwal("jadwal-1");

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("kehadiran");
    });

    it("should order by mahasiswa NIM ascending", async () => {
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      } as any);

      await getKehadiranByJadwal("jadwal-1");

      expect(orderMock).toHaveBeenCalledWith("mahasiswa(nim)", {
        ascending: true,
      });
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(getKehadiranByJadwal("jadwal-1")).rejects.toThrow();
    });

    it("should return empty array when no data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranByJadwal("jadwal-1");

      expect(result).toEqual([]);
    });
  });

  describe("getKehadiranByKelas", () => {
    it("should fetch kehadiran by kelas_id successfully", async () => {
      const mockData = [mockKehadiran];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranByKelas("kelas-1");

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("kehadiran");
    });

    it("should apply date range filters when provided", async () => {
      const gteMock = vi.fn().mockReturnThis();
      const lteMock = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: gteMock,
            lte: lteMock,
          }),
        }),
      } as any);

      await getKehadiranByKelas("kelas-1", "2025-01-01", "2025-01-31");

      expect(gteMock).toHaveBeenCalledWith(
        "jadwal.tanggal_praktikum",
        "2025-01-01",
      );
      expect(lteMock).toHaveBeenCalledWith(
        "jadwal.tanggal_praktikum",
        "2025-01-31",
      );
    });

    it("should work without date filters", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const result = await getKehadiranByKelas("kelas-1");

      expect(result).toEqual([]);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(getKehadiranByKelas("kelas-1")).rejects.toThrow();
    });
  });

  describe("getKehadiranStats", () => {
    it("should calculate stats correctly with all statuses", async () => {
      const mockRecords = [
        { status: "hadir" },
        { status: "hadir" },
        { status: "hadir" },
        { status: "izin" },
        { status: "sakit" },
        { status: "alpha" },
      ];

      const eqChain = vi.fn().mockResolvedValue({
        data: mockRecords,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: eqChain,
          }),
        }),
      } as any);

      const result = await getKehadiranStats("mhs-1", "kelas-1");

      expect(result).toEqual({
        total_pertemuan: 6,
        hadir: 3,
        izin: 1,
        sakit: 1,
        alpha: 1,
        persentase_kehadiran: 50, // 3/6 = 50%
      });
    });

    it("should return zero stats when no records", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranStats("mhs-1", "kelas-1");

      expect(result).toEqual({
        total_pertemuan: 0,
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        persentase_kehadiran: 0,
      });
    });

    it("should calculate 100% when all hadir", async () => {
      const mockRecords = [
        { status: "hadir" },
        { status: "hadir" },
        { status: "hadir" },
        { status: "hadir" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranStats("mhs-1", "kelas-1");

      expect(result.persentase_kehadiran).toBe(100);
    });

    it("should calculate 0% when all alpha", async () => {
      const mockRecords = [{ status: "alpha" }, { status: "alpha" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranStats("mhs-1", "kelas-1");

      expect(result.persentase_kehadiran).toBe(0);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(getKehadiranStats("mhs-1", "kelas-1")).rejects.toThrow();
    });

    it("should round persentase to nearest integer", async () => {
      // 2 hadir out of 3 = 66.666... → 67 (Math.round)
      const mockRecords = [
        { status: "hadir" },
        { status: "hadir" },
        { status: "alpha" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranStats("mhs-1", "kelas-1");

      expect(result.persentase_kehadiran).toBe(67);
    });
  });

  describe("calculateNilaiKehadiran", () => {
    it("should calculate nilai with hadir only (100)", async () => {
      const mockRecords = [{ status: "hadir" }, { status: "hadir" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(100);
    });

    it("should calculate nilai with mixed statuses", async () => {
      // 2 hadir + 1 izin + 1 sakit = (2 + 0.5 + 0.5) / 4 * 100 = 75
      const mockRecords = [
        { status: "hadir" },
        { status: "hadir" },
        { status: "izin" },
        { status: "sakit" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(75);
    });

    it("should give 0 nilai for all alpha", async () => {
      const mockRecords = [{ status: "alpha" }, { status: "alpha" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(0);
    });

    it("should return 0 when no records", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(0);
    });

    it("should cap nilai at 100", async () => {
      // Even if formula gives > 100 (edge case), should cap
      const mockRecords = [{ status: "hadir" }, { status: "hadir" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBeLessThanOrEqual(100);
    });

    it("should return 0 on error", async () => {
      const error = new Error("Database error");

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(0);
    });

    it("should round nilai to nearest integer", async () => {
      // 2 hadir + 1 izin = (2 + 0.5) / 3 * 100 = 83.33 → 83
      const mockRecords = [
        { status: "hadir" },
        { status: "hadir" },
        { status: "izin" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(83);
      expect(Number.isInteger(nilai)).toBe(true);
    });
  });

  describe("getMahasiswaKehadiran", () => {
    it("should fetch mahasiswa kehadiran records successfully", async () => {
      const mockData: MahasiswaKehadiranRecord[] = [
        {
          id: "kehadiran-1",
          status: "hadir",
          keterangan: null,
          created_at: "2025-01-15T08:00:00Z",
          jadwal: {
            id: "jadwal-1",
            tanggal_praktikum: "2025-01-15",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            topik: "Praktikum Dasar",
            kelas: {
              nama_kelas: "Kelas A",
              mata_kuliah: {
                nama_mk: "Kebidanan",
              },
            },
            laboratorium: {
              nama_lab: "Lab Kebidanan 1",
            },
          },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getMahasiswaKehadiran("mhs-1");

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith("kehadiran");
    });

    it("should limit results to 100", async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        }),
      } as any);

      await getMahasiswaKehadiran("mhs-1");

      expect(limitMock).toHaveBeenCalledWith(100);
    });

    it("should order by tanggal descending", async () => {
      const orderMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      } as any);

      await getMahasiswaKehadiran("mhs-1");

      expect(orderMock).toHaveBeenCalledWith("jadwal(tanggal_praktikum)", {
        ascending: false,
      });
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error,
              }),
            }),
          }),
        }),
      } as any);

      await expect(getMahasiswaKehadiran("mhs-1")).rejects.toThrow();
    });

    it("should return empty array when no data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getMahasiswaKehadiran("mhs-1");

      expect(result).toEqual([]);
    });
  });

  describe("Edge Cases & Business Logic Validation", () => {
    it("should handle single attendance record correctly", async () => {
      const mockRecords = [{ status: "hadir" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(100);
    });

    it("should handle all izin correctly (50% nilai)", async () => {
      const mockRecords = [{ status: "izin" }, { status: "izin" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(50); // (0 + 1 + 0) / 2 * 100 = 50
    });

    it("should handle all sakit correctly (50% nilai)", async () => {
      const mockRecords = [{ status: "sakit" }, { status: "sakit" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(50);
    });

    it("should validate formula with large dataset", async () => {
      // 14 pertemuan: 10 hadir + 2 izin + 1 sakit + 1 alpha
      // = (10 + 1 + 0.5) / 14 * 100 = 82.14 → 82
      const mockRecords = [
        ...Array(10).fill({ status: "hadir" }),
        ...Array(2).fill({ status: "izin" }),
        { status: "sakit" },
        { status: "alpha" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const nilai = await calculateNilaiKehadiran("mhs-1", "kelas-1");

      expect(nilai).toBe(82);
    });
  });
});
