/**
 * Helper Utilities Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import {
  unique,
  groupBy,
  deepClone,
  isEmpty,
  generateId,
  sleep,
  chunk,
  omit,
  pick,
  clamp,
  isDefined,
  safeJsonParse,
  debounce,
  throttle,
} from "../../../lib/utils/helpers";

describe("Helper Utilities", () => {
  describe("array helpers", () => {
    it("should remove duplicates from array", () => {
      const numbers = [1, 2, 2, 3, 4, 4, 5];
      expect(unique(numbers)).toEqual([1, 2, 3, 4, 5]);

      const users = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 1, name: "Alice Duplicate" },
      ];
      const uniqueUsers = unique(users, "id");
      expect(uniqueUsers).toHaveLength(2);
      expect(uniqueUsers[0].id).toBe(1);
      expect(uniqueUsers[1].id).toBe(2);
    });

    it("should group items by key", () => {
      const users = [
        { id: 1, role: "admin" },
        { id: 2, role: "user" },
        { id: 3, role: "admin" },
      ];

      const grouped = groupBy(users, "role");

      expect(grouped["admin"]).toHaveLength(2);
      expect(grouped["user"]).toHaveLength(1);
      expect(grouped["admin"][0].id).toBe(1);
      expect(grouped["admin"][1].id).toBe(3);
    });
  });

  describe("object helpers", () => {
    it("should deep clone object", () => {
      const original = {
        name: "Test",
        nested: { value: 123 },
        array: [1, 2, 3],
      };

      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.array).not.toBe(original.array);

      // Modify clone shouldn't affect original
      cloned.nested.value = 456;
      expect(original.nested.value).toBe(123);
    });

    it("should check if object/array is empty", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);

      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty([1, 2])).toBe(false);
      expect(isEmpty({ key: "value" })).toBe(false);
    });
  });

  describe("string helpers", () => {
    it("should generate unique ID", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
    });

    it("should sleep for specified duration", async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe("array manipulation", () => {
    it("should chunk array into smaller arrays", () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const chunks3 = chunk(arr, 3);
      expect(chunks3).toHaveLength(4);
      expect(chunks3[0]).toEqual([1, 2, 3]);
      expect(chunks3[1]).toEqual([4, 5, 6]);
      expect(chunks3[2]).toEqual([7, 8, 9]);
      expect(chunks3[3]).toEqual([10]);

      // Test edge cases
      expect(chunk([], 3)).toEqual([]);
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });
  });

  describe("object manipulation", () => {
    it("should omit specified keys from object", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };

      const result = omit(obj, ["b", "d"]);
      expect(result).toEqual({ a: 1, c: 3 });

      // Should not mutate original
      expect(obj).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    it("should pick specified keys from object", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };

      const result = pick(obj, ["b", "d"]);
      expect(result).toEqual({ b: 2, d: 4 });

      // Test with non-existent keys
      const result2 = pick(obj, ["b", "nonexistent" as keyof typeof obj]);
      expect(result2).toEqual({ b: 2 });
    });
  });

  describe("number utilities", () => {
    it("should clamp numbers within range", () => {
      expect(clamp(5, 1, 10)).toBe(5);
      expect(clamp(15, 1, 10)).toBe(10);
      expect(clamp(-5, 1, 10)).toBe(1);
      expect(clamp(1, 1, 10)).toBe(1);
      expect(clamp(10, 1, 10)).toBe(10);
    });
  });

  describe("type guards", () => {
    it("should check if value is defined", () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(0)).toBe(true);
      expect(isDefined("")).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
      expect(isDefined([])).toBe(true);
    });
  });

  describe("JSON parsing", () => {
    it("should safely parse valid JSON", () => {
      const validJson = '{"name": "test", "value": 123}';
      const fallback = { default: true };

      const result = safeJsonParse(validJson, fallback);
      expect(result).toEqual({ name: "test", value: 123 });
    });

    it("should return fallback for invalid JSON", () => {
      const invalidJson = "{invalid json}";
      const fallback = { error: "parsing failed" };

      const result = safeJsonParse(invalidJson, fallback);
      expect(result).toEqual(fallback);
    });

    it("should return fallback for empty string", () => {
      const fallback = { empty: true };

      const result = safeJsonParse("", fallback);
      expect(result).toEqual(fallback);
    });
  });

  describe("function utilities", () => {
    it("should debounce function calls", () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      debouncedFn("arg1");
      debouncedFn("arg2");
      debouncedFn("arg3");

      // Should not call immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Should call after debounce period with last args
      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith("arg3");

      vi.useRealTimers();
    });

    it("should throttle function calls", () => {
      vi.useFakeTimers();

      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      // Call multiple times rapidly
      throttledFn("arg1");
      throttledFn("arg2"); // Should be ignored
      throttledFn("arg3"); // Should be ignored

      // Should call immediately with first args
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith("arg1");

      // After throttle period, should be able to call again
      vi.advanceTimersByTime(100);
      throttledFn("arg4");

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith("arg4");

      vi.useRealTimers();
    });
  });

  describe("deep clone edge cases", () => {
    it("should clone Date objects correctly", () => {
      const date = new Date("2023-01-01T00:00:00.000Z");
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned instanceof Date).toBe(true);
    });

    it("should handle null and primitive values", () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
      expect(deepClone(123)).toBe(123);
      expect(deepClone("string")).toBe("string");
      expect(deepClone(true)).toBe(true);
    });

    it("should clone complex nested structures", () => {
      const complex = {
        date: new Date("2023-01-01"),
        array: [1, { nested: true }, [2, 3]],
        object: {
          deep: {
            value: "test",
            array: [4, 5, 6],
          },
        },
      };

      const cloned = deepClone(complex);

      expect(cloned).toEqual(complex);
      expect(cloned).not.toBe(complex);
      expect(cloned.date).not.toBe(complex.date);
      expect(cloned.array).not.toBe(complex.array);
      expect(cloned.object.deep).not.toBe(complex.object.deep);
    });
  });

  describe("isEmpty edge cases", () => {
    it("should handle various empty scenarios", () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
      expect(isEmpty(NaN)).toBe(false);
      expect(isEmpty("   ")).toBe(false); // Non-empty string with spaces
    });
  });

  describe("groupBy edge cases", () => {
    it("should handle empty arrays", () => {
      expect(groupBy([], "id")).toEqual({});
    });

    it("should handle arrays with undefined/null values", () => {
      const items = [
        { id: "1", value: null },
        { id: null, value: "test" },
        { id: undefined, value: "test2" },
      ];

      const grouped = groupBy(items, "id");
      expect(grouped["1"]).toHaveLength(1);
      expect(grouped["null"]).toHaveLength(1);
      expect(grouped["undefined"]).toHaveLength(1);
    });
  });

  // Placeholder test
  it("should have helper utilities tests defined", () => {
    expect(true).toBe(true);
  });
});
