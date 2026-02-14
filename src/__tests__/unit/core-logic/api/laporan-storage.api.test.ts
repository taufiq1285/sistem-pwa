/**
 * Laporan Storage API Tests
 *
 * CORE UTILITY TESTS - File Upload/Download Management
 *
 * Purpose: Test laporan file storage operations
 * Innovation: Secure file handling dengan validation
 *
 * Test Coverage:
 * - File validation (size, MIME type)
 * - Upload ke Supabase Storage
 * - Download dengan signed URL
 * - Delete file operations
 * - List files in folder
 * - Path extraction dari URL
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  uploadLaporan,
  createLaporanUploader,
  getLaporanSignedUrl,
  downloadLaporan,
  deleteLaporan,
  listLaporanFiles,
  extractPathFromUrl,
} from "@/lib/api/laporan-storage.api";

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

describe("Laporan Storage API - File Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers and mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    // Mock Date.now() to return a consistent value for tests
    global.Date.now = vi.fn(() => 123456) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Mock file object
  const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File(["mock content"], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  // ==============================================================================
  // FILE VALIDATION
  // ==============================================================================

  describe("File Validation", () => {
    it("should validate file size within limit", async () => {
      const mockFile = createMockFile(
        "laporan.pdf",
        5 * 1024 * 1024,
        "application/pdf",
      ); // 5MB

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "kelas-1/mhs-1/attempt-1/file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://storage.url/file.pdf" },
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://storage.url/signed/file.pdf" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("laporan.pdf");
    });

    it("should reject file larger than 20MB", async () => {
      const mockFile = createMockFile(
        "large.pdf",
        25 * 1024 * 1024, // 25MB
        "application/pdf",
      );

      await expect(
        uploadLaporan({
          file: mockFile,
          kelasId: "kelas-1",
          mahasiswaId: "mhs-1",
          attemptId: "attempt-1",
        }),
      ).rejects.toThrow("Ukuran file terlalu besar");
    });

    it("should reject unsupported MIME type", async () => {
      const mockFile = createMockFile("script.exe", 1024, "application/exe");

      await expect(
        uploadLaporan({
          file: mockFile,
          kelasId: "kelas-1",
          mahasiswaId: "mhs-1",
          attemptId: "attempt-1",
        }),
      ).rejects.toThrow("Tipe file tidak didukung");
    });

    it("should accept PDF files", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should accept Word documents", async () => {
      const mockFile = createMockFile(
        "laporan.docx",
        1024,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.docx" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should accept images", async () => {
      const mockFile = createMockFile("screenshot.jpg", 1024, "image/jpeg");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.jpg" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should accept ZIP files", async () => {
      const mockFile = createMockFile(
        "files.zip",
        5 * 1024 * 1024,
        "application/zip",
      );

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.zip" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });
  });

  // ==============================================================================
  // UPLOAD OPERATIONS
  // ==============================================================================

  describe("Upload Operations", () => {
    it("should upload file with correct path structure", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "kelas-1/mhs-1/attempt-1/123456_laporan.pdf" },
          error: null,
        }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: "public-url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(mockStorage.upload).toHaveBeenCalledWith(
        "kelas-1/mhs-1/attempt-1/123456_laporan.pdf",
        mockFile,
        expect.objectContaining({
          cacheControl: "3600",
          upsert: false,
        }),
      );
    });

    it("should upload file with soalId in path", async () => {
      const mockFile = createMockFile("jawaban.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "kelas-1/mhs-1/attempt-1/soal-1/123456_jawaban.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
        soalId: "soal-1",
      });

      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringContaining("soal-1"),
        mockFile,
        expect.any(Object),
      );
    });

    it("should sanitize filename", async () => {
      const mockFile = createMockFile(
        "Laporan Dengan Spasi & Special!.pdf",
        1024,
        "application/pdf",
      );

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "sanitized.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      const uploadedPath = mockStorage.upload.mock.calls[0][0];
      // uploadedPath is "kelas-1/mhs-1/attempt-1/123456_Laporan_Dengan_Spasi___Special_.pdf"
      // We need to check if it contains the sanitized filename pattern
      expect(uploadedPath).toMatch(
        /123456_Laporan_Dengan_Spasi___Special_\.pdf$/,
      );
    });

    it("should return both public URL and signed URL", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://public.storage/file.pdf" },
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: {
            signedUrl: "https://signed.storage/file.pdf?token=xyz",
          },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result.url).toBe("https://public.storage/file.pdf");
      expect(result.signedUrl).toBe(
        "https://signed.storage/file.pdf?token=xyz",
      );
    });

    it("should handle upload errors gracefully", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Upload failed" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await expect(
        uploadLaporan({
          file: mockFile,
          kelasId: "kelas-1",
          mahasiswaId: "mhs-1",
          attemptId: "attempt-1",
        }),
      ).rejects.toThrow("Gagal mengupload file");
    });

    it("should handle signed URL creation failure gracefully", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          publicUrl: "https://public.storage/file.pdf",
        }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Signed URL failed" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      // Should still succeed, just without signed URL
      expect(result.url).toBeDefined();
      expect(result.signedUrl).toBeUndefined();
    });
  });

  // ==============================================================================
  // UPLOADER HELPER FUNCTION
  // ==============================================================================

  describe("createLaporanUploader", () => {
    it("should create uploader function with fixed parameters", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const uploader = createLaporanUploader(
        "kelas-1",
        "mhs-1",
        "attempt-1",
        "soal-1",
      );

      const result = await uploader(mockFile);

      expect(mockStorage.upload).toHaveBeenCalledWith(
        "kelas-1/mhs-1/attempt-1/soal-1/123456_laporan.pdf",
        mockFile,
        expect.any(Object),
      );
      expect(result.name).toBe("laporan.pdf");
    });

    it("should work without soalId", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const uploader = createLaporanUploader("kelas-1", "mhs-1", "attempt-1");

      await uploader(mockFile);

      const uploadedPath = mockStorage.upload.mock.calls[0][0];
      expect(uploadedPath).not.toContain("soal-1");
    });
  });

  // ==============================================================================
  // DOWNLOAD OPERATIONS
  // ==============================================================================

  describe("Download Operations", () => {
    it("should get signed URL for download", async () => {
      const mockStorage = {
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "https://signed.storage/file.pdf?token=abc" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await getLaporanSignedUrl("kelas-1/mhs-1/file.pdf", 3600);

      expect(result).toBe("https://signed.storage/file.pdf?token=abc");
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        "kelas-1/mhs-1/file.pdf",
        3600,
      );
    });

    it("should use default expiry time", async () => {
      const mockStorage = {
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await getLaporanSignedUrl("kelas-1/mhs-1/file.pdf");

      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        "kelas-1/mhs-1/file.pdf",
        3600,
      );
    });

    it("should handle signed URL errors", async () => {
      const mockStorage = {
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Failed to create signed URL" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await expect(
        getLaporanSignedUrl("kelas-1/mhs-1/file.pdf"),
      ).rejects.toThrow("Gagal mendapatkan URL download");
    });

    it("should download file directly", async () => {
      const mockBlob = new Blob(["file content"], { type: "application/pdf" });

      const mockStorage = {
        download: vi.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await downloadLaporan("kelas-1/mhs-1/file.pdf");

      expect(result).toBeInstanceOf(Blob);
      expect(mockStorage.download).toHaveBeenCalledWith(
        "kelas-1/mhs-1/file.pdf",
      );
    });

    it("should handle download errors", async () => {
      const mockStorage = {
        download: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Download failed" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await expect(downloadLaporan("kelas-1/mhs-1/file.pdf")).rejects.toThrow(
        "Gagal mendownload file",
      );
    });
  });

  // ==============================================================================
  // DELETE OPERATIONS
  // ==============================================================================

  describe("Delete Operations", () => {
    it("should delete file successfully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const mockStorage = {
        remove: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await deleteLaporan("kelas-1/mhs-1/file.pdf");

      expect(mockStorage.remove).toHaveBeenCalledWith([
        "kelas-1/mhs-1/file.pdf",
      ]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "🗑️ File deleted:",
        "kelas-1/mhs-1/file.pdf",
      );

      consoleSpy.mockRestore();
    });

    it("should handle delete errors", async () => {
      const mockStorage = {
        remove: vi.fn().mockResolvedValue({
          error: { message: "Delete failed" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await expect(deleteLaporan("kelas-1/mhs-1/file.pdf")).rejects.toThrow(
        "Gagal menghapus file",
      );
    });
  });

  // ==============================================================================
  // LIST FILES
  // ==============================================================================

  describe("List Files", () => {
    it("should list all files in attempt folder", async () => {
      const mockFiles = [
        {
          name: "laporan1.pdf",
          metadata: { size: 1024 },
          created_at: "2025-01-21T10:00:00Z",
        },
        {
          name: "laporan2.pdf",
          metadata: { size: 2048 },
          created_at: "2025-01-21T11:00:00Z",
        },
      ];

      const mockStorage = {
        list: vi.fn().mockResolvedValue({
          data: mockFiles,
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await listLaporanFiles("kelas-1", "mhs-1", "attempt-1");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("laporan1.pdf");
      expect(result[0].size).toBe(1024);
    });

    it("should handle files without metadata size", async () => {
      const mockFiles = [
        {
          name: "laporan.pdf",
          created_at: "2025-01-21T10:00:00Z",
        },
      ];

      const mockStorage = {
        list: vi.fn().mockResolvedValue({
          data: mockFiles,
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await listLaporanFiles("kelas-1", "mhs-1", "attempt-1");

      expect(result[0].size).toBe(0);
    });

    it("should handle list errors", async () => {
      const mockStorage = {
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "List failed" },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      await expect(
        listLaporanFiles("kelas-1", "mhs-1", "attempt-1"),
      ).rejects.toThrow("Gagal mengambil daftar file");
    });

    it("should return empty array if no files", async () => {
      const mockStorage = {
        list: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await listLaporanFiles("kelas-1", "mhs-1", "attempt-1");

      expect(result).toEqual([]);
    });
  });

  // ==============================================================================
  // PATH EXTRACTION HELPER
  // ==============================================================================

  describe("extractPathFromUrl", () => {
    it("should extract path from signed URL", () => {
      const url =
        "https://xyz.supabase.co/storage/v1/object/sign/laporan/kelas-1/mhs-1/file.pdf?token=abc";

      const result = extractPathFromUrl(url);

      expect(result).toBe("laporan/kelas-1/mhs-1/file.pdf");
    });

    it("should extract path from public URL", () => {
      const url =
        "https://xyz.supabase.co/storage/v1/object/public/laporan/kelas-1/mhs-1/file.pdf";

      const result = extractPathFromUrl(url);

      expect(result).toBe("laporan/kelas-1/mhs-1/file.pdf");
    });

    it("should handle URL with query params", () => {
      const url =
        "https://xyz.supabase.co/storage/v1/object/sign/laporan/file.pdf?token=abc&expires=123";

      const result = extractPathFromUrl(url);

      expect(result).toBe("laporan/file.pdf");
    });

    it("should return null for invalid URL", () => {
      const url = "https://example.com/not-a-storage-url";

      const result = extractPathFromUrl(url);

      expect(result).toBeNull();
    });

    it("should return path if already a path", () => {
      const path = "laporan/kelas-1/mhs-1/file.pdf";

      const result = extractPathFromUrl(path);

      expect(result).toBe("laporan/kelas-1/mhs-1/file.pdf");
    });

    it("should return null for empty string", () => {
      const result = extractPathFromUrl("");

      expect(result).toBeNull();
    });
  });

  // ==============================================================================
  // EDGE CASES
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle file with extension in caps", async () => {
      const mockFile = createMockFile("LAPORAN.PDF", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "LAPORAN.PDF" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should handle file with multiple dots in name", async () => {
      const mockFile = createMockFile(
        "laporan.v2.final.pdf",
        1024,
        "application/pdf",
      );

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should handle very long filename", async () => {
      const longName = "a".repeat(300) + ".pdf";
      const mockFile = createMockFile(longName, 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      expect(result).toBeDefined();
    });

    it("should handle special characters in kelasId, mahasiswaId, attemptId", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const result = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1 & test",
        mahasiswaId: "mhs-1@test",
        attemptId: "attempt@1",
      });

      expect(result).toBeDefined();
    });

    it("should handle concurrent uploads", async () => {
      const mockFiles = [
        createMockFile("file1.pdf", 1024, "application/pdf"),
        createMockFile("file2.pdf", 1024, "application/pdf"),
        createMockFile("file3.pdf", 1024, "application/pdf"),
      ];

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({
          data: { path: "file.pdf" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "url" } }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: "signed-url" },
          error: null,
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorage);

      const results = await Promise.all(
        mockFiles.map((file) =>
          uploadLaporan({
            file,
            kelasId: "kelas-1",
            mahasiswaId: "mhs-1",
            attemptId: "attempt-1",
          }),
        ),
      );

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete upload → download → delete workflow", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      let callCount = 0;
      (supabase.storage.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Upload
          return {
            upload: vi.fn().mockResolvedValue({
              data: { path: "kelas-1/mhs-1/attempt-1/file.pdf" },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // Get public URL
          return {
            getPublicUrl: vi
              .fn()
              .mockReturnValue({ data: { publicUrl: "url" } }),
          };
        } else if (callCount === 3) {
          // Create signed URL (for uploadLaporan)
          return {
            createSignedUrl: vi.fn().mockResolvedValue({
              data: { signedUrl: "signed-url" },
              error: null,
            }),
          };
        } else if (callCount === 4) {
          // Create signed URL (for getLaporanSignedUrl)
          return {
            createSignedUrl: vi.fn().mockResolvedValue({
              data: { signedUrl: "signed-url" },
              error: null,
            }),
          };
        } else {
          // Delete
          return {
            remove: vi.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      // Upload
      const uploadResult = await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });
      expect(uploadResult.path).toBeDefined();

      // Get signed URL
      const signedUrl = await getLaporanSignedUrl(uploadResult.path);
      expect(signedUrl).toContain("signed-url");

      // Delete
      await deleteLaporan(uploadResult.path);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle upload with list files", async () => {
      const mockFile = createMockFile("laporan.pdf", 1024, "application/pdf");

      let callCount = 0;
      (supabase.storage.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Upload
          return {
            upload: vi.fn().mockResolvedValue({
              data: { path: "kelas-1/mhs-1/attempt-1/file.pdf" },
              error: null,
            }),
          };
        } else if (callCount === 2) {
          // Get public URL
          return {
            getPublicUrl: vi
              .fn()
              .mockReturnValue({ data: { publicUrl: "url" } }),
          };
        } else if (callCount === 3) {
          // Create signed URL
          return {
            createSignedUrl: vi.fn().mockResolvedValue({
              data: { signedUrl: "signed-url" },
              error: null,
            }),
          };
        } else {
          // List files
          return {
            list: vi.fn().mockResolvedValue({
              data: [
                {
                  name: "123456_laporan.pdf",
                  metadata: { size: 1024 },
                  created_at: "2025-01-21T10:00:00Z",
                },
              ],
              error: null,
            }),
          };
        }
      });

      // Upload
      await uploadLaporan({
        file: mockFile,
        kelasId: "kelas-1",
        mahasiswaId: "mhs-1",
        attemptId: "attempt-1",
      });

      // List files
      const files = await listLaporanFiles("kelas-1", "mhs-1", "attempt-1");
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe("123456_laporan.pdf");
    });
  });
});
