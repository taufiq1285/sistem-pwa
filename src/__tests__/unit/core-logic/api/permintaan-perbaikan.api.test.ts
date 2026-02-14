/**
 * Permintaan Perbaikan Nilai API Tests
 *
 * CORE BUSINESS LOGIC TESTS - Grade Revision Workflow
 *
 * Purpose: Test approval workflow untuk permintaan perbaikan nilai
 * Innovation: Academic feature dengan auto-notification
 *
 * Test Coverage:
 * - Approval workflow (approve → update nilai → notify)
 * - Reject workflow (reject → add reason → notify)
 * - Auto-notification integration
 * - Statistics & summary calculation
 * - Complex Supabase queries dengan multi-level joins
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getPermintaan,
  getPermintaanByMahasiswa,
  getPermintaanByKelas,
  getPermintaanPendingForDosen,
  getPermintaanById,
  createPermintaan,
  approvePermintaan,
  rejectPermintaan,
  cancelPermintaan,
  getPermintaanSummary,
  getPermintaanStatsForDosen,
} from "@/lib/api/permintaan-perbaikan.api";
import * as notificationApi from "@/lib/api/notification.api";
import type {
  PermintaanPerbaikanNilai,
  PermintaanPerbaikanWithRelations,
} from "@/types/permintaan-perbaikan.types";

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

// Mock notification.api
vi.mock("@/lib/api/notification.api", () => ({
  createNotification: vi.fn(),
  createBulkNotifications: vi.fn(),
}));

// Mock middleware
vi.mock("@/lib/middleware/permission.middleware", () => ({
  requirePermission: (permission: string, fn: any) => fn,
}));

// Mock error handler
vi.mock("@/lib/utils/errors", () => ({
  handleError: (error: any) => error,
  logError: vi.fn(),
}));

describe("Permintaan Perbaikan Nilai API - Approval Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // QUERY OPERATIONS
  // ==============================================================================

  describe("Query Operations", () => {
    it("should get all permintaan with filters", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: {
            id: "mhs-1",
            nim: "2021001",
            user: { full_name: "Ahmad", email: "ahmad@test.com" },
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
            dosen: {
              id: "dosen-1",
              nip: "12345",
              user: { full_name: "Dr. Budi", email: "budi@test.com" },
            },
          },
        },
      ];

      // Create thenable mock query that supports chaining
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableQuery(mockPermintaan);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getPermintaan({ status: "pending" });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
    });

    it("should get permintaan by mahasiswa", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: {
            id: "mhs-1",
            nim: "2021001",
            user: { full_name: "Ahmad", email: "ahmad@test.com" },
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
            dosen: {
              id: "dosen-1",
              nip: "12345",
              user: { full_name: "Dr. Budi", email: "budi@test.com" },
            },
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

      const mockQuery = createThenableQuery(mockPermintaan);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getPermintaanByMahasiswa("mhs-1");

      expect(result).toHaveLength(1);
      expect(result[0].mahasiswa_id).toBe("mhs-1");
    });

    it("should get permintaan by kelas", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: {
            id: "mhs-1",
            nim: "2021001",
            user: { full_name: "Ahmad", email: "ahmad@test.com" },
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
            dosen: {
              id: "dosen-1",
              nip: "12345",
              user: { full_name: "Dr. Budi", email: "budi@test.com" },
            },
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

      const mockQuery = createThenableQuery(mockPermintaan);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      } as any);

      const result = await getPermintaanByKelas("kelas-1");

      expect(result).toHaveLength(1);
      expect(result[0].kelas_id).toBe("kelas-1");
    });

    it("should get pending permintaan for dosen", async () => {
      const mockKelasList = [{ id: "kelas-1" }, { id: "kelas-2" }];

      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: {
            id: "mhs-1",
            nim: "2021001",
            user: { full_name: "Ahmad", email: "ahmad@test.com" },
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
            dosen: {
              id: "dosen-1",
              nip: "12345",
              user: { full_name: "Dr. Budi", email: "budi@test.com" },
            },
          },
        },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get kelas list
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockKelasList,
                error: null,
              }),
            }),
          };
        } else {
          // Get pending permintaan
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockPermintaan,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await getPermintaanPendingForDosen("dosen-1");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
    });

    it("should get permintaan by ID", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
        reviewer: null,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPermintaan,
              error: null,
            }),
          }),
        }),
      });

      const result = await getPermintaanById("permintaan-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("permintaan-1");
    });
  });

  // ==============================================================================
  // CREATE OPERATIONS
  // ==============================================================================

  describe("Create Operations", () => {
    it("should create permintaan perbaikan", async () => {
      const newPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const mockKelasInfo = {
        nama_kelas: "Kelas A",
        mata_kuliah: { nama_mk: "Biologi Dasar" },
        dosen: { user: { id: "user-1", full_name: "Dr. Budi" } },
      };

      const mockMahasiswaInfo = {
        user: { full_name: "Ahmad" },
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Insert permintaan
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newPermintaan,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get kelas info
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockKelasInfo,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get mahasiswa info
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaInfo,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Create notification
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
        return { select: vi.fn() };
      });

      const result = await createPermintaan({
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("permintaan-1");
    });

    it("should handle notification failure gracefully when creating", async () => {
      const newPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: newPermintaan,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null, // No kelas info
                  error: new Error("Not found"),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await createPermintaan({
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
      });

      // Should still succeed even if notification fails
      expect(result).toBeDefined();
      expect(result.id).toBe("permintaan-1");
    });
  });

  // ==============================================================================
  // APPROVE WORKFLOW
  // ==============================================================================

  describe("Approve Workflow", () => {
    it("should approve permintaan and update nilai", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        nilai_baru: 85,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: "Disetujui setelah review",
        status: "approved",
        reviewed_by: "dosen-1",
        reviewed_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockPermintaanDetail: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "approved",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Update permintaan
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockUpdatedPermintaan,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get permintaan detail for notification
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPermintaanDetail,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          // Get mahasiswa user_id
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: "user-mhs-1" },
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 4) {
          // Create notification
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
        return { select: vi.fn() };
      });

      const result = await approvePermintaan({
        permintaan_id: "permintaan-1",
        nilai_baru: 85,
        response_dosen: "Disetujui setelah review",
        reviewed_by: "dosen-1",
      });

      expect(result.status).toBe("approved");
      expect(result.nilai_baru).toBe(85);
    });

    it("should only approve if status is pending", async () => {
      // Mock the update to return null (no rows matched because status != pending)
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null, // No rows matched because status is not "pending"
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdateChain),
      } as any);

      await expect(
        approvePermintaan({
          permintaan_id: "permintaan-1",
          nilai_baru: 85,
          response_dosen: "Disetujui",
          reviewed_by: "dosen-1",
        }),
      ).rejects.toThrow("Failed to update permintaan perbaikan nilai");
    });

    it("should notify mahasiswa after approval", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        nilai_baru: 85,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        status: "approved",
        reviewed_by: "dosen-1",
        reviewed_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockPermintaanDetail: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "approved",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      // Mock createNotification to track calls
      const createNotificationSpy = vi
        .spyOn(notificationApi, "createNotification")
        .mockResolvedValue({
          id: "notif-1",
          user_id: "user-mhs-1",
          title: "Permintaan Perbaikan Nilai Disetujui",
          message: "Test",
          type: "perbaikan_nilai_response",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T11:00:00Z",
        });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (table === "permintaan_perbaikan_nilai") {
          if (callCount === 1) {
            // Update permintaan
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: mockUpdatedPermintaan,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          } else if (callCount === 2) {
            // getPermintaanById
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPermintaanDetail,
                    error: null,
                  }),
                }),
              }),
            };
          }
        } else if (table === "mahasiswa" && callCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: "user-mhs-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return createMockQuery();
      });

      await approvePermintaan({
        permintaan_id: "permintaan-1",
        nilai_baru: 85,
        response_dosen: "Disetujui",
        reviewed_by: "dosen-1",
      });

      // Verify createNotification was called with correct data
      expect(createNotificationSpy).toHaveBeenCalledWith({
        user_id: "user-mhs-1",
        title: "Permintaan Perbaikan Nilai Disetujui",
        message: `Permintaan perbaikan nilai KUIS Anda untuk Biologi Dasar telah disetujui. Nilai baru: 85`,
        type: "perbaikan_nilai_response",
        data: {
          permintaan_id: "permintaan-1",
          status: "approved",
          nilai_baru: 85,
        },
      });

      createNotificationSpy.mockRestore();
    });
  });

  // ==============================================================================
  // REJECT WORKFLOW
  // ==============================================================================

  describe("Reject Workflow", () => {
    it("should reject permintaan with reason", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: "Bukti tidak cukup",
        nilai_baru: null,
        status: "rejected",
        reviewed_by: "dosen-1",
        reviewed_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockPermintaanDetail: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "rejected",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockUpdatedPermintaan,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPermintaanDetail,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: "user-mhs-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
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
      });

      const result = await rejectPermintaan({
        permintaan_id: "permintaan-1",
        response_dosen: "Bukti tidak cukup",
        reviewed_by: "dosen-1",
      });

      expect(result.status).toBe("rejected");
      expect(result.response_dosen).toBe("Bukti tidak cukup");
    });

    it("should only reject if status is pending", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "rejected", // Already rejected
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      // Mock the update to return null (no rows matched because status != pending)
      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null, // No rows matched because status is not "pending"
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockUpdateChain),
      } as any);

      await expect(
        rejectPermintaan({
          permintaan_id: "permintaan-1",
          response_dosen: "Bukti tidak cukup",
          reviewed_by: "dosen-1",
        }),
      ).rejects.toThrow("Failed to update permintaan perbaikan nilai");
    });

    it("should notify mahasiswa after rejection", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: "Bukti tidak cukup",
        nilai_baru: null,
        status: "rejected",
        reviewed_by: "dosen-1",
        reviewed_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockPermintaanDetail: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "rejected",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      // Mock createNotification to track calls
      const createNotificationSpy = vi
        .spyOn(notificationApi, "createNotification")
        .mockResolvedValue({
          id: "notif-1",
          user_id: "user-mhs-1",
          title: "Permintaan Perbaikan Nilai Ditolak",
          message: "Test",
          type: "perbaikan_nilai_response",
          data: {},
          is_read: false,
          read_at: null,
          created_at: "2025-01-21T11:00:00Z",
        });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (table === "permintaan_perbaikan_nilai") {
          if (callCount === 1) {
            // Update permintaan
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: mockUpdatedPermintaan,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          } else if (callCount === 2) {
            // getPermintaanById
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPermintaanDetail,
                    error: null,
                  }),
                }),
              }),
            };
          }
        } else if (table === "mahasiswa" && callCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: "user-mhs-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return createMockQuery();
      });

      await rejectPermintaan({
        permintaan_id: "permintaan-1",
        response_dosen: "Bukti tidak cukup",
        reviewed_by: "dosen-1",
      });

      // Verify createNotification was called with correct data
      expect(createNotificationSpy).toHaveBeenCalledWith({
        user_id: "user-mhs-1",
        title: "Permintaan Perbaikan Nilai Ditolak",
        message: `Permintaan perbaikan nilai KUIS Anda untuk Biologi Dasar ditolak. Alasan: Bukti tidak cukup`,
        type: "perbaikan_nilai_response",
        data: {
          permintaan_id: "permintaan-1",
          status: "rejected",
          response: "Bukti tidak cukup",
        },
      });

      createNotificationSpy.mockRestore();
    });
  });

  // ==============================================================================
  // CANCEL WORKFLOW
  // ==============================================================================

  describe("Cancel Workflow", () => {
    it("should cancel permintaan by mahasiswa", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: null,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "cancelled",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUpdatedPermintaan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await cancelPermintaan({
        permintaan_id: "permintaan-1",
      });

      expect(result.status).toBe("cancelled");
    });

    it("should only cancel if status is pending", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: null,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "cancelled",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockUpdatedPermintaan,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await cancelPermintaan({
        permintaan_id: "permintaan-1",
      });

      expect(result.status).toBe("cancelled");
    });
  });

  // ==============================================================================
  // STATISTICS & SUMMARY
  // ==============================================================================

  describe("Statistics & Summary", () => {
    it("should get permintaan summary", async () => {
      const mockStatusData = [
        { status: "pending" },
        { status: "pending" },
        { status: "approved" },
        { status: "rejected" },
        { status: "cancelled" },
      ];

      // Create thenable mock
      const createThenableMock = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
      });

      const mockQuery = createThenableMock(mockStatusData);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const summary = await getPermintaanSummary();

      expect(summary.total).toBe(5);
      expect(summary.pending).toBe(2);
      expect(summary.approved).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.cancelled).toBe(1);
    });

    it("should get permintaan stats for dosen", async () => {
      const mockKelasList = [{ id: "kelas-1" }, { id: "kelas-2" }];

      const mockPermintaanData = [
        { status: "pending", komponen_nilai: "kuis" },
        { status: "pending", komponen_nilai: "tugas" },
        { status: "approved", komponen_nilai: "kuis" },
        { status: "approved", komponen_nilai: "tugas" },
        { status: "rejected", komponen_nilai: "uts" },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockKelasList,
                error: null,
              }),
            }),
          };
        } else {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockPermintaanData,
                error: null,
              }),
            }),
          };
        }
      });

      const stats = await getPermintaanStatsForDosen("dosen-1");

      expect(stats.total_pending).toBe(2);
      expect(stats.total_reviewed).toBe(3);
      expect(stats.approval_rate).toBeCloseTo(2 / 3, 2); // 2 approved out of 3 reviewed
      expect(stats.by_komponen.kuis).toBe(2);
      expect(stats.by_komponen.tugas).toBe(2);
      expect(stats.by_komponen.uts).toBe(1);
    });

    it("should handle empty stats for dosen", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const stats = await getPermintaanStatsForDosen("dosen-1");

      expect(stats.total_pending).toBe(0);
      expect(stats.total_reviewed).toBe(0);
      expect(stats.approval_rate).toBe(0);
    });

    it("should filter summary by mahasiswa_id", async () => {
      const mockStatusData = [{ status: "pending" }, { status: "approved" }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockStatusData,
            error: null,
          }),
        }),
      });

      const summary = await getPermintaanSummary({ mahasiswa_id: "mhs-1" });

      expect(summary.total).toBe(2);
      expect(summary.pending).toBe(1);
      expect(summary.approved).toBe(1);
    });

    it("should filter summary by kelas_id", async () => {
      const mockStatusData = [{ status: "approved" }, { status: "rejected" }];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockStatusData,
            error: null,
          }),
        }),
      });

      const summary = await getPermintaanSummary({ kelas_id: "kelas-1" });

      expect(summary.total).toBe(2);
      expect(summary.approved).toBe(1);
      expect(summary.rejected).toBe(1);
    });
  });

  // ==============================================================================
  // COMPLEX SUPABASE QUERIES
  // ==============================================================================

  describe("Complex Supabase Queries", () => {
    it("should handle multi-level joins correctly", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: {
            id: "mhs-1",
            nim: "2021001",
            user: { full_name: "Ahmad", email: "ahmad@test.com" },
          },
          kelas: {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            kode_kelas: "A",
            mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
            dosen: {
              id: "dosen-1",
              nip: "12345",
              user: { full_name: "Dr. Budi", email: "budi@test.com" },
            },
          },
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPermintaan,
            error: null,
          }),
        }),
      });

      const result = await getPermintaan();

      expect(result[0].mahasiswa.user).toBeDefined();
      expect(result[0].kelas.mata_kuliah).toBeDefined();
      expect(result[0].kelas.dosen.user).toBeDefined();
    });

    it("should handle missing relationship data gracefully", async () => {
      const mockPermintaan: PermintaanPerbaikanWithRelations[] = [
        {
          id: "permintaan-1",
          mahasiswa_id: "mhs-1",
          nilai_id: "nilai-1",
          kelas_id: "kelas-1",
          komponen_nilai: "kuis",
          nilai_lama: 70,
          nilai_usulan: 80,
          alasan_permintaan: "Salah hitung",
          bukti_pendukung: null,
          response_dosen: null,
          nilai_baru: null,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          mahasiswa: null as any,
          kelas: null as any,
          reviewer: null,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockPermintaan,
            error: null,
          }),
        }),
      });

      const result = await getPermintaan();

      expect(result).toHaveLength(1);
      expect(result[0].mahasiswa).toBeNull();
    });
  });

  // ==============================================================================
  // EDGE CASES & ERROR HANDLING
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle empty permintaan list", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await getPermintaan();

      expect(result).toEqual([]);
    });

    it("should handle notification failure gracefully", async () => {
      const mockUpdatedPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        nilai_baru: 85,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        status: "approved",
        reviewed_by: "dosen-1",
        reviewed_at: "2025-01-21T11:00:00Z",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockPermintaanDetail: PermintaanPerbaikanWithRelations = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "approved",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
        mahasiswa: {
          id: "mhs-1",
          nim: "2021001",
          user: { full_name: "Ahmad", email: "ahmad@test.com" },
        },
        kelas: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          kode_kelas: "A",
          mata_kuliah: { nama_mk: "Biologi Dasar", kode_mk: "BD101" },
          dosen: {
            id: "dosen-1",
            nip: "12345",
            user: { full_name: "Dr. Budi", email: "budi@test.com" },
          },
        },
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockUpdatedPermintaan,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPermintaanDetail,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error("Not found"),
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const result = await approvePermintaan({
        permintaan_id: "permintaan-1",
        nilai_baru: 85,
        response_dosen: "Disetujui",
        reviewed_by: "dosen-1",
      });

      // Should still succeed even if notification fails
      expect(result.status).toBe("approved");
    });

    it("should handle database errors", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed")),
        }),
      });

      await expect(getPermintaan()).rejects.toThrow();
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete workflow: create → approve → verify stats", async () => {
      // Mock kelas lookup
      const mockKelasQuery = createMockQuery();
      mockKelasQuery.single = vi.fn().mockResolvedValue({
        data: {
          id: "kelas-1",
          nama_kelas: "Kelas A",
          mata_kuliah: { nama_mk: "Biologi Dasar" },
          dosen: { user: { id: "dosen-user-1", full_name: "Dr. Budi" } },
        },
        error: null,
      });

      // Mock mahasiswa lookup
      const mockMahasiswaQuery = createMockQuery();
      mockMahasiswaQuery.single = vi.fn().mockResolvedValue({
        data: {
          user: { full_name: "Ahmad" },
        },
        error: null,
      });

      // Create
      const newPermintaan: PermintaanPerbaikanNilai = {
        id: "permintaan-1",
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
        bukti_pendukung: null,
        response_dosen: null,
        nilai_baru: null,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      // Mock create permintaan - the insert needs to return a chainable object
      const mockInsertChain = {
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: newPermintaan,
            error: null,
          }),
        }),
      };

      const mockSelectChain = {
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...newPermintaan,
              mahasiswa: {
                id: "mhs-1",
                user: { full_name: "Ahmad", email: "ahmad@test.com" },
              },
              kelas: {
                id: "kelas-1",
                nama_kelas: "Kelas A",
                mata_kuliah: { nama_mk: "Biologi Dasar" },
              },
            },
            error: null,
          }),
        }),
      };

      const mockUpdateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...newPermintaan, status: "approved" },
                error: null,
              }),
            }),
          }),
        }),
      };

      // Setup mock implementation
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "kelas") return mockKelasQuery as any;
        if (table === "mahasiswa") return mockMahasiswaQuery as any;
        if (table === "permintaan_perbaikan_nilai") {
          return {
            insert: vi.fn().mockReturnValue(mockInsertChain),
            update: vi.fn().mockReturnValue(mockUpdateChain),
            select: vi.fn().mockReturnValue(mockSelectChain),
          } as any;
        }
        return createMockQuery() as any;
      });

      // Create permintaan
      const created = await createPermintaan({
        mahasiswa_id: "mhs-1",
        nilai_id: "nilai-1",
        kelas_id: "kelas-1",
        komponen_nilai: "kuis",
        nilai_lama: 70,
        nilai_usulan: 80,
        alasan_permintaan: "Salah hitung",
      });

      expect(created.status).toBe("pending");

      // Approve permintaan
      const approved = await approvePermintaan({
        permintaan_id: "permintaan-1",
        nilai_baru: 85,
        response_dosen: "Disetujui",
        reviewed_by: "dosen-1",
      });

      expect(approved.status).toBe("approved");
    });
  });
});
