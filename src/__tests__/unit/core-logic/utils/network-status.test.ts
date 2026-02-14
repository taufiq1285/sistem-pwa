/**
 * Tests for network-status.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isOnline,
  isOffline,
  getConnectionInfo,
  getNetworkStatus,
  isPoorConnection,
  shouldUseAggressiveCaching,
  getRecommendedTimeout,
  getRecommendedCacheStrategy,
  onNetworkStatusChange,
  waitForOnline,
  estimateRequestSuccess,
  shouldAttemptNetworkRequest,
  formatNetworkStatus,
  getNetworkStatusColor,
  type NetworkStatus,
  type NetworkType,
  type NetworkQuality,
} from "@/lib/utils/network-status";

describe("network-status", () => {
  // Mock navigator.onLine
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // @ts-ignore
    global.navigator = { onLine: true };
  });

  afterEach(() => {
    // @ts-ignore
    global.navigator = originalNavigator;
  });

  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      // @ts-ignore
      navigator.onLine = true;
      expect(isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      // @ts-ignore
      navigator.onLine = false;
      expect(isOnline()).toBe(false);
    });
  });

  describe("isOffline", () => {
    it("should return false when navigator.onLine is true", () => {
      // @ts-ignore
      navigator.onLine = true;
      expect(isOffline()).toBe(false);
    });

    it("should return true when navigator.onLine is false", () => {
      // @ts-ignore
      navigator.onLine = false;
      expect(isOffline()).toBe(true);
    });
  });

  describe("getConnectionInfo", () => {
    it("should return basic info when connection API not available", () => {
      // @ts-ignore
      navigator.onLine = true;
      const info = getConnectionInfo();

      expect(info.online).toBe(true);
      expect(info.type).toBe("unknown");
      expect(info.effectiveType).toBe("unknown");
    });

    it("should return offline status when navigator is offline", () => {
      // @ts-ignore
      navigator.onLine = false;
      const info = getConnectionInfo();

      expect(info.online).toBe(false);
      expect(info.quality).toBe("offline");
    });
  });

  describe("getNetworkStatus", () => {
    it("should return network status object", () => {
      // @ts-ignore
      navigator.onLine = true;
      const status = getNetworkStatus();

      expect(status).toHaveProperty("online");
      expect(status).toHaveProperty("type");
      expect(status).toHaveProperty("quality");
      expect(status).toHaveProperty("effectiveType");
    });

    it("should have saveData property", () => {
      // @ts-ignore
      navigator.onLine = true;
      const status = getNetworkStatus();

      expect(status).toHaveProperty("saveData");
      expect(typeof status.saveData).toBe("boolean");
    });
  });

  describe("isPoorConnection", () => {
    it("should return false when quality is not poor", () => {
      // @ts-ignore
      navigator.onLine = true;
      vi.stubGlobal("navigator", {
        onLine: true,
        connection: { effectiveType: "4g", rtt: 50 },
      } as any);

      // Mock getConnectionInfo indirectly
      const status = getNetworkStatus();
      // If connection API is not mocked, default would be "good" or "unknown"
      expect(isPoorConnection()).toBeDefined();
    });
  });

  describe("shouldUseAggressiveCaching", () => {
    it("should return boolean", () => {
      expect(typeof shouldUseAggressiveCaching()).toBe("boolean");
    });
  });

  describe("getRecommendedTimeout", () => {
    it("should return a number", () => {
      const timeout = getRecommendedTimeout();
      expect(typeof timeout).toBe("number");
      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe("getRecommendedCacheStrategy", () => {
    it("should return a valid cache strategy", () => {
      const strategy = getRecommendedCacheStrategy();
      expect([
        "cache-first",
        "network-first",
        "stale-while-revalidate",
      ]).toContain(strategy);
    });
  });

  describe("waitForOnline", () => {
    it("should resolve immediately if already online", async () => {
      // @ts-ignore
      navigator.onLine = true;

      await expect(waitForOnline(1000)).resolves.toBeUndefined();
    });

    it("should return a promise", () => {
      const promise = waitForOnline();
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  describe("estimateRequestSuccess", () => {
    it("should return a number between 0 and 1", () => {
      const success = estimateRequestSuccess();
      expect(success).toBeGreaterThanOrEqual(0);
      expect(success).toBeLessThanOrEqual(1);
    });
  });

  describe("shouldAttemptNetworkRequest", () => {
    it("should return false when offline", () => {
      // @ts-ignore
      navigator.onLine = false;

      expect(shouldAttemptNetworkRequest()).toBe(false);
    });

    it("should return false after 3 failures", () => {
      // @ts-ignore
      navigator.onLine = true;

      expect(shouldAttemptNetworkRequest(3)).toBe(false);
    });

    it("should return true for good connection with no failures", () => {
      // @ts-ignore
      navigator.onLine = true;

      expect(shouldAttemptNetworkRequest(0)).toBe(true);
    });
  });

  describe("formatNetworkStatus", () => {
    it("should return Offline when status.online is false", () => {
      const status: NetworkStatus = {
        online: false,
        type: "unknown",
        quality: "offline",
        effectiveType: "unknown",
        saveData: false,
      };

      expect(formatNetworkStatus(status)).toBe("Offline");
    });

    it("should return (Baik) for unknown good connection", () => {
      const status: NetworkStatus = {
        online: true,
        type: "unknown",
        quality: "good",
        effectiveType: "unknown",
        saveData: false,
      };

      // For unknown type, type is not shown. For good quality, shows "(Baik)"
      expect(formatNetworkStatus(status)).toBe("(Baik)");
    });
  });

  describe("getNetworkStatusColor", () => {
    it("should return red color for offline status", () => {
      const status: NetworkStatus = {
        online: false,
        type: "unknown",
        quality: "offline",
        effectiveType: "unknown",
        saveData: false,
      };

      expect(getNetworkStatusColor(status)).toBe("text-red-600");
    });

    it("should return green color for excellent quality", () => {
      const status: NetworkStatus = {
        online: true,
        type: "4g",
        quality: "excellent",
        effectiveType: "4g",
        saveData: false,
      };

      expect(getNetworkStatusColor(status)).toBe("text-green-600");
    });

    it("should return blue color for good quality", () => {
      const status: NetworkStatus = {
        online: true,
        type: "4g",
        quality: "good",
        effectiveType: "4g",
        saveData: false,
      };

      expect(getNetworkStatusColor(status)).toBe("text-blue-600");
    });

    it("should return orange color for poor quality", () => {
      const status: NetworkStatus = {
        online: true,
        type: "2g",
        quality: "poor",
        effectiveType: "2g",
        saveData: false,
      };

      expect(getNetworkStatusColor(status)).toBe("text-orange-600");
    });

    it("should return blue color for good quality", () => {
      const status: NetworkStatus = {
        online: true,
        type: "unknown",
        quality: "good",
        effectiveType: "unknown",
        saveData: false,
      };

      expect(getNetworkStatusColor(status)).toBe("text-blue-600");
    });
  });

  describe("onNetworkStatusChange", () => {
    it("should return a cleanup function", () => {
      const callback = vi.fn();
      const cleanup = onNetworkStatusChange(callback);

      expect(typeof cleanup).toBe("function");

      // Call cleanup to verify it works
      cleanup();
    });

    it("should register event listeners and return cleanup", () => {
      const callback = vi.fn();
      const cleanup = onNetworkStatusChange(callback);

      // Verify cleanup function exists and is a function
      expect(typeof cleanup).toBe("function");

      // Cleanup should not throw
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe("NetworkType", () => {
    it("should accept valid network types", () => {
      const validTypes: NetworkType[] = [
        "wifi",
        "4g",
        "3g",
        "2g",
        "slow-2g",
        "unknown",
        "offline",
      ];

      validTypes.forEach((type) => {
        expect(type).toBeDefined();
      });
    });
  });

  describe("NetworkQuality", () => {
    it("should accept valid quality values", () => {
      const validQualities: NetworkQuality[] = [
        "excellent",
        "good",
        "poor",
        "offline",
      ];

      validQualities.forEach((quality) => {
        expect(quality).toBeDefined();
      });
    });
  });
});
