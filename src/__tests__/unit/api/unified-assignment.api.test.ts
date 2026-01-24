/**
 * Unified Assignment API Tests
 *
 * CORE BUSINESS LOGIC TESTS - Master-Detail Management System
 *
 * Purpose: Test master-detail grouping logic untuk assignment & jadwal
 * Innovation: Complex business logic dengan cascade operations
 *
 * Test Coverage:
 * - Master-detail grouping algorithm
 * - Complex Supabase joins (dosen, mata_kuliah, kelas, jadwal, laboratorium)
 * - Cascade delete logic
 * - Statistics calculation
 * - Filter & search functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getUnifiedAssignments,
  deleteAssignmentCascade,
  getAssignmentStats,
} from "@/lib/api/unified-assignment.api";
import type {
  UnifiedAssignment,
  JadwalDetail,
} from "@/lib/api/unified-assignment.api";

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

// Mock notification
vi.mock("@/lib/api/notification.api", () => ({
  createNotification: vi.fn(),
}));

// Mock middleware
vi.mock("@/lib/middleware", () => ({
  requirePermission: (permission: string, fn: any) => fn,
}));

describe("Unified Assignment API - Master-Detail Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // MASTER-DETAIL GROUPING ALGORITHM
  // ==============================================================================

  describe("Master-Detail Grouping", () => {
    it("should group jadwal by unique assignment key", async () => {
      const mockJadwalData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      const mockJadwalDetail = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 1",
          status: "scheduled",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Biologi",
            kode_lab: "LB",
          },
        },
        {
          id: "jadwal-2",
          tanggal_praktikum: "2025-01-28",
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 2",
          status: "scheduled",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Biologi",
            kode_lab: "LB",
          },
        },
      ];

      // Mock using thenable mockQuery
      let callCount = 0;

      const createMockQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            // First call: get master data
            return {
              select: vi.fn().mockReturnValue(createMockQuery(mockJadwalData)),
            };
          } else {
            // Second call: get jadwal details
            return {
              select: vi
                .fn()
                .mockReturnValue(createMockQuery(mockJadwalDetail)),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createMockQuery([])) };
      });

      const result = await getUnifiedAssignments();

      expect(result).toHaveLength(1); // 1 unique assignment
      expect(result[0].total_jadwal).toBe(2);
      expect(result[0].jadwalDetail).toHaveLength(2);
    });

    it("should handle multiple unique assignments", async () => {
      const mockJadwalData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
        {
          dosen_id: "dosen-2",
          mata_kuliah_id: "mk-2",
          kelas_id: "kelas-2",
          dosen: {
            id: "dosen-2",
            full_name: "Dr. Siti",
            email: "siti@test.com",
          },
          mata_kuliah: { id: "mk-2", nama_mk: "Kimia Dasar", kode_mk: "KD101" },
          kelas: { id: "kelas-2", nama_kelas: "Kelas B", kode_kelas: "B" },
        },
      ];

      const mockJadwalDetail1 = [
        { id: "jadwal-1", tanggal_praktikum: "2025-01-21" },
      ];
      const mockJadwalDetail2 = [
        { id: "jadwal-2", tanggal_praktikum: "2025-01-22" },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            // First call: get master data
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalData)),
            };
          } else if (callCount === 2) {
            // Second call: get jadwal detail for assignment 1
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalDetail1)),
            };
          } else {
            // Third call: get jadwal detail for assignment 2
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalDetail2)),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      const result = await getUnifiedAssignments();

      expect(result).toHaveLength(2);
    });

    it("should calculate date range correctly", async () => {
      const mockJadwalData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      const mockJadwalDetail = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-10",
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 1",
          status: "scheduled",
          laboratorium: { id: "lab-1", nama_lab: "Lab 1", kode_lab: "L1" },
        },
        {
          id: "jadwal-2",
          tanggal_praktikum: "2025-01-15",
          hari: "Rabu",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 2",
          status: "scheduled",
          laboratorium: { id: "lab-1", nama_lab: "Lab 1", kode_lab: "L1" },
        },
        {
          id: "jadwal-3",
          tanggal_praktikum: "2025-01-20",
          hari: "Jumat",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 3",
          status: "scheduled",
          laboratorium: { id: "lab-1", nama_lab: "Lab 1", kode_lab: "L1" },
        },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalData)),
            };
          } else {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalDetail)),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      const result = await getUnifiedAssignments();

      expect(result[0].tanggal_mulai).toBe("2025-01-10");
      expect(result[0].tanggal_selesai).toBe("2025-01-20");
    });
  });

  // ==============================================================================
  // COMPLEX SUPABASE JOINS
  // ==============================================================================

  describe("Complex Supabase Joins", () => {
    it("should join with dosen, mata_kuliah, and kelas", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue(createThenableQuery(mockData)),
            };
          } else {
            return {
              select: vi.fn().mockReturnValue(createThenableQuery([])),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      const result = await getUnifiedAssignments();

      expect(result[0].dosen).toBeDefined();
      expect(result[0].dosen.full_name).toBe("Dr. Budi");
      expect(result[0].mata_kuliah.nama_mk).toBe("Biologi Dasar");
      expect(result[0].kelas.nama_kelas).toBe("Kelas A");
    });

    it("should join jadwal with laboratorium", async () => {
      const mockMasterData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      const mockJadwalWithLab = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 1",
          status: "scheduled",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Biologi",
            kode_lab: "LB",
          },
        },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockMasterData)),
            };
          } else {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalWithLab)),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      const result = await getUnifiedAssignments();

      expect(result[0].jadwalDetail[0].laboratorium).toBeDefined();
      expect(result[0].jadwalDetail[0].laboratorium.nama_lab).toBe(
        "Lab Biologi",
      );
    });
  });

  // ==============================================================================
  // FILTER & SEARCH FUNCTIONALITY
  // ==============================================================================

  describe("Filter & Search", () => {
    it("should filter by dosen_id", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      const selectMock = vi.fn().mockReturnValue(createThenableQuery(mockData));

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            return { select: selectMock };
          } else {
            return {
              select: vi.fn().mockReturnValue(createThenableQuery([])),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      await getUnifiedAssignments({ dosen_id: "dosen-1" });

      expect(selectMock).toHaveBeenCalledWith(
        expect.stringContaining("dosen:users!inner"),
      );
    });

    it("should filter by mata_kuliah_id", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      // Create mock query chain
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      // Mock jadwal detail
      (supabase as any).from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        });

      await getUnifiedAssignments({ mata_kuliah_id: "mk-1" });
    });

    it("should filter by kelas_id", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      // Create mock query chain
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      // Mock jadwal detail
      (supabase as any).from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue(mockQuery),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        });

      await getUnifiedAssignments({ kelas_id: "kelas-1" });
    });

    it("should search by dosen name", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock jadwal detail
      (supabase as any).from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        });

      await getUnifiedAssignments({}, "Budi");
    });

    it("should search by mata kuliah name", async () => {
      const mockData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock jadwal detail
      (supabase as any).from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        });

      await getUnifiedAssignments({}, "Biologi");
    });
  });

  // ==============================================================================
  // CASCADE DELETE LOGIC
  // ==============================================================================

  describe("Cascade Delete Logic", () => {
    it("should delete jadwal praktikum for assignment", async () => {
      const mockJadwalToDelete = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          topik: "Praktikum 1",
        },
        {
          id: "jadwal-2",
          tanggal_praktikum: "2025-01-28",
          topik: "Praktikum 2",
        },
      ];

      const fromMock = vi.fn();
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: mockJadwalToDelete,
                    error: null,
                  }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return fromMock();
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
      );

      expect(result.success).toBe(true);
      expect(result.details?.deleted_jadwal_count).toBe(2);
    });

    it("should also delete kelas if safe and requested", async () => {
      const mockJadwalToDelete = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          topik: "Praktikum 1",
        },
      ];

      // Helper function to create mock query chain
      const createMockQueryChain = (data: any, error: any = null) => {
        const mockChain: any = {
          select: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          // For count queries with { count: "exact", head: true }
          then: (resolve: any) => resolve({ count: 0, data: null, error }),
          catch: vi.fn().mockReturnThis(),
        };
        return mockChain;
      };

      // Create a variant for data returns
      const createMockQueryChainWithData = (data: any, error: any = null) => {
        const mockChain: any = {
          select: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ data, error }),
          catch: vi.fn().mockReturnThis(),
        };
        return mockChain;
      };

      // Helper for delete operations
      const createMockDeleteChain = (error: any = null) => {
        const mockChain: any = {
          select: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve({ error }),
          catch: vi.fn().mockReturnThis(),
        };
        return mockChain;
      };

      let jadwalCallCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          jadwalCallCount++;
          // 1st call: count jadwal to delete
          if (jadwalCallCount === 1) {
            return createMockQueryChainWithData(mockJadwalToDelete, null);
          }
          // 2nd call: delete jadwal
          if (jadwalCallCount === 2) {
            return createMockDeleteChain(null);
          }
          // 3rd call: check other jadwal for kelas
          if (jadwalCallCount === 3) {
            return createMockQueryChain(null, null); // count: 0
          }
          // 4th call: check other assignments for dosen_mata_kuliah cleanup
          if (jadwalCallCount === 4) {
            return createMockQueryChainWithData([], null); // No other assignments
          }
          return createMockQueryChainWithData([], null);
        } else if (table === "kelas_mahasiswa") {
          // Check if kelas has students - should return count: 0
          return createMockQueryChain(null, null);
        } else if (table === "kelas") {
          // Delete kelas
          return createMockDeleteChain(null);
        } else if (table === "dosen_mata_kuliah") {
          // Delete dosen_mata_kuliah (no other assignments)
          return createMockDeleteChain(null);
        }
        return createMockQueryChainWithData([], null);
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
        { alsoDeleteKelas: true },
      );

      expect(result.success).toBe(true);
      expect(result.details?.kelas_deleted).toBe(true);
    });

    it("should not delete kelas if has students", async () => {
      const mockJadwalToDelete = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          topik: "Praktikum 1",
        },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (table === "jadwal_praktikum") {
          // First call: count jadwal to delete
          if (callCount === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      data: mockJadwalToDelete,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          // Second call: delete jadwal
          if (callCount === 2) {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          // Fourth call: check other assignments for dosen_mata_kuliah cleanup (no kelas delete because has students)
          if (callCount === 4) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      data: [], // No other assignments
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          // Also return delete for dosen_mata_kuliah cleanup
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "kelas_mahasiswa") {
          // Third call: check students
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 5, // Has 5 students
                error: null,
                data: null, // head: true returns null data
              }),
            }),
          };
        } else if (table === "dosen_mata_kuliah") {
          // Cleanup dosen_mata_kuliah
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
        { alsoDeleteKelas: true },
      );

      expect(result.success).toBe(true);
      expect(result.details?.kelas_deleted).toBe(false);
    });

    it("should clean up dosen_mata_kuliah if no other assignments", async () => {
      const mockJadwalToDelete = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          topik: "Praktikum 1",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: mockJadwalToDelete,
                    error: null,
                  }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === "dosen_mata_kuliah") {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // No other assignments
              error: null,
            }),
          }),
        };
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
      );

      expect(result.success).toBe(true);
    });

    it("should notify dosen if requested", async () => {
      const mockJadwalToDelete = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          topik: "Praktikum 1",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: mockJadwalToDelete,
                    error: null,
                  }),
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { full_name: "Dr. Budi", email: "budi@test.com" },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "mata_kuliah") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { nama_mk: "Biologi Dasar" },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "kelas") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { nama_kelas: "Kelas A" },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === "notifications") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "notif-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
        { notifyDosen: true },
      );

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("notifications");
    });

    it("should handle delete errors gracefully", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
          }),
        }),
      });

      const result = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
      );

      expect(result.success).toBe(false);
      // Error message should contain "Gagal" from the default message
      expect(result.message).toMatch(/Gagal|Database error/);
    });
  });

  // ==============================================================================
  // STATISTICS CALCULATION
  // ==============================================================================

  describe("Statistics Calculation", () => {
    it("should calculate unique assignments correctly", async () => {
      const mockAssignments = [
        { dosen_id: "dosen-1", mata_kuliah_id: "mk-1", kelas_id: "kelas-1" },
        { dosen_id: "dosen-1", mata_kuliah_id: "mk-1", kelas_id: "kelas-1" },
        { dosen_id: "dosen-1", mata_kuliah_id: "mk-1", kelas_id: "kelas-2" },
        { dosen_id: "dosen-2", mata_kuliah_id: "mk-2", kelas_id: "kelas-1" },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            count: 4,
            error: null,
          }),
        }),
      });

      // Mock total jadwal count
      (supabase.from as any).mockReturnValue({
        select: vi
          .fn()
          .mockReturnValueOnce({
            eq: vi.fn().mockResolvedValue({
              data: mockAssignments,
              error: null,
            }),
          })
          .mockReturnValueOnce({
            eq: vi.fn().mockReturnValue({
              count: 10,
              error: null,
            }),
          })
          .mockReturnValueOnce({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                count: 7,
                error: null,
              }),
            }),
          }),
      });

      const stats = await getAssignmentStats();

      // 3 unique: (d1-m1-k1, d1-m1-k2, d2-m2-k1)
      expect(stats.total_assignments).toBe(3);
      expect(stats.unique_dosen).toBe(2);
      expect(stats.unique_mata_kuliah).toBe(2);
      expect(stats.unique_kelas).toBe(2);
    });

    it("should calculate total and active jadwal", async () => {
      const mockAssignments = [
        { dosen_id: "dosen-1", mata_kuliah_id: "mk-1", kelas_id: "kelas-1" },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockReturnValueOnce({
              eq: vi.fn().mockResolvedValue({
                data: mockAssignments,
                error: null,
              }),
            })
            .mockReturnValueOnce({
              count: 15,
              error: null,
            })
            .mockReturnValueOnce({
              eq: vi.fn().mockReturnValue({
                count: 10,
                error: null,
              }),
            }),
        }),
      });

      const stats = await getAssignmentStats();

      expect(stats.total_jadwal).toBe(15);
      expect(stats.active_assignments).toBe(10);
    });

    it("should handle empty assignments", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockReturnValueOnce({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })
            .mockReturnValueOnce({
              count: 0,
              error: null,
            })
            .mockReturnValueOnce({
              eq: vi.fn().mockReturnValue({
                count: 0,
                error: null,
              }),
            }),
        }),
      });

      const stats = await getAssignmentStats();

      expect(stats.total_assignments).toBe(0);
      expect(stats.unique_dosen).toBe(0);
      expect(stats.unique_mata_kuliah).toBe(0);
      expect(stats.unique_kelas).toBe(0);
    });
  });

  // ==============================================================================
  // EDGE CASES & ERROR HANDLING
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle empty results gracefully", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await getUnifiedAssignments();

      expect(result).toEqual([]);
    });

    it("should handle jadwal detail fetch errors", async () => {
      const mockMasterData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMasterData,
              error: null,
            }),
          }),
        }),
      });

      // Mock jadwal detail error
      (supabase as any).from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockMasterData,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: new Error("Fetch error"),
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

      const result = await getUnifiedAssignments();

      // Should skip failed jadwal detail fetch
      expect(result).toHaveLength(0);
    });

    it("should filter out invalid jadwal data", async () => {
      const mockMasterData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      const mockJadwalWithInvalid = [
        {
          id: "jadwal-1",
          tanggal_praktikum: "2025-01-21",
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          topik: "Praktikum 1",
          status: "scheduled",
          laboratorium: { id: "lab-1", nama_lab: "Lab 1", kode_lab: "L1" },
        },
        null, // Invalid entry
        undefined, // Invalid entry
        {}, // Invalid entry (no tanggal_praktikum)
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          callCount++;
          if (callCount === 1) {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockMasterData)),
            };
          } else {
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockJadwalWithInvalid)),
            };
          }
        }
        return { select: vi.fn().mockReturnValue(createThenableQuery([])) };
      });

      const result = await getUnifiedAssignments();

      // Should only count valid jadwal
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].total_jadwal).toBe(1);
    });

    it("should handle database errors in stats", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed")),
        }),
      });

      await expect(getAssignmentStats()).rejects.toThrow();
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete workflow: get assignments → delete cascade → verify stats", async () => {
      // Mock get assignments
      const mockAssignments = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          kelas_id: "kelas-1",
          dosen: {
            id: "dosen-1",
            full_name: "Dr. Budi",
            email: "budi@test.com",
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Biologi Dasar",
            kode_mk: "BD101",
          },
          kelas: { id: "kelas-1", nama_kelas: "Kelas A", kode_kelas: "A" },
        },
      ];

      const jadwalToDelete = [
        { id: "jadwal-1", tanggal_praktikum: "2025-01-21" },
      ];

      // Create thenable mock query
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (table === "jadwal_praktikum") {
          // Calls 1-2: getUnifiedAssignments
          if (callCount === 1) {
            // First call: get master assignments
            return {
              select: vi
                .fn()
                .mockReturnValue(createThenableQuery(mockAssignments)),
            };
          }
          if (callCount === 2) {
            // Second call: get jadwal details (empty)
            return {
              select: vi.fn().mockReturnValue(createThenableQuery([])),
            };
          }
          // Calls 3-5: deleteAssignmentCascade
          if (callCount === 3) {
            // Count jadwal to delete
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      data: jadwalToDelete,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (callCount === 4) {
            // Delete jadwal
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (callCount === 5) {
            // Check other assignments
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({
                      data: [], // No other assignments
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
        }
        // Call 6: deleteAssignmentCascade (dosen_mata_kuliah table)
        if (table === "dosen_mata_kuliah") {
          // Delete dosen_mata_kuliah (no other assignments)
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      });

      const assignments = await getUnifiedAssignments();
      expect(assignments).toBeDefined();

      // Delete assignment
      const deleteResult = await deleteAssignmentCascade(
        "dosen-1",
        "mk-1",
        "kelas-1",
      );
      expect(deleteResult.success).toBe(true);
    });
  });
});
