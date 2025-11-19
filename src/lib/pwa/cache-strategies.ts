/**
 * Cache Strategies
 *
 * Implements various caching strategies for PWA
 *
 * Strategies:
 * 1. CacheFirst - Try cache, fallback to network
 * 2. NetworkFirst - Try network, fallback to cache
 * 3. StaleWhileRevalidate - Return cache immediately, update in background
 * 4. NetworkOnly - Always fetch from network
 * 5. CacheOnly - Always use cache
 *
 * Features:
 * - TypeScript type safety
 * - Configurable timeouts
 * - Cache expiration
 * - Error handling
 * - Logging
 */

import type { CacheRule } from '@/config/cache.config';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache match options
 */
export interface CacheMatchOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
}

/**
 * Strategy options
 */
export interface StrategyOptions {
  cacheName: string;
  maxAge?: number;
  maxEntries?: number;
  networkTimeout?: number;
  cacheMatchOptions?: CacheMatchOptions;
  debug?: boolean;
}

/**
 * Strategy handler
 */
export type StrategyHandler = (
  request: Request,
  options: StrategyOptions
) => Promise<Response>;

/**
 * Cache entry metadata
 */
export interface CacheMetadata {
  timestamp: number;
  url: string;
  cacheTime: number;
}

// ============================================================================
// CACHE FIRST STRATEGY
// ============================================================================

/**
 * Cache First Strategy
 *
 * Flow: Cache → Network → Fallback
 *
 * Best for:
 * - Static assets (JS, CSS, fonts)
 * - Images
 * - Assets that rarely change
 *
 * @param request - Request to handle
 * @param options - Strategy options
 * @returns Response from cache or network
 */
export async function cacheFirst(
  request: Request,
  options: StrategyOptions
): Promise<Response> {
  const { cacheName, cacheMatchOptions, debug } = options;

  try {
    // 1. Try cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request, cacheMatchOptions);

    if (cachedResponse) {
      if (debug) {
        console.log(`[CacheFirst] Cache hit: ${request.url}`);
      }

      // Check if cached response is still valid
      if (await isCacheValid(cachedResponse, options)) {
        return cachedResponse;
      } else {
        if (debug) {
          console.log(`[CacheFirst] Cache expired: ${request.url}`);
        }
      }
    }

    // 2. Cache miss or expired - fetch from network
    if (debug) {
      console.log(`[CacheFirst] Cache miss, fetching from network: ${request.url}`);
    }

    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);

      if (debug) {
        console.log(`[CacheFirst] Cached new response: ${request.url}`);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[CacheFirst] Strategy failed:', error);

    // Try to return stale cache as last resort
    const cache = await caches.open(cacheName);
    const staleResponse = await cache.match(request);

    if (staleResponse) {
      console.warn('[CacheFirst] Returning stale cache:', request.url);
      return staleResponse;
    }

    throw error;
  }
}

// ============================================================================
// NETWORK FIRST STRATEGY
// ============================================================================

/**
 * Network First Strategy
 *
 * Flow: Network → Cache → Fallback
 *
 * Best for:
 * - API calls
 * - Dynamic data
 * - Content that changes frequently
 *
 * @param request - Request to handle
 * @param options - Strategy options
 * @returns Response from network or cache
 */
export async function networkFirst(
  request: Request,
  options: StrategyOptions
): Promise<Response> {
  const { cacheName, networkTimeout = 3000, cacheMatchOptions, debug } = options;

  try {
    // 1. Try network first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), networkTimeout);

    try {
      const networkResponse = await fetch(request, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (debug) {
        console.log(`[NetworkFirst] Network success: ${request.url}`);
      }

      // Cache successful responses
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(cacheName);
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);

        if (debug) {
          console.log(`[NetworkFirst] Cached response: ${request.url}`);
        }
      }

      return networkResponse;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // 2. Network failed - try cache
    if (debug) {
      console.log(`[NetworkFirst] Network failed, trying cache: ${request.url}`);
    }

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request, cacheMatchOptions);

    if (cachedResponse) {
      console.warn('[NetworkFirst] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // 3. Both failed
    console.error('[NetworkFirst] Strategy failed:', error);
    throw error;
  }
}

// ============================================================================
// STALE WHILE REVALIDATE STRATEGY
// ============================================================================

/**
 * Stale While Revalidate Strategy
 *
 * Flow: Cache (immediate) + Network (background update)
 *
 * Best for:
 * - Pages
 * - CSS/JS that updates occasionally
 * - Content where freshness is nice but not critical
 *
 * @param request - Request to handle
 * @param options - Strategy options
 * @returns Response from cache (if available) or network
 */
export async function staleWhileRevalidate(
  request: Request,
  options: StrategyOptions
): Promise<Response> {
  const { cacheName, cacheMatchOptions, debug } = options;

  try {
    const cache = await caches.open(cacheName);

    // Get cached response (non-blocking)
    const cachedResponsePromise = cache.match(request, cacheMatchOptions);

    // Fetch fresh response (background)
    const networkResponsePromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          // Update cache in background
          const responseToCache = networkResponse.clone();
          await cache.put(request, responseToCache);

          if (debug) {
            console.log(`[StaleWhileRevalidate] Background cache update: ${request.url}`);
          }
        }
        return networkResponse;
      })
      .catch((error) => {
        if (debug) {
          console.warn('[StaleWhileRevalidate] Network update failed:', error);
        }
        return null;
      });

    // Return cached response immediately if available
    const cachedResponse = await cachedResponsePromise;
    if (cachedResponse) {
      if (debug) {
        console.log(`[StaleWhileRevalidate] Serving from cache: ${request.url}`);
      }

      // Network update continues in background
      networkResponsePromise.catch(() => {
        // Ignore background errors
      });

      return cachedResponse;
    }

    // No cache - wait for network
    if (debug) {
      console.log(`[StaleWhileRevalidate] No cache, waiting for network: ${request.url}`);
    }

    const networkResponse = await networkResponsePromise;
    if (networkResponse) {
      return networkResponse;
    }

    throw new Error('Both cache and network failed');
  } catch (error) {
    console.error('[StaleWhileRevalidate] Strategy failed:', error);
    throw error;
  }
}

// ============================================================================
// NETWORK ONLY STRATEGY
// ============================================================================

/**
 * Network Only Strategy
 *
 * Flow: Network only
 *
 * Best for:
 * - POST/PUT/DELETE requests
 * - Real-time data
 * - Authentication
 *
 * @param request - Request to handle
 * @param options - Strategy options
 * @returns Response from network
 */
export async function networkOnly(
  request: Request,
  options: StrategyOptions
): Promise<Response> {
  const { debug } = options;

  try {
    if (debug) {
      console.log(`[NetworkOnly] Fetching from network: ${request.url}`);
    }

    const response = await fetch(request);
    return response;
  } catch (error) {
    console.error('[NetworkOnly] Network request failed:', error);
    throw error;
  }
}

// ============================================================================
// CACHE ONLY STRATEGY
// ============================================================================

/**
 * Cache Only Strategy
 *
 * Flow: Cache only
 *
 * Best for:
 * - Precached assets
 * - Offline-first content
 *
 * @param request - Request to handle
 * @param options - Strategy options
 * @returns Response from cache
 */
export async function cacheOnly(
  request: Request,
  options: StrategyOptions
): Promise<Response> {
  const { cacheName, cacheMatchOptions, debug } = options;

  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request, cacheMatchOptions);

    if (cachedResponse) {
      if (debug) {
        console.log(`[CacheOnly] Cache hit: ${request.url}`);
      }
      return cachedResponse;
    }

    throw new Error(`No cached response for: ${request.url}`);
  } catch (error) {
    console.error('[CacheOnly] Strategy failed:', error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if cached response is still valid
 */
async function isCacheValid(
  response: Response,
  options: StrategyOptions
): Promise<boolean> {
  const { maxAge } = options;

  if (!maxAge) {
    return true; // No expiration
  }

  // Check Date header
  const dateHeader = response.headers.get('date');
  if (!dateHeader) {
    return true; // No date header, assume valid
  }

  const cachedTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = now - cachedTime;

  return age < maxAge;
}

/**
 * Add metadata to response headers
 */

/**
 * Get cache metadata from response
 */

// ============================================================================
// STRATEGY ROUTER
// ============================================================================

/**
 * Get strategy handler by name
 */
export function getStrategyHandler(strategyName: string): StrategyHandler {
  switch (strategyName) {
    case 'CacheFirst':
      return cacheFirst;
    case 'NetworkFirst':
      return networkFirst;
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate;
    case 'NetworkOnly':
      return networkOnly;
    case 'CacheOnly':
      return cacheOnly;
    default:
      console.warn(`Unknown strategy: ${strategyName}, using NetworkFirst`);
      return networkFirst;
  }
}

/**
 * Apply cache rule to request
 */
export async function applyCacheRule(
  request: Request,
  rule: CacheRule
): Promise<Response> {
  const strategyHandler = getStrategyHandler(rule.strategy);

  const options: StrategyOptions = {
    cacheName: rule.cacheName,
    maxAge: rule.maxAge,
    maxEntries: rule.maxEntries,
    networkTimeout: rule.networkTimeout,
    debug: false, // Set to true for debugging
  };

  return strategyHandler(request, options);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Cleanup cache based on max entries
 */
export async function cleanupCache(cacheName: string, maxEntries: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();

  if (requests.length <= maxEntries) {
    return; // No cleanup needed
  }

  // Delete oldest entries
  const entriesToDelete = requests.length - maxEntries;
  const requestsToDelete = requests.slice(0, entriesToDelete);

  await Promise.all(requestsToDelete.map((request) => cache.delete(request)));

  console.log(`[Cache] Cleaned up ${entriesToDelete} entries from ${cacheName}`);
}

/**
 * Cleanup expired cache entries
 */
export async function cleanupExpiredCache(
  cacheName: string,
  maxAge: number
): Promise<void> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();

  const deletePromises = [];

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const dateHeader = response.headers.get('date');
    if (!dateHeader) continue;

    const cachedTime = new Date(dateHeader).getTime();
    const age = now - cachedTime;

    if (age > maxAge) {
      deletePromises.push(cache.delete(request));
    }
  }

  await Promise.all(deletePromises);

  if (deletePromises.length > 0) {
    console.log(`[Cache] Cleaned up ${deletePromises.length} expired entries from ${cacheName}`);
  }
}

/**
 * Precache URLs
 */
export async function precacheUrls(urls: string[], cacheName: string): Promise<void> {
  const cache = await caches.open(cacheName);

  console.log(`[Cache] Precaching ${urls.length} URLs...`);

  const cachePromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        await cache.put(url, response);
        console.log(`[Cache] Precached: ${url}`);
      }
    } catch (error) {
      console.error(`[Cache] Failed to precache ${url}:`, error);
    }
  });

  await Promise.all(cachePromises);
  console.log(`[Cache] Precaching complete`);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<number> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  console.log(`[Cache] Cleared ${cacheNames.length} caches`);
  return cacheNames.length;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(cacheName: string): Promise<{
  name: string;
  size: number;
  urls: string[];
}> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();

  return {
    name: cacheName,
    size: requests.length,
    urls: requests.map((req) => req.url),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Strategies
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,

  // Utilities
  getStrategyHandler,
  applyCacheRule,

  // Cache management
  cleanupCache,
  cleanupExpiredCache,
  precacheUrls,
  clearAllCaches,
  getCacheStats,
};
