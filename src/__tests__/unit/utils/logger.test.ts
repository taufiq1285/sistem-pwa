/**
 * Logger Utility Unit Tests
 * Tests the structure and availability of logger methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../../../lib/utils/logger";

describe("Logger Utility", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  let originalLocalStorage: Storage;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});

    // Mock localStorage
    originalLocalStorage = window.localStorage;
    mockLocalStorage = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => mockLocalStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete mockLocalStorage[key];
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();

    // Restore localStorage
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe("API structure", () => {
    it("should have all required methods", () => {
      expect(logger).toHaveProperty("info");
      expect(logger).toHaveProperty("warn");
      expect(logger).toHaveProperty("error");
      expect(logger).toHaveProperty("debug");
      expect(logger).toHaveProperty("auth");
      expect(logger).toHaveProperty("group");
      expect(logger).toHaveProperty("groupEnd");
    });

    it("should have methods that are functions", () => {
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.auth).toBe("function");
      expect(typeof logger.group).toBe("function");
      expect(typeof logger.groupEnd).toBe("function");
    });
  });

  describe("warn()", () => {
    it("should always call console.warn", () => {
      logger.warn("warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("warning message");
    });

    it("should pass multiple arguments to console.warn", () => {
      logger.warn("warn:", 123, { key: "value" });
      expect(consoleWarnSpy).toHaveBeenCalledWith("warn:", 123, {
        key: "value",
      });
    });
  });

  describe("error()", () => {
    it("should always call console.error", () => {
      logger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("error message");
    });

    it("should pass multiple arguments to console.error", () => {
      const error = new Error("test");
      logger.error("Error:", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error:", error);
    });
  });

  describe("info() - development mode behavior", () => {
    it("should call console.log when in development", () => {
      // In Vitest, import.meta.env.DEV is typically true
      logger.info("info message");
      expect(consoleLogSpy).toHaveBeenCalledWith("info message");
    });

    it("should pass multiple arguments", () => {
      logger.info("Info:", { data: "test" }, 42);
      expect(consoleLogSpy).toHaveBeenCalledWith("Info:", { data: "test" }, 42);
    });
  });

  describe("debug() - localStorage controlled", () => {
    beforeEach(() => {
      consoleLogSpy.mockClear();
    });

    it("should call console.log when debug is enabled in localStorage", () => {
      mockLocalStorage.debug = "true";

      logger.debug("debug message");
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG]", "debug message");
    });

    it("should not call console.log when debug is not enabled", () => {
      mockLocalStorage.debug = "false";

      logger.debug("debug message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should not call console.log when debug key doesn't exist", () => {
      // debug key not set in localStorage

      logger.debug("debug message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should pass multiple arguments with DEBUG prefix", () => {
      mockLocalStorage.debug = "true";

      logger.debug("Complex debug:", { obj: "value" }, [1, 2, 3]);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[DEBUG]",
        "Complex debug:",
        { obj: "value" },
        [1, 2, 3],
      );
    });
  });

  describe("auth() - auth debugging controlled", () => {
    beforeEach(() => {
      consoleLogSpy.mockClear();
    });

    it("should call console.log by default (when debug_auth is not set)", () => {
      // debug_auth not set, should default to true in development

      logger.auth("auth message");
      expect(consoleLogSpy).toHaveBeenCalledWith("🔐", "auth message");
    });

    it("should call console.log when debug_auth is not 'false'", () => {
      mockLocalStorage.debug_auth = "true";

      logger.auth("auth enabled");
      expect(consoleLogSpy).toHaveBeenCalledWith("🔐", "auth enabled");
    });

    it("should not call console.log when debug_auth is 'false'", () => {
      mockLocalStorage.debug_auth = "false";

      logger.auth("auth disabled");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should pass multiple arguments with auth emoji", () => {
      logger.auth("Login attempt:", { user: "test" }, { status: "success" });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🔐",
        "Login attempt:",
        { user: "test" },
        { status: "success" },
      );
    });
  });

  describe("group() and groupEnd() - development mode behavior", () => {
    it("should call console.group in development", () => {
      logger.group("Test Group");
      expect(consoleGroupSpy).toHaveBeenCalledWith("Test Group");
    });

    it("should call console.groupEnd in development", () => {
      logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalledOnce();
    });

    it("should handle group workflow", () => {
      logger.group("API Calls");
      expect(consoleGroupSpy).toHaveBeenCalledWith("API Calls");

      logger.info("Making request...");
      expect(consoleLogSpy).toHaveBeenCalledWith("Making request...");

      logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalledOnce();
    });
  });

  describe("method invocation", () => {
    it("should not throw errors when called", () => {
      expect(() => logger.info("test")).not.toThrow();
      expect(() => logger.warn("test")).not.toThrow();
      expect(() => logger.error("test")).not.toThrow();
      expect(() => logger.debug("test")).not.toThrow();
      expect(() => logger.auth("test")).not.toThrow();
      expect(() => logger.group("test")).not.toThrow();
      expect(() => logger.groupEnd()).not.toThrow();
    });

    it("should handle empty arguments", () => {
      expect(() => logger.info()).not.toThrow();
      expect(() => logger.warn()).not.toThrow();
      expect(() => logger.error()).not.toThrow();
    });

    it("should handle null and undefined", () => {
      expect(() => logger.info(null, undefined)).not.toThrow();
      expect(() => logger.warn(null)).not.toThrow();
      expect(() => logger.error(undefined)).not.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("should handle circular objects", () => {
      const circular: any = { name: "test" };
      circular.self = circular;

      expect(() => logger.info("Circular:", circular)).not.toThrow();
      expect(() => logger.error("Circular error:", circular)).not.toThrow();
    });

    it("should handle complex data types", () => {
      const complexData = {
        date: new Date(),
        regex: /test/g,
        symbol: Symbol("test"),
        func: () => {},
        map: new Map([["key", "value"]]),
        set: new Set([1, 2, 3]),
      };

      expect(() => logger.info("Complex data:", complexData)).not.toThrow();
    });

    it("should handle very large strings", () => {
      const largeString = "x".repeat(10000);

      expect(() => logger.info("Large string:", largeString)).not.toThrow();
      expect(() =>
        logger.warn("Large string warning:", largeString),
      ).not.toThrow();
    });

    it("should handle localStorage access errors", () => {
      // Mock localStorage to throw error
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error("localStorage unavailable");
      });

      // Should not throw error even if localStorage fails
      expect(() => logger.debug("debug test")).not.toThrow();
      expect(() => logger.auth("auth test")).not.toThrow();
    });
  });

  describe("Real-world usage scenarios", () => {
    it("should support typical debug session workflow", () => {
      // Enable debug mode
      mockLocalStorage.debug = "true";

      logger.group("User Login Flow");
      expect(consoleGroupSpy).toHaveBeenCalledWith("User Login Flow");

      logger.info("Starting login process");
      expect(consoleLogSpy).toHaveBeenCalledWith("Starting login process");

      logger.auth("Validating credentials");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "🔐",
        "Validating credentials",
      );

      logger.debug("API request payload:", { email: "test@test.com" });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[DEBUG]",
        "API request payload:",
        { email: "test@test.com" },
      );

      logger.groupEnd();
      expect(consoleGroupEndSpy).toHaveBeenCalledOnce();
    });

    it("should support error reporting workflow", () => {
      const error = new Error("API failed");
      const context = { url: "/api/login", method: "POST" };

      logger.group("Error Report");
      logger.error("API Error:", error);
      logger.info("Context:", context);
      logger.warn("User will see generic error message");
      logger.groupEnd();

      expect(consoleGroupSpy).toHaveBeenCalledWith("Error Report");
      expect(consoleErrorSpy).toHaveBeenCalledWith("API Error:", error);
      expect(consoleLogSpy).toHaveBeenCalledWith("Context:", context);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "User will see generic error message",
      );
      expect(consoleGroupEndSpy).toHaveBeenCalledOnce();
    });
  });
});
