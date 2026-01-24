/**
 * Materi API Unit Tests
 * Tests for learning materials management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMateri,
  getMateriById,
  createMateri,
  updateMateri,
  deleteMateri,
  downloadMateri,
  publishMateri,
  unpublishMateri,
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

const mockMateri = {
  id: "materi-1",
  kelas_id: "kelas-1",
  dosen_id: "dosen-1",
  judul: "Materi 1",
  file_url: "http://example.com/materi/file.pdf",
  is_active: true,
};

describe("Materi API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMateri", () => {
    it("should fetch materi with filters", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockMateri]);

      const result = await getMateri({ kelas_id: "kelas-1" });

      expect(result).toHaveLength(1);
    });
  });

  describe("getMateriById", () => {
    it("should fetch single materi", async () => {
      vi.mocked(getById).mockResolvedValue(mockMateri);

      const result = await getMateriById("materi-1");

      expect(result).toEqual(mockMateri);
    });
  });

  describe("createMateri", () => {
    it("should upload file and create materi", async () => {
      const mockFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      vi.mocked(uploadMateriFile).mockResolvedValue({
        url: "http://example.com/file.pdf",
        path: "path/file.pdf",
      });
      vi.mocked(insert).mockResolvedValue(mockMateri);

      const result = await createMateri({
        kelas_id: "kelas-1",
        dosen_id: "dosen-1",
        judul: "Test",
        file: mockFile,
      });

      expect(uploadMateriFile).toHaveBeenCalled();
      expect(insert).toHaveBeenCalled();
    });
  });

  describe("deleteMateri", () => {
    it("should delete file and materi record", async () => {
      vi.mocked(getById).mockResolvedValue(mockMateri);
      vi.mocked(deleteFile).mockResolvedValue();
      vi.mocked(remove).mockResolvedValue(true);

      await deleteMateri("materi-1");

      expect(deleteFile).toHaveBeenCalled();
      expect(remove).toHaveBeenCalled();
    });
  });

  describe("downloadMateri", () => {
    it("should download file", async () => {
      vi.mocked(getById).mockResolvedValue(mockMateri);
      vi.mocked(downloadFileAsBlob).mockResolvedValue(undefined);

      await downloadMateri("materi-1");

      expect(downloadFileAsBlob).toHaveBeenCalledWith(
        "materi",
        "file.pdf",
        "Materi 1",
      );
    });
  });

  describe("publishMateri", () => {
    it("should set is_active to true", async () => {
      vi.mocked(update).mockResolvedValue({ ...mockMateri, is_active: true });

      await publishMateri("materi-1");

      expect(update).toHaveBeenCalled();
    });
  });

  describe("unpublishMateri", () => {
    it("should set is_active to false", async () => {
      vi.mocked(update).mockResolvedValue({ ...mockMateri, is_active: false });

      await unpublishMateri("materi-1");

      expect(update).toHaveBeenCalled();
    });
  });
});
