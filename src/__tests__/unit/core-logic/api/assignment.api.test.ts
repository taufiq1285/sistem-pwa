/**
 * Assignment API Tests
 *
 * Purpose: Test assignment tracking & statistics
 * Features:
 * - Get all assignments with complex filters
 * - Assignment statistics & summary
 * - Helper functions for dropdown data
 * - Academic assignments CRUD operations
 *
 * Test Coverage:
 * - getAllAssignments: Query from jadwal_praktikum with transformations
 * - getAssignmentSummary: Group by dosen
 * - getAssignmentStats: Calculate statistics
 * - getAllDosen: Get dosen list for filters
 * - getAllMataKuliah: Get mata kuliah list for filters
 * - getAllKelasForFilter: Get kelas list for filters
 * - getAcademicAssignments: Query from kelas table
 * - getAcademicAssignmentStats: Stats from kelas table
 * - createAcademicAssignment: Create assignment
 * - updateAcademicAssignment: Update assignment
 * - clearAcademicAssignment: Remove assignment
 * - toggleKelasStatus: Toggle active status
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getAllAssignments,
  getAssignmentSummary,
  getAssignmentStats,
  getAllDosen,
  getAllMataKuliah,
  getAllKelasForFilter,
  getAcademicAssignments,
  getAcademicAssignmentStats,
  createAcademicAssignment,
  updateAcademicAssignment,
  clearAcademicAssignment,
  toggleKelasStatus,
} from "@/lib/api/assignment.api";
import type {
  DosenAssignmentTracking,
  AssignmentFilters,
  DosenAssignmentSummary,
  AssignmentStats,
} from "@/types/assignment.types";

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
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Helper function to create mock query chain
function createMockQueryChain(data: any, error: any = null) {
  // Create chainable mock object - all methods return this object
  const mockChain: any = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    csv: vi.fn().mockResolvedValue({ data, error }),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    // Make the whole chain thenable so it can be awaited
    // The .then() method needs to actually call the resolve callback
    then: (resolve: any) => resolve({ data, error }),
    catch: vi.fn().mockReturnThis(),
  };

  return mockChain;
}

describe("Assignment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth getUser to return admin user
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "test-user", role: "admin" } },
      error: null,
    });

    // Mock supabase.from with smart implementation
    (supabase.from as any).mockImplementation((table: string) => {
      // Mock for user role query (from middleware)
      if (table === "users") {
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
          data: { role: "admin" },
          error: null,
        });
        return {
          select: vi.fn().mockReturnValue({
            eq: mockEq,
            single: mockSingle,
          }),
        };
      }

      // Default mock for other tables - will be overridden in individual tests
      return createMockQueryChain([]);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // GET ALL ASSIGNMENTS
  // ==============================================================================

  describe("getAllAssignments", () => {
    it("should get all assignments and transform data correctly", async () => {
      // Mock raw data from Supabase (nested structure as returned by query)
      const mockRawData = [
        {
          id: "jadwal-1",
          hari: "senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          tanggal_praktikum: "2025-01-21",
          minggu_ke: 1,
          topik: "Pendahuluan",
          status: "approved",
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Komputer 1",
            kode_lab: "LK-1",
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            dosen: {
              id: "dosen-1",
              nip: "12345",
              users: {
                id: "user-1",
                full_name: "Dr. Budi",
                email: "budi@example.com",
              },
            },
            mata_kuliah: {
              id: "mk-1",
              nama_mk: "Kebidanan Dasar",
              kode_mk: "KD-101",
              sks: 3,
            },
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Kebidanan Dasar",
            kode_mk: "KD-101",
            sks: 3,
          },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            users: {
              id: "user-1",
              full_name: "Dr. Budi",
              email: "budi@example.com",
            },
          },
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockRawData, null);
        }

        if (table === "kelas_mahasiswa") {
          return createMockQueryChain([], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllAssignments();

      expect(result).toHaveLength(1);

      // Verify transformed structure (flat structure)
      expect(result[0]).toMatchObject({
        jadwal_id: "jadwal-1",
        jadwal_hari: "senin",
        jadwal_jam_mulai: "08:00",
        jadwal_jam_selesai: "10:00",
        jadwal_status: "approved",
        jadwal_is_active: true,
        laboratorium_id: "lab-1",
        laboratorium_nama: "Lab Komputer 1",
        kelas_id: "kelas-1",
        kelas_nama: "Kelas A",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        dosen_id: "dosen-1",
        dosen_name: "Dr. Budi",
        dosen_email: "budi@example.com",
        dosen_nip: "12345",
        mata_kuliah_id: "mk-1",
        mata_kuliah_nama: "Kebidanan Dasar",
        mata_kuliah_kode: "KD-101",
        mata_kuliah_sks: 3,
        mahasiswa_count: 0,
      });
    });

    it("should filter by status active", async () => {
      const filters: AssignmentFilters = {
        status: "active",
      };

      const mockJadwalChain = createMockQueryChain([], null);
      const jadwalFrom = (supabase.from as any).mockImplementation(
        (table: string) => {
          if (table === "users") {
            const mockChain = {
              eq: vi.fn(),
              single: vi.fn(),
            };
            mockChain.eq.mockReturnValue(mockChain);
            mockChain.single.mockResolvedValue({
              data: { role: "admin" },
              error: null,
            });
            return {
              select: vi.fn().mockReturnValue(mockChain),
            };
          }

          if (table === "jadwal_praktikum") {
            return mockJadwalChain;
          }

          return createMockQueryChain([]);
        },
      );

      await getAllAssignments(filters);

      expect(supabase.from).toHaveBeenCalledWith("jadwal_praktikum");
      expect(mockJadwalChain.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should filter by status inactive", async () => {
      const filters: AssignmentFilters = {
        status: "inactive",
      };

      const mockJadwalChain = createMockQueryChain([], null);
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "jadwal_praktikum") {
          return mockJadwalChain;
        }

        return createMockQueryChain([]);
      });

      await getAllAssignments(filters);

      expect(mockJadwalChain.eq).toHaveBeenCalledWith("is_active", false);
    });

    it("should handle empty assignments", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain([], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllAssignments();

      expect(result).toEqual([]);
    });

    it("should handle search filter", async () => {
      const mockRawData = [
        {
          id: "jadwal-1",
          hari: "senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          status: "approved",
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Komputer 1",
            kode_lab: "LK-1",
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            dosen: {
              id: "dosen-1",
              nip: "12345",
              users: {
                id: "user-1",
                full_name: "Dr. Budi",
                email: "budi@example.com",
              },
            },
            mata_kuliah: {
              id: "mk-1",
              nama_mk: "Kebidanan Dasar",
              kode_mk: "KD-101",
              sks: 3,
            },
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Kebidanan Dasar",
            kode_mk: "KD-101",
            sks: 3,
          },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            users: {
              id: "user-1",
              full_name: "Dr. Budi",
              email: "budi@example.com",
            },
          },
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
        },
        {
          id: "jadwal-2",
          hari: "selasa",
          jam_mulai: "10:00",
          jam_selesai: "12:00",
          status: "approved",
          is_active: true,
          dosen_id: "dosen-2",
          mata_kuliah_id: "mk-2",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Komputer 1",
            kode_lab: "LK-1",
          },
          kelas: {
            id: "kelas-2",
            nama_kelas: "Kelas B",
            kode_kelas: "B",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            dosen: {
              id: "dosen-2",
              nip: "67890",
              users: {
                id: "user-2",
                full_name: "Dr. Siti",
                email: "siti@example.com",
              },
            },
            mata_kuliah: {
              id: "mk-2",
              nama_mk: "Anatomi Dasar",
              kode_mk: "AD-101",
              sks: 4,
            },
          },
          mata_kuliah: {
            id: "mk-2",
            nama_mk: "Anatomi Dasar",
            kode_mk: "AD-101",
            sks: 4,
          },
          dosen: {
            id: "dosen-2",
            nip: "67890",
            users: {
              id: "user-2",
              full_name: "Dr. Siti",
              email: "siti@example.com",
            },
          },
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockRawData, null);
        }

        if (table === "kelas_mahasiswa") {
          return createMockQueryChain([], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllAssignments({ search: "Budi" });

      // Should only return Dr. Budi's assignment
      expect(result).toHaveLength(1);
      expect(result[0].dosen_name).toBe("Dr. Budi");
    });
  });

  // ==============================================================================
  // ASSIGNMENT SUMMARY
  // ==============================================================================

  describe("getAssignmentSummary", () => {
    it("should get assignment summary grouped by dosen", async () => {
      const mockRawData = [
        {
          id: "jadwal-1",
          hari: "senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          status: "approved",
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          laboratorium: {
            id: "lab-1",
            nama_lab: "Lab Komputer 1",
            kode_lab: "LK-1",
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            dosen: {
              id: "dosen-1",
              nip: "12345",
              users: {
                id: "user-1",
                full_name: "Dr. Budi",
                email: "budi@example.com",
              },
            },
            mata_kuliah: {
              id: "mk-1",
              nama_mk: "Kebidanan Dasar",
              kode_mk: "KD-101",
              sks: 3,
            },
          },
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Kebidanan Dasar",
            kode_mk: "KD-101",
            sks: 3,
          },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            users: {
              id: "user-1",
              full_name: "Dr. Budi",
              email: "budi@example.com",
            },
          },
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockRawData, null);
        }

        if (table === "kelas_mahasiswa") {
          return createMockQueryChain([], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAssignmentSummary();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        dosen_id: "dosen-1",
        dosen_name: "Dr. Budi",
        dosen_email: "budi@example.com",
        dosen_nip: "12345",
        total_jadwal: 1,
        total_kelas: 1,
        total_mata_kuliah: 1,
        total_mahasiswa: 0,
        assignments: expect.any(Array),
      });
    });
  });

  // ==============================================================================
  // ASSIGNMENT STATS
  // ==============================================================================

  describe("getAssignmentStats", () => {
    it("should calculate assignment statistics", async () => {
      const mockDosenData = [{ id: "dosen-1" }, { id: "dosen-2" }];
      const mockJadwalData = [
        {
          dosen_id: "dosen-1",
          kelas_id: "kelas-1",
          kelas: { mata_kuliah_id: "mk-1" },
        },
      ];
      const mockKelasData = [{ id: "kelas-1" }, { id: "kelas-2" }];

      const mockJadwalChain = createMockQueryChain(mockJadwalData, null);
      const mockKelasChain = createMockQueryChain(mockKelasData, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "dosen") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockDosenData,
              error: null,
            }),
          };
        }

        if (table === "jadwal_praktikum") {
          return mockJadwalChain;
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await getAssignmentStats();

      expect(result).toMatchObject({
        total_dosen_aktif: 2,
        dosen_dengan_jadwal: expect.any(Number),
        dosen_tanpa_jadwal: expect.any(Number),
        total_kelas: 2,
        kelas_dengan_jadwal: expect.any(Number),
        kelas_tanpa_jadwal: expect.any(Number),
        total_jadwal_aktif: expect.any(Number),
        total_mata_kuliah_diajarkan: expect.any(Number),
      });
    });
  });

  // ==============================================================================
  // HELPER FUNCTIONS - DROPDOWN DATA
  // ==============================================================================

  describe("getAllDosen", () => {
    it("should get all dosen for filters", async () => {
      const mockDosenData = [
        {
          id: "dosen-1",
          nip: "12345",
          users: {
            id: "user-1",
            full_name: "Dr. Budi",
            email: "budi@example.com",
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "dosen") {
          return createMockQueryChain(mockDosenData, null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllDosen();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "dosen-1",
        user_id: "user-1",
        full_name: "Dr. Budi",
        email: "budi@example.com",
        nip: "12345",
        is_active: true,
      });
    });
  });

  describe("getAllMataKuliah", () => {
    it("should get all mata kuliah for filters", async () => {
      const mockMataKuliahData = [
        {
          id: "mk-1",
          nama_mk: "Kebidanan Dasar",
          kode_mk: "KD-101",
          sks: 3,
          is_active: true,
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "mata_kuliah") {
          return createMockQueryChain(mockMataKuliahData, null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllMataKuliah();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "mk-1",
        nama_mk: "Kebidanan Dasar",
        kode_mk: "KD-101",
        sks: 3,
        is_active: true,
      });
    });
  });

  describe("getAllKelasForFilter", () => {
    it("should get all kelas for filters", async () => {
      const mockKelasData = [
        {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          is_active: true,
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return createMockQueryChain(mockKelasData, null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllKelasForFilter();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "kelas-1",
        nama_kelas: "Kelas A",
        kode_kelas: "A",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        is_active: true,
      });
    });
  });

  // ==============================================================================
  // ACADEMIC ASSIGNMENTS
  // ==============================================================================

  describe("getAcademicAssignments", () => {
    it("should get academic assignments from kelas table", async () => {
      const mockKelasData = [
        {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          catatan: "Test",
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
          mata_kuliah: {
            id: "mk-1",
            nama_mk: "Kebidanan Dasar",
            kode_mk: "KD-101",
            sks: 3,
          },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            users: {
              id: "user-1",
              full_name: "Dr. Budi",
              email: "budi@example.com",
            },
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return createMockQueryChain(mockKelasData, null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAcademicAssignments();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        jadwal_id: "kelas-1",
        kelas_id: "kelas-1",
        kelas_nama: "Kelas A",
        dosen_id: "dosen-1",
        dosen_name: "Dr. Budi",
        mata_kuliah_id: "mk-1",
        mata_kuliah_nama: "Kebidanan Dasar",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        jadwal_status: "assigned",
        jadwal_is_active: true,
      });
    });
  });

  describe("getAcademicAssignmentStats", () => {
    it("should calculate academic assignment statistics", async () => {
      const mockKelasData = [
        {
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          is_active: true,
        },
      ];
      const mockDosenData = [{ id: "dosen-1" }, { id: "dosen-2" }];

      const mockKelasChain = createMockQueryChain(mockKelasData, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        if (table === "dosen") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockDosenData,
              error: null,
            }),
          };
        }

        return createMockQueryChain([]);
      });

      const result = await getAcademicAssignmentStats();

      expect(result).toMatchObject({
        total_dosen_aktif: 2,
        dosen_dengan_jadwal: expect.any(Number),
        dosen_tanpa_jadwal: expect.any(Number),
        total_kelas: expect.any(Number),
        kelas_dengan_jadwal: expect.any(Number),
        kelas_tanpa_jadwal: expect.any(Number),
        total_jadwal_aktif: expect.any(Number),
        total_mata_kuliah_diajarkan: expect.any(Number),
      });
    });
  });

  // ==============================================================================
  // CRUD FUNCTIONS FOR ACADEMIC ASSIGNMENTS
  // ==============================================================================

  describe("createAcademicAssignment", () => {
    it("should create new academic assignment", async () => {
      const mockData = {
        dosen_id: "dosen-1",
        mata_kuliah_id: "mk-1",
        kelas_id: "kelas-1",
        catatan: "Test assignment",
      };

      const mockKelasChain = createMockQueryChain(null, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await createAcademicAssignment(mockData);

      expect(result).toEqual({ success: true });
    });

    it("should handle error when creating assignment", async () => {
      const mockData = {
        dosen_id: "dosen-1",
        mata_kuliah_id: "mk-1",
        kelas_id: "kelas-1",
      };

      const mockKelasChain = createMockQueryChain(null, {
        message: "Database error",
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await createAcademicAssignment(mockData);

      expect(result).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });

  describe("updateAcademicAssignment", () => {
    it("should update academic assignment", async () => {
      const mockData = {
        dosen_id: "dosen-2",
        mata_kuliah_id: "mk-2",
      };

      const mockKelasChain = createMockQueryChain(null, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await updateAcademicAssignment("kelas-1", mockData);

      expect(result).toEqual({ success: true });
    });
  });

  describe("clearAcademicAssignment", () => {
    it("should clear academic assignment", async () => {
      const mockKelasChain = createMockQueryChain(null, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await clearAcademicAssignment("kelas-1");

      expect(result).toEqual({ success: true });
    });
  });

  describe("toggleKelasStatus", () => {
    it("should toggle kelas status to active", async () => {
      const mockKelasChain = createMockQueryChain(null, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await toggleKelasStatus("kelas-1", true);

      expect(result).toEqual({ success: true });
    });

    it("should toggle kelas status to inactive", async () => {
      const mockKelasChain = createMockQueryChain(null, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = {
            eq: vi.fn(),
            single: vi.fn(),
          };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue(mockChain),
          };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await toggleKelasStatus("kelas-1", false);

      expect(result).toEqual({ success: true });
    });
  });

  describe("additional branch coverage", () => {
    it("should apply non-status filters in getAllAssignments", async () => {
      const mockJadwalChain = createMockQueryChain([], null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }

        if (table === "jadwal_praktikum") {
          return mockJadwalChain;
        }

        return createMockQueryChain([]);
      });

      await getAllAssignments({
        hari: "senin" as any,
        laboratorium_id: "lab-1",
      });

      expect(mockJadwalChain.eq).toHaveBeenCalledWith("hari", "senin");
      expect(mockJadwalChain.eq).toHaveBeenCalledWith("laboratorium_id", "lab-1");
    });

    it("should filter getAllAssignments by dosen, kelas, tahun, semester and search", async () => {
      const mockRawData = [
        {
          id: "jadwal-1",
          hari: "senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
          status: "approved",
          is_active: true,
          dosen_id: null,
          mata_kuliah_id: null,
          laboratorium: null,
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "KA",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 1,
            dosen: {
              id: "dosen-1",
              nip: "123",
              users: { id: "user-1", full_name: "Dr. Budi", email: "budi@example.com" },
            },
            mata_kuliah: {
              id: "mk-1",
              nama_mk: "Algoritma",
              kode_mk: "ALG-1",
              sks: 3,
            },
          },
          mata_kuliah: null,
          dosen: null,
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
        },
        {
          id: "jadwal-2",
          hari: "selasa",
          jam_mulai: "10:00",
          jam_selesai: "12:00",
          status: "approved",
          is_active: true,
          dosen_id: "dosen-2",
          mata_kuliah_id: "mk-2",
          laboratorium: null,
          kelas: {
            id: "kelas-2",
            nama_kelas: "Kelas B",
            kode_kelas: "KB",
            tahun_ajaran: "2023/2024",
            semester_ajaran: 2,
            dosen: {
              id: "dosen-2",
              nip: "456",
              users: { id: "user-2", full_name: "Dr. Siti", email: "siti@example.com" },
            },
            mata_kuliah: {
              id: "mk-2",
              nama_mk: "Basis Data",
              kode_mk: "BD-1",
              sks: 2,
            },
          },
          mata_kuliah: {
            id: "mk-2",
            nama_mk: "Basis Data",
            kode_mk: "BD-1",
            sks: 2,
          },
          dosen: {
            id: "dosen-2",
            nip: "456",
            users: { id: "user-2", full_name: "Dr. Siti", email: "siti@example.com" },
          },
          created_at: "2025-01-22T00:00:00Z",
          updated_at: "2025-01-22T00:00:00Z",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockRawData, null);
        }

        if (table === "kelas_mahasiswa") {
          return createMockQueryChain([{ kelas_id: "kelas-1" }], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllAssignments({
        dosen_id: "dosen-1",
        mata_kuliah_id: "mk-1",
        kelas_id: "kelas-1",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        search: "algoritma",
      });

      expect(result).toHaveLength(1);
      expect(result[0].dosen_name).toBe("Dr. Budi");
      expect(result[0].mahasiswa_count).toBe(1);
    });

    it("should keep assignment with placeholder values when dosen and mata kuliah are missing", async () => {
      const mockRawData = [
        {
          id: "jadwal-admin",
          hari: "rabu",
          jam_mulai: "13:00",
          jam_selesai: "15:00",
          status: "draft",
          is_active: false,
          dosen_id: null,
          mata_kuliah_id: null,
          laboratorium: null,
          kelas: {
            id: "kelas-admin",
            nama_kelas: "Kelas Admin",
            kode_kelas: "ADM",
            tahun_ajaran: "2024/2025",
            semester_ajaran: 2,
            dosen: null,
            mata_kuliah: null,
          },
          mata_kuliah: null,
          dosen: null,
          created_at: "2025-01-23T00:00:00Z",
          updated_at: "2025-01-23T00:00:00Z",
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }

        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockRawData, null);
        }

        if (table === "kelas_mahasiswa") {
          return createMockQueryChain([], null);
        }

        return createMockQueryChain([]);
      });

      const result = await getAllAssignments();

      expect(result).toHaveLength(1);
      expect(result[0].dosen_name).toBe("Belum ada dosen");
      expect(result[0].mata_kuliah_nama).toBe("Belum ada mata kuliah");
      expect(result[0].mata_kuliah_kode).toBe("-");
    });

    it("should apply filters in getAcademicAssignments including status and search", async () => {
      const mockKelasData = [
        {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "KA",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
          mata_kuliah: { id: "mk-1", nama_mk: "Algoritma", kode_mk: "ALG-1", sks: 3 },
          dosen: {
            id: "dosen-1",
            nip: "123",
            users: { id: "user-1", full_name: "Dr. Budi", email: "budi@example.com" },
          },
        },
        {
          id: "kelas-2",
          nama_kelas: "Kelas B",
          kode_kelas: "KB",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 2,
          is_active: false,
          dosen_id: "dosen-2",
          mata_kuliah_id: "mk-2",
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
          mata_kuliah: { id: "mk-2", nama_mk: "Basis Data", kode_mk: "BD-1", sks: 2 },
          dosen: {
            id: "dosen-2",
            nip: "456",
            users: { id: "user-2", full_name: "Dr. Siti", email: "siti@example.com" },
          },
        },
      ];

      const mockKelasChain = createMockQueryChain(mockKelasData, null);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }

        if (table === "kelas") {
          return mockKelasChain;
        }

        return createMockQueryChain([]);
      });

      const result = await getAcademicAssignments({
        dosen_id: "dosen-1",
        mata_kuliah_id: "mk-1",
        kelas_id: "kelas-1",
        tahun_ajaran: "2024/2025",
        semester_ajaran: 1,
        status: "active",
        search: "alg",
      });

      expect(mockKelasChain.eq).toHaveBeenCalledWith("dosen_id", "dosen-1");
      expect(mockKelasChain.eq).toHaveBeenCalledWith("mata_kuliah_id", "mk-1");
      expect(mockKelasChain.eq).toHaveBeenCalledWith("kelas_id", "kelas-1");
      expect(mockKelasChain.eq).toHaveBeenCalledWith("is_active", true);
      expect(result).toHaveLength(1);
      expect(result[0].kelas_kode).toBe("KA");
    });

    it("should handle update, clear, and toggle errors", async () => {
      const makeErrorChain = (message: string) => createMockQueryChain(null, { message });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }

        if (table === "kelas") {
          return makeErrorChain("write failed");
        }

        return createMockQueryChain([]);
      });

      await expect(updateAcademicAssignment("kelas-1", { catatan: "x" })).resolves.toEqual({
        success: false,
        error: "write failed",
      });
      await expect(clearAcademicAssignment("kelas-1")).resolves.toEqual({
        success: false,
        error: "write failed",
      });
      await expect(toggleKelasStatus("kelas-1", true)).resolves.toEqual({
        success: false,
        error: "write failed",
      });
    });
  });

  // ==============================================================================
  // ERROR HANDLERS - getAllDosen, getAllMataKuliah, getAllKelasForFilter, getAcademicAssignments
  // ==============================================================================

  describe("getAllDosen error handling", () => {
    it("should throw when supabase returns error (lines 475-477)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "dosen") {
          return createMockQueryChain(null, { message: "dosen fetch error" });
        }
        return createMockQueryChain([]);
      });

      await expect(getAllDosen()).rejects.toThrow("Failed to fetch dosen: dosen fetch error");
    });
  });

  describe("getAllMataKuliah error handling", () => {
    it("should throw when supabase returns error (lines 502-504)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "mata_kuliah") {
          return createMockQueryChain(null, { message: "mk fetch error" });
        }
        return createMockQueryChain([]);
      });

      await expect(getAllMataKuliah()).rejects.toThrow("Failed to fetch mata kuliah: mk fetch error");
    });
  });

  describe("getAllKelasForFilter error handling", () => {
    it("should throw when supabase returns error (lines 529-531)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return createMockQueryChain(null, { message: "kelas fetch error" });
        }
        return createMockQueryChain([]);
      });

      await expect(getAllKelasForFilter()).rejects.toThrow("Failed to fetch kelas: kelas fetch error");
    });
  });

  describe("getAcademicAssignments error handling", () => {
    it("should throw when supabase returns error (lines 616-618)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return createMockQueryChain(null, { message: "academic fetch error" });
        }
        return createMockQueryChain([]);
      });

      await expect(getAcademicAssignments()).rejects.toThrow("Failed to fetch academic assignments: academic fetch error");
    });

    it("should filter by kelas_kode when searching (lines 776-778)", async () => {
      const mockKelasData = [
        {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "KA-001",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          is_active: true,
          dosen_id: "dosen-1",
          mata_kuliah_id: "mk-1",
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
          mata_kuliah: { id: "mk-1", nama_mk: "Algoritma", kode_mk: "ALG-1", sks: 3 },
          dosen: {
            id: "dosen-1",
            nip: "123",
            users: { id: "user-1", full_name: "Dr. Budi", email: "budi@example.com" },
          },
        },
        {
          id: "kelas-2",
          nama_kelas: "Kelas B",
          kode_kelas: "KB-002",
          tahun_ajaran: "2024/2025",
          semester_ajaran: 1,
          is_active: true,
          dosen_id: "dosen-2",
          mata_kuliah_id: "mk-2",
          created_at: "2025-01-21T00:00:00Z",
          updated_at: "2025-01-21T00:00:00Z",
          mata_kuliah: { id: "mk-2", nama_mk: "Basis Data", kode_mk: "BD-1", sks: 2 },
          dosen: {
            id: "dosen-2",
            nip: "456",
            users: { id: "user-2", full_name: "Dr. Siti", email: "siti@example.com" },
          },
        },
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return createMockQueryChain(mockKelasData, null);
        }
        return createMockQueryChain([]);
      });

      // Search by kode_kelas - should match "KA-001"
      const result = await getAcademicAssignments({ search: "ka-001" });

      expect(result).toHaveLength(1);
      expect(result[0].kelas_kode).toBe("KA-001");
    });
  });

  describe("getAssignmentStats kelas.dosen_id branch", () => {
    it("should count dosen from kelas.dosen_id when jadwal.dosen_id is null (lines 395-396)", async () => {
      const mockDosenData = [{ id: "dosen-1" }, { id: "dosen-2" }];
      // jadwal tanpa dosen_id, tapi kelas punya dosen_id
      const mockJadwalData = [
        { dosen_id: null, kelas: { dosen_id: "dosen-1" } },
        { dosen_id: null, kelas: { dosen_id: "dosen-2" } },
      ];
      const mockKelasData = [{ id: "kelas-1" }];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "dosen") {
          return { select: vi.fn().mockResolvedValue({ data: mockDosenData, error: null }) };
        }
        if (table === "jadwal_praktikum") {
          return createMockQueryChain(mockJadwalData, null);
        }
        if (table === "kelas") {
          return createMockQueryChain(mockKelasData, null);
        }
        return createMockQueryChain([]);
      });

      const result = await getAssignmentStats();

      // dosen_dengan_jadwal should be 2 (from kelas.dosen_id)
      expect(result.dosen_dengan_jadwal).toBe(2);
    });
  });

  describe("CRUD catch block coverage", () => {
    it("should handle thrown exception in createAcademicAssignment (lines 866-868)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockRejectedValue(new Error("unexpected crash")),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const result = await createAcademicAssignment({
        dosen_id: "d1",
        mata_kuliah_id: "mk1",
        kelas_id: "k1",
      });

      expect(result).toEqual({ success: false, error: "unexpected crash" });
    });

    it("should handle thrown exception in updateAcademicAssignment (lines 909-911)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockRejectedValue(new Error("update crash")),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const result = await updateAcademicAssignment("kelas-1", { dosen_id: "d1" });

      expect(result).toEqual({ success: false, error: "update crash" });
    });

    it("should handle thrown exception in clearAcademicAssignment (lines 943-945)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockRejectedValue(new Error("clear crash")),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const result = await clearAcademicAssignment("kelas-1");

      expect(result).toEqual({ success: false, error: "clear crash" });
    });

    it("should handle thrown exception in toggleKelasStatus (lines 976-978)", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockChain = { eq: vi.fn(), single: vi.fn() };
          mockChain.eq.mockReturnValue(mockChain);
          mockChain.single.mockResolvedValue({ data: { role: "admin" }, error: null });
          return { select: vi.fn().mockReturnValue(mockChain) };
        }
        if (table === "kelas") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockRejectedValue(new Error("toggle crash")),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const result = await toggleKelasStatus("kelas-1", true);

      expect(result).toEqual({ success: false, error: "toggle crash" });
    });
  });

  // ==============================================================================
  // ERROR HANDLING
  // ==============================================================================

  describe("Error Handling", () => {
    it("should handle database connection error", async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi
        .fn()
        .mockRejectedValue(new Error("Connection timeout"));

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockEq = vi.fn().mockReturnThis();
          const mockSingle = vi.fn().mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
              single: mockSingle,
            }),
          };
        }

        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
              order: mockOrder,
            }),
          };
        }

        return createMockQueryChain([]);
      });

      await expect(getAllAssignments()).rejects.toThrow("Connection timeout");
    });

    it("should handle Supabase error", async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Supabase error" },
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          const mockEq = vi.fn().mockReturnThis();
          const mockSingle = vi.fn().mockResolvedValue({
            data: { role: "admin" },
            error: null,
          });
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
              single: mockSingle,
            }),
          };
        }

        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
              order: mockOrder,
            }),
          };
        }

        return createMockQueryChain([]);
      });

      await expect(getAllAssignments()).rejects.toThrow(
        "Failed to fetch assignments",
      );
    });
  });
});
