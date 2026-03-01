/**
 * Background Sync Unit Tests - CORE LOGIC
 * Target: src/lib/pwa/background-sync.ts
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as bgSync from "@/lib/pwa/background-sync";

const originalSWR = (globalThis as any).ServiceWorkerRegistration;
const originalSyncManager = (window as any).SyncManager;

function setBackgroundSyncSupported(supported: boolean) {
  if (supported) {
    (globalThis as any).ServiceWorkerRegistration = function ServiceWorkerRegistration() {};
    (globalThis as any).ServiceWorkerRegistration.prototype = {
      sync: {},
    };
    (window as any).SyncManager = function SyncManager() {};
  } else {
    (globalThis as any).ServiceWorkerRegistration = function ServiceWorkerRegistration() {};
    (globalThis as any).ServiceWorkerRegistration.prototype = {};
    try {
      delete (window as any).SyncManager;
    } catch {
      (window as any).SyncManager = undefined;
    }
  }
}

function mockServiceWorkerReady(syncApi: {
  register?: (tag: string) => Promise<void>;
  getTags?: () => Promise<string[]>;
}) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({
        sync: {
          register: syncApi.register ?? vi.fn().mockResolvedValue(undefined),
          getTags: syncApi.getTags ?? vi.fn().mockResolvedValue([]),
        },
      }),
    },
  });
}

describe("background-sync - CORE LOGIC", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    setBackgroundSyncSupported(false);
  });

  describe("isBackgroundSyncSupported", () => {
    it("return false saat API tidak tersedia", () => {
      setBackgroundSyncSupported(false);
      expect(bgSync.isBackgroundSyncSupported()).toBe(false);
    });

    it("return true saat serviceWorker + SyncManager + prototype.sync tersedia", () => {
      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({});

      expect(bgSync.isBackgroundSyncSupported()).toBe(true);
    });
  });

  describe("registerBackgroundSync", () => {
    it("return false saat tidak didukung", async () => {
      setBackgroundSyncSupported(false);

      const result = await bgSync.registerBackgroundSync(bgSync.SYNC_TAGS.QUIZ_ANSWERS);
      expect(result).toBe(false);
    });

    it("register tag dan simpan last_sync_registration saat sukses", async () => {
      setBackgroundSyncSupported(true);
      const registerSpy = vi.fn().mockResolvedValue(undefined);
      mockServiceWorkerReady({ register: registerSpy });

      const result = await bgSync.registerBackgroundSync(bgSync.SYNC_TAGS.OFFLINE_DATA);

      expect(result).toBe(true);
      expect(registerSpy).toHaveBeenCalledWith(bgSync.SYNC_TAGS.OFFLINE_DATA);

      const saved = JSON.parse(localStorage.getItem("last_sync_registration") || "{}");
      expect(saved.tag).toBe(bgSync.SYNC_TAGS.OFFLINE_DATA);
      expect(typeof saved.timestamp).toBe("string");
    });

    it("return false saat register gagal", async () => {
      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({
        register: vi.fn().mockRejectedValue(new Error("register failed")),
      });

      const result = await bgSync.registerBackgroundSync(bgSync.SYNC_TAGS.PERIODIC);
      expect(result).toBe(false);
    });
  });

  describe("getPendingSyncTags & getBackgroundSyncStatus", () => {
    it("getPendingSyncTags: return [] saat unsupported", async () => {
      setBackgroundSyncSupported(false);
      const tags = await bgSync.getPendingSyncTags();
      expect(tags).toEqual([]);
    });

    it("getPendingSyncTags: ambil tags dari sync.getTags", async () => {
      setBackgroundSyncSupported(true);
      const getTagsSpy = vi
        .fn()
        .mockResolvedValue([bgSync.SYNC_TAGS.QUIZ_ANSWERS, bgSync.SYNC_TAGS.OFFLINE_DATA]);
      mockServiceWorkerReady({ getTags: getTagsSpy });

      const tags = await bgSync.getPendingSyncTags();

      expect(tags).toEqual([bgSync.SYNC_TAGS.QUIZ_ANSWERS, bgSync.SYNC_TAGS.OFFLINE_DATA]);
      expect(getTagsSpy).toHaveBeenCalledTimes(1);
    });

    it("getBackgroundSyncStatus: parsing localStorage valid", async () => {
      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({ getTags: vi.fn().mockResolvedValue([bgSync.SYNC_TAGS.PERIODIC]) });

      localStorage.setItem(
        "last_sync_registration",
        JSON.stringify({ tag: bgSync.SYNC_TAGS.PERIODIC, timestamp: "2026-01-01T00:00:00.000Z" }),
      );

      const status = await bgSync.getBackgroundSyncStatus();

      expect(status.supported).toBe(true);
      expect(status.registered).toBe(true);
      expect(status.pendingTags).toEqual([bgSync.SYNC_TAGS.PERIODIC]);
      expect(status.lastSync).toBeInstanceOf(Date);
    });

    it("getBackgroundSyncStatus: aman saat localStorage corrupt", async () => {
      setBackgroundSyncSupported(false);
      localStorage.setItem("last_sync_registration", "{invalid-json");

      const status = await bgSync.getBackgroundSyncStatus();

      expect(status.supported).toBe(false);
      expect(status.registered).toBe(false);
      expect(status.pendingTags).toEqual([]);
      expect(status.lastSync).toBeNull();
    });
  });

  describe("fallbackManualSync & smartSync", () => {
    it("fallbackManualSync: jalankan syncFunction sukses", async () => {
      const fn = vi.fn().mockResolvedValue(undefined);
      await expect(bgSync.fallbackManualSync(fn)).resolves.toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("fallbackManualSync: throw saat syncFunction gagal", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("manual failed"));
      await expect(bgSync.fallbackManualSync(fn)).rejects.toThrow("manual failed");
    });

    it("smartSync: method background saat register berhasil", async () => {
      const manualFn = vi.fn().mockResolvedValue(undefined);

      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({
        register: vi.fn().mockResolvedValue(undefined),
      });

      const result = await bgSync.smartSync(bgSync.SYNC_TAGS.QUIZ_ANSWERS, manualFn);

      expect(result).toEqual({ method: "background", success: true });
      expect(manualFn).not.toHaveBeenCalled();
    });

    it("smartSync: fallback manual saat register gagal", async () => {
      const manualFn = vi.fn().mockResolvedValue(undefined);

      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({
        register: vi.fn().mockRejectedValue(new Error("register failed")),
      });

      const result = await bgSync.smartSync(bgSync.SYNC_TAGS.OFFLINE_DATA, manualFn);

      expect(result).toEqual({ method: "manual", success: true });
      expect(manualFn).toHaveBeenCalledTimes(1);
    });

    it("smartSync: return manual false saat fallback gagal", async () => {
      setBackgroundSyncSupported(false);
      const manualFn = vi.fn().mockRejectedValue(new Error("sync failed"));

      const result = await bgSync.smartSync(bgSync.SYNC_TAGS.PERIODIC, manualFn);

      expect(result).toEqual({ method: "manual", success: false });
    });
  });

  describe("setupOnlineSync", () => {
    it("pasang & lepas listener saat unsupported", () => {
      setBackgroundSyncSupported(false);
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const cleanup = bgSync.setupOnlineSync(vi.fn().mockResolvedValue(undefined));

      expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
      cleanup();
      expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    });

    it("return no-op cleanup saat supported", () => {
      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({});

      const addSpy = vi.spyOn(window, "addEventListener");
      const cleanup = bgSync.setupOnlineSync(vi.fn().mockResolvedValue(undefined));

      expect(addSpy).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe("hasPendingSync", () => {
    it("unsupported: cek localStorage offline_quiz_answers", async () => {
      setBackgroundSyncSupported(false);
      localStorage.setItem("offline_quiz_answers", JSON.stringify([{ id: 1 }]));

      await expect(bgSync.hasPendingSync()).resolves.toBe(true);

      localStorage.removeItem("offline_quiz_answers");
      await expect(bgSync.hasPendingSync()).resolves.toBe(false);
    });

    it("supported: true jika tag tertentu ada", async () => {
      setBackgroundSyncSupported(true);
      mockServiceWorkerReady({
        getTags: vi.fn().mockResolvedValue([bgSync.SYNC_TAGS.QUIZ_ANSWERS]),
      });

      await expect(bgSync.hasPendingSync(bgSync.SYNC_TAGS.QUIZ_ANSWERS)).resolves.toBe(
        true,
      );
      await expect(bgSync.hasPendingSync(bgSync.SYNC_TAGS.OFFLINE_DATA)).resolves.toBe(
        false,
      );
    });
  });

  describe("sync logs", () => {
    it("logSyncEvent + getSyncLogs + clearSyncLogs", () => {
      bgSync.clearSyncLogs();
      expect(bgSync.getSyncLogs()).toEqual([]);

      bgSync.logSyncEvent("registered", bgSync.SYNC_TAGS.QUIZ_ANSWERS, { a: 1 });
      bgSync.logSyncEvent("completed", bgSync.SYNC_TAGS.QUIZ_ANSWERS);

      const logs = bgSync.getSyncLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].event).toBe("registered");
      expect(logs[1].event).toBe("completed");

      bgSync.clearSyncLogs();
      expect(bgSync.getSyncLogs()).toEqual([]);
    });

    it("getSyncLogs aman saat data corrupt", () => {
      localStorage.setItem("sync_logs", "{bad-json");
      expect(bgSync.getSyncLogs()).toEqual([]);
    });

    it("logSyncEvent mempertahankan maksimal 50 log", () => {
      bgSync.clearSyncLogs();

      for (let i = 0; i < 60; i += 1) {
        bgSync.logSyncEvent("registered", `tag-${i}`);
      }

      const logs = bgSync.getSyncLogs();
      expect(logs.length).toBe(50);
      expect(logs[0].tag).toBe("tag-10");
      expect(logs[49].tag).toBe("tag-59");
    });
  });
});

afterAll(() => {
  (globalThis as any).ServiceWorkerRegistration = originalSWR;
  if (originalSyncManager) {
    (window as any).SyncManager = originalSyncManager;
  } else {
    try {
      delete (window as any).SyncManager;
    } catch {
      (window as any).SyncManager = undefined;
    }
  }
});
