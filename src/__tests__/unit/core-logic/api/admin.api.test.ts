/**
 * Admin API Unit Tests
 * Comprehensive tests for admin dashboard and analytics functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as adminAPI from "@/lib/api/admin.api";
import { supabase } from "@/lib/supabase/client";

// Mock Supabase
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
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock cache API
vi.mock("@/lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

// Mock middleware
vi.mock("@/lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn((permission, fn) => fn),
}));

describe("Admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getDashboardStats", () => {
    it("should return dashboard statistics successfully", async () => {
      const mockUsers = [
        { role: "mahasiswa", is_active: true },
        { role: "mahasiswa", is_active: false },
        { role: "dosen", is_active: true },
        { role: "laboran", is_active: true },
        { role: "admin", is_active: true },
      ];

      const mockLabs = [
        { id: "1", is_active: true },
        { id: "2", is_active: true },
        { id: "3", is_active: false },
      ];

      const mockEquipment = [
        { id: "1", is_available_for_borrowing: true },
        { id: "2", is_available_for_borrowing: true },
        { id: "3", is_available_for_borrowing: false },
      ];

      const mockPending = [{ id: "1" }, { id: "2" }];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              data: mockUsers,
              error: null,
            }),
          } as any;
        }
        if (table === "laboratorium") {
          return {
            select: vi.fn().mockReturnValue({
              data: mockLabs,
              error: null,
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              data: mockEquipment,
              error: null,
            }),
          } as any;
        }
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: mockPending,
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await adminAPI.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 5,
        totalMahasiswa: 2,
        totalDosen: 1,
        totalLaboran: 1,
        totalLaboratorium: 2,
        totalPeralatan: 3,
        pendingApprovals: 2,
        activeUsers: 4,
      });
    });

    it("should handle empty data gracefully", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          // peminjaman needs .select().eq() chain
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        }
        // Other tables only need .select()
        return {
          select: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        } as any;
      });

      const result = await adminAPI.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 0,
        totalMahasiswa: 0,
        totalDosen: 0,
        totalLaboran: 0,
        totalLaboratorium: 0,
        totalPeralatan: 0,
        pendingApprovals: 0,
        activeUsers: 0,
      });
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnValue({
              data: null,
              error: new Error("Database error"),
            }),
          }) as any,
      );

      await expect(adminAPI.getDashboardStats()).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle null data from database", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          // peminjaman needs .select().eq() chain
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: null,
                error: null,
              }),
            }),
          } as any;
        }
        // Other tables only need .select()
        return {
          select: vi.fn().mockReturnValue({
            data: null,
            error: null,
          }),
        } as any;
      });

      const result = await adminAPI.getDashboardStats();

      expect(result.totalUsers).toBe(0);
    });
  });

  describe("getUserGrowth", () => {
    it("should return user growth data for last 6 months", async () => {
      const now = new Date();
      const mockUsers = [
        {
          created_at: new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          ).toISOString(),
        },
        {
          created_at: new Date(
            now.getFullYear(),
            now.getMonth(),
            15,
          ).toISOString(),
        },
        {
          created_at: new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            10,
          ).toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockUsers,
            error: null,
          }),
        }),
      } as any);

      const result = await adminAPI.getUserGrowth();

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("users");
    });

    it("should initialize all months with zero users", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await adminAPI.getUserGrowth();

      expect(result).toHaveLength(6);
      result.forEach((item: { users: any }) => {
        expect(item.users).toBe(0);
      });
    });

    it("should handle users without created_at", async () => {
      const mockUsers = [{ created_at: null }, { created_at: undefined }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockUsers,
            error: null,
          }),
        }),
      } as any);

      const result = await adminAPI.getUserGrowth();

      expect(result).toHaveLength(6);
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: null,
            error: new Error("Database error"),
          }),
        }),
      } as any);

      await expect(adminAPI.getUserGrowth()).rejects.toThrow("Database error");
    });
  });

  describe("getUserDistribution", () => {
    it("should return user distribution by role", async () => {
      const mockUsers = [
        { role: "mahasiswa" },
        { role: "mahasiswa" },
        { role: "mahasiswa" },
        { role: "dosen" },
        { role: "laboran" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: mockUsers,
          error: null,
        }),
      } as any);

      const result = await adminAPI.getUserDistribution();

      expect(result).toHaveLength(3);

      const mahasiswaData = result.find(
        (r: { role: string }) => r.role === "Mahasiswa",
      );
      expect(mahasiswaData).toBeDefined();
      expect(mahasiswaData?.count).toBe(3);
      expect(mahasiswaData?.percentage).toBe(60);
    });

    it("should capitalize role names", async () => {
      const mockUsers = [{ role: "mahasiswa" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: mockUsers,
          error: null,
        }),
      } as any);

      const result = await adminAPI.getUserDistribution();

      expect(result[0].role).toBe("Mahasiswa");
    });

    it("should handle empty data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await adminAPI.getUserDistribution();

      expect(result).toEqual([]);
    });

    it("should calculate percentage correctly", async () => {
      const mockUsers = [{ role: "mahasiswa" }, { role: "dosen" }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: mockUsers,
          error: null,
        }),
      } as any);

      const result = await adminAPI.getUserDistribution();

      result.forEach((item: { percentage: any }) => {
        expect(item.percentage).toBe(50);
      });
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: null,
          error: new Error("Database error"),
        }),
      } as any);

      await expect(adminAPI.getUserDistribution()).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getLabUsage", () => {
    it("should return lab usage data", async () => {
      const mockLabs = [
        { nama_lab: "Lab 1", kode_lab: "L1" },
        { nama_lab: "Lab 2", kode_lab: "L2" },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            data: mockLabs,
            error: null,
          }),
        }),
      } as any);

      const result = await adminAPI.getLabUsage();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("lab");
      expect(result[0]).toHaveProperty("usage");
      expect(result[0].usage).toBeGreaterThanOrEqual(10);
      expect(result[0].usage).toBeLessThanOrEqual(60);
    });

    it("should limit to 5 labs", async () => {
      const mockLabs = Array.from({ length: 10 }, (_, i) => ({
        nama_lab: `Lab ${i}`,
        kode_lab: `L${i}`,
      }));

      const limitMock = vi.fn().mockReturnValue({
        data: mockLabs.slice(0, 5),
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: limitMock,
        }),
      } as any);

      await adminAPI.getLabUsage();

      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it("should handle empty lab data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await adminAPI.getLabUsage();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            data: null,
            error: new Error("Database error"),
          }),
        }),
      } as any);

      await expect(adminAPI.getLabUsage()).rejects.toThrow("Database error");
    });
  });

  describe("getRecentUsers", () => {
    it("should return recent users with default limit", async () => {
      const mockUsers = [
        {
          id: "1",
          full_name: "User 1",
          email: "user1@example.com",
          role: "mahasiswa",
          created_at: "2024-01-01",
        },
        {
          id: "2",
          full_name: "User 2",
          email: "user2@example.com",
          role: "dosen",
          created_at: "2024-01-02",
        },
      ];

      const limitMock = vi.fn().mockReturnValue({
        data: mockUsers,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockUsers[0]);
      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it("should accept custom limit parameter", async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        full_name: `User ${i}`,
        email: `user${i}@example.com`,
        role: "mahasiswa",
        created_at: "2024-01-01",
      }));

      const limitMock = vi.fn().mockReturnValue({
        data: mockUsers,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      await adminAPI.getRecentUsers(10);

      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it("should handle users without created_at", async () => {
      const mockUsers = [
        {
          id: "1",
          full_name: "User 1",
          email: "user1@example.com",
          role: "mahasiswa",
          created_at: null,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: mockUsers,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentUsers();

      expect(result[0].created_at).toBe("");
    });

    it("should handle empty data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentUsers();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      } as any);

      await expect(adminAPI.getRecentUsers()).rejects.toThrow("Database error");
    });
  });

  describe("getRecentAnnouncements", () => {
    it("should return recent announcements with author names", async () => {
      const mockAnnouncements = [
        {
          id: "1",
          judul: "Announcement 1",
          created_at: "2024-01-01",
          penulis_id: "user1",
          users: { full_name: "Author 1" },
        },
        {
          id: "2",
          judul: "Announcement 2",
          created_at: "2024-01-02",
          penulis_id: "user2",
          users: { full_name: "Author 2" },
        },
      ];

      const limitMock = vi.fn().mockReturnValue({
        data: mockAnnouncements,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentAnnouncements();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "1",
        title: "Announcement 1",
        created_at: "2024-01-01",
        author: "Author 1",
      });
      expect(limitMock).toHaveBeenCalledWith(5);
    });

    it("should handle announcements with null users", async () => {
      const mockAnnouncements = [
        {
          id: "1",
          judul: "Announcement 1",
          created_at: "2024-01-01",
          penulis_id: "user1",
          users: null,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: mockAnnouncements,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentAnnouncements();

      expect(result[0].author).toBe("Unknown");
    });

    it("should accept custom limit parameter", async () => {
      const limitMock = vi.fn().mockReturnValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      await adminAPI.getRecentAnnouncements(10);

      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it("should handle empty data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await adminAPI.getRecentAnnouncements();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      } as any);

      await expect(adminAPI.getRecentAnnouncements()).rejects.toThrow(
        "Database error",
      );
    });
  });
});
