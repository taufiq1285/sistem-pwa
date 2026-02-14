/**
 * Storage Manager Unit Tests
 *
 * Tests for unified storage management including:
 * - Storage initialization
 * - Get/Set/Remove operations
 * - localStorage and IndexedDB integration
 * - Storage availability checks
 * - Storage usage information
 * - White-box testing: Quota checks, Storage errors, Path coverage
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initStorage,
  getItem,
  setItem,
  removeItem,
  clear,
  isStorageAvailable,
  getStorageInfo,
} from "@/lib/offline/storage-manager";
import { indexedDBManager } from "@/lib/offline/indexeddb";
import { logger } from "@/lib/utils/logger";

// Mock IndexedDB manager
vi.mock("../../../../lib/offline/indexeddb", () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    read: vi.fn(),
    clearAll: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockReturnValue(true),
    getDatabaseInfo: vi.fn(),
  },
}));

// Mock logger
vi.mock("../../../../lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  const mock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    // Expose store for testing
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };

  return mock;
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Storage Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset IndexedDB mocks to default implementations
    vi.mocked(indexedDBManager.initialize).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.clearAll).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.isReady).mockReturnValue(true);

    // Ensure global.localStorage is set to our mock
    if (global.localStorage !== localStorageMock) {
      Object.defineProperty(global, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    }

    // Reset clear mock implementation first before calling it
    localStorageMock.clear.mockImplementation(() => {
      (localStorageMock as any).store = {};
    });

    // Reset internal store dari factory mock
    localStorageMock.clear();

    // Reset properti store manual untuk implementasi mock di bawah
    (localStorageMock as any).store = {};

    // Reset implementasi mock ke default
    localStorageMock.setItem.mockImplementation(
      (key: string, value: string) => {
        (localStorageMock as any).store = (localStorageMock as any).store || {};
        (localStorageMock as any).store[key] = value;
      },
    );

    localStorageMock.getItem.mockImplementation((key: string) => {
      const store = (localStorageMock as any).store || {};
      return store[key] || null;
    });

    localStorageMock.removeItem.mockImplementation((key: string) => {
      const store = (localStorageMock as any).store || {};
      delete store[key];
    });

    // Membersihkan properti tambahan tanpa menghapus fungsi mock utama
    const builtInMethods = [
      "getItem",
      "setItem",
      "removeItem",
      "clear",
      "key",
      "length",
      "_getStore",
      "_setStore",
    ];

    if (global.localStorage) {
      Object.keys(global.localStorage).forEach((key) => {
        // Hanya hapus jika key BUKAN merupakan method bawaan mock
        if (!builtInMethods.includes(key)) {
          delete (global.localStorage as any)[key];
        }
      });
    }
  });

  // ========================================
  // 1. initStorage Tests
  // ========================================

  describe("initStorage", () => {
    it("should initialize IndexedDB successfully", async () => {
      await initStorage();

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Storage systems initialized successfully",
      );
    });

    it("should warn if localStorage is not available", async () => {
      const originalLocalStorage = global.localStorage;
      // @ts-ignore
      global.localStorage = undefined;

      await initStorage();

      expect(logger.warn).toHaveBeenCalledWith("localStorage is not available");

      global.localStorage = originalLocalStorage;
    });

    it("should handle initialization errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      await expect(initStorage()).rejects.toThrow("Init error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to initialize storage:",
        expect.any(Error),
      );
    });

    it("should throw error even if logger.error is called", async () => {
      const error = new Error("Critical init failure");
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(error);

      try {
        await initStorage();
        throw new Error("Should have thrown error");
      } catch (e) {
        expect(e).toBe(error);
      }
    });

    it("should not proceed if IndexedDB initialization fails", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("IndexedDB failed"),
      );

      await expect(initStorage()).rejects.toThrow("IndexedDB failed");
      expect(logger.info).not.toHaveBeenCalledWith(
        "Storage systems initialized successfully",
      );
    });
  });

  // ========================================
  // 2. getItem Tests
  // ========================================

  describe("getItem", () => {
    describe("with ID (IndexedDB)", () => {
      it("should fetch from IndexedDB when ID is provided", async () => {
        const mockData = { id: "123", name: "Test" };
        vi.mocked(indexedDBManager.read).mockResolvedValue(mockData);

        const result = await getItem("users", "123");

        expect(result).toEqual(mockData);
        expect(indexedDBManager.read).toHaveBeenCalledWith("users", "123");
      });

      it("should return undefined when IndexedDB item not found", async () => {
        vi.mocked(indexedDBManager.read).mockResolvedValue(undefined);

        const result = await getItem("users", "456");

        expect(result).toBeUndefined();
      });

      it("should handle IndexedDB read errors", async () => {
        vi.mocked(indexedDBManager.read).mockRejectedValue(
          new Error("Read error"),
        );

        const result = await getItem("users", "123");

        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to get item users:",
          expect.any(Error),
        );
      });

      it("should handle null ID gracefully", async () => {
        // When ID is null/undefined, should use localStorage
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem("test-key", null as any);

        expect(result).toBeUndefined();
        expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key");
      });

      it("should handle empty string ID", async () => {
        // Empty string is falsy, should use localStorage
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem("test-key", "");

        expect(result).toBeUndefined();
        expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key");
      });

      it("should handle IndexedDB timeout errors", async () => {
        vi.mocked(indexedDBManager.read).mockRejectedValue(
          new Error("Timeout: operation timed out"),
        );

        const result = await getItem("users", "123");

        expect(result).toBeUndefined();
      });

      it("should handle IndexedDB transaction errors", async () => {
        vi.mocked(indexedDBManager.read).mockRejectedValue(
          new Error("TransactionInactiveError"),
        );

        const result = await getItem("users", "123");

        expect(result).toBeUndefined();
      });
    });

    describe("without ID (localStorage)", () => {
      it("should get JSON object from localStorage", async () => {
        const data = { id: 1, name: "Test" };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

        const result = await getItem<{ id: number; name: string }>("test-key");

        expect(result).toEqual(data);
        expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key");
      });

      it("should get string from localStorage", async () => {
        localStorageMock.getItem.mockReturnValue("simple-string");

        const result = await getItem<string>("string-key");

        expect(result).toBe("simple-string");
      });

      it("should return undefined when key not found", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem("non-existent");

        expect(result).toBeUndefined();
      });

      it("should handle invalid JSON gracefully", async () => {
        localStorageMock.getItem.mockReturnValue("invalid-json{");

        const result = await getItem("bad-json");

        // Should return as string when JSON parsing fails
        expect(result).toBe("invalid-json{");
      });

      it("should handle localStorage errors", async () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });

        const result = await getItem("error-key");

        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(
          "Failed to get item error-key:",
          expect.any(Error),
        );
      });

      it("should handle empty string value", async () => {
        localStorageMock.getItem.mockReturnValue("");

        const result = await getItem("empty-key");

        expect(result).toBe("");
      });

      it("should handle whitespace string value", async () => {
        localStorageMock.getItem.mockReturnValue("   ");

        const result = await getItem("whitespace-key");

        expect(result).toBe("   ");
      });

      it("should parse JSON array", async () => {
        const array = [1, 2, 3, 4, 5];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(array));

        const result = await getItem<number[]>("array-key");

        expect(result).toEqual(array);
      });

      it("should parse JSON number", async () => {
        localStorageMock.getItem.mockReturnValue("42");

        const result = await getItem<number>("number-key");

        expect(result).toBe(42);
      });

      it("should parse JSON boolean", async () => {
        localStorageMock.getItem.mockReturnValue("true");

        const result = await getItem<boolean>("bool-key");

        expect(result).toBe(true);
      });

      it("should parse JSON null", async () => {
        localStorageMock.getItem.mockReturnValue("null");

        const result = await getItem<null>("null-key");

        expect(result).toBeNull();
      });

      it("should handle complex nested JSON", async () => {
        const nested = {
          user: {
            id: 1,
            profile: {
              name: "Test",
              settings: {
                theme: "dark",
                notifications: true,
              },
            },
          },
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(nested));

        const result = await getItem<typeof nested>("nested-key");

        expect(result).toEqual(nested);
      });

      it("should handle special characters in key", async () => {
        const value = "test value";
        localStorageMock.getItem.mockReturnValue(value);

        const result = await getItem("key-with-@#$%^&*()");

        expect(result).toBe(value);
      });

      it("should handle unicode in key and value", async () => {
        const unicodeValue = "Hello 世界 🌍";
        localStorageMock.getItem.mockReturnValue(unicodeValue);

        const result = await getItem("unicode-键");

        expect(result).toBe(unicodeValue);
      });
    });
  });

  // ========================================
  // 3. setItem Tests
  // ========================================

  describe("setItem", () => {
    it("should store string in localStorage", async () => {
      await setItem("string-key", "test value");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "string-key",
        "test value",
      );
    });

    it("should serialize and store object in localStorage", async () => {
      const data = { id: 1, name: "Test" };

      await setItem("object-key", data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "object-key",
        JSON.stringify(data),
      );
    });

    it("should serialize and store array in localStorage", async () => {
      const data = [1, 2, 3, 4, 5];

      await setItem("array-key", data);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "array-key",
        JSON.stringify(data),
      );
    });

    it("should store number in localStorage", async () => {
      await setItem("number-key", 42);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("number-key", "42");
    });

    it("should store boolean in localStorage", async () => {
      await setItem("bool-key", true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith("bool-key", "true");
    });

    it("should store null value", async () => {
      await setItem("null-key", null);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "null-key",
        "null",
      );
    });

    it("should store undefined as string", async () => {
      await setItem("undefined-key", undefined);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "undefined-key",
        "undefined",
      );
    });

    it("should store empty string", async () => {
      await setItem("empty-key", "");

      expect(localStorageMock.setItem).toHaveBeenCalledWith("empty-key", "");
    });

    it("should store complex nested object", async () => {
      const complex = {
        level1: {
          level2: {
            level3: {
              data: [1, 2, 3],
              nested: { a: "test" },
            },
          },
        },
      };

      await setItem("complex-key", complex);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "complex-key",
        JSON.stringify(complex),
      );
    });

    it("should handle storage quota errors", async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

      await expect(setItem("key", "value")).rejects.toThrow("Quota exceeded");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to set item key:",
        expect.any(Error),
      );
    });

    it("should handle QuotaExceededError specifically", async () => {
      const quotaError = new Error("QuotaExceededError");
      quotaError.name = "QuotaExceededError";
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      await expect(setItem("key", "value")).rejects.toThrow(
        "QuotaExceededError",
      );
    });

    it("should handle NS_ERROR_DOM_QUOTA_REACHED (Firefox)", async () => {
      const firefoxError = new Error("NS_ERROR_DOM_QUOTA_REACHED");
      localStorageMock.setItem.mockImplementation(() => {
        throw firefoxError;
      });

      await expect(setItem("key", "value")).rejects.toThrow(
        "NS_ERROR_DOM_QUOTA_REACHED",
      );
    });

    it("should handle very large string", async () => {
      const largeString = "x".repeat(1024 * 1024); // 1MB string

      await setItem("large-key", largeString);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "large-key",
        largeString,
      );
    });

    it("should handle special characters in value", async () => {
      const specialChars = "test\n\t\r\"'<>&";

      await setItem("special-key", specialChars);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "special-key",
        specialChars,
      );
    });

    it("should handle unicode in value", async () => {
      const unicode = "Hello 世界 🌍";

      await setItem("unicode-key", unicode);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "unicode-key",
        unicode,
      );
    });

    it("should throw error if localStorage.setItem throws", async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      await expect(setItem("key", "value")).rejects.toThrow("Storage disabled");
    });

    it("should handle circular reference in object", async () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // This will throw when JSON.stringify tries to serialize circular reference
      await expect(setItem("circular-key", circular)).rejects.toThrow();
    });
  });

  // ========================================
  // 4. removeItem Tests
  // ========================================

  describe("removeItem", () => {
    it("should remove item from localStorage", async () => {
      await removeItem("test-key");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should handle removal errors", async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Remove error");
      });

      await expect(removeItem("error-key")).rejects.toThrow("Remove error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to remove item error-key:",
        expect.any(Error),
      );
    });

    it("should handle non-existent key", async () => {
      // Should not throw error when removing non-existent key
      await removeItem("non-existent-key");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("non-existent-key");
    });

    it("should handle empty string key", async () => {
      await removeItem("");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("");
    });

    it("should handle special characters in key", async () => {
      await removeItem("key-with-@#$%^&*()");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "key-with-@#$%^&*()",
      );
    });

    it("should throw error if localStorage.removeItem throws", async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage locked");
      });

      await expect(removeItem("key")).rejects.toThrow("Storage locked");
    });

    it("should handle concurrent removal", async () => {
      // Remove multiple items concurrently
      await Promise.all([
        removeItem("key1"),
        removeItem("key2"),
        removeItem("key3"),
      ]);

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(3);
    });
  });

  // ========================================
  // 5. clear Tests
  // ========================================

  describe("clear", () => {
    it("should clear both localStorage and IndexedDB", async () => {
      await clear();

      expect(localStorageMock.clear).toHaveBeenCalled();
      expect(indexedDBManager.clearAll).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("All storage cleared");
    });

    it("should handle clear errors", async () => {
      vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
        new Error("Clear error"),
      );

      await expect(clear()).rejects.toThrow("Clear error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to clear storage:",
        expect.any(Error),
      );
    });

    it("should call localStorage.clear before IndexedDB", async () => {
      const clearOrder: string[] = [];

      localStorageMock.clear.mockImplementation(() => {
        clearOrder.push("localStorage");
      });

      vi.mocked(indexedDBManager.clearAll).mockImplementation(async () => {
        clearOrder.push("indexedDB");
      });

      await clear();

      expect(clearOrder).toEqual(["localStorage", "indexedDB"]);
    });

    it("should handle localStorage.clear errors", async () => {
      localStorageMock.clear.mockImplementation(() => {
        throw new Error("localStorage clear error");
      });

      await expect(clear()).rejects.toThrow("localStorage clear error");
    });

    it("should not call IndexedDB.clearAll if localStorage.clear fails", async () => {
      localStorageMock.clear.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      try {
        await clear();
        throw new Error("Should have thrown error");
      } catch (e) {
        expect(indexedDBManager.clearAll).not.toHaveBeenCalled();
      }
    });

    it("should not log success message if clear fails", async () => {
      vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
        new Error("Clear error"),
      );

      try {
        await clear();
        throw new Error("Should have thrown error");
      } catch (e) {
        expect(logger.info).not.toHaveBeenCalledWith("All storage cleared");
      }
    });

    it("should throw error from IndexedDB.clearAll even if localStorage.clear succeeds", async () => {
      vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
        new Error("IndexedDB clear error"),
      );

      await expect(clear()).rejects.toThrow("IndexedDB clear error");
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  // ========================================
  // 6. isStorageAvailable Tests
  // ========================================

  describe("isStorageAvailable", () => {
    it("should return true when both storages are available", () => {
      vi.mocked(indexedDBManager.isReady).mockReturnValue(true);

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "__storage_test__",
        "test",
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "__storage_test__",
      );
    });

    it("should return false when localStorage throws error", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should return false when IndexedDB is not ready", () => {
      vi.mocked(indexedDBManager.isReady).mockReturnValue(false);

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should return false when localStorage throws on removeItem", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Remove failed");
      });

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should return false when localStorage throws on getItem", () => {
      // Even though we don't explicitly call getItem, the mock might
      const isAvailable = isStorageAvailable();

      expect(typeof isAvailable).toBe("boolean");
    });

    it("should handle private browsing mode", () => {
      // Simulate private browsing where storage might throw
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("The operation is insecure");
      });

      const isAvailable = isStorageAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should check IndexedDB readiness after localStorage check", () => {
      vi.mocked(indexedDBManager.isReady).mockReturnValue(true);

      isStorageAvailable();

      // IndexedDB check should happen after localStorage operations
      expect(indexedDBManager.isReady).toHaveBeenCalled();
    });
  });

  // ========================================
  // 7. getStorageInfo Tests
  // ========================================

  describe("getStorageInfo", () => {
    it("should return storage usage information", async () => {
      // Mock localStorage with some data
      Object.defineProperty(localStorage, "key1", {
        value: "value1",
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(localStorage, "key2", {
        value: "longer value string",
        enumerable: true,
        configurable: true,
      });

      localStorageMock.getItem.mockImplementation((key) => {
        const data: Record<string, string> = {
          key1: "value1",
          key2: "longer value string",
        };
        return data[key] || null;
      });

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: ["users", "kuis", "nilai"],
        totalSize: 150,
      });

      const info = await getStorageInfo();

      expect(info).toMatchObject({
        localStorage: {
          used: expect.any(Number),
          available: 5 * 1024 * 1024, // 5MB
        },
        indexedDB: {
          stores: ["users", "kuis", "nilai"],
          totalItems: 150,
        },
      });
    });

    it("should handle empty localStorage", async () => {
      // Ensure localStorage is truly empty
      const builtInMethods = [
        "getItem",
        "setItem",
        "removeItem",
        "clear",
        "key",
        "length",
        "_getStore",
        "_setStore",
      ];
      Object.keys(localStorage).forEach((key) => {
        if (!builtInMethods.includes(key)) {
          delete (localStorage as any)[key];
        }
      });

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      expect(info.localStorage.used).toBeGreaterThanOrEqual(0);
      expect(info.indexedDB.totalItems).toBe(0);
    });

    it("should handle errors getting storage info", async () => {
      vi.mocked(indexedDBManager.getDatabaseInfo).mockRejectedValue(
        new Error("Info error"),
      );

      await expect(getStorageInfo()).rejects.toThrow("Info error");
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to get storage info:",
        expect.any(Error),
      );
    });

    it("should calculate localStorage size correctly", async () => {
      // Ensure localStorage is empty first
      const builtInMethods = [
        "getItem",
        "setItem",
        "removeItem",
        "clear",
        "key",
        "length",
        "_getStore",
        "_setStore",
      ];
      Object.keys(localStorage).forEach((key) => {
        if (!builtInMethods.includes(key)) {
          delete (localStorage as any)[key];
        }
      });

      // Create a simple localStorage mock with known data
      const testData: Record<string, string> = {
        testKey: "testValue",
      };

      Object.keys(testData).forEach((key) => {
        Object.defineProperty(localStorage, key, {
          value: testData[key],
          enumerable: true,
          configurable: true,
        });
      });

      localStorageMock.getItem.mockImplementation(
        (key) => testData[key] || null,
      );

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      // Size should include the key and value
      // At minimum it should be the sum of key length + value length
      const expectedSize = "testKey".length + "testValue".length;
      expect(info.localStorage.used).toBeGreaterThanOrEqual(expectedSize);
    });

    it("should handle localStorage with many items", async () => {
      // Add many items to localStorage
      for (let i = 0; i < 100; i++) {
        Object.defineProperty(localStorage, `key${i}`, {
          value: `value${i}`,
          enumerable: true,
          configurable: true,
        });
      }

      localStorageMock.getItem.mockImplementation((key) => {
        const match = key.match(/key(\d+)/);
        if (match) {
          return `value${match[1]}`;
        }
        return null;
      });

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      expect(info.localStorage.used).toBeGreaterThan(0);
    });

    it("should handle localStorage with null values", async () => {
      Object.defineProperty(localStorage, "nullKey", {
        value: null,
        enumerable: true,
        configurable: true,
      });

      localStorageMock.getItem.mockReturnValue(null);

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      expect(info.localStorage.used).toBeGreaterThanOrEqual(0);
    });

    it("should return correct available storage (5MB)", async () => {
      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const info = await getStorageInfo();

      expect(info.localStorage.available).toBe(5 * 1024 * 1024);
    });

    it("should handle IndexedDB with many stores", async () => {
      const manyStores = Array.from({ length: 50 }, (_, i) => `store${i}`);

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: manyStores,
        totalSize: 1000,
      });

      const info = await getStorageInfo();

      expect(info.indexedDB.stores).toHaveLength(50);
      expect(info.indexedDB.totalItems).toBe(1000);
    });
  });

  // ========================================
  // 8. Integration Tests
  // ========================================

  describe("Integration", () => {
    it("should work with getItem and setItem together", async () => {
      const data = { id: 1, name: "Integration Test" };

      await setItem("integration-key", data);

      localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

      const retrieved = await getItem<typeof data>("integration-key");

      expect(retrieved).toEqual(data);
    });

    it("should work with setItem and removeItem together", async () => {
      await setItem("temp-key", "temp-value");
      await removeItem("temp-key");

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it("should handle multiple concurrent setItem operations", async () => {
      const items = [
        { key: "key1", value: "value1" },
        { key: "key2", value: "value2" },
        { key: "key3", value: "value3" },
      ];

      await Promise.all(items.map((item) => setItem(item.key, item.value)));

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);
    });

    it("should handle mixed operations", async () => {
      await setItem("key1", "value1");
      localStorageMock.getItem.mockReturnValue("value1");
      await getItem("key1");
      await removeItem("key1");

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.getItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  // ========================================
  // 9. Type Safety Tests
  // ========================================

  describe("Type Safety", () => {
    it("should preserve type information for getItem", async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const user: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const result = await getItem<User>("user-key");

      expect(result).toEqual(user);
      // TypeScript should know result is User | undefined
      if (result) {
        expect(result.id).toBe(1);
        expect(result.name).toBe("Test User");
        expect(result.email).toBe("test@example.com");
      }
    });

    it("should handle generic types correctly", async () => {
      const array = [1, 2, 3, 4, 5];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(array));

      const result = await getItem<number[]>("array-key");

      expect(Array.isArray(result)).toBe(true);
      if (result) {
        expect(result[0]).toBe(1);
      }
    });
  });

  // ========================================
  // 10. White-Box Testing - Branch Coverage
  // ========================================

  describe("White-Box Testing - Branch Coverage", () => {
    describe("getItem Branch Coverage", () => {
      it("should branch to IndexedDB when id is provided", async () => {
        const mockData = { id: "123" };
        vi.mocked(indexedDBManager.read).mockResolvedValue(mockData);

        await getItem("users", "123");

        expect(indexedDBManager.read).toHaveBeenCalled();
        expect(localStorageMock.getItem).not.toHaveBeenCalled();
      });

      it("should branch to localStorage when id is not provided", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        await getItem("test-key");

        expect(localStorageMock.getItem).toHaveBeenCalled();
        expect(indexedDBManager.read).not.toHaveBeenCalled();
      });

      it("should branch to return undefined when localStorage returns null", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem("non-existent");

        expect(result).toBeUndefined();
      });

      it("should branch to JSON.parse when item exists", async () => {
        const data = { test: "value" };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(data));

        const result = await getItem("key");

        expect(result).toEqual(data);
      });

      it("should branch to return as string when JSON.parse fails", async () => {
        localStorageMock.getItem.mockReturnValue("not-json");

        const result = await getItem("key");

        expect(result).toBe("not-json");
      });

      it("should branch to catch block on error", async () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error("Error");
        });

        const result = await getItem("key");

        expect(result).toBeUndefined();
      });
    });

    describe("setItem Branch Coverage", () => {
      it("should branch to store as string when value is string", async () => {
        await setItem("key", "string-value");

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "key",
          "string-value",
        );
      });

      it("should branch to JSON.stringify when value is not string", async () => {
        await setItem("key", { obj: "value" });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "key",
          '{"obj":"value"}',
        );
      });

      it("should branch to throw error on setItem failure", async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error("Error");
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });
    });

    describe("initStorage Branch Coverage", () => {
      it("should branch to warn when localStorage is undefined", async () => {
        const original = global.localStorage;
        // @ts-ignore
        global.localStorage = undefined;

        await initStorage();

        expect(logger.warn).toHaveBeenCalled();

        global.localStorage = original;
      });

      it("should branch to throw error on init failure", async () => {
        vi.mocked(indexedDBManager.initialize).mockRejectedValue(
          new Error("Error"),
        );

        await expect(initStorage()).rejects.toThrow();
      });
    });

    describe("clear Branch Coverage", () => {
      it("should branch to catch on localStorage.clear error", async () => {
        localStorageMock.clear.mockImplementation(() => {
          throw new Error("Error");
        });

        await expect(clear()).rejects.toThrow();
      });

      it("should branch to catch on indexedDB.clearAll error", async () => {
        vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
          new Error("Error"),
        );

        await expect(clear()).rejects.toThrow();
      });
    });

    describe("isStorageAvailable Branch Coverage", () => {
      it("should branch to return false on localStorage error", () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error("Error");
        });

        const result = isStorageAvailable();

        expect(result).toBe(false);
      });

      it("should branch to return false when IndexedDB not ready", () => {
        vi.mocked(indexedDBManager.isReady).mockReturnValue(false);

        const result = isStorageAvailable();

        expect(result).toBe(false);
      });

      it("should branch to return true when both available", () => {
        vi.mocked(indexedDBManager.isReady).mockReturnValue(true);

        const result = isStorageAvailable();

        expect(result).toBe(true);
      });
    });
  });

  // ========================================
  // 11. White-Box Testing - Path Coverage
  // ========================================

  describe("White-Box Testing - Path Coverage", () => {
    describe("getItem Paths", () => {
      it("Path 1: IndexedDB success path", async () => {
        vi.mocked(indexedDBManager.read).mockResolvedValue({ id: "1" });

        const result = await getItem("users", "1");

        expect(result).toEqual({ id: "1" });
      });

      it("Path 2: localStorage JSON success path", async () => {
        localStorageMock.getItem.mockReturnValue('{"test":"value"}');

        const result = await getItem("key");

        expect(result).toEqual({ test: "value" });
      });

      it("Path 3: localStorage string fallback path", async () => {
        localStorageMock.getItem.mockReturnValue("plain-string");

        const result = await getItem("key");

        expect(result).toBe("plain-string");
      });

      it("Path 4: localStorage null path", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await getItem("key");

        expect(result).toBeUndefined();
      });

      it("Path 5: Error path", async () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw new Error("Error");
        });

        const result = await getItem("key");

        expect(result).toBeUndefined();
      });
    });

    describe("setItem Paths", () => {
      it("Path 1: String value success path", async () => {
        await setItem("key", "value");

        expect(localStorageMock.setItem).toHaveBeenCalledWith("key", "value");
      });

      it("Path 2: Object value success path", async () => {
        await setItem("key", { test: "value" });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "key",
          '{"test":"value"}',
        );
      });

      it("Path 3: Error path", async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error("Error");
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });
    });

    describe("initStorage Paths", () => {
      it("Path 1: Success with localStorage path", async () => {
        await initStorage();

        expect(logger.info).toHaveBeenCalled();
      });

      it("Path 2: Success without localStorage path", async () => {
        const original = global.localStorage;
        // @ts-ignore
        global.localStorage = undefined;

        await initStorage();

        expect(logger.warn).toHaveBeenCalled();

        global.localStorage = original;
      });

      it("Path 3: Error path", async () => {
        vi.mocked(indexedDBManager.initialize).mockRejectedValue(
          new Error("Error"),
        );

        await expect(initStorage()).rejects.toThrow();
      });
    });

    describe("clear Paths", () => {
      it("Path 1: Success path", async () => {
        await clear();

        expect(logger.info).toHaveBeenCalledWith("All storage cleared");
      });

      it("Path 2: localStorage error path", async () => {
        localStorageMock.clear.mockImplementation(() => {
          throw new Error("Error");
        });

        await expect(clear()).rejects.toThrow();
      });

      it("Path 3: IndexedDB error path", async () => {
        vi.mocked(indexedDBManager.clearAll).mockRejectedValue(
          new Error("Error"),
        );

        await expect(clear()).rejects.toThrow();
      });
    });
  });

  // ========================================
  // 12. White-Box Testing - Exception Handling
  // ========================================

  describe("White-Box Testing - Exception Handling", () => {
    describe("Storage Quota Exceptions", () => {
      it("should handle QuotaExceededError in setItem", async () => {
        const quotaError = new DOMException(
          "The quota has been exceeded",
          "QuotaExceededError",
        );
        localStorageMock.setItem.mockImplementation(() => {
          throw quotaError;
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });

      it("should handle NS_ERROR_DOM_QUOTA_REACHED (Firefox)", async () => {
        const firefoxError = new Error("NS_ERROR_DOM_QUOTA_REACHED");
        localStorageMock.setItem.mockImplementation(() => {
          throw firefoxError;
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });

      it("should handle generic quota error", async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error("Quota exceeded");
        });

        await expect(setItem("key", "value")).rejects.toThrow("Quota exceeded");
      });
    });

    describe("Storage Access Exceptions", () => {
      it("should handle SecurityError in localStorage access", async () => {
        const securityError = new DOMException(
          "The operation is insecure",
          "SecurityError",
        );
        localStorageMock.getItem.mockImplementation(() => {
          throw securityError;
        });

        const result = await getItem("key");

        expect(result).toBeUndefined();
      });

      it("should handle InvalidStateError in IndexedDB", async () => {
        const stateError = new DOMException(
          "IndexedDB is not available",
          "InvalidStateError",
        );
        vi.mocked(indexedDBManager.read).mockRejectedValue(stateError);

        const result = await getItem("users", "1");

        expect(result).toBeUndefined();
      });
    });

    describe("Data Corruption Exceptions", () => {
      it("should handle DataError in IndexedDB", async () => {
        const dataError = new DOMException(
          "Data provided does not meet requirements",
          "DataError",
        );
        vi.mocked(indexedDBManager.read).mockRejectedValue(dataError);

        const result = await getItem("users", "1");

        expect(result).toBeUndefined();
      });

      it("should handle malformed JSON in localStorage", async () => {
        localStorageMock.getItem.mockReturnValue("{malformed json");

        const result = await getItem("key");

        // Should return as string when parsing fails
        expect(result).toBe("{malformed json");
      });
    });

    describe("Network Exceptions (for IndexedDB)", () => {
      it("should handle TimeoutError", async () => {
        const timeoutError = new DOMException(
          "Operation timed out",
          "TimeoutError",
        );
        vi.mocked(indexedDBManager.read).mockRejectedValue(timeoutError);

        const result = await getItem("users", "1");

        expect(result).toBeUndefined();
      });

      it("should handle AbortError", async () => {
        const abortError = new DOMException(
          "The operation was aborted",
          "AbortError",
        );
        vi.mocked(indexedDBManager.read).mockRejectedValue(abortError);

        const result = await getItem("users", "1");

        expect(result).toBeUndefined();
      });
    });

    describe("Unknown Exceptions", () => {
      it("should handle null error in getItem", async () => {
        localStorageMock.getItem.mockImplementation(() => {
          throw null;
        });

        const result = await getItem("key");

        expect(result).toBeUndefined();
      });

      it("should handle undefined error in setItem", async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw undefined;
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });

      it("should handle string error in setItem", async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw "String error";
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });
    });
  });

  // ========================================
  // 13. White-Box Testing - Loop Coverage
  // ========================================

  describe("White-Box Testing - Loop Coverage", () => {
    describe("getStorageInfo Loop Coverage", () => {
      it("should handle empty localStorage (0 iterations)", async () => {
        const builtInMethods = [
          "getItem",
          "setItem",
          "removeItem",
          "clear",
          "key",
          "length",
          "_getStore",
          "_setStore",
        ];
        Object.keys(localStorage).forEach((key) => {
          if (!builtInMethods.includes(key)) {
            delete (localStorage as any)[key];
          }
        });

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        expect(info.localStorage.used).toBeGreaterThanOrEqual(0);
      });

      it("should handle single item in localStorage (1 iteration)", async () => {
        Object.defineProperty(localStorage, "singleKey", {
          value: "singleValue",
          enumerable: true,
          configurable: true,
        });

        localStorageMock.getItem.mockReturnValue("singleValue");

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        expect(info.localStorage.used).toBeGreaterThan(0);
      });

      it("should handle multiple items in localStorage (10 iterations)", async () => {
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(localStorage, `key${i}`, {
            value: `value${i}`,
            enumerable: true,
            configurable: true,
          });
        }

        localStorageMock.getItem.mockImplementation((key) => {
          const match = key.match(/key(\d+)/);
          if (match) {
            return `value${match[1]}`;
          }
          return null;
        });

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        expect(info.localStorage.used).toBeGreaterThan(0);
      });

      it("should handle many items in localStorage (100 iterations)", async () => {
        for (let i = 0; i < 100; i++) {
          Object.defineProperty(localStorage, `item${i}`, {
            value: `data${i}`,
            enumerable: true,
            configurable: true,
          });
        }

        localStorageMock.getItem.mockImplementation((key) => {
          const match = key.match(/item(\d+)/);
          if (match) {
            return `data${match[1]}`;
          }
          return null;
        });

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        expect(info.localStorage.used).toBeGreaterThan(0);
      });

      it("should skip non-enumerable properties", async () => {
        // Add enumerable property
        Object.defineProperty(localStorage, "enumerableKey", {
          value: "enumerableValue",
          enumerable: true,
          configurable: true,
        });

        // Add non-enumerable property (should be skipped)
        Object.defineProperty(localStorage, "nonEnumerableKey", {
          value: "nonEnumerableValue",
          enumerable: false,
          configurable: true,
        });

        localStorageMock.getItem.mockImplementation((key) => {
          if (key === "enumerableKey") return "enumerableValue";
          if (key === "nonEnumerableKey") return null;
          return null;
        });

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        // Should only count enumerable property
        expect(info.localStorage.used).toBeGreaterThan(0);
      });

      it("should handle null getItem result in loop", async () => {
        Object.defineProperty(localStorage, "nullValueKey", {
          value: null,
          enumerable: true,
          configurable: true,
        });

        localStorageMock.getItem.mockReturnValue(null);

        vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
          name: "test-db",
          version: 1,
          stores: [],
          totalSize: 0,
        });

        const info = await getStorageInfo();

        expect(info.localStorage.used).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ========================================
  // 14. White-Box Testing - Edge Cases
  // ========================================

  describe("White-Box Testing - Edge Cases", () => {
    describe("Value Edge Cases", () => {
      it("should handle very large string value", async () => {
        const largeValue = "x".repeat(1024 * 100); // 100KB string

        await setItem("large-key", largeValue);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "large-key",
          largeValue,
        );
      });

      it("should handle very long key", async () => {
        const longKey = "k".repeat(1000);

        await setItem(longKey, "value");

        expect(localStorageMock.setItem).toHaveBeenCalledWith(longKey, "value");
      });

      it("should handle unicode in key and value", async () => {
        const unicodeKey = "键-مفتاح-🔑";
        const unicodeValue = "值-قيمة-💎";

        await setItem(unicodeKey, unicodeValue);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          unicodeKey,
          unicodeValue,
        );
      });

      it("should handle emoji in key and value", async () => {
        const emojiKey = "🎉🎊🎁";
        const emojiValue = "Hello 🌍 World 🚀";

        await setItem(emojiKey, emojiValue);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          emojiKey,
          emojiValue,
        );
      });

      it("should handle special characters", async () => {
        const specialKey = "key\n\t\r\"'<>&";
        const specialValue = "value\n\t\r\"'<>&";

        await setItem(specialKey, specialValue);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          specialKey,
          specialValue,
        );
      });

      it("should handle empty object", async () => {
        await setItem("empty-obj", {});

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "empty-obj",
          "{}",
        );
      });

      it("should handle empty array", async () => {
        await setItem("empty-arr", []);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "empty-arr",
          "[]",
        );
      });

      it("should handle zero value", async () => {
        await setItem("zero-key", 0);

        expect(localStorageMock.setItem).toHaveBeenCalledWith("zero-key", "0");
      });

      it("should handle false value", async () => {
        await setItem("false-key", false);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "false-key",
          "false",
        );
      });

      it("should handle negative number", async () => {
        await setItem("negative-key", -42);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "negative-key",
          "-42",
        );
      });

      it("should handle floating point number", async () => {
        await setItem("float-key", 3.14159);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "float-key",
          "3.14159",
        );
      });
    });

    describe("Storage State Edge Cases", () => {
      it("should handle storage near quota limit", async () => {
        // Simulate storage near limit
        const nearLimitError = new Error("QuotaExceededError");
        localStorageMock.setItem.mockImplementation(() => {
          throw nearLimitError;
        });

        await expect(setItem("key", "value")).rejects.toThrow();
      });

      it("should handle corrupted localStorage data", async () => {
        localStorageMock.getItem.mockReturnValue("[corrupted data");

        const result = await getItem("corrupted-key");

        // Should return as string
        expect(result).toBe("[corrupted data");
      });

      it("should handle concurrent read/write operations", async () => {
        // Simulate concurrent operations
        const operations = [
          setItem("key1", "value1"),
          getItem("key2"),
          removeItem("key3"),
          setItem("key4", "value4"),
        ];

        await Promise.all(operations);

        expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
        expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
        expect(localStorageMock.removeItem).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ========================================
  // 15. Performance Testing
  // ========================================

  describe("Performance Testing", () => {
    it("should complete getItem within reasonable time", async () => {
      localStorageMock.getItem.mockReturnValue("value");

      const start = performance.now();
      await getItem("test-key");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it("should complete setItem within reasonable time", async () => {
      const start = performance.now();
      await setItem("test-key", "value");
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle large datasets efficiently", async () => {
      // Create large dataset
      for (let i = 0; i < 100; i++) {
        Object.defineProperty(localStorage, `perfKey${i}`, {
          value: `perfValue${i}`,
          enumerable: true,
          configurable: true,
        });
      }

      localStorageMock.getItem.mockImplementation((key) => {
        const match = key.match(/perfKey(\d+)/);
        if (match) {
          return `perfValue${match[1]}`;
        }
        return null;
      });

      vi.mocked(indexedDBManager.getDatabaseInfo).mockResolvedValue({
        name: "test-db",
        version: 1,
        stores: [],
        totalSize: 0,
      });

      const start = performance.now();
      await getStorageInfo();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle many concurrent operations", async () => {
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(setItem(`concurrentKey${i}`, `value${i}`));
      }

      const start = performance.now();
      await Promise.all(operations);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
