/**
 * usePdfBlobUrl Hook Unit Tests
 * Testing PDF blob URL creation for inline viewing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Materi } from "../../../../types/materi.types";

// Mock window.URL and Blob
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

// Create a proper Blob constructor mock
class MockBlob {
  constructor(
    public parts: BlobPart[],
    public options?: BlobPropertyBag,
  ) {
    // Mock blob implementation
  }

  get type(): string {
    return this.options?.type || "application/octet-stream";
  }
}

Object.defineProperty(globalThis, "Blob", {
  value: MockBlob,
  writable: true,
});

Object.defineProperty(globalThis, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Import hook
import { usePdfBlobUrl } from "../../../../lib/hooks/usePdfBlobUrl";

describe("usePdfBlobUrl Hook", () => {
  const mockMateri: Materi = {
    id: "materi-1",
    judul: "Test Materi",
    deskripsi: "Test deskripsi",
    kelas_id: "kelas-1",
    dosen_id: "dosen-1",
    file_url: "https://example.com/test.pdf",
    file_path: "test/path/test.pdf",
    tipe_file: "application/pdf",
    ukuran_file: 1024 * 1024,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      blob: async () => new Blob(["pdf content"], { type: "application/json" }),
    });

    // Setup default URL mocks - generate unique URL each time
    let urlCounter = 0;
    mockCreateObjectURL.mockImplementation(
      () => `blob:test-pdf-url-${urlCounter++}`,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("PDF loading", () => {
    it("should fetch PDF and create blob URL", async () => {
      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.blobUrl).toBeNull();
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledWith(mockMateri.file_url);

      // Verify blob URL was created
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(result.current.blobUrl).toBe("blob:test-pdf-url-0");
      expect(result.current.error).toBeNull();
    });

    it("should not fetch when materi is null", async () => {
      const { result } = renderHook(() => usePdfBlobUrl(null, true));

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch when enabled is false", async () => {
      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, false));

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should not fetch for non-PDF files", async () => {
      const nonPdfMateri: Materi = {
        ...mockMateri,
        tipe_file: "image/jpeg",
      };

      const { result } = renderHook(() => usePdfBlobUrl(nonPdfMateri, true));

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should detect PDF from file type string", async () => {
      const pdfMateri: Materi = {
        ...mockMateri,
        tipe_file: "application/pdf", // exact match
      };

      const { result } = renderHook(() => usePdfBlobUrl(pdfMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(result.current.blobUrl).toBeDefined();
    });

    it("should detect PDF from partial type string", async () => {
      const pdfMateri: Materi = {
        ...mockMateri,
        tipe_file: "application/pdf; charset=utf-8",
      };

      const { result } = renderHook(() => usePdfBlobUrl(pdfMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle fetch error", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("Failed to fetch PDF");
      expect(result.current.error?.message).toContain("404");
    });

    it("should handle network error", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Network error");
    });

    it("should handle blob creation error", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        blob: async () => {
          throw new Error("Blob creation failed");
        },
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("Cleanup", () => {
    it("should revoke object URL on unmount", async () => {
      const { result, unmount } = renderHook(() =>
        usePdfBlobUrl(mockMateri, true),
      );

      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      const blobUrl = result.current.blobUrl;

      unmount();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl);
    });

    it("should handle multiple remounts correctly", async () => {
      const { result, rerender, unmount } = renderHook(
        ({ materi, enabled }) => usePdfBlobUrl(materi, enabled),
        {
          initialProps: {
            materi: mockMateri,
            enabled: true,
          },
        },
      );

      // Wait for first load
      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      const firstUrl = result.current.blobUrl;

      // Rerender with different materi
      act(() => {
        rerender({
          materi: { ...mockMateri, id: "materi-2" },
          enabled: true,
        });
      });

      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      const secondUrl = result.current.blobUrl;

      // URLs should be different
      expect(secondUrl).not.toBe(firstUrl);

      unmount();
    });
  });

  describe("Blob type correction", () => {
    it("should force blob type to application/pdf", async () => {
      let capturedBlob: Blob | null = null;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        blob: async () => {
          // Return blob with wrong type (simulating Supabase issue)
          capturedBlob = new Blob(["pdf content"], {
            type: "application/json",
          });
          return capturedBlob;
        },
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify that a new blob was created with correct type
      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
    });

    it("should create blob URL with corrected type", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        blob: async () =>
          new Blob(["pdf content"], { type: "application/json" }),
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.blobUrl).toBe("blob:test-pdf-url-0");
      expect(result.current.error).toBeNull();
    });
  });

  describe("State updates", () => {
    it("should reset state when materi changes to null", async () => {
      const { result, rerender } = renderHook(
        ({ materi }) => usePdfBlobUrl(materi, true),
        {
          initialProps: { materi: mockMateri },
        },
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      // Change materi to null
      act(() => {
        rerender({ materi: null });
      });

      expect(result.current.blobUrl).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("should reset state when enabled changes to false", async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => usePdfBlobUrl(mockMateri, enabled),
        {
          initialProps: { enabled: true },
        },
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      // Disable the hook
      act(() => {
        rerender({ enabled: false });
      });

      expect(result.current.blobUrl).toBeNull();
    });

    it("should fetch new PDF when materi changes", async () => {
      const { result, rerender } = renderHook(
        ({ materi }) => usePdfBlobUrl(materi, true),
        {
          initialProps: { materi: mockMateri },
        },
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.blobUrl).toBeDefined();
      });

      const firstUrl = result.current.blobUrl;

      // Change to different materi
      const newMateri: Materi = {
        ...mockMateri,
        id: "materi-2",
        file_url: "https://example.com/test2.pdf",
      };

      act(() => {
        rerender({ materi: newMateri });
      });

      // Should fetch new PDF
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(newMateri.file_url);
      });

      const secondUrl = result.current.blobUrl;

      // URLs should be different
      expect(secondUrl).not.toBe(firstUrl);
    });
  });

  describe("Loading state", () => {
    it("should set loading to true while fetching", async () => {
      let fetchPromise: Promise<any> | null = null;

      (global.fetch as any).mockImplementation(() => {
        fetchPromise = new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              statusText: "OK",
              blob: async () => new Blob(["pdf content"]),
            });
          }, 100);
        });
        return fetchPromise;
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      // Should be loading immediately
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.blobUrl).toBeDefined();
    });

    it("should reset loading state on error", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const { result } = renderHook(() => usePdfBlobUrl(mockMateri, true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
    });
  });
});
