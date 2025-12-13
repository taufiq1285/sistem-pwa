/**
 * Cache Cleaner Utility
 * Comprehensive cache clearing for complete logout
 */

import logger from "./logger";
import { clearAllCache } from "@/lib/offline/api-cache";

export interface CacheCleanupOptions {
  clearIndexedDB?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearServiceWorkerCache?: boolean;
  clearCookies?: boolean;
}

const DEFAULT_CLEANUP_OPTIONS: Required<CacheCleanupOptions> = {
  clearIndexedDB: true,
  clearLocalStorage: true,
  clearSessionStorage: true,
  clearServiceWorkerCache: true,
  clearCookies: false, // Be careful with this
};

/**
 * Clear all IndexedDB databases
 */
async function clearIndexedDB(): Promise<void> {
  try {
    if (!("indexedDB" in window)) {
      logger.warn("IndexedDB not available");
      return;
    }

    const dbList = await indexedDB.databases();
    const deletePromises = dbList.map((db) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(db.name!);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          logger.info(`Deleted IndexedDB: ${db.name}`);
          resolve();
        };
      });
    });

    await Promise.all(deletePromises);
  } catch (error) {
    logger.error("Error clearing IndexedDB:", error);
  }
}

/**
 * Clear localStorage with optional key filtering
 */
function clearLocalStorage(keysToKeep: string[] = []): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        logger.debug(`Removed from localStorage: ${key}`);
      }
    });
  } catch (error) {
    logger.error("Error clearing localStorage:", error);
  }
}

/**
 * Clear sessionStorage
 */
function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
    logger.info("Cleared sessionStorage");
  } catch (error) {
    logger.error("Error clearing sessionStorage:", error);
  }
}

/**
 * Clear Service Worker cache
 */
async function clearServiceWorkerCache(): Promise<void> {
  try {
    if (!("caches" in window)) {
      logger.warn("Cache API not available");
      return;
    }

    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) => {
      return caches.delete(cacheName).then(() => {
        logger.info(`Deleted cache: ${cacheName}`);
      });
    });

    await Promise.all(deletePromises);
  } catch (error) {
    logger.error("Error clearing service worker cache:", error);
  }
}

/**
 * Clear cookies (use with caution)
 */
function clearCookies(): void {
  try {
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name =
        eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        logger.debug(`Cleared cookie: ${name}`);
      }
    });
  } catch (error) {
    logger.error("Error clearing cookies:", error);
  }
}

/**
 * Complete cache cleanup
 * Used during logout to ensure no stale data remains
 */
export async function cleanupAllCache(
  options: CacheCleanupOptions = {},
): Promise<void> {
  const finalOptions = { ...DEFAULT_CLEANUP_OPTIONS, ...options };

  logger.info("Starting comprehensive cache cleanup...", finalOptions);

  try {
    // Run parallel tasks where possible
    const tasks: Promise<void>[] = [];

    if (finalOptions.clearIndexedDB) {
      tasks.push(clearIndexedDB());
    }

    // 🆕 Clear API cache (dosen_stats, etc)
    tasks.push(clearAllCache());

    if (finalOptions.clearLocalStorage) {
      clearLocalStorage(["theme", "lang"]); // Keep non-sensitive data
    }

    if (finalOptions.clearSessionStorage) {
      clearSessionStorage();
    }

    if (finalOptions.clearServiceWorkerCache) {
      tasks.push(clearServiceWorkerCache());
    }

    if (finalOptions.clearCookies) {
      clearCookies();
    }

    await Promise.all(tasks);

    logger.info("Cache cleanup completed successfully");
  } catch (error) {
    logger.error("Error during cache cleanup:", error);
    throw error;
  }
}

/**
 * Selective cache clear for specific databases
 */
export async function clearSpecificDatabase(dbName: string): Promise<void> {
  try {
    if (!("indexedDB" in window)) {
      logger.warn("IndexedDB not available");
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        logger.info(`Cleared IndexedDB database: ${dbName}`);
        resolve();
      };
    });
  } catch (error) {
    logger.error(`Error clearing database ${dbName}:`, error);
  }
}

/**
 * Clear specific localStorage keys
 */
export function clearLocalStorageKeys(keys: string[]): void {
  try {
    keys.forEach((key) => {
      localStorage.removeItem(key);
      logger.debug(`Removed from localStorage: ${key}`);
    });
  } catch (error) {
    logger.error("Error clearing localStorage keys:", error);
  }
}
