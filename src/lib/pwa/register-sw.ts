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

// ============================================================================
// TYPES
// ============================================================================

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
  | 'SKIP_WAITING'
  | 'CLEAR_CACHE'
  | 'GET_VERSION'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED';

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
export type SWUpdateStatus = 'checking' | 'available' | 'installing' | 'ready' | 'error';

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
export async function registerServiceWorker(config: SWConfig = {}): Promise<void> {
  const {
    swPath = '/sw.js',
    scope = '/',
    onUpdate,
    onSuccess,
    onError,
    checkUpdateInterval = 60 * 60 * 1000, // 1 hour
    enableAutoUpdate = true,
  } = config;

  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Worker not supported in this browser');
    return;
  }

  // Check if running on localhost or HTTPS
  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );

  if (!isLocalhost && window.location.protocol !== 'https:') {
    console.warn('[SW] Service Worker requires HTTPS (except on localhost)');
    return;
  }

  try {
    // Wait for page load
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    console.log('[SW] Registering service worker...');

    // Register service worker
    const registration = await navigator.serviceWorker.register(swPath, { scope });

    console.log('[SW] Service worker registered successfully:', registration);

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
      console.log('[SW] Service worker installing...');
      trackInstalling(registration.installing);
    }

    // Handle waiting worker (update available)
    if (registration.waiting) {
      console.log('[SW] New service worker waiting to activate');
      if (onUpdate) {
        onUpdate(registration);
      }
    }

    // Handle active worker
    if (registration.active) {
      console.log('[SW] Service worker active:', registration.active.state);
    }
  } catch (error) {
    console.error('[SW] Registration failed:', error);
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
  onUpdate?: (registration: ServiceWorkerRegistration) => void
): void {
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;

    if (!newWorker) return;

    console.log('[SW] Update found, installing new version...');

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker available
        console.log('[SW] New version installed, waiting to activate');

        if (onUpdate) {
          onUpdate(registration);
        }
      }

      if (newWorker.state === 'activated') {
        console.log('[SW] New version activated');
        // Reload page to use new service worker
        window.location.reload();
      }
    });
  });
}

/**
 * Setup periodic update check
 */
function setupUpdateCheck(
  registration: ServiceWorkerRegistration,
  interval: number
): void {
  // Check for updates immediately
  registration.update().catch((error) => {
    console.error('[SW] Update check failed:', error);
  });

  // Check for updates periodically
  setInterval(() => {
    console.log('[SW] Checking for updates...');
    registration.update().catch((error) => {
      console.error('[SW] Update check failed:', error);
    });
  }, interval);
}

/**
 * Track installing service worker
 */
function trackInstalling(worker: ServiceWorker): void {
  worker.addEventListener('statechange', () => {
    console.log('[SW] Service worker state changed:', worker.state);

    if (worker.state === 'installed') {
      console.log('[SW] Service worker installed');
    }

    if (worker.state === 'activated') {
      console.log('[SW] Service worker activated');
    }

    if (worker.state === 'redundant') {
      console.log('[SW] Service worker redundant');
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
  navigator.serviceWorker.addEventListener('message', (event) => {
    const message: SWMessage = event.data;

    console.log('[SW] Message received from service worker:', message);

    switch (message.type) {
      case 'SYNC_STARTED':
        console.log('[SW] Background sync started');
        dispatchSWEvent('sync-started', message);
        break;

      case 'SYNC_COMPLETED':
        console.log('[SW] Background sync completed');
        dispatchSWEvent('sync-completed', message);
        break;

      case 'SYNC_FAILED':
        console.error('[SW] Background sync failed:', message.data);
        dispatchSWEvent('sync-failed', message);
        break;

      default:
        console.log('[SW] Unknown message type:', message.type);
    }
  });
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: SWMessage): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    console.warn('[SW] No active service worker controller');
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    ...message,
    timestamp: Date.now(),
  });

  console.log('[SW] Message sent to service worker:', message);
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
    console.warn('[SW] No waiting service worker to skip');
    return;
  }

  console.log('[SW] Skipping waiting...');

  await sendMessageToSW({ type: 'SKIP_WAITING' });

  // Wait for controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Controller changed, reloading page...');
    window.location.reload();
  });
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  console.log('[SW] Clearing all caches...');

  await sendMessageToSW({ type: 'CLEAR_CACHE' });

  // Also clear caches directly
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log(`[SW] Cleared ${cacheNames.length} caches`);
  }
}

/**
 * Get service worker version
 */
export async function getSWVersion(): Promise<{ version: string; caches: string[] } | null> {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
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
    console.warn('[SW] No service worker registration found');
    return false;
  }

  console.log('[SW] Unregistering service worker...');

  const success = await registration.unregister();

  if (success) {
    console.log('[SW] Service worker unregistered successfully');
    await clearAllCaches();
  } else {
    console.error('[SW] Failed to unregister service worker');
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
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return !!registration && !!registration.active;
}

/**
 * Get current service worker registration
 */
export async function getCurrentRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return registration || null;
}

/**
 * Wait for service worker to be ready
 */
export async function waitForServiceWorker(timeout = 10000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Service worker timeout')), timeout);
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
export function onUpdateAvailable(callback: (registration: ServiceWorkerRegistration) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ registration: ServiceWorkerRegistration }>;
    callback(customEvent.detail.registration);
  };

  window.addEventListener('sw-update-available', handler);

  return () => {
    window.removeEventListener('sw-update-available', handler);
  };
}

/**
 * Listen for SW update installed
 */
export function onUpdateInstalled(callback: () => void): () => void {
  window.addEventListener('sw-update-installed', callback);

  return () => {
    window.removeEventListener('sw-update-installed', callback);
  };
}

/**
 * Listen for sync events
 */
export function onSync(
  event: 'started' | 'completed' | 'failed',
  callback: (message: SWMessage) => void
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
