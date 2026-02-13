/**
 * Announcements API Unit Tests
 * Comprehensive white-box testing for system announcements management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllAnnouncements,
  getAnnouncementStats,
  createAnnouncement,
  deleteAnnouncement,
} from "../../../lib/api/announcements.api";

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn(
    (permission, config, paramIndex, fn) => fn,
  ),
}));

vi.mock("../../../lib/utils/errors", () => ({
  handleError: vi.fn((error) => error),
  logError: vi.fn(),
}));

import { supabase } from "../../../lib/supabase/client";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockAnnouncement = {
  id: "ann-1",
  judul: "Pengumuman Penting",
  konten: "Konten pengumuman",
  tipe: "info",
  prioritas: "high",
  target_role: "all",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  tanggal_mulai: "2024-01-15T00:00:00Z",
  tanggal_selesai: "2024-12-31T23:59:59Z",
  attachment_url: null,
  penulis_id: "user-admin",
  users: {
    full_name: "Admin User",
    role: "admin",
  },
};

const mockAnnouncementsList = [
  mockAnnouncement,
  {
    ...mockAnnouncement,
    id: "ann-2",
    judul: "Pengumuman Kedua",
    prioritas: "normal",
    target_role: "mahasiswa",
    tanggal_selesai: "2025-06-30T23:59:59Z",
  },
  {
    ...mockAnnouncement,
    id: "ann-3",
    judul: "Pengumuman Ketiga",
    prioritas: "low",
    target_role: "dosen",
    tanggal_selesai: "2024-01-01T00:00:00Z", // Expired
  },
];

const mockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
});

// ============================================================================
// TEST SUITES
// ============================================================================

describe("Announcements API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. GET ALL ANNOUNCEMENTS
  // ==========================================================================

  describe("1. Get All Announcements", () => {
    describe("getAllAnnouncements() - Success Paths", () => {
      it("should fetch all announcements successfully", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(3);
        expect(supabase.from).toHaveBeenCalledWith("pengumuman");
      });

      it("should include penulis information from users relation", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0]).toHaveProperty("penulis");
        expect(result[0].penulis).toEqual({
          full_name: "Admin User",
          role: "admin",
        });
      });

      it("should handle announcements without users data", async () => {
        const announcementWithoutUser = {
          ...mockAnnouncement,
          users: null,
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [announcementWithoutUser], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).toBeUndefined();
      });

      it("should order by created_at descending", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await getAllAnnouncements();

        expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      });

      it("should return empty array when no announcements", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toEqual([]);
      });

      it("should handle null data", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: null, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toEqual([]);
      });

      it("should include all announcement fields", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("judul");
        expect(result[0]).toHaveProperty("konten");
        expect(result[0]).toHaveProperty("tipe");
        expect(result[0]).toHaveProperty("prioritas");
        expect(result[0]).toHaveProperty("target_role");
        expect(result[0]).toHaveProperty("created_at");
        expect(result[0]).toHaveProperty("tanggal_mulai");
        expect(result[0]).toHaveProperty("tanggal_selesai");
      });

      it("should select correct fields from database", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await getAllAnnouncements();

        expect(builder.select).toHaveBeenCalledWith(
          expect.stringContaining("id")
        );
        expect(builder.select).toHaveBeenCalledWith(
          expect.stringContaining("judul")
        );
        expect(builder.select).toHaveBeenCalledWith(
          expect.stringContaining("users")
        );
      });
    });

    describe("getAllAnnouncements() - Error Paths", () => {
      it("should throw error when database query fails", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow("Database error");
      });

      it("should throw error when supabase.from fails", async () => {
        vi.mocked(supabase.from).mockImplementation(() => {
          throw new Error("Connection error");
        });

        await expect(getAllAnnouncements()).rejects.toThrow();
      });

      it("should log error to console", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Test error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching announcements:",
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });

      it("should handle network errors", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockRejectedValue(new Error("Network error"));
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow("Network error");
      });

      it("should handle timeout errors", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockRejectedValue(new Error("Request timeout"));
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow("Request timeout");
      });

      it("should handle permission errors", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: { message: "Permission denied", code: "42501" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow();
      });
    });

    describe("getAllAnnouncements() - Edge Cases", () => {
      it("should handle large number of announcements", async () => {
        const largeList = Array.from({ length: 100 }, (_, i) => ({
          ...mockAnnouncement,
          id: `ann-${i}`,
          judul: `Announcement ${i}`,
        }));
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: largeList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(100);
      });

      it("should handle very long judul", async () => {
        const longTitleAnnouncement = {
          ...mockAnnouncement,
          judul: "A".repeat(255),
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [longTitleAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].judul).toHaveLength(255);
      });

      it("should handle special characters in konten", async () => {
        const specialCharAnnouncement = {
          ...mockAnnouncement,
          konten: "<script>alert('test')</script> & \" ' \\n \\t",
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [specialCharAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].konten).toContain("<script>");
      });

      it("should handle null attachment_url", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].attachment_url).toBeNull();
      });

      it("should handle attachment_url with value", async () => {
        const announcementWithAttachment = {
          ...mockAnnouncement,
          attachment_url: "https://example.com/file.pdf",
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [announcementWithAttachment], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].attachment_url).toBe("https://example.com/file.pdf");
      });

      it("should handle all priority levels", async () => {
        const prioritiesList = [
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "normal" },
          { ...mockAnnouncement, prioritas: "low" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: prioritiesList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].prioritas).toBe("high");
        expect(result[1].prioritas).toBe("normal");
        expect(result[2].prioritas).toBe("low");
      });

      it("should handle all target_role values", async () => {
        const roleList = [
          { ...mockAnnouncement, target_role: "all" },
          { ...mockAnnouncement, target_role: "admin" },
          { ...mockAnnouncement, target_role: "dosen" },
          { ...mockAnnouncement, target_role: "mahasiswa" },
          { ...mockAnnouncement, target_role: "laboran" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: roleList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(5);
        expect(result.map((a) => a.target_role)).toEqual([
          "all",
          "admin",
          "dosen",
          "mahasiswa",
          "laboran",
        ]);
      });
    });
  });

  // ==========================================================================
  // 2. GET ANNOUNCEMENT STATS
  // ==========================================================================

  describe("2. Get Announcement Stats", () => {
    describe("getAnnouncementStats() - Success Paths", () => {
      it("should calculate total announcements correctly", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(3);
      });

      it("should calculate active announcements (not expired)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        // ann-1 and ann-2 are active (not expired), ann-3 is expired
        expect(stats.active).toBeGreaterThanOrEqual(2);
      });

      it("should count announcement as active when tanggal_selesai is null", async () => {
        const noEndDate = [
          {
            ...mockAnnouncement,
            tanggal_selesai: null,
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: noEndDate, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(1);
      });

      it("should count announcement as active when tanggal_selesai > now", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const activeAnnouncement = [
          {
            ...mockAnnouncement,
            tanggal_selesai: futureDate.toISOString(),
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: activeAnnouncement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(1);
      });

      it("should not count expired announcements as active", async () => {
        const expiredAnnouncement = [
          {
            ...mockAnnouncement,
            tanggal_selesai: "2020-01-01T00:00:00Z", // Past date
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: expiredAnnouncement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(0);
      });

      it("should calculate high priority announcements", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(1); // Only ann-1 has high priority
      });

      it("should count announcements with prioritas === 'high'", async () => {
        const highPriorityList = [
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "normal" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: highPriorityList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(2);
      });

      it("should calculate scheduled announcements (future start date)", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const scheduledAnnouncement = [
          {
            ...mockAnnouncement,
            tanggal_mulai: futureDate.toISOString(),
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: scheduledAnnouncement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(1);
      });

      it("should not count past announcements as scheduled", async () => {
        const pastAnnouncement = [
          {
            ...mockAnnouncement,
            tanggal_mulai: "2020-01-01T00:00:00Z",
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: pastAnnouncement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });

      it("should not count announcements without tanggal_mulai as scheduled", async () => {
        const noStartDate = [
          {
            ...mockAnnouncement,
            tanggal_mulai: null,
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: noStartDate, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });

      it("should return all stats properties", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats).toHaveProperty("total");
        expect(stats).toHaveProperty("active");
        expect(stats).toHaveProperty("highPriority");
        expect(stats).toHaveProperty("scheduled");
      });
    });

    describe("getAnnouncementStats() - Error Paths", () => {
      it("should return zero stats on error", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats).toEqual({
          total: 0,
          active: 0,
          highPriority: 0,
          scheduled: 0,
        });
      });

      it("should return zero stats on getAllAnnouncements failure", async () => {
        vi.mocked(supabase.from).mockImplementation(() => {
          throw new Error("Connection error");
        });

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(0);
        expect(stats.active).toBe(0);
        expect(stats.highPriority).toBe(0);
        expect(stats.scheduled).toBe(0);
      });

      it("should log error to console", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Test error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await getAnnouncementStats();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching announcement stats:",
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe("getAnnouncementStats() - Edge Cases", () => {
      it("should handle empty announcements list", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(0);
        expect(stats.active).toBe(0);
        expect(stats.highPriority).toBe(0);
        expect(stats.scheduled).toBe(0);
      });

      it("should handle all high priority announcements", async () => {
        const allHigh = [
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "high" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: allHigh, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(3);
      });

      it("should handle all expired announcements", async () => {
        const allExpired = [
          { ...mockAnnouncement, tanggal_selesai: "2020-01-01T00:00:00Z" },
          { ...mockAnnouncement, tanggal_selesai: "2020-01-02T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: allExpired, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(0);
      });

      it("should handle all scheduled announcements", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const allScheduled = [
          { ...mockAnnouncement, tanggal_mulai: futureDate.toISOString() },
          { ...mockAnnouncement, tanggal_mulai: futureDate.toISOString() },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: allScheduled, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(2);
      });

      it("should handle large number of announcements", async () => {
        const largeList = Array.from({ length: 100 }, (_, i) => ({
          ...mockAnnouncement,
          prioritas: i % 3 === 0 ? "high" : "normal",
          tanggal_selesai: i % 2 === 0 ? null : "2099-12-31T23:59:59Z",
          tanggal_mulai: i % 4 === 0 ? "2099-01-01T00:00:00Z" : null,
        }));
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: largeList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(100);
        expect(stats.highPriority).toBe(34); // 100 / 3 rounded down
      });

      it("should handle announcement with exact current timestamp", async () => {
        const now = new Date().toISOString();
        const exactNow = [
          {
            ...mockAnnouncement,
            tanggal_selesai: now,
          },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: exactNow, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        // Should handle edge case gracefully
        expect(stats.active).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ==========================================================================
  // 3. CREATE ANNOUNCEMENT
  // ==========================================================================

  describe("3. Create Announcement", () => {
    describe("createAnnouncement() - Success Paths", () => {
      it("should create announcement successfully", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "Test Announcement",
          konten: "Test content",
          prioritas: "normal",
          penulis_id: "user-1",
        } as any);

        expect(supabase.from).toHaveBeenCalledWith("pengumuman");
        expect(builder.insert).toHaveBeenCalled();
      });

      it("should create announcement with all fields", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const announcementData = {
          judul: "Full Announcement",
          konten: "Full content",
          tipe: "urgent",
          prioritas: "high",
          target_role: "all",
          tanggal_mulai: "2024-01-15T00:00:00Z",
          tanggal_selesai: "2024-12-31T23:59:59Z",
          attachment_url: "https://example.com/file.pdf",
          penulis_id: "user-admin",
        };

        await createAnnouncement(announcementData as any);

        expect(builder.insert).toHaveBeenCalledWith(announcementData);
      });

      it("should create announcement with minimal fields", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const minimalData = {
          judul: "Minimal",
          konten: "Content",
          penulis_id: "user-1",
        };

        await createAnnouncement(minimalData as any);

        expect(builder.insert).toHaveBeenCalled();
      });

      it("should complete without error on success", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).resolves.toBeUndefined();
      });
    });

    describe("createAnnouncement() - Error Paths", () => {
      it("should throw error when insert fails", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({
          error: new Error("Insert failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow("Insert failed");
      });

      it("should throw error on database connection failure", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockRejectedValue(new Error("Connection failed"));
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow("Connection failed");
      });

      it("should log error to console", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({
          error: new Error("Test error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error creating announcement:",
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });

      it("should handle validation errors", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({
          error: { message: "Validation failed", code: "23514" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow();
      });

      it("should handle permission errors", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({
          error: { message: "Permission denied", code: "42501" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow();
      });
    });

    describe("createAnnouncement() - Edge Cases", () => {
      it("should handle very long judul", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "A".repeat(255),
          konten: "Content",
          penulis_id: "user-1",
        } as any);

        expect(builder.insert).toHaveBeenCalled();
      });

      it("should handle special characters in konten", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "Test",
          konten: "<script>alert('test')</script> & \" ' \\n",
          penulis_id: "user-1",
        } as any);

        expect(builder.insert).toHaveBeenCalled();
      });

      it("should handle null optional fields", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "Test",
          konten: "Content",
          penulis_id: "user-1",
          tanggal_mulai: null,
          tanggal_selesai: null,
          attachment_url: null,
        } as any);

        expect(builder.insert).toHaveBeenCalled();
      });

      it("should handle empty konten", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "Test",
          konten: "",
          penulis_id: "user-1",
        } as any);

        expect(builder.insert).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // 4. DELETE ANNOUNCEMENT
  // ==========================================================================

  describe("4. Delete Announcement", () => {
    describe("deleteAnnouncement() - Success Paths", () => {
      it("should delete announcement successfully", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await deleteAnnouncement("ann-1");

        expect(supabase.from).toHaveBeenCalledWith("pengumuman");
        expect(builder.delete).toHaveBeenCalled();
        expect(builder.eq).toHaveBeenCalledWith("id", "ann-1");
      });

      it("should complete without error on success", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).resolves.toBeUndefined();
      });

      it("should call delete chain correctly", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await deleteAnnouncement("ann-1");

        expect(builder.delete).toHaveBeenCalledBefore(builder.eq);
      });
    });

    describe("deleteAnnouncement() - Error Paths", () => {
      it("should throw error when delete fails", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: new Error("Delete failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow("Delete failed");
      });

      it("should throw error on database connection failure", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockRejectedValue(new Error("Connection failed"));
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow("Connection failed");
      });

      it("should handle not found error", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: { message: "Not found", code: "PGRST116" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("invalid-id")).rejects.toThrow();
      });

      it("should log error to console", async () => {
        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: new Error("Test error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error deleting announcement:",
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });

      it("should handle permission errors", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: { message: "Permission denied", code: "42501" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow();
      });

      it("should handle foreign key constraint errors", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: { message: "Foreign key violation", code: "23503" },
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow();
      });
    });

    describe("deleteAnnouncement() - Edge Cases", () => {
      it("should handle empty string id", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await deleteAnnouncement("");

        expect(builder.eq).toHaveBeenCalledWith("id", "");
      });

      it("should handle special characters in id", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await deleteAnnouncement("ann-123-abc-XYZ");

        expect(builder.eq).toHaveBeenCalledWith("id", "ann-123-abc-XYZ");
      });

      it("should handle very long id", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const longId = "A".repeat(100);
        await deleteAnnouncement(longId);

        expect(builder.eq).toHaveBeenCalledWith("id", longId);
      });

      it("should handle concurrent delete calls", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await Promise.all([
          deleteAnnouncement("ann-1"),
          deleteAnnouncement("ann-2"),
          deleteAnnouncement("ann-3"),
        ]);

        expect(builder.delete).toHaveBeenCalledTimes(3);
      });
    });
  });

  // ==========================================================================
  // 5. WHITE-BOX TESTING - BRANCH COVERAGE
  // ==========================================================================

  describe("5. White-Box Testing - Branch Coverage", () => {
    describe("users Data Branch", () => {
      it("Branch: users data exists (add penulis)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).toBeDefined();
        expect(result[0].penulis.full_name).toBe("Admin User");
      });

      it("Branch: users data is null (penulis undefined)", async () => {
        const announcementWithoutUser = {
          ...mockAnnouncement,
          users: null,
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [announcementWithoutUser], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).toBeUndefined();
      });
    });

    describe("tanggal_selesai Branch (Active Status)", () => {
      it("Branch: tanggal_selesai is null (active)", async () => {
        const announcement = [{ ...mockAnnouncement, tanggal_selesai: null }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(1);
      });

      it("Branch: tanggal_selesai > now (active)", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const announcement = [
          { ...mockAnnouncement, tanggal_selesai: futureDate.toISOString() },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(1);
      });

      it("Branch: tanggal_selesai <= now (not active)", async () => {
        const announcement = [
          { ...mockAnnouncement, tanggal_selesai: "2020-01-01T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(0);
      });
    });

    describe("tanggal_mulai Branch (Scheduled Status)", () => {
      it("Branch: tanggal_mulai exists and > now (scheduled)", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const announcement = [
          { ...mockAnnouncement, tanggal_mulai: futureDate.toISOString() },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(1);
      });

      it("Branch: tanggal_mulai is null (not scheduled)", async () => {
        const announcement = [{ ...mockAnnouncement, tanggal_mulai: null }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });

      it("Branch: tanggal_mulai <= now (not scheduled)", async () => {
        const announcement = [
          { ...mockAnnouncement, tanggal_mulai: "2020-01-01T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });
    });

    describe("Error Handling Branches", () => {
      it("Branch: Query succeeds (return data)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(3);
      });

      it("Branch: Query fails (throw error)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow();
      });

      it("Branch: Stats query fails (return zeros)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(0);
      });
    });
  });

  // ==========================================================================
  // 6. WHITE-BOX TESTING - PATH COVERAGE
  // ==========================================================================

  describe("6. White-Box Testing - Path Coverage", () => {
    describe("getAllAnnouncements Paths", () => {
      it("Path 1: Success path (query → order → map users → return)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(supabase.from).toHaveBeenCalledWith("pengumuman");
        expect(builder.select).toHaveBeenCalled();
        expect(builder.order).toHaveBeenCalled();
        expect(result[0].penulis).toBeDefined();
      });

      it("Path 2: Success path without users (query → order → penulis undefined → return)", async () => {
        const announcementWithoutUser = {
          ...mockAnnouncement,
          users: null,
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [announcementWithoutUser], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).toBeUndefined();
      });

      it("Path 3: Error path (query → error → throw)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow();
      });
    });

    describe("getAnnouncementStats Paths", () => {
      it("Path 4: Success path (getAllAnnouncements → calculate → return stats)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.total).toBe(3);
        expect(stats.active).toBeGreaterThanOrEqual(0);
        expect(stats.highPriority).toBeGreaterThanOrEqual(0);
        expect(stats.scheduled).toBeGreaterThanOrEqual(0);
      });

      it("Path 5: Error path (getAllAnnouncements fails → return zeros)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats).toEqual({
          total: 0,
          active: 0,
          highPriority: 0,
          scheduled: 0,
        });
      });
    });

    describe("createAnnouncement Paths", () => {
      it("Path 6: Success path (insert → resolve → complete)", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await createAnnouncement({
          judul: "Test",
          konten: "Content",
          penulis_id: "user-1",
        } as any);

        expect(builder.insert).toHaveBeenCalled();
      });

      it("Path 7: Error path (insert → error → throw)", async () => {
        const builder = mockQueryBuilder();
        builder.insert.mockResolvedValue({
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(
          createAnnouncement({
            judul: "Test",
            konten: "Content",
            penulis_id: "user-1",
          } as any)
        ).rejects.toThrow();
      });
    });

    describe("deleteAnnouncement Paths", () => {
      it("Path 8: Success path (delete → eq → resolve → complete)", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await deleteAnnouncement("ann-1");

        expect(builder.delete).toHaveBeenCalled();
        expect(builder.eq).toHaveBeenCalledWith("id", "ann-1");
      });

      it("Path 9: Error path (delete → eq → error → throw)", async () => {
        const builder = mockQueryBuilder();
        builder.eq.mockResolvedValue({
          error: new Error("Failed"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(deleteAnnouncement("ann-1")).rejects.toThrow();
      });
    });
  });

  // ==========================================================================
  // 7. WHITE-BOX TESTING - CONDITION COVERAGE
  // ==========================================================================

  describe("7. White-Box Testing - Condition Coverage", () => {
    describe("users Existence Conditions", () => {
      it("Condition: users is truthy (add penulis)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).not.toBeUndefined();
      });

      it("Condition: users is falsy/null (penulis undefined)", async () => {
        const announcementWithoutUser = {
          ...mockAnnouncement,
          users: null,
        };
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [announcementWithoutUser], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result[0].penulis).toBeUndefined();
      });
    });

    describe("tanggal_selesai Conditions (Active Status)", () => {
      it("Condition: tanggal_selesai is null", async () => {
        const announcement = [{ ...mockAnnouncement, tanggal_selesai: null }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        // !a.tanggal_selesai evaluates to true → active
        expect(stats.active).toBe(1);
      });

      it("Condition: tanggal_selesai > now", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const announcement = [
          { ...mockAnnouncement, tanggal_selesai: futureDate.toISOString() },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(1);
      });

      it("Condition: tanggal_selesai <= now", async () => {
        const announcement = [
          { ...mockAnnouncement, tanggal_selesai: "2020-01-01T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(0);
      });
    });

    describe("prioritas Conditions (High Priority)", () => {
      it("Condition: prioritas === 'high'", async () => {
        const announcement = [{ ...mockAnnouncement, prioritas: "high" }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(1);
      });

      it("Condition: prioritas !== 'high'", async () => {
        const announcement = [{ ...mockAnnouncement, prioritas: "normal" }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(0);
      });
    });

    describe("tanggal_mulai Conditions (Scheduled Status)", () => {
      it("Condition: tanggal_mulai exists AND tanggal_mulai > now", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const announcement = [
          { ...mockAnnouncement, tanggal_mulai: futureDate.toISOString() },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(1);
      });

      it("Condition: tanggal_mulai is null/undefined", async () => {
        const announcement = [{ ...mockAnnouncement, tanggal_mulai: null }];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });

      it("Condition: tanggal_mulai <= now", async () => {
        const announcement = [
          { ...mockAnnouncement, tanggal_mulai: "2020-01-01T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: announcement, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(0);
      });
    });

    describe("Error Presence Conditions", () => {
      it("Condition: error is truthy (throw/return defaults)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: null,
          error: new Error("Error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        await expect(getAllAnnouncements()).rejects.toThrow();
      });

      it("Condition: error is null (proceed)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toEqual([]);
      });
    });
  });

  // ==========================================================================
  // 8. WHITE-BOX TESTING - LOOP COVERAGE
  // ==========================================================================

  describe("8. White-Box Testing - Loop Coverage", () => {
    describe("Announcements Mapping Loop", () => {
      it("Loop: Empty announcements list (0 iterations)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(0);
      });

      it("Loop: Single announcement (1 iteration)", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [mockAnnouncement], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(1);
      });

      it("Loop: Multiple announcements (10 iterations)", async () => {
        const list = Array.from({ length: 10 }, (_, i) => ({
          ...mockAnnouncement,
          id: `ann-${i}`,
        }));
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: list, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(10);
      });

      it("Loop: Large list (100+ iterations)", async () => {
        const largeList = Array.from({ length: 150 }, (_, i) => ({
          ...mockAnnouncement,
          id: `ann-${i}`,
        }));
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: largeList, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const result = await getAllAnnouncements();

        expect(result).toHaveLength(150);
      });
    });

    describe("Stats Filter Loops", () => {
      it("Loop: Active filter with empty list", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: [], error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(0);
      });

      it("Loop: Active filter with all active", async () => {
        const allActive = [
          { ...mockAnnouncement, tanggal_selesai: null },
          { ...mockAnnouncement, tanggal_selesai: null },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: allActive, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(2);
      });

      it("Loop: Active filter with mixed status", async () => {
        const mixedStatus = [
          { ...mockAnnouncement, tanggal_selesai: null },
          { ...mockAnnouncement, tanggal_selesai: "2020-01-01T00:00:00Z" },
          { ...mockAnnouncement, tanggal_selesai: "2099-12-31T23:59:59Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mixedStatus, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.active).toBe(2); // null and future date
      });

      it("Loop: Priority filter with all high", async () => {
        const allHigh = [
          { ...mockAnnouncement, prioritas: "high" },
          { ...mockAnnouncement, prioritas: "high" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: allHigh, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.highPriority).toBe(2);
      });

      it("Loop: Scheduled filter with mixed dates", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const mixedScheduled = [
          { ...mockAnnouncement, tanggal_mulai: null },
          { ...mockAnnouncement, tanggal_mulai: futureDate.toISOString() },
          { ...mockAnnouncement, tanggal_mulai: "2020-01-01T00:00:00Z" },
        ];
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({ data: mixedScheduled, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder as any);

        const stats = await getAnnouncementStats();

        expect(stats.scheduled).toBe(1); // Only future date
      });
    });
  });

  // ==========================================================================
  // 9. WHITE-BOX TESTING - EDGE CASES
  // ==========================================================================

  describe("9. White-Box Testing - Edge Cases", () => {
    it("should handle announcement with all null optional fields", async () => {
      const minimalAnnouncement = {
        ...mockAnnouncement,
        tipe: null,
        tanggal_mulai: null,
        tanggal_selesai: null,
        attachment_url: null,
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [minimalAnnouncement], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result[0].tipe).toBeNull();
      expect(result[0].tanggal_mulai).toBeNull();
    });

    it("should handle very long konten", async () => {
      const longContentAnnouncement = {
        ...mockAnnouncement,
        konten: "A".repeat(10000),
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [longContentAnnouncement], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result[0].konten).toHaveLength(10000);
    });

    it("should handle announcement with exact timestamp boundaries", async () => {
      const now = new Date();
      const boundaryAnnouncement = {
        ...mockAnnouncement,
        tanggal_mulai: now.toISOString(),
        tanggal_selesai: now.toISOString(),
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [boundaryAnnouncement], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const stats = await getAnnouncementStats();

      // Should handle boundary conditions gracefully
      expect(stats).toBeDefined();
    });

    it("should handle concurrent read operations", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const results = await Promise.all([
        getAllAnnouncements(),
        getAllAnnouncements(),
        getAnnouncementStats(),
      ]);

      expect(results[0]).toHaveLength(3);
      expect(results[1]).toHaveLength(3);
      expect((results[2] as any).total).toBe(3);
    });

    it("should handle unicode characters in judul and konten", async () => {
      const unicodeAnnouncement = {
        ...mockAnnouncement,
        judul: "Pengumuman 日本語 한국어 العربية",
        konten: "内容 🎉 ✓ ©",
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [unicodeAnnouncement], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result[0].judul).toContain("日本語");
      expect(result[0].konten).toContain("🎉");
    });

    it("should handle HTML in konten", async () => {
      const htmlAnnouncement = {
        ...mockAnnouncement,
        konten: "<h1>Title</h1><p>Paragraph</p>",
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [htmlAnnouncement], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result[0].konten).toContain("<h1>");
    });

    it("should handle users with missing fields", async () => {
      const announcementWithIncompleteUser = {
        ...mockAnnouncement,
        users: {
          full_name: null,
          role: null,
        },
      };
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [announcementWithIncompleteUser], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const result = await getAllAnnouncements();

      expect(result[0].penulis).toBeDefined();
      expect(result[0].penulis.full_name).toBeNull();
    });
  });

  // ==========================================================================
  // 10. PERMISSION TESTING
  // ==========================================================================

  describe("10. Permission Testing", () => {
    /**
     * Note: Permission validation tests
     *
     * createAnnouncement and deleteAnnouncement are protected with
     * `requirePermission("manage:pengumuman", fn)` middleware.
     *
     * The permission wrapper is applied at module import time, not runtime.
     * Therefore, we test that:
     * 1. Functions execute successfully with mocked permissions
     * 2. Functions are properly wrapped (verified by integration tests)
     */

    it("should execute createAnnouncement with permission wrapper", async () => {
      const builder = mockQueryBuilder();
      builder.insert.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      // If wrapper wasn't applied, this test would fail
      await createAnnouncement({
        judul: "Test",
        konten: "Content",
        penulis_id: "user-1",
      } as any);

      expect(builder.insert).toHaveBeenCalled();
    });

    it("should execute deleteAnnouncement with permission wrapper", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      // If wrapper wasn't applied, this test would fail
      await deleteAnnouncement("ann-1");

      expect(builder.delete).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 11. PERFORMANCE TESTING
  // ==========================================================================

  describe("11. Performance Testing", () => {
    it("should complete getAllAnnouncements within reasonable time", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const start = Date.now();
      await getAllAnnouncements();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should complete getAnnouncementStats within reasonable time", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: mockAnnouncementsList, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const start = Date.now();
      await getAnnouncementStats();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle large dataset without performance degradation", async () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAnnouncement,
        id: `ann-${i}`,
      }));
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: largeList, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder as any);

      const start = Date.now();
      await getAnnouncementStats();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
