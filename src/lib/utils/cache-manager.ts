import logger from "@/lib/utils/logger";
/**
 * Cache Manager Utility
 *
 * Manages application cache and storage
 * Auto-clears old cache on version updates
 */

const APP_VERSION_KEY = "app_version";
const CURRENT_VERSION = __APP_VERSION__;
const PRESERVED_LOCAL_STORAGE_KEYS = [
  "auth_cache",
  "sb-lqkzhrdhrbexdtrgmogd-auth-token",
  "theme",
  "lang",
];

function clearServiceWorkerCachesBestEffort(): void {
  if (typeof window === "undefined" || !("caches" in window)) {
    return;
  }

  void caches
    .keys()
    .then((cacheNames) =>
      Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))),
    )
    .catch((error) => {
      console.error("Failed to clear service worker caches:", error);
    });
}

/**
 * Initialize cache manager
 * Call this on app startup to clear old cache if version changed
 */
export function initializeCacheManager(): void {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);

    // If version changed or first time, clear stale cache safely
    if (storedVersion !== CURRENT_VERSION) {
      clearAllCache();
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
    }
  } catch (error) {
    console.error("Failed to initialize cache manager:", error);
  }
}

/**
 * Clear all application cache except auth
 */
export function clearAllCache(): void {
  try {
    const preservedEntries = PRESERVED_LOCAL_STORAGE_KEYS.map((key) => [
      key,
      localStorage.getItem(key),
    ] as const);

    localStorage.clear();

    preservedEntries.forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      }
    });

    sessionStorage.clear();
    clearServiceWorkerCachesBestEffort();

    // Set version
    localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error("Failed to clear cache:", error);
  }
}

/**
 * Force clear everything including auth (logout)
 */
export function clearEverything(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  } catch (error) {
    console.error("Failed to clear everything:", error);
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  version: string;
  localStorageKeys: number;
  sessionStorageKeys: number;
  localStorageSize: number;
} {
  return {
    version: localStorage.getItem(APP_VERSION_KEY) || "unknown",
    localStorageKeys: Object.keys(localStorage).length,
    sessionStorageKeys: Object.keys(sessionStorage).length,
    localStorageSize: new Blob(Object.values(localStorage)).size,
  };
}

/**
 * Debug: Print all storage keys
 */
export function debugStorage(): void {
  if (!import.meta.env.DEV) return;

  console.group("📦 Storage Debug");
  logger.debug("Version:", localStorage.getItem(APP_VERSION_KEY));
  logger.debug("localStorage keys:", Object.keys(localStorage));
  logger.debug("sessionStorage keys:", Object.keys(sessionStorage));
  console.groupEnd();
}
