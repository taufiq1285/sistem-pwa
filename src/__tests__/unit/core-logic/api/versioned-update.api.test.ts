/**
 * Tests for versioned-update.api.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVersion,
  withVersion,
  type VersionedUpdateResult,
} from "@/lib/api/versioned-update.api";

// Note: We can only easily test the pure functions (getVersion, withVersion)
// The async functions require complex mocking of supabase which causes hoisting issues

describe("versioned-update.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVersion", () => {
    it("should extract _version from data", () => {
      expect(getVersion({ _version: 5, name: "test" })).toBe(5);
    });

    it("should extract version from data", () => {
      expect(getVersion({ version: 3, name: "test" })).toBe(3);
    });

    it("should prefer _version over version", () => {
      expect(getVersion({ _version: 5, version: 3 })).toBe(5);
    });

    it("should return 1 for data without version", () => {
      expect(getVersion({ name: "test" })).toBe(1);
    });

    it("should return 1 for null/undefined", () => {
      expect(getVersion(null)).toBe(1);
      expect(getVersion(undefined)).toBe(1);
    });
  });

  describe("withVersion", () => {
    it("should add _version to data", () => {
      const data = { name: "test", value: 42 };
      const result = withVersion(data, 7);

      expect(result).toEqual({
        name: "test",
        value: 42,
        _version: 7,
      });
    });

    it("should preserve existing properties", () => {
      const data = { id: "123", name: "test" };
      const result = withVersion(data, 1);

      expect(result.id).toBe("123");
      expect(result.name).toBe("test");
      expect(result._version).toBe(1);
    });
  });

  // Note: Tests for safeUpdateWithVersion, updateWithAutoResolve, etc.
  // require complex mocking setup that causes hoisting issues.
  // These are better tested through integration tests.
});
