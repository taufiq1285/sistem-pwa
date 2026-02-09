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
} from "../../../lib/api/jadwal.api";
import * as baseApi from "../../../lib/api/base.api";
import type { Jadwal } from "../../../types/jadwal.types";

// Mock base API
vi.mock("../../../lib/api/base.api");
vi.mock("../../../lib/utils/errors");
vi.mock("../../../lib/middleware");

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
        [], // Empty array when no filters
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
        [{ column: "kelas_id", operator: "eq", value: "kelas-1" }],
        expect.any(Object),
      );
    });

    it("should fetch jadwal with laboratorium filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ laboratorium_id: "lab-1" });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        [{ column: "laboratorium_id", operator: "eq", value: "lab-1" }],
        expect.any(Object),
      );
    });

    it("should fetch jadwal with hari filter", async () => {
      vi.mocked(baseApi.queryWithFilters).mockResolvedValue([mockJadwal]);

      const result = await getJadwal({ hari: "senin" });

      expect(result).toEqual([mockJadwal]);
      expect(baseApi.queryWithFilters).toHaveBeenCalledWith(
        "jadwal_praktikum",
        [{ column: "hari", operator: "eq", value: "senin" }],
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
        [
          { column: "kelas_id", operator: "eq", value: "kelas-1" },
          { column: "laboratorium_id", operator: "eq", value: "lab-1" },
          { column: "hari", operator: "eq", value: "senin" },
          { column: "is_active", operator: "eq", value: true },
        ],
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
          { column: "status", operator: "eq", value: "approved" },
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
          { column: "status", operator: "eq", value: "approved" },
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
