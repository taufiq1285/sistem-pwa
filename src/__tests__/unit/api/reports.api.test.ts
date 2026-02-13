/**
 * Reports API Comprehensive Unit Tests
 * White-box testing for data aggregation, statistics, and reporting logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBorrowingStats,
  getEquipmentStats,
  getLabUsageStats,
  getTopBorrowedItems,
  getBorrowingTrends,
  getLabUtilization,
  getRecentActivities,
} from "../../../lib/api/reports.api";

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("../../../lib/utils/errors", () => ({
  handleSupabaseError: vi.fn((error) => error),
}));

import { supabase } from "../../../lib/supabase/client";
import { logger } from "../../../lib/utils/logger";
import { handleSupabaseError } from "../../../lib/utils/errors";

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
});

describe("Reports API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. getBorrowingStats - Valid Cases
  // ===========================================================================
  describe("getBorrowingStats - Valid Cases", () => {
    it("should calculate statistics with all status types", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "pending", jumlah_pinjam: 2 },
          { status: "approved", jumlah_pinjam: 5 },
          { status: "rejected", jumlah_pinjam: 1 },
          { status: "returned", jumlah_pinjam: 3 },
          { status: "overdue", jumlah_pinjam: 4 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.total_borrowings).toBe(5);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.returned).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.total_equipment_borrowed).toBe(15);
    });

    it("should handle empty data array", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.total_borrowings).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.approved).toBe(0);
      expect(stats.rejected).toBe(0);
      expect(stats.returned).toBe(0);
      expect(stats.overdue).toBe(0);
      expect(stats.total_equipment_borrowed).toBe(0);
    });

    it("should handle null data", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: null,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.total_borrowings).toBe(0);
      expect(stats.total_equipment_borrowed).toBe(0);
    });

    it("should calculate total equipment correctly with zero jumlah_pinjam", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "approved", jumlah_pinjam: 0 },
          { status: "approved", jumlah_pinjam: 5 },
          { status: "pending", jumlah_pinjam: 0 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.total_equipment_borrowed).toBe(5);
    });

    it("should handle multiple items with same status", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "pending", jumlah_pinjam: 2 },
          { status: "pending", jumlah_pinjam: 3 },
          { status: "pending", jumlah_pinjam: 1 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.pending).toBe(3);
      expect(stats.total_equipment_borrowed).toBe(6);
    });
  });

  // ===========================================================================
  // 2. getBorrowingStats - Error Handling
  // ===========================================================================
  describe("getBorrowingStats - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Database connection failed");
      builder.select.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getBorrowingStats()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch borrowing stats",
        { error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });

    it("should handle generic error in try-catch", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockRejectedValue(new Error("Network error"));
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getBorrowingStats()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 3. getEquipmentStats - Valid Cases
  // ===========================================================================
  describe("getEquipmentStats - Valid Cases", () => {
    it("should calculate equipment statistics with all categories", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 8, kategori: "Alat Medis" },
          { jumlah: 5, jumlah_tersedia: 0, kategori: "Elektronik" },
          { jumlah: 7, jumlah_tersedia: 3, kategori: "Alat Medis" },
          { jumlah: 4, jumlah_tersedia: 1, kategori: "Elektronik" },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.total_items).toBe(4);
      expect(stats.low_stock).toBe(1); // Only 1 item with < 5 and > 0
      expect(stats.out_of_stock).toBe(1);
      expect(stats.available).toBe(3);
      expect(stats.borrowed).toBe(14); // (10-8) + (5-0) + (7-3) + (4-1) = 14
      expect(stats.total_categories).toBe(2);
    });

    it("should identify low stock correctly (1-4 available)", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 1, kategori: "A" },
          { jumlah: 10, jumlah_tersedia: 2, kategori: "B" },
          { jumlah: 10, jumlah_tersedia: 3, kategori: "C" },
          { jumlah: 10, jumlah_tersedia: 4, kategori: "D" },
          { jumlah: 10, jumlah_tersedia: 5, kategori: "E" }, // Not low stock
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.low_stock).toBe(4);
    });

    it("should not count zero as low stock", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 0, kategori: "A" }, // Out of stock, not low
          { jumlah: 10, jumlah_tersedia: 1, kategori: "B" }, // Low stock
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.low_stock).toBe(1);
      expect(stats.out_of_stock).toBe(1);
    });

    it("should handle empty categories (null/undefined)", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 5, kategori: "A" },
          { jumlah: 10, jumlah_tersedia: 5, kategori: null },
          { jumlah: 10, jumlah_tersedia: 5, kategori: undefined },
          { jumlah: 10, jumlah_tersedia: 5 }, // No kategori field
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      // Should only count "A" as a valid category
      expect(stats.total_categories).toBe(1);
    });

    it("should handle empty data", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.total_items).toBe(0);
      expect(stats.borrowed).toBe(0);
      expect(stats.total_categories).toBe(0);
    });

    it("should calculate borrowed items correctly", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 10, kategori: "A" }, // 0 borrowed
          { jumlah: 10, jumlah_tersedia: 5, kategori: "A" },  // 5 borrowed
          { jumlah: 10, jumlah_tersedia: 0, kategori: "A" },  // 10 borrowed
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.borrowed).toBe(15);
    });
  });

  // ===========================================================================
  // 4. getEquipmentStats - Error Handling
  // ===========================================================================
  describe("getEquipmentStats - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Query failed");
      builder.select.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getEquipmentStats()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch equipment stats",
        { error: dbError }
      );
    });
  });

  // ===========================================================================
  // 5. getLabUsageStats - Valid Cases
  // ===========================================================================
  describe("getLabUsageStats - Valid Cases", () => {
    it("should calculate lab usage statistics from parallel queries", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockImplementation((field: string) => {
        if (field === "is_active") {
          return Promise.resolve({
            data: [{ kapasitas: 30 }, { kapasitas: 40 }],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      });
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getLabUsageStats();

      expect(stats.total_labs).toBe(2);
      expect(stats.total_capacity).toBe(70);
    });

    it("should handle empty results from all queries", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ data: [], error: null });
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getLabUsageStats();

      expect(stats.total_labs).toBe(0);
      expect(stats.active_schedules).toBe(0);
      expect(stats.total_capacity).toBe(0);
    });

    it("should handle null data from queries", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ data: null, error: null });
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getLabUsageStats();

      expect(stats.total_capacity).toBe(0);
    });

    it("should sum capacity correctly with zero values", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          { kapasitas: 30 },
          { kapasitas: 0 },
          { kapasitas: 40 },
        ],
        error: null,
      });
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getLabUsageStats();

      expect(stats.total_capacity).toBe(70);
    });
  });

  // ===========================================================================
  // 6. getLabUsageStats - Error Handling
  // ===========================================================================
  describe("getLabUsageStats - Error Handling", () => {
    it("should handle error in parallel queries", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Parallel query failed");
      builder.eq.mockRejectedValue(dbError);
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getLabUsageStats()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch lab usage stats",
        { error: dbError }
      );
    });
  });

  // ===========================================================================
  // 7. getTopBorrowedItems - Valid Cases
  // ===========================================================================
  describe("getTopBorrowedItems - Valid Cases", () => {
    it("should aggregate and sort top borrowed items", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 5,
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Item 1",
              kategori: "Cat1",
            },
          },
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 3,
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Item 1",
              kategori: "Cat1",
            },
          },
          {
            inventaris_id: "inv-2",
            jumlah_pinjam: 10,
            inventaris: {
              kode_barang: "ALT002",
              nama_barang: "Item 2",
              kategori: "Cat2",
            },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result).toHaveLength(2);
      expect(result[0].inventaris_id).toBe("inv-1");
      expect(result[0].total_borrowed).toBe(8);
      expect(result[0].times_borrowed).toBe(2);
      expect(result[1].inventaris_id).toBe("inv-2");
      expect(result[1].times_borrowed).toBe(1);
    });

    it("should sort by times_borrowed descending", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 1,
            inventaris: { kode_barang: "A", nama_barang: "Item 1", kategori: "A" },
          },
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 1,
            inventaris: { kode_barang: "A", nama_barang: "Item 1", kategori: "A" },
          },
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 1,
            inventaris: { kode_barang: "A", nama_barang: "Item 1", kategori: "A" },
          },
          {
            inventaris_id: "inv-2",
            jumlah_pinjam: 10,
            inventaris: { kode_barang: "B", nama_barang: "Item 2", kategori: "B" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result[0].times_borrowed).toBe(3);
      expect(result[1].times_borrowed).toBe(1);
    });

    it("should limit results correctly", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          { inventaris_id: "inv-1", jumlah_pinjam: 1, inventaris: { kode_barang: "A", nama_barang: "Item 1", kategori: "A" } },
          { inventaris_id: "inv-2", jumlah_pinjam: 1, inventaris: { kode_barang: "B", nama_barang: "Item 2", kategori: "B" } },
          { inventaris_id: "inv-3", jumlah_pinjam: 1, inventaris: { kode_barang: "C", nama_barang: "Item 3", kategori: "C" } },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(2);

      expect(result).toHaveLength(2);
    });

    it("should handle missing inventaris data", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 5,
            inventaris: null,
          },
          {
            inventaris_id: "inv-2",
            jumlah_pinjam: 3,
            inventaris: undefined,
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result).toHaveLength(2);
      expect(result[0].kode_barang).toBe("-");
      expect(result[0].nama_barang).toBe("Unknown");
      expect(result[0].kategori).toBe("Uncategorized");
    });

    it("should handle empty data", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result).toHaveLength(0);
    });

    it("should handle zero jumlah_pinjam", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          {
            inventaris_id: "inv-1",
            jumlah_pinjam: 0,
            inventaris: { kode_barang: "A", nama_barang: "Item 1", kategori: "A" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getTopBorrowedItems(10);

      expect(result[0].total_borrowed).toBe(0);
    });
  });

  // ===========================================================================
  // 8. getTopBorrowedItems - Error Handling
  // ===========================================================================
  describe("getTopBorrowedItems - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Database error");
      builder.in.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getTopBorrowedItems(10)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch top borrowed items",
        { limit: 10, error: dbError }
      );
    });
  });

  // ===========================================================================
  // 9. getBorrowingTrends - Valid Cases
  // ===========================================================================
  describe("getBorrowingTrends - Valid Cases", () => {
    it("should group trends by date", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: "2024-01-01T10:00:00Z", status: "approved", tanggal_pinjam: null },
          { created_at: "2024-01-01T11:00:00Z", status: "rejected", tanggal_pinjam: null },
          { created_at: "2024-01-02T10:00:00Z", status: "approved", tanggal_pinjam: null },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe("2024-01-01");
      expect(result[0].count).toBe(2);
      expect(result[0].approved).toBe(1);
      expect(result[0].rejected).toBe(1);
      expect(result[1].date).toBe("2024-01-02");
      expect(result[1].count).toBe(1);
    });

    it("should use tanggal_pinjam when created_at is null", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: null, status: "approved", tanggal_pinjam: "2024-01-01" },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe("2024-01-01");
    });

    it("should count approved status correctly (approved and returned)", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: "2024-01-01", status: "approved", tanggal_pinjam: null },
          { created_at: "2024-01-01", status: "returned", tanggal_pinjam: null },
          { created_at: "2024-01-01", status: "pending", tanggal_pinjam: null },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result[0].approved).toBe(2);
    });

    it("should count rejected status correctly", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: "2024-01-01", status: "rejected", tanggal_pinjam: null },
          { created_at: "2024-01-01", status: "rejected", tanggal_pinjam: null },
          { created_at: "2024-01-01", status: "approved", tanggal_pinjam: null },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result[0].rejected).toBe(2);
    });

    it("should sort trends by date ascending", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: "2024-01-03", status: "approved", tanggal_pinjam: null },
          { created_at: "2024-01-01", status: "approved", tanggal_pinjam: null },
          { created_at: "2024-01-02", status: "approved", tanggal_pinjam: null },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result[0].date).toBe("2024-01-01");
      expect(result[1].date).toBe("2024-01-02");
      expect(result[2].date).toBe("2024-01-03");
    });

    it("should handle empty data", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getBorrowingTrends(30);

      expect(result).toHaveLength(0);
    });

    it("should calculate correct start date from days parameter", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await getBorrowingTrends(7);

      expect(builder.gte).toHaveBeenCalled();
      const callArgs = builder.gte.mock.calls[0];
      expect(callArgs[0]).toBe("created_at");
      // Verify date is approximately 7 days ago
      const dateArg = new Date(callArgs[1]);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - dateArg.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(6);
      expect(daysDiff).toBeLessThanOrEqual(8);
    });
  });

  // ===========================================================================
  // 10. getBorrowingTrends - Error Handling
  // ===========================================================================
  describe("getBorrowingTrends - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Query failed");
      builder.gte.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getBorrowingTrends(30)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch borrowing trends",
        { days: 30, error: dbError }
      );
    });
  });

  // ===========================================================================
  // 11. getLabUtilization - Valid Cases
  // ===========================================================================
  describe("getLabUtilization - Valid Cases", () => {
    it("should aggregate lab utilization data", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
          {
            laboratorium_id: "lab-1",
            jam_mulai: "14:00",
            jam_selesai: "16:00",
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
          {
            laboratorium_id: "lab-2",
            jam_mulai: "09:00",
            jam_selesai: "11:00",
            laboratorium: { kode_lab: "LAB2", nama_lab: "Lab 2" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result).toHaveLength(2);
      expect(result[0].laboratorium_id).toBe("lab-1");
      expect(result[0].total_schedules).toBe(2);
      expect(result[0].total_hours).toBe(4);
      expect(result[1].total_schedules).toBe(1);
      expect(result[1].total_hours).toBe(2);
    });

    it("should calculate utilization percentage based on 40 hours", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "16:00", // 8 hours
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result[0].utilization_percentage).toBe(20); // 8/40 * 100
    });

    it("should cap utilization at 100%", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "20:00", // 12 hours
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "20:00", // Another 12 hours
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "20:00", // Another 12 hours
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      // 36 hours would be 90%, but we should cap at 100%
      expect(result[0].utilization_percentage).toBeLessThanOrEqual(100);
    });

    it("should sort by total_schedules descending", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
          {
            laboratorium_id: "lab-2",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            laboratorium: { kode_lab: "LAB2", nama_lab: "Lab 2" },
          },
          {
            laboratorium_id: "lab-2",
            jam_mulai: "14:00",
            jam_selesai: "16:00",
            laboratorium: { kode_lab: "LAB2", nama_lab: "Lab 2" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result[0].total_schedules).toBe(2);
      expect(result[1].total_schedules).toBe(1);
    });

    it("should handle missing laboratorium data", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            laboratorium: null,
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result[0].kode_lab).toBe("-");
      expect(result[0].nama_lab).toBe("Unknown");
    });

    it("should handle empty time strings", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: "",
            jam_selesai: "",
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result[0].total_hours).toBe(0);
    });

    it("should handle null time values", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          {
            laboratorium_id: "lab-1",
            jam_mulai: null,
            jam_selesai: null,
            laboratorium: { kode_lab: "LAB1", nama_lab: "Lab 1" },
          },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result[0].total_hours).toBe(0);
    });

    it("should handle empty data", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getLabUtilization();

      expect(result).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 12. getLabUtilization - Error Handling
  // ===========================================================================
  describe("getLabUtilization - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Query failed");
      builder.eq.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getLabUtilization()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch lab utilization",
        { error: dbError }
      );
    });
  });

  // ===========================================================================
  // 13. getRecentActivities - Valid Cases
  // ===========================================================================
  describe("getRecentActivities - Valid Cases", () => {
    it("should identify borrowing activity for pending status", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "pending",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: null,
            approved_at: null,
            dosen_id: "dosen-1",
            inventaris: { nama_barang: "Microscope" },
          },
        ],
        error: null,
      });
      builder.single.mockResolvedValue({
        data: { user: { full_name: "Dr. John" } },
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("borrowing");
      expect(result[0].description).toContain("requested to borrow");
      expect(result[0].timestamp).toBe("2024-01-01T10:00:00Z");
    });

    it("should identify return activity", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "returned",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: "2024-01-02T15:00:00Z",
            approved_at: null,
            dosen_id: "dosen-1",
            inventaris: { nama_barang: "Microscope" },
          },
        ],
        error: null,
      });
      builder.single.mockResolvedValue({
        data: { user: { full_name: "Dr. John" } },
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result[0].type).toBe("return");
      expect(result[0].description).toContain("returned");
      expect(result[0].timestamp).toBe("2024-01-02T15:00:00Z");
    });

    it("should identify approval activity", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "approved",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: null,
            approved_at: "2024-01-01T11:00:00Z",
            dosen_id: "dosen-1",
            inventaris: { nama_barang: "Microscope" },
          },
        ],
        error: null,
      });
      builder.single.mockResolvedValue({
        data: { user: { full_name: "Dr. John" } },
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result[0].type).toBe("approval");
      expect(result[0].description).toContain("approved");
      expect(result[0].timestamp).toBe("2024-01-01T11:00:00Z");
    });

    it("should identify rejection activity", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "rejected",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: null,
            approved_at: "2024-01-01T11:00:00Z",
            dosen_id: "dosen-1",
            inventaris: { nama_barang: "Microscope" },
          },
        ],
        error: null,
      });
      builder.single.mockResolvedValue({
        data: { user: { full_name: "Dr. John" } },
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result[0].type).toBe("rejection");
      expect(result[0].description).toContain("rejected");
    });

    it("should handle missing dosen_id", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "pending",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: null,
            approved_at: null,
            dosen_id: null,
            inventaris: { nama_barang: "Microscope" },
          },
        ],
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result[0].user_name).toBe("Unknown");
    });

    it("should handle missing inventaris data", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [
          {
            id: "1",
            status: "pending",
            created_at: "2024-01-01T10:00:00Z",
            tanggal_kembali_aktual: null,
            approved_at: null,
            dosen_id: null,
            inventaris: null,
          },
        ],
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result[0].description).toContain("Unknown");
    });

    it("should handle empty data", async () => {
      const builder = mockQueryBuilder();
      builder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getRecentActivities(20);

      expect(result).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 14. getRecentActivities - Error Handling
  // ===========================================================================
  describe("getRecentActivities - Error Handling", () => {
    it("should handle database error in main query", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Query failed");
      builder.limit.mockResolvedValue({
        data: null,
        error: dbError,
      });
      builder.order.mockReturnThis();
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(getRecentActivities(20)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch recent activities",
        { limit: 20, error: dbError }
      );
    });
  });

  // ===========================================================================
  // 15. White-Box Testing - Branch Coverage
  // ===========================================================================
  describe("White-Box Testing - Branch Coverage", () => {
    describe("getBorrowingStats branches", () => {
      it("should branch: data has items vs empty", async () => {
        // Branch 1: data with items
        const builder1 = mockQueryBuilder();
        builder1.select.mockResolvedValue({
          data: [{ status: "approved", jumlah_pinjam: 5 }],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder1 as any);
        const stats1 = await getBorrowingStats();
        expect(stats1.total_borrowings).toBe(1);

        // Branch 2: empty data
        const builder2 = mockQueryBuilder();
        builder2.select.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder2 as any);
        const stats2 = await getBorrowingStats();
        expect(stats2.total_borrowings).toBe(0);
      });

      it("should branch: each status type filter", async () => {
        const statuses = ["pending", "approved", "rejected", "returned", "overdue"];
        for (const status of statuses) {
          const builder = mockQueryBuilder();
          builder.select.mockResolvedValue({
            data: [{ status, jumlah_pinjam: 1 }],
            error: null,
          });
          vi.mocked(supabase.from).mockReturnValue(builder as any);
          const stats = await getBorrowingStats();
          expect(stats[status as keyof typeof stats]).toBe(1);
        }
      });
    });

    describe("getEquipmentStats branches", () => {
      it("should branch: low_stock threshold (< 5 and > 0)", async () => {
        const builder = mockQueryBuilder();
        builder.select.mockResolvedValue({
          data: [
            { jumlah: 10, jumlah_tersedia: 0, kategori: "A" },  // out of stock
            { jumlah: 10, jumlah_tersedia: 4, kategori: "B" },  // low stock
            { jumlah: 10, jumlah_tersedia: 5, kategori: "C" },  // not low stock
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const stats = await getEquipmentStats();
        expect(stats.low_stock).toBe(1);
        expect(stats.out_of_stock).toBe(1);
      });

      it("should branch: category filtering (null/undefined/valid)", async () => {
        const builder = mockQueryBuilder();
        builder.select.mockResolvedValue({
          data: [
            { jumlah: 10, jumlah_tersedia: 5, kategori: "Valid" },
            { jumlah: 10, jumlah_tersedia: 5, kategori: null },
            { jumlah: 10, jumlah_tersedia: 5, kategori: undefined },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const stats = await getEquipmentStats();
        expect(stats.total_categories).toBe(1);
      });
    });

    describe("getTopBorrowedItems branches", () => {
      it("should branch: inventaris data present vs missing", async () => {
        const builder = mockQueryBuilder();
        builder.in.mockResolvedValue({
          data: [
            { inventaris_id: "1", jumlah_pinjam: 5, inventaris: { kode_barang: "A", nama_barang: "Item", kategori: "A" } },
            { inventaris_id: "2", jumlah_pinjam: 5, inventaris: null },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getTopBorrowedItems(10);
        expect(result[0].kode_barang).toBe("A");
        expect(result[1].kode_barang).toBe("-");
      });
    });

    describe("getBorrowingTrends branches", () => {
      it("should branch: use created_at vs tanggal_pinjam", async () => {
        // Branch 1: use created_at
        const builder1 = mockQueryBuilder();
        builder1.gte.mockResolvedValue({
          data: [{ created_at: "2024-01-01T10:00:00Z", status: "approved", tanggal_pinjam: null }],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder1 as any);
        const result1 = await getBorrowingTrends(30);
        expect(result1[0].date).toBe("2024-01-01");

        // Branch 2: use tanggal_pinjam
        const builder2 = mockQueryBuilder();
        builder2.gte.mockResolvedValue({
          data: [{ created_at: null, status: "approved", tanggal_pinjam: "2024-01-02" }],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder2 as any);
        const result2 = await getBorrowingTrends(30);
        expect(result2[0].date).toBe("2024-01-02");
      });

      it("should branch: status counting (approved/returned, rejected, other)", async () => {
        const builder = mockQueryBuilder();
        builder.gte.mockResolvedValue({
          data: [
            { created_at: "2024-01-01", status: "approved", tanggal_pinjam: null },
            { created_at: "2024-01-01", status: "returned", tanggal_pinjam: null },
            { created_at: "2024-01-01", status: "rejected", tanggal_pinjam: null },
            { created_at: "2024-01-01", status: "pending", tanggal_pinjam: null },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getBorrowingTrends(30);
        expect(result[0].count).toBe(4);
        expect(result[0].approved).toBe(2);
        expect(result[0].rejected).toBe(1);
      });
    });

    describe("getLabUtilization branches", () => {
      it("should branch: time calculation (valid vs null/empty)", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          data: [
            { laboratorium_id: "1", jam_mulai: "08:00", jam_selesai: "10:00", laboratorium: {} },
            { laboratorium_id: "2", jam_mulai: null, jam_selesai: null, laboratorium: {} },
            { laboratorium_id: "3", jam_mulai: "", jam_selesai: "", laboratorium: {} },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getLabUtilization();
        expect(result[0].total_hours).toBe(2);
        expect(result[1].total_hours).toBe(0);
        expect(result[2].total_hours).toBe(0);
      });
    });

    describe("getRecentActivities branches", () => {
      it("should branch: activity type detection", async () => {
        const testCases = [
          { status: "returned", tanggal_kembali_aktual: "2024-01-02", expected: "return" },
          { status: "approved", approved_at: "2024-01-01", expected: "approval" },
          { status: "rejected", approved_at: "2024-01-01", expected: "rejection" },
          { status: "pending", expected: "borrowing" },
        ];

        for (const testCase of testCases) {
          const builder = mockQueryBuilder();
          builder.limit.mockResolvedValue({
            data: [{
              id: "1",
              status: testCase.status,
              created_at: "2024-01-01",
              tanggal_kembali_aktual: testCase.tanggal_kembali_aktual || null,
              approved_at: testCase.approved_at || null,
              dosen_id: null,
              inventaris: {},
            }],
            error: null,
          });
          builder.order.mockReturnThis();
          builder.select.mockReturnThis();
          vi.mocked(supabase.from).mockReturnValue(builder as any);
          const result = await getRecentActivities(20);
          expect(result[0].type).toBe(testCase.expected);
        }
      });
    });
  });

  // ===========================================================================
  // 16. White-Box Testing - Path Coverage
  // ===========================================================================
  describe("White-Box Testing - Path Coverage", () => {
    describe("getBorrowingStats paths", () => {
      it("should path: success path with complete data", async () => {
        const builder = mockQueryBuilder();
        builder.select.mockResolvedValue({
          data: [
            { status: "pending", jumlah_pinjam: 2 },
            { status: "approved", jumlah_pinjam: 5 },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const stats = await getBorrowingStats();
        expect(stats).toBeDefined();
      });

      it("should path: success path with empty data", async () => {
        const builder = mockQueryBuilder();
        builder.select.mockResolvedValue({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const stats = await getBorrowingStats();
        expect(stats.total_borrowings).toBe(0);
      });

      it("should path: error path with database error", async () => {
        const builder = mockQueryBuilder();
        const dbError = new Error("DB error");
        builder.select.mockResolvedValue({ data: null, error: dbError });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        await expect(getBorrowingStats()).rejects.toThrow();
      });
    });

    describe("getTopBorrowedItems aggregation paths", () => {
      it("should path: aggregation with multiple items, same inventaris_id", async () => {
        const builder = mockQueryBuilder();
        builder.in.mockResolvedValue({
          data: [
            { inventaris_id: "1", jumlah_pinjam: 5, inventaris: { kode_barang: "A", nama_barang: "I1", kategori: "A" } },
            { inventaris_id: "1", jumlah_pinjam: 3, inventaris: { kode_barang: "A", nama_barang: "I1", kategori: "A" } },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getTopBorrowedItems(10);
        expect(result).toHaveLength(1);
        expect(result[0].total_borrowed).toBe(8);
        expect(result[0].times_borrowed).toBe(2);
      });

      it("should path: sorting and limiting", async () => {
        const builder = mockQueryBuilder();
        builder.in.mockResolvedValue({
          data: [
            { inventaris_id: "1", jumlah_pinjam: 1, inventaris: { kode_barang: "A", nama_barang: "I1", kategori: "A" } },
            { inventaris_id: "1", jumlah_pinjam: 1, inventaris: { kode_barang: "A", nama_barang: "I1", kategori: "A" } },
            { inventaris_id: "2", jumlah_pinjam: 1, inventaris: { kode_barang: "B", nama_barang: "I2", kategori: "B" } },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getTopBorrowedItems(1);
        expect(result).toHaveLength(1);
        expect(result[0].inventaris_id).toBe("1");
      });
    });

    describe("getBorrowingTrends grouping paths", () => {
      it("should path: group by date and count statuses", async () => {
        const builder = mockQueryBuilder();
        builder.gte.mockResolvedValue({
          data: [
            { created_at: "2024-01-01T10:00:00Z", status: "approved", tanggal_pinjam: null },
            { created_at: "2024-01-01T11:00:00Z", status: "approved", tanggal_pinjam: null },
            { created_at: "2024-01-01T12:00:00Z", status: "rejected", tanggal_pinjam: null },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getBorrowingTrends(30);
        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(3);
        expect(result[0].approved).toBe(2);
        expect(result[0].rejected).toBe(1);
      });
    });

    describe("getLabUtilization calculation paths", () => {
      it("should path: aggregate by lab, calculate hours, percentage, sort", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          data: [
            { laboratorium_id: "1", jam_mulai: "08:00", jam_selesai: "10:00", laboratorium: { kode_lab: "A", nama_lab: "Lab A" } },
            { laboratorium_id: "1", jam_mulai: "14:00", jam_selesai: "16:00", laboratorium: { kode_lab: "A", nama_lab: "Lab A" } },
            { laboratorium_id: "2", jam_mulai: "09:00", jam_selesai: "11:00", laboratorium: { kode_lab: "B", nama_lab: "Lab B" } },
          ],
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);
        const result = await getLabUtilization();
        expect(result[0].laboratorium_id).toBe("1");
        expect(result[0].total_schedules).toBe(2);
        expect(result[0].total_hours).toBe(4);
        expect(result[0].utilization_percentage).toBe(10); // 4/40 * 100
      });
    });
  });

  // ===========================================================================
  // 17. White-Box Testing - Statement Coverage
  // ===========================================================================
  describe("White-Box Testing - Statement Coverage", () => {
    it("should execute all reduce statements in getBorrowingStats", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "pending", jumlah_pinjam: 0 },
          { status: "approved", jumlah_pinjam: 5 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const stats = await getBorrowingStats();
      expect(stats.total_equipment_borrowed).toBe(5);
    });

    it("should execute all filter and reduce statements in getEquipmentStats", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 3, kategori: "A" },  // low stock
          { jumlah: 10, jumlah_tersedia: 0, kategori: "B" },  // out of stock
          { jumlah: 10, jumlah_tersedia: 10, kategori: "C" }, // available
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const stats = await getEquipmentStats();
      expect(stats.low_stock).toBe(1);
      expect(stats.out_of_stock).toBe(1);
      expect(stats.available).toBe(2);
      expect(stats.borrowed).toBe(17);
      expect(stats.total_categories).toBe(3);
    });

    it("should execute all aggregation statements in getTopBorrowedItems", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          { inventaris_id: "1", jumlah_pinjam: 5, inventaris: { kode_barang: "A", nama_barang: "Item", kategori: "A" } },
          { inventaris_id: "1", jumlah_pinjam: 3, inventaris: { kode_barang: "A", nama_barang: "Item", kategori: "A" } },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getTopBorrowedItems(10);
      expect(result[0].total_borrowed).toBe(8);
      expect(result[0].times_borrowed).toBe(2);
    });

    it("should execute all date calculation statements in getBorrowingTrends", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({
        data: [
          { created_at: "2024-01-01T10:00:00Z", status: "approved", tanggal_pinjam: null },
          { created_at: "2024-01-01T11:00:00Z", status: "rejected", tanggal_pinjam: null },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getBorrowingTrends(30);
      expect(result[0].date).toBe("2024-01-01");
      expect(result[0].count).toBe(2);
      expect(result[0].approved).toBe(1);
      expect(result[0].rejected).toBe(1);
    });

    it("should execute all time parsing statements in getLabUtilization", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          { laboratorium_id: "1", jam_mulai: "08:00", jam_selesai: "10:00", laboratorium: { kode_lab: "A", nama_lab: "Lab" } },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getLabUtilization();
      expect(result[0].total_hours).toBe(2);
      expect(result[0].utilization_percentage).toBe(5); // 2/40 * 100
    });
  });

  // ===========================================================================
  // 18. Edge Cases
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle very large jumlah_pinjam values", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "approved", jumlah_pinjam: 1000000 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const stats = await getBorrowingStats();
      expect(stats.total_equipment_borrowed).toBe(1000000);
    });

    it("should handle negative values (if database allows)", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 15, kategori: "A" }, // Would give -5 borrowed
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const stats = await getEquipmentStats();
      expect(stats.borrowed).toBe(-5);
    });

    it("should handle midnight times in getLabUtilization", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          { laboratorium_id: "1", jam_mulai: "00:00", jam_selesai: "01:00", laboratorium: {} },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getLabUtilization();
      expect(result[0].total_hours).toBe(1);
    });

    it("should handle 23:00 times in getLabUtilization", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [
          { laboratorium_id: "1", jam_mulai: "22:00", jam_selesai: "23:00", laboratorium: {} },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getLabUtilization();
      expect(result[0].total_hours).toBe(1);
    });

    it("should handle 0 days in getBorrowingTrends", async () => {
      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getBorrowingTrends(0);
      expect(result).toHaveLength(0);
    });

    it("should handle very large limit in getTopBorrowedItems", async () => {
      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({
        data: [
          { inventaris_id: "1", jumlah_pinjam: 1, inventaris: { kode_barang: "A", nama_barang: "Item", kategori: "A" } },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const result = await getTopBorrowedItems(10000);
      expect(result).toHaveLength(1);
    });

    it("should handle concurrent Promise.all in getLabUsageStats", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({
        data: [{ kapasitas: 30 }],
        error: null,
      });
      builder.select.mockReturnThis();
      vi.mocked(supabase.from).mockReturnValue(builder as any);
      const stats = await getLabUsageStats();
      expect(stats).toBeDefined();
    });
  });

  // ===========================================================================
  // 19. Performance Testing
  // ===========================================================================
  describe("Performance Testing", () => {
    it("should handle large datasets in getBorrowingStats efficiently", async () => {
      const largeData = Array(1000).fill(null).map((_, i) => ({
        status: ["pending", "approved", "rejected", "returned", "overdue"][i % 5],
        jumlah_pinjam: i,
      }));

      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({ data: largeData, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const startTime = Date.now();
      const stats = await getBorrowingStats();
      const duration = Date.now() - startTime;

      expect(stats.total_borrowings).toBe(1000);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should handle large datasets in getEquipmentStats efficiently", async () => {
      const largeData = Array(500).fill(null).map((_, i) => ({
        jumlah: 10,
        jumlah_tersedia: i % 5,
        kategori: `Category${i % 10}`,
      }));

      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({ data: largeData, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const startTime = Date.now();
      const stats = await getEquipmentStats();
      const duration = Date.now() - startTime;

      expect(stats.total_items).toBe(500);
      expect(duration).toBeLessThan(100);
    });

    it("should handle aggregation of large datasets in getTopBorrowedItems", async () => {
      const largeData = Array(500).fill(null).map((_, i) => ({
        inventaris_id: `inv-${i % 50}`, // 50 unique items
        jumlah_pinjam: i,
        inventaris: {
          kode_barang: `CODE${i % 50}`,
          nama_barang: `Item ${i % 50}`,
          kategori: `Cat${i % 5}`,
        },
      }));

      const builder = mockQueryBuilder();
      builder.in.mockResolvedValue({ data: largeData, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const startTime = Date.now();
      const result = await getTopBorrowedItems(10);
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(10);
      expect(duration).toBeLessThan(100);
    });

    it("should handle date grouping efficiently in getBorrowingTrends", async () => {
      const largeData = Array(365).fill(null).map((_, i) => ({
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        status: ["approved", "rejected", "pending"][i % 3],
        tanggal_pinjam: null,
      }));

      const builder = mockQueryBuilder();
      builder.gte.mockResolvedValue({ data: largeData, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const startTime = Date.now();
      const result = await getBorrowingTrends(365);
      const duration = Date.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });
  });

  // ===========================================================================
  // 20. Integration Scenarios
  // ===========================================================================
  describe("Integration Scenarios", () => {
    it("should work with realistic borrowing data", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { status: "pending", jumlah_pinjam: 2 },
          { status: "approved", jumlah_pinjam: 5 },
          { status: "approved", jumlah_pinjam: 3 },
          { status: "returned", jumlah_pinjam: 4 },
          { status: "rejected", jumlah_pinjam: 1 },
          { status: "overdue", jumlah_pinjam: 2 },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getBorrowingStats();

      expect(stats.total_borrowings).toBe(6);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(2);
      expect(stats.returned).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.total_equipment_borrowed).toBe(17);
    });

    it("should work with realistic equipment data", async () => {
      const builder = mockQueryBuilder();
      builder.select.mockResolvedValue({
        data: [
          { jumlah: 10, jumlah_tersedia: 10, kategori: "Alat Medis" },
          { jumlah: 10, jumlah_tersedia: 5, kategori: "Alat Medis" },
          { jumlah: 10, jumlah_tersedia: 3, kategori: "Elektronik" },
          { jumlah: 10, jumlah_tersedia: 1, kategori: "Elektronik" },
          { jumlah: 10, jumlah_tersedia: 0, kategori: "Alat Medis" },
          { jumlah: 10, jumlah_tersedia: 0, kategori: "Elektronik" },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getEquipmentStats();

      expect(stats.total_items).toBe(6);
      expect(stats.low_stock).toBe(2);
      expect(stats.out_of_stock).toBe(2);
      expect(stats.available).toBe(4);
      expect(stats.borrowed).toBe(21);
      expect(stats.total_categories).toBe(2);
    });
  });
});
