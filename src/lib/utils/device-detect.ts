/**
 * Device Detection Utilities
 *
 * Detects:
 * - iOS devices (iPhone, iPad, iPod)
 * - Android devices
 * - Standalone mode (PWA installed)
 * - Browser type
 */

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Check for iOS devices
  const isIOSDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    // iPadOS 13+ identifies as Macintosh
    (/macintosh/.test(userAgent) &&
      (window.navigator as any).maxTouchPoints > 0);

  return isIOSDevice;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;

  return /android/.test(window.navigator.userAgent.toLowerCase());
}

/**
 * Check if app is running in standalone mode (PWA installed)
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // Check display-mode
  const isDisplayStandalone =
    (window.navigator as any).standalone ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: standalone)").matches;

  return isDisplayStandalone;
}

/**
 * Check if running in mobile browser
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;

  return (
    isIOS() ||
    isAndroid() ||
    /mobile|tablet|ip(ad|hone|od)/i.test(window.navigator.userAgent)
  );
}

/**
 * Get device type
 */
export type DeviceType = "ios" | "android" | "desktop" | "unknown";

export function getDeviceType(): DeviceType {
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  if (isMobile()) return "ios"; // Assume mobile non-android is iOS
  return "desktop";
}

/**
 * Get browser name
 */
export type BrowserType = "chrome" | "safari" | "firefox" | "edge" | "unknown";

export function getBrowser(): BrowserType {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
    return "chrome";
  }
  if (userAgent.includes("safari")) {
    return "safari";
  }
  if (userAgent.includes("firefox")) {
    return "firefox";
  }
  if (userAgent.includes("edg")) {
    return "edge";
  }

  return "unknown";
}

/**
 * Check if PWA install is supported
 */
export function isInstallSupported(): boolean {
  // iOS always supports "Add to Home Screen"
  if (isIOS()) return true;

  // Android/Desktop Chrome/Edge support install prompt
  const browser = getBrowser();
  return browser === "chrome" || browser === "edge";
}

/**
 * Get device info for debugging/logging
 */
export interface DeviceInfo {
  type: DeviceType;
  browser: BrowserType;
  isMobile: boolean;
  isStandalone: boolean;
  userAgent: string;
  maxTouchPoints: number;
}

export function getDeviceInfo(): DeviceInfo {
  return {
    type: getDeviceType(),
    browser: getBrowser(),
    isMobile: isMobile(),
    isStandalone: isStandalone(),
    userAgent: window.navigator.userAgent,
    maxTouchPoints: (window.navigator as any).maxTouchPoints || 0,
  };
}
