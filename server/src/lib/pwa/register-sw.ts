/**
 * Service Worker Registration
 *
 * Handles service worker registration, updates, and lifecycle events
 *
 * Features:
 * - Automatic registration
 * - Update detection and notification
 * - SW lifecycle event handling
 * - Client messaging
 * - Error handling
 */

import { logger } from "@/lib/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

// Flag to prevent multiple reloads
let isReloading = false;

/**
 * Service Worker registration configuration
 */
export interface SWConfig {
  swPath?: string;
  scope?: string;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  checkUpdateInterval?: number; // in milliseconds
  enableAutoUpdate?: boolean;
}

/**
 * SW message types
 */
export type SWMessageType =
  | "SKIP_WAITING"
  | "CLEAR_CACHE"
  | "GET_VERSION"
  | "SYNC_STARTED"
  | "SYNC_COMPLETED"
  | "SYNC_FAILED";

/**
 * SW message
 */
export interface SWMessage {
  type: SWMessageType;
  data?: unknown;
  timestamp?: number;
}

/**
 * SW update status
 */
export type SWUpdateStatus =
  | "checking"
  | "available"
  | "installing"
  | "ready"
  | "error";

/**
 * SW update event
 */
export interface SWUpdateEvent {
  status: SWUpdateStatus;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register service worker
 */
export async function registerServiceWorker(
  config: SWConfig = {},
): Promise<void> {
  const {
    swPath = "/sw.js",
    scope = "/",
    onUpdate,
    onSuccess,
    onError,
    checkUpdateInterval = 60 * 60 * 1000, // 1 hour
    enableAutoUpdate = true,
  } = config;

  // Check if service worker is supported
  if (!("serviceWorker" in navigator)) {
    logger.warn("[SW] Service Worker not supported in this browser");
    return;
  }

  // Check if running on localhost or HTTPS
  const isLocalhost = Boolean(
    window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
    ),
  );

  if (!isLocalhost && window.location.protocol !== "https:") {
    logger.warn("[SW] Service Worker requires HTTPS (except on localhost)");
    return;
  }

  try {
    // Wait for page load
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve);
      });
    }

    logger.info("[SW] Registering service worker...");

    // Register service worker
    const registration = await navigator.serviceWorker.register(swPath, {
      scope,
    });

    logger.info("[SW] Service worker registered successfully:", registration);

    // Setup update listeners
    setupUpdateListeners(registration, onUpdate);

    // Setup message listeners
    setupMessageListeners();

    // Check for updates periodically
    if (enableAutoUpdate) {
      setupUpdateCheck(registration, checkUpdateInterval);
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(registration);
    }

    // Handle initial installation
    if (registration.installing) {
      logger.info("[SW] Service worker installing...");
      trackInstalling(registration.installing);
    }

    // Handle waiting worker (update available)
    if (registration.waiting) {
      logger.info("[SW] New service worker waiting to activate");
      if (onUpdate) {
        onUpdate(registration);
      }
    }

    // Handle active worker
    if (registration.active) {
      logger.info("[SW] Service worker active:", registration.active.state);
    }
  } catch (error) {
    logger.error("[SW] Registration failed:", error);
    if (onError) {
      onError(error as Error);
    }
  }
}

// ============================================================================
// UPDATE DETECTION
// ============================================================================

/**
 * Setup update listeners
 */
function setupUpdateListeners(
  registration: ServiceWorkerRegistration,
  onUpdate?: (registration: ServiceWorkerRegistration) => void,
): void {
  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;

    if (!newWorker) return;

    logger.info("[SW] Update found, installing new version...");

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        // New service worker available
        logger.info("[SW] New version installed, waiting to activate");

        if (onUpdate) {
          onUpdate(registration);
        }
      }

      if (newWorker.state === "activated") {
        logger.info("[SW] New version activated");
        // Don't auto-reload here - let the controllerchange event handle it
        // This prevents update loops
      }
    });
  });
}

/**
 * Setup periodic update check
 */
function setupUpdateCheck(
  registration: ServiceWorkerRegistration,
  interval: number,
): void {
  // Check for updates immediately
  registration.update().catch((error) => {
    logger.error("[SW] Update check failed:", error);
  });

  // Check for updates periodically
  setInterval(() => {
    logger.info("[SW] Checking for updates...");
    registration.update().catch((error) => {
      logger.error("[SW] Update check failed:", error);
    });
  }, interval);
}

/**
 * Track installing service worker
 */
function trackInstalling(worker: ServiceWorker): void {
  worker.addEventListener("statechange", () => {
    logger.info("[SW] Service worker state changed:", worker.state);

    if (worker.state === "installed") {
      logger.info("[SW] Service worker installed");
    }

    if (worker.state === "activated") {
      logger.info("[SW] Service worker activated");
    }

    if (worker.state === "redundant") {
      logger.info("[SW] Service worker redundant");
    }
  });
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Setup message listeners from service worker
 */
function setupMessageListeners(): void {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const message: SWMessage = event.data;

    logger.info("[SW] Message received from service worker:", message);

    switch (message.type) {
      case "SYNC_STARTED":
        logger.info("[SW] Background sync started");
        dispatchSWEvent("sync-started", message);
        break;

      case "SYNC_COMPLETED":
        logger.info("[SW] Background sync completed");
        dispatchSWEvent("sync-completed", message);
        break;

      case "SYNC_FAILED":
        logger.error("[SW] Background sync failed:", message.data);
        dispatchSWEvent("sync-failed", message);
        break;

      default:
        logger.info("[SW] Unknown message type:", message.type);
    }
  });
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: SWMessage): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    logger.warn("[SW] No active service worker controller");
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    ...message,
    timestamp: Date.now(),
  });

  logger.info("[SW] Message sent to service worker:", message);
}

/**
 * Dispatch custom event for SW messages
 */
function dispatchSWEvent(type: string, message: SWMessage): void {
  const event = new CustomEvent(`sw-${type}`, {
    detail: message,
  });
  window.dispatchEvent(event);
}

// ============================================================================
// SW CONTROL
// ============================================================================

/**
 * Skip waiting and activate new service worker immediately
 */
export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration || !registration.waiting) {
    logger.warn("[SW] No waiting service worker to skip");
    return;
  }

  logger.info("[SW] Skipping waiting...");

  await sendMessageToSW({ type: "SKIP_WAITING" });

  // Wait for controller change (only reload once)
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      if (!isReloading) {
        isReloading = true;
        logger.info("[SW] Controller changed, reloading page...");
        window.location.reload();
      }
    },
    { once: true },
  ); // Only trigger once
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  logger.info("[SW] Clearing all caches...");

  await sendMessageToSW({ type: "CLEAR_CACHE" });

  // Also clear caches directly
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    logger.info(`[SW] Cleared ${cacheNames.length} caches`);
  }
}

/**
 * Get service worker version
 */
export async function getSWVersion(): Promise<{
  version: string;
  caches: string[];
} | null> {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [
        messageChannel.port2,
      ]);
    } else {
      resolve(null);
    }
  });
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    logger.warn("[SW] No service worker registration found");
    return false;
  }

  logger.info("[SW] Unregistering service worker...");

  const success = await registration.unregister();

  if (success) {
    logger.info("[SW] Service worker unregistered successfully");
    await clearAllCaches();
  } else {
    logger.error("[SW] Failed to unregister service worker");
  }

  return success;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if service worker is ready
 */
export async function isServiceWorkerReady(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration && !!registration.active;
}

/**
 * Get current service worker registration
 */
export async function getCurrentRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return registration || null;
}

/**
 * Wait for service worker to be ready
 */
export async function waitForServiceWorker(
  timeout = 10000,
): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Service worker timeout")), timeout);
    }),
  ]);
}

/**
 * Check if page is controlled by service worker
 */
export function isControlled(): boolean {
  return !!navigator.serviceWorker.controller;
}

// ============================================================================
// LIFECYCLE HELPERS
// ============================================================================

/**
 * Listen for SW update available
 */
export function onUpdateAvailable(
  callback: (registration: ServiceWorkerRegistration) => void,
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{
      registration: ServiceWorkerRegistration;
    }>;
    callback(customEvent.detail.registration);
  };

  window.addEventListener("sw-update-available", handler);

  return () => {
    window.removeEventListener("sw-update-available", handler);
  };
}

/**
 * Listen for SW update installed
 */
export function onUpdateInstalled(callback: () => void): () => void {
  window.addEventListener("sw-update-installed", callback);

  return () => {
    window.removeEventListener("sw-update-installed", callback);
  };
}

/**
 * Listen for sync events
 */
export function onSync(
  event: "started" | "completed" | "failed",
  callback: (message: SWMessage) => void,
): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<SWMessage>;
    callback(customEvent.detail);
  };

  window.addEventListener(`sw-sync-${event}`, handler);

  return () => {
    window.removeEventListener(`sw-sync-${event}`, handler);
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  register: registerServiceWorker,
  skipWaiting,
  clearAllCaches,
  getSWVersion,
  unregister: unregisterServiceWorker,
  isReady: isServiceWorkerReady,
  getRegistration: getCurrentRegistration,
  waitForServiceWorker,
  isControlled,
  onUpdateAvailable,
  onUpdateInstalled,
  onSync,
  sendMessage: sendMessageToSW,
};
