/**
 * Jadwal API Unit Tests
 * Comprehensive tests for schedule management API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { format } from "date-fns";
import {
  getJadwal,
  getJadwalById,
  getJadwalByLab,
  getCalendarEvents,
  checkJadwalConflictByDate,
  checkJadwalConflict,
  getJadwalPraktikumMahasiswa,
  getJadwalHariIni,
  getJadwalMingguIni,
  getJadwalBulanIni,
  createJadwal,
  updateJadwal,
  deleteJadwal,
  approveJadwal,
  rejectJadwal,
  cancelJadwal,
  reactivateJadwal,
  getAllJadwalForLaboran,
  jadwalApi,
} from "@/lib/api/jadwal.api";
import * as baseApi from "@/lib/api/base.api";
import { supabase } from "@/lib/supabase/client";
import type { Jadwal } from "@/types/jadwal.types";

vi.mock("../../../../lib/api/base.api", () => ({
  query: vi.fn(),
  queryWithFilters: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  withApiResponse: vi.fn(async (callback) => callback()),
}));

vi.mock("../../../../lib/utils/errors", () => ({
  handleError: vi.fn((error) => error),
  logError: vi.fn(),
}));

vi.mock("../../../../lib/middleware", () => ({
  requirePermission: vi.fn((_, fn) => fn),
  requirePermissionAndOwnership: vi.fn((_, __, ___, fn) => fn),
}));

vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("../../../../lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe("Jadwal API", () => {
  const mockJadwal: Jadwal = {
    id: "jadwal-1",
    kelas_id: "kelas-1",
    kelas: "A",
    laboratorium_id: "lab-1",
    tanggal_praktikum: "2025-01-15",
    hari: "rabu",
    jam_mulai: "08:00",
    jam_selesai: "10:00",
    topik: "Praktikum Kebidanan Dasar",
    catatan: "Bawa alat tulis",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const mockJadwalWithLab: Jadwal = {
    ...mockJadwal,
    kelas: {
      nama_kelas: "A",
    } as any, // Type assertion for nested object
    laboratorium: {
      id: "lab-1",
      nama_lab: "Lab Kebidanan 1",
      kode_lab: "KB-01",
      kapasitas: 30,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(baseApi.withApiResponse).mockImplementation(async (callback: any) =>
      callback(),
    );
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getJadwal", () => {
    it("should fetch all jadwal without filters", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal();

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.objectContaining({
          select: expect.stringContaining("laboratorium:laboratorium_id"),
          order: { column: "tanggal_praktikum", ascending: true },
        }),
      );
    });

    it("should fetch jadwal with kelas_id filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ kelas_id: "kelas-1" });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          { column: "kelas_id", operator: "eq", value: "kelas-1" },
        ]),
        expect.any(Object),
      );
    });

    it("should fetch jadwal with laboratorium filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ laboratorium_id: "lab-1" });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
        ]),
        expect.any(Object),
      );
    });

    it("should fetch jadwal with hari filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ hari: "senin" });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          { column: "hari", operator: "eq", value: "senin" },
        ]),
        expect.any(Object),
      );
    });

    it("should fetch jadwal with is_active filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ is_active: true });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.any(Object),
      );
    });

    it("should fetch jadwal with multiple filters", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({
        kelas_id: "kelas-1",
        laboratorium_id: "lab-1",
        hari: "senin",
        is_active: true,
      });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          { column: "kelas_id", operator: "eq", value: "kelas-1" },
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          { column: "hari", operator: "eq", value: "senin" },
        ]),
        expect.any(Object),
      );
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      await expect(getJadwal()).rejects.toThrow();
    });
  });

  describe("getJadwalById", () => {
    it("should fetch jadwal by ID", async () => {
      vi.mocked(baseApi.getById).mockResolvedValue(mockJadwalWithLab);

      const result = await getJadwalById("jadwal-1");

      expect(result).toEqual(mockJadwalWithLab);
      expect(baseApi.getById).toHaveBeenCalledWith(
        "jadwal_praktikum",
        "jadwal-1",
        expect.objectContaining({
          select: expect.stringContaining("laboratorium:laboratorium_id"),
        }),
      );
    });

    it("should handle errors when jadwal not found", async () => {
      const error = new Error("Jadwal not found");
      vi.mocked(baseApi.getById).mockRejectedValue(error);

      await expect(getJadwalById("invalid-id")).rejects.toThrow();
    });
  });

  describe("getJadwalByLab", () => {
    it("should fetch active jadwal for specific lab", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwalByLab("lab-1");

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.any(Object),
      );
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      await expect(getJadwalByLab("lab-1")).rejects.toThrow();
    });
  });

  describe("getCalendarEvents", () => {
    it("should convert jadwal to calendar events", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const result = await getCalendarEvents(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "jadwal-1",
        title: "A - Lab Kebidanan 1",
        type: "class",
        color: "#3b82f6",
        location: "Lab Kebidanan 1",
        description: "Praktikum Kebidanan Dasar",
      });

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          {
            column: "tanggal_praktikum",
            operator: "gte",
            value: format(startDate, "yyyy-MM-dd"),
          },
          {
            column: "tanggal_praktikum",
            operator: "lte",
            value: format(endDate, "yyyy-MM-dd"),
          },
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });

    it("should skip jadwal with null tanggal_praktikum", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const jadwalWithoutDate = {
        ...mockJadwalWithLab,
        tanggal_praktikum: null,
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        jadwalWithoutDate,
      ]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const result = await getCalendarEvents(startDate, endDate);

      expect(result).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skipping jadwal with null tanggal_praktikum"),
        "jadwal-1",
      );

      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should handle invalid time parsing", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      const jadwalWithInvalidTime = {
        ...mockJadwalWithLab,
        jam_mulai: "invalid",
        jam_selesai: "invalid",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        jadwalWithInvalidTime,
      ]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const result = await getCalendarEvents(startDate, endDate);

      expect(result).toHaveLength(0);

      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      await expect(getCalendarEvents(startDate, endDate)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("getCalendarEvents error"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("checkJadwalConflictByDate", () => {
    it("should return false when no conflict exists", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([]);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "08:00",
        "10:00",
      );

      expect(result).toBe(false);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          { column: "tanggal_praktikum", operator: "eq", value: "2025-01-15" },
          { column: "is_active", operator: "eq", value: true },
          { column: "status", operator: "in", value: ["pending", "approved"] },
        ]),
      );
    });

    it("should return true when time overlaps", async () => {
      const existingJadwal = {
        ...mockJadwal,
        jam_mulai: "09:00",
        jam_selesai: "11:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([existingJadwal]);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "08:00",
        "10:00", // Overlaps with 09:00-11:00
      );

      expect(result).toBe(true);
    });

    it("should return false when times do not overlap", async () => {
      const existingJadwal = {
        ...mockJadwal,
        jam_mulai: "10:00",
        jam_selesai: "12:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([existingJadwal]);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "08:00",
        "10:00", // No overlap with 10:00-12:00
      );

      expect(result).toBe(false);
    });

    it("should exclude specified ID when checking conflicts", async () => {
      const existingJadwal = {
        ...mockJadwal,
        id: "jadwal-2",
        jam_mulai: "09:00",
        jam_selesai: "11:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([existingJadwal]);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "08:00",
        "10:00",
        "jadwal-2", // Exclude this ID
      );

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "08:00",
        "10:00",
      );

      expect(result).toBe(false);
    });
  });

  describe("checkJadwalConflict (Legacy)", () => {
    it("should check conflicts by hari", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([]);

      const result = await checkJadwalConflict(
        "lab-1",
        "senin",
        "08:00",
        "10:00",
      );

      expect(result).toBe(false);
    });

    it("should return true when time overlaps on same hari", async () => {
      const existingJadwal = {
        ...mockJadwal,
        hari: "senin",
        jam_mulai: "09:00",
        jam_selesai: "11:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([existingJadwal]);

      const result = await checkJadwalConflict(
        "lab-1",
        "senin",
        "08:00",
        "10:00",
      );

      expect(result).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      const result = await checkJadwalConflict(
        "lab-1",
        "senin",
        "08:00",
        "10:00",
      );

      expect(result).toBe(false);
    });
  });

  describe("getJadwalPraktikumMahasiswa", () => {
    it("should fetch all active jadwal for mahasiswa without date range", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const result = await getJadwalPraktikumMahasiswa("user-1");

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.objectContaining({
          select: expect.stringContaining("laboratorium:laboratorium_id"),
          order: { column: "tanggal_praktikum", ascending: true },
        }),
      );
    });

    it("should fetch jadwal with start date filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const startDate = new Date("2025-01-01");
      const result = await getJadwalPraktikumMahasiswa("user-1", startDate);

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          {
            column: "tanggal_praktikum",
            operator: "gte",
            value: format(startDate, "yyyy-MM-dd"),
          },
        ]),
        expect.any(Object),
      );
    });

    it("should fetch jadwal with date range", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");
      const result = await getJadwalPraktikumMahasiswa(
        "user-1",
        startDate,
        endDate,
      );

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          {
            column: "tanggal_praktikum",
            operator: "gte",
            value: format(startDate, "yyyy-MM-dd"),
          },
          {
            column: "tanggal_praktikum",
            operator: "lte",
            value: format(endDate, "yyyy-MM-dd"),
          },
        ]),
        expect.any(Object),
      );
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Database error");
      vi.mocked(baseApi.queryWithFilters).mockRejectedValue(error);

      await expect(getJadwalPraktikumMahasiswa("user-1")).rejects.toThrow();
    });
  });

  describe("getJadwalHariIni", () => {
    it("should fetch today's jadwal for mahasiswa", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const result = await getJadwalHariIni("user-1");

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalled();
    });
  });

  describe("getJadwalMingguIni", () => {
    it("should fetch this week's jadwal for mahasiswa", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const result = await getJadwalMingguIni("user-1");

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalled();
    });
  });

  describe("getJadwalBulanIni", () => {
    it("should fetch this month's jadwal for mahasiswa", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const result = await getJadwalBulanIni("user-1");

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty jadwal array", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([]);

      const result = await getJadwal();

      expect(result).toEqual([]);
    });

    it("should handle jadwal without laboratorium relation", async () => {
      const jadwalWithoutLab = {
        ...mockJadwal,
        kelas: {
          id: "kelas-1",
          nama_kelas: "A",
        },
        laboratorium: undefined,
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([jadwalWithoutLab]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      const result = await getCalendarEvents(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0].location).toBeUndefined();
      expect(result[0].title).toBe("A - Lab");

      consoleSpy.mockRestore();
    });

    it("should handle multiple jadwal on same date", async () => {
      const jadwal1 = {
        ...mockJadwal,
        id: "jadwal-1",
        jam_mulai: "08:00",
        jam_selesai: "10:00",
      };
      const jadwal2 = {
        ...mockJadwal,
        id: "jadwal-2",
        jam_mulai: "10:00",
        jam_selesai: "12:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([jadwal1, jadwal2]);

      const tanggalPraktikum = new Date("2025-01-15");
      const result = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "11:00",
        "13:00",
      );

      expect(result).toBe(true); // Conflicts with jadwal2
    });

    it("should handle time boundary cases", async () => {
      const existingJadwal = {
        ...mockJadwal,
        jam_mulai: "10:00",
        jam_selesai: "12:00",
      };
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([existingJadwal]);

      const tanggalPraktikum = new Date("2025-01-15");

      // Exact start time match
      const result1 = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "10:00",
        "11:00",
      );
      expect(result1).toBe(true);

      // Exact end time match
      const result2 = await checkJadwalConflictByDate(
        "lab-1",
        tanggalPraktikum,
        "11:00",
        "12:00",
      );
      expect(result2).toBe(true);
    });

    it("should handle very long time ranges", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-12-31");

      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      const result = await getJadwalPraktikumMahasiswa(
        "user-1",
        startDate,
        endDate,
      );

      expect(result).toEqual([mockJadwalWithLab]);
    });
  });

  describe("Extended branch coverage", () => {
    it("should fetch calendar events with dosen and additional filters", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "dosen-1" },
                  error: null,
                }),
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        {
          ...mockJadwalWithLab,
          kelas: {
            nama_kelas: "A",
            mata_kuliah: {
              nama_mk: "Asuhan Kebidanan",
            },
          } as any,
        },
      ]);

      const result = await getCalendarEvents(
        new Date("2025-01-01"),
        new Date("2025-01-31"),
        {
          kelas_id: "kelas-1",
          laboratorium_id: "lab-1",
          hari: "rabu",
        },
      );

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Asuhan Kebidanan - A - Lab Kebidanan 1");
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "dosen_id", operator: "eq", value: "dosen-1" },
          { column: "kelas_id", operator: "eq", value: "kelas-1" },
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          { column: "hari", operator: "eq", value: "rabu" },
        ]),
        expect.any(Object),
      );
    });

    it("should approve, reject, cancel, and reactivate jadwal", async () => {
      vi.mocked(baseApi.update)
        .mockResolvedValueOnce({ ...mockJadwal, status: "approved" } as any)
        .mockResolvedValueOnce({
          ...mockJadwal,
          status: "rejected",
          cancellation_reason: "Bentrok",
        } as any);
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ error: null } as any)
        .mockResolvedValueOnce({ error: null } as any);

      await expect(approveJadwal("jadwal-1")).resolves.toMatchObject({
        status: "approved",
      });
      await expect(rejectJadwal("jadwal-1", "Bentrok")).resolves.toMatchObject({
        status: "rejected",
      });
      await expect(cancelJadwal("jadwal-1", "Libur")).resolves.toBeUndefined();
      await expect(reactivateJadwal("jadwal-1")).resolves.toBeUndefined();
    });

    it("should throw when reactivate jadwal rpc fails", async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        error: { message: "reactivate-error" },
      } as any);

      await expect(reactivateJadwal("jadwal-1")).rejects.toThrow(
        "reactivate-error",
      );
    });

    it("should fetch all jadwal for laboran with filters", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwalWithLab]);

      const result = await getAllJadwalForLaboran({
        status: "approved",
        laboratorium_id: "lab-1",
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-01-31"),
      });

      expect(result).toEqual([mockJadwalWithLab]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
          { column: "status", operator: "eq", value: "approved" },
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          {
            column: "tanggal_praktikum",
            operator: "gte",
            value: "2025-01-01",
          },
          {
            column: "tanggal_praktikum",
            operator: "lte",
            value: "2025-01-31",
          },
        ]),
        expect.objectContaining({
          order: { column: "tanggal_praktikum", ascending: false },
        }),
      );
    });

    it("should handle conflict legacy exclude id branch", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        {
          ...mockJadwal,
          id: "jadwal-1",
          hari: "senin",
          jam_mulai: "09:00",
          jam_selesai: "11:00",
        },
      ]);

      const result = await checkJadwalConflict(
        "lab-1",
        "senin",
        "08:00",
        "10:00",
        "jadwal-1",
      );

      expect(result).toBe(false);
    });

    it("should wrap jadwalApi helpers through withApiResponse", async () => {
      vi.mocked(baseApi.queryWithFilters).mockImplementation(
        async (_table: string, filters: any[]) => {
          const hasTanggalEq = filters?.some(
            (f: any) => f?.column === "tanggal_praktikum" && f?.operator === "eq",
          );

          if (hasTanggalEq) {
            return [] as any;
          }

          return [mockJadwalWithLab] as any;
        },
      );
      vi.mocked(baseApi.getById).mockResolvedValue(mockJadwalWithLab);
      vi.mocked(baseApi.insert).mockResolvedValue(mockJadwalWithLab);
      vi.mocked(baseApi.update).mockResolvedValue(mockJadwalWithLab);
      vi.mocked(baseApi.remove).mockResolvedValue(true as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "dosen-1" },
                  error: null,
                }),
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      } as any);

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await jadwalApi.getAll();
      await jadwalApi.getById("jadwal-1");
      await jadwalApi.getByLab("lab-1");
      await jadwalApi.getCalendarEvents(
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );
      await jadwalApi.create({
        kelas_id: "kelas-1",
        laboratorium_id: "lab-1",
        tanggal_praktikum: futureDate,
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Topik",
        catatan: "Catatan",
      } as any);
      await jadwalApi.update("jadwal-1", { topik: "Topik baru" } as any);
      await jadwalApi.delete("jadwal-1");
      await jadwalApi.checkConflictByDate(
        "lab-1",
        new Date("2025-01-15"),
        "08:00",
        "10:00",
        "jadwal-2",
      );
      await jadwalApi.checkConflict(
        "lab-1",
        "senin",
        "08:00",
        "10:00",
        "jadwal-2",
      );
      await jadwalApi.getMahasiswaJadwal("user-1");
      await jadwalApi.getJadwalHariIni("user-1");
      await jadwalApi.getJadwalMingguIni("user-1");
      await jadwalApi.getJadwalBulanIni("user-1");

      expect(baseApi.withApiResponse).toHaveBeenCalledTimes(13);
    });
    it("should handle updateJadwal date parsing, conflict, and error paths", async () => {
      vi.mocked(baseApi.getById)
        .mockResolvedValueOnce({
          ...mockJadwal,
          tanggal_praktikum: undefined,
        } as any)
        .mockResolvedValueOnce({
          ...mockJadwal,
          tanggal_praktikum: "2025-01-15",
        } as any);

      vi.mocked(baseApi.queryWithFilters)
        .mockResolvedValueOnce([
          {
            ...mockJadwal,
            id: "jadwal-konflik",
            tanggal_praktikum: format(new Date(), "yyyy-MM-dd"),
          },
        ] as any)
        .mockResolvedValueOnce([] as any);

      await expect(
        updateJadwal("jadwal-1", {
          laboratorium_id: "lab-1",
          jam_mulai: "09:00",
          jam_selesai: "11:00",
        } as any),
      ).rejects.toThrow("Jadwal bentrok! Lab sudah terpakai pada waktu tersebut");

      vi.mocked(baseApi.update).mockRejectedValueOnce(new Error("update-gagal"));

      await expect(
        updateJadwal("jadwal-1", {
          tanggal_praktikum: "2026-03-10",
          jam_mulai: "09:00",
          jam_selesai: "11:00",
        } as any),
      ).rejects.toThrow("update-gagal");
    });

    it("should handle deleteJadwal error path", async () => {
      vi.mocked(baseApi.remove).mockRejectedValueOnce(new Error("delete-gagal"));

      await expect(deleteJadwal("jadwal-1")).rejects.toThrow("delete-gagal");
    });

    it("should handle approval workflow error paths", async () => {
      vi.mocked(baseApi.update)
        .mockRejectedValueOnce(new Error("approve-gagal"))
        .mockRejectedValueOnce(new Error("reject-gagal"));
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ error: {} } as any)
        .mockResolvedValueOnce({ error: {} } as any);

      await expect(approveJadwal("jadwal-1")).rejects.toThrow("approve-gagal");
      await expect(rejectJadwal("jadwal-1")).rejects.toThrow("reject-gagal");
      await expect(cancelJadwal("jadwal-1", "Libur")).rejects.toThrow(
        "Gagal membatalkan jadwal. Hanya laboran yang dapat membatalkan jadwal.",
      );
      await expect(reactivateJadwal("jadwal-1")).rejects.toThrow(
        "Gagal mengaktifkan kembali jadwal. Hanya laboran yang dapat mengaktifkan kembali jadwal.",
      );
    });

    it("should handle getAllJadwalForLaboran error path", async () => {
      vi.mocked(baseApi.queryWithFilters).mockRejectedValueOnce(
        new Error("laboran-list-gagal"),
      );

      await expect(getAllJadwalForLaboran()).rejects.toThrow(
        "laboran-list-gagal",
      );
    });

    it("should update jadwal with Date object tanggal_praktikum", async () => {
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      vi.mocked(baseApi.getById).mockResolvedValueOnce({
        ...mockJadwal,
        tanggal_praktikum: "2025-01-15",
      } as any);
      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([] as any);
      vi.mocked(baseApi.update).mockResolvedValueOnce({
        ...mockJadwal,
        tanggal_praktikum: format(futureDate, "yyyy-MM-dd"),
      } as any);

      const result = await updateJadwal("jadwal-1", {
        tanggal_praktikum: futureDate,
      } as any);

      expect(result.tanggal_praktikum).toBe(format(futureDate, "yyyy-MM-dd"));
      expect(baseApi.update).toHaveBeenCalledWith(
        "jadwal_praktikum",
        "jadwal-1",
        expect.objectContaining({
          tanggal_praktikum: format(futureDate, "yyyy-MM-dd"),
        }),
      );
    });

    it("should reject update jadwal when tanggal_praktikum is in the past", async () => {
      vi.mocked(baseApi.getById).mockResolvedValueOnce(mockJadwalWithLab as any);

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await expect(
        updateJadwal("jadwal-1", {
          tanggal_praktikum: pastDate,
        } as any),
      ).rejects.toThrow("Tanggal praktikum tidak boleh di masa lalu");
    });
  });

  describe("Create Jadwal Uncovered Branches", () => {
    it("should parse create tanggal_praktikum from string and insert", async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const futureDateStr = format(futureDate, "yyyy-MM-dd");

      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([] as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockImplementationOnce((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "dosen-1" },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });
      vi.mocked(baseApi.insert).mockResolvedValueOnce({
        ...mockJadwal,
        dosen_id: "dosen-1",
        tanggal_praktikum: futureDateStr,
      } as any);

      const result = await createJadwal({
        kelas_id: "kelas-1",
        laboratorium_id: "lab-1",
        tanggal_praktikum: futureDateStr as any,
        jam_mulai: "08:00",
        jam_selesai: "10:00",
        topik: "Topik",
        catatan: "Catatan",
      } as any);

      expect(result).toBeTruthy();
      expect(baseApi.insert).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.objectContaining({
          tanggal_praktikum: futureDateStr,
        }),
      );
    });

    it("should throw for past date on createJadwal", async () => {
      const pastDateStr = format(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        "yyyy-MM-dd",
      );

      await expect(
        createJadwal({
          kelas_id: "kelas-1",
          laboratorium_id: "lab-1",
          tanggal_praktikum: pastDateStr as any,
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Topik",
          catatan: "Catatan",
        } as any),
      ).rejects.toThrow("Tanggal praktikum tidak boleh di masa lalu");
    });

    it("should throw conflict error on createJadwal", async () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([
        {
          ...mockJadwal,
          id: "jadwal-konflik",
          tanggal_praktikum: format(futureDate, "yyyy-MM-dd"),
          jam_mulai: "08:30",
          jam_selesai: "09:30",
          is_active: true,
        },
      ] as any);

      await expect(
        createJadwal({
          kelas_id: "kelas-1",
          laboratorium_id: "lab-1",
          tanggal_praktikum: futureDate,
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Topik",
          catatan: "Catatan",
        } as any),
      ).rejects.toThrow("Jadwal bentrok! Lab sudah terpakai");
    });

    it("should throw when dosen id is not found on createJadwal", async () => {
      const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([] as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: "user-tanpa-dosen" } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        } as any;
      });

      await expect(
        createJadwal({
          kelas_id: "kelas-1",
          laboratorium_id: "lab-1",
          tanggal_praktikum: futureDate,
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Topik",
          catatan: "Catatan",
        } as any),
      ).rejects.toThrow(
        "Dosen ID tidak ditemukan. Pastikan Anda login sebagai dosen.",
      );
    });

    it("should enter createJadwal catch path when insert fails", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([] as any);
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: "user-1" } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "dosen-1" },
                error: null,
              }),
            }),
          }),
        } as any;
      });
      vi.mocked(baseApi.insert).mockRejectedValueOnce(new Error("insert-gagal"));

      await expect(
        createJadwal({
          kelas_id: "kelas-1",
          laboratorium_id: "lab-1",
          tanggal_praktikum: futureDate,
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Topik",
          catatan: "Catatan",
        } as any),
      ).rejects.toThrow("insert-gagal");
    });

    it("should hit parse catch branch in getCalendarEvents item parsing", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      vi.mocked(baseApi.queryWithFilters).mockResolvedValueOnce([
        {
          ...mockJadwal,
          id: "jadwal-bad-parse",
          tanggal_praktikum: null,
        },
      ] as any);

      const events = await getCalendarEvents(
        new Date("2025-01-01"),
        new Date("2025-01-31"),
      );

      expect(events).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("Business Logic Validation", () => {
    it("should only return active jadwal when filtering", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      await getJadwalByLab("lab-1");

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.arrayContaining([
          { column: "is_active", operator: "eq", value: true },
        ]),
        expect.any(Object),
      );
    });

    it("should sort jadwal by tanggal_praktikum ascending", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      await getJadwal();

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.any(Array),
        expect.objectContaining({
          order: { column: "tanggal_praktikum", ascending: true },
        }),
      );
    });

    it("should include laboratorium relation in queries", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([
        mockJadwalWithLab,
      ]);

      await getJadwal();

      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        expect.any(Array),
        expect.objectContaining({
          select: expect.stringContaining("laboratorium:laboratorium_id"),
        }),
      );
    });
  });
});
