/**
 * Device Detection Utilities Unit Tests
 * Testing device, browser, and platform detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock window and navigator
const mockMatchMedia = vi.fn();

Object.defineProperty(globalThis, "window", {
  value: {
    navigator: {
      userAgent: "",
      maxTouchPoints: 0,
      standalone: false,
    },
    matchMedia: mockMatchMedia,
  },
  writable: true,
});

// Import after mocking
import {
  isIOS,
  isAndroid,
  isStandalone,
  isMobile,
  getDeviceType,
  getBrowser,
  isInstallSupported,
  getDeviceInfo,
} from "../../../../lib/utils/device-detect";
import type { DeviceInfo, DeviceType, BrowserType } from "../../../../lib/utils/device-detect";

describe("Device Detection Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset navigator defaults
    (window.navigator as any).userAgent = "";
    (window.navigator as any).maxTouchPoints = 0;
    (window.navigator as any).standalone = false;

    // Reset matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("isIOS", () => {
    it("should detect iPhone", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";

      expect(isIOS()).toBe(true);
    });

    it("should detect iPad", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)";

      expect(isIOS()).toBe(true);
    });

    it("should detect iPod", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0 like Mac OS X)";

      expect(isIOS()).toBe(true);
    });

    it("should detect iPadOS 13+ as Macintosh with touch points", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
      (window.navigator as any).maxTouchPoints = 5;

      expect(isIOS()).toBe(true);
    });

    it("should not detect Macintosh without touch points as iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";
      (window.navigator as any).maxTouchPoints = 0;

      expect(isIOS()).toBe(false);
    });

    it("should not detect Android as iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 10)";

      expect(isIOS()).toBe(false);
    });

    it("should not detect Windows as iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

      expect(isIOS()).toBe(false);
    });

    it("should return false when window is undefined", () => {
      // Temporarily set window to undefined
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      expect(isIOS()).toBe(false);

      // Restore window
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("isAndroid", () => {
    it("should detect Android", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36";

      expect(isAndroid()).toBe(true);
    });

    it("should detect Android with Chrome", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 11) Chrome/91.0.4472.120";

      expect(isAndroid()).toBe(true);
    });

    it("should detect Android with Firefox", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0";

      expect(isAndroid()).toBe(true);
    });

    it("should not detect iOS as Android", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";

      expect(isAndroid()).toBe(false);
    });

    it("should not detect Windows as Android", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

      expect(isAndroid()).toBe(false);
    });

    it("should return false when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      expect(isAndroid()).toBe(false);

      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("isStandalone", () => {
    it("should detect standalone via navigator.standalone (iOS)", () => {
      (window.navigator as any).standalone = true;

      expect(isStandalone()).toBe(true);
    });

    it("should detect standalone via display-mode: standalone", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      expect(isStandalone()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(display-mode: standalone)",
      );
    });

    it("should detect standalone via display-mode: minimal-ui", () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      expect(isStandalone()).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(display-mode: minimal-ui)",
      );
    });

    it("should not be standalone when all checks fail", () => {
      (window.navigator as any).standalone = false;
      mockMatchMedia.mockReturnValue({ matches: false });

      expect(isStandalone()).toBe(false);
    });

    it("should return false when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      expect(isStandalone()).toBe(false);

      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("isMobile", () => {
    it("should detect iOS as mobile", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";

      expect(isMobile()).toBe(true);
    });

    it("should detect Android as mobile", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 10)";

      expect(isMobile()).toBe(true);
    });

    it("should detect mobile from user agent", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Mobile; rv:68.0)";

      expect(isMobile()).toBe(true);
    });

    it("should detect tablet from user agent", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Tablet; Android 10)";

      expect(isMobile()).toBe(true);
    });

    it("should not detect desktop as mobile", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

      expect(isMobile()).toBe(false);
    });

    it("should return false when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      expect(isMobile()).toBe(false);

      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("getDeviceType", () => {
    it("should return 'ios' for iOS devices", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";

      expect(getDeviceType()).toBe<"ios">("ios");
    });

    it("should return 'android' for Android devices", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 10)";

      expect(getDeviceType()).toBe<"android">("android");
    });

    it("should return 'desktop' for desktop devices", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

      expect(getDeviceType()).toBe<"desktop">("desktop");
    });

    it("should assume mobile non-android is iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Mobile; rv:68.0)";

      expect(getDeviceType()).toBe("ios");
    });
  });

  describe("getBrowser", () => {
    it("should detect Chrome", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0) Chrome/91.0.4472.124";

      expect(getBrowser()).toBe<"chrome">("chrome");
    });

    it("should detect Safari", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/14.0.3";

      expect(getBrowser()).toBe<"safari">("safari");
    });

    it("should detect Firefox", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Firefox/89.0";

      expect(getBrowser()).toBe<"firefox">("firefox");
    });

    it("should detect Edge", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/91.0.864.59";

      expect(getBrowser()).toBe<"edge">("edge");
    });

    it("should detect Chrome-based Edge as Edge", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Edg/91.0.864.59";

      expect(getBrowser()).toBe("edge");
    });

    it("should not detect Chrome in Safari as Chrome", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/14.0.3 Chrome/91.0.4472.124";

      expect(getBrowser()).toBe("safari");
    });

    it("should return 'unknown' for unrecognized browser", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (UnknownBrowser/1.0)";

      expect(getBrowser()).toBe<"unknown">("unknown");
    });

    it("should return 'unknown' when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      expect(getBrowser()).toBe("unknown");

      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe("isInstallSupported", () => {
    it("should return true for iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";

      expect(isInstallSupported()).toBe(true);
    });

    it("should return true for Chrome", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0) Chrome/91.0.4472.124";

      expect(isInstallSupported()).toBe(true);
    });

    it("should return true for Edge", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0) Edge/91.0.864.59";

      expect(isInstallSupported()).toBe(true);
    });

    it("should return false for Firefox", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Firefox/89.0";

      expect(isInstallSupported()).toBe(false);
    });

    it("should return false for Safari (desktop)", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/14.0.3";

      expect(isInstallSupported()).toBe(false);
    });

    it("should return false for Android with unsupported browser", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 10) Firefox/89.0";

      expect(isInstallSupported()).toBe(false);
    });
  });

  describe("getDeviceInfo", () => {
    it("should return complete device info for iOS", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0) Safari/14.0";
      (window.navigator as any).maxTouchPoints = 5;

      const info = getDeviceInfo();

      expect(info).toEqual({
        type: "ios" as DeviceType,
        browser: "safari" as BrowserType,
        isMobile: true,
        isStandalone: false,
        userAgent: (window.navigator as any).userAgent,
        maxTouchPoints: 5,
      } as DeviceInfo);
    });

    it("should return complete device info for Android", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 11) Chrome/91.0.4472.120";
      (window.navigator as any).maxTouchPoints = 10;

      const info = getDeviceInfo();

      expect(info.type).toBe("android");
      expect(info.browser).toBe("chrome");
      expect(info.isMobile).toBe(true);
      expect(info.maxTouchPoints).toBe(10);
    });

    it("should return complete device info for Desktop", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0) Chrome/91.0.4472.124";
      (window.navigator as any).maxTouchPoints = 0;

      const info = getDeviceInfo();

      expect(info.type).toBe("desktop");
      expect(info.browser).toBe("chrome");
      expect(info.isMobile).toBe(false);
      expect(info.maxTouchPoints).toBe(0);
    });

    it("should include standalone state", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";
      (window.navigator as any).standalone = true;

      const info = getDeviceInfo();

      expect(info.isStandalone).toBe(true);
    });

    it("should handle missing maxTouchPoints", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0) Chrome/91.0.4472.124";
      delete (window.navigator as any).maxTouchPoints;

      const info = getDeviceInfo();

      expect(info.maxTouchPoints).toBe(0);
    });

    it("should return all required fields", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)";

      const info = getDeviceInfo();

      expect(info).toHaveProperty("type");
      expect(info).toHaveProperty("browser");
      expect(info).toHaveProperty("isMobile");
      expect(info).toHaveProperty("isStandalone");
      expect(info).toHaveProperty("userAgent");
      expect(info).toHaveProperty("maxTouchPoints");
    });
  });

  describe("Real-world scenarios", () => {
    it("should detect iPhone Safari", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1";

      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
      expect(isMobile()).toBe(true);
      expect(getBrowser()).toBe("safari");
      expect(getDeviceType()).toBe("ios");
      expect(isInstallSupported()).toBe(true);
    });

    it("should detect Android Chrome", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36";

      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(true);
      expect(isMobile()).toBe(true);
      expect(getBrowser()).toBe("chrome");
      expect(getDeviceType()).toBe("android");
      expect(isInstallSupported()).toBe(true);
    });

    it("should detect Windows Chrome Desktop", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(false);
      expect(isMobile()).toBe(false);
      expect(getBrowser()).toBe("chrome");
      expect(getDeviceType()).toBe("desktop");
      expect(isInstallSupported()).toBe(true);
    });

    it("should detect iPadOS 13+ with touch", () => {
      (window.navigator as any).userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15";
      (window.navigator as any).maxTouchPoints = 5;

      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
      expect(isMobile()).toBe(true);
      expect(getBrowser()).toBe("safari");
      expect(getDeviceType()).toBe("ios");
    });
  });
});
