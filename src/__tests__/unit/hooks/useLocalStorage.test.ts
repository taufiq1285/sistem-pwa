/**
 * useLocalStorage Hook Unit Tests
 * Comprehensive testing of localStorage persistence hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../../lib/hooks/useLocalStorage";

describe("useLocalStorage Hook", () => {
  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Ensure window object exists in test environment
    if (typeof window === "undefined") {
      Object.defineProperty(global, "window", {
        value: {
          localStorage: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
          },
        },
        writable: true,
      });
    }

    // Mock localStorage
    originalLocalStorage = window.localStorage;
    mockLocalStorage = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => mockLocalStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    if (originalLocalStorage && typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    }
    vi.clearAllMocks();
  });

  describe("Initial value handling", () => {
    it("should return initial value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default-value"),
      );

      expect(result.current[0]).toBe("default-value");
      expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    it("should return parsed value from localStorage when exists", () => {
      mockLocalStorage["test-key"] = JSON.stringify("stored-value");

      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default-value"),
      );

      expect(result.current[0]).toBe("stored-value");
    });

    it("should handle complex objects", () => {
      const complexObject = {
        name: "test",
        items: [1, 2, 3],
        nested: { prop: "value" },
      };
      mockLocalStorage["object-key"] = JSON.stringify(complexObject);

      const { result } = renderHook(() => useLocalStorage("object-key", {}));

      expect(result.current[0]).toEqual(complexObject);
    });

    it("should handle arrays", () => {
      const testArray = [1, 2, 3, "test", { key: "value" }];
      mockLocalStorage["array-key"] = JSON.stringify(testArray);

      const { result } = renderHook(() => useLocalStorage("array-key", []));

      expect(result.current[0]).toEqual(testArray);
    });

    it("should handle boolean values", () => {
      mockLocalStorage["bool-key"] = JSON.stringify(true);

      const { result } = renderHook(() => useLocalStorage("bool-key", false));

      expect(result.current[0]).toBe(true);
    });

    it("should handle numeric values", () => {
      mockLocalStorage["number-key"] = JSON.stringify(42.5);

      const { result } = renderHook(() => useLocalStorage("number-key", 0));

      expect(result.current[0]).toBe(42.5);
    });
  });

  describe("setValue functionality", () => {
    it("should update both state and localStorage", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify("new-value"),
      );
    });

    it("should handle object updates", () => {
      const initialObject = { count: 0 };
      const { result } = renderHook(() =>
        useLocalStorage("object-key", initialObject),
      );

      const newObject = { count: 1, name: "test" };

      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "object-key",
        JSON.stringify(newObject),
      );
    });

    it("should handle null values", () => {
      const { result } = renderHook(() =>
        useLocalStorage("null-key", "initial"),
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "null-key",
        JSON.stringify(null),
      );
    });

    it("should handle undefined values", () => {
      const { result } = renderHook(() =>
        useLocalStorage("undefined-key", "initial"),
      );

      act(() => {
        result.current[1](undefined);
      });

      expect(result.current[0]).toBe(undefined);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "undefined-key",
        JSON.stringify(undefined),
      );
    });
  });

  describe("Error handling", () => {
    it("should return initial value when localStorage.getItem throws", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("Storage error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("error-key", "fallback-value"),
      );

      expect(result.current[0]).toBe("fallback-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle invalid JSON in localStorage", () => {
      mockLocalStorage["invalid-json"] = "{ invalid json }";

      const { result } = renderHook(() =>
        useLocalStorage("invalid-json", "default"),
      );

      expect(result.current[0]).toBe("default");
    });

    it("should handle localStorage.setItem errors gracefully", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("quota-key", "initial"),
      );

      // Should still update state even if localStorage fails
      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("SSR compatibility", () => {
    it("should return initial value when localStorage is not available", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("ssr-key", "ssr-default"),
      );

      expect(result.current[0]).toBe("ssr-default");

      consoleSpy.mockRestore();
    });

    it("should handle setValue when localStorage setItem fails", () => {
      const { result } = renderHook(() =>
        useLocalStorage("ssr-key", "initial"),
      );

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      act(() => {
        result.current[1]("new-value");
      });

      // Should update state but not crash
      expect(result.current[0]).toBe("new-value");

      consoleSpy.mockRestore();
    });
  });

  describe("Hook stability", () => {
    it("should maintain setValue reference across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage("stability-key", "initial"),
      );

      const firstSetValue = result.current[1];

      rerender();

      const secondSetValue = result.current[1];

      expect(firstSetValue).toBe(secondSetValue);
    });

    it("should create new setValue when key changes", () => {
      let key = "key1";
      const { result, rerender } = renderHook(() =>
        useLocalStorage(key, "initial"),
      );

      const firstSetValue = result.current[1];

      key = "key2";
      rerender();

      const secondSetValue = result.current[1];

      expect(firstSetValue).not.toBe(secondSetValue);
    });
  });

  describe("Real-world usage scenarios", () => {
    it("should handle user preferences", () => {
      const defaultPrefs = { theme: "light", language: "en", autoSave: true };

      const { result } = renderHook(() =>
        useLocalStorage("user-preferences", defaultPrefs),
      );

      // Update specific preference
      act(() => {
        result.current[1]({ ...result.current[0], theme: "dark" });
      });

      expect(result.current[0].theme).toBe("dark");
      expect(result.current[0].language).toBe("en");
      expect(result.current[0].autoSave).toBe(true);
    });

    it("should handle shopping cart items", () => {
      type CartItem = { id: string; name: string; quantity: number };
      const { result } = renderHook(() =>
        useLocalStorage<CartItem[]>("cart", []),
      );

      const newItem: CartItem = { id: "1", name: "Test Item", quantity: 2 };

      act(() => {
        result.current[1]([...result.current[0], newItem]);
      });

      expect(result.current[0]).toHaveLength(1);
      expect(result.current[0][0]).toEqual(newItem);
    });

    it("should handle authentication tokens", () => {
      const { result } = renderHook(() => useLocalStorage("auth-token", null));

      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

      act(() => {
        result.current[1](token);
      });

      expect(result.current[0]).toBe(token);

      // Clear token (logout)
      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
    });

    it("should handle form draft data", () => {
      const draftData = {
        title: "Draft Post",
        content: "This is a draft...",
        lastModified: Date.now(),
      };

      const { result } = renderHook(() => useLocalStorage("form-draft", {}));

      act(() => {
        result.current[1](draftData);
      });

      expect(result.current[0]).toEqual(draftData);
    });
  });

  describe("Edge cases", () => {
    it("should handle very large objects", () => {
      const largeObject = {
        data: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: "A".repeat(100),
        })),
      };

      const { result } = renderHook(() => useLocalStorage("large-object", {}));

      act(() => {
        result.current[1](largeObject);
      });

      expect(result.current[0]).toEqual(largeObject);
    });

    it("should handle circular reference objects gracefully", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Converting circular structure to JSON");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage("circular", {}));

      act(() => {
        result.current[1](circular);
      });

      // Should still update state
      expect(result.current[0]).toBe(circular);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle special characters in keys", () => {
      const specialKey = "key-with-spaces and/special#chars@domain.com";

      const { result } = renderHook(() =>
        useLocalStorage(specialKey, "default"),
      );

      act(() => {
        result.current[1]("special-value");
      });

      expect(result.current[0]).toBe("special-value");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        specialKey,
        JSON.stringify("special-value"),
      );
    });

    it("should handle empty string keys", () => {
      const { result } = renderHook(() =>
        useLocalStorage("", "empty-key-value"),
      );

      expect(result.current[0]).toBe("empty-key-value");
    });
  });
});
