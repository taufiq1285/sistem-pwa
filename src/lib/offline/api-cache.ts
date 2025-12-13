/**
 * Generic API Caching Layer
 * Wraps API calls dengan IndexedDB caching untuk offline support
 *
 * Usage:
 * const data = await cacheAPI('key', () => fetchFromAPI(), { ttl: 5 * 60 * 1000 });
 */

import { indexedDBManager } from "./indexeddb";

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  forceRefresh?: boolean; // Skip cache and fetch fresh data
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_STORE = "api_cache";

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Cache API call dengan automatic offline fallback
 */
export async function cacheAPI<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const {
    ttl = DEFAULT_TTL,
    forceRefresh = false,
    staleWhileRevalidate = false,
  } = options;

  try {
    await indexedDBManager.initialize();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedData<T>(key);

      if (cached) {
        const isExpired = Date.now() > cached.expiresAt;

        if (!isExpired) {
          console.log(`[API Cache] HIT: ${key}`);
          return cached.data;
        }

        // Stale data available
        if (staleWhileRevalidate) {
          console.log(`[API Cache] STALE: ${key} (revalidating in background)`);

          // Return stale data immediately
          // Fetch fresh data in background
          fetchAndCache(key, fetcher, ttl).catch(console.error);

          return cached.data;
        }
      }
    }

    // Try to fetch fresh data
    try {
      console.log(`[API Cache] MISS: ${key} (fetching...)`);
      const freshData = await fetcher();
      await setCachedData(key, freshData, ttl);
      return freshData;
    } catch (networkError) {
      // Network failed - try to use stale cache as fallback
      const staleCache = await getCachedData<T>(key);

      if (staleCache) {
        console.warn(`[API Cache] Network failed, using stale cache: ${key}`);
        return staleCache.data;
      }

      // No cache available, throw error
      throw networkError;
    }
  } catch (error) {
    console.error(`[API Cache] Error for ${key}:`, error);
    throw error;
  }
}

/**
 * Get cached data from IndexedDB
 */
async function getCachedData<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const cached = (await indexedDBManager.getMetadata(`cache_${key}`)) as
      | CacheEntry<T>
      | undefined;
    return cached || null;
  } catch (error) {
    console.error(`[API Cache] Failed to get cache for ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data to IndexedDB
 */
async function setCachedData<T>(
  key: string,
  data: T,
  ttl: number,
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    await indexedDBManager.setMetadata(`cache_${key}`, entry);
    console.log(`[API Cache] Cached: ${key} (TTL: ${ttl}ms)`);
  } catch (error) {
    console.error(`[API Cache] Failed to cache ${key}:`, error);
  }
}

/**
 * Fetch and cache data (for background updates)
 */
async function fetchAndCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<void> {
  try {
    const data = await fetcher();
    await setCachedData(key, data, ttl);
    console.log(`[API Cache] Background update completed: ${key}`);
  } catch (error) {
    console.error(`[API Cache] Background update failed: ${key}`, error);
  }
}

/**
 * Invalidate cache entry
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await indexedDBManager.initialize();
    await indexedDBManager.setMetadata(`cache_${key}`, null);
    console.log(`[API Cache] Invalidated: ${key}`);
  } catch (error) {
    console.error(`[API Cache] Failed to invalidate ${key}:`, error);
  }
}

/**
 * Invalidate all cache entries matching pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    await indexedDBManager.initialize();
    // This is a simplified version - in production you'd want to iterate all keys
    console.log(`[API Cache] Invalidating pattern: ${pattern}`);
    // TODO: Implement pattern-based invalidation
  } catch (error) {
    console.error(
      `[API Cache] Failed to invalidate pattern ${pattern}:`,
      error,
    );
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    await indexedDBManager.initialize();
    console.log("[API Cache] Clearing all cache...");

    // Get all metadata keys and clear those starting with 'cache_'
    const db = (indexedDBManager as any).db as IDBDatabase | null;
    if (!db) {
      console.warn("[API Cache] IndexedDB not available");
      return;
    }

    const transaction = db.transaction(["metadata"], "readwrite");
    const store = transaction.objectStore("metadata");
    const allKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Clear all cache entries (keys starting with 'cache_')
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith("cache_")) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(key);
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => {
            console.log(`[API Cache] Cleared: ${key}`);
            resolve();
          };
        });
      }
    }

    console.log("[API Cache] All cache entries cleared");
  } catch (error) {
    console.error("[API Cache] Failed to clear all cache:", error);
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Optimistic update pattern
 * Update cache immediately, sync to server in background
 */
export async function optimisticUpdate<T>(
  key: string,
  data: T,
  updater: () => Promise<T>,
  options: { ttl?: number } = {},
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  try {
    await indexedDBManager.initialize();

    // Update cache immediately for instant UI update
    await setCachedData(key, data, ttl);

    // Try to sync to server in background
    if (isOnline()) {
      try {
        const serverData = await updater();
        await setCachedData(key, serverData, ttl);
        return serverData;
      } catch (error) {
        console.error(
          `[API Cache] Optimistic update failed for ${key}, keeping local:`,
          error,
        );
        // Keep local update, will sync later
        return data;
      }
    }

    // Offline - just return local data
    return data;
  } catch (error) {
    console.error(`[API Cache] Optimistic update error for ${key}:`, error);
    throw error;
  }
}
