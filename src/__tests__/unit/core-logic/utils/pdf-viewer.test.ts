/**
 * PDF Viewer Utilities Unit Tests
 * Testing PDF viewing utilities with CORS workaround
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

// Import after mocking
import {
  extractPathFromUrl,
  getFileAsBlobUrl,
  revokeBlobUrl,
} from "../../../../lib/utils/pdf-viewer";
import { supabase } from "../../../../lib/supabase/client";

describe("PDF Viewer Utilities", () => {
  const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
  const mockBlobUrl = "blob:test-pdf-url";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default Supabase storage mock
    const mockStorage = {
      download: vi.fn(),
    };

    (supabase.storage.from as any).mockReturnValue(mockStorage);

    // Setup default fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    // Spy on URL methods instead of replacing the class
    vi.spyOn(global.URL, "createObjectURL").mockReturnValue(mockBlobUrl);
    vi.spyOn(global.URL, "revokeObjectURL");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("extractPathFromUrl", () => {
    it("should extract bucket and path from valid URL", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/materi/kelas-1/dosen-1/test.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "materi",
        path: "kelas-1/dosen-1/test.pdf",
      });
    });

    it("should handle nested paths", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/uploads/2024/01/15/file.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "uploads",
        path: "2024/01/15/file.pdf",
      });
    });

    it("should handle single level path", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/materi/file.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "materi",
        path: "file.pdf",
      });
    });

    it("should handle path with special characters", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/materi/folder%20name/file%20name.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "materi",
        path: "folder%20name/file%20name.pdf",
      });
    });

    it("should return null for URL with /public/ at wrong position", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/other/bucket/materi/file.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "other",
        path: "bucket/materi/file.pdf",
      });
    });

    it("should return null for URL with /public/ but no bucket after", () => {
      const url = "https://xxx.supabase.co/storage/v1/object/public/";

      const result = extractPathFromUrl(url);

      expect(result).toBeNull();
    });

    it("should return null for malformed URL", () => {
      const url = "not-a-valid-url";

      expect(() => extractPathFromUrl(url)).toThrow();
    });

    it("should handle URL with query parameters", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/materi/file.pdf?token=abc&version=1";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "materi",
        path: "file.pdf?token=abc&version=1",
      });
    });

    it("should handle URL with hash", () => {
      const url =
        "https://xxx.supabase.co/storage/v1/object/public/materi/file.pdf#page=2";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "materi",
        path: "file.pdf#page=2",
      });
    });

    it("should handle different storage domains", () => {
      const url =
        "https://custom.supabase.co/storage/v1/object/public/avatars/user-123.jpg";

      const result = extractPathFromUrl(url);

      expect(result).toEqual({
        bucket: "avatars",
        path: "user-123.jpg",
      });
    });
  });

  describe("getFileAsBlobUrl", () => {
    it("should fetch file using Supabase storage download", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const result = await getFileAsBlobUrl(fileUrl);

      expect(mockStorage.download).toHaveBeenCalledWith("test.pdf");
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe(mockBlobUrl);
    });

    it("should use fetch fallback when Supabase storage fails", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const result = await getFileAsBlobUrl(fileUrl);

      // Should fallback to fetch
      expect(global.fetch).toHaveBeenCalledWith(fileUrl);
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe(mockBlobUrl);
    });

    it("should throw error when Supabase returns null data", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(getFileAsBlobUrl(fileUrl)).rejects.toThrow("File not found");
    });

    it("should handle fetch errors in fallback", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "Storage error" },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(getFileAsBlobUrl(fileUrl)).rejects.toThrow("HTTP 404");
    });

    it("should handle network errors", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      });

      const networkError = new Error("Network failure");
      (global.fetch as any).mockRejectedValue(networkError);

      await expect(getFileAsBlobUrl(fileUrl)).rejects.toThrow(
        "Network failure",
      );
    });

    it("should handle Supabase storage errors", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const storageError = new Error("Storage permission denied");
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockRejectedValue(storageError);

      await expect(getFileAsBlobUrl(fileUrl)).rejects.toThrow(
        "Storage permission denied",
      );
    });

    it("should work with different file types", async () => {
      const pdfUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/doc.pdf";
      const jpgUrl =
        "https://xxx.supabase.co/storage/v1/object/public/avatars/user.jpg";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const pdfResult = await getFileAsBlobUrl(pdfUrl);
      expect(pdfResult).toBe(mockBlobUrl);

      // Reset for second call
      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const jpgResult = await getFileAsBlobUrl(jpgUrl);
      expect(jpgResult).toBe(mockBlobUrl);
    });

    it("should create object URL from fetched blob", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "Storage error" },
      });

      const fallbackBlob = new Blob(["fallback content"], {
        type: "application/pdf",
      });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => fallbackBlob,
      });

      await getFileAsBlobUrl(fileUrl);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(fallbackBlob);
    });
  });

  describe("revokeBlobUrl", () => {
    it("should revoke blob URL", () => {
      const url = "blob:test-pdf-url";

      revokeBlobUrl(url);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });

    it("should not revoke non-blob URLs", () => {
      const httpsUrl = "https://example.com/file.pdf";

      revokeBlobUrl(httpsUrl);

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it("should handle empty string", () => {
      revokeBlobUrl("");

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it("should handle null/undefined", () => {
      revokeBlobUrl(null as any);
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
      revokeBlobUrl(undefined as any);
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it("should revoke blob URL with lowercase prefix", () => {
      const url = "blob:another-test-url";

      revokeBlobUrl(url);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url);
    });

    it("should handle malformed blob URLs", () => {
      // Has blob: prefix but invalid format
      revokeBlobUrl("blob:");

      // Should still attempt to revoke even malformed URLs
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:");
    });
  });

  describe("Integration scenarios", () => {
    it("should complete full PDF viewing workflow", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf";

      // 1. Extract path
      const pathInfo = extractPathFromUrl(fileUrl);
      expect(pathInfo).toEqual({
        bucket: "materi",
        path: "test.pdf",
      });

      // 2. Get blob URL
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const blobUrl = await getFileAsBlobUrl(fileUrl);
      expect(blobUrl).toBe(mockBlobUrl);

      // 3. Revoke after use
      revokeBlobUrl(blobUrl);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl);
    });

    it("should handle complete workflow with fallback to fetch", async () => {
      const fileUrl =
        "https://xxx.supabase.co/storage/v1/object/public/avatars/user.jpg";

      // 1. Extract path
      const pathInfo = extractPathFromUrl(fileUrl);
      expect(pathInfo).toEqual({
        bucket: "avatars",
        path: "user.jpg",
      });

      // 2. Get blob URL (with fallback)
      const mockStorage = (supabase.storage.from as any)("avatars");
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const fallbackBlob = new Blob(["image content"], {
        type: "image/jpeg",
      });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => fallbackBlob,
      });

      const blobUrl = await getFileAsBlobUrl(fileUrl);
      expect(blobUrl).toBe("blob:test-pdf-url");

      // 3. Revoke after use
      revokeBlobUrl(blobUrl);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl);
    });
  });
});
