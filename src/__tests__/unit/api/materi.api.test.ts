/**
 * Materi API Unit Tests
 * Comprehensive white-box testing for learning materials management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMateri,
  getMateriById,
  getMateriByKelas,
  getMateriByDosen,
  createMateri,
  updateMateri,
  deleteMateri,
  downloadMateri,
  publishMateri,
  unpublishMateri,
  incrementDownloadCount,
  getMateriStatsByKelas,
} from "../../../lib/api/materi.api";

vi.mock("../../../lib/api/base.api", () => ({
  queryWithFilters: vi.fn(),
  query: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../../../lib/supabase/storage", () => ({
  uploadMateriFile: vi.fn(),
  deleteFile: vi.fn(),
  downloadFileAsBlob: vi.fn(),
  STORAGE_BUCKETS: { MATERI: "materi" },
}));

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ error: null }),
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

import {
  queryWithFilters,
  query,
  getById,
  insert,
  update,
  remove,
} from "../../../lib/api/base.api";
import {
  uploadMateriFile,
  deleteFile,
  downloadFileAsBlob,
} from "../../../lib/supabase/storage";
import { supabase } from "../../../lib/supabase/client";

const mockMateri = {
  id: "materi-1",
  kelas_id: "kelas-1",
  dosen_id: "dosen-1",
  judul: "Pengenalan Kebidanan",
  deskripsi: "Materi dasar kebidanan",
  file_url: "http://example.com/storage/materi/kelas-1/dosen-1/file.pdf",
  tipe_file: "application/pdf",
  file_size: 1024000,
  minggu_ke: 1,
  is_active: true,
  is_downloadable: true,
  download_count: 5,
  published_at: "2024-01-15T10:00:00Z",
  created_at: "2024-01-10T08:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

const mockMateriList = [
  mockMateri,
  {
    ...mockMateri,
    id: "materi-2",
    judul: "Kehamilan Trimester 1",
    minggu_ke: 2,
    download_count: 3,
  },
  {
    ...mockMateri,
    id: "materi-3",
    judul: "Persalinan Normal",
    minggu_ke: 3,
    is_active: false,
    download_count: 0,
  },
];

describe("Materi API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Get Operations", () => {
    describe("getMateri()", () => {
      it("should fetch all materi without filters", async () => {
        vi.mocked(query).mockResolvedValue(mockMateriList);

        const result = await getMateri();

        expect(result).toHaveLength(3);
        expect(query).toHaveBeenCalledWith(
          "materi",
          expect.objectContaining({
            select: expect.any(String),
            order: { column: "created_at", ascending: false },
          }),
        );
      });

      it("should filter by kelas_id", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateri({ kelas_id: "kelas-1" });

        expect(result).toHaveLength(1);
        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          [{ column: "kelas_id", operator: "eq", value: "kelas-1" }],
          expect.any(Object),
        );
      });

      it("should filter by dosen_id", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateri({ dosen_id: "dosen-1" });

        expect(result).toHaveLength(1);
      });

      it("should filter by minggu_ke", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateri({ minggu_ke: 1 });

        expect(result).toHaveLength(1);
      });

      it("should filter by is_active", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateri({ is_active: true });

        expect(result).toHaveLength(1);
      });

      it("should apply client-side search filter on judul", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "Kehamilan" });

        expect(result).toHaveLength(1);
        expect(result[0].judul).toContain("Kehamilan");
      });

      it("should apply client-side search filter on deskripsi", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "dasar" });

        expect(result).toHaveLength(1);
      });

      it("should handle errors gracefully", async () => {
        const error = new Error("Database error");
        vi.mocked(query).mockRejectedValue(error);

        await expect(getMateri()).rejects.toThrow();
      });
    });

    describe("getMateriById()", () => {
      it("should fetch single materi by ID", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);

        const result = await getMateriById("materi-1");

        expect(result).toEqual(mockMateri);
      });

      it("should handle not found errors", async () => {
        const error = new Error("Not found");
        vi.mocked(getById).mockRejectedValue(error);

        await expect(getMateriById("invalid-id")).rejects.toThrow();
      });
    });

    describe("getMateriByKelas()", () => {
      it("should fetch materi by kelas with is_active filter", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateriByKelas("kelas-1");

        expect(result).toHaveLength(1);
      });

      it("should handle errors", async () => {
        const error = new Error("Database error");
        vi.mocked(queryWithFilters).mockRejectedValue(error);

        await expect(getMateriByKelas("kelas-1")).rejects.toThrow();
      });
    });

    describe("getMateriByDosen()", () => {
      it("should fetch materi by dosen", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateriByDosen("dosen-1");

        expect(result).toHaveLength(1);
      });
    });
  });

  describe("2. CRUD Operations", () => {
    describe("TC001: createMateri()", () => {
      const mockFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      it("TC001: should upload file and create materi record", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "kelas-1/dosen-1/file.pdf",
        });
        vi.mocked(insert).mockResolvedValue(mockMateri);

        const result = await createMateri({
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          judul: "Test Materi",
          deskripsi: "Test deskripsi",
          file: mockFile,
          minggu_ke: 1,
          is_downloadable: true,
        });

        expect(uploadMateriFile).toHaveBeenCalled();
        expect(insert).toHaveBeenCalledWith(
          "materi",
          expect.objectContaining({
            kelas_id: "kelas-1",
            dosen_id: "dosen-1",
            judul: "Test Materi",
            file_url: "http://example.com/file.pdf",
          }),
        );
        expect(result).toEqual(mockMateri);
      });

      it("TC001: should default is_downloadable to true", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "kelas-1/dosen-1/file.pdf",
        });
        vi.mocked(insert).mockResolvedValue(mockMateri);

        await createMateri({
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          judul: "Test Materi",
          file: mockFile,
        });

        expect(insert).toHaveBeenCalledWith(
          "materi",
          expect.objectContaining({ is_downloadable: true }),
        );
      });

      it("TC001: should handle upload errors", async () => {
        const uploadError = new Error("File too large");
        vi.mocked(uploadMateriFile).mockRejectedValue(uploadError);

        await expect(
          createMateri({
            kelas_id: "kelas-1",
            dosen_id: "dosen-1",
            judul: "Test",
            file: mockFile,
          }),
        ).rejects.toThrow();
      });
    });

    describe("TC003: updateMateri()", () => {
      it("TC003: should update judul", async () => {
        const updatedMateri = { ...mockMateri, judul: "Updated Title" };
        vi.mocked(update).mockResolvedValue(updatedMateri);

        const result = await updateMateri("materi-1", {
          judul: "Updated Title",
        });

        expect(result.judul).toBe("Updated Title");
      });

      it("TC003: should handle update errors", async () => {
        const error = new Error("Update failed");
        vi.mocked(update).mockRejectedValue(error);

        await expect(
          updateMateri("materi-1", { judul: "New Title" }),
        ).rejects.toThrow();
      });
    });

    describe("TC005: deleteMateri()", () => {
      it("TC005: should delete file from storage and database", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        const result = await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalledWith(
          "materi",
          "kelas-1/dosen-1/file.pdf",
        );
        expect(remove).toHaveBeenCalledWith("materi", "materi-1");
        expect(result).toBe(true);
      });

      it("TC005: should continue if storage deletion fails", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockRejectedValue(new Error("Storage error"));
        vi.mocked(remove).mockResolvedValue(true);

        const result = await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it("TC005: should handle database deletion errors", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockRejectedValue(new Error("Database error"));

        await expect(deleteMateri("materi-1")).rejects.toThrow();
      });
    });
  });

  describe("3. Download Operations", () => {
    describe("TC003: downloadMateri()", () => {
      it("TC003: should download file and increment download count", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(downloadFileAsBlob).mockResolvedValue();
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        await downloadMateri("materi-1");

        expect(downloadFileAsBlob).toHaveBeenCalledWith(
          "materi",
          "kelas-1/dosen-1/file.pdf",
          "Pengenalan Kebidanan",
        );
        expect(supabase.rpc).toHaveBeenCalled();
      });

      it("TC003: should throw error for invalid file path", async () => {
        const mockMateriInvalid = {
          ...mockMateri,
          file_url: "http://example.com/invalid-url",
        };
        vi.mocked(getById).mockResolvedValue(mockMateriInvalid);

        await expect(downloadMateri("materi-1")).rejects.toThrow(
          "File path tidak valid",
        );
      });
    });

    describe("incrementDownloadCount()", () => {
      it("should call RPC function to increment count", async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        await incrementDownloadCount("materi-1");

        expect(supabase.rpc).toHaveBeenCalledWith(
          "increment_materi_download_count",
          { materi_id: "materi-1" },
        );
      });

      it("should handle RPC errors gracefully", async () => {
        const rpcError = { message: "RPC failed" };
        vi.mocked(supabase.rpc).mockResolvedValue({ error: rpcError });

        await expect(
          incrementDownloadCount("materi-1"),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("4. Publication Operations", () => {
    describe("TC008: publishMateri()", () => {
      it("TC008: should set is_active to true and set published_at", async () => {
        const publishedMateri = {
          ...mockMateri,
          is_active: true,
          published_at: expect.any(String),
        };
        vi.mocked(update).mockResolvedValue(publishedMateri);

        const result = await publishMateri("materi-1");

        expect(result.is_active).toBe(true);
        expect(result.published_at).toBeDefined();
      });
    });

    describe("TC008: unpublishMateri()", () => {
      it("TC008: should set is_active to false without updating published_at", async () => {
        const unpublishedMateri = { ...mockMateri, is_active: false };
        vi.mocked(update).mockResolvedValue(unpublishedMateri);

        const result = await unpublishMateri("materi-1");

        expect(result.is_active).toBe(false);
        expect(update).toHaveBeenCalledWith("materi", "materi-1", {
          is_active: false,
        });
      });
    });
  });

  describe("5. Statistics", () => {
    describe("getMateriStatsByKelas()", () => {
      it("should calculate statistics correctly", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result).toEqual({
          total: 3,
          published: 2,
          draft: 1,
          total_downloads: 8,
        });
      });

      it("should handle empty materi list", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([]);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result).toEqual({
          total: 0,
          published: 0,
          draft: 0,
          total_downloads: 0,
        });
      });
    });
  });

  describe("6. White-Box Testing - Branch Coverage", () => {
    describe("Filter Branches", () => {
      it("Branch: filterConditions.length > 0", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        await getMateri({ kelas_id: "kelas-1" });

        expect(queryWithFilters).toHaveBeenCalled();
        expect(query).not.toHaveBeenCalled();
      });

      it("Branch: filterConditions.length = 0", async () => {
        vi.mocked(query).mockResolvedValue([mockMateri]);

        await getMateri();

        expect(query).toHaveBeenCalled();
        expect(queryWithFilters).not.toHaveBeenCalled();
      });

      it("Branch: search filter applied (client-side)", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "Kehamilan" });

        expect(result).toHaveLength(1);
      });
    });

    describe("File Path Extraction Branches", () => {
      it("Branch: valid file path with bucket in URL", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalledWith(
          "materi",
          "kelas-1/dosen-1/file.pdf",
        );
      });

      it("Branch: invalid file path (bucket not found)", async () => {
        const invalidMateri = {
          ...mockMateri,
          file_url: "http://example.com/invalid-url",
        };
        vi.mocked(getById).mockResolvedValue(invalidMateri);

        await expect(downloadMateri("materi-1")).rejects.toThrow(
          "File path tidak valid",
        );
      });
    });

    describe("Storage Deletion Branches", () => {
      it("Branch: storage deletion succeeds", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
      });

      it("Branch: storage deletion fails (continue with warning)", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockRejectedValue(new Error("Storage error"));
        vi.mocked(remove).mockResolvedValue(true);

        const result = await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe("is_downloadable Default Value Branch", () => {
      it("Branch: is_downloadable explicitly set", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "path/file.pdf",
        });
        vi.mocked(insert).mockResolvedValue(mockMateri);

        await createMateri({
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          judul: "Test",
          file: new File([""], "test.pdf", { type: "application/pdf" }),
          is_downloadable: false,
        });

        expect(insert).toHaveBeenCalledWith(
          "materi",
          expect.objectContaining({ is_downloadable: false }),
        );
      });

      it("Branch: is_downloadable not set (default to true)", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "path/file.pdf",
        });
        vi.mocked(insert).mockResolvedValue(mockMateri);

        await createMateri({
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          judul: "Test",
          file: new File([""], "test.pdf", { type: "application/pdf" }),
        });

        expect(insert).toHaveBeenCalledWith(
          "materi",
          expect.objectContaining({ is_downloadable: true }),
        );
      });
    });

    describe("published_at Branch", () => {
      it("Branch: publish sets published_at", async () => {
        vi.mocked(update).mockResolvedValue(mockMateri);

        await publishMateri("materi-1");

        expect(update).toHaveBeenCalledWith(
          "materi",
          "materi-1",
          expect.objectContaining({ published_at: expect.any(String) }),
        );
      });

      it("Branch: unpublish does NOT set published_at", async () => {
        vi.mocked(update).mockResolvedValue(mockMateri);

        await unpublishMateri("materi-1");

        expect(update).toHaveBeenCalledWith("materi", "materi-1", {
          is_active: false,
        });
      });
    });
  });

  describe("7. White-Box Testing - Path Coverage", () => {
    describe("Create Materi Paths", () => {
      it("Path 1: Create success path", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "kelas-1/dosen-1/file.pdf",
        });
        vi.mocked(insert).mockResolvedValue(mockMateri);

        const result = await createMateri({
          kelas_id: "kelas-1",
          dosen_id: "dosen-1",
          judul: "Test",
          file: new File([""], "test.pdf", { type: "application/pdf" }),
        });

        expect(uploadMateriFile).toHaveBeenCalled();
        expect(insert).toHaveBeenCalled();
        expect(result).toEqual(mockMateri);
      });

      it("Path 2: Create error path (upload failed)", async () => {
        vi.mocked(uploadMateriFile).mockRejectedValue(
          new Error("Upload failed"),
        );

        await expect(
          createMateri({
            kelas_id: "kelas-1",
            dosen_id: "dosen-1",
            judul: "Test",
            file: new File([""], "test.pdf", { type: "application/pdf" }),
          }),
        ).rejects.toThrow();

        expect(uploadMateriFile).toHaveBeenCalled();
        expect(insert).not.toHaveBeenCalled();
      });

      it("Path 3: Create error path (insert failed)", async () => {
        vi.mocked(uploadMateriFile).mockResolvedValue({
          url: "http://example.com/file.pdf",
          path: "kelas-1/dosen-1/file.pdf",
        });
        vi.mocked(insert).mockRejectedValue(new Error("Insert failed"));

        await expect(
          createMateri({
            kelas_id: "kelas-1",
            dosen_id: "dosen-1",
            judul: "Test",
            file: new File([""], "test.pdf", { type: "application/pdf" }),
          }),
        ).rejects.toThrow();

        expect(uploadMateriFile).toHaveBeenCalled();
        expect(insert).toHaveBeenCalled();
      });
    });

    describe("Download Materi Paths", () => {
      it("Path 4: Download success path", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(downloadFileAsBlob).mockResolvedValue();
        vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

        await downloadMateri("materi-1");

        expect(getById).toHaveBeenCalled();
        expect(downloadFileAsBlob).toHaveBeenCalled();
        expect(supabase.rpc).toHaveBeenCalled();
      });

      it("Path 5: Download error path (invalid file path)", async () => {
        const invalidMateri = {
          ...mockMateri,
          file_url: "http://example.com/invalid",
        };
        vi.mocked(getById).mockResolvedValue(invalidMateri);

        await expect(downloadMateri("materi-1")).rejects.toThrow(
          "File path tidak valid",
        );

        expect(getById).toHaveBeenCalled();
        expect(downloadFileAsBlob).not.toHaveBeenCalled();
      });

      it("Path 6: Download error path (get failed)", async () => {
        vi.mocked(getById).mockRejectedValue(new Error("Not found"));

        await expect(downloadMateri("materi-1")).rejects.toThrow();

        expect(getById).toHaveBeenCalled();
        expect(downloadFileAsBlob).not.toHaveBeenCalled();
      });
    });

    describe("Delete Materi Paths", () => {
      it("Path 7: Delete success path", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        const result = await deleteMateri("materi-1");

        expect(getById).toHaveBeenCalled();
        expect(deleteFile).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it("Path 8: Delete with storage error path (continue)", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockRejectedValue(new Error("Storage error"));
        vi.mocked(remove).mockResolvedValue(true);

        const result = await deleteMateri("materi-1");

        expect(getById).toHaveBeenCalled();
        expect(deleteFile).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it("Path 9: Delete error path (database error)", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockRejectedValue(new Error("Database error"));

        await expect(deleteMateri("materi-1")).rejects.toThrow();

        expect(getById).toHaveBeenCalled();
        expect(deleteFile).toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
      });

      it("Path 10: Delete error path (get failed)", async () => {
        vi.mocked(getById).mockRejectedValue(new Error("Not found"));

        await expect(deleteMateri("materi-1")).rejects.toThrow();

        expect(getById).toHaveBeenCalled();
        expect(deleteFile).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
      });
    });
  });

  describe("8. White-Box Testing - Condition Coverage", () => {
    describe("Filter Conditions", () => {
      it("Condition: kelas_id present", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        await getMateri({ kelas_id: "kelas-1" });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "kelas_id" }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: dosen_id present", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        await getMateri({ dosen_id: "dosen-1" });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "dosen_id" }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: minggu_ke present", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        await getMateri({ minggu_ke: 1 });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "minggu_ke", value: 1 }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: minggu_ke = 0 (falsy but valid)", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([]);

        await getMateri({ minggu_ke: 0 });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "minggu_ke", value: 0 }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: is_active = true", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        await getMateri({ is_active: true });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "is_active", value: true }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: is_active = false", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([]);

        await getMateri({ is_active: false });

        expect(queryWithFilters).toHaveBeenCalledWith(
          "materi",
          expect.arrayContaining([
            expect.objectContaining({ column: "is_active", value: false }),
          ]),
          expect.any(Object),
        );
      });

      it("Condition: search matches judul", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "Kehamilan" });

        expect(result).toHaveLength(1);
        expect(result[0].judul.toLowerCase()).toContain("kehamilan");
      });

      it("Condition: search matches deskripsi", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "dasar" });

        expect(result).toHaveLength(1);
        expect(result[0].deskripsi?.toLowerCase()).toContain("dasar");
      });

      it("Condition: search no match", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "xyz123" });

        expect(result).toHaveLength(0);
      });
    });

    describe("File Path Conditions", () => {
      it("Condition: bucket index found in URL", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalledWith(
          "materi",
          expect.stringContaining("kelas-1"),
        );
      });

      it("Condition: bucket index not found (filePath = empty)", async () => {
        const invalidMateri = {
          ...mockMateri,
          file_url: "http://example.com/invalid",
        };
        vi.mocked(getById).mockResolvedValue(invalidMateri);

        await expect(downloadMateri("materi-1")).rejects.toThrow(
          "File path tidak valid",
        );
      });

      it("Condition: filePath exists (proceed with delete)", async () => {
        vi.mocked(getById).mockResolvedValue(mockMateri);
        vi.mocked(deleteFile).mockResolvedValue();
        vi.mocked(remove).mockResolvedValue(true);

        await deleteMateri("materi-1");

        expect(deleteFile).toHaveBeenCalled();
      });

      it("Condition: filePath empty (skip delete)", async () => {
        const noFileMateri = {
          ...mockMateri,
          file_url: "http://example.com/storage/materi/",
        };
        vi.mocked(getById).mockResolvedValue(noFileMateri);
        vi.mocked(remove).mockResolvedValue(true);

        await deleteMateri("materi-1");

        expect(deleteFile).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalled();
      });
    });
  });

  describe("9. White-Box Testing - Loop Coverage", () => {
    describe("Statistics Calculation Loop", () => {
      it("Loop: empty materi list (0 iterations)", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([]);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result.total).toBe(0);
        expect(result.total_downloads).toBe(0);
      });

      it("Loop: single materi (1 iteration)", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result.total).toBe(1);
        expect(result.total_downloads).toBe(5);
      });

      it("Loop: multiple materi (3 iterations)", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result.total).toBe(3);
        expect(result.total_downloads).toBe(8);
      });

      it("Loop: large dataset (50+ iterations)", async () => {
        const largeMateriList = Array.from({ length: 50 }, (_, i) => ({
          ...mockMateri,
          id: `materi-${i}`,
          download_count: 10,
          is_active: i % 2 === 0,
        }));
        vi.mocked(queryWithFilters).mockResolvedValue(largeMateriList);

        const result = await getMateriStatsByKelas("kelas-1");

        expect(result.total).toBe(50);
        expect(result.total_downloads).toBe(500);
        expect(result.published).toBe(25);
        expect(result.draft).toBe(25);
      });
    });

    describe("Client-Side Search Filter Loop", () => {
      it("Loop: search filter with no matches", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "nonexistent" });

        expect(result).toHaveLength(0);
      });

      it("Loop: search filter with partial matches", async () => {
        vi.mocked(queryWithFilters).mockResolvedValue(mockMateriList);

        const result = await getMateri({ search: "Pengenalan" });

        expect(result).toHaveLength(1);
      });

      it("Loop: search filter with all matches", async () => {
        const searchableList = mockMateriList.map((m) => ({
          ...m,
          deskripsi: "Kebidanan dasar",
        }));
        vi.mocked(queryWithFilters).mockResolvedValue(searchableList);

        const result = await getMateri({ search: "kebidanan" });

        expect(result).toHaveLength(3);
      });
    });
  });

  describe("10. Edge Cases", () => {
    it("should handle very long judul (255 chars)", async () => {
      const longTitle = "A".repeat(255);
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue({
        ...mockMateri,
        judul: longTitle,
      });

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: longTitle,
        file: new File([""], "test.pdf", { type: "application/pdf" }),
      });

      expect(result.judul).toHaveLength(255);
    });

    it("should handle special characters in judul", async () => {
      const specialTitle = "Materi #1: Kehamilan & Persalinan (Trimester 1)";
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue({
        ...mockMateri,
        judul: specialTitle,
      });

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: specialTitle,
        file: new File([""], "test.pdf", { type: "application/pdf" }),
      });

      expect(result.judul).toBe(specialTitle);
    });

    it("should handle minggu_ke boundary values (0 and 16)", async () => {
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue(mockMateri);

      await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "Test",
        file: new File([""], "test.pdf", { type: "application/pdf" }),
        minggu_ke: 0,
      });

      expect(insert).toHaveBeenCalledWith(
        "materi",
        expect.objectContaining({ minggu_ke: 0 }),
      );

      vi.mocked(insert).mockClear();
      await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "Test",
        file: new File([""], "test.pdf", { type: "application/pdf" }),
        minggu_ke: 16,
      });

      expect(insert).toHaveBeenCalledWith(
        "materi",
        expect.objectContaining({ minggu_ke: 16 }),
      );
    });

    it("should handle null/undefined values in filters", async () => {
      vi.mocked(query).mockResolvedValue([mockMateri]);

      const result = await getMateri({
        kelas_id: undefined,
        dosen_id: null as any,
        minggu_ke: undefined,
      });

      expect(query).toHaveBeenCalled();
      expect(queryWithFilters).not.toHaveBeenCalled();
    });

    it("should handle empty file", async () => {
      const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue({
        ...mockMateri,
        file_size: 0,
      });

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "Empty File",
        file: emptyFile,
      });

      expect(result.file_size).toBe(0);
    });

    it("should handle materi without deskripsi", async () => {
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue({
        ...mockMateri,
        deskripsi: undefined,
      });

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "No Description",
        file: new File([""], "test.pdf", { type: "application/pdf" }),
      });

      expect(result.deskripsi).toBeUndefined();
    });

    it("should handle concurrent operations (sequential)", async () => {
      vi.mocked(query).mockResolvedValue([mockMateri]);

      const results = await Promise.all([
        getMateri(),
        getMateri(),
        getMateri(),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.length === 1)).toBe(true);
    });
  });

  describe("11. Permission Testing", () => {
    it("TC007: should execute createMateri with permission wrapper", async () => {
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue(mockMateri);

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "Test",
        file: new File([""], "test.pdf", { type: "application/pdf" }),
      });

      expect(result).toBeDefined();
    });

    it("TC007: should execute updateMateri with permission wrapper", async () => {
      vi.mocked(update).mockResolvedValue(mockMateri);

      const result = await updateMateri("materi-1", { judul: "Updated" });

      expect(result).toBeDefined();
    });

    it("TC007: should execute deleteMateri with permission wrapper", async () => {
      vi.mocked(getById).mockResolvedValue(mockMateri);
      vi.mocked(deleteFile).mockResolvedValue();
      vi.mocked(remove).mockResolvedValue(true);

      const result = await deleteMateri("materi-1");

      expect(result).toBe(true);
    });
  });
});
