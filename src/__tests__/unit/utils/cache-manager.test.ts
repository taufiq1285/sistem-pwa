/**
 * Cache Manager Utility Unit Tests
 * Comprehensive tests for cache management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  initializeCacheManager,
  clearAllCache,
  clearEverything,
  getCacheStats,
  debugStorage,
} from "../../../lib/utils/cache-manager";

describe("Cache Manager", () => {
  // Create a proper storage mock that mimics browser behavior
  function createStorageMock() {
    const store: Record<string, string> = {};
    const storage: any = {};

    // Define methods as non-enumerable so Object.keys() only returns storage keys
    // Also configurable so they can be spied on in tests
    Object.defineProperties(storage, {
      getItem: {
        value: (key: string) => store[key] || null,
        enumerable: false,
        configurable: true,
        writable: true,
      },
      setItem: {
        value: (key: string, value: string) => {
          store[key] = value;
          // Also set as enumerable property for Object.keys() to work
          Object.defineProperty(storage, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        },
        enumerable: false,
        configurable: true,
        writable: true,
      },
      removeItem: {
        value: (key: string) => {
          delete store[key];
          delete storage[key];
        },
        enumerable: false,
        configurable: true,
        writable: true,
      },
      clear: {
        value: () => {
          // Remove all enumerable properties
          Object.keys(storage).forEach((key) => delete storage[key]);
          Object.keys(store).forEach((key) => delete store[key]);
        },
        enumerable: false,
        configurable: true,
        writable: true,
      },
      length: {
        get: () => Object.keys(store).length,
        enumerable: false,
        configurable: true,
      },
      key: {
        value: (index: number) => Object.keys(store)[index] || null,
        enumerable: false,
        configurable: true,
        writable: true,
      },
    });

    return storage;
  }

  beforeEach(() => {
    // Setup mocks with fresh instances
    Object.defineProperty(window, "localStorage", {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
      value: createStorageMock(),
      writable: true,
      configurable: true,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initializeCacheManager", () => {
    it("should set app version on first run", () => {
      initializeCacheManager();

      expect(localStorage.getItem("app_version")).toBe("1.0.0");
    });

    it("should clear cache when version changes", () => {
      // Set old version and some data
      localStorage.setItem("app_version", "0.9.0");
      localStorage.setItem("some_data", "old_data");

      initializeCacheManager();

      expect(localStorage.getItem("app_version")).toBe("1.0.0");
      expect(localStorage.getItem("some_data")).toBeNull();
    });

    it("should not clear cache when version is same", () => {
      localStorage.setItem("app_version", "1.0.0");
      localStorage.setItem("some_data", "preserved_data");

      initializeCacheManager();

      expect(localStorage.getItem("some_data")).toBe("preserved_data");
    });

    it("should preserve auth data on version change", () => {
      localStorage.setItem("app_version", "0.9.0");
      localStorage.setItem("auth_cache", "auth_token");
      localStorage.setItem(
        "sb-lqkzhrdhrbexdtrgmogd-auth-token",
        "supabase_token",
      );
      localStorage.setItem("other_data", "will_be_cleared");

      initializeCacheManager();

      expect(localStorage.getItem("auth_cache")).toBe("auth_token");
      expect(localStorage.getItem("sb-lqkzhrdhrbexdtrgmogd-auth-token")).toBe(
        "supabase_token",
      );
      expect(localStorage.getItem("other_data")).toBeNull();
    });

    it("should handle errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock localStorage.getItem to throw error
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(() => initializeCacheManager()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("clearAllCache", () => {
    it("should clear all localStorage except auth", () => {
      localStorage.setItem("auth_cache", "auth_token");
      localStorage.setItem(
        "sb-lqkzhrdhrbexdtrgmogd-auth-token",
        "supabase_token",
      );
      localStorage.setItem("data1", "value1");
      localStorage.setItem("data2", "value2");

      clearAllCache();

      expect(localStorage.getItem("auth_cache")).toBe("auth_token");
      expect(localStorage.getItem("sb-lqkzhrdhrbexdtrgmogd-auth-token")).toBe(
        "supabase_token",
      );
      expect(localStorage.getItem("data1")).toBeNull();
      expect(localStorage.getItem("data2")).toBeNull();
    });

    it("should set app version after clearing", () => {
      clearAllCache();

      expect(localStorage.getItem("app_version")).toBe("1.0.0");
    });

    it("should work when no auth data exists", () => {
      localStorage.setItem("data1", "value1");

      clearAllCache();

      expect(localStorage.getItem("data1")).toBeNull();
      expect(localStorage.getItem("app_version")).toBe("1.0.0");
    });

    it("should handle errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.spyOn(localStorage, "clear").mockImplementation(() => {
        throw new Error("Clear error");
      });

      expect(() => clearAllCache()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("clearEverything", () => {
    it("should clear localStorage", () => {
      localStorage.setItem("data1", "value1");
      localStorage.setItem("auth_cache", "auth_token");

      clearEverything();

      expect(localStorage.length).toBe(0);
    });

    it("should clear sessionStorage", () => {
      sessionStorage.setItem("session_data", "value");

      clearEverything();

      expect(sessionStorage.length).toBe(0);
    });

    it("should clear cookies", () => {
      // Mock document.cookie
      const cookieGetter = vi.fn(() => "test=value; another=data");
      const cookieSetter = vi.fn();

      Object.defineProperty(document, "cookie", {
        get: cookieGetter,
        set: cookieSetter,
        configurable: true,
      });

      clearEverything();

      expect(cookieSetter).toHaveBeenCalled();
    });

    it("should handle errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.spyOn(localStorage, "clear").mockImplementation(() => {
        throw new Error("Clear error");
      });

      expect(() => clearEverything()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("getCacheStats", () => {
    it("should return correct cache statistics", () => {
      localStorage.setItem("app_version", "1.0.0");
      localStorage.setItem("data1", "value1");
      localStorage.setItem("data2", "value2");

      sessionStorage.setItem("session1", "value");

      const stats = getCacheStats();

      expect(stats.version).toBe("1.0.0");
      expect(stats.localStorageKeys).toBe(3);
      expect(stats.sessionStorageKeys).toBe(1);
      expect(stats.localStorageSize).toBeGreaterThan(0);
    });

    it("should return unknown version when not set", () => {
      const stats = getCacheStats();

      expect(stats.version).toBe("unknown");
    });

    it("should handle empty storage", () => {
      const stats = getCacheStats();

      expect(stats.localStorageKeys).toBe(0);
      expect(stats.sessionStorageKeys).toBe(0);
    });

    it("should calculate storage size correctly", () => {
      localStorage.setItem("small", "a");
      localStorage.setItem("large", "a".repeat(1000));

      const stats = getCacheStats();

      // Should be size of 'small' + 'a' + 'large' + 'aaa...' (1000 chars)
      // At minimum should have the 1000 char string
      expect(stats.localStorageSize).toBeGreaterThan(100);
      expect(stats.localStorageSize).toBeLessThan(2000);
    });
  });

  describe("debugStorage", () => {
    it("should log storage information to console", () => {
      const consoleGroupSpy = vi
        .spyOn(console, "group")
        .mockImplementation(() => {});
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleGroupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});

      localStorage.setItem("app_version", "1.0.0");
      localStorage.setItem("data1", "value1");
      sessionStorage.setItem("session1", "value");

      debugStorage();

      expect(consoleGroupSpy).toHaveBeenCalledWith("📦 Storage Debug");
      expect(consoleLogSpy).toHaveBeenCalledWith("Version:", "1.0.0");

      // Check that localStorage keys were logged (order doesn't matter)
      const localStorageCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "localStorage keys:",
      );
      expect(localStorageCall).toBeDefined();
      expect(localStorageCall?.[1]).toEqual(
        expect.arrayContaining(["app_version", "data1"]),
      );

      // Check that sessionStorage keys were logged
      const sessionStorageCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "sessionStorage keys:",
      );
      expect(sessionStorageCall).toBeDefined();
      expect(sessionStorageCall?.[1]).toEqual(
        expect.arrayContaining(["session1"]),
      );

      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it("should handle empty storage", () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      debugStorage();

      // Check that localStorage keys were logged as empty
      const localStorageCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "localStorage keys:",
      );
      expect(localStorageCall).toBeDefined();
      expect(localStorageCall?.[1]).toEqual([]);

      // Check that sessionStorage keys were logged as empty
      const sessionStorageCall = consoleLogSpy.mock.calls.find(
        (call) => call[0] === "sessionStorage keys:",
      );
      expect(sessionStorageCall).toBeDefined();
      expect(sessionStorageCall?.[1]).toEqual([]);
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle full app lifecycle", () => {
      // First run
      initializeCacheManager();
      expect(localStorage.getItem("app_version")).toBe("1.0.0");

      // Add some data
      localStorage.setItem("user_data", "data");

      // Check stats
      const stats1 = getCacheStats();
      expect(stats1.localStorageKeys).toBe(2);

      // Clear cache
      clearAllCache();

      // Version should be preserved
      expect(localStorage.getItem("app_version")).toBe("1.0.0");

      // User data should be cleared
      expect(localStorage.getItem("user_data")).toBeNull();
    });

    it("should handle version migration", () => {
      // Setup old version
      localStorage.setItem("app_version", "0.5.0");
      localStorage.setItem("auth_cache", "old_auth");
      localStorage.setItem("old_data", "will_be_removed");

      // Simulate version upgrade
      initializeCacheManager();

      // New version set
      expect(localStorage.getItem("app_version")).toBe("1.0.0");

      // Auth preserved
      expect(localStorage.getItem("auth_cache")).toBe("old_auth");

      // Old data cleared
      expect(localStorage.getItem("old_data")).toBeNull();
    });

    it("should handle logout scenario", () => {
      // User logged in with data
      localStorage.setItem("auth_cache", "auth_token");
      localStorage.setItem("user_preferences", "preferences");

      // Logout - clear everything
      clearEverything();

      // All data cleared
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle localStorage quota exceeded", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => initializeCacheManager()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle null values in storage", () => {
      localStorage.setItem("null_value", "null");
      localStorage.setItem("undefined_value", "undefined");

      const stats = getCacheStats();
      expect(stats.localStorageKeys).toBe(2);
    });

    it("should handle special characters in keys", () => {
      localStorage.setItem("key-with-dashes", "value");
      localStorage.setItem("key.with.dots", "value");
      localStorage.setItem("key_with_underscores", "value");

      const stats = getCacheStats();
      expect(stats.localStorageKeys).toBe(3);
    });

    it("should handle very large storage", () => {
      // Add many items
      for (let i = 0; i < 100; i++) {
        localStorage.setItem(`key${i}`, `value${i}`);
      }

      const stats = getCacheStats();
      expect(stats.localStorageKeys).toBe(100);

      clearAllCache();
      const statsAfterClear = getCacheStats();
      // After clear, only app_version should remain
      expect(statsAfterClear.localStorageKeys).toBe(1);
    });

    it("should handle concurrent operations", () => {
      localStorage.setItem("data1", "value1");

      const statsBefore = getCacheStats();
      expect(statsBefore.localStorageKeys).toBe(1);

      // Simulate concurrent access
      clearAllCache();

      const statsAfter = getCacheStats();
      expect(localStorage.getItem("app_version")).toBe("1.0.0");
      expect(statsAfter.localStorageKeys).toBe(1);
    });
  });
});
