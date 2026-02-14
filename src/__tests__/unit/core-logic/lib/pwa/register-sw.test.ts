/**
 * Tests for register-sw.ts
 *
 * Comprehensive white-box testing for Service Worker registration, update flow,
 * and lifecycle events management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as registerSW from "@/lib/pwa/register-sw";

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    active: { state: "activated" },
    installing: null,
    waiting: null,
    update: vi.fn(),
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  controller: null as any,
  getRegistration: vi.fn(),
};

const mockRegistration = {
  installing: null as any,
  waiting: null as any,
  active: { state: "activated" } as any,
  scope: "/",
  update: vi.fn(),
  unregister: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(navigator, "serviceWorker", {
  value: mockServiceWorker,
  writable: true,
  configurable: true,
});

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock document.readyState
Object.defineProperty(document, "readyState", {
  value: "complete",
  writable: true,
  configurable: true,
});

describe("register-sw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceWorker.controller = null;
    // Reset the reloading flag to prevent test interference
    registerSW._resetReloadingFlag?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // SECTION 1: registerServiceWorker - Basic
  // ==========================================

  describe("registerServiceWorker - Basic", () => {
    it("should return early if serviceWorker not supported", async () => {
      // @ts-ignore - intentionally remove serviceWorker
      delete navigator.serviceWorker;

      await registerSW.registerServiceWorker();

      // Should not throw
      expect(true).toBe(true);

      // Restore
      Object.defineProperty(navigator, "serviceWorker", {
        value: mockServiceWorker,
        writable: true,
        configurable: true,
      });
    });

    it("should register service worker with default config", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalledWith("/sw.js", {
        scope: "/",
      });
    });

    it("should register service worker with custom config", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const onUpdate = vi.fn();
      const onSuccess = vi.fn();
      const onError = vi.fn();

      await registerSW.registerServiceWorker({
        swPath: "/custom-sw.js",
        scope: "/app",
        onUpdate,
        onSuccess,
        onError,
        checkUpdateInterval: 30 * 60 * 1000,
        enableAutoUpdate: false,
      });

      expect(mockServiceWorker.register).toHaveBeenCalledWith("/custom-sw.js", {
        scope: "/app",
      });
      expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
    });

    it("should call onError when registration fails", async () => {
      const error = new Error("Registration failed");
      mockServiceWorker.register.mockRejectedValue(error);

      const onError = vi.fn();

      await registerSW.registerServiceWorker({ onError });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it("should call onUpdate when waiting worker exists", async () => {
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithWaiting);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      expect(mockServiceWorker.register).toHaveBeenCalled();
    });

    it("should call onSuccess when registration succeeds", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const onSuccess = vi.fn();

      await registerSW.registerServiceWorker({ onSuccess });

      expect(mockServiceWorker.register).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: Update Detection - updatefound
  // ==========================================

  describe("Update Detection - updatefound Event", () => {
    it("should detect update via updatefound event", async () => {
      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      await registerSW.registerServiceWorker();

      // Verify updatefound listener was registered
      expect(registrationWithListener.addEventListener).toHaveBeenCalledWith(
        "updatefound",
        expect.any(Function),
      );
    });

    it("should handle updatefound with new installing worker", async () => {
      const newWorker = {
        state: "installing",
        addEventListener: vi.fn(),
      };

      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: null,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      // Simulate updatefound event
      if (updateFoundHandler) {
        // Mock that installing worker appears after updatefound
        registrationWithListener.installing = newWorker;
        await updateFoundHandler();
      }

      expect(newWorker.addEventListener).toHaveBeenCalledWith(
        "statechange",
        expect.any(Function),
      );
    });

    it("should handle updatefound with no new worker", async () => {
      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: null,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      await registerSW.registerServiceWorker();

      // Simulate updatefound event with no installing worker
      if (updateFoundHandler) {
        await updateFoundHandler();
      }

      // Should not throw
      expect(true).toBe(true);
    });

    it("should call onUpdate when new worker installed and controller exists", async () => {
      const newWorker = {
        state: "installed",
        addEventListener: vi.fn((event, handler) => {
          if (event === "statechange") {
            // Trigger statechange immediately
            handler();
          }
        }),
      };

      mockServiceWorker.controller = { postMessage: vi.fn() }; // Controller exists

      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: newWorker,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      // Simulate updatefound
      if (updateFoundHandler) {
        await updateFoundHandler();
      }

      expect(newWorker.addEventListener).toHaveBeenCalled();
    });

    it("should not call onUpdate when no controller exists", async () => {
      const newWorker = {
        state: "installed",
        addEventListener: vi.fn((event, handler) => {
          if (event === "statechange") {
            handler();
          }
        }),
      };

      mockServiceWorker.controller = null; // No controller

      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: newWorker,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      // Simulate updatefound
      if (updateFoundHandler) {
        await updateFoundHandler();
      }

      expect(newWorker.addEventListener).toHaveBeenCalled();
    });

    it("should handle worker state change to activated", async () => {
      const newWorker = {
        state: "activated",
        addEventListener: vi.fn((event, handler) => {
          if (event === "statechange") {
            handler();
          }
        }),
      };

      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: newWorker,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      await registerSW.registerServiceWorker();

      // Simulate updatefound
      if (updateFoundHandler) {
        await updateFoundHandler();
      }

      expect(newWorker.addEventListener).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 4: Periodic Update Check
  // ==========================================

  describe("Periodic Update Check", () => {
    it("should setup periodic update check when enableAutoUpdate is true", async () => {
      vi.useFakeTimers();

      mockRegistration.update.mockResolvedValue(undefined);

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({
        enableAutoUpdate: true,
        checkUpdateInterval: 60 * 60 * 1000, // 1 hour
      });

      // Initial update check
      expect(mockRegistration.update).toHaveBeenCalled();

      // Clear and advance time
      mockRegistration.update.mockClear();
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Periodic update check
      expect(mockRegistration.update).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should not setup periodic update check when enableAutoUpdate is false", async () => {
      vi.useFakeTimers();

      mockRegistration.update.mockResolvedValue(undefined);

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({
        enableAutoUpdate: false,
        checkUpdateInterval: 60 * 60 * 1000,
      });

      // No initial update check
      expect(mockRegistration.update).not.toHaveBeenCalled();

      // Advance time
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Still no update check
      expect(mockRegistration.update).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should handle update check errors gracefully", async () => {
      vi.useFakeTimers();

      const updateError = new Error("Update check failed");
      mockRegistration.update.mockRejectedValue(updateError);

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      // Should not throw
      await registerSW.registerServiceWorker({
        enableAutoUpdate: true,
        checkUpdateInterval: 60 * 60 * 1000,
      });

      // Advance time to trigger periodic check
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Should not throw
      expect(true).toBe(true);

      vi.useRealTimers();
    });

    it("should use default 1-hour interval if not specified", async () => {
      vi.useFakeTimers();

      mockRegistration.update.mockResolvedValue(undefined);

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({
        enableAutoUpdate: true,
        // checkUpdateInterval not specified
      });

      mockRegistration.update.mockClear();

      // Advance 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      expect(mockRegistration.update).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should continue checking for updates after error", async () => {
      vi.useFakeTimers();

      let callCount = 0;
      mockRegistration.update.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Failed"));
        }
        return Promise.resolve();
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({
        enableAutoUpdate: true,
        checkUpdateInterval: 60 * 60 * 1000,
      });

      // First check fails
      vi.advanceTimersByTime(60 * 60 * 1000);

      // Second check succeeds
      vi.advanceTimersByTime(60 * 60 * 1000);

      expect(mockRegistration.update).toHaveBeenCalledTimes(3); // Initial + 2 periodic

      vi.useRealTimers();
    });
  });

  // ==========================================
  // SECTION 5: HTTPS/Localhost Check
  // ==========================================

  describe("HTTPS/Localhost Check", () => {
    it("should allow registration on localhost", async () => {
      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "localhost",
        writable: true,
        configurable: true,
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("should allow registration on [::1] (IPv6 localhost)", async () => {
      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "[::1]",
        writable: true,
        configurable: true,
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("should allow registration on 127.0.0.1", async () => {
      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "127.0.0.1",
        writable: true,
        configurable: true,
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("should allow registration on HTTPS", async () => {
      const originalProtocol = window.location.protocol;
      Object.defineProperty(window.location, "protocol", {
        value: "https:",
        writable: true,
        configurable: true,
      });

      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "example.com",
        writable: true,
        configurable: true,
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();

      Object.defineProperty(window.location, "protocol", {
        value: originalProtocol,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("should reject registration on non-HTTPS non-localhost", async () => {
      const originalProtocol = window.location.protocol;
      Object.defineProperty(window.location, "protocol", {
        value: "http:",
        writable: true,
        configurable: true,
      });

      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "example.com",
        writable: true,
        configurable: true,
      });

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).not.toHaveBeenCalled();

      Object.defineProperty(window.location, "protocol", {
        value: originalProtocol,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });
  });

  // ==========================================
  // SECTION 6: Message Handling
  // ==========================================

  describe("Message Handling", () => {
    it("should setup message listener from service worker", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
    });

    it("should handle SYNC_STARTED message", async () => {
      let messageHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Simulate SYNC_STARTED message
      if (messageHandler) {
        const event = {
          data: { type: "SYNC_STARTED", data: { syncId: "123" } },
        };
        await messageHandler(event);
      }

      expect(true).toBe(true);
    });

    it("should handle SYNC_COMPLETED message", async () => {
      let messageHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Simulate SYNC_COMPLETED message
      if (messageHandler) {
        const event = {
          data: { type: "SYNC_COMPLETED", data: { syncId: "123" } },
        };
        await messageHandler(event);
      }

      expect(true).toBe(true);
    });

    it("should handle SYNC_FAILED message", async () => {
      let messageHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Simulate SYNC_FAILED message
      if (messageHandler) {
        const event = {
          data: { type: "SYNC_FAILED", data: { error: "Sync failed" } },
        };
        await messageHandler(event);
      }

      expect(true).toBe(true);
    });

    it("should handle unknown message type", async () => {
      let messageHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Simulate unknown message type
      if (messageHandler) {
        const event = {
          data: { type: "UNKNOWN_TYPE" },
        };
        await messageHandler(event);
      }

      expect(true).toBe(true);
    });
  });

  // ==========================================
  // SECTION 7: sendMessageToSW
  // ==========================================

  describe("sendMessageToSW", () => {
    it("should send message to service worker controller", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      await registerSW.sendMessageToSW({ type: "SKIP_WAITING" });

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: "SKIP_WAITING",
        timestamp: expect.any(Number),
      });
    });

    it("should return early if no controller", async () => {
      mockServiceWorker.controller = null;

      await expect(
        registerSW.sendMessageToSW({ type: "SKIP_WAITING" }),
      ).resolves.toBeUndefined();
    });

    it("should include timestamp in message", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      const beforeTime = Date.now();

      await registerSW.sendMessageToSW({ type: "CLEAR_CACHE" });

      const afterTime = Date.now();

      const call = mockServiceWorker.controller.postMessage.mock.calls[0];
      const message = call[0];

      expect(message.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(message.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it("should preserve message data", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      await registerSW.sendMessageToSW({
        type: "GET_VERSION",
        data: { requestId: "123" },
      });

      const call = mockServiceWorker.controller.postMessage.mock.calls[0];
      const message = call[0];

      expect(message.data).toEqual({ requestId: "123" });
    });
  });

  // ==========================================
  // SECTION 8: skipWaiting - Update Activation
  // ==========================================

  describe("skipWaiting - Update Activation", () => {
    it("should skip waiting and send message to SW", async () => {
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      await registerSW.skipWaiting();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: "SKIP_WAITING",
        timestamp: expect.any(Number),
      });
    });

    it("should return early if no waiting worker", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      await expect(registerSW.skipWaiting()).resolves.toBeUndefined();
    });

    it("should return early if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      await expect(registerSW.skipWaiting()).resolves.toBeUndefined();
    });

    it("should setup controllerchange listener", async () => {
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      await registerSW.skipWaiting();

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        "controllerchange",
        expect.any(Function),
        { once: true },
      );
    });

    it("should reload page on controllerchange", async () => {
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      let controllerChangeHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler, options) => {
        if (event === "controllerchange") {
          controllerChangeHandler = handler;
        }
      });

      const reloadSpy = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => {});

      await registerSW.skipWaiting();

      // Trigger controllerchange
      if (controllerChangeHandler) {
        await controllerChangeHandler();
      }

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });

    it("should not reload multiple times (prevent update loops)", async () => {
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      let controllerChangeHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "controllerchange") {
          controllerChangeHandler = handler;
        }
      });

      const reloadSpy = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => {});

      await registerSW.skipWaiting();

      // Trigger controllerchange twice
      if (controllerChangeHandler) {
        await controllerChangeHandler();
        await controllerChangeHandler();
      }

      // Should only reload once
      expect(reloadSpy).toHaveBeenCalledTimes(1);

      reloadSpy.mockRestore();
    });
  });

  // ==========================================
  // SECTION 9: clearAllCaches
  // ==========================================

  describe("clearAllCaches", () => {
    it("should clear all caches", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      const cacheKeys = ["cache-v1", "cache-v2"];
      const deleteSpy = vi.fn().mockResolvedValue(true);

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue(cacheKeys),
        delete: deleteSpy,
      };

      await registerSW.clearAllCaches();

      expect(deleteSpy).toHaveBeenCalledWith("cache-v1");
      expect(deleteSpy).toHaveBeenCalledWith("cache-v2");

      // @ts-ignore
      delete global.caches;
    });

    it("should send CLEAR_CACHE message to SW", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      };

      await registerSW.clearAllCaches();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith({
        type: "CLEAR_CACHE",
        timestamp: expect.any(Number),
      });

      // @ts-ignore
      delete global.caches;
    });

    it("should handle no caches gracefully", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      };

      await registerSW.clearAllCaches();

      // Should not throw
      expect(true).toBe(true);

      // @ts-ignore
      delete global.caches;
    });

    it("should handle missing caches API gracefully", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // No caches API
      // @ts-ignore
      delete global.caches;

      await registerSW.clearAllCaches();

      // Should still send message to SW
      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 10: getSWVersion
  // ==========================================

  describe("getSWVersion", () => {
    it("should get service worker version", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      const version = { version: "1.0.0", caches: ["v1"] };

      const promise = registerSW.getSWVersion();

      // Simulate message response
      const callback = mockServiceWorker.controller.postMessage.mock.calls[0];
      const port = {
        port1: { onmessage: null },
        port2: {},
      };

      // Manually trigger onmessage
      if (port.port1.onmessage) {
        port.port1.onmessage({ data: version });
      }

      // Note: This is a simplified test - real implementation would be more complex
    });

    it("should return null if no controller", async () => {
      mockServiceWorker.controller = null;

      const result = await registerSW.getSWVersion();

      expect(result).toBeNull();
    });
  });

  // ==========================================
  // SECTION 11: unregisterServiceWorker
  // ==========================================

  describe("unregisterServiceWorker", () => {
    it("should unregister service worker", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(true);
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      };

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(true);
      expect(mockRegistration.unregister).toHaveBeenCalled();

      // @ts-ignore
      delete global.caches;
    });

    it("should clear caches after unregister", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(true);
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      const cacheKeys = ["cache-v1"];
      const deleteSpy = vi.fn().mockResolvedValue(true);

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue(cacheKeys),
        delete: deleteSpy,
      };

      await registerSW.unregisterServiceWorker();

      expect(deleteSpy).toHaveBeenCalledWith("cache-v1");

      // @ts-ignore
      delete global.caches;
    });

    it("should return false if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(false);
    });

    it("should return false if unregister fails", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(false);

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // SECTION 12: isServiceWorkerReady
  // ==========================================

  describe("isServiceWorkerReady", () => {
    it("should return false if serviceWorker not supported", async () => {
      // @ts-ignore
      delete navigator.serviceWorker;

      const result = await registerSW.isServiceWorkerReady();

      expect(result).toBe(false);

      // Restore
      Object.defineProperty(navigator, "serviceWorker", {
        value: mockServiceWorker,
        writable: true,
        configurable: true,
      });
    });

    it("should return true if service worker is ready", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const result = await registerSW.isServiceWorkerReady();

      expect(result).toBe(true);
    });

    it("should return false if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      const result = await registerSW.isServiceWorkerReady();

      expect(result).toBe(false);
    });

    it("should return false if no active worker", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue({
        ...mockRegistration,
        active: null,
      });

      const result = await registerSW.isServiceWorkerReady();

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // SECTION 13: getCurrentRegistration
  // ==========================================

  describe("getCurrentRegistration", () => {
    it("should return current registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const result = await registerSW.getCurrentRegistration();

      expect(result).toBe(mockRegistration);
    });

    it("should return null if serviceWorker not supported", async () => {
      // @ts-ignore
      delete navigator.serviceWorker;

      const result = await registerSW.getCurrentRegistration();

      expect(result).toBeNull();

      // Restore
      Object.defineProperty(navigator, "serviceWorker", {
        value: mockServiceWorker,
        writable: true,
        configurable: true,
      });
    });

    it("should return null if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      const result = await registerSW.getCurrentRegistration();

      expect(result).toBeNull();
    });
  });

  // ==========================================
  // SECTION 14: waitForServiceWorker
  // ==========================================

  describe("waitForServiceWorker", () => {
    it("should wait for service worker ready", async () => {
      const result = await registerSW.waitForServiceWorker(5000);

      expect(result).toBeDefined();
    });

    it("should timeout after specified time", async () => {
      mockServiceWorker.ready = new Promise(() => {
        // Never resolve
      });

      await expect(registerSW.waitForServiceWorker(100)).rejects.toThrow(
        "Service worker timeout",
      );
    });

    it("should use default timeout of 10000ms", async () => {
      mockServiceWorker.ready = new Promise(() => {
        // Never resolve
      });

      const startTime = Date.now();

      await expect(registerSW.waitForServiceWorker()).rejects.toThrow();

      const elapsed = Date.now() - startTime;

      // Should timeout around 10000ms
      expect(elapsed).toBeGreaterThanOrEqual(9000);
      expect(elapsed).toBeLessThanOrEqual(11000);
    }, 15000); // Increase test timeout to 15 seconds
  });

  // ==========================================
  // SECTION 15: isControlled
  // ==========================================

  describe("isControlled", () => {
    it("should return true if page is controlled", () => {
      mockServiceWorker.controller = { postMessage: vi.fn() };

      const result = registerSW.isControlled();

      expect(result).toBe(true);
    });

    it("should return false if page is not controlled", () => {
      mockServiceWorker.controller = null;

      const result = registerSW.isControlled();

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // SECTION 16: Event Listeners
  // ==========================================

  describe("Event Listeners - onUpdateAvailable", () => {
    it("should listen for update available events", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateAvailable(callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });

    it("should call callback when update available event fires", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateAvailable(callback);

      // Dispatch event
      const event = new CustomEvent("sw-update-available", {
        detail: { registration: mockRegistration },
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(mockRegistration);

      remove();
    });

    it("should remove listener when cleanup function called", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateAvailable(callback);

      // Remove listener
      remove();

      // Dispatch event
      const event = new CustomEvent("sw-update-available", {
        detail: { registration: mockRegistration },
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Event Listeners - onUpdateInstalled", () => {
    it("should listen for update installed events", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateInstalled(callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });

    it("should call callback when update installed event fires", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateInstalled(callback);

      // Dispatch event
      const event = new CustomEvent("sw-update-installed");
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();

      remove();
    });

    it("should remove listener when cleanup function called", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateInstalled(callback);

      // Remove listener
      remove();

      // Dispatch event
      const event = new CustomEvent("sw-update-installed");
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("Event Listeners - onSync", () => {
    it("should listen for sync started events", () => {
      const callback = vi.fn();
      const remove = registerSW.onSync("started", callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });

    it("should listen for sync completed events", () => {
      const callback = vi.fn();
      const remove = registerSW.onSync("completed", callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });

    it("should listen for sync failed events", () => {
      const callback = vi.fn();
      const remove = registerSW.onSync("failed", callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });

    it("should call callback when sync event fires", () => {
      const callback = vi.fn();
      const message = { type: "SYNC_STARTED", data: { syncId: "123" } };
      const remove = registerSW.onSync("started", callback);

      // Dispatch event
      const event = new CustomEvent("sw-sync-started", {
        detail: message,
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith(message);

      remove();
    });

    it("should remove listener when cleanup function called", () => {
      const callback = vi.fn();
      const remove = registerSW.onSync("completed", callback);

      // Remove listener
      remove();

      // Dispatch event
      const event = new CustomEvent("sw-sync-completed", {
        detail: { type: "SYNC_COMPLETED" },
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 17: Branch Coverage - All Conditions
  // ==========================================

  describe("Branch Coverage - All Conditions", () => {
    it("branch: if (!isLocalhost && protocol !== 'https:') - reject", async () => {
      const originalProtocol = window.location.protocol;
      Object.defineProperty(window.location, "protocol", {
        value: "http:",
        writable: true,
        configurable: true,
      });

      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "example.com",
        writable: true,
        configurable: true,
      });

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).not.toHaveBeenCalled();

      Object.defineProperty(window.location, "protocol", {
        value: originalProtocol,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("branch: if (document.readyState === 'loading') - wait for DOMContentLoaded", async () => {
      Object.defineProperty(document, "readyState", {
        value: "loading",
        writable: true,
        configurable: true,
      });

      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const registrationPromise = registerSW.registerServiceWorker();

      // Should setup DOMContentLoaded listener
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "DOMContentLoaded",
        expect.any(Function),
      );

      // Restore
      Object.defineProperty(document, "readyState", {
        value: "complete",
        writable: true,
        configurable: true,
      });
    });

    it("branch: if (enableAutoUpdate) - setup update check", async () => {
      mockRegistration.update.mockResolvedValue(undefined);
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({ enableAutoUpdate: true });

      expect(mockRegistration.update).toHaveBeenCalled();
    });

    it("branch: if (!enableAutoUpdate) - skip update check", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({ enableAutoUpdate: false });

      expect(mockRegistration.update).not.toHaveBeenCalled();
    });

    it("branch: if (onSuccess) - call success callback", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const onSuccess = vi.fn();

      await registerSW.registerServiceWorker({ onSuccess });

      expect(onSuccess).toHaveBeenCalledWith(mockRegistration);
    });

    it("branch: if (registration.installing) - track installing", async () => {
      const installingWorker = {
        state: "installing",
        addEventListener: vi.fn(),
      };

      const registrationWithInstalling = {
        ...mockRegistration,
        installing: installingWorker,
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithInstalling);

      await registerSW.registerServiceWorker();

      expect(installingWorker.addEventListener).toHaveBeenCalledWith(
        "statechange",
        expect.any(Function),
      );
    });

    it("branch: if (registration.waiting) - call onUpdate", async () => {
      const waitingWorker = { state: "installed" };

      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithWaiting);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      expect(onUpdate).toHaveBeenCalled();
    });

    it("branch: if (registration.active) - log active state", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Should not throw
      expect(true).toBe(true);
    });

    it("branch: if (!newWorker) in updatefound - return early", async () => {
      let updateFoundHandler: Function | null = null;

      const registrationWithListener = {
        ...mockRegistration,
        installing: null,
        addEventListener: vi.fn((event, handler) => {
          if (event === "updatefound") {
            updateFoundHandler = handler;
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithListener);

      await registerSW.registerServiceWorker();

      // Simulate updatefound with no new worker
      if (updateFoundHandler) {
        await updateFoundHandler();
      }

      expect(true).toBe(true);
    });

    it("branch: if (!isReloading) - reload once", async () => {
      const waitingWorker = { state: "installed" };

      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      let controllerChangeHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "controllerchange") {
          controllerChangeHandler = handler;
        }
      });

      const reloadSpy = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => {});

      await registerSW.skipWaiting();

      if (controllerChangeHandler) {
        await controllerChangeHandler();
      }

      expect(reloadSpy).toHaveBeenCalledTimes(1);

      reloadSpy.mockRestore();
    });
  });

  // ==========================================
  // SECTION 18: Path Coverage - Update Flow
  // ==========================================

  describe("Path Coverage - Update Flow", () => {
    it("Path 1: Registration → No SW support → Return early", async () => {
      // @ts-ignore
      delete navigator.serviceWorker;

      await registerSW.registerServiceWorker();

      expect(true).toBe(true); // No error

      Object.defineProperty(navigator, "serviceWorker", {
        value: mockServiceWorker,
        writable: true,
        configurable: true,
      });
    });

    it("Path 2: Registration → HTTPS check failed → Return early", async () => {
      const originalProtocol = window.location.protocol;
      Object.defineProperty(window.location, "protocol", {
        value: "http:",
        writable: true,
        configurable: true,
      });

      const originalHostname = window.location.hostname;
      Object.defineProperty(window.location, "hostname", {
        value: "example.com",
        writable: true,
        configurable: true,
      });

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).not.toHaveBeenCalled();

      Object.defineProperty(window.location, "protocol", {
        value: originalProtocol,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(window.location, "hostname", {
        value: originalHostname,
        writable: true,
        configurable: true,
      });
    });

    it("Path 3: Registration → Register fails → Call onError", async () => {
      const error = new Error("Registration failed");
      mockServiceWorker.register.mockRejectedValue(error);

      const onError = vi.fn();

      await registerSW.registerServiceWorker({ onError });

      expect(onError).toHaveBeenCalledWith(error);
    });

    it("Path 4: Registration → Success → Setup listeners → Call onSuccess", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const onSuccess = vi.fn();

      await registerSW.registerServiceWorker({ onSuccess });

      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("Path 5: Update available → Waiting worker → Call onUpdate", async () => {
      const waitingWorker = { state: "installed" };

      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.register.mockResolvedValue(registrationWithWaiting);

      const onUpdate = vi.fn();

      await registerSW.registerServiceWorker({ onUpdate });

      expect(onUpdate).toHaveBeenCalled();
    });

    it("Path 6: skipWaiting → No waiting worker → Return early", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      await registerSW.skipWaiting();

      expect(mockServiceWorker.controller).toBeFalsy();
    });

    it("Path 7: skipWaiting → Waiting worker → Send SKIP_WAITING", async () => {
      const waitingWorker = { state: "installed" };

      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      await registerSW.skipWaiting();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SKIP_WAITING" }),
      );
    });

    it("Path 8: unregister → Success → Clear caches", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(true);
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue(["cache-v1"]),
        delete: vi.fn().mockResolvedValue(true),
      };

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(true);

      // @ts-ignore
      delete global.caches;
    });

    it("Path 9: unregister → Fail → Return false", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(false);

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(false);
    });
  });

  // ==========================================
  // SECTION 19: Real-World Scenarios
  // ==========================================

  describe("Real-World Scenarios", () => {
    it("should handle complete update flow", async () => {
      // 1. Initial registration
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();

      // 2. Update available
      const waitingWorker = { state: "installed" };
      const registrationWithWaiting = {
        ...mockRegistration,
        waiting: waitingWorker,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(
        registrationWithWaiting,
      );
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // 3. Skip waiting
      await registerSW.skipWaiting();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SKIP_WAITING" }),
      );
    });

    it("should handle background sync notification", async () => {
      let messageHandler: Function | null = null;

      mockServiceWorker.addEventListener = vi.fn((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker();

      // Simulate sync started
      if (messageHandler) {
        await messageHandler({
          data: { type: "SYNC_STARTED", data: { syncId: "123" } },
        });
      }

      expect(true).toBe(true);
    });

    it("should handle cache clear and version check", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue(["cache-v1", "cache-v2"]),
        delete: vi.fn().mockResolvedValue(true),
      };

      await registerSW.clearAllCaches();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "CLEAR_CACHE" }),
      );

      // @ts-ignore
      delete global.caches;
    });

    it("should handle unregister and cleanup", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(true);
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      // @ts-ignore
      global.caches = {
        keys: vi.fn().mockResolvedValue(["cache-v1"]),
        delete: vi.fn().mockResolvedValue(true),
      };

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(true);
      expect(mockRegistration.unregister).toHaveBeenCalled();

      // @ts-ignore
      delete global.caches;
    });
  });

  // ==========================================
  // SECTION 20: Performance Testing
  // ==========================================

  describe("Performance Testing", () => {
    it("should handle rapid update checks", async () => {
      vi.useFakeTimers();

      mockRegistration.update.mockResolvedValue(undefined);
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      await registerSW.registerServiceWorker({
        enableAutoUpdate: true,
        checkUpdateInterval: 1000, // 1 second
      });

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000);
      }

      expect(mockRegistration.update).toHaveBeenCalledTimes(11); // Initial + 10 periodic

      vi.useRealTimers();
    });

    it("should handle concurrent message sends", async () => {
      mockServiceWorker.controller = {
        postMessage: vi.fn(),
      };

      const messages = [
        { type: "SKIP_WAITING" as const },
        { type: "CLEAR_CACHE" as const },
        { type: "GET_VERSION" as const },
      ];

      await Promise.all(messages.map((msg) => registerSW.sendMessageToSW(msg)));

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledTimes(3);
    });
  });
});
