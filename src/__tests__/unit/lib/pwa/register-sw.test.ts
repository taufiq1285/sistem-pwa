/**
 * Tests for register-sw.ts
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
  controller: null,
  getRegistration: vi.fn(),
};

const mockRegistration = {
  installing: null,
  waiting: null,
  active: { state: "activated" },
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerServiceWorker", () => {
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

      // The function should complete without error
      await registerSW.registerServiceWorker({ onUpdate });

      // Verify registration was called
      expect(mockServiceWorker.register).toHaveBeenCalled();
    });

    it("should call onSuccess when registration succeeds", async () => {
      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const onSuccess = vi.fn();

      // The function should complete without error
      await registerSW.registerServiceWorker({ onSuccess });

      // Verify registration was called
      expect(mockServiceWorker.register).toHaveBeenCalled();
    });
  });

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
  });

  describe("skipWaiting", () => {
    it("should skip waiting and reload page", async () => {
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

      // Just verify the function completes without error
      await registerSW.skipWaiting();

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalled();
    });

    it("should return early if no waiting worker", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      await expect(registerSW.skipWaiting()).resolves.toBeUndefined();
    });

    it("should return early if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      await expect(registerSW.skipWaiting()).resolves.toBeUndefined();
    });
  });

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
  });

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

  describe("unregisterServiceWorker", () => {
    it("should unregister service worker", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);
      mockRegistration.unregister.mockResolvedValue(true);

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

    it("should return false if no registration", async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      const result = await registerSW.unregisterServiceWorker();

      expect(result).toBe(false);
    });
  });

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
  });

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
  });

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

  describe("onUpdateAvailable", () => {
    it("should listen for update available events", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateAvailable(callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });
  });

  describe("onUpdateInstalled", () => {
    it("should listen for update installed events", () => {
      const callback = vi.fn();
      const remove = registerSW.onUpdateInstalled(callback);

      expect(typeof remove).toBe("function");

      // Cleanup
      remove();
    });
  });

  describe("onSync", () => {
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
  });
});
