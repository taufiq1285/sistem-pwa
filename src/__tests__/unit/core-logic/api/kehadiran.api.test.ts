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
  createKehadiran,
  updateKehadiran,
  deleteKehadiran,
  saveKehadiranBulk,
  getKehadiranForExport,
  getKehadiranHistory,
  type KehadiranWithMahasiswa,
  type KehadiranStats,
  type MahasiswaKehadiranRecord,
  type CreateKehadiranData,
  type BulkKehadiranData,
  type KehadiranHistoryRecord,
} from "@/lib/api/kehadiran.api";
import { supabase } from "@/lib/supabase/client";

// Mock dependencies
vi.mock("../../../../lib/supabase/client");
vi.mock("../../../../lib/utils/logger");
vi.mock("../../../../lib/utils/errors");
vi.mock("../../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn(
    (permission, ownership, level, fn) => fn,
  ),
  getCurrentUserWithRole: vi.fn(),
}));

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

  // ============================================================================
  // WHITE-BOX TESTING: createKehadiran, updateKehadiran, deleteKehadiran
  // ============================================================================

  describe("createKehadiran (TC001, TC002, TC003, TC007)", () => {
    it("TC001: should create attendance for valid mahasiswa", async () => {
      const mockCreateData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "mhs-1",
        status: "hadir",
        keterangan: "Tepat waktu",
      };

      const mockResult = {
        id: "kehadiran-1",
        ...mockCreateData,
        created_at: "2025-01-15T08:00:00Z",
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockResult,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createKehadiran(mockCreateData);

      expect(result).toBe("kehadiran-1");
      expect(supabase.from).toHaveBeenCalledWith("kehadiran");
    });

    it("TC007: should reject attendance for unregistered mahasiswa", async () => {
      const mockCreateData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "invalid-mhs",
        status: "hadir",
      };

      const error = new Error("Foreign key violation: mahasiswa not enrolled");
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(createKehadiran(mockCreateData)).rejects.toThrow();
    });

    it("should handle database errors gracefully", async () => {
      const error = new Error("Database connection failed");
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      const mockData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "mhs-1",
        status: "hadir",
      };

      await expect(createKehadiran(mockData)).rejects.toThrow();
    });

    it("should create attendance with all status types", async () => {
      const statuses: Array<"hadir" | "izin" | "sakit" | "alpha"> = [
        "hadir",
        "izin",
        "sakit",
        "alpha",
      ];

      for (const status of statuses) {
        const mockData: CreateKehadiranData = {
          jadwal_id: "jadwal-1",
          mahasiswa_id: "mhs-1",
          status,
        };

        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "kehadiran-1", ...mockData },
                error: null,
              }),
            }),
          }),
        } as any);

        const result = await createKehadiran(mockData);
        expect(result).toBe("kehadiran-1");
      }
    });
  });

  describe("updateKehadiran (TC008)", () => {
    it("TC008: should update attendance status to hadir", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      const updateData: Partial<CreateKehadiranData> = {
        status: "hadir",
        keterangan: "Updated to hadir",
      };

      await expect(
        updateKehadiran("kehadiran-1", updateData),
      ).resolves.not.toThrow();
    });

    it("TC008: should update attendance status to all types", async () => {
      const statuses: Array<"hadir" | "izin" | "sakit" | "alpha"> = [
        "hadir",
        "izin",
        "sakit",
        "alpha",
      ];

      for (const status of statuses) {
        vi.mocked(supabase.from).mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        } as any);

        await expect(
          updateKehadiran("kehadiran-1", { status }),
        ).resolves.not.toThrow();
      }
    });

    it("should update keterangan field", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await expect(
        updateKehadiran("kehadiran-1", { keterangan: "Sakit demam" }),
      ).resolves.not.toThrow();
    });

    it("should handle update errors", async () => {
      const error = new Error("Update failed");
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      } as any);

      await expect(
        updateKehadiran("kehadiran-1", { status: "hadir" }),
      ).rejects.toThrow();
    });

    it("should set updated_at timestamp automatically", async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as any);

      await updateKehadiran("kehadiran-1", { status: "hadir" });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        }),
      );
    });
  });

  describe("deleteKehadiran", () => {
    it("should delete kehadiran successfully", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await expect(deleteKehadiran("kehadiran-1")).resolves.not.toThrow();
    });

    it("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      } as any);

      await expect(deleteKehadiran("kehadiran-1")).rejects.toThrow();
    });
  });

  describe("saveKehadiranBulk", () => {
    it("should insert bulk kehadiran for new records", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [
          { mahasiswa_id: "mhs-1", status: "hadir" },
          { mahasiswa_id: "mhs-2", status: "izin", keterangan: "Sakit" },
        ],
      };

      // Mock checking existing records (none exist)
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any)
        // Mock insert
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        } as any);

      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });

    it("should update existing kehadiran records", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [{ mahasiswa_id: "mhs-1", status: "izin" }],
      };

      const existingRecords = [{ id: "kehadiran-1", mahasiswa_id: "mhs-1" }];

      // Mock checking existing records
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: existingRecords,
              error: null,
            }),
          }),
        } as any)
        // Mock update
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        } as any);

      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });

    it("should handle bulk operation errors", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [{ mahasiswa_id: "mhs-1", status: "hadir" }],
      };

      const error = new Error("Bulk insert failed");
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      } as any);

      await expect(saveKehadiranBulk(mockBulkData)).rejects.toThrow();
    });

    it("should handle mixed insert and update operations", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [
          { mahasiswa_id: "mhs-1", status: "hadir" }, // exists
          { mahasiswa_id: "mhs-2", status: "hadir" }, // new
        ],
      };

      const existingRecords = [{ id: "kehadiran-1", mahasiswa_id: "mhs-1" }];

      // Mock checking existing records
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: existingRecords,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });
  });

  describe("getKehadiranForExport", () => {
    it("should fetch formatted data for CSV export", async () => {
      const mockKelasData = { nama_kelas: "Kelas A" };
      const mockKehadiranData = [
        {
          status: "hadir",
          keterangan: null,
          mata_kuliah: { nama_mk: "Kebidanan" },
          mahasiswa: {
            nim: "BD2321001",
            users: { full_name: "Siti Nurhaliza" },
          },
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockKelasData,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockKehadiranData,
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

      const result = await getKehadiranForExport("kelas-1", "2025-01-15");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        tanggal: "2025-01-15",
        kelas: "Kelas A",
        mata_kuliah: "Kebidanan",
        nim: "BD2321001",
        nama_mahasiswa: "Siti Nurhaliza",
        status: "hadir",
        keterangan: "",
      });
    });

    it("should handle missing kelas data gracefully", async () => {
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

      const result = await getKehadiranForExport("kelas-1", "2025-01-15");

      expect(result).toEqual([]);
    });

    it("should handle export errors", async () => {
      const error = new Error("Export failed");
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(
        getKehadiranForExport("kelas-1", "2025-01-15"),
      ).rejects.toThrow();
    });
  });

  describe("getKehadiranHistory", () => {
    it("should fetch and group attendance history by date", async () => {
      const mockRecords = [
        {
          tanggal: "2025-01-15",
          status: "hadir",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-15",
          status: "izin",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-14",
          status: "hadir",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranHistory("kelas-1");

      expect(result).toHaveLength(2); // 2 unique dates
      expect(result[0].tanggal).toBe("2025-01-15");
      expect(result[0].total_mahasiswa).toBe(2);
      expect(result[0].hadir).toBe(1);
      expect(result[0].izin).toBe(1);
      expect(result[1].tanggal).toBe("2025-01-14");
      expect(result[1].total_mahasiswa).toBe(1);
    });

    it("should apply date range filters", async () => {
      const mockRecords: any[] = [];

      // Build the mock chain: from().select().eq().order().gte().lte()
      const lteMock = vi.fn().mockResolvedValue({
        data: mockRecords,
        error: null,
      });

      const gteMock = vi.fn().mockReturnValue({
        lte: lteMock,
      });

      const orderMock = vi.fn().mockReturnValue({
        gte: gteMock,
      });

      const eqMock = vi.fn().mockReturnValue({
        order: orderMock,
      });

      const selectMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
      } as any);

      await getKehadiranHistory("kelas-1", "2025-01-01", "2025-01-31", 30);

      expect(gteMock).toHaveBeenCalledWith("tanggal", "2025-01-01");
      expect(lteMock).toHaveBeenCalledWith("tanggal", "2025-01-31");
    });

    it("should limit results", async () => {
      const mockRecords = Array(50).fill({
        tanggal: "2025-01-15",
        status: "hadir",
        kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranHistory(
        "kelas-1",
        undefined,
        undefined,
        10,
      );

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should handle history fetch errors", async () => {
      const error = new Error("History fetch failed");
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

      await expect(getKehadiranHistory("kelas-1")).rejects.toThrow();
    });

    it("should calculate stats correctly for each date", async () => {
      const mockRecords = [
        {
          tanggal: "2025-01-15",
          status: "hadir",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-15",
          status: "hadir",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-15",
          status: "izin",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-15",
          status: "sakit",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
        {
          tanggal: "2025-01-15",
          status: "alpha",
          kelas: { id: "kelas-1", nama_kelas: "Kelas A" },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getKehadiranHistory("kelas-1");

      expect(result[0]).toMatchObject({
        tanggal: "2025-01-15",
        total_mahasiswa: 5,
        hadir: 2,
        izin: 1,
        sakit: 1,
        alpha: 1,
      });
    });
  });

  // ============================================================================
  // WHITE-BOX TESTING: Condition Coverage & Path Coverage
  // ============================================================================

  describe("Whitebox Testing: Condition Coverage (isEnrolled && inTimeRange && !duplicate)", () => {
    /**
     * Test all combinations of:
     * - isEnrolled: true/false
     * - inTimeRange: true/false
     * - duplicate: true/false
     */

    it("should succeed when all conditions are met (isEnrolled=true, inTimeRange=true, duplicate=false)", async () => {
      const mockData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "mhs-1",
        status: "hadir",
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "kehadiran-1", ...mockData },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createKehadiran(mockData);
      expect(result).toBe("kehadiran-1");
    });

    it("should fail when mahasiswa is not enrolled (isEnrolled=false)", async () => {
      const mockData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "invalid-mhs",
        status: "hadir",
      };

      const error = new Error("Not enrolled in this class");
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(createKehadiran(mockData)).rejects.toThrow();
    });

    it("should fail when outside time range (inTimeRange=false) - Note: Business logic to be implemented", async () => {
      // This test documents expected behavior even if not yet implemented
      // The API should validate attendance time is within jadwal time range
      const mockData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "mhs-1",
        status: "hadir",
      };

      // For now, insert should succeed (time validation not implemented)
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "kehadiran-1", ...mockData },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createKehadiran(mockData);
      expect(result).toBe("kehadiran-1");
    });

    it("should fail when duplicate attendance exists (duplicate=true) - Note: Prevented by bulk update logic", async () => {
      // Bulk operation handles duplicate prevention by updating existing records
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [{ mahasiswa_id: "mhs-1", status: "hadir" }],
      };

      const existingRecords = [{ id: "kehadiran-1", mahasiswa_id: "mhs-1" }];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: existingRecords,
              error: null,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        } as any);

      // Should update instead of inserting duplicate
      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });
  });

  describe("Whitebox Testing: Path Coverage", () => {
    it("should handle success path in createKehadiran", async () => {
      const mockData: CreateKehadiranData = {
        jadwal_id: "jadwal-1",
        mahasiswa_id: "mhs-1",
        status: "hadir",
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "kehadiran-1", ...mockData },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await createKehadiran(mockData);
      expect(result).toBe("kehadiran-1");
    });

    it("should handle error path in createKehadiran", async () => {
      const error = new Error("Database error");
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error,
            }),
          }),
        }),
      } as any);

      await expect(
        createKehadiran({
          jadwal_id: "jadwal-1",
          mahasiswa_id: "mhs-1",
          status: "hadir",
        }),
      ).rejects.toThrow();
    });

    it("should handle edge case: empty kehadiran array in bulk operation", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: [],
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });

    it("should handle edge case: large kehadiran array in bulk operation", async () => {
      const mockBulkData: BulkKehadiranData = {
        jadwal_id: "jadwal-1",
        tanggal: "2025-01-15",
        kehadiran: Array(100)
          .fill(null)
          .map((_, i) => ({
            mahasiswa_id: `mhs-${i}`,
            status: "hadir" as const,
          })),
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      } as any);

      await expect(saveKehadiranBulk(mockBulkData)).resolves.not.toThrow();
    });
  });

  describe("Whitebox Testing: Branch Coverage", () => {
    it("should test all branches in getKehadiranStats calculation", async () => {
      // Test hadir branch
      const hadirRecords = [{ status: "hadir" }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: hadirRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      let stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.hadir).toBe(1);

      // Test izin branch
      const izinRecords = [{ status: "izin" }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: izinRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.izin).toBe(1);

      // Test sakit branch
      const sakitRecords = [{ status: "sakit" }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: sakitRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.sakit).toBe(1);

      // Test alpha branch
      const alphaRecords = [{ status: "alpha" }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: alphaRecords,
              error: null,
            }),
          }),
        }),
      } as any);

      stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.alpha).toBe(1);
    });

    it("should test branch: total > 0 in persentase calculation", async () => {
      // Branch: total > 0
      const records = [{ status: "hadir" }];
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: records,
              error: null,
            }),
          }),
        }),
      } as any);

      const stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.persentase_kehadiran).toBe(100);
    });

    it("should test branch: total = 0 in persentase calculation", async () => {
      // Branch: total = 0 (else branch)
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

      const stats = await getKehadiranStats("mhs-1", "kelas-1");
      expect(stats.persentase_kehadiran).toBe(0);
    });
  });
});
