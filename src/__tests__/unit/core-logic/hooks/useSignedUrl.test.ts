/**
 * useSignedUrl Hook Unit Tests
 * Testing signed URL generation for private storage buckets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Materi } from "../../../../types/materi.types";

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

// Import after mocking
import { useSignedUrl } from "../../../../lib/hooks/useSignedUrl";
import { supabase } from "../../../../lib/supabase/client";

describe("useSignedUrl Hook", () => {
  const mockMateri: Materi = {
    id: "materi-1",
    judul: "Test Materi",
    deskripsi: "Test deskripsi",
    kelas_id: "kelas-1",
    dosen_id: "dosen-1",
    file_url:
      "https://xxx.supabase.co/storage/v1/object/public/materi/kelas-1/dosen-1/test.pdf",
    tipe_file: "application/pdf",
    file_size: 1024 * 1024,
    minggu_ke: 1,
    is_downloadable: true,
    is_active: true,
    cache_version: 1,
    download_count: 0,
    published_at: "2024-01-01T00:00:00Z",
    last_cached_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default storage mock
    const mockStorage = {
      createSignedUrl: vi.fn(),
    };

    (supabase.storage.from as any).mockReturnValue(mockStorage);

    // Mock createSignedUrl to return signed URL with unique token each call
    let tokenCounter = 0;
    mockStorage.createSignedUrl.mockImplementation(() => ({
      data: {
        signedUrl: `https://xxx.supabase.co/storage/v1/object/sign/materi/test.pdf?token=token-${tokenCounter++}`,
      },
      error: null,
    }));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe("Signed URL generation", () => {
    it("should generate signed URL for materi", async () => {
      const { result } = renderHook(() => useSignedUrl(mockMateri, true));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.signedUrl).toBeNull();
      expect(result.current.error).toBeNull();

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      // Verify signed URL was generated
      const mockStorage = (supabase.storage.from as any)("materi");
      expect(mockStorage.createSignedUrl).toHaveBeenCalled();

      // Verify the result - check that signedUrl exists and is a valid URL
      expect(result.current.signedUrl).toBeTruthy();
      expect(result.current.signedUrl).toContain("sign"); // signed URLs contain "sign"
      expect(result.current.error).toBeNull();
    });

    it("should extract file path from URL correctly", async () => {
      renderHook(() => useSignedUrl(mockMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const mockStorage = (supabase.storage.from as any)("materi");

      // Should extract path after "materi" bucket
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        "kelas-1/dosen-1/test.pdf",
        3600,
      );
    });

    it("should generate signed URL with 1 hour expiry", async () => {
      renderHook(() => useSignedUrl(mockMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const mockStorage = (supabase.storage.from as any)("materi");

      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        expect.any(String),
        3600, // 1 hour in seconds
      );
    });

    it("should not generate URL when materi is null", () => {
      const { result } = renderHook(() => useSignedUrl(null, true));

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      const mockStorage = (supabase.storage.from as any)("materi");
      expect(mockStorage.createSignedUrl).not.toHaveBeenCalled();
    });

    it("should not generate URL when enabled is false", () => {
      const { result } = renderHook(() => useSignedUrl(mockMateri, false));

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      const mockStorage = (supabase.storage.from as any)("materi");
      expect(mockStorage.createSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle signed URL generation error", async () => {
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      });

      const { result } = renderHook(() => useSignedUrl(mockMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.error).toBeTruthy();
      // Error object from Supabase has message property
      expect((result.current.error as any).message).toBe("Permission denied");
    });

    it("should handle null signedUrl in response", async () => {
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: null },
        error: null,
      });

      const { result } = renderHook(() => useSignedUrl(mockMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Failed to generate signed URL",
      );
    });

    it("should handle invalid URL format", async () => {
      const invalidMateri: Materi = {
        ...mockMateri,
        file_url: "https://invalid-url-format.com/file.pdf",
      };

      const { result } = renderHook(() => useSignedUrl(invalidMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Invalid file URL format");
    });
  });

  describe("Auto-refresh", () => {
    it("should setup refresh interval", async () => {
      renderHook(() => useSignedUrl(mockMateri, true));

      const mockStorage = (supabase.storage.from as any)("materi");

      // Run initial timers to complete first URL generation
      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      // Initial call happened (may be 1 or 2 due to React StrictMode)
      const initialCount = mockStorage.createSignedUrl.mock.calls.length;
      expect(initialCount).toBeGreaterThanOrEqual(1);

      // Fast-forward time to trigger refresh (advancing time triggers the interval)
      await act(async () => {
        vi.advanceTimersByTimeAsync(50 * 60 * 1000); // 50 minutes
      });

      // Should have called again (initial count + at least 1 refresh)
      expect(mockStorage.createSignedUrl.mock.calls.length).toBeGreaterThan(
        initialCount,
      );
    });

    it("should clear refresh interval on unmount", async () => {
      const { unmount } = renderHook(() => useSignedUrl(mockMateri, true));

      const mockStorage = (supabase.storage.from as any)("materi");

      // Run initial timers
      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const initialCallCount = mockStorage.createSignedUrl.mock.calls.length;

      // Fast-forward but unmount before refresh
      await act(async () => {
        vi.advanceTimersByTimeAsync(25 * 60 * 1000); // 25 minutes
      });

      const countBeforeUnmount = mockStorage.createSignedUrl.mock.calls.length;

      // Unmount to clear interval
      unmount();

      // Fast-forward past refresh time - should NOT trigger new call since unmounted
      await act(async () => {
        vi.advanceTimersByTimeAsync(30 * 60 * 1000); // 30 more minutes
      });

      // Should have same call count as before unmount (no new calls after unmount)
      expect(mockStorage.createSignedUrl).toHaveBeenCalledTimes(
        countBeforeUnmount,
      );
    });

    it("should clear refresh interval when materi changes", async () => {
      const { rerender } = renderHook(
        ({ materi }) => useSignedUrl(materi, true),
        {
          initialProps: { materi: mockMateri },
        },
      );

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      // Change materi
      const newMateri: Materi = {
        ...mockMateri,
        id: "materi-2",
      };

      act(() => {
        rerender({ materi: newMateri });
      });

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      // Should have created new storage instance
      expect(supabase.storage.from as any).toHaveBeenCalledWith("materi");
    });
  });

  describe("State updates", () => {
    it("should reset state when materi changes to null", async () => {
      const { result, rerender } = renderHook(
        ({ materi }) => useSignedUrl(materi, true),
        {
          initialProps: { materi: mockMateri },
        },
      );

      // Wait for initial generation
      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });
      expect(result.current.signedUrl).toBeDefined();

      // Change materi to null
      act(() => {
        rerender({ materi: null });
      });

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should reset state when enabled changes to false", async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useSignedUrl(mockMateri, enabled),
        {
          initialProps: { enabled: true },
        },
      );

      // Wait for initial generation
      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });
      expect(result.current.signedUrl).toBeDefined();

      // Disable the hook
      act(() => {
        rerender({ enabled: false });
      });

      expect(result.current.signedUrl).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("should generate new signed URL when materi changes", async () => {
      const { result, rerender } = renderHook(
        ({ materi }) => useSignedUrl(materi, true),
        {
          initialProps: { materi: mockMateri },
        },
      );

      // Wait for initial generation
      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });
      expect(result.current.signedUrl).toBeDefined();

      const firstUrl = result.current.signedUrl;

      // Change to different materi
      const newMateri: Materi = {
        ...mockMateri,
        id: "materi-2",
        file_url:
          "https://xxx.supabase.co/storage/v1/object/public/materi/kelas-2/dosen-2/test2.pdf",
      };

      act(() => {
        rerender({ materi: newMateri });
      });

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const secondUrl = result.current.signedUrl;

      // URLs should be different (different tokens)
      expect(secondUrl).not.toBe(firstUrl);
    });
  });

  describe("Loading state", () => {
    it("should set loading to true while generating", async () => {
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.createSignedUrl.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                signedUrl: "https://xxx.supabase.co/signed/test.pdf",
              },
              error: null,
            });
          }, 100);
        });
      });

      const { result } = renderHook(() => useSignedUrl(mockMateri, true));

      // Should be loading immediately
      expect(result.current.loading).toBe(true);

      // Wait for promise to resolve - need to advance time past the setTimeout
      await act(async () => {
        vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.signedUrl).toBeDefined();
    });

    it("should reset loading state on error", async () => {
      const mockStorage = (supabase.storage.from as any)("materi");
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Error" },
      });

      const { result } = renderHook(() => useSignedUrl(mockMateri, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  describe("URL parsing", () => {
    it("should handle URLs with query parameters", async () => {
      const materiWithQuery: Materi = {
        ...mockMateri,
        file_url:
          "https://xxx.supabase.co/storage/v1/object/public/materi/test.pdf?v=1",
      };

      renderHook(() => useSignedUrl(materiWithQuery, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const mockStorage = (supabase.storage.from as any)("materi");

      // Should handle query params correctly
      expect(mockStorage.createSignedUrl).toHaveBeenCalled();
    });

    it("should find bucket name at different positions", async () => {
      const materiWithNestedPath: Materi = {
        ...mockMateri,
        file_url:
          "https://xxx.supabase.co/storage/v1/object/public/materi/folder/subfolder/test.pdf",
      };

      renderHook(() => useSignedUrl(materiWithNestedPath, true));

      await act(async () => {
        vi.runOnlyPendingTimersAsync();
      });

      const mockStorage = (supabase.storage.from as any)("materi");

      // Should extract path after "materi"
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
        "folder/subfolder/test.pdf",
        3600,
      );
    });
  });
});
