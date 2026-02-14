/**
 * Analytics API Unit Tests
 *
 * Tests for admin dashboard analytics:
 * - System metrics calculation
 * - Health status determination
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSystemMetrics } from "@/lib/api/analytics.api";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

vi.mock("../../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn(
    (permission, config, paramIndex, fn) => fn,
  ),
}));

import { supabase } from "@/lib/supabase/client";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mockQueryBuilder = () => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  };
  return builder;
};

// ============================================================================
// SYSTEM METRICS TESTS
// ============================================================================

describe("Analytics API - System Metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSystemMetrics", () => {
    it("should fetch all system metrics successfully", async () => {
      // Mock all parallel queries
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 150, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 75, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 200, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 25, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 30, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      const result = await getSystemMetrics();

      expect(result).toEqual({
        totalUsers: 150,
        totalEquipment: 75,
        totalBorrowings: 200,
        activeClasses: 25,
        activeBorrowings: 30,
        systemHealth: "Good",
      });
    });

    it("should determine Good health when borrowings < 50", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 100, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 50, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 100, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 20, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 30, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      const result = await getSystemMetrics();

      expect(result.systemHealth).toBe("Good");
    });

    it("should determine Warning health when borrowings 51-100", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 100, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 50, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 100, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 20, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 75, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      const result = await getSystemMetrics();

      expect(result.systemHealth).toBe("Warning");
    });

    it("should determine Critical health when borrowings > 100", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 100, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 50, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 100, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 20, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 150, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      const result = await getSystemMetrics();

      expect(result.systemHealth).toBe("Critical");
    });

    it("should handle null counts as 0", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: null, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: null, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: null, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: null, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({
        count: null,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      const result = await getSystemMetrics();

      expect(result).toEqual({
        totalUsers: 0,
        totalEquipment: 0,
        totalBorrowings: 0,
        activeClasses: 0,
        activeBorrowings: 0,
        systemHealth: "Good",
      });
    });

    it("should return zero metrics on error", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({
        count: null,
        error: new Error("Database error"),
      });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      const result = await getSystemMetrics();

      expect(result).toEqual({
        totalUsers: 0,
        totalEquipment: 0,
        totalBorrowings: 0,
        activeClasses: 0,
        activeBorrowings: 0,
        systemHealth: "Good",
      });
    });

    it("should filter active classes correctly", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 100, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 50, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 100, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 15, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 25, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      await getSystemMetrics();

      // Verify filter for active classes
      expect(classesBuilder.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should filter pending and approved borrowings", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.select.mockResolvedValue({ count: 100, error: null });

      const equipmentBuilder = mockQueryBuilder();
      equipmentBuilder.select.mockResolvedValue({ count: 50, error: null });

      const borrowingsBuilder = mockQueryBuilder();
      borrowingsBuilder.select.mockResolvedValue({ count: 100, error: null });

      const classesBuilder = mockQueryBuilder();
      classesBuilder.eq.mockResolvedValue({ count: 15, error: null });

      const activeBorrowingsBuilder = mockQueryBuilder();
      activeBorrowingsBuilder.in.mockResolvedValue({ count: 25, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(equipmentBuilder)
        .mockReturnValueOnce(borrowingsBuilder)
        .mockReturnValueOnce(classesBuilder)
        .mockReturnValueOnce(activeBorrowingsBuilder);

      await getSystemMetrics();

      // Verify filter for active borrowings
      expect(activeBorrowingsBuilder.in).toHaveBeenCalledWith("status", [
        "pending",
        "approved",
      ]);
    });
  });
});
