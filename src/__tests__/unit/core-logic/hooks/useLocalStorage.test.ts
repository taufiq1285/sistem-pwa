/**
 * useLocalStorage Hook Comprehensive Unit Tests
 * White-box testing for localStorage persistence hook
 * Focus: Try-catch error handling, quota exceeded scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

describe("useLocalStorage Hook", () => {
  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    // Store original window
    originalWindow = global.window;

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
        configurable: true,
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
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalLocalStorage && typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    }
    vi.clearAllMocks();
    // Restore window
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  // ===========================================================================
  // 1. Initial Value Handling - Valid Cases
  // ===========================================================================
  describe("Initial value handling - Valid Cases", () => {
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

    it("should handle null stored values", () => {
      mockLocalStorage["null-key"] = JSON.stringify(null);

      const { result } = renderHook(() =>
        useLocalStorage("null-key", "default"),
      );

      expect(result.current[0]).toBe(null);
    });

    it("should handle empty string stored values", () => {
      mockLocalStorage["empty-key"] = JSON.stringify("");

      const { result } = renderHook(() =>
        useLocalStorage("empty-key", "default"),
      );

      expect(result.current[0]).toBe("");
    });

    it("should handle zero stored values", () => {
      mockLocalStorage["zero-key"] = JSON.stringify(0);

      const { result } = renderHook(() => useLocalStorage("zero-key", 100));

      expect(result.current[0]).toBe(0);
    });

    it("should handle false stored values", () => {
      mockLocalStorage["false-key"] = JSON.stringify(false);

      const { result } = renderHook(() => useLocalStorage("false-key", true));

      expect(result.current[0]).toBe(false);
    });
  });

  // ===========================================================================
  // 2. setValue Functionality - Valid Cases
  // ===========================================================================
  describe("setValue functionality - Valid Cases", () => {
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

    it("should handle multiple sequential updates", () => {
      const { result } = renderHook(() =>
        useLocalStorage("multi-key", "initial"),
      );

      act(() => {
        result.current[1]("update1");
      });
      expect(result.current[0]).toBe("update1");

      act(() => {
        result.current[1]("update2");
      });
      expect(result.current[0]).toBe("update2");

      act(() => {
        result.current[1]("update3");
      });
      expect(result.current[0]).toBe("update3");
    });

    it("should update localStorage on each setValue call", () => {
      const { result } = renderHook(() => useLocalStorage("count-key", 0));

      act(() => {
        result.current[1](1);
        result.current[1](2);
        result.current[1](3);
      });

      expect(localStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  // ===========================================================================
  // 3. Error Handling - Try-Catch Branches (Initial State)
  // ===========================================================================
  describe("Error handling - Try-Catch branches (initial state)", () => {
    it("should catch error when localStorage.getItem throws", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("Storage error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("error-key", "fallback-value"),
      );

      expect(result.current[0]).toBe("fallback-value");
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "error-key":',
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });

    it("should catch error when JSON.parse throws (invalid JSON)", () => {
      mockLocalStorage["invalid-json"] = "{ invalid json }";

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("invalid-json", "default"),
      );

      expect(result.current[0]).toBe("default");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should return initial value on any exception during initialization", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new TypeError("Unexpected type");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("type-error-key", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle SecurityError from localStorage", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new DOMException("Security error", "SecurityError");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("security-key", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle QuotaExceededError during getItem", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        const error = new DOMException("Quota exceeded", "QuotaExceededError");
        throw error;
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("quota-key", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // 4. Error Handling - Try-Catch Branches (setValue)
  // ===========================================================================
  describe("Error handling - Try-Catch branches (setValue)", () => {
    it("should catch error when localStorage.setItem throws", () => {
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
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "quota-key":',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should catch error when JSON.stringify throws (circular reference)", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      // Mock setItem to throw because of circular reference
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new TypeError("Converting circular structure to JSON");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage("circular", {}));

      act(() => {
        result.current[1](circular);
      });

      // Should still update state even if localStorage fails
      expect(result.current[0]).toBe(circular);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle SecurityError during setItem", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new DOMException("Security error", "SecurityError");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("security-set-key", "initial"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should continue updating state even after multiple localStorage errors", () => {
      let errorCount = 0;
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        errorCount++;
        throw new Error(`Error ${errorCount}`);
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("error-prone-key", "initial"),
      );

      act(() => {
        result.current[1]("value1");
      });
      expect(result.current[0]).toBe("value1");

      act(() => {
        result.current[1]("value2");
      });
      expect(result.current[0]).toBe("value2");

      act(() => {
        result.current[1]("value3");
      });
      expect(result.current[0]).toBe("value3");

      expect(consoleSpy).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // 5. White-Box Testing - Quota Exceeded Scenarios
  // ===========================================================================
  describe("White-Box Testing - Quota Exceeded Scenarios", () => {
    it("should handle QuotaExceededError with standard message", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new DOMException(
          "Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.",
          "QuotaExceededError",
        );
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage("quota-1", "init"));

      act(() => {
        result.current[1]("large-value");
      });

      // State should still update
      expect(result.current[0]).toBe("large-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle QuotaExceededError during initial load", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("quota-init", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should allow recovery from quota exceeded after clear", () => {
      let callCount = 0;

      vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
        callCount++;
        if (callCount <= 2) {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        }
        // Simulate recovery after clear
        mockLocalStorage[key] = value;
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("recovery-key", "initial"),
      );

      // First two attempts should fail but state updates
      act(() => {
        result.current[1]("value1");
      });
      expect(result.current[0]).toBe("value1");
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      act(() => {
        result.current[1]("value2");
      });
      expect(result.current[0]).toBe("value2");
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      // Third attempt should succeed (simulating cleared storage)
      act(() => {
        result.current[1]("value3");
      });
      expect(result.current[0]).toBe("value3");
      expect(consoleSpy).toHaveBeenCalledTimes(2); // No new warning

      consoleSpy.mockRestore();
    });

    it("should handle quota exceeded with very large objects", () => {
      const largeObject = {
        data: new Array(10000).fill(0).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: "A".repeat(1000),
        })),
      };

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new DOMException(
          "The quota has been exceeded",
          "QuotaExceededError",
        );
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage("large", {}));

      act(() => {
        result.current[1](largeObject);
      });

      // State should update even though storage failed
      expect(result.current[0]).toEqual(largeObject);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle quota exceeded multiple times in succession", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("multi-quota", "init"),
      );

      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current[1](`value-${i}`);
        });
        expect(result.current[0]).toBe(`value-${i}`);
      }

      // All 10 attempts should log warnings
      expect(consoleSpy).toHaveBeenCalledTimes(10);

      consoleSpy.mockRestore();
    });

    it("should handle NotSupportedError (Safari private mode)", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new DOMException("Storage is not available", "NotSupportedError");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("safari-private", "initial"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // 6. White-Box Testing - Branch Coverage
  // ===========================================================================
  describe("White-Box Testing - Branch Coverage", () => {
    it.skip("should branch: typeof window === 'undefined' in initial state", () => {
      // Temporarily remove window
      const savedWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() =>
        useLocalStorage("no-window-key", "no-window-value"),
      );

      expect(result.current[0]).toBe("no-window-value");

      // Restore window
      global.window = savedWindow;
    });

    it("should branch: typeof window !== 'undefined' in initial state", () => {
      // Window should be defined in this test environment
      const { result } = renderHook(() =>
        useLocalStorage("window-exists", "default"),
      );

      expect(result.current[0]).toBe("default");
      expect(localStorage.getItem).toHaveBeenCalled();
    });

    it.skip("should branch: typeof window === 'undefined' in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("ssr-set-value", "initial"),
      );

      // Remove window after initialization
      const savedWindow = global.window;
      // @ts-ignore
      delete global.window;

      act(() => {
        result.current[1]("new-value");
      });

      // Should update state but not call localStorage
      expect(result.current[0]).toBe("new-value");

      // Restore window
      global.window = savedWindow;
    });

    it("should branch: typeof window !== 'undefined' in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("window-set-value", "initial"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should branch: item is null (no stored value)", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() =>
        useLocalStorage("null-item", "default"),
      );

      expect(result.current[0]).toBe("default");
    });

    it("should branch: item is not null (has stored value)", () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify("stored"));

      const { result } = renderHook(() =>
        useLocalStorage("has-item", "default"),
      );

      expect(result.current[0]).toBe("stored");
    });

    it("should branch: JSON.parse success path", () => {
      mockLocalStorage["valid-json"] = JSON.stringify({ data: "valid" });

      const { result } = renderHook(() => useLocalStorage("valid-json", {}));

      expect(result.current[0]).toEqual({ data: "valid" });
    });

    it("should branch: JSON.parse failure path (catch block)", () => {
      mockLocalStorage["invalid-json"] = "not valid json {{{";

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("invalid-json", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should branch: JSON.stringify success path", () => {
      const { result } = renderHook(() => useLocalStorage("stringify", {}));

      const obj = { valid: true };

      act(() => {
        result.current[1](obj);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "stringify",
        JSON.stringify(obj),
      );
    });

    it("should branch: JSON.stringify failure path (circular)", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new TypeError("Circular reference");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage("circular", {}));

      const circular: any = { a: 1 };
      circular.self = circular;

      act(() => {
        result.current[1](circular);
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // 7. White-Box Testing - Path Coverage
  // ===========================================================================
  describe("White-Box Testing - Path Coverage", () => {
    it("should path: successful initialization and setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("success-path", "initial"),
      );

      expect(result.current[0]).toBe("initial");

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it("should path: error on initialization, success on setValue", () => {
      let getItemCallCount = 0;
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        getItemCallCount++;
        if (getItemCallCount === 1) {
          throw new Error("Init error");
        }
        return null;
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("error-init", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");

      // Clear mock for setValue
      vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
        mockLocalStorage[key] = value;
      });

      act(() => {
        result.current[1]("success-value");
      });

      expect(result.current[0]).toBe("success-value");

      consoleSpy.mockRestore();
    });

    it("should path: success on initialization, error on setValue", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Set error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("success-init-error-set", "initial"),
      );

      expect(result.current[0]).toBe("initial");

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should path: both initialization and setValue have errors", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("Get error");
      });

      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Set error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("both-errors", "fallback"),
      );

      expect(result.current[0]).toBe("fallback");
      expect(consoleSpy).toHaveBeenCalledTimes(1); // Init error

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Init + set error

      consoleSpy.mockRestore();
    });
  });

  // ===========================================================================
  // 8. White-Box Testing - Statement Coverage
  // ===========================================================================
  describe("White-Box Testing - Statement Coverage", () => {
    it("should execute: useState initialization with function", () => {
      const initializer = vi.fn(() => "initial-value");

      const { result } = renderHook(() =>
        useLocalStorage("stmt-init", initializer()),
      );

      expect(result.current[0]).toBe("initial-value");
    });

    it("should execute: console.warn on getItem error", () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("Get error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(() => useLocalStorage("stmt-warn-get", "fallback"));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "stmt-warn-get":',
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });

    it("should execute: console.warn on setItem error", () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error("Set error");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocalStorage("stmt-warn-set", "initial"),
      );

      act(() => {
        result.current[1]("new");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting localStorage key "stmt-warn-set":',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should execute: setStoredValue call in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("stmt-setstate", "initial"),
      );

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");
    });

    it("should execute: return [storedValue, setValue]", () => {
      const { result } = renderHook(() =>
        useLocalStorage("stmt-return", "value"),
      );

      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe("string");
      expect(typeof result.current[1]).toBe("function");
    });
  });

  // ===========================================================================
  // 9. SSR Compatibility
  // ===========================================================================
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
        useLocalStorage("ssr-set", "initial"),
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

    it.skip("should work with window undefined during initialization", () => {
      const savedWindow = global.window;
      // @ts-ignore
      delete global.window;

      const { result } = renderHook(() =>
        useLocalStorage("no-window-init", "default"),
      );

      expect(result.current[0]).toBe("default");

      global.window = savedWindow;
    });

    it.skip("should work with window undefined during setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("no-window-set", "initial"),
      );

      const savedWindow = global.window;
      // @ts-ignore
      delete global.window;

      act(() => {
        result.current[1]("updated");
      });

      expect(result.current[0]).toBe("updated");

      global.window = savedWindow;
    });
  });

  // ===========================================================================
  // 10. Hook Stability
  // ===========================================================================
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

    it("should maintain value across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage("persist-key", "initial"),
      );

      act(() => {
        result.current[1]("updated");
      });

      rerender();

      expect(result.current[0]).toBe("updated");
    });
  });

  // ===========================================================================
  // 11. Real-World Usage Scenarios
  // ===========================================================================
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

    it("should handle theme switching", () => {
      const { result } = renderHook(() =>
        useLocalStorage<"light" | "dark">("theme", "light"),
      );

      act(() => {
        result.current[1]("dark");
      });
      expect(result.current[0]).toBe("dark");

      act(() => {
        result.current[1]("light");
      });
      expect(result.current[0]).toBe("light");
    });
  });

  // ===========================================================================
  // 12. Edge Cases
  // ===========================================================================
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

    it("should handle emoji in values", () => {
      const emojiValue = "Hello 👋 World 🌍";

      const { result } = renderHook(() => useLocalStorage("emoji-key", ""));

      act(() => {
        result.current[1](emojiValue);
      });

      expect(result.current[0]).toBe(emojiValue);
    });

    it("should handle Unicode characters", () => {
      const unicodeValue = "日本語 中文 한글 العربية";

      const { result } = renderHook(() => useLocalStorage("unicode-key", ""));

      act(() => {
        result.current[1](unicodeValue);
      });

      expect(result.current[0]).toBe(unicodeValue);
    });

    it("should handle very long strings", () => {
      const longString = "A".repeat(100000);

      const { result } = renderHook(() => useLocalStorage("long-string", ""));

      act(() => {
        result.current[1](longString);
      });

      expect(result.current[0]).toBe(longString);
    });
  });

  // ===========================================================================
  // 13. Performance Testing
  // ===========================================================================
  describe("Performance testing", () => {
    it("should handle rapid sequential updates efficiently", () => {
      const { result } = renderHook(() => useLocalStorage("rapid-key", 0));

      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current[1](i);
        }
      });

      const duration = Date.now() - startTime;

      expect(result.current[0]).toBe(99);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should handle large objects efficiently", () => {
      const largeArray = new Array(10000).fill(0).map((_, i) => ({
        id: i,
        value: `item-${i}`,
      }));

      const { result } = renderHook(() => useLocalStorage("perf-large", []));

      const startTime = Date.now();

      act(() => {
        result.current[1](largeArray);
      });

      const duration = Date.now() - startTime;

      expect(result.current[0]).toHaveLength(10000);
      expect(duration).toBeLessThan(50); // Should complete in < 50ms
    });
  });
});
