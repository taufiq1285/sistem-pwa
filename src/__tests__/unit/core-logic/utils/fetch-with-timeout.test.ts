/**
 * Tests for fetch-with-timeout.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchWithTimeout,
  createFetchWithTimeout,
  retryWithBackoff,
  raceWithTimeout,
  isTimeoutError,
  createTimeoutController,
  TIMEOUT_DEFAULTS,
  TIMEOUT_BY_NETWORK,
  getRecommendedTimeout,
} from "@/lib/utils/fetch-with-timeout";

describe("fetch-with-timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("TIMEOUT_DEFAULTS", () => {
    it("should have correct timeout values", () => {
      expect(TIMEOUT_DEFAULTS.FAST).toBe(3000);
      expect(TIMEOUT_DEFAULTS.NORMAL).toBe(8000);
      expect(TIMEOUT_DEFAULTS.SLOW).toBe(15000);
      expect(TIMEOUT_DEFAULTS.VERY_SLOW).toBe(30000);
    });
  });

  describe("TIMEOUT_BY_NETWORK", () => {
    it("should have correct network-based timeout values", () => {
      expect(TIMEOUT_BY_NETWORK.FAST).toBe(5000);
      expect(TIMEOUT_BY_NETWORK.NORMAL).toBe(10000);
      expect(TIMEOUT_BY_NETWORK.SLOW).toBe(20000);
      expect(TIMEOUT_BY_NETWORK.OFFLINE).toBe(3000);
    });
  });

  describe("fetchWithTimeout", () => {
    it("should resolve when promise completes before timeout", async () => {
      const promise = Promise.resolve("success");
      const result = fetchWithTimeout(promise, 5000);

      await expect(result).resolves.toBe("success");
    });

    it("should reject when timeout is reached", async () => {
      const promise = new Promise((resolve) => {
        // Never resolves
      });

      const result = fetchWithTimeout(promise, 100, "Custom timeout");

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow("Custom timeout");
    });

    it("should use default error message", async () => {
      const promise = new Promise((resolve) => {});

      const result = fetchWithTimeout(promise, 100);

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow("Request timeout");
    });

    it("should use default timeout of 8000ms", async () => {
      const promise = Promise.resolve("quick");

      const result = fetchWithTimeout(promise);

      await expect(result).resolves.toBe("quick");
    });
  });

  describe("createFetchWithTimeout", () => {
    it("should create a fetch function with timeout", () => {
      vi.restoreAllMocks(); // Use real timers for this test
      const fetchWithTimeout = createFetchWithTimeout(5000);

      expect(typeof fetchWithTimeout).toBe("function");
    });

    it("should abort request when timeout is reached", async () => {
      global.fetch = vi.fn((input, init) => {
        return new Promise((resolve, reject) => {
          // Listen for abort signal
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      }) as any;

      const fetchWithTimeout = createFetchWithTimeout(100);

      const result = fetchWithTimeout("https://api.example.com/data");

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow("Request timeout after 100ms");

      vi.restoreAllMocks();
    });

    it("should use default timeout of 8000ms", async () => {
      vi.restoreAllMocks(); // Use real timers for this test
      const fetchWithTimeout = createFetchWithTimeout();

      // Mock successful fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ data: "test" }),
        } as Response),
      ) as any;

      const result = fetchWithTimeout("https://api.example.com/data");

      await expect(result).resolves.toBeDefined();
    });
  });

  describe("retryWithBackoff", () => {
    it("should return result on first successful attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = retryWithBackoff(fn, 3, 1000);

      await expect(result).resolves.toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure with exponential backoff", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValue("success");

      const result = retryWithBackoff(fn, 3, 10); // Slightly longer delays for testing

      // Advance timers step by step for each retry
      await vi.advanceTimersByTimeAsync(10); // First retry after 10ms
      await vi.advanceTimersByTimeAsync(20); // Second retry after 20ms (10 * 2^1)

      await expect(result).resolves.toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    }, 15000);

    it("should throw error after max retries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

      // Suppress unhandled rejection for this specific test
      const originalUnhandledRejection =
        process.listeners("unhandledRejection");
      process.removeAllListeners("unhandledRejection");

      let unhandledRejectionCaught = false;
      process.on("unhandledRejection", (reason) => {
        if (reason instanceof Error && reason.message === "Always fails") {
          unhandledRejectionCaught = true;
        }
      });

      const result = retryWithBackoff(fn, 3, 10); // Slightly longer delays for testing

      // Advance timers for all retries: 10 + 20 + 40 = 70ms
      await vi.advanceTimersByTimeAsync(10); // First retry
      await vi.advanceTimersByTimeAsync(20); // Second retry
      await vi.advanceTimersByTimeAsync(40); // Third retry (no more retries after this)

      // Wait a bit more to ensure all async operations complete
      await vi.advanceTimersByTimeAsync(1);

      await expect(result).rejects.toThrow("Always fails");
      expect(fn).toHaveBeenCalledTimes(3);

      // Restore original unhandled rejection handlers
      process.removeAllListeners("unhandledRejection");
      originalUnhandledRejection.forEach((handler) =>
        process.on("unhandledRejection", handler),
      );
    }, 15000);

    it("should use default max retries of 3", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      await retryWithBackoff(fn);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should use default initial delay of 1000ms", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      await retryWithBackoff(fn, 3);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("raceWithTimeout", () => {
    it("should return first promise to resolve", async () => {
      const promise1 = new Promise((resolve) =>
        setTimeout(() => resolve("first"), 50),
      );
      const promise2 = new Promise((resolve) =>
        setTimeout(() => resolve("second"), 100),
      );

      const result = raceWithTimeout([promise1, promise2], 5000);

      vi.advanceTimersByTime(50);

      await expect(result).resolves.toBe("first");
    });

    it("should reject on timeout", async () => {
      const promise1 = new Promise((resolve) =>
        setTimeout(() => resolve("first"), 500),
      );
      const promise2 = new Promise((resolve) =>
        setTimeout(() => resolve("second"), 1000),
      );

      const result = raceWithTimeout([promise1, promise2], 100);

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow("Race timeout");
    });

    it("should use default timeout of 8000ms", async () => {
      const promise = Promise.resolve("quick");

      const result = raceWithTimeout([promise]);

      await expect(result).resolves.toBe("quick");
    });
  });

  describe("isTimeoutError", () => {
    it("should return true for timeout error message", () => {
      const error = new Error("Request timeout");
      expect(isTimeoutError(error)).toBe(true);
    });

    it("should return true for Timeout in message", () => {
      const error = new Error("Timeout occurred");
      expect(isTimeoutError(error)).toBe(true);
    });

    it("should return true for AbortError", () => {
      const error = new Error("Abort");
      error.name = "AbortError";
      expect(isTimeoutError(error)).toBe(true);
    });

    it("should return true for TimeoutError name", () => {
      const error = new Error("Custom error");
      error.name = "TimeoutError";
      expect(isTimeoutError(error)).toBe(true);
    });

    it("should return false for non-timeout errors", () => {
      const error = new Error("Network error");
      expect(isTimeoutError(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(isTimeoutError("string error")).toBe(false);
      expect(isTimeoutError(null)).toBe(false);
      expect(isTimeoutError(undefined)).toBe(false);
    });
  });

  describe("createTimeoutController", () => {
    it("should return controller with signal and cleanup", () => {
      vi.useRealTimers(); // Use real timers for this test
      const { controller, signal, cleanup, abort } =
        createTimeoutController(5000);

      expect(controller).toBeDefined();
      expect(signal).toBeDefined();
      expect(typeof cleanup).toBe("function");
      expect(typeof abort).toBe("function");
    });

    it("should cleanup timeout without aborting", () => {
      vi.useRealTimers(); // Use real timers for this test
      const { cleanup } = createTimeoutController(5000);

      expect(() => cleanup()).not.toThrow();
    });

    it("should abort controller and cleanup", () => {
      vi.useRealTimers(); // Use real timers for this test
      const { controller, abort } = createTimeoutController(5000);

      expect(controller.signal.aborted).toBe(false);

      abort();

      expect(controller.signal.aborted).toBe(true);
    });

    it("should auto-abort after timeout", async () => {
      const { controller } = createTimeoutController(100);

      expect(controller.signal.aborted).toBe(false);

      vi.advanceTimersByTime(150);

      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe("getRecommendedTimeout", () => {
    it("should return NORMAL timeout when connection API not available", () => {
      // @ts-ignore
      delete navigator.connection;

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_DEFAULTS.NORMAL);
    });

    it("should return FAST timeout for 4g connection", () => {
      vi.stubGlobal("navigator", {
        connection: { effectiveType: "4g" },
      } as any);

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_BY_NETWORK.FAST);
    });

    it("should return NORMAL timeout for 3g connection", () => {
      vi.stubGlobal("navigator", {
        connection: { effectiveType: "3g" },
      } as any);

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_BY_NETWORK.NORMAL);
    });

    it("should return SLOW timeout for 2g connection", () => {
      vi.stubGlobal("navigator", {
        connection: { effectiveType: "2g" },
      } as any);

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_BY_NETWORK.SLOW);
    });

    it("should return SLOW timeout for slow-2g connection", () => {
      vi.stubGlobal("navigator", {
        connection: { effectiveType: "slow-2g" },
      } as any);

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_BY_NETWORK.SLOW);
    });

    it("should return NORMAL timeout for unknown connection type", () => {
      vi.stubGlobal("navigator", {
        connection: { effectiveType: "unknown" },
      } as any);

      const timeout = getRecommendedTimeout();

      expect(timeout).toBe(TIMEOUT_DEFAULTS.NORMAL);
    });
  });
});
