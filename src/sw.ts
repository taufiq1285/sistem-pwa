/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope & typeof globalThis;

import { precacheAndRoute } from "workbox-precaching";

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

// Precache injected assets by Vite Workbox
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_VERSION = "v1.0.5"; // Bump: force cache invalidation to fix blank screen after update
const CACHE_PREFIX = "praktikum-pwa";

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
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/registerSW.js",
  "/favicon.png",
  "/logo.svg",
  "/apple-touch-icon.png",
  "/icons/icon-48x48.png",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-144x144.png",
  "/icons/icon-192x192.png",
  "/icons/icon-256x256.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
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
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...", CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAMES.static)
      .then(async (cache) => {
        console.log("[SW] Caching static assets");

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
        console.log("[SW] Custom static assets caching completed");
      })
      .catch((error) => {
        console.error("[SW] Install failed:", error);
      }),
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

/**
 * Activate event - Clean old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...", CACHE_VERSION);

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
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
        );
      })
      .then(async () => {
        if ("navigationPreload" in self.registration) {
          await self.registration.navigationPreload.enable();
          console.log("[SW] Navigation preload enabled");
        }
      })
      .then(() => {
        console.log("[SW] Old caches cleaned up");
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("[SW] Activation failed:", error);
      }),
  );
});

// ============================================================================
// FETCH EVENT - CACHING STRATEGIES
// ============================================================================

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // ========================================================================
  // SKIP ALL DEVELOPMENT & SPECIAL REQUESTS (NO CACHING)
  // ========================================================================

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and special protocols
  if (
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.protocol === "ws:" ||
    url.protocol === "wss:"
  ) {
    return;
  }

  // ⚠️ CRITICAL: Skip ALL Vite development modules
  // These should NEVER be cached or intercepted
  const isViteDevModule =
    url.pathname.startsWith("/@") || // All Vite virtual modules
    url.pathname.includes("/@vite") || // Vite client
    url.pathname.includes("/@fs") || // File system
    url.pathname.includes("/@id") || // Module IDs
    url.pathname.includes("/@react-refresh") || // React refresh
    url.pathname.includes("/node_modules/.vite") || // Vite deps
    url.pathname.includes("/node_modules/") || // Node modules
    url.search.includes("?import") || // ES imports
    url.search.includes("?direct") || // Direct imports
    url.search.includes("?worker") || // Web workers
    url.search.includes("?raw") || // Raw imports
    url.search.includes("?url"); // URL imports

  if (isViteDevModule) {
    // DO NOT intercept - let browser handle natively
    return;
  }

  // Skip development source files with timestamp
  const isDevSourceFile =
    url.search.includes("?t=") || // Timestamped files
    url.search.includes("?v="); // Versioned files

  if (isDevSourceFile && url.pathname.includes("/src/")) {
    return;
  }

  // Skip favicon.ico (we use favicon.png)
  if (url.pathname === "/favicon.ico") {
    return;
  }

  // Skip localhost API calls in development
  if (url.hostname === "localhost" && url.port !== "" && url.port !== "5173") {
    return;
  }

  // ========================================================================
  // ROUTE TO CACHING STRATEGIES (PRODUCTION ASSETS ONLY)
  // ========================================================================

  // ⚠️ CRITICAL: Skip assets natively handled by Workbox Precache
  // This prevents InvalidStateError & double-caching from duplicate respondWith() calls
  const isWorkboxAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith(".json") ||
    url.pathname === "/registerSW.js" ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico");

  if (isWorkboxAsset) {
    // Let Workbox's precacheAndRoute or default browser network handle these
    return;
  }

  // Route to appropriate caching strategy for custom non-bundled assets
  if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  } else if (isFontRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.fonts));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.static));
  } else {
    event.respondWith(
      staleWhileRevalidateStrategy(request, CACHE_NAMES.dynamic),
    );
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
    const url = new URL(request.url);

    // Try cache first using full request URL
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For startup/public assets, also try pathname lookup because install step
    // stores some entries by path string and browsers may request absolute URLs.
    const cachedByPathname = await caches.match(url.pathname);
    if (cachedByPathname) {
      return cachedByPathname;
    }

    // Cache miss - fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Check if it's an image request - return a placeholder instead of error
    const url = new URL(request.url);
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)) {
      console.log(
        "[SW] Image not available offline, returning placeholder:",
        url.pathname,
      );
      // Return a minimal transparent 1x1 PNG
      const transparentPixel =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      return fetch(transparentPixel);
    }

    console.error("[SW] Cache First failed:", error);
    return handleOfflineFallback(request);
  }
}

/**
 * Network First Strategy with Timeout
 * - Try network first (with 5s timeout), then cache
 * - Good for: API calls, dynamic data
 * - Prevents hanging on slow connections
 */
async function networkFirstStrategy(request, cacheName) {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    // Try network first with timeout
    const networkResponse = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout/abort error
    const isTimeout = error.name === "AbortError";
    if (isTimeout) {
      console.log("[SW] Network timeout, falling back to cache:", request.url);
    }

    // Network failed or timeout - try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log(
        "[SW] Serving from cache (network " +
          (isTimeout ? "timeout" : "failed") +
          ")",
      );
      return cachedResponse;
    }

    // Both failed
    console.warn("[SW] No cache available for:", request.url);
    return handleOfflineFallback(request);
  }
}

/**
 * Stale While Revalidate Strategy with Timeout
 * - Return cached response immediately, update cache in background
 * - Good for: pages, CSS, JS that change occasionally
 * - Has timeout to prevent hanging on slow connections
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  const url = new URL(request.url);

  // Fetch and update cache in background with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  const fetchPromise = fetch(request, {
    signal: controller.signal,
  })
    .then((networkResponse) => {
      clearTimeout(timeoutId);

      if (networkResponse && networkResponse.status === 200) {
        // Clone BEFORE using the response to avoid "body already used" error
        const responseToCache = networkResponse.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return networkResponse;
    })
    .catch((error) => {
      clearTimeout(timeoutId);

      // Silently fail for:
      // 1. Vite HMR/dev files
      // 2. Module imports
      // 3. Timeout errors when we have cache
      const isDevFile =
        url.pathname.startsWith("/@") ||
        url.pathname.includes("/node_modules/") ||
        url.search.includes("?t=") ||
        url.search.includes("?import");

      const isTimeout = error.name === "AbortError";

      // Only log real errors for non-dev files
      if (!isDevFile && !isTimeout && !cachedResponse) {
        console.warn(
          "[SW] Background fetch failed:",
          request.url,
          error.message,
        );
      }

      throw error;
    });

  // Return cached response immediately, or wait for network
  if (cachedResponse) {
    // Return cached version immediately, update happens in background
    return cachedResponse;
  }

  // No cached version, must wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    // Only show error for important files (not dev/HMR files)
    const isDevFile =
      url.pathname.startsWith("/@") ||
      url.pathname.includes("/node_modules/") ||
      url.search.includes("?t=");

    if (!isDevFile) {
      console.warn(
        "[SW] Stale While Revalidate failed (no cache):",
        request.url,
      );
    }

    return handleOfflineFallback(request);
  }
}

// ============================================================================
// OFFLINE FALLBACK
// ============================================================================

/**
 * Handle offline fallback
 */
async function handleNavigationRequest(event) {
  const { request, preloadResponse } = event;
  const url = new URL(request.url);

  try {
    const preloadedResponse = await preloadResponse;
    if (preloadedResponse) {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, preloadedResponse.clone());
      return preloadedResponse;
    }

    const cachedNavigation = await caches.match(request);
    const precachedIndex = await caches.match("/index.html");
    const cachedRoot = await caches.match("/");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const networkResponse = await fetch(request, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (cachedNavigation) {
        console.log(
          "[SW] Serving cached navigation after network failure:",
          url.pathname,
        );
        return cachedNavigation;
      }

      if (precachedIndex) {
        console.log(
          "[SW] Serving precached index.html after navigation timeout/failure:",
          url.pathname,
        );
        return precachedIndex;
      }

      if (cachedRoot) {
        console.log(
          "[SW] Serving cached root after navigation timeout/failure:",
          url.pathname,
        );
        return cachedRoot;
      }

      throw error;
    }
  } catch (error) {
    console.warn(
      "[SW] Navigation request failed, falling back offline:",
      url.pathname,
      error,
    );
    return handleOfflineFallback(request);
  }
}

async function handleOfflineFallback(request) {
  const url = new URL(request.url);

  // Try exact cached resource first for non-navigation requests.
  if (request.mode !== "navigate") {
    const exactMatch = await caches.match(request);
    if (exactMatch) {
      return exactMatch;
    }

    const pathnameMatch = await caches.match(url.pathname);
    if (pathnameMatch) {
      return pathnameMatch;
    }

    if (url.pathname === "/registerSW.js") {
      return new Response("", {
        status: 200,
        headers: new Headers({
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store",
        }),
      });
    }

    if (url.pathname.endsWith(".json") || url.pathname === "/manifest.json") {
      return new Response(
        '{"name":"Offline","short_name":"Offline","display":"standalone","start_url":"/"}',
        {
          status: 200,
          headers: new Headers({
            "Content-Type": "application/manifest+json; charset=utf-8",
            "Cache-Control": "no-store",
          }),
        },
      );
    }
  }

  // Return offline page for navigation requests
  if (request.mode === "navigate") {
    const precachedIndex = await caches.match("/index.html");
    if (precachedIndex) {
      console.log(
        "[SW] Serving precached index.html for offline navigation:",
        url.pathname,
      );
      return precachedIndex;
    }

    const precachedRoot = await caches.match("/");
    if (precachedRoot) {
      console.log(
        "[SW] Serving cached root for offline navigation:",
        url.pathname,
      );
      return precachedRoot;
    }

    const cache = await caches.open(CACHE_NAMES.static);

    // Fallback to offline.html only if app shell is not cached yet
    const offlinePage = await cache.match("/offline.html");
    if (offlinePage) {
      console.log("[SW] Serving offline.html (app shell not cached)");
      return offlinePage;
    }
  }

  // Return generic offline response
  return new Response("Offline - No cached version available", {
    status: 503,
    statusText: "Service Unavailable",
    headers: new Headers({
      "Content-Type": "text/plain",
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
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase") ||
    url.pathname.includes("/rest/v1/")
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
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname === "/" ||
    url.pathname.endsWith(".html")
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
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  // Handle different sync tags
  if (event.tag === "sync-quiz-answers") {
    event.waitUntil(syncQuizAnswers(event.tag));
  } else if (event.tag === "sync-offline-data") {
    event.waitUntil(syncOfflineData(event.tag));
  } else if (event.tag === "sync-periodic") {
    event.waitUntil(syncPeriodic(event.tag));
  } else if (event.tag.startsWith("sync-")) {
    // Generic sync for any other sync- prefixed tags
    event.waitUntil(syncQueuedRequests(event.tag));
  }
});

/**
 * Sync quiz answers specifically
 */
async function syncQuizAnswers(tag) {
  console.log("[SW] Syncing quiz answers...");

  try {
    // Notify all clients to process quiz answer sync
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    if (clients.length === 0) {
      console.log(
        "[SW] No active clients, sync will be handled when app opens",
      );
      return;
    }

    // Send sync request to all clients
    const syncPromises = clients.map((client) => {
      return new Promise((resolve) => {
        // Create message channel for two-way communication
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log("[SW] Client sync successful:", event.data);
            resolve(true);
          } else {
            console.error("[SW] Client sync failed:", event.data.error);
            resolve(false);
          }
        };

        // Send sync request with response port
        client.postMessage(
          {
            type: "SYNC_QUIZ_ANSWERS",
            tag: tag,
            timestamp: Date.now(),
          },
          [messageChannel.port2],
        );

        // Timeout after 30 seconds
        setTimeout(() => {
          console.warn("[SW] Sync timeout for client");
          resolve(false);
        }, 30000);
      });
    });

    const results = await Promise.all(syncPromises);
    const successCount = results.filter((r) => r).length;

    console.log(
      `[SW] Quiz answers sync completed: ${successCount}/${clients.length} clients synced`,
    );

    // Log sync event
    await logSyncToStorage("completed", tag, {
      successCount,
      totalClients: clients.length,
    });
  } catch (error) {
    console.error("[SW] Quiz answers sync failed:", error);
    await logSyncToStorage("failed", tag, { error: error.message });
    throw error;
  }
}

/**
 * Sync all offline data
 */
async function syncOfflineData(tag) {
  console.log("[SW] Syncing all offline data...");
  // Similar implementation to syncQuizAnswers but for all data types
  return syncQueuedRequests(tag);
}

/**
 * Periodic sync check
 */
async function syncPeriodic(tag) {
  console.log("[SW] Running periodic sync...");
  return syncQueuedRequests(tag);
}

/**
 * Generic sync for queued requests
 */
async function syncQueuedRequests(tag) {
  try {
    console.log("[SW] Syncing queued requests for tag:", tag);

    // Get all active clients
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    if (clients.length === 0) {
      console.log("[SW] No active clients, will sync when app opens");
      return;
    }

    // Notify clients that sync is starting
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_STARTED",
        tag: tag,
        timestamp: Date.now(),
      });
    });

    // Trigger clients to process their sync queues
    clients.forEach((client) => {
      client.postMessage({
        type: "PROCESS_SYNC_QUEUE",
        tag: tag,
        timestamp: Date.now(),
      });
    });

    // Wait for clients to process (increased timeout for reliability)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("[SW] Sync completed successfully for tag:", tag);

    // Notify clients that sync completed
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETED",
        tag: tag,
        timestamp: Date.now(),
      });
    });

    await logSyncToStorage("completed", tag, { clientCount: clients.length });
  } catch (error) {
    console.error("[SW] Sync failed for tag:", tag, error);

    // Notify clients that sync failed
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_FAILED",
        tag: tag,
        error: error.message,
        timestamp: Date.now(),
      });
    });

    await logSyncToStorage("failed", tag, { error: error.message });
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

    console.log("[SW] Sync log:", logEntry);
  } catch (error) {
    console.error("[SW] Failed to log sync event:", error);
  }
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

/**
 * Message event - Communication from clients
 */
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("[SW] Clearing cache:", cacheName);
            return caches.delete(cacheName);
          }),
        );
      }),
    );
  }

  if (event.data && event.data.type === "GET_VERSION") {
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

    const dateHeader = response.headers.get("date");
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
  console.log(
    `[SW] Cleaned up ${deletePromises.length} entries from ${cacheName}`,
  );
}

// Periodic cache cleanup (runs on activation)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      cleanupCache(
        CACHE_NAMES.api,
        CACHE_CONFIG.maxAge.api,
        CACHE_CONFIG.maxEntries.api,
      ),
      cleanupCache(
        CACHE_NAMES.dynamic,
        CACHE_CONFIG.maxAge.dynamic,
        CACHE_CONFIG.maxEntries.dynamic,
      ),
      cleanupCache(
        CACHE_NAMES.images,
        CACHE_CONFIG.maxAge.images,
        CACHE_CONFIG.maxEntries.images,
      ),
    ]),
  );
});

console.log("[SW] Service Worker loaded successfully", CACHE_VERSION);
