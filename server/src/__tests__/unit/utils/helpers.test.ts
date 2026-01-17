/**
 * Helper Utilities Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  unique,
  groupBy,
  deepClone,
  isEmpty,
  generateId,
  sleep,
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

  // Placeholder test
  it("should have helper utilities tests defined", () => {
    expect(true).toBe(true);
  });
});
