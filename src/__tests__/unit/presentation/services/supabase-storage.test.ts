/**
 * Supabase Storage Service Unit Tests
 * Comprehensive testing of file storage functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

// Import AFTER mock
import {
  uploadFile,
  downloadFile,
  deleteFile,
  generateUniqueFileName,
  getFileMetadata,
  listFiles,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

import { supabase } from "@/lib/supabase/client";

describe("Supabase Storage Service", () => {
  let mockFile: File;
  let mockPath: string;
  let mockStorage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default storage mock
    mockStorage = {
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      getPublicUrl: vi.fn(),
    };

    (supabase.storage.from as any).mockReturnValue(mockStorage);

    mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    mockPath = "documents/test.pdf";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("uploadFile", () => {
    it("should upload file successfully and return URL", async () => {
      mockStorage.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/test.pdf" },
      });

      const result = await uploadFile(
        STORAGE_BUCKETS.MATERI,
        mockPath,
        mockFile,
      );

      expect(supabase.storage.from).toHaveBeenCalledWith(
        STORAGE_BUCKETS.MATERI,
      );
      expect(mockStorage.upload).toHaveBeenCalledWith(
        mockPath,
        mockFile,
        expect.objectContaining({
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        }),
      );

      expect(result).toBe("https://example.com/test.pdf");
    });

    it("should handle upload error", async () => {
      const uploadError = { message: "Upload failed" };
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: uploadError,
      });

      await expect(
        uploadFile(STORAGE_BUCKETS.MATERI, mockPath, mockFile),
      ).rejects.toThrow("Upload failed");

      expect(mockStorage.upload).toHaveBeenCalled();
    });

    it("should handle MIME type error", async () => {
      const mimeError = { message: "mime type not supported" };
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: mimeError,
      });

      await expect(
        uploadFile(STORAGE_BUCKETS.MATERI, mockPath, mockFile),
      ).rejects.toThrow("Tipe file application/pdf tidak didukung");
    });
  });

  describe("downloadFile", () => {
    it("should download file successfully", async () => {
      const mockData = new Blob(["test content"], { type: "application/pdf" });
      mockStorage.download.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await downloadFile(STORAGE_BUCKETS.MATERI, mockPath);

      expect(supabase.storage.from).toHaveBeenCalledWith(
        STORAGE_BUCKETS.MATERI,
      );
      expect(mockStorage.download).toHaveBeenCalledWith(mockPath);
      expect(result).toBe(mockData);
    });

    it("should handle download error", async () => {
      const downloadError = { message: "Download failed" };
      mockStorage.download.mockResolvedValue({
        data: null,
        error: downloadError,
      });

      await expect(
        downloadFile(STORAGE_BUCKETS.MATERI, mockPath),
      ).rejects.toThrow("Download failed");
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      mockStorage.remove.mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(
        deleteFile(STORAGE_BUCKETS.MATERI, mockPath),
      ).resolves.toBeUndefined();

      expect(supabase.storage.from).toHaveBeenCalledWith(
        STORAGE_BUCKETS.MATERI,
      );
      expect(mockStorage.remove).toHaveBeenCalledWith([mockPath]);
    });

    it("should handle delete error", async () => {
      const deleteError = { message: "Delete failed" };
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: deleteError,
      });

      await expect(
        deleteFile(STORAGE_BUCKETS.MATERI, mockPath),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("getFileMetadata", () => {
    it("should get file metadata successfully", async () => {
      const mockInfo = {
        name: "test.pdf",
        size: 12345,
        updated_at: "2024-01-01T00:00:00Z",
        last_accessed_at: "2024-01-01T00:00:00Z",
        metadata: {
          mimetype: "application/pdf",
          size: 12345,
        },
      };

      mockStorage.list.mockResolvedValue({
        data: [mockInfo],
        error: null,
      });

      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/test.pdf" },
      });

      const result = await getFileMetadata(STORAGE_BUCKETS.MATERI, mockPath);

      expect(result.name).toBe("test.pdf");
      expect(result.size).toBe(12345);
      expect(result.type).toBe("application/pdf");
      expect(result.url).toBe("https://example.com/test.pdf");
    });

    it("should handle file not found", async () => {
      mockStorage.list.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(
        getFileMetadata(STORAGE_BUCKETS.MATERI, mockPath),
      ).rejects.toThrow("File tidak ditemukan");
    });
  });

  describe("listFiles", () => {
    it("should list files successfully", async () => {
      const mockFiles = [
        {
          name: "test1.pdf",
          size: 12345,
          updated_at: "2024-01-01T00:00:00Z",
          last_accessed_at: "2024-01-01T00:00:00Z",
          metadata: { mimetype: "application/pdf" },
        },
        {
          name: "test2.pdf",
          size: 67890,
          updated_at: "2024-01-02T00:00:00Z",
          last_accessed_at: "2024-01-02T00:00:00Z",
          metadata: { mimetype: "application/pdf" },
        },
      ];

      mockStorage.list.mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/file.pdf" },
      });

      const result = await listFiles(STORAGE_BUCKETS.MATERI, "documents/");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("test1.pdf");
      expect(result[1].name).toBe("test2.pdf");
    });

    it("should handle list error", async () => {
      const listError = { message: "List failed" };
      mockStorage.list.mockResolvedValue({
        data: null,
        error: listError,
      });

      await expect(
        listFiles(STORAGE_BUCKETS.MATERI, "documents/"),
      ).rejects.toThrow("List failed");
    });
  });

  describe("generateUniqueFileName", () => {
    it("should generate unique file name", () => {
      const originalName = "test.pdf";
      const result = generateUniqueFileName(originalName);

      expect(result).toMatch(/^test_\d+_[a-z0-9]{6}\.pdf$/);
    });

    it("should handle file name without extension", () => {
      const originalName = "testfile";
      const result = generateUniqueFileName(originalName);

      expect(result).toMatch(/^testfile_\d+_[a-z0-9]{6}\.testfile$/);
    });

    it("should handle complex file names", () => {
      const originalName = "my-test file (1).pdf";
      const result = generateUniqueFileName(originalName);

      expect(result).toMatch(/^my-test_file__1__\d+_[a-z0-9]{6}\.pdf$/);
    });
  });
});
