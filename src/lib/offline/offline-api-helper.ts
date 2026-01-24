/**
 * Offline API Helper
 *
 * Purpose: Provides offline fallback utilities for API calls
 * - Detects offline mode
 * - Provides cached data fallback
 * - Handles offline errors gracefully
 */

import { networkDetector } from "./network-detector";

// ============================================================================
// TYPES
// ============================================================================

export type OfflineFallback<T> = {
  cached?: T;
  defaultValue?: T;
  skipOnError?: boolean;
};

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return !networkDetector.isOnline();
}

/**
 * Execute function only when online, otherwise return cached/default value
 */
export async function withOfflineFallback<T>(
  fn: () => Promise<T>,
  options: OfflineFallback<T> = {},
): Promise<T> {
  const { cached, defaultValue, skipOnError = true } = options;

  // If offline, return cached or default value
  if (isOffline()) {
    console.log("ℹ️ Offline mode - using cached/default value");

    if (cached !== undefined) {
      return cached as T;
    }

    if (defaultValue !== undefined) {
      return defaultValue as T;
    }

    // If no cached or default, return empty array for list operations
    return [] as unknown as T;
  }

  // If online, execute the function
  try {
    return await fn();
  } catch (error) {
    // If error occurs and skipOnError is true, return cached/default
    if (skipOnError) {
      console.warn("⚠️ API call failed, using fallback:", error);

      if (cached !== undefined) {
        return cached as T;
      }

      if (defaultValue !== undefined) {
        return defaultValue as T;
      }

      // Return empty array for list operations
      return [] as unknown as T;
    }

    throw error;
  }
}

/**
 * Execute multiple API calls in parallel with offline fallback
 */
export async function withOfflineFallbackAll<T>(
  functions: (() => Promise<T>)[],
  options: OfflineFallback<T[]> = {},
): Promise<T[]> {
  const { cached, defaultValue, skipOnError = true } = options;

  // If offline, return cached or default value
  if (isOffline()) {
    console.log("ℹ️ Offline mode - using cached/default values for batch");

    if (cached !== undefined) {
      return cached;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return [];
  }

  // If online, execute all functions
  try {
    return await Promise.all(functions.map((fn) => fn()));
  } catch (error) {
    if (skipOnError) {
      console.warn("⚠️ Batch API call failed, using fallback:", error);

      if (cached !== undefined) {
        return cached;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      return [];
    }

    throw error;
  }
}

/**
 * Check if should skip API call (offline mode)
 * Returns true if offline and should skip
 */
export function shouldSkipApiCall(): boolean {
  return isOffline();
}

/**
 * Log offline mode message
 */
export function logOfflineMode(operation: string): void {
  console.log(`ℹ️ Offline mode - skipping ${operation}, using cached data`);
}

/**
 * Log API error with offline context
 */
export function logApiError(operation: string, error: unknown): void {
  if (isOffline()) {
    console.log(`ℹ️ Offline mode - ${operation} unavailable`);
  } else {
    console.error(`❌ Error in ${operation}:`, error);
  }
}
