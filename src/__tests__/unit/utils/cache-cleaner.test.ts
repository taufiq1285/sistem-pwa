/**
 * Tests for cache-cleaner.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanupAllCache,
  clearSpecificDatabase,
  clearLocalStorageKeys,
  type CacheCleanupOptions,
} from "@/lib/utils/cache-cleaner";

// Mock the api-cache module
vi.mock("@/lib/offline/api-cache", () => ({
  clearAllCache: vi.fn().mockResolvedValue(undefined),
}));

describe("cache-cleaner", () => {
  let originalIndexedDB: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Save original indexedDB
    originalIndexedDB = (window as any).indexedDB;
  });

  afterEach(() => {
    // Restore indexedDB after each test
    if (originalIndexedDB) {
      (window as any).indexedDB = originalIndexedDB;
    }
  });

  describe("clearSpecificDatabase", () => {
    it("should resolve when IndexedDB not available", async () => {
      // Mock window without indexedDB property
      delete (window as any).indexedDB;

      const result = clearSpecificDatabase("test-db");

      await expect(result).resolves.toBeUndefined();
    });

    it("should resolve on successful deletion", async () => {
      let successCallback: (() => void) | null = null;

      const mockRequest = {
        error: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      const deleteDatabaseMock = vi.fn(() => mockRequest);

      // Mock indexedDB with deleteDatabase
      (window as any).indexedDB = {
        deleteDatabase: deleteDatabaseMock,
      };

      // Setup mock to capture onsuccess callback
      Object.defineProperty(mockRequest, "onsuccess", {
        set(value: any) {
          successCallback = value;
        },
        get() {
          return successCallback;
        },
      });

      const result = clearSpecificDatabase("test-db");

      // Trigger success after a brief delay
      setTimeout(() => {
        if (successCallback) successCallback();
      }, 10);

      await expect(result).resolves.toBeUndefined();
      expect(deleteDatabaseMock).toHaveBeenCalledWith("test-db");
    });
  });

  describe("clearLocalStorageKeys", () => {
    it("should remove specified keys from localStorage", () => {
      localStorage.setItem("key1", "value1");
      localStorage.setItem("key2", "value2");
      localStorage.setItem("key3", "value3");

      clearLocalStorageKeys(["key1", "key3"]);

      expect(localStorage.getItem("key1")).toBeNull();
      expect(localStorage.getItem("key2")).toBe("value2");
      expect(localStorage.getItem("key3")).toBeNull();
    });

    it("should handle empty array", () => {
      localStorage.setItem("key1", "value1");

      expect(() => clearLocalStorageKeys([])).not.toThrow();
      expect(localStorage.getItem("key1")).toBe("value1");
    });

    it("should handle non-existent keys", () => {
      expect(() => clearLocalStorageKeys(["nonexistent"])).not.toThrow();
    });
  });

  describe("cleanupAllCache", () => {
    it("should accept empty options", async () => {
      const result = cleanupAllCache({});

      await expect(result).resolves.toBeUndefined();
    });

    it("should accept partial options", async () => {
      const options: CacheCleanupOptions = {
        clearIndexedDB: false,
        clearLocalStorage: true,
      };

      const result = cleanupAllCache(options);

      await expect(result).resolves.toBeUndefined();
    });

    it("should accept all options", async () => {
      const options: CacheCleanupOptions = {
        clearIndexedDB: true,
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearServiceWorkerCache: true,
        clearCookies: false,
      };

      const result = cleanupAllCache(options);

      await expect(result).resolves.toBeUndefined();
    });

    it("should merge with default options", async () => {
      const result = cleanupAllCache({
        clearCookies: true,
      });

      await expect(result).resolves.toBeUndefined();
    });

    it("should use default options when none provided", async () => {
      const result = cleanupAllCache();

      await expect(result).resolves.toBeUndefined();
    });
  });

  describe("clearSpecificDatabase error handling", () => {
    it("should reject on database deletion error", async () => {
      let errorCallback: (() => void) | null = null;

      const mockRequest = {
        error: new Error("Database error"),
        onsuccess: null as any,
        onerror: null as any,
      };

      const deleteDatabaseMock = vi.fn(() => mockRequest);

      // Mock indexedDB with deleteDatabase
      (window as any).indexedDB = {
        deleteDatabase: deleteDatabaseMock,
      };

      // Setup mock to capture onerror callback
      Object.defineProperty(mockRequest, "onerror", {
        set(value: any) {
          errorCallback = value;
        },
        get() {
          return errorCallback;
        },
      });

      const result = clearSpecificDatabase("test-db");

      // Trigger error after a brief delay
      setTimeout(() => {
        if (errorCallback) errorCallback();
      }, 10);

      // Should reject on error
      await expect(result).rejects.toThrow("Database error");
    });
  });

  describe("clearLocalStorageKeys error handling", () => {
    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw error
      const removeItemSpy = vi
        .spyOn(localStorage, "removeItem")
        .mockImplementation(() => {
          throw new Error("localStorage error");
        });

      expect(() => clearLocalStorageKeys(["key1"])).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });
});
