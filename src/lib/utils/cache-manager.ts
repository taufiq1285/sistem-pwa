/**
 * Cache Manager Utility
 *
 * Manages application cache and storage
 * Auto-clears old cache on version updates
 */

const APP_VERSION_KEY = 'app_version';
const CURRENT_VERSION = '1.0.0'; // Update this when you make breaking changes

/**
 * Initialize cache manager
 * Call this on app startup to clear old cache if version changed
 */
export function initializeCacheManager(): void {
  try {
    const storedVersion = localStorage.getItem(APP_VERSION_KEY);

    // If version changed or first time, clear all cache
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 App version changed: ${storedVersion} → ${CURRENT_VERSION}`);
      clearAllCache();
      localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
      console.log('✅ Cache cleared successfully');
    }
  } catch (error) {
    console.error('Failed to initialize cache manager:', error);
  }
}

/**
 * Clear all application cache except auth
 */
export function clearAllCache(): void {
  try {
    // Get auth cache before clearing
    const authCache = localStorage.getItem('auth_cache');
    const supabaseAuth = localStorage.getItem('sb-lqkzhrdhrbexdtrgmogd-auth-token');

    // Clear all localStorage
    localStorage.clear();

    // Restore auth if exists
    if (authCache) {
      localStorage.setItem('auth_cache', authCache);
    }
    if (supabaseAuth) {
      localStorage.setItem('sb-lqkzhrdhrbexdtrgmogd-auth-token', supabaseAuth);
    }

    // Set version
    localStorage.setItem(APP_VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error('Failed to clear cache:', error);
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

    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('Failed to clear everything:', error);
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
    version: localStorage.getItem(APP_VERSION_KEY) || 'unknown',
    localStorageKeys: Object.keys(localStorage).length,
    sessionStorageKeys: Object.keys(sessionStorage).length,
    localStorageSize: new Blob(Object.values(localStorage)).size,
  };
}

/**
 * Debug: Print all storage keys
 */
export function debugStorage(): void {
  console.group('📦 Storage Debug');
  console.log('Version:', localStorage.getItem(APP_VERSION_KEY));
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('sessionStorage keys:', Object.keys(sessionStorage));
  console.groupEnd();
}
