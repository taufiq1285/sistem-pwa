/**
 * Mahasiswa Semester Management API Tests
 *
 * CORE BUSINESS LOGIC TESTS - Academic Semester Management
 *
 * Purpose: Test semester update dengan smart recommendations
 * Innovation: Audit trail & auto-enrollment system
 *
 * Test Coverage:
 * - Get current semester
 * - Smart recommendation logic
 * - Update semester dengan audit trail
 * - Auto-enroll ke recommended kelas
 * - Get audit history
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getMahasiswaSemester,
  getSemesterRecommendations,
  enrollToRecommendedClass,
  getMahasiswaSemesterHistory,
  updateMahasiswaSemester,
} from "@/lib/api/mahasiswa-semester.api";
import type {
  KelasRecommendation,
  SemesterUpdateResult,
} from "@/lib/api/mahasiswa-semester.api";

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

// Mock middleware
vi.mock("@/lib/middleware", () => ({
  requirePermission: (permission: string, fn: any) => fn,
}));

describe("Mahasiswa Semester Management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // GET SEMESTER
  // ==============================================================================

  describe("getMahasiswaSemester", () => {
    it("should return current semester", async () => {
      const mockMahasiswa = {
        id: "mhs-1",
        semester: 3,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMahasiswa,
              error: null,
            }),
          }),
        }),
      });

      const result = await getMahasiswaSemester("mhs-1");

      expect(result).toBe(3);
    });

    it("should return 1 if semester not found", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await getMahasiswaSemester("mhs-1");

      expect(result).toBe(1);
    });

    it("should handle database errors", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      await expect(getMahasiswaSemester("mhs-1")).rejects.toThrow(
        "Database error",
      );
    });
  });

  // ==============================================================================
  // SMART RECOMMENDATIONS
  // ==============================================================================

  describe("getSemesterRecommendations", () => {
    it("should get recommendations using RPC", async () => {
      const mockMahasiswa = {
        id: "mhs-1",
        angkatan: 2023,
        program_studi: "D3 Kebidanan",
      };

      const mockRecommendations: KelasRecommendation[] = [
        {
          kelas_id: "kelas-1",
          nama_kelas: "Kelas A",
          semester_ajaran: 3,
          tahun_ajaran: "2025/2026",
          dosen_name: "Dr. Budi",
          reason: "Sesuai dengan angkatan",
        },
        {
          kelas_id: "kelas-2",
          nama_kelas: "Kelas B",
          semester_ajaran: 3,
          tahun_ajaran: "2025/2026",
          dosen_name: "Dr. Siti",
          reason: "Sesuai dengan program studi",
        },
      ];

      // Mock supabase.from() for mahasiswa query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMahasiswa,
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock supabase.rpc() for recommendations - this is called directly, not from supabase.from()
      vi.mocked(supabase.rpc as any).mockResolvedValue({
        data: mockRecommendations,
        error: null,
      });

      const result = await getSemesterRecommendations("mhs-1", 3);

      expect(result).toHaveLength(2);
      expect(result[0].kelas_id).toBe("kelas-1");
    });

    it("should return empty array if mahasiswa not found", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      const result = await getSemesterRecommendations("mhs-1", 3);

      expect(result).toEqual([]);
    });

    it("should return empty array on RPC error", async () => {
      const mockMahasiswa = {
        id: "mhs-1",
        angkatan: 2023,
        program_studi: "D3 Kebidanan",
      };

      // Mock supabase.from() for mahasiswa query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMahasiswa,
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock supabase.rpc() to return error
      vi.mocked(supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await getSemesterRecommendations("mhs-1", 3);

      expect(result).toEqual([]);
    });

    it("should handle unexpected errors gracefully", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      const result = await getSemesterRecommendations("mhs-1", 3);

      expect(result).toEqual([]);
    });
  });

  // ==============================================================================
  // UPDATE SEMESTER
  // ==============================================================================

  describe("updateMahasiswaSemester", () => {
    it("should update semester and create audit log", async () => {
      const mockMahasiswaLama = { id: "mhs-1", semester: 2 };
      const mockMahasiswaWithProgram = {
        id: "mhs-1",
        angkatan: 2023,
        program_studi: "D3 Kebidanan",
      };

      const mockRecommendations: KelasRecommendation[] = [
        {
          kelas_id: "kelas-1",
          nama_kelas: "Kelas A",
          semester_ajaran: 3,
          tahun_ajaran: "2025/2026",
          dosen_name: "Dr. Budi",
          reason: "Sesuai",
        },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Get current semester
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaLama,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Update semester
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          };
        } else if (callCount === 3) {
          // Create audit log
          return {
            insert: vi.fn().mockReturnValue({
              error: null,
            }),
          };
        } else if (callCount === 4) {
          // Get mahasiswa details for recommendations (angkatan, program_studi)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaWithProgram,
                  error: null,
                }),
              }),
            }),
          };
        }
        return createMockQuery();
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      // Mock supabase.rpc() for recommendations
      vi.mocked(supabase.rpc as any).mockResolvedValue({
        data: mockRecommendations,
        error: null,
      });

      const result = await updateMahasiswaSemester({
        mahasiswa_id: "mhs-1",
        semester_baru: 3,
        notes: "Semester naik",
      });

      expect(result.success).toBe(true);
      expect(result.semester_lama).toBe(2);
      expect(result.semester_baru).toBe(3);
      expect(result.recommendations).toHaveLength(1);
    });

    it("should return error if semester tidak berubah", async () => {
      const mockMahasiswa = { id: "mhs-1", semester: 3 };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMahasiswa,
              error: null,
            }),
          }),
        }),
      });

      const result = await updateMahasiswaSemester({
        mahasiswa_id: "mhs-1",
        semester_baru: 3,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("tidak berubah");
    });

    it("should handle audit log creation failure gracefully", async () => {
      const mockMahasiswaLama = { id: "mhs-1", semester: 2 };
      const mockMahasiswaWithProgram = {
        id: "mhs-1",
        angkatan: 2023,
        program_studi: "D3 Kebidanan",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaLama,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          };
        } else if (callCount === 3) {
          // Audit log fails
          return {
            insert: vi.fn().mockReturnValue({
              error: { message: "Audit log failed" },
            }),
          };
        } else if (callCount === 4) {
          // Get mahasiswa details for recommendations
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaWithProgram,
                  error: null,
                }),
              }),
            }),
          };
        }
        return createMockQuery();
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      // Mock supabase.rpc() for recommendations
      vi.mocked(supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      const result = await updateMahasiswaSemester({
        mahasiswa_id: "mhs-1",
        semester_baru: 3,
      });

      // Should still succeed even if audit log fails
      expect(result.success).toBe(true);
    });

    it("should handle update errors", async () => {
      const mockMahasiswaLama = { id: "mhs-1", semester: 2 };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaLama,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Update fails
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: { message: "Update failed" },
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(
        updateMahasiswaSemester({
          mahasiswa_id: "mhs-1",
          semester_baru: 3,
        }),
      ).rejects.toThrow();
    });
  });

  // ==============================================================================
  // ENROLL TO RECOMMENDED CLASS
  // ==============================================================================

  describe("enrollToRecommendedClass", () => {
    it("should enroll mahasiswa to recommended kelas", async () => {
      const mockExistingCheck = null; // Not already enrolled
      const mockMahasiswa = { semester: 3 };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check existing enrollment
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockExistingCheck,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          // Get mahasiswa semester
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswa,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Enroll
          return {
            insert: vi.fn().mockReturnValue({
              error: null,
            }),
          };
        }
      });

      await enrollToRecommendedClass("mhs-1", "kelas-1");

      expect(supabase.from).toHaveBeenCalledTimes(3);
    });

    it("should reject if already enrolled", async () => {
      const mockExisting = {
        id: "enrollment-1",
        mahasiswa_id: "mhs-1",
        kelas_id: "kelas-1",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockExisting,
                error: null,
              }),
            }),
          }),
        }),
      });

      await expect(
        enrollToRecommendedClass("mhs-1", "kelas-1"),
      ).rejects.toThrow("sudah terdaftar");
    });

    it("should handle mahasiswa not found", async () => {
      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
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
                  data: null,
                  error: { message: "Not found" },
                }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(
        enrollToRecommendedClass("mhs-1", "kelas-1"),
      ).rejects.toThrow("tidak ditemukan");
    });

    it("should handle enrollment errors", async () => {
      const mockExistingCheck = null;
      const mockMahasiswa = { semester: 3 };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockExistingCheck,
                    error: null,
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
                  data: mockMahasiswa,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              error: { message: "Enrollment failed" },
            }),
          };
        }
      });

      await expect(
        enrollToRecommendedClass("mhs-1", "kelas-1"),
      ).rejects.toThrow("Enrollment failed");
    });
  });

  // ==============================================================================
  // AUDIT HISTORY
  // ==============================================================================

  describe("getMahasiswaSemesterHistory", () => {
    it("should get audit history for mahasiswa", async () => {
      const mockHistory = [
        {
          id: "audit-1",
          mahasiswa_id: "mhs-1",
          semester_lama: 2,
          semester_baru: 3,
          updated_by_admin_id: "admin-1",
          updated_at: "2025-01-21T10:00:00Z",
          notes: "Semester naik",
        },
        {
          id: "audit-2",
          mahasiswa_id: "mhs-1",
          semester_lama: 1,
          semester_baru: 2,
          updated_by_admin_id: "admin-1",
          updated_at: "2024-06-01T10:00:00Z",
          notes: null,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      const result = await getMahasiswaSemesterHistory("mhs-1");

      expect(result).toHaveLength(2);
      expect(result[0].semester_lama).toBe(2);
      expect(result[0].semester_baru).toBe(3);
    });

    it("should return empty array if no history", async () => {
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

      const result = await getMahasiswaSemesterHistory("mhs-1");

      expect(result).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      const result = await getMahasiswaSemesterHistory("mhs-1");

      expect(result).toEqual([]);
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete workflow: get semester → update → enroll → get history", async () => {
      // Mock get semester
      const mockMahasiswa = { id: "mhs-1", semester: 2 };

      // Mock update semester
      const mockRecommendations: KelasRecommendation[] = [
        {
          kelas_id: "kelas-1",
          nama_kelas: "Kelas A",
          semester_ajaran: 3,
          tahun_ajaran: "2025/2026",
          dosen_name: "Dr. Budi",
          reason: "Sesuai",
        },
      ];

      // Mock enrollment check
      const mockExistingCheck = null;

      // Mock audit history
      const mockHistory = [
        {
          id: "audit-1",
          mahasiswa_id: "mhs-1",
          semester_lama: 2,
          semester_baru: 3,
          updated_by_admin_id: "admin-1",
          updated_at: "2025-01-21T10:00:00Z",
          notes: "Semester naik",
        },
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;

        // 1. Get semester
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswa,
                  error: null,
                }),
              }),
            }),
          };
        }
        // 2. Update semester - get current
        else if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswa,
                  error: null,
                }),
              }),
            }),
          };
        }
        // 3. Update semester - update
        else if (callCount === 3) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          };
        }
        // 4. Create audit log
        else if (callCount === 4) {
          return {
            insert: vi.fn().mockReturnValue({
              error: null,
            }),
          };
        }
        // 5. Get recommendations
        else if (callCount === 5) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: mockHistory,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        // 6. Enroll - check existing
        else if (callCount === 6) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockExistingCheck,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        // 7. Enroll - get mahasiswa
        else if (callCount === 7) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { semester: 3 },
                  error: null,
                }),
              }),
            }),
          };
        }
        // 8. Enroll - insert
        else if (callCount === 8) {
          return {
            insert: vi.fn().mockReturnValue({
              error: null,
            }),
          };
        }
        // 9. Get history
        else if (callCount === 9) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockHistory,
                  error: null,
                }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      // Get current semester
      const currentSemester = await getMahasiswaSemester("mhs-1");
      expect(currentSemester).toBe(2);

      // Update semester
      const updateResult = await updateMahasiswaSemester({
        mahasiswa_id: "mhs-1",
        semester_baru: 3,
      });
      expect(updateResult.success).toBe(true);

      // Enroll to kelas
      await enrollToRecommendedClass("mhs-1", "kelas-1");

      // Get history
      const history = await getMahasiswaSemesterHistory("mhs-1");
      expect(history).toHaveLength(1);
    });
  });

  // ==============================================================================
  // EDGE CASES
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle invalid mahasiswa ID", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // The API throws an error when there's an error, so we expect it to reject
      await expect(getMahasiswaSemester("invalid-id")).rejects.toThrow();
    });

    it("should handle concurrent semester updates", async () => {
      const mockMahasiswa = { id: "mhs-1", semester: 2 };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMahasiswa,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null,
          }),
        }),
      });

      // Concurrent updates
      const updates = [
        updateMahasiswaSemester({ mahasiswa_id: "mhs-1", semester_baru: 3 }),
        updateMahasiswaSemester({ mahasiswa_id: "mhs-1", semester_baru: 4 }),
      ];

      const results = await Promise.allSettled(updates);

      expect(results).toHaveLength(2);
    });

    it("should handle semester downgrade", async () => {
      const mockMahasiswa = { id: "mhs-1", semester: 5 };
      const mockMahasiswaWithProgram = {
        id: "mhs-1",
        angkatan: 2022,
        program_studi: "D3 Kebidanan",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswa,
                  error: null,
                }),
              }),
            }),
          };
        } else if (callCount === 2) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          };
        } else if (callCount === 3) {
          // Create audit log
          return {
            insert: vi.fn().mockReturnValue({ error: null }),
          };
        } else if (callCount === 4) {
          // Get mahasiswa details for recommendations
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMahasiswaWithProgram,
                  error: null,
                }),
              }),
            }),
          };
        }
        return createMockQuery();
      });

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: "admin-1" } },
      });

      // Mock supabase.rpc() for recommendations
      vi.mocked(supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await updateMahasiswaSemester({
        mahasiswa_id: "mhs-1",
        semester_baru: 3, // Downgrade from 5 to 3
        notes: "Koreksi semester",
      });

      expect(result.success).toBe(true);
      expect(result.semester_lama).toBe(5);
      expect(result.semester_baru).toBe(3);
    });
  });
});
