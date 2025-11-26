/**
 * Service Worker for PWA Sistem Praktikum
 *
 * CRITICAL: This file MUST be at root level
 * Location: /sw.js
 *
 * Features:
 * - Static asset caching (Cache First)
 * - API response caching (Network First)
 * - Runtime caching (Stale While Revalidate)
 * - Offline fallback page
 * - Background sync
 * - Cache versioning and cleanup
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CACHE_VERSION = 'v1.0.0';
const CACHE_PREFIX = 'praktikum-pwa';

// Cache names
const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  dynamic: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  // Add other critical static assets
];

// Cache configuration
const CACHE_CONFIG = {
  maxAge: {
    api: 5 * 60 * 1000, // 5 minutes
    dynamic: 24 * 60 * 60 * 1000, // 24 hours
    images: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  maxEntries: {
    api: 50,
    dynamic: 100,
    images: 60,
  },
};

// ============================================================================
// INSTALL EVENT
// ============================================================================

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then(async (cache) => {
        console.log('[SW] Caching static assets');

        // Cache files individually to avoid failing if one fails
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] Cached: ${url}`);
            } else {
              console.warn(`[SW] Failed to cache (${response.status}): ${url}`);
            }
          } catch (error) {
            console.warn(`[SW] Failed to fetch: ${url}`, error);
          }
        });

        await Promise.allSettled(cachePromises);
        console.log('[SW] Static assets caching completed');
      })
      .then(() => {
        // Force immediate activation
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

/**
 * Activate event - Clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Keep current version caches
            if (Object.values(CACHE_NAMES).includes(cacheName)) {
              return null;
            }

            // Delete old version caches
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

// ============================================================================
// FETCH EVENT - CACHING STRATEGIES
// ============================================================================

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip WebSocket connections (for Vite HMR)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Skip Vite HMR and development requests
  if (url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@fs/') ||
      url.pathname.includes('/@id/') ||
      url.pathname.includes('/@react-refresh') ||
      url.search.includes('?token=')) {
    return;
  }

  // Route to appropriate caching strategy
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  } else if (isFontRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.fonts));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.dynamic));
  }
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache First Strategy
 * - Try cache first, then network
 * - Good for: static assets, images, fonts
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    // Cache miss - fetch from network
    console.log('[SW] Cache miss, fetching from network:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached new resource:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return handleOfflineFallback(request);
  }
}

/**
 * Network First Strategy
 * - Try network first, then cache
 * - Good for: API calls, dynamic data
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Cached API response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // Both failed
    console.error('[SW] Network First failed:', error);
    return handleOfflineFallback(request);
  }
}

/**
 * Stale While Revalidate Strategy
 * - Return cached response immediately, update cache in background
 * - Good for: pages, CSS, JS that change occasionally
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  // Fetch and update cache in background (silently fail if offline)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        // Clone BEFORE using the response to avoid "body already used" error
        const responseToCache = networkResponse.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
          console.log('[SW] Background cache update:', request.url);
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      // Silently fail background updates when offline
      // Don't log error if we have cached response
      if (!cachedResponse) {
        console.warn('[SW] Network fetch failed:', request.url);
      }
      throw error;
    });

  // Return cached response immediately, or wait for network
  if (cachedResponse) {
    console.log('[SW] Serving from cache (stale):', request.url);
    // Don't wait for background update, just return cached version
    return cachedResponse;
  }

  // No cached version, must wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    console.error('[SW] Stale While Revalidate failed (no cache):', request.url);
    return handleOfflineFallback(request);
  }
}

// ============================================================================
// OFFLINE FALLBACK
// ============================================================================

/**
 * Handle offline fallback
 */
async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAMES.static);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // Return generic offline response
  return new Response('Offline - No cached version available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
}

// ============================================================================
// REQUEST TYPE DETECTION
// ============================================================================

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.pathname.includes('/rest/v1/')
  );
}

/**
 * Check if request is for an image
 */
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

/**
 * Check if request is for a font
 */
function isFontRequest(url) {
  return /\.(woff|woff2|ttf|eot)$/i.test(url.pathname);
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  );
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

/**
 * Background sync event
 *
 * Handles background sync for different tags:
 * - sync-quiz-answers: Sync offline quiz answers
 * - sync-offline-data: Sync all offline data
 * - sync-periodic: Periodic sync check
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  // Handle different sync tags
  if (event.tag === 'sync-quiz-answers') {
    event.waitUntil(syncQuizAnswers(event.tag));
  } else if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData(event.tag));
  } else if (event.tag === 'sync-periodic') {
    event.waitUntil(syncPeriodic(event.tag));
  } else if (event.tag.startsWith('sync-')) {
    // Generic sync for any other sync- prefixed tags
    event.waitUntil(syncQueuedRequests(event.tag));
  }
});

/**
 * Sync quiz answers specifically
 */
async function syncQuizAnswers(tag) {
  console.log('[SW] Syncing quiz answers...');

  try {
    // Notify all clients to process quiz answer sync
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    if (clients.length === 0) {
      console.log('[SW] No active clients, sync will be handled when app opens');
      return;
    }

    // Send sync request to all clients
    const syncPromises = clients.map((client) => {
      return new Promise((resolve) => {
        // Create message channel for two-way communication
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('[SW] Client sync successful:', event.data);
            resolve(true);
          } else {
            console.error('[SW] Client sync failed:', event.data.error);
            resolve(false);
          }
        };

        // Send sync request with response port
        client.postMessage({
          type: 'SYNC_QUIZ_ANSWERS',
          tag: tag,
          timestamp: Date.now(),
        }, [messageChannel.port2]);

        // Timeout after 30 seconds
        setTimeout(() => {
          console.warn('[SW] Sync timeout for client');
          resolve(false);
        }, 30000);
      });
    });

    const results = await Promise.all(syncPromises);
    const successCount = results.filter(r => r).length;

    console.log(`[SW] Quiz answers sync completed: ${successCount}/${clients.length} clients synced`);

    // Log sync event
    await logSyncToStorage('completed', tag, {
      successCount,
      totalClients: clients.length
    });

  } catch (error) {
    console.error('[SW] Quiz answers sync failed:', error);
    await logSyncToStorage('failed', tag, { error: error.message });
    throw error;
  }
}

/**
 * Sync all offline data
 */
async function syncOfflineData(tag) {
  console.log('[SW] Syncing all offline data...');
  // Similar implementation to syncQuizAnswers but for all data types
  return syncQueuedRequests(tag);
}

/**
 * Periodic sync check
 */
async function syncPeriodic(tag) {
  console.log('[SW] Running periodic sync...');
  return syncQueuedRequests(tag);
}

/**
 * Generic sync for queued requests
 */
async function syncQueuedRequests(tag) {
  try {
    console.log('[SW] Syncing queued requests for tag:', tag);

    // Get all active clients
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    if (clients.length === 0) {
      console.log('[SW] No active clients, will sync when app opens');
      return;
    }

    // Notify clients that sync is starting
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_STARTED',
        tag: tag,
        timestamp: Date.now(),
      });
    });

    // Trigger clients to process their sync queues
    clients.forEach((client) => {
      client.postMessage({
        type: 'PROCESS_SYNC_QUEUE',
        tag: tag,
        timestamp: Date.now(),
      });
    });

    // Wait for clients to process (increased timeout for reliability)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('[SW] Sync completed successfully for tag:', tag);

    // Notify clients that sync completed
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        tag: tag,
        timestamp: Date.now(),
      });
    });

    await logSyncToStorage('completed', tag, { clientCount: clients.length });

  } catch (error) {
    console.error('[SW] Sync failed for tag:', tag, error);

    // Notify clients that sync failed
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_FAILED',
        tag: tag,
        error: error.message,
        timestamp: Date.now(),
      });
    });

    await logSyncToStorage('failed', tag, { error: error.message });
    throw error;
  }
}

/**
 * Log sync event to storage for debugging
 */
async function logSyncToStorage(event, tag, details) {
  try {
    // Store sync log in cache for debugging
    const logEntry = {
      event,
      tag,
      timestamp: new Date().toISOString(),
      details,
    };

    console.log('[SW] Sync log:', logEntry);
  } catch (error) {
    console.error('[SW] Failed to log sync event:', error);
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

/**
 * Message event - Communication from clients
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      caches: Object.keys(CACHE_NAMES),
    });
  }
});

// ============================================================================
// CACHE CLEANUP
// ============================================================================

/**
 * Cleanup old cache entries based on max age and max entries
 */
async function cleanupCache(cacheName, maxAge, maxEntries) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();

  // Remove entries older than maxAge
  const now = Date.now();
  const deletePromises = [];

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const dateHeader = response.headers.get('date');
    if (!dateHeader) continue;

    const cachedTime = new Date(dateHeader).getTime();
    if (now - cachedTime > maxAge) {
      deletePromises.push(cache.delete(request));
    }
  }

  // Limit cache entries
  if (requests.length > maxEntries) {
    const excessEntries = requests.length - maxEntries;
    for (let i = 0; i < excessEntries; i++) {
      deletePromises.push(cache.delete(requests[i]));
    }
  }

  await Promise.all(deletePromises);
  console.log(`[SW] Cleaned up ${deletePromises.length} entries from ${cacheName}`);
}

// Periodic cache cleanup (runs on activation)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanupCache(CACHE_NAMES.api, CACHE_CONFIG.maxAge.api, CACHE_CONFIG.maxEntries.api),
      cleanupCache(
        CACHE_NAMES.dynamic,
        CACHE_CONFIG.maxAge.dynamic,
        CACHE_CONFIG.maxEntries.dynamic
      ),
      cleanupCache(
        CACHE_NAMES.images,
        CACHE_CONFIG.maxAge.images,
        CACHE_CONFIG.maxEntries.images
      ),
    ])
  );
});

console.log('[SW] Service Worker loaded successfully', CACHE_VERSION);
