/**
 * Retry Utilities Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retry, RetryError } from "@/lib/utils/retry";

describe("Retry Utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("retry with exponential backoff", () => {
    it("should retry failed operations", async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      });

      const promise = retry(fn, { maxAttempts: 3, initialDelay: 100 });

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use exponential backoff", async () => {
      const onRetry = vi.fn();
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts < 4) {
          throw new Error("Fail");
        }
        return "success";
      };

      const promise = retry(fn, {
        maxAttempts: 4,
        initialDelay: 100,
        exponentialBackoff: true,
        backoffMultiplier: 2,
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // Check that delays are exponential: 100ms, 200ms, 400ms
      expect(onRetry).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 200);
      expect(onRetry).toHaveBeenNthCalledWith(3, expect.any(Error), 3, 400);
    });

    it("should stop after max retries", async () => {
      const fn = vi.fn(async () => {
        throw new Error("Permanent failure");
      });

      const promise = retry(fn, { maxAttempts: 3, initialDelay: 10 });

      // Setup expectation BEFORE running timers to catch rejection properly
      const expectation = expect(promise).rejects.toThrow(RetryError);

      await vi.runAllTimersAsync();
      await expectation;

      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe("retry with custom delay", () => {
    it("should use custom delay between retries", async () => {
      const onRetry = vi.fn();
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Fail");
        }
        return "success";
      };

      const promise = retry(fn, {
        maxAttempts: 3,
        initialDelay: 500,
        exponentialBackoff: false, // Disable exponential backoff
        onRetry,
      });

      await vi.runAllTimersAsync();
      await promise;

      // All delays should be 500ms when exponential backoff is disabled
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 500);
      expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 500);
    });
  });

  describe("conditional retry", () => {
    it("should retry only on specific errors", async () => {
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts === 1) {
          const error: any = new Error("Retryable");
          error.code = "NETWORK_ERROR";
          throw error;
        } else if (attempts === 2) {
          const error: any = new Error("Non-retryable");
          error.code = "AUTH_ERROR";
          throw error;
        }
        return "success";
      };

      const shouldRetry = (error: unknown) => {
        return (
          error instanceof Error && (error as any).code === "NETWORK_ERROR"
        );
      };

      const promise = retry(fn, {
        maxAttempts: 5,
        initialDelay: 10,
        shouldRetry,
      });

      // Setup expectation BEFORE running timers to catch rejection properly
      const expectation = expect(promise).rejects.toThrow("Non-retryable");

      await vi.runAllTimersAsync();
      await expectation;

      expect(attempts).toBe(2);
    });
  });

  // Placeholder test
  it("should have retry utilities tests defined", () => {
    expect(true).toBe(true);
  });
});
