/**
 * Unit Tests for Logbook API (Vitest)
 *
 * Purpose: Test logbook entry management for praktikum
 * Coverage:
 * - getLogbook() - fetch with filters
 * - createLogbook() - mahasiswa creates draft
 * - updateLogbook() - mahasiswa updates own draft
 * - submitLogbook() - mahasiswa submits for review
 * - deleteLogbook() - mahasiswa deletes own draft
 * - Permission and ownership validation
 *
 * @vitest/environments happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  createLogbook,
  updateLogbook,
  submitLogbook,
  deleteLogbook,
  getLogbook,
  getLogbookById,
  getLogbookStats,
  reviewLogbook,
  gradeLogbook,
  logbookApi,
} from "@/lib/api/logbook.api";
import type {
  CreateLogbookData,
  UpdateLogbookData,
  SubmitLogbookData,
} from "@/types/logbook.types";

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock base.api functions
vi.mock("@/lib/api/base.api", () => ({
  query: vi.fn(),
  queryWithFilters: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  withApiResponse: vi.fn((fn) => fn),
}));

// Mock permission middleware
vi.mock("@/lib/middleware/permission.middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn(
    (permission, ownership, level, fn) => fn,
  ),
  getCurrentUserWithRole: vi.fn(),
}));

describe("Logbook API", () => {
  const mockMahasiswaId = "mhs-1";
  const mockMahasiswaUserId = "mhs-user-1";
  const mockJadwalId = "jadwal-1";
  const mockLogbookId = "logbook-1";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock auth.getUser to return mahasiswa user
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockMahasiswaUserId } },
      error: null,
    });

    // Set up default supabase.from() chain
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
        }),
      }),
      eq: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
      }),
      single: vi
        .fn()
        .mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
    });
  });

  describe("createLogbook()", () => {
    it("should create logbook entry successfully", async () => {
      // Clear the default mock and set up specific mocks for this test
      (supabase.from as any).mockReset();
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockMahasiswaId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockJadwalId, status: "approved" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn(),
          eq: vi.fn(),
          single: vi.fn(),
        };
      });

      const { insert } = await import("@/lib/api/base.api");
      (insert as any).mockResolvedValue({
        id: mockLogbookId,
        jadwal_id: mockJadwalId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const createData: CreateLogbookData = {
        jadwal_id: mockJadwalId,
        prosedur_dilakukan: "Prosedur praktikum",
        hasil_observasi: "Hasil observasi",
        skill_dipelajari: "Skill yang dipelajari",
        kendala_dihadapi: "Kendala yang dihadapi",
        refleksi: "Refleksi praktikum",
      } as any;

      const result = await createLogbook(createData);

      expect(result).toBeDefined();
      expect(insert).toHaveBeenCalled();
    });

    it("should validate user is authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const createData: CreateLogbookData = {
        jadwal_id: mockJadwalId,
        prosedur_dilakukan: "Test",
      };

      await expect(createLogbook(createData)).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("should reject when jadwal praktikum is not found", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockMahasiswaId },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      await expect(createLogbook({ jadwal_id: mockJadwalId } as any)).rejects.toThrow(
        "Jadwal praktikum not found",
      );
    });

    it("should reject when jadwal praktikum is not approved", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockMahasiswaId },
                  error: null,
                }),
              }),
            }),
          };
        }

        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: mockJadwalId, status: "pending" },
                  error: null,
                }),
              }),
            }),
          };
        }

        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      await expect(createLogbook({ jadwal_id: mockJadwalId } as any)).rejects.toThrow(
        "Cannot create logbook for unapproved jadwal",
      );
    });
  });

  describe("updateLogbook()", () => {
    it("should update own draft logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      const { update } = await import("@/lib/api/base.api");
      (update as any).mockResolvedValue({ id: mockLogbookId });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Updated prosedur",
      };

      await expect(updateLogbook(updateData)).resolves.not.toThrow();
      expect(update).toHaveBeenCalled();
    });

    it("should prevent updating submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted",
      });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
      };

      await expect(updateLogbook(updateData)).rejects.toThrow(
        "Can only update logbook with draft status",
      );
    });

    it("should prevent updating other mahasiswa's logbook", async () => {
      // Mock mahasiswa lookup - return current user's mahasiswa (mhs-1)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock getById to return logbook owned by different mahasiswa (mhs-2)
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: "mhs-2", // Different from current user's mahasiswa_id
        status: "draft",
      });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
      };

      await expect(updateLogbook(updateData)).rejects.toThrow(
        "You can only update your own logbook",
      );
    });
  });

  describe("submitLogbook()", () => {
    it("should submit logbook for review", async () => {
      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock existing logbook - draft status
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      (update as any).mockResolvedValue({ id: mockLogbookId });

      const submitData: SubmitLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Complete prosedur",
        hasil_observasi: "Complete hasil",
        skill_dipelajari: ["Complete skill"],
      };

      const result = await submitLogbook(submitData);

      expect(result).toBeDefined();
      expect(update).toHaveBeenCalledWith(
        "logbook_entries",
        mockLogbookId,
        expect.objectContaining({
          status: "submitted",
          submitted_at: expect.any(String),
        }),
      );
    });

    it("should validate required fields before submit", async () => {
      const incompleteData = {
        id: mockLogbookId,
        prosedur_dilakukan: "",
        hasil_observasi: "",
      } as any;

      await expect(submitLogbook(incompleteData)).rejects.toThrow(
        "Please fill in all required fields before submitting",
      );
    });

    it("should prevent submitting submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted", // Already submitted
      });

      const submitData: SubmitLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
        hasil_observasi: "Test",
        skill_dipelajari: ["Test"],
      };

      await expect(submitLogbook(submitData)).rejects.toThrow(
        "Can only submit logbook with draft status",
      );
    });
  });

  describe("deleteLogbook()", () => {
    it("should delete own draft logbook", async () => {
      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock existing logbook - draft status
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { remove } = await import("@/lib/api/base.api");
      (remove as any).mockResolvedValue(mockLogbookId);

      await expect(deleteLogbook(mockLogbookId)).resolves.not.toThrow();
      expect(remove).toHaveBeenCalledWith("logbook_entries", mockLogbookId);
    });

    it("should prevent deleting submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted",
      });

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "Can only delete logbook with draft status",
      );
    });

    it("should prevent deleting other mahasiswa's logbook", async () => {
      // Mock mahasiswa lookup - return current user's mahasiswa (mhs-1)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock getById to return logbook owned by different mahasiswa (mhs-2)
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: "mhs-2", // Different from current user's mahasiswa_id
        status: "draft",
      });

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "You can only delete your own logbook",
      );
    });
  });

  describe("query and dosen workflows", () => {
    it("should get logbook by id", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({ id: mockLogbookId, status: "draft" });

      const result = await getLogbookById(mockLogbookId);

      expect(getById).toHaveBeenCalledWith(
        "logbook_entries",
        mockLogbookId,
        expect.objectContaining({
          select: expect.stringContaining("jadwal:jadwal_id"),
        }),
      );
      expect(result).toEqual({ id: mockLogbookId, status: "draft" });
    });

    it("should build getLogbook filters correctly", async () => {
      const { queryWithFilters } = await import("@/lib/api/base.api");
      (queryWithFilters as any).mockResolvedValue([{ id: mockLogbookId }]);

      const result = await getLogbook({
        jadwal_id: mockJadwalId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted",
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
      } as any);

      expect(queryWithFilters).toHaveBeenCalledWith(
        "logbook_entries",
        expect.arrayContaining([
          { column: "jadwal_id", operator: "eq", value: mockJadwalId },
          { column: "mahasiswa_id", operator: "eq", value: mockMahasiswaId },
          { column: "status", operator: "eq", value: "submitted" },
          { column: "mahasiswa.kelas_id", operator: "eq", value: "kelas-1" },
          { column: "dosen_id", operator: "eq", value: "dosen-1" },
        ]),
        expect.objectContaining({
          order: { column: "created_at", ascending: false },
        }),
      );
      expect(result).toEqual([{ id: mockLogbookId }]);
    });

    it("should summarize logbook stats including average grade", async () => {
      const { queryWithFilters } = await import("@/lib/api/base.api");
      (queryWithFilters as any).mockResolvedValue([
        { status: "draft", nilai: null },
        { status: "submitted", nilai: null },
        { status: "reviewed", nilai: null },
        { status: "graded", nilai: 80 },
        { status: "graded", nilai: 90 },
      ]);

      const result = await getLogbookStats({ kelas_id: "kelas-1" } as any);

      expect(result).toEqual({
        total_logbooks: 5,
        draft: 1,
        submitted: 1,
        reviewed: 1,
        graded: 2,
        average_grade: 85,
      });
    });

    it("should return undefined average grade when no graded nilai exists", async () => {
      const { queryWithFilters } = await import("@/lib/api/base.api");
      (queryWithFilters as any).mockResolvedValue([
        { status: "draft", nilai: null },
        { status: "submitted", nilai: undefined },
      ]);

      await expect(getLogbookStats()).resolves.toEqual({
        total_logbooks: 2,
        draft: 1,
        submitted: 1,
        reviewed: 0,
        graded: 0,
        average_grade: undefined,
      });
    });

    it("should review submitted logbook", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "dosen-1" }, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
            }),
          }),
        };
      });

      const { getById, update } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        status: "submitted",
      });
      (update as any).mockResolvedValue({ id: mockLogbookId, status: "reviewed" });

      const result = await reviewLogbook({ id: mockLogbookId, feedback: "Bagus" });

      expect(update).toHaveBeenCalledWith(
        "logbook_entries",
        mockLogbookId,
        expect.objectContaining({
          dosen_id: "dosen-1",
          dosen_feedback: "Bagus",
          status: "reviewed",
        }),
      );
      expect(result).toEqual({ id: mockLogbookId, status: "reviewed" });
    });

    it("should reject invalid review status", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "dosen-1" }, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
            }),
          }),
        };
      });

      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        status: "draft",
      });

      await expect(reviewLogbook({ id: mockLogbookId, feedback: "Bagus" })).rejects.toThrow(
        "Can only review submitted logbooks",
      );
    });

    it("should reject invalid grade range", async () => {
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "dosen-1" }, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId }, error: null }),
            }),
          }),
        };
      });

      await expect(gradeLogbook({ id: mockLogbookId, nilai: 120 } as any)).rejects.toThrow(
        "Grade must be between 0 and 100",
      );
    });

    it("should expose wrapper API through withApiResponse", async () => {
      const {
        withApiResponse,
        queryWithFilters,
        getById,
        insert,
        update,
        remove,
      } = await import("@/lib/api/base.api");

      (queryWithFilters as any).mockResolvedValue([]);
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });
      (insert as any).mockResolvedValue({ id: mockLogbookId });
      (update as any).mockResolvedValue({ id: mockLogbookId, status: "reviewed" });
      (remove as any).mockResolvedValue(undefined);

      await logbookApi.getLogbook();
      await logbookApi.getLogbookById(mockLogbookId);
      await logbookApi.getLogbookStats();
      await logbookApi.createLogbook({ jadwal_id: mockJadwalId } as any);
      await logbookApi.updateLogbook({ id: mockLogbookId } as any);
      await logbookApi.submitLogbook({
        id: mockLogbookId,
        prosedur_dilakukan: "ok",
        hasil_observasi: "ok",
        skill_dipelajari: ["ok"],
      } as any);
      await logbookApi.deleteLogbook(mockLogbookId);
      await logbookApi.reviewLogbook({ id: mockLogbookId, feedback: "ok" } as any);
      await logbookApi.gradeLogbook({ id: mockLogbookId, nilai: 90 } as any);

      expect(withApiResponse).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should reject submit when logbook is not found", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue(null);

      await expect(
        submitLogbook({
          id: mockLogbookId,
          prosedur_dilakukan: "Test",
          hasil_observasi: "Test",
          skill_dipelajari: ["Test"],
        }),
      ).rejects.toThrow("Logbook not found");
    });

    it("should reject delete when mahasiswa record is missing", async () => {
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "Mahasiswa record not found",
      );
    });

    it("should reject delete when logbook is not found", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue(null);

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "Logbook not found",
      );
    });
    it("should handle very long content in fields", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      (update as any).mockResolvedValue({ id: mockLogbookId });

      const longText = "A".repeat(1000);

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: longText,
        hasil_observasi: longText,
        skill_dipelajari: [longText],
        kendala_dihadapi: longText,
        refleksi: longText,
      };

      await expect(updateLogbook(updateData)).resolves.not.toThrow();
      expect(update).toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const { getById } = await import("@/lib/api/base.api");
      (getById as any).mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      (update as any).mockResolvedValue({ id: mockLogbookId });

      const specialText = "Test <script>alert('xss')</script>";

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: specialText,
        hasil_observasi: specialText,
        skill_dipelajari: [specialText],
        kendala_dihadapi: specialText,
        refleksi: specialText,
      };

      const result = await updateLogbook(updateData);

      expect(result).toBeDefined();
    });
  });
});
