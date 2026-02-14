/**
 * Tests for idempotency.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateRequestId,
  parseRequestId,
  addIdempotencyKey,
  extractIdempotencyKey,
  removeIdempotencyKey,
  isDuplicateRequest,
  isRequestExpired,
  getProcessedRequests,
  markRequestProcessed,
  wasRequestProcessed,
  cleanupProcessedRequests,
  formatRequestId,
  getIdempotencyStats,
  type IdempotencyConfig,
} from "@/lib/utils/idempotency";

describe("idempotency", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("generateRequestId", () => {
    it("should generate request ID with default config", () => {
      const id = generateRequestId("kuis" as any, "create" as any);

      expect(id).toMatch(/^req_kuis_create_\d+_[a-z0-9]{6}$/);
    });

    it("should include timestamp by default", () => {
      const id = generateRequestId("kuis" as any, "create" as any);
      const parts = id.split("_");

      expect(parts.length).toBe(5);
      expect(parts[3]).toMatch(/^\d+$/); // Timestamp
    });

    it("should use custom prefix from config", () => {
      const id = generateRequestId("kuis" as any, "create" as any, {
        prefix: "custom",
      });

      expect(id).toMatch(/^custom_kuis_create_/);
    });

    it("should exclude timestamp when configured", () => {
      const id = generateRequestId("kuis" as any, "create" as any, {
        includeTimestamp: false,
      });

      expect(id).toMatch(/^req_kuis_create_[a-z0-9]{6}$/);
    });

    it("should return empty string when disabled", () => {
      const id = generateRequestId("kuis" as any, "create" as any, {
        enabled: false,
      });

      expect(id).toBe("");
    });

    it("should generate unique IDs each time", () => {
      const id1 = generateRequestId("kuis" as any, "create" as any);
      const id2 = generateRequestId("kuis" as any, "create" as any);

      expect(id1).not.toBe(id2);
    });

    it("should include random suffix for uniqueness", () => {
      const id = generateRequestId("kuis" as any, "create" as any);
      const parts = id.split("_");
      const random = parts[parts.length - 1];

      expect(random).toMatch(/^[a-z0-9]{6}$/);
    });
  });

  describe("parseRequestId", () => {
    it("should parse valid request ID with timestamp", () => {
      const id = "req_kuis_create_1702736400000_abc123";
      const parsed = parseRequestId(id);

      expect(parsed).toEqual({
        prefix: "req",
        entity: "kuis",
        operation: "create",
        timestamp: 1702736400000,
        random: "abc123",
      });
    });

    it("should parse request ID without timestamp", () => {
      const id = "req_kuis_create_abc123";
      const parsed = parseRequestId(id);

      expect(parsed).toEqual({
        prefix: "req",
        entity: "kuis",
        operation: "create",
        random: "abc123",
      });
    });

    it("should return null for invalid request ID", () => {
      const parsed = parseRequestId("invalid");

      expect(parsed).toBeNull();
    });

    it("should return null for request ID with too few parts", () => {
      const parsed = parseRequestId("req_kuis");

      expect(parsed).toBeNull();
    });

    it("should handle request ID with non-numeric timestamp", () => {
      const id = "req_kuis_create_notatimestamp_abc123";
      const parsed = parseRequestId(id);

      expect(parsed).toEqual({
        prefix: "req",
        entity: "kuis",
        operation: "create",
        random: "abc123",
      });
      expect(parsed?.timestamp).toBeUndefined();
    });
  });

  describe("addIdempotencyKey", () => {
    it("should add _requestId to data", () => {
      const data = { judul: "Quiz 1", kelas_id: "123" };
      const result = addIdempotencyKey(data, "kuis" as any, "create" as any);

      expect(result.judul).toBe("Quiz 1");
      expect(result.kelas_id).toBe("123");
      expect(result._requestId).toMatch(/^req_kuis_create_/);
    });

    it("should not mutate original data", () => {
      const data = { judul: "Quiz 1" };
      const result = addIdempotencyKey(data, "kuis" as any, "create" as any);

      expect((data as any)._requestId).toBeUndefined();
      expect((result as any)._requestId).toBeDefined();
    });

    it("should not add requestId if already exists", () => {
      const data = { judul: "Quiz 1", _requestId: "existing-id" } as any;
      const result = addIdempotencyKey(data, "kuis" as any, "create" as any);

      expect((result as any)._requestId).toBe("existing-id");
    });

    it("should not add requestId when disabled", () => {
      const data = { judul: "Quiz 1" };
      const result = addIdempotencyKey(data, "kuis" as any, "create" as any, {
        enabled: false,
      });

      expect((result as any)._requestId).toBeUndefined();
    });
  });

  describe("extractIdempotencyKey", () => {
    it("should extract _requestId from data", () => {
      const data = {
        judul: "Quiz 1",
        _requestId: "req_kuis_create_123",
      } as any;
      const id = extractIdempotencyKey(data);

      expect(id).toBe("req_kuis_create_123");
    });

    it("should return undefined if _requestId not present", () => {
      const data = { judul: "Quiz 1" };
      const id = extractIdempotencyKey(data);

      expect(id).toBeUndefined();
    });
  });

  describe("removeIdempotencyKey", () => {
    it("should remove _requestId from data", () => {
      const data = {
        judul: "Quiz 1",
        _requestId: "req_kuis_create_123",
      } as any;
      const result = removeIdempotencyKey(data);

      expect(result.judul).toBe("Quiz 1");
      expect((result as any)._requestId).toBeUndefined();
    });

    it("should preserve other properties", () => {
      const data = {
        judul: "Quiz 1",
        kelas_id: "123",
        _requestId: "req_kuis_create_123",
      } as any;
      const result = removeIdempotencyKey(data);

      expect(result.judul).toBe("Quiz 1");
      expect(result.kelas_id).toBe("123");
    });
  });

  describe("isDuplicateRequest", () => {
    it("should return true for identical request IDs", () => {
      const result = isDuplicateRequest("req_123", "req_123");

      expect(result).toBe(true);
    });

    it("should return false for different request IDs", () => {
      const result = isDuplicateRequest("req_123", "req_456");

      expect(result).toBe(false);
    });
  });

  describe("isRequestExpired", () => {
    it("should return false for recent request", () => {
      const recentId = generateRequestId("kuis" as any, "create" as any);

      expect(isRequestExpired(recentId, 10000)).toBe(false);
    });

    it("should return true for old request", () => {
      const oldTimestamp = Date.now() - 20000; // 20 seconds ago
      const oldId = `req_kuis_create_${oldTimestamp}_abc123`;

      expect(isRequestExpired(oldId, 10000)).toBe(true);
    });

    it("should use default max age of 7 days", () => {
      const recentId = generateRequestId("kuis" as any, "create" as any);

      expect(isRequestExpired(recentId)).toBe(false);
    });

    it("should return false for request without timestamp", () => {
      const id = "req_kuis_create_abc123";

      expect(isRequestExpired(id, 1000)).toBe(false);
    });

    it("should return false for invalid request ID", () => {
      const id = "invalid";

      expect(isRequestExpired(id, 1000)).toBe(false);
    });
  });

  describe("getProcessedRequests", () => {
    it("should return empty array when no requests stored", () => {
      const requests = getProcessedRequests();

      expect(requests).toEqual([]);
    });

    it("should return stored requests", () => {
      localStorage.setItem("idempotency:processed", '["req_1", "req_2"]');

      const requests = getProcessedRequests();

      expect(requests).toEqual(["req_1", "req_2"]);
    });

    it("should return empty array on parse error", () => {
      localStorage.setItem("idempotency:processed", "invalid-json");

      const requests = getProcessedRequests();

      expect(requests).toEqual([]);
    });
  });

  describe("markRequestProcessed", () => {
    it("should mark request as processed", () => {
      markRequestProcessed("req_123");

      const requests = getProcessedRequests();

      expect(requests).toContain("req_123");
    });

    it("should not duplicate existing request", () => {
      markRequestProcessed("req_123");
      markRequestProcessed("req_123");

      const requests = getProcessedRequests();

      expect(requests.filter((id) => id === "req_123").length).toBe(1);
    });

    it("should limit entries to maxEntries", () => {
      // Add 5 requests
      for (let i = 0; i < 5; i++) {
        markRequestProcessed(`req_${i}`, 3);
      }

      const requests = getProcessedRequests();

      expect(requests.length).toBe(3);
      expect(requests).toEqual(["req_2", "req_3", "req_4"]);
    });
  });

  describe("wasRequestProcessed", () => {
    it("should return true for processed request", () => {
      markRequestProcessed("req_123");

      const result = wasRequestProcessed("req_123");

      expect(result).toBe(true);
    });

    it("should return false for unprocessed request", () => {
      const result = wasRequestProcessed("req_456");

      expect(result).toBe(false);
    });
  });

  describe("cleanupProcessedRequests", () => {
    it("should remove expired requests", () => {
      // Create request IDs with correct format: prefix_entity_operation_timestamp_random
      const oldTimestamp = Date.now() - 20000;
      const recentTimestamp = Date.now() - 1000;

      markRequestProcessed(`req_kuis_create_${oldTimestamp}_abc`);
      markRequestProcessed(`req_kuis_create_${recentTimestamp}_xyz`);

      const removed = cleanupProcessedRequests(10000); // 10 seconds

      expect(removed).toBe(1);
    });

    it("should return 0 when no requests to cleanup", () => {
      const recentId = generateRequestId("kuis" as any, "create" as any);
      markRequestProcessed(recentId);

      const removed = cleanupProcessedRequests(60000); // 1 minute

      expect(removed).toBe(0);
    });

    it("should return 0 on error", () => {
      // Corrupt the localStorage data
      localStorage.setItem("idempotency:processed", "invalid");

      const removed = cleanupProcessedRequests(1000);

      expect(removed).toBe(0);
    });
  });

  describe("formatRequestId", () => {
    it("should format request ID with timestamp", () => {
      const id = "req_kuis_create_1702736400000_abc123";
      const formatted = formatRequestId(id);

      expect(formatted).toMatch(/^req_kuis_create\.\.\..*abc123/);
    });

    it("should return original ID for invalid ID", () => {
      const formatted = formatRequestId("invalid");

      expect(formatted).toBe("invalid");
    });

    it("should format ID without timestamp", () => {
      const id = "req_kuis_create_abc123";
      const formatted = formatRequestId(id);

      expect(formatted).toMatch(/^req_kuis_create\.\.\.abc123$/);
    });
  });

  describe("getIdempotencyStats", () => {
    it("should return stats for empty requests", () => {
      const stats = getIdempotencyStats();

      expect(stats.total).toBe(0);
      expect(stats.expired).toBe(0);
      expect(stats.recent).toBe(0);
    });

    it("should count total requests", () => {
      markRequestProcessed("req_1");
      markRequestProcessed("req_2");

      const stats = getIdempotencyStats();

      expect(stats.total).toBe(2);
    });

    it("should count expired and recent requests", () => {
      // Use very old timestamps to exceed the default 7-day maxAge
      const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      const recentTimestamp = Date.now() - 1000; // 1 second ago

      markRequestProcessed(`req_kuis_create_${oldTimestamp}_abc`);
      markRequestProcessed(`req_kuis_create_${recentTimestamp}_xyz`);

      const stats = getIdempotencyStats();

      expect(stats.expired).toBe(1);
      expect(stats.recent).toBe(1);
    });

    it("should track oldest and newest timestamps", () => {
      const timestamp1 = Date.now() - 5000;
      const timestamp2 = Date.now() - 3000;
      const timestamp3 = Date.now() - 1000;

      markRequestProcessed(`req_kuis_create_${timestamp1}_abc`);
      markRequestProcessed(`req_kuis_create_${timestamp2}_def`);
      markRequestProcessed(`req_kuis_create_${timestamp3}_ghi`);

      const stats = getIdempotencyStats();

      expect(stats.oldestTimestamp).toBe(timestamp1);
      expect(stats.newestTimestamp).toBe(timestamp3);
    });
  });
});
