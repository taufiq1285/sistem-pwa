/**
 * offline.config Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  OFFLINE_CONFIG,
  SYNC_CONFIG,
  INDEXEDDB_CONFIG,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  BACKGROUND_SYNC_CONFIG,
  PERSISTENCE_CONFIG,
} from "@/config/offline.config";

describe("OFFLINE_CONFIG", () => {
  it("offline mode aktif", () => {
    expect(OFFLINE_CONFIG.enabled).toBe(true);
  });

  it("autoSyncOnReconnect aktif", () => {
    expect(OFFLINE_CONFIG.autoSyncOnReconnect).toBe(true);
  });

  it("memiliki semua field yang diperlukan", () => {
    expect(OFFLINE_CONFIG).toHaveProperty("enabled");
    expect(OFFLINE_CONFIG).toHaveProperty("showIndicator");
    expect(OFFLINE_CONFIG).toHaveProperty("autoSyncOnReconnect");
    expect(OFFLINE_CONFIG).toHaveProperty("notifyOnOffline");
    expect(OFFLINE_CONFIG).toHaveProperty("notifyOnOnline");
  });
});

describe("SYNC_CONFIG", () => {
  it("autoSync dikonfigurasi dengan benar", () => {
    expect(SYNC_CONFIG.autoSync.enabled).toBe(true);
    expect(SYNC_CONFIG.autoSync.interval).toBeGreaterThan(0);
    expect(SYNC_CONFIG.autoSync.onlyWhenOnline).toBe(true);
  });

  it("retry config bernilai valid", () => {
    expect(SYNC_CONFIG.retry.maxAttempts).toBeGreaterThan(0);
    expect(SYNC_CONFIG.retry.delayMs).toBeGreaterThan(0);
    expect(SYNC_CONFIG.retry.backoffMultiplier).toBeGreaterThanOrEqual(1);
    expect(SYNC_CONFIG.retry.maxDelayMs).toBeGreaterThan(SYNC_CONFIG.retry.delayMs);
  });

  it("batch config dikonfigurasi dengan benar", () => {
    expect(SYNC_CONFIG.batch.maxBatchSize).toBeGreaterThan(0);
  });

  it("priority memiliki kategori high, medium, low", () => {
    expect(SYNC_CONFIG.priority).toHaveProperty("high");
    expect(SYNC_CONFIG.priority).toHaveProperty("medium");
    expect(SYNC_CONFIG.priority).toHaveProperty("low");
    expect(Array.isArray(SYNC_CONFIG.priority.high)).toBe(true);
  });

  it("conflictResolution strategy adalah string valid", () => {
    expect(SYNC_CONFIG.conflictResolution.strategy).toBe("last-write-wins");
  });
});

describe("INDEXEDDB_CONFIG", () => {
  it("dbName tidak kosong", () => {
    expect(typeof INDEXEDDB_CONFIG.dbName).toBe("string");
    expect(INDEXEDDB_CONFIG.dbName.length).toBeGreaterThan(0);
  });

  it("version minimal 1", () => {
    expect(INDEXEDDB_CONFIG.version).toBeGreaterThanOrEqual(1);
  });

  it("quota values urut: target > warning < critical", () => {
    expect(INDEXEDDB_CONFIG.quota.warning).toBeLessThan(INDEXEDDB_CONFIG.quota.target);
    expect(INDEXEDDB_CONFIG.quota.critical).toBeLessThanOrEqual(INDEXEDDB_CONFIG.quota.target);
    expect(INDEXEDDB_CONFIG.quota.warning).toBeLessThan(INDEXEDDB_CONFIG.quota.critical);
  });
});

describe("CACHE_CONFIG", () => {
  it("cache name tidak kosong", () => {
    expect(CACHE_CONFIG.name.length).toBeGreaterThan(0);
  });

  it("strategies memiliki static, api, dan images", () => {
    expect(CACHE_CONFIG.strategies).toHaveProperty("static");
    expect(CACHE_CONFIG.strategies).toHaveProperty("api");
    expect(CACHE_CONFIG.strategies).toHaveProperty("images");
  });

  it("precache mengandung halaman utama", () => {
    expect(CACHE_CONFIG.precache).toContain("/");
    expect(CACHE_CONFIG.precache).toContain("/index.html");
  });
});

describe("NETWORK_CONFIG", () => {
  it("pingInterval bernilai positif", () => {
    expect(NETWORK_CONFIG.pingInterval).toBeGreaterThan(0);
  });

  it("quality thresholds naik secara berurutan", () => {
    expect(NETWORK_CONFIG.quality.good).toBeLessThan(NETWORK_CONFIG.quality.moderate);
    expect(NETWORK_CONFIG.quality.moderate).toBeLessThan(NETWORK_CONFIG.quality.poor);
  });

  it("offlineDetection dikonfigurasi", () => {
    expect(NETWORK_CONFIG.offlineDetection).toHaveProperty("enabled");
  });
});

describe("BACKGROUND_SYNC_CONFIG", () => {
  it("tags memiliki quizAnswers dan offlineData", () => {
    expect(BACKGROUND_SYNC_CONFIG.tags).toHaveProperty("quizAnswers");
    expect(BACKGROUND_SYNC_CONFIG.tags).toHaveProperty("offlineData");
  });

  it("retry config dikonfigurasi dengan benar", () => {
    expect(BACKGROUND_SYNC_CONFIG.retry.maxRetries).toBeGreaterThan(0);
    expect(BACKGROUND_SYNC_CONFIG.retry.initialDelay).toBeGreaterThan(0);
  });
});

describe("PERSISTENCE_CONFIG", () => {
  it("kuis persistence dikonfigurasi", () => {
    expect(PERSISTENCE_CONFIG.persist.kuis.enabled).toBe(true);
    expect(Array.isArray(PERSISTENCE_CONFIG.persist.kuis.stores)).toBe(true);
  });

  it("attempts persistence dikonfigurasi", () => {
    expect(PERSISTENCE_CONFIG.persist.attempts.enabled).toBe(true);
  });

  it("autoCleanup aktif", () => {
    expect(PERSISTENCE_CONFIG.autoCleanup).toBe(true);
  });
});
