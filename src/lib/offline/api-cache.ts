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

export interface CacheEntry<T> {
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

    console.log(
      `[API Cache] cacheAPI called: key=${key}, forceRefresh=${forceRefresh}, staleWhileRevalidate=${staleWhileRevalidate}`,
    );

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedData<T>(key);

      if (cached) {
        const isExpired = Date.now() >= cached.expiresAt;

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
    } else {
      console.log(`[API Cache] forceRefresh=true, skipping cache for ${key}`);
    }

    // Try to fetch fresh data
    try {
      console.log(`[API Cache] MISS: ${key} (fetching fresh data...)`);
      const freshData = await fetcher();
      await setCachedData(key, freshData, ttl);
      console.log(`[API Cache] Fresh data fetched and cached for ${key}`);
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
 * Dispatches an event when complete so UI can re-render if needed
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

    // ✅ Dispatch event to notify UI that cache has been updated
    // Components can listen for this event to re-render with fresh data
    try {
      window.dispatchEvent(
        new CustomEvent("cache:updated", {
          detail: { key, data },
        }),
      );
      console.log(`[API Cache] Event dispatched: cache:updated (${key})`);
    } catch (eventError) {
      console.warn(
        `[API Cache] Failed to dispatch cache:updated event:`,
        eventError,
      );
    }
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
 * Helper function to invalidate cache entries matching pattern
 * This is the core logic shared by both sync and async versions
 */
async function invalidateCachePatternImpl(pattern: string): Promise<number> {
  await indexedDBManager.initialize();

  const db = (indexedDBManager as any).db as IDBDatabase | null;
  if (!db) {
    console.warn("[API Cache] IndexedDB not available");
    return 0;
  }

  const transaction = db.transaction(["metadata"], "readwrite");
  const store = transaction.objectStore("metadata");

  // Convert wildcard pattern to simple match function
  const searchPattern = pattern.replace(/\*/g, "").replace(/\?/g, "");

  console.log(`[API Cache] Searching for keys containing: "${searchPattern}"`);

  return new Promise((resolve, reject) => {
    let deletedCount = 0;
    let cursorComplete = false;

    // ✅ CRITICAL: Wait for transaction to complete, not just cursor
    // Transaction.oncomplete fires after all operations are committed to database
    transaction.oncomplete = () => {
      console.log(
        `[API Cache] Transaction committed successfully, deleted ${deletedCount} entries`,
      );
      resolve(deletedCount);
    };

    transaction.onerror = () => {
      console.error(`[API Cache] Transaction error:`, transaction.error);
      reject(transaction.error);
    };

    // Use a cursor-based approach for better performance and reliability
    const request = store.openCursor();

    request.onerror = () => {
      console.error(`[API Cache] Cursor error:`, request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const key = cursor.key;

        if (typeof key === "string" && key.startsWith("cache_")) {
          const actualKey = key.substring(6);

          if (actualKey.includes(searchPattern)) {
            console.log(`[API Cache] Deleting: ${key}`);
            cursor.delete();
            deletedCount++;
          }
        }

        // Continue to next entry
        cursor.continue();
      } else {
        // Cursor done - mark as complete
        cursorComplete = true;
        console.log(
          `[API Cache] Cursor completed, waiting for transaction commit... (${deletedCount} entries marked for deletion)`,
        );
        // Don't resolve here - wait for transaction.oncomplete
      }
    };
  });
}

/**
 * Invalidate all cache entries matching pattern (BLOCKING version)
 * Pattern supports simple wildcard: *kuis* matches any key containing "kuis"
 *
 * BLOCKING: Waits for cache deletion to complete before returning.
 * Use this for urgent cache invalidations where data must be fresh immediately.
 *
 * @returns Promise that resolves when cache invalidation is complete
 */
export async function invalidateCachePatternSync(
  pattern: string,
): Promise<number> {
  console.log(`[API Cache] Starting SYNC cache invalidation: ${pattern}`);

  try {
    const deletedCount = await invalidateCachePatternImpl(pattern);
    console.log(
      `[API Cache] SYNC invalidation completed: ${pattern} (${deletedCount} entries deleted)`,
    );
    return deletedCount;
  } catch (error) {
    console.error(
      `[API Cache] SYNC invalidation failed for ${pattern}:`,
      error,
    );
    return 0;
  }
}

/**
 * Invalidate all cache entries matching pattern (NON-BLOCKING version)
 * Pattern supports simple wildcard: *kuis* matches any key containing "kuis"
 *
 * NON-BLOCKING: Returns immediately after starting the background process.
 * Cache deletion happens asynchronously without blocking the caller.
 * Use this for non-urgent cleanup where immediate freshness is not critical.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  console.log(
    `[API Cache] Starting non-blocking cache invalidation: ${pattern}`,
  );

  // Use setTimeout to run this completely in the background
  // This ensures the caller can continue immediately without waiting
  setTimeout(async () => {
    try {
      await invalidateCachePatternImpl(pattern);
      console.log(`[API Cache] Background invalidation completed: ${pattern}`);
    } catch (error) {
      console.error(
        `[API Cache] Background: Failed to invalidate pattern ${pattern}:`,
        error,
      );
    }
  }, 0);

  // Return immediately - don't wait for the background process
  console.log(
    `[API Cache] invalidateCachePattern returned immediately (running in background)`,
  );
}

/**
 * Clear all cached data (BLOCKING version)
 *
 * BLOCKING: Waits for cache deletion to complete before returning.
 * Use this when you need to ensure cache is cleared before continuing.
 *
 * @returns Promise that resolves when cache is cleared
 */
export async function clearAllCacheSync(): Promise<number> {
  console.log("[API Cache] Starting SYNC clear all cache...");

  try {
    await indexedDBManager.initialize();

    const db = (indexedDBManager as any).db as IDBDatabase | null;
    if (!db) {
      console.warn("[API Cache] IndexedDB not available");
      return 0;
    }

    const transaction = db.transaction(["metadata"], "readwrite");
    const store = transaction.objectStore("metadata");

    console.log("[API Cache] Clearing all cache entries...");

    return new Promise((resolve, reject) => {
      let clearedCount = 0;

      transaction.oncomplete = () => {
        console.log(
          `[API Cache] SYNC clear all completed, cleared ${clearedCount} entries`,
        );
        resolve(clearedCount);
      };

      transaction.onerror = () => {
        console.error("[API Cache] Transaction error:", transaction.error);
        reject(transaction.error);
      };

      const request = store.openCursor();

      request.onerror = () => {
        console.error("[API Cache] Cursor error:", request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const key = cursor.key;

          if (typeof key === "string" && key.startsWith("cache_")) {
            console.log(`[API Cache] Deleting: ${key}`);
            cursor.delete();
            clearedCount++;
          }

          cursor.continue();
        }
      };
    });
  } catch (error) {
    console.error("[API Cache] SYNC clear all failed:", error);
    return 0;
  }
}

/**
 * Clear all cached data
 *
 * NON-BLOCKING: Returns immediately after starting the background process.
 * Cache deletion happens asynchronously without blocking the caller.
 */
export async function clearAllCache(): Promise<void> {
  console.log("[API Cache] Starting non-blocking clear all cache...");

  // Use setTimeout to run this completely in the background
  setTimeout(async () => {
    try {
      await indexedDBManager.initialize();

      const db = (indexedDBManager as any).db as IDBDatabase | null;
      if (!db) {
        console.warn("[API Cache] IndexedDB not available");
        return;
      }

      const transaction = db.transaction(["metadata"], "readwrite");
      const store = transaction.objectStore("metadata");

      console.log("[API Cache] Background: Clearing all cache entries...");

      // Use a cursor-based approach for better performance
      const request = store.openCursor();

      request.onerror = () => {
        console.error("[API Cache] Background: Cursor error:", request.error);
      };

      let clearedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const key = cursor.key;

          if (typeof key === "string" && key.startsWith("cache_")) {
            console.log(`[API Cache] Background: Deleting: ${key}`);
            cursor.delete();
            clearedCount++;
          }

          cursor.continue();
        } else {
          // Cursor done
          console.log(
            `[API Cache] Background: Completed, cleared ${clearedCount} entries`,
          );
        }
      };

      // Transaction will auto-commit
    } catch (error) {
      console.error(
        "[API Cache] Background: Failed to clear all cache:",
        error,
      );
    }
  }, 0);

  console.log(
    "[API Cache] clearAllCache returned immediately (running in background)",
  );
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
