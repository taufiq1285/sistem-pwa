/**
 * Background Sync API Integration
 *
 * Automatically syncs offline data when connectivity is restored.
 * Falls back to manual sync if Background Sync API is not supported.
 *
 * Browser Support:
 * - ✅ Chrome/Edge 49+
 * - ✅ Opera 36+
 * - ❌ Safari (fallback to manual sync)
 * - ❌ Firefox (fallback to manual sync)
 */

// Type declarations for Background Sync API
declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
}

// Sync tag constants
export const SYNC_TAGS = {
  QUIZ_ANSWERS: "sync-quiz-answers",
  OFFLINE_DATA: "sync-offline-data",
  PERIODIC: "sync-periodic",
} as const;

export type SyncTag = (typeof SYNC_TAGS)[keyof typeof SYNC_TAGS];

// Background Sync status
export interface BackgroundSyncStatus {
  supported: boolean;
  registered: boolean;
  lastSync: Date | null;
  pendingTags: string[];
}

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "serviceWorker" in navigator &&
    "SyncManager" in window &&
    "sync" in ServiceWorkerRegistration.prototype
  );
}

/**
 * Register a background sync
 *
 * @param tag - Unique identifier for this sync operation
 * @returns Promise that resolves when registration succeeds
 *
 * @example
 * ```ts
 * // Register sync when user submits quiz offline
 * await registerBackgroundSync(SYNC_TAGS.QUIZ_ANSWERS);
 * ```
 */
export async function registerBackgroundSync(tag: SyncTag): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    console.warn("[BackgroundSync] Not supported, will use manual sync");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);

    console.log(`[BackgroundSync] Registered: ${tag}`);

    // Store registration info
    localStorage.setItem(
      "last_sync_registration",
      JSON.stringify({
        tag,
        timestamp: new Date().toISOString(),
      }),
    );

    return true;
  } catch (error) {
    console.error("[BackgroundSync] Registration failed:", error);
    return false;
  }
}

/**
 * Get list of pending sync tags
 *
 * Note: This API is limited and may not return all pending tags
 */
export async function getPendingSyncTags(): Promise<string[]> {
  if (!isBackgroundSyncSupported()) {
    return [];
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // getTags() is available in some browsers
    const tags = await registration.sync.getTags();
    return tags;
  } catch (error) {
    console.error("[BackgroundSync] Failed to get pending tags:", error);
    return [];
  }
}

/**
 * Get background sync status
 */
export async function getBackgroundSyncStatus(): Promise<BackgroundSyncStatus> {
  const supported = isBackgroundSyncSupported();

  let lastSync: Date | null = null;
  try {
    const lastSyncData = localStorage.getItem("last_sync_registration");
    if (lastSyncData) {
      const parsed = JSON.parse(lastSyncData);
      lastSync = new Date(parsed.timestamp);
    }
  } catch (error) {
    console.error("[BackgroundSync] Failed to parse last sync data:", error);
  }

  const pendingTags = supported ? await getPendingSyncTags() : [];

  return {
    supported,
    registered: pendingTags.length > 0,
    lastSync,
    pendingTags,
  };
}

/**
 * Fallback: Manual sync function
 *
 * Used when Background Sync API is not available.
 * Should be called manually when network is restored.
 */
export async function fallbackManualSync(
  syncFunction: () => Promise<void>,
): Promise<void> {
  try {
    console.log("[BackgroundSync] Using fallback manual sync");
    await syncFunction();
    console.log("[BackgroundSync] Manual sync completed");
  } catch (error) {
    console.error("[BackgroundSync] Manual sync failed:", error);
    throw error;
  }
}

/**
 * Smart sync: Use Background Sync if available, otherwise manual sync
 *
 * @param tag - Sync tag for Background Sync
 * @param syncFunction - Function to call for manual sync fallback
 *
 * @example
 * ```ts
 * import { smartSync, SYNC_TAGS } from '@/lib/pwa/background-sync';
 * import { syncOfflineAnswers } from '@/lib/api/kuis.api';
 *
 * // Attempt background sync, fallback to manual
 * await smartSync(
 *   SYNC_TAGS.QUIZ_ANSWERS,
 *   () => syncOfflineAnswers(attemptId)
 * );
 * ```
 */
export async function smartSync(
  tag: SyncTag,
  syncFunction: () => Promise<void>,
): Promise<{ method: "background" | "manual"; success: boolean }> {
  const supported = isBackgroundSyncSupported();

  if (supported) {
    const registered = await registerBackgroundSync(tag);

    if (registered) {
      return { method: "background", success: true };
    }
  }

  // Fallback to manual sync
  try {
    await fallbackManualSync(syncFunction);
    return { method: "manual", success: true };
  } catch (error) {
    console.error("[BackgroundSync] Smart sync failed:", error);
    return { method: "manual", success: false };
  }
}

/**
 * Setup online event listener for manual sync fallback
 *
 * Call this once during app initialization to enable
 * automatic fallback sync when connection is restored.
 *
 * @param syncFunction - Function to call when online
 *
 * @example
 * ```ts
 * // In your app initialization (main.tsx or App.tsx)
 * setupOnlineSync(() => {
 *   console.log('Back online, syncing...');
 *   return syncAllOfflineData();
 * });
 * ```
 */
export function setupOnlineSync(syncFunction: () => Promise<void>): () => void {
  if (!isBackgroundSyncSupported()) {
    console.log("[BackgroundSync] Setting up fallback online listener");

    const handleOnline = async () => {
      console.log(
        "[BackgroundSync] Connection restored, triggering fallback sync",
      );

      // Small delay to ensure connection is stable
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await syncFunction();
        console.log("[BackgroundSync] Fallback sync completed successfully");
      } catch (error) {
        console.error("[BackgroundSync] Fallback sync failed:", error);
      }
    };

    window.addEventListener("online", handleOnline);

    // Return cleanup function
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }

  console.log("[BackgroundSync] Using native Background Sync API");

  // Return no-op cleanup for consistency
  return () => {};
}

/**
 * Check if a sync is currently pending
 */
export async function hasPendingSync(tag?: SyncTag): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    // For fallback, check localStorage for pending data
    try {
      const hasOfflineData = localStorage.getItem("offline_quiz_answers");
      return hasOfflineData !== null;
    } catch {
      return false;
    }
  }

  const pendingTags = await getPendingSyncTags();

  if (tag) {
    return pendingTags.includes(tag);
  }

  return pendingTags.length > 0;
}

/**
 * Log sync event for debugging
 */
export function logSyncEvent(
  event: "registered" | "completed" | "failed",
  tag: string,
  details?: unknown,
): void {
  const logEntry = {
    event,
    tag,
    timestamp: new Date().toISOString(),
    details,
  };

  console.log("[BackgroundSync]", logEntry);

  // Store in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem("sync_logs") || "[]");
    logs.push(logEntry);

    // Keep last 50 logs
    if (logs.length > 50) {
      logs.shift();
    }

    localStorage.setItem("sync_logs", JSON.stringify(logs));
  } catch (error) {
    console.error("[BackgroundSync] Failed to store log:", error);
  }
}

/**
 * Get sync logs for debugging
 */
export function getSyncLogs(): Array<{
  event: string;
  tag: string;
  timestamp: string;
  details?: unknown;
}> {
  try {
    return JSON.parse(localStorage.getItem("sync_logs") || "[]");
  } catch {
    return [];
  }
}

/**
 * Clear sync logs
 */
export function clearSyncLogs(): void {
  localStorage.removeItem("sync_logs");
}
