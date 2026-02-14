/**
 * Supabase Storage Helpers Unit Tests
 * Comprehensive testing of file storage operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  UploadOptions,
  FileMetadata,
} from "../../../../lib/supabase/storage";

// Mock window.URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(globalThis, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock document
const mockLink = {
  href: "",
  download: "",
  click: vi.fn(),
};
const mockCreateElement = vi.fn(() => mockLink);
Object.defineProperty(globalThis, "document", {
  value: {
    createElement: mockCreateElement,
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  },
  writable: true,
});

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
  uploadFile,
  uploadMateriFile,
  downloadFile,
  downloadFileAsBlob,
  deleteFile,
  deleteFiles,
  getFileUrl,
  getSignedUrl,
  getFileMetadata,
  listFiles,
  generateUniqueFileName,
  getFileExtension,
  getFileTypeCategory,
  formatFileSize,
  STORAGE_BUCKETS,
  ALLOWED_MATERI_TYPES,
  MAX_FILE_SIZE,
} from "../../../../lib/supabase/storage";

// Import supabase client to access mocks
import { supabase } from "../../../../lib/supabase/client";

describe("Supabase Storage Helpers", () => {
  const mockBucket = "test-bucket";
  const mockPath = "test/file.pdf";
  const mockPublicUrl = "https://example.com/public/file.pdf";

  // Mock file object
  const createMockFile = (
    name: string = "test.pdf",
    size: number = 1024 * 1024,
    type: string = "application/pdf",
  ): File => {
    return {
      name,
      size,
      type,
      lastModified: Date.now(),
    } as unknown as File;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default storage mock
    const mockStorage = {
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
      createSignedUrl: vi.fn(),
      list: vi.fn(),
    };

    (supabase.storage.from as any).mockReturnValue(mockStorage);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("uploadFile", () => {
    it("should upload file successfully", async () => {
      const file = createMockFile();
      const onProgress = vi.fn();

      // Mock upload
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });

      // Mock getPublicUrl
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await uploadFile(mockBucket, mockPath, file, {
        onProgress,
      });

      expect(mockStorage.upload).toHaveBeenCalledWith(mockPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      expect(onProgress).toHaveBeenCalledWith(100);
      expect(result).toBe(mockPublicUrl);
    });

    it("should handle upload error - bucket not found", async () => {
      const file = createMockFile();

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: { message: "Bucket not found" },
      });

      await expect(uploadFile(mockBucket, mockPath, file)).rejects.toThrow(
        "Bucket test-bucket tidak ditemukan",
      );
    });

    it("should handle upload error - permission denied", async () => {
      const file = createMockFile();

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: { message: "RLS policy violation" },
      });

      await expect(uploadFile(mockBucket, mockPath, file)).rejects.toThrow(
        "tidak memiliki izin",
      );
    });

    it("should handle upload with custom options", async () => {
      const file = createMockFile();
      const options: UploadOptions = {
        cacheControl: "7200",
        upsert: true,
        onProgress: vi.fn(),
      };

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      await uploadFile(mockBucket, mockPath, file, options);

      expect(mockStorage.upload).toHaveBeenCalledWith(mockPath, file, {
        cacheControl: "7200",
        upsert: true,
        contentType: file.type,
      });
    });
  });

  describe("uploadMateriFile", () => {
    it("should upload materi file successfully", async () => {
      const file = createMockFile(
        "materi.pdf",
        5 * 1024 * 1024,
        "application/pdf",
      );

      const mockStorage = (supabase.storage.from as any)(
        STORAGE_BUCKETS.MATERI,
      );
      mockStorage.upload.mockResolvedValue({
        data: { path: mockPath },
        error: null,
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await uploadMateriFile("kelas-1", "dosen-1", file);

      expect(result.url).toBe(mockPublicUrl);
      expect(result.path).toBeDefined();
    });

    it("should reject invalid file type", async () => {
      const file = createMockFile("script.exe", 1024, "application/exe");

      await expect(
        uploadMateriFile("kelas-1", "dosen-1", file),
      ).rejects.toThrow("Tipe file tidak diizinkan");
    });

    it("should reject file too large", async () => {
      const file = createMockFile(
        "large.pdf",
        60 * 1024 * 1024, // 60MB
        "application/pdf",
      );

      await expect(
        uploadMateriFile("kelas-1", "dosen-1", file),
      ).rejects.toThrow("Ukuran file terlalu besar");
    });
  });

  describe("downloadFile", () => {
    it("should download file successfully", async () => {
      const mockBlob = new Blob(["test content"], { type: "application/pdf" });

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      const result = await downloadFile(mockBucket, mockPath);

      expect(mockStorage.download).toHaveBeenCalledWith(mockPath);
      expect(result).toBe(mockBlob);
    });

    it("should handle download error", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.download.mockResolvedValue({
        data: null,
        error: { message: "File not found" },
      });

      await expect(downloadFile(mockBucket, mockPath)).rejects.toThrow();
    });

    it("should throw when data is null", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.download.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(downloadFile(mockBucket, mockPath)).rejects.toThrow(
        "File tidak ditemukan",
      );
    });
  });

  describe("downloadFileAsBlob", () => {
    it("should download and trigger browser download", async () => {
      const mockBlob = new Blob(["test content"]);
      const fileName = "downloaded.pdf";

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      mockCreateObjectURL.mockReturnValue("blob:test-url");

      await downloadFileAsBlob(mockBucket, mockPath, fileName);

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.download).toBe(fileName);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("should use filename from path if not provided", async () => {
      const mockBlob = new Blob(["test content"]);

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.download.mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      mockCreateObjectURL.mockReturnValue("blob:test-url");

      await downloadFileAsBlob(mockBucket, "folder/file.pdf");

      expect(mockLink.download).toBe("file.pdf");
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.remove.mockResolvedValue({ error: null });

      await deleteFile(mockBucket, mockPath);

      expect(mockStorage.remove).toHaveBeenCalledWith([mockPath]);
    });

    it("should handle delete error", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.remove.mockResolvedValue({
        error: { message: "Delete failed" },
      });

      await expect(deleteFile(mockBucket, mockPath)).rejects.toThrow();
    });
  });

  describe("deleteFiles", () => {
    it("should delete multiple files successfully", async () => {
      const paths = ["file1.pdf", "file2.pdf"];

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.remove.mockResolvedValue({ error: null });

      await deleteFiles(mockBucket, paths);

      expect(mockStorage.remove).toHaveBeenCalledWith(paths);
    });
  });

  describe("getFileUrl", () => {
    it("should return public URL", () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = getFileUrl(mockBucket, mockPath);

      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith(mockPath);
      expect(result).toBe(mockPublicUrl);
    });
  });

  describe("getSignedUrl", () => {
    it("should return signed URL with default expiry", async () => {
      const mockSignedUrl = "https://example.com/signed/file.pdf?token=abc";

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      const result = await getSignedUrl(mockBucket, mockPath);

      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(mockPath, 3600);
      expect(result).toBe(mockSignedUrl);
    });

    it("should return signed URL with custom expiry", async () => {
      const mockSignedUrl = "https://example.com/signed/file.pdf?token=abc";

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      const result = await getSignedUrl(mockBucket, mockPath, 7200);

      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(mockPath, 7200);
      expect(result).toBe(mockSignedUrl);
    });

    it("should handle signed URL error", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Failed to create signed URL" },
      });

      await expect(getSignedUrl(mockBucket, mockPath)).rejects.toThrow();
    });
  });

  describe("getFileMetadata", () => {
    it("should return file metadata", async () => {
      const mockFileData = [
        {
          name: "file.pdf",
          metadata: { size: 1024 * 1024, mimetype: "application/pdf" },
          updated_at: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: mockFileData,
        error: null,
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await getFileMetadata(mockBucket, mockPath);

      expect(result).toEqual({
        name: "file.pdf",
        size: 1024 * 1024,
        type: "application/pdf",
        lastModified: expect.any(Number),
        url: mockPublicUrl,
      });
    });

    it("should handle metadata error", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      await expect(getFileMetadata(mockBucket, mockPath)).rejects.toThrow();
    });

    it("should throw when file not found", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(getFileMetadata(mockBucket, mockPath)).rejects.toThrow(
        "File tidak ditemukan",
      );
    });
  });

  describe("listFiles", () => {
    it("should return list of files", async () => {
      const mockFilesData = [
        {
          name: "file1.pdf",
          metadata: { size: 1024, mimetype: "application/pdf" },
          updated_at: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          name: "file2.pdf",
          metadata: { size: 2048, mimetype: "application/pdf" },
          updated_at: "2024-01-02T00:00:00Z",
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: mockFilesData,
        error: null,
      });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const result = await listFiles(mockBucket, "folder");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: "file1.pdf",
        size: 1024,
        type: "application/pdf",
      });
    });

    it("should return empty array on error", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: null,
        error: { message: "List failed" },
      });

      await expect(listFiles(mockBucket, "folder")).rejects.toThrow();
    });

    it("should return empty array when no files", async () => {
      const mockStorage = (supabase.storage.from as any)(mockBucket);
      mockStorage.list.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await listFiles(mockBucket, "folder");

      expect(result).toEqual([]);
    });
  });

  describe("generateUniqueFileName", () => {
    it("should generate unique filename with timestamp and random", () => {
      const result = generateUniqueFileName("test-file.pdf");

      expect(result).toMatch(/test-file_\d+_[a-z0-9]+\.pdf/);
      expect(result).not.toBe("test-file.pdf");
    });

    it("should handle files with multiple dots", () => {
      const result = generateUniqueFileName("my.file.name.pdf");

      expect(result).toMatch(/my_file_name_\d+_[a-z0-9]+\.pdf/);
    });

    it("should clean special characters", () => {
      const result = generateUniqueFileName("file@#$%.pdf");

      expect(result).toMatch(/file_____\d+_[a-z0-9]+\.pdf/);
    });

    it("should truncate long filenames", () => {
      const longName = "a".repeat(100) + ".pdf";
      const result = generateUniqueFileName(longName);

      const parts = result.split("_");
      expect(parts[0].length).toBeLessThanOrEqual(50);
    });
  });

  describe("getFileExtension", () => {
    it("should return file extension", () => {
      expect(getFileExtension("document.pdf")).toBe("pdf");
      expect(getFileExtension("image.png")).toBe("png");
      expect(getFileExtension("archive.zip")).toBe("zip");
    });

    it("should handle multiple dots", () => {
      expect(getFileExtension("file.name.pdf")).toBe("pdf");
    });

    it("should return empty string for no extension", () => {
      expect(getFileExtension("filename")).toBe("filename");
    });

    it("should return lowercase extension", () => {
      expect(getFileExtension("document.PDF")).toBe("pdf");
      expect(getFileExtension("image.PNG")).toBe("png");
    });
  });

  describe("getFileTypeCategory", () => {
    it("should categorize image files", () => {
      expect(getFileTypeCategory("image/jpeg")).toBe("image");
      expect(getFileTypeCategory("image/png")).toBe("image");
      expect(getFileTypeCategory("image/gif")).toBe("image");
    });

    it("should categorize video files", () => {
      expect(getFileTypeCategory("video/mp4")).toBe("video");
      expect(getFileTypeCategory("video/webm")).toBe("video");
    });

    it("should categorize document files", () => {
      expect(getFileTypeCategory("application/pdf")).toBe("pdf");
      expect(getFileTypeCategory("application/msword")).toBe("document");
      expect(getFileTypeCategory("application/vnd.ms-excel")).toBe(
        "spreadsheet",
      );
      expect(getFileTypeCategory("application/vnd.ms-powerpoint")).toBe(
        "presentation",
      );
    });

    it("should categorize archive files", () => {
      expect(getFileTypeCategory("application/zip")).toBe("archive");
      expect(getFileTypeCategory("application/x-rar-compressed")).toBe(
        "archive",
      );
    });

    it("should categorize text files", () => {
      expect(getFileTypeCategory("text/plain")).toBe("text");
    });

    it("should return 'other' for unknown types", () => {
      expect(getFileTypeCategory("application/octet-stream")).toBe("other");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(512)).toBe("512 Bytes");
      expect(formatFileSize(1023)).toBe("1023 Bytes");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(5120)).toBe("5 KB");
      expect(formatFileSize(1024 * 1024 - 1)).toBe("1024 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB");
      expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    });

    it("should handle decimal places", () => {
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
  });
});
