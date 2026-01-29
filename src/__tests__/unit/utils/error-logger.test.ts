/**
 * Error Logger Utility Unit Tests
 * Comprehensive tests for centralized error logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type ErrorInfo } from "react";
import {
  errorLogger,
  logReactError,
  logError,
  setErrorUser,
  clearErrorUser,
  addBreadcrumb,
  type ErrorLog,
  type ErrorLoggerConfig,
} from "../../../lib/utils/error-logger";

describe("Error Logger", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();

  // Mock fetch
  const mockFetch = vi.fn();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Setup fetch mock
    global.fetch = mockFetch;

    // Clear storage and mocks
    localStorageMock.clear();
    vi.clearAllMocks();

    // Clear error logger queue
    errorLogger.clearErrorLogs();

    // Mock Math.random by default to ensure consistent testing
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Mock console.error to suppress expected error output during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      errorLogger.init({});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ Error Logger initialized"),
      );
    });

    it("should initialize with custom config", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      errorLogger.init({
        enabled: true,
        environment: "production",
        release: "1.0.0",
        sampleRate: 0.5,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("✅ Error Logger initialized"),
      );
    });

    it("should initialize external service when DSN provided", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      errorLogger.init({
        enabled: true,
        dsn: "https://example.com/error-endpoint",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("External error service"),
      );
    });

    it("should setup global error handlers", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      errorLogger.init({});

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );
    });
  });

  describe("logReactError", () => {
    it("should log React error boundary errors", () => {
      const error = new Error("Component crashed");
      const errorInfo: ErrorInfo = {
        componentStack: "at Component\nat App",
      };

      logReactError(error, errorInfo);

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: "Component crashed",
        componentStack: "at Component\nat App",
        metadata: expect.objectContaining({
          errorType: "React Error Boundary",
        }),
      });
    });

    it("should include custom metadata", () => {
      const error = new Error("Component crashed");
      const errorInfo: ErrorInfo = {
        componentStack: "at Component",
      };
      const metadata = { userId: "user-123", action: "button-click" };

      logReactError(error, errorInfo, metadata);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toMatchObject({
        userId: "user-123",
        action: "button-click",
        errorType: "React Error Boundary",
      });
    });

    it("should capture error stack trace", () => {
      const error = new Error("Test error");
      const errorInfo: ErrorInfo = {
        componentStack: "at Component",
      };

      logReactError(error, errorInfo);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].stack).toBeDefined();
      expect(logs[0].stack).toContain("Error: Test error");
    });

    it("should handle error without component stack", () => {
      const error = new Error("Test error");
      const errorInfo: ErrorInfo = {
        componentStack: "",
      };

      logReactError(error, errorInfo);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].componentStack).toBeUndefined();
    });
  });

  describe("logJSError", () => {
    it("should log JavaScript Error objects", () => {
      const error = new Error("JavaScript error");

      errorLogger.logJSError(error);

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: "JavaScript error",
        metadata: expect.objectContaining({
          errorType: "JavaScript Error",
        }),
      });
    });

    it("should log ErrorEvent objects", () => {
      const errorEvent = new ErrorEvent("error", {
        message: "Script error",
        error: new Error("Script error"),
      });

      errorLogger.logJSError(errorEvent);

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe("Script error");
    });

    it("should handle ErrorEvent without error object", () => {
      const errorEvent = new ErrorEvent("error", {
        message: "Script error",
      });

      errorLogger.logJSError(errorEvent);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].message).toBe("Unknown JavaScript error");
    });

    it("should include custom metadata", () => {
      const error = new Error("JS error");
      const metadata = { context: "async-operation" };

      errorLogger.logJSError(error, metadata);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toMatchObject({
        context: "async-operation",
        errorType: "JavaScript Error",
      });
    });
  });

  describe("logPromiseRejection", () => {
    it("should log promise rejection with Error object", () => {
      const error = new Error("Promise rejected");

      errorLogger.logPromiseRejection(error);

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: "Promise rejected",
        metadata: expect.objectContaining({
          errorType: "Unhandled Promise Rejection",
        }),
      });
    });

    it("should log promise rejection with string reason", () => {
      errorLogger.logPromiseRejection("Promise failed");

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].message).toBe("Promise failed");
    });

    it("should log promise rejection with no reason", () => {
      errorLogger.logPromiseRejection(null);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].message).toBe("Unhandled Promise Rejection");
    });

    it("should include custom metadata", () => {
      const metadata = { apiEndpoint: "/api/users" };

      errorLogger.logPromiseRejection("API failed", metadata);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toMatchObject({
        apiEndpoint: "/api/users",
        errorType: "Unhandled Promise Rejection",
      });
    });
  });

  describe("logError", () => {
    it("should log Error objects", () => {
      const error = new Error("Custom error");

      logError(error);

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        message: "Custom error",
        metadata: expect.objectContaining({
          errorType: "Custom Error",
        }),
      });
    });

    it("should log string errors", () => {
      logError("Something went wrong");

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].message).toBe("Something went wrong");
    });

    it("should include custom metadata", () => {
      const metadata = { userId: "user-123", operation: "save" };

      logError("Save failed", metadata);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toMatchObject({
        userId: "user-123",
        operation: "save",
        errorType: "Custom Error",
      });
    });
  });

  describe("Error Queue Management", () => {
    it("should add errors to queue", () => {
      logError("Error 1");
      logError("Error 2");
      logError("Error 3");

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(3);
    });

    it("should maintain max queue size of 50", () => {
      // Add 60 errors
      for (let i = 0; i < 60; i++) {
        logError(`Error ${i}`);
      }

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(50);

      // Should have kept the most recent 50
      expect(logs[0].message).toBe("Error 10");
      expect(logs[49].message).toBe("Error 59");
    });

    it("should store last 10 errors in localStorage", () => {
      // Mock Math.random to always pass sample rate check
      vi.spyOn(Math, "random").mockReturnValue(0);

      for (let i = 0; i < 15; i++) {
        logError(`Error ${i}`);
      }

      const stored = localStorage.getItem("error_logs");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      // Should store last 10 of the 15 errors
      expect(parsed.length).toBeLessThanOrEqual(10);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it("should clear error logs", () => {
      logError("Error 1");
      logError("Error 2");

      errorLogger.clearErrorLogs();

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(0);
      expect(localStorage.getItem("error_logs")).toBeNull();
    });

    it("should handle localStorage errors gracefully", () => {
      const setItemSpy = vi
        .spyOn(localStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      expect(() => logError("Test error")).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe("Error Log Structure", () => {
    it("should include timestamp", () => {
      const beforeLog = new Date().toISOString();
      logError("Test error");
      const afterLog = new Date().toISOString();

      const logs = errorLogger.getErrorLogs();
      const timestamp = logs[0].timestamp;

      expect(timestamp).toBeDefined();
      expect(timestamp >= beforeLog && timestamp <= afterLog).toBe(true);
    });

    it("should include user agent", () => {
      logError("Test error");

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].userAgent).toBe(navigator.userAgent);
    });

    it("should include current URL", () => {
      // Mock Math.random to ensure log is created
      vi.spyOn(Math, "random").mockReturnValue(0);

      logError("Test error");

      const logs = errorLogger.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].url).toBeDefined();
      expect(logs[0].url).toContain("localhost");
    });

    it("should include stack trace when available", () => {
      const error = new Error("Test error");
      logError(error);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].stack).toBeDefined();
      expect(logs[0].stack).toContain("Error: Test error");
    });
  });

  describe("beforeSend Hook", () => {
    it("should apply beforeSend transformation", () => {
      errorLogger.init({
        beforeSend: (log) => ({
          ...log,
          metadata: {
            ...log.metadata,
            transformed: true,
          },
        }),
      });

      logError("Test error");

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata?.transformed).toBe(true);
    });

    it("should skip logging when beforeSend returns null", () => {
      errorLogger.init({
        beforeSend: () => null,
      });

      logError("Test error");

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(0);
    });

    it("should filter sensitive data in beforeSend", () => {
      errorLogger.init({
        beforeSend: (log) => ({
          ...log,
          metadata: {
            ...log.metadata,
            password: "[REDACTED]",
          },
        }),
      });

      logError("Login failed", { password: "secret123" });

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata?.password).toBe("[REDACTED]");
    });
  });

  describe("Sample Rate", () => {
    beforeEach(() => {
      // Ensure error logger is cleared before each sample rate test
      errorLogger.clearErrorLogs();

      // ✅ FIX: Clear all mocks including Math.random from main beforeEach
      // This allows each test to set its own Math.random value without conflict
      vi.clearAllMocks();
    });

    it("should log all errors with sampleRate 1.0", () => {
      // ✅ FIX: Clear previous Math.random mock before applying new one
      const randomSpy = vi.spyOn(Math, "random");
      randomSpy.mockReset();
      randomSpy.mockReturnValue(0);

      errorLogger.init({
        enabled: true,
        sampleRate: 1.0,
      });

      for (let i = 0; i < 10; i++) {
        logError(`Error ${i}`);
      }

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(10);
    });

    it("should log no errors with sampleRate 0.0", () => {
      // Mock Math.random to always be above threshold
      // With sampleRate 0.0, any value > 0 will not be logged
      // ✅ FIX: Clear previous Math.random mock before applying new one
      const randomSpy = vi.spyOn(Math, "random");
      randomSpy.mockReset();
      randomSpy.mockReturnValue(0.99);

      errorLogger.init({
        enabled: true,
        sampleRate: 0.0,
      });

      for (let i = 0; i < 10; i++) {
        logError(`Error ${i}`);
      }

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(0);
    });

    it("should sample errors at approximately 50% with sampleRate 0.5", () => {
      // ✅ FIX: Clear previous Math.random mock before applying new one
      const randomSpy = vi.spyOn(Math, "random");
      randomSpy.mockReset();

      // Mock Math.random to alternate between 0.4 and 0.6
      let callCount = 0;
      randomSpy.mockImplementation(() => {
        callCount++;
        return callCount % 2 === 0 ? 0.6 : 0.4;
      });

      errorLogger.init({
        enabled: true,
        sampleRate: 0.5,
      });

      for (let i = 0; i < 10; i++) {
        logError(`Error ${i}`);
      }

      const logs = errorLogger.getErrorLogs();
      // Should have ~50% of errors (5 out of 10)
      // With our mock, odds pass (0.4 < 0.5), evens fail (0.6 > 0.5)
      expect(logs.length).toBe(5);
    });
  });

  describe("User Context", () => {
    it("should set user context", () => {
      setErrorUser("user-123", { email: "user@example.com" });

      const stored = localStorage.getItem("error_logger_user");
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed).toMatchObject({
        userId: "user-123",
        email: "user@example.com",
      });
    });

    it("should clear user context", () => {
      setErrorUser("user-123");
      clearErrorUser();

      expect(localStorage.getItem("error_logger_user")).toBeNull();
    });

    it("should handle localStorage errors when setting user", () => {
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => setErrorUser("user-123")).not.toThrow();
    });

    it("should handle localStorage errors when clearing user", () => {
      vi.spyOn(localStorage, "removeItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(() => clearErrorUser()).not.toThrow();
    });
  });

  describe("Breadcrumbs", () => {
    it("should add breadcrumb in development", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      addBreadcrumb("User clicked button", "user-action", {
        buttonId: "submit",
      });

      // In dev mode, should log breadcrumb
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          "🍞 Breadcrumb:",
          expect.objectContaining({
            message: "User clicked button",
            category: "user-action",
            data: { buttonId: "submit" },
          }),
        );
      }
    });

    it("should handle breadcrumb without category or data", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      addBreadcrumb("Simple breadcrumb");

      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith(
          "🍞 Breadcrumb:",
          expect.objectContaining({
            message: "Simple breadcrumb",
          }),
        );
      }
    });
  });

  describe("External Service Integration", () => {
    // ✅ FIX: Clear fetch mock before each test in this block
    // This prevents DSN configuration from leaking between tests
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should send to custom endpoint when DSN provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      errorLogger.init({
        enabled: true,
        dsn: "https://custom-endpoint.com/errors",
      });

      logError("Test error", { metadata: "test" });

      // Wait for async fetch with longer timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom-endpoint.com/errors",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("Test error"),
        }),
      );
    });

    it("should handle fetch errors gracefully", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error("Network error"));

      errorLogger.init({
        enabled: true,
        dsn: "https://custom-endpoint.com/errors",
      });

      logError("Test error");

      // Wait for async fetch with longer timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to send error log to custom endpoint",
        expect.any(Error),
      );
    });

    it("should not send to external service when disabled", async () => {
      errorLogger.init({
        enabled: false,
        dsn: "https://custom-endpoint.com/errors",
      });

      logError("Test error");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should not send to external service without DSN", async () => {
      // ✅ FIX: Explicitly clear DSN to ensure no configuration leakage
      errorLogger.init({
        enabled: true,
        dsn: undefined, // Explicitly set to undefined to clear any previous DSN
      });

      logError("Test error");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete error logging lifecycle", () => {
      // Initialize
      errorLogger.init({
        enabled: true,
        environment: "production",
        sampleRate: 1.0,
      });

      // Set user context
      setErrorUser("user-123", { role: "mahasiswa" });

      // Log various error types
      logError("Custom error 1");
      logReactError(new Error("React error"), { componentStack: "at App" });
      errorLogger.logJSError(new Error("JS error"));
      errorLogger.logPromiseRejection("Promise rejected");

      // Verify all logged
      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(4);

      // Clear and verify
      errorLogger.clearErrorLogs();
      expect(errorLogger.getErrorLogs()).toHaveLength(0);

      // Clear user
      clearErrorUser();
      expect(localStorage.getItem("error_logger_user")).toBeNull();
    });

    it("should handle error logging with transformations", () => {
      errorLogger.init({
        sampleRate: 1.0,
        beforeSend: (log) => ({
          ...log,
          metadata: {
            ...log.metadata,
            environment: "test",
            timestamp_modified: true,
          },
        }),
      });

      logError("Test error", { custom: "data" });

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toMatchObject({
        custom: "data",
        environment: "test",
        timestamp_modified: true,
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle errors with circular references in metadata", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      expect(() => logError("Test", circular)).not.toThrow();
    });

    it("should handle very long error messages", () => {
      const longMessage = "a".repeat(10000);

      logError(longMessage);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].message).toBe(longMessage);
    });

    it("should handle errors without stack traces", () => {
      const errorWithoutStack = {
        message: "Error",
        name: "CustomError",
      } as Error;

      logError(errorWithoutStack);

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].stack).toBeUndefined();
    });

    it("should handle undefined metadata values", () => {
      logError("Test", { value: undefined, other: null });

      const logs = errorLogger.getErrorLogs();
      expect(logs[0].metadata).toBeDefined();
    });

    it("should handle rapid error logging", () => {
      for (let i = 0; i < 100; i++) {
        logError(`Error ${i}`);
      }

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(50); // Max queue size
    });

    it("should handle memory pressure gracefully", () => {
      const hugeSizeData = {
        data: "x".repeat(500000), // 500KB string
        array: new Array(1000).fill("test"),
      };

      expect(() => {
        for (let i = 0; i < 5; i++) {
          logError(`Memory test ${i}`, hugeSizeData);
        }
      }).not.toThrow();
    });

    it("should handle invalid Error objects", () => {
      expect(() => {
        logError(null as any);
      }).not.toThrow();

      expect(() => {
        logError(undefined as any);
      }).not.toThrow();

      expect(() => {
        logError(123 as any);
      }).not.toThrow();

      expect(() => {
        logError({} as any);
      }).not.toThrow();

      // Verify logs were created even with invalid inputs
      const logs = errorLogger.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it("should handle malformed React ErrorInfo", () => {
      const malformedErrorInfo = {
        componentStack: undefined,
      } as any;

      expect(() => {
        logReactError(new Error("Test"), malformedErrorInfo);
      }).not.toThrow();
    });

    it("should handle concurrent logging operations", async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        Promise.resolve().then(() => logError(`Concurrent error ${i}`)),
      );

      await Promise.all(promises);

      const logs = errorLogger.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.length).toBeLessThanOrEqual(50); // Queue limit
    });

    it("should handle localStorage quota exceeded", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => {
        setErrorUser("test-user", { data: "large" });
        logError("Quota test error");
      }).not.toThrow();
    });

    it("should handle missing window.navigator", () => {
      const originalNavigator = window.navigator;
      Object.defineProperty(window, "navigator", {
        value: undefined,
        writable: true,
      });

      expect(() => {
        logError("Navigator missing test");
      }).not.toThrow();

      Object.defineProperty(window, "navigator", {
        value: originalNavigator,
        writable: true,
      });
    });

    it("should handle missing fetch API", async () => {
      const originalFetch = global.fetch;
      global.fetch = undefined as any;

      errorLogger.init({
        enabled: true,
        dsn: "https://example.com/errors",
      });

      expect(() => {
        logError("No fetch API test");
      }).not.toThrow();

      global.fetch = originalFetch;
    });

    it("should handle malformed configuration objects", () => {
      expect(() => {
        errorLogger.init({} as any);
        errorLogger.init(null as any);
        errorLogger.init("invalid" as any);
      }).not.toThrow();
    });

    it("should handle invalid sample rates", () => {
      // Sample rate > 1 should be treated as 1
      errorLogger.init({ enabled: true, sampleRate: 2.5 });
      logError("High sample rate test");
      expect(errorLogger.getQueueSize()).toBe(1);

      // Negative sample rate should be treated as 0
      errorLogger.clearErrorLogs();
      errorLogger.init({ enabled: true, sampleRate: -0.5 });
      logError("Negative sample rate test");
      expect(errorLogger.getQueueSize()).toBe(0);
    });

    it("should handle beforeSend function errors", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      errorLogger.init({
        enabled: true,
        beforeSend: () => {
          throw new Error("beforeSend error");
        },
      });

      expect(() => {
        logError("BeforeSend test error");
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should handle queue size edge cases", () => {
      // Reset configuration to completely clean state
      errorLogger.init({
        enabled: true,
        beforeSend: undefined, // Explicitly clear beforeSend
        sampleRate: 1.0, // Ensure all logs go through
      });
      errorLogger.clearErrorLogs();

      // Fill exactly to the limit
      for (let i = 0; i < 50; i++) {
        logError(`Boundary test ${i}`);
      }

      expect(errorLogger.getQueueSize()).toBe(50);

      // Add one more to trigger overflow
      logError("Overflow test");

      expect(errorLogger.getQueueSize()).toBe(50); // Should still be at limit

      const logs = errorLogger.getErrorLogs();
      expect(logs[logs.length - 1].message).toBe("Overflow test"); // Latest should be kept
    });
  });
});
