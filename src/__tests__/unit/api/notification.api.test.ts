/**
 * Notification API Tests
 *
 * CORE UTILITY TESTS - Auto-Notification System
 *
 * Purpose: Test notification system dengan best-effort approach
 * Innovation: Auto-notification untuk workflow akademik
 *
 * Test Coverage:
 * - CRUD operations untuk notifications
 * - Batch operations (bulk create)
 * - Auto-notification helpers (tugas submitted, graded, etc.)
 * - Best-effort error handling (no blocking)
 * - Filter & search functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getNotifications,
  getUnreadCount,
  getNotificationSummary,
  createNotification,
  createBulkNotifications,
  markAsRead,
  markAllAsRead,
  updateNotification,
  deleteNotification,
  deleteReadNotifications,
  notifyDosenTugasSubmitted,
  notifyMahasiswaTugasBaru,
  notifyMahasiswaTugasGraded,
  notifyMahasiswaDosenChanged,
  notifyDosenNewAssignment,
  notifyDosenRemoval,
} from "@/lib/api/notification.api";
import type {
  Notification,
  NotificationSummary,
} from "@/types/notification.types";

// Mock supabase client
const createMockQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    abortSignal: vi.fn().mockReturnThis(),
    // Add rpc method for functions
    rpc: vi.fn(),
  };
  return mockQuery;
};

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createMockQuery()),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })),
        createSignedUrl: vi.fn(() => ({ data: { signedUrl: "" } })),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
  },
}));

// Mock error handler
vi.mock("@/lib/utils/errors", () => ({
  handleError: (error: any) => error,
  logError: vi.fn(),
}));

// Mock cacheAPI to bypass caching in tests
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fetcher) => fetcher()),
  clearAllCache: vi.fn(),
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
}));

describe("Notification API - Auto-Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // QUERY OPERATIONS
  // ==============================================================================

  describe("Query Operations", () => {
    it("should get notifications with filters", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "user-1",
          title: "Tugas Baru",
          message: "Ada tugas baru",
          type: "tugas_baru",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
        {
          id: "notif-2",
          user_id: "user-1",
          title: "Tugas Dinilai",
          message: "Tugas Anda dinilai",
          type: "tugas_graded",
          data: {},
          is_read: true,
          read_at: "2025-01-21T09:00:00Z",
          created_at: "2025-01-21T09:00:00Z",
        },
      ];

      // Create thenable mock query for proper chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery(mockNotifications);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getNotifications({ user_id: "user-1" });

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe("tugas_baru");
    });

    it("should filter by is_read status", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "user-1",
          title: "Tugas Baru",
          message: "Ada tugas baru",
          type: "tugas_baru",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      // Create thenable mock query for proper chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery(mockNotifications);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getNotifications({
        user_id: "user-1",
        is_read: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].is_read).toBe(false);
    });

    it("should filter by type", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "user-1",
          title: "Tugas Baru",
          message: "Ada tugas baru",
          type: "tugas_baru",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      // Create thenable mock query for proper chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery(mockNotifications);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getNotifications({
        user_id: "user-1",
        type: "tugas_baru",
      });

      expect(result).toHaveLength(1);
    });

    it("should limit results", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "user-1",
          title: "Tugas 1",
          message: "Tugas 1",
          type: "other",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      // Create thenable mock query for proper chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery(mockNotifications);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getNotifications({
        user_id: "user-1",
        limit: 10,
      });

      expect(result).toHaveLength(1);
    });

    it("should get unread count", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 5,
              error: null,
            }),
          }),
        }),
      });

      const result = await getUnreadCount("user-1");

      expect(result).toBe(5);
    });

    it("should return 0 if no unread notifications", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await getUnreadCount("user-1");

      expect(result).toBe(0);
    });

    it("should get notification summary", async () => {
      const mockData = [
        { type: "tugas_baru", is_read: false },
        { type: "tugas_baru", is_read: false },
        { type: "tugas_graded", is_read: true },
        { type: "tugas_baru", is_read: true },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const result = await getNotificationSummary("user-1");

      expect(result.total).toBe(4);
      expect(result.unread).toBe(2);
      expect(result.by_type.tugas_baru).toBe(3);
      expect(result.by_type.tugas_graded).toBe(1);
    });
  });

  // ==============================================================================
  // CREATE OPERATIONS
  // ==============================================================================

  describe("Create Operations", () => {
    it("should create single notification", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Tugas Baru",
        message: "Ada tugas baru",
        type: "tugas_baru",
        data: { kuis_id: "kuis-1" },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await createNotification({
        user_id: "user-1",
        title: "Tugas Baru",
        message: "Ada tugas baru",
        type: "tugas_baru",
        data: { kuis_id: "kuis-1" },
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe("notif-1");
    });

    it("should return null on create error (best-effort)", async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Insert failed" },
            }),
          }),
        }),
      });

      const result = await createNotification({
        user_id: "user-1",
        title: "Test",
        message: "Test",
        type: "tugas_baru",
      });

      expect(result).toBeNull();
    });

    it("should create bulk notifications", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "user-1",
          title: "Tugas Baru",
          message: "Tugas 1",
          type: "tugas_baru",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
        {
          id: "notif-2",
          user_id: "user-2",
          title: "Tugas Baru",
          message: "Tugas 1",
          type: "tugas_baru",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
          }),
        }),
      });

      const result = await createBulkNotifications([
        {
          user_id: "user-1",
          title: "Tugas Baru",
          message: "Tugas 1",
          type: "tugas_baru",
        },
        {
          user_id: "user-2",
          title: "Tugas Baru",
          message: "Tugas 1",
          type: "tugas_baru",
        },
      ]);

      expect(result).toHaveLength(2);
    });

    it("should return empty array on bulk create error", async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Bulk insert failed" },
          }),
        }),
      });

      const result = await createBulkNotifications([
        {
          user_id: "user-1",
          title: "Test",
          message: "Test",
          type: "sistem",
        },
      ]);

      expect(result).toEqual([]);
    });
  });

  // ==============================================================================
  // UPDATE OPERATIONS
  // ==============================================================================

  describe("Update Operations", () => {
    it("should mark notification as read", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Tugas",
        message: "Tugas",
        type: "tugas_graded",
        data: {},
        is_read: true,
        read_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockNotification,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await markAsRead("notif-1");

      expect(result.is_read).toBe(true);
      expect(result.read_at).toBeDefined();
    });

    it("should mark all notifications as read for user", async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      await expect(markAllAsRead("user-1")).resolves.not.toThrow();
    });

    it("should update notification", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Updated Title",
        message: "Updated message",
        type: "tugas_graded",
        data: {},
        is_read: true,
        read_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockNotification,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await updateNotification("notif-1", {
        is_read: true,
        read_at: "2025-01-21T11:00:00Z",
      });

      expect(result.is_read).toBe(true);
      expect(result.read_at).toBe("2025-01-21T11:00:00Z");
    });
  });

  // ==============================================================================
  // DELETE OPERATIONS
  // ==============================================================================

  describe("Delete Operations", () => {
    it("should delete notification", async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(deleteNotification("notif-1")).resolves.not.toThrow();
    });

    it("should delete all read notifications for user", async () => {
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      await expect(deleteReadNotifications("user-1")).resolves.not.toThrow();
    });
  });

  // ==============================================================================
  // AUTO-NOTIFICATION HELPERS
  // ==============================================================================

  describe("Auto-Notification Helpers", () => {
    it("should notify dosen when mahasiswa submits tugas", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "dosen-1",
        title: "Tugas Praktikum Dikerjakan",
        message: "Ahmad telah mengerjakan tugas Biologi",
        type: "tugas_submitted",
        data: {
          attempt_id: "attempt-1",
          kuis_id: "kuis-1",
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await notifyDosenTugasSubmitted(
        "dosen-1",
        "Ahmad",
        "Biologi",
        "attempt-1",
        "kuis-1",
      );

      expect(result).not.toBeNull();
      expect(result?.type).toBe("tugas_submitted");
    });

    it("should notify mahasiswa when dosen creates new tugas", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "mhs-1",
          title: "Tugas Praktikum Baru",
          message: "Dr. Budi telah membuat tugas baru: Biologi",
          type: "tugas_baru",
          data: { kuis_id: "kuis-1", kelas_id: "kelas-1" },
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
        {
          id: "notif-2",
          user_id: "mhs-2",
          title: "Tugas Praktikum Baru",
          message: "Dr. Budi telah membuat tugas baru: Biologi",
          type: "tugas_baru",
          data: { kuis_id: "kuis-1", kelas_id: "kelas-1" },
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
          }),
        }),
      });

      const result = await notifyMahasiswaTugasBaru(
        ["mhs-1", "mhs-2"],
        "Dr. Budi",
        "Biologi",
        "kuis-1",
        "kelas-1",
      );

      expect(result).toHaveLength(2);
    });

    it("should notify mahasiswa when tugas graded", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "mhs-1",
        title: "Tugas Dinilai",
        message: "Tugas Biologi Anda telah dinilai. Nilai: 85",
        type: "tugas_graded",
        data: {
          attempt_id: "attempt-1",
          kuis_id: "kuis-1",
          nilai: 85,
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await notifyMahasiswaTugasGraded(
        "mhs-1",
        "Biologi",
        85,
        "attempt-1",
        "kuis-1",
      );

      expect(result?.data.nilai).toBe(85);
    });

    it("should notify mahasiswa when dosen changed", async () => {
      const mockNotifications: Notification[] = [
        {
          id: "notif-1",
          user_id: "mhs-1",
          title: "Perubahan Dosen",
          message:
            'Kelas "Biologi - A" sekarang diampu oleh Dr. Siti (menggantikan Dr. Budi)',
          type: "dosen_changed",
          data: {
            kelas_id: "kelas-1",
            dosen_lama: "Dr. Budi",
            dosen_baru: "Dr. Siti",
          },
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
          }),
        }),
      });

      const result = await notifyMahasiswaDosenChanged(
        ["mhs-1"],
        "A",
        "Biologi",
        "Dr. Budi",
        "Dr. Siti",
        "kelas-1",
      );

      expect(result).toHaveLength(1);
      expect(result[0].data.dosen_baru).toBe("Dr. Siti");
    });

    it("should notify new dosen when assigned to kelas", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "dosen-1",
        title: "Penugasan Kelas Baru",
        message: "Anda ditugaskan mengajar Biologi - A (30 mahasiswa)",
        type: "dosen_changed",
        data: {
          kelas_id: "kelas-1",
          jumlah_mahasiswa: 30,
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await notifyDosenNewAssignment(
        "dosen-1",
        "A",
        "Biologi",
        30,
        "kelas-1",
      );

      expect(result?.data.jumlah_mahasiswa).toBe(30);
    });

    it("should notify old dosen when removed from kelas", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "dosen-1",
        title: "Perubahan Penugasan Kelas",
        message: "Kelas Biologi - A Anda telah dialihkan ke Dr. Siti",
        type: "dosen_changed",
        data: {
          kelas_id: "kelas-1",
          dosen_pengganti: "Dr. Siti",
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await notifyDosenRemoval(
        "dosen-1",
        "A",
        "Biologi",
        "Dr. Siti",
        "kelas-1",
      );

      expect(result?.data.dosen_pengganti).toBe("Dr. Siti");
    });
  });

  // ==============================================================================
  // BEST-EFFORT ERROR HANDLING
  // ==============================================================================

  describe("Best-Effort Error Handling", () => {
    it("should not throw when create notification fails", async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const result = await createNotification({
        user_id: "user-1",
        title: "Test",
        message: "Test",
        type: "tugas_baru",
      });

      // Should return null instead of throwing
      expect(result).toBeNull();
    });

    it("should not throw when bulk create fails", async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Bulk insert failed" },
          }),
        }),
      });

      const result = await createBulkNotifications([
        {
          user_id: "user-1",
          title: "Test",
          message: "Test",
          type: "sistem",
        },
      ]);

      // Should return empty array instead of throwing
      expect(result).toEqual([]);
    });

    it("should not throw when auto-notification helper fails", async () => {
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Notification failed" },
            }),
          }),
        }),
      });

      const result = await notifyDosenTugasSubmitted(
        "dosen-1",
        "Ahmad",
        "Biologi",
        "attempt-1",
        "kuis-1",
      );

      // Should return null instead of throwing
      expect(result).toBeNull();
    });
  });

  // ==============================================================================
  // EDGE CASES
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle empty notification list", async () => {
      // Create thenable mock query for proper chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery([]);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getNotifications({ user_id: "user-1" });

      expect(result).toEqual([]);
    });

    it("should handle database errors in query", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      await expect(getNotifications({ user_id: "user-1" })).rejects.toThrow();
    });

    it("should handle notification with empty data", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Test",
        message: "Test",
        type: "tugas_baru",
        data: {},
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await createNotification({
        user_id: "user-1",
        title: "Test",
        message: "Test",
        type: "tugas_baru",
      });

      expect(result?.data).toEqual({});
    });

    it("should handle special characters in message", async () => {
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Test <script>",
        message: "Test & test 'quote' \"double\"",
        type: "tugas_baru",
        data: {},
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNotification,
              error: null,
            }),
          }),
        }),
      });

      const result = await createNotification({
        user_id: "user-1",
        title: "Test <script>",
        message: "Test & test 'quote' \"double\"",
        type: "tugas_baru",
      });

      expect(result?.message).toContain("test");
    });

    it("should handle very long mahasiswa list in bulk notification", async () => {
      const mahasiswaIds = Array.from({ length: 100 }, (_, i) => `mhs-${i}`);

      const mockNotifications: Notification[] = mahasiswaIds.map((id) => ({
        id: `notif-${id}`,
        user_id: id,
        title: "Tugas Baru",
        message: "Test",
        type: "tugas_baru",
        data: {},
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      }));

      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: mockNotifications,
            error: null,
          }),
        }),
      });

      const result = await createBulkNotifications(
        mahasiswaIds.map((id) => ({
          user_id: id,
          title: "Tugas Baru",
          message: "Test",
          type: "tugas_baru",
        })),
      );

      expect(result).toHaveLength(100);
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete notification workflow", async () => {
      // 1. Create notification
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "user-1",
        title: "Tugas Baru",
        message: "Ada tugas baru",
        type: "tugas_baru",
        data: {},
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      // 2. Get notifications
      const mockNotifications: Notification[] = [mockNotification];

      // 3. Mark as read
      const mockReadNotification: Notification = {
        ...mockNotification,
        is_read: true,
        read_at: "2025-01-21T11:00:00Z",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Create
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockNotification,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get - use thenable query for proper chaining
          const createThenableQuery = (data: any[]) => ({
            then: (resolve: any) => resolve({ data, error: null }),
            catch: () => ({ data, error: null }),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
          });
          return {
            select: vi
              .fn()
              .mockReturnValue(createThenableQuery(mockNotifications)),
          };
        } else if (callCount === 3) {
          // Mark as read
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockReadNotification,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      // Create
      const created = await createNotification({
        user_id: "user-1",
        title: "Tugas Baru",
        message: "Ada tugas baru",
        type: "tugas_baru",
      });
      expect(created).not.toBeNull();

      // Get
      const notifications = await getNotifications({ user_id: "user-1" });
      expect(notifications).toHaveLength(1);

      // Mark as read
      const updated = await markAsRead("notif-1");
      expect(updated.is_read).toBe(true);
    });

    it("should handle auto-notification after tugas submission", async () => {
      // 1. Mahasiswa submits tugas
      const mockNotification: Notification = {
        id: "notif-1",
        user_id: "dosen-1",
        title: "Tugas Praktikum Dikerjakan",
        message: "Ahmad telah mengerjakan tugas Biologi",
        type: "tugas_submitted",
        data: {
          attempt_id: "attempt-1",
          kuis_id: "kuis-1",
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T10:00:00Z",
      };

      // 2. Dosen grades tugas
      const mockGradedNotification: Notification = {
        id: "notif-2",
        user_id: "mhs-1",
        title: "Tugas Dinilai",
        message: "Tugas Biologi Anda telah dinilai. Nilai: 85",
        type: "tugas_graded",
        data: {
          attempt_id: "attempt-1",
          kuis_id: "kuis-1",
          nilai: 85,
        },
        is_read: false,
        read_at: null,
        created_at: "2025-01-21T11:00:00Z",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockNotification,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockGradedNotification,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      // Notify dosen
      const dosenNotif = await notifyDosenTugasSubmitted(
        "dosen-1",
        "Ahmad",
        "Biologi",
        "attempt-1",
        "kuis-1",
      );
      expect(dosenNotif?.type).toBe("tugas_submitted");

      // Notify mahasiswa
      const mhsNotif = await notifyMahasiswaTugasGraded(
        "mhs-1",
        "Biologi",
        85,
        "attempt-1",
        "kuis-1",
      );
      expect(mhsNotif?.data.nilai).toBe(85);
    });
  });
});
