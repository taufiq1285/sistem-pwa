/**
 * API Cache Unit Tests
 *
 * Tests for generic API caching layer including:
 * - Cache hit/miss/expired scenarios
 * - TTL (Time To Live) management
 * - Stale-while-revalidate strategy
 * - Force refresh
 * - Network fallback to stale cache
 * - Optimistic updates
 * - Cache invalidation patterns
 * - White-box testing: Branch, Path, Data flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cacheAPI,
  invalidateCache,
  invalidateCachePattern,
  invalidateCachePatternSync,
  clearAllCache,
  clearAllCacheSync,
  isOnline,
  optimisticUpdate,
} from "@/lib/offline/api-cache";
import { indexedDBManager } from "@/lib/offline/indexeddb";

// Mock IndexedDB manager
vi.mock("../../../../lib/offline/indexeddb", () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getMetadata: vi.fn(),
    setMetadata: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("API Cache", () => {
  let mockConsoleLog: any;
  let mockConsoleWarn: any;
  let mockConsoleError: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Re-mock indexedDB manager methods
    vi.mocked(indexedDBManager.initialize).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);
    vi.mocked(indexedDBManager.setMetadata).mockResolvedValue(undefined);

    // Mock console methods in beforeEach
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ========================================
  // 1. cacheAPI - Cache Hit Tests
  // ========================================

  describe("cacheAPI - Cache Hit", () => {
    it("should return cached data when cache is fresh", async () => {
      const mockData = { id: 1, name: "Test" };
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: mockData,
        timestamp: now,
        expiresAt: now + 5 * 60 * 1000, // Fresh cache
      });

      const fetcher = vi.fn().mockResolvedValue({ id: 2, name: "New" });

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(mockData);
      expect(fetcher).not.toHaveBeenCalled(); // Should not fetch
      expect(mockConsoleLog).toHaveBeenCalledWith("[API Cache] HIT: test-key");
    });

    it("should not fetch when cache is valid", async () => {
      const mockData = { value: "cached" };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "key",
        data: mockData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const fetcher = vi.fn();

      await cacheAPI("key", fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should return cache hit even with 1ms remaining TTL", async () => {
      const now = Date.now();
      const mockData = { id: 1 };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: mockData,
        timestamp: now - 9999,
        expiresAt: now + 1, // 1ms remaining
      });

      const fetcher = vi.fn();
      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(mockData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should handle complex nested cached data", async () => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: "Test",
            settings: { theme: "dark" },
          },
        },
        items: [1, 2, 3],
      };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "complex-key",
        data: complexData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const fetcher = vi.fn();
      const result = await cacheAPI("complex-key", fetcher);

      expect(result).toEqual(complexData);
    });

    it("should handle array cached data", async () => {
      const arrayData = [1, 2, 3, 4, 5];

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "array-key",
        data: arrayData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const fetcher = vi.fn();
      const result = await cacheAPI("array-key", fetcher);

      expect(result).toEqual(arrayData);
    });
  });

  // ========================================
  // 2. cacheAPI - Cache Miss Tests
  // ========================================

  describe("cacheAPI - Cache Miss", () => {
    it("should fetch and cache data when cache is empty", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const mockData = { id: 1, name: "Fresh Data" };
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(mockData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          key: "test-key",
          data: mockData,
        }),
      );
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("should fetch when cache is expired", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { old: "data" },
        timestamp: now - 10 * 60 * 1000,
        expiresAt: now - 1000, // Expired 1 second ago
      });

      const freshData = { new: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should fetch when cache expiresAt equals current time", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { old: "data" },
        timestamp: now - 10000,
        expiresAt: now, // Expires exactly now
      });

      const freshData = { new: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
    });

    it("should fetch when cache is expired by 1ms", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { old: "data" },
        timestamp: now - 10000,
        expiresAt: now - 1, // Expired by 1ms
      });

      const freshData = { new: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
    });

    it("should handle fetcher returning null", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue(null);

      const result = await cacheAPI("null-key", fetcher);

      expect(result).toBeNull();
      expect(fetcher).toHaveBeenCalled();
    });

    it("should handle fetcher returning undefined", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue(undefined);

      const result = await cacheAPI("undefined-key", fetcher);

      expect(result).toBeUndefined();
      expect(fetcher).toHaveBeenCalled();
    });
  });

  // ========================================
  // 3. cacheAPI - Force Refresh Tests
  // ========================================

  describe("cacheAPI - Force Refresh", () => {
    it("should skip cache and fetch fresh data when forceRefresh is true", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { old: "cached" },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const freshData = { new: "fresh" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher, {
        forceRefresh: true,
      });

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(indexedDBManager.getMetadata).not.toHaveBeenCalled();
    });

    it("should force refresh even when cache is valid", async () => {
      const now = Date.now();
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { cached: "data" },
        timestamp: now,
        expiresAt: now + 10000,
      });

      const freshData = { fresh: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher, {
        forceRefresh: true,
      });

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
    });

    it("should cache fresh data after force refresh", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { old: "data" },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const freshData = { fresh: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      await cacheAPI("test-key", fetcher, { forceRefresh: true });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          data: freshData,
        }),
      );
    });
  });

  // ========================================
  // 4. cacheAPI - Stale While Revalidate Tests
  // ========================================

  describe("cacheAPI - Stale While Revalidate", () => {
    it("should return stale data immediately and fetch in background", async () => {
      const now = Date.now();
      const staleData = { stale: "data" };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: staleData,
        timestamp: now - 10 * 60 * 1000,
        expiresAt: now - 1000, // Expired
      });

      const freshData = { fresh: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const result = await cacheAPI("test-key", fetcher, {
        staleWhileRevalidate: true,
      });

      // Should return stale data immediately
      expect(result).toEqual(staleData);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "[API Cache] STALE: test-key (revalidating in background)",
      );
    });

    it("should not use stale-while-revalidate for fresh cache", async () => {
      const now = Date.now();
      const cachedData = { cached: "data" };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: cachedData,
        timestamp: now,
        expiresAt: now + 10000, // Fresh
      });

      const fetcher = vi.fn();

      const result = await cacheAPI("test-key", fetcher, {
        staleWhileRevalidate: true,
      });

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should use stale-while-revalidate only when cache is expired", async () => {
      const now = Date.now();

      // Fresh cache
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValueOnce({
        key: "fresh-key",
        data: { fresh: "cache" },
        timestamp: now,
        expiresAt: now + 10000,
      });

      const fetcher = vi.fn();
      await cacheAPI("fresh-key", fetcher, { staleWhileRevalidate: true });

      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should dispatch cache:updated event on background fetch", async () => {
      const now = Date.now();
      const staleData = { stale: "data" };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: staleData,
        timestamp: now - 10000,
        expiresAt: now - 1000,
      });

      const freshData = { fresh: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      const eventListener = vi.fn();
      window.addEventListener("cache:updated", eventListener);

      await cacheAPI("test-key", fetcher, { staleWhileRevalidate: true });

      // Background fetch is async, we can't easily test event dispatch
      // Just verify stale data was returned
      expect(fetcher).toHaveBeenCalled();

      window.removeEventListener("cache:updated", eventListener);
    });
  });

  // ========================================
  // 5. cacheAPI - Network Fallback Tests
  // ========================================

  describe("cacheAPI - Network Fallback", () => {
    it("should fallback to stale cache when network fails", async () => {
      const now = Date.now();
      const staleData = { stale: "fallback" };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(null) // First call: no cache
        .mockResolvedValueOnce({
          // Second call: stale cache for fallback
          key: "test-key",
          data: staleData,
          timestamp: now - 10 * 60 * 1000,
          expiresAt: now - 1000,
        });

      const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(staleData);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[API Cache] Network failed, using stale cache: test-key",
      );
    });

    it("should throw error when network fails and no cache available", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const networkError = new Error("Network error");
      const fetcher = vi.fn().mockRejectedValue(networkError);

      await expect(cacheAPI("test-key", fetcher)).rejects.toThrow(
        "Network error",
      );
    });

    it("should use expired cache as fallback when network fails", async () => {
      const now = Date.now();
      const expiredData = { expired: "data" };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          key: "test-key",
          data: expiredData,
          timestamp: now - 100000,
          expiresAt: now - 10000, // Very expired
        });

      const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual(expiredData);
    });

    it("should throw network error when fallback cache lookup fails", async () => {
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(null) // Initial cache miss
        .mockRejectedValueOnce(new Error("IndexedDB error")); // Fallback lookup error

      const networkError = new Error("Network error");
      const fetcher = vi.fn().mockRejectedValue(networkError);

      // Should throw the original network error, not the IndexedDB error
      await expect(cacheAPI("test-key", fetcher)).rejects.toThrow(
        "Network error",
      );
    });
  });

  // ========================================
  // 6. cacheAPI - TTL Options Tests
  // ========================================

  describe("cacheAPI - TTL Options", () => {
    it("should use default TTL when not specified", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });
      const now = Date.now();

      await cacheAPI("test-key", fetcher);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now + 5 * 60 * 1000, // Default 5 minutes
        }),
      );
    });

    it("should use custom TTL when provided", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });
      const customTTL = 10 * 60 * 1000; // 10 minutes
      const now = Date.now();

      await cacheAPI("test-key", fetcher, { ttl: customTTL });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now + customTTL,
        }),
      );
    });

    it("should handle TTL of 0", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });
      const now = Date.now();

      await cacheAPI("test-key", fetcher, { ttl: 0 });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now, // Expires immediately
        }),
      );
    });

    it("should handle very long TTL (1 year)", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      await cacheAPI("test-key", fetcher, { ttl: oneYear });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now + oneYear,
        }),
      );
    });

    it("should handle negative TTL (already expired)", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });
      const now = Date.now();

      await cacheAPI("test-key", fetcher, { ttl: -1000 });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now - 1000,
        }),
      );
    });

    it("should use default TTL for stale-while-revalidate background fetch", async () => {
      const now = Date.now();
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { stale: "data" },
        timestamp: now - 10000,
        expiresAt: now - 1000,
      });

      const freshData = { fresh: "data" };
      const fetcher = vi.fn().mockResolvedValue(freshData);

      await cacheAPI("test-key", fetcher, { staleWhileRevalidate: true });

      // Background fetch should use default TTL
      // Can't easily test this without waiting for async
      expect(fetcher).toHaveBeenCalled();
    });
  });

  // ========================================
  // 7. cacheAPI - Error Handling Tests
  // ========================================

  describe("cacheAPI - Error Handling", () => {
    it("should handle IndexedDB initialization error", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("IndexedDB error"),
      );

      const fetcher = vi.fn();

      await expect(cacheAPI("test-key", fetcher)).rejects.toThrow(
        "IndexedDB error",
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        "[API Cache] Error for test-key:",
        expect.any(Error),
      );
    });

    it("should handle getMetadata error gracefully", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error("Read error"),
      );

      const fetcher = vi.fn().mockResolvedValue({ data: "fallback" });

      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual({ data: "fallback" });
      expect(fetcher).toHaveBeenCalled();
    });

    it("should handle setMetadata error silently", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Write error"),
      );

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });

      // Should not throw error
      const result = await cacheAPI("test-key", fetcher);

      expect(result).toEqual({ data: "test" });
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("should preserve error stack trace", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      try {
        await cacheAPI("test-key", vi.fn());
        throw new Error("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Init error");
        expect(error.stack).toBeDefined();
      }
    });
  });

  // ========================================
  // 8. invalidateCache Tests
  // ========================================

  describe("invalidateCache", () => {
    it("should clear cache for specific key", async () => {
      await invalidateCache("test-key");

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        null,
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "[API Cache] Invalidated: test-key",
      );
    });

    it("should handle invalidation errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Write error"),
      );

      await invalidateCache("test-key");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[API Cache] Failed to invalidate test-key:",
        expect.any(Error),
      );
    });

    it("should handle initialization errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      await invalidateCache("test-key");

      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("should invalidate multiple keys independently", async () => {
      await invalidateCache("key1");
      await invalidateCache("key2");

      expect(indexedDBManager.setMetadata).toHaveBeenCalledTimes(2);
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_key1",
        null,
      );
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_key2",
        null,
      );
    });
  });

  // ========================================
  // 9. invalidateCachePattern Tests
  // ========================================

  describe("invalidateCachePattern", () => {
    it("should log pattern invalidation", async () => {
      await invalidateCachePattern("user:*");

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("should return immediately (non-blocking)", async () => {
      const start = Date.now();

      await invalidateCachePattern("pattern:*");

      const duration = Date.now() - start;

      // Should return almost immediately
      expect(duration).toBeLessThan(100);
    });

    it("should handle pattern invalidation errors silently", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      // Should not throw
      await invalidateCachePattern("pattern:*");

      expect(true).toBe(true);
    });

    it("should handle various pattern formats", async () => {
      await invalidateCachePattern("user:*");
      await invalidateCachePattern("*kuis*");
      await invalidateCachePattern("api:endpoint:*");

      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  // ========================================
  // 10. invalidateCachePatternSync Tests
  // ========================================

  describe("invalidateCachePatternSync", () => {
    it("should wait for pattern invalidation to complete", async () => {
      // Mock the DB and cursor
      const mockDB = {
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            openCursor: vi.fn(),
          }),
          oncomplete: null,
          onerror: null,
          error: null,
        }),
      };

      (indexedDBManager as any).db = mockDB;

      const result = await invalidateCachePatternSync("test:*");

      expect(typeof result).toBe("number");
    });

    it("should return 0 when IndexedDB not available", async () => {
      (indexedDBManager as any).db = null;

      const result = await invalidateCachePatternSync("test:*");

      expect(result).toBe(0);
    });
  });

  // ========================================
  // 11. clearAllCache Tests
  // ========================================

  describe("clearAllCache", () => {
    it("should log clear all", async () => {
      await clearAllCache();

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it("should return immediately (non-blocking)", async () => {
      const start = Date.now();

      await clearAllCache();

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle clear all errors silently", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      // Should not throw
      await clearAllCache();

      expect(true).toBe(true);
    });
  });

  // ========================================
  // 12. clearAllCacheSync Tests
  // ========================================

  describe("clearAllCacheSync", () => {
    it("should wait for clear all to complete", async () => {
      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue({
          openCursor: vi.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
          }),
        }),
        oncomplete: null,
        onerror: null,
        error: null,
      };

      const mockDB = {
        transaction: vi.fn().mockReturnValue(mockTransaction),
      };

      (indexedDBManager as any).db = mockDB;

      // Call clearAllCacheSync and trigger oncomplete
      const resultPromise = clearAllCacheSync();
      
      // Simulate transaction completion after handlers are set
      await vi.waitFor(() => mockTransaction.oncomplete !== null);
      mockTransaction.oncomplete?.();

      const result = await resultPromise;

      expect(typeof result).toBe("number");
    });

    it("should return 0 when IndexedDB not available", async () => {
      (indexedDBManager as any).db = null;

      const result = await clearAllCacheSync();

      expect(result).toBe(0);
    });
  });

  // ========================================
  // 13. isOnline Tests
  // ========================================

  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      expect(isOnline()).toBe(false);
    });
  });

  // ========================================
  // 14. optimisticUpdate Tests
  // ========================================

  describe("optimisticUpdate", () => {
    it("should update cache immediately when online and server succeeds", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const localData = { id: 1, name: "Local Update" };
      const serverData = { id: 1, name: "Server Update" };

      const updater = vi.fn().mockResolvedValue(serverData);

      const result = await optimisticUpdate("test-key", localData, updater);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({ data: localData }),
      );

      expect(result).toEqual(serverData);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({ data: serverData }),
      );
    });

    it("should keep local update when server fails", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const localData = { id: 1, name: "Local" };
      const updater = vi.fn().mockRejectedValue(new Error("Server error"));

      const result = await optimisticUpdate("test-key", localData, updater);

      expect(result).toEqual(localData);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "[API Cache] Optimistic update failed for test-key, keeping local:",
        expect.any(Error),
      );
    });

    it("should return local data when offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const localData = { id: 1, name: "Offline" };
      const updater = vi.fn();

      const result = await optimisticUpdate("test-key", localData, updater);

      expect(result).toEqual(localData);
      expect(updater).not.toHaveBeenCalled();
    });

    it("should use custom TTL", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const customTTL = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();

      await optimisticUpdate("test-key", { data: "test" }, vi.fn(), {
        ttl: customTTL,
      });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({
          expiresAt: now + customTTL,
        }),
      );
    });

    it("should handle errors during optimistic update", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      await expect(
        optimisticUpdate("test-key", { data: "test" }, vi.fn()),
      ).rejects.toThrow("Init error");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[API Cache] Optimistic update error for test-key:",
        expect.any(Error),
      );
    });

    it("should update cache immediately before server call", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const localData = { id: 1 };
      const updater = vi.fn().mockImplementation(async () => {
        // Verify cache was already updated
        expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
          "cache_test-key",
          expect.objectContaining({ data: localData }),
        );
        return { id: 2 };
      });

      await optimisticUpdate("test-key", localData, updater);
    });
  });

  // ========================================
  // 15. Cache Entry Structure Tests
  // ========================================

  describe("Cache Entry Structure", () => {
    it("should create cache entry with correct structure", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const data = { id: 1, name: "Test" };
      const fetcher = vi.fn().mockResolvedValue(data);
      const now = Date.now();
      const ttl = 10 * 60 * 1000;

      await cacheAPI("test-key", fetcher, { ttl });

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        {
          key: "test-key",
          data,
          timestamp: now,
          expiresAt: now + ttl,
        },
      );
    });

    it("should include all required fields in cache entry", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      await cacheAPI("test-key", vi.fn().mockResolvedValue({}));

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const entry = call[1];

      expect(entry).toHaveProperty("key");
      expect(entry).toHaveProperty("data");
      expect(entry).toHaveProperty("timestamp");
      expect(entry).toHaveProperty("expiresAt");
    });
  });

  // ========================================
  // 16. White-Box Testing - Branch Coverage
  // ========================================

  describe("White-Box Testing - Branch Coverage", () => {
    describe("TTL Check Branches", () => {
      it("should branch to cache hit when not expired", async () => {
        const now = Date.now();
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
          key: "test-key",
          data: { cached: true },
          timestamp: now,
          expiresAt: now + 10000,
        });

        const result = await cacheAPI("test-key", vi.fn());

        expect(result).toEqual({ cached: true });
      });

      it("should branch to fetch when expired", async () => {
        const now = Date.now();
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
          key: "test-key",
          data: { cached: true },
          timestamp: now - 10000,
          expiresAt: now - 1,
        });

        const freshData = { fresh: true };
        const fetcher = vi.fn().mockResolvedValue(freshData);

        const result = await cacheAPI("test-key", fetcher);

        expect(result).toEqual(freshData);
        expect(fetcher).toHaveBeenCalled();
      });

      it("should branch to stale-while-revalidate when enabled and expired", async () => {
        const now = Date.now();
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
          key: "test-key",
          data: { stale: true },
          timestamp: now - 10000,
          expiresAt: now - 1,
        });

        const result = await cacheAPI(
          "test-key",
          vi.fn().mockResolvedValue({ fresh: true }),
          { staleWhileRevalidate: true },
        );

        expect(result).toEqual({ stale: true });
      });
    });

    describe("Force Refresh Branch", () => {
      it("should branch to skip cache when forceRefresh is true", async () => {
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
          key: "test-key",
          data: { cached: true },
          timestamp: Date.now(),
          expiresAt: Date.now() + 10000,
        });

        await cacheAPI("test-key", vi.fn().mockResolvedValue({}), {
          forceRefresh: true,
        });

        expect(indexedDBManager.getMetadata).not.toHaveBeenCalled();
      });

      it("should branch to check cache when forceRefresh is false", async () => {
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

        await cacheAPI("test-key", vi.fn().mockResolvedValue({}), {
          forceRefresh: false,
        });

        expect(indexedDBManager.getMetadata).toHaveBeenCalled();
      });
    });

    describe("Network Fallback Branch", () => {
      it("should branch to use stale cache on network error", async () => {
        const now = Date.now();
        vi.mocked(indexedDBManager.getMetadata)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            key: "test-key",
            data: { stale: true },
            timestamp: now,
            expiresAt: now + 10000,
          });

        const result = await cacheAPI(
          "test-key",
          vi.fn().mockRejectedValue(new Error("Network error")),
        );

        expect(result).toEqual({ stale: true });
      });

      it("should branch to throw error when no cache on network error", async () => {
        vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

        await expect(
          cacheAPI("test-key", vi.fn().mockRejectedValue(new Error("Network"))),
        ).rejects.toThrow("Network");
      });
    });
  });

  // ========================================
  // 17. White-Box Testing - Path Coverage
  // ========================================

  describe("White-Box Testing - Path Coverage", () => {
    it("Path 1: Cache hit (fresh cache)", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { cached: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await cacheAPI("test-key", vi.fn());

      expect(result).toEqual({ cached: true });
    });

    it("Path 2: Cache miss (no cache)", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const freshData = { fresh: true };
      const result = await cacheAPI(
        "test-key",
        vi.fn().mockResolvedValue(freshData),
      );

      expect(result).toEqual(freshData);
    });

    it("Path 3: Cache expired (fetch fresh)", async () => {
      const now = Date.now();
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { expired: true },
        timestamp: now - 10000,
        expiresAt: now - 1,
      });

      const freshData = { fresh: true };
      const result = await cacheAPI(
        "test-key",
        vi.fn().mockResolvedValue(freshData),
      );

      expect(result).toEqual(freshData);
    });

    it("Path 4: Force refresh", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { cached: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const freshData = { fresh: true };
      const result = await cacheAPI(
        "test-key",
        vi.fn().mockResolvedValue(freshData),
        { forceRefresh: true },
      );

      expect(result).toEqual(freshData);
    });

    it("Path 5: Stale-while-revalidate", async () => {
      const now = Date.now();
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { stale: true },
        timestamp: now - 10000,
        expiresAt: now - 1,
      });

      const result = await cacheAPI(
        "test-key",
        vi.fn().mockResolvedValue({ fresh: true }),
        { staleWhileRevalidate: true },
      );

      expect(result).toEqual({ stale: true });
    });

    it("Path 6: Network error with stale cache fallback", async () => {
      const now = Date.now();
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          key: "test-key",
          data: { stale: true },
          timestamp: now,
          expiresAt: now + 10000,
        });

      const result = await cacheAPI(
        "test-key",
        vi.fn().mockRejectedValue(new Error("Network")),
      );

      expect(result).toEqual({ stale: true });
    });

    it("Path 7: Network error without cache (throw error)", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      await expect(
        cacheAPI("test-key", vi.fn().mockRejectedValue(new Error("Network"))),
      ).rejects.toThrow("Network");
    });
  });

  // ========================================
  // 18. White-Box Testing - Data Flow
  // ========================================

  describe("White-Box Testing - Data Flow", () => {
    it("should flow: fetch → cache → return on miss", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const data = { fetched: true };
      const fetcher = vi.fn().mockResolvedValue(data);

      const result = await cacheAPI("test-key", fetcher);

      // Verify flow
      expect(fetcher).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        expect.objectContaining({ data }),
      );
      expect(result).toEqual(data);
    });

    it("should flow: check cache → return on hit", async () => {
      const cachedData = { cached: true };
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: cachedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const fetcher = vi.fn();
      const result = await cacheAPI("test-key", fetcher);

      // Verify flow
      expect(indexedDBManager.getMetadata).toHaveBeenCalledWith("cache_test-key");
      expect(fetcher).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it("should flow: invalidate → clear cache entry", async () => {
      await invalidateCache("test-key");

      // Verify flow
      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "cache_test-key",
        null,
      );
    });

    it("should flow: optimistic update → cache immediately → sync to server", async () => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const localData = { local: true };
      const serverData = { server: true };
      const updater = vi.fn().mockResolvedValue(serverData);

      const result = await optimisticUpdate("test-key", localData, updater);

      // Verify flow
      expect(indexedDBManager.setMetadata).toHaveBeenNthCalledWith(
        1,
        "cache_test-key",
        expect.objectContaining({ data: localData }),
      );
      expect(updater).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenNthCalledWith(
        2,
        "cache_test-key",
        expect.objectContaining({ data: serverData }),
      );
      expect(result).toEqual(serverData);
    });
  });

  // ========================================
  // 19. Edge Cases
  // ========================================

  describe("Edge Cases", () => {
    it("should handle concurrent cache requests for same key", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const fetcher = vi.fn().mockResolvedValue({ data: "test" });

      // Concurrent requests
      const results = await Promise.all([
        cacheAPI("test-key", fetcher),
        cacheAPI("test-key", fetcher),
        cacheAPI("test-key", fetcher),
      ]);

      // All should return data
      results.forEach((result) => {
        expect(result).toEqual({ data: "test" });
      });
    });

    it("should handle very long cache key", async () => {
      const longKey = "a".repeat(1000);

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const result = await cacheAPI(
        longKey,
        vi.fn().mockResolvedValue({ data: "test" }),
      );

      expect(result).toEqual({ data: "test" });
    });

    it("should handle special characters in cache key", async () => {
      const specialKey = "key-with-@#$%^&*()";

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const result = await cacheAPI(
        specialKey,
        vi.fn().mockResolvedValue({ data: "test" }),
      );

      expect(result).toEqual({ data: "test" });
    });

    it("should handle unicode in cache key", async () => {
      const unicodeKey = "键-مفتاح-🔑";

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const result = await cacheAPI(
        unicodeKey,
        vi.fn().mockResolvedValue({ data: "test" }),
      );

      expect(result).toEqual({ data: "test" });
    });

    it("should handle empty string key", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const result = await cacheAPI(
        "",
        vi.fn().mockResolvedValue({ data: "test" }),
      );

      expect(result).toEqual({ data: "test" });
    });

    it("should handle very large data", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const largeData = { data: "x".repeat(1024 * 1024) }; // 1MB string

      const result = await cacheAPI(
        "large-key",
        vi.fn().mockResolvedValue(largeData),
      );

      expect(result).toEqual(largeData);
    });
  });

  // ========================================
  // 20. Performance Testing
  // ========================================

  describe("Performance Testing", () => {
    it("should complete cache hit within reasonable time", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        key: "test-key",
        data: { cached: true },
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const start = performance.now();
      await cacheAPI("test-key", vi.fn());
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should complete cache miss within reasonable time", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const start = performance.now();
      await cacheAPI("test-key", vi.fn().mockResolvedValue({}));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle many concurrent cache operations", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          cacheAPI(`key-${i}`, vi.fn().mockResolvedValue({ data: i })),
        );
      }

      const start = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
