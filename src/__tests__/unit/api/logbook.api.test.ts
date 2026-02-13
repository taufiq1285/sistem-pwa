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
} from "@/lib/api/logbook.api";
import type { CreateLogbookData, UpdateLogbookData, SubmitLogbookData } from "@/types/logbook.types";

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    })),
    auth: { getUser: vi.fn() },
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
  requirePermissionAndOwnership: vi.fn((permission, ownership, level, fn) => fn),
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
  });

  describe("createLogbook()", () => {
    it("should create logbook entry successfully", async () => {
      const { insert } = await import("@/lib/api/base.api");
      insert.mockResolvedValue({
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
      };

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
        "User not authenticated"
      );
    });
  });

  describe("updateLogbook()", () => {
    it("should update own draft logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      const { update } = await import("@/lib/api/base.api");
      update.mockResolvedValue({ id: mockLogbookId });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Updated prosedur",
      };

      await expect(updateLogbook(updateData)).resolves.not.toThrow();
      expect(update).toHaveBeenCalled();
    });

    it("should prevent updating submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted",
      });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
      };

      await expect(updateLogbook(updateData)).rejects.toThrow(
        "Can only update logbook with draft status"
      );
    });

    it("should prevent updating other mahasiswa's logbook", async () => {
      // Mock mahasiswa lookup - return current user's mahasiswa (mhs-1)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock getById to return logbook owned by different mahasiswa (mhs-2)
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: "mhs-2", // Different from current user's mahasiswa_id
        status: "draft",
      });

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
      };

      await expect(updateLogbook(updateData)).rejects.toThrow(
        "You can only update your own logbook"
      );
    });
  });

  describe("submitLogbook()", () => {
    it("should submit logbook for review", async () => {
      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock existing logbook - draft status
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      update.mockResolvedValue({ id: mockLogbookId });

      const submitData: SubmitLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Complete prosedur",
        hasil_observasi: "Complete hasil",
        skill_dipelajari: "Complete skill",
      };

      const result = await submitLogbook(submitData);

      expect(result).toBeDefined();
      expect(update).toHaveBeenCalledWith(
        "logbook_entries",
        mockLogbookId,
        expect.objectContaining({
          status: "submitted",
          submitted_at: expect.any(String),
        })
      );
    });

    it("should validate required fields before submit", async () => {
      const incompleteData = {
        id: mockLogbookId,
        prosedur_dilakukan: "",
        hasil_observasi: "",
      };

      await expect(submitLogbook(incompleteData)).rejects.toThrow(
        "Please fill in all required fields before submitting"
      );
    });

    it("should prevent submitting submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted", // Already submitted
      });

      const submitData: SubmitLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: "Test",
        hasil_observasi: "Test",
        skill_dipelajari: "Test",
      };

      await expect(submitLogbook(submitData)).rejects.toThrow(
        "Logbook already submitted"
      );
    });
  });

  describe("deleteLogbook()", () => {
    it("should delete own draft logbook", async () => {
      // Mock mahasiswa lookup
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock existing logbook - draft status
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { remove } = await import("@/lib/api/base.api");
      remove.mockResolvedValue(mockLogbookId);

      const result = await deleteLogbook(mockLogbookId);

      expect(result).toBeTruthy();
      expect(remove).toHaveBeenCalledWith("logbook_entries", mockLogbookId);
    });

    it("should prevent deleting submitted logbook", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "submitted",
      });

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "Can only delete logbook with draft status"
      );
    });

    it("should prevent deleting other mahasiswa's logbook", async () => {
      // Mock mahasiswa lookup - return current user's mahasiswa (mhs-1)
      (supabase.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: mockMahasiswaId } }),
          }),
        }),
      });

      // Mock getById to return logbook owned by different mahasiswa (mhs-2)
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: "mhs-2", // Different from current user's mahasiswa_id
        status: "draft",
      });

      await expect(deleteLogbook(mockLogbookId)).rejects.toThrow(
        "You can only delete your own logbook"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long content in fields", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      update.mockResolvedValue({ id: mockLogbookId });

      const longText = "A".repeat(1000);

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: longText,
        hasil_observasi: longText,
        skill_dipelajari: longText,
        kendala_dihadapi: longText,
        refleksi: longText,
      };

      await expect(updateLogbook(updateData)).resolves.not.toThrow();
      expect(update).toHaveBeenCalled();
    });

    it("should handle special characters in content", async () => {
      const { getById } = await import("@/lib/api/base.api");
      getById.mockResolvedValue({
        id: mockLogbookId,
        mahasiswa_id: mockMahasiswaId,
        status: "draft",
      });

      const { update } = await import("@/lib/api/base.api");
      update.mockResolvedValue({ id: mockLogbookId });

      const specialText = "Test <script>alert('xss')</script>";

      const updateData: UpdateLogbookData = {
        id: mockLogbookId,
        prosedur_dilakukan: specialText,
        hasil_observasi: specialText,
        skill_dipelajari: specialText,
        kendala_dihadapi: specialText,
        refleksi: specialText,
      };

      const result = await updateLogbook(updateData);

      expect(result).toBeDefined();
    });
  });
});
