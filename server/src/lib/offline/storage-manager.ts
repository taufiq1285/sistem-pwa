/**
 * Storage Manager
 *
 * Purpose: Unified storage management for offline functionality
 * Priority: Critical
 * Dependencies: indexeddb, logger
 *
 * This module provides a simple interface for storage operations,
 * delegating to IndexedDB for structured data and localStorage for simple key-value pairs.
 */

import { indexedDBManager } from "./indexeddb";
import type { StoreName } from "@/types/offline.types";
import { logger } from "../utils/logger";

// Lazily resolve localStorage so tests can inject a mock before use.
function getLocalStorage(): Storage | undefined {
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage as Storage;
  }

  if (typeof global !== "undefined" && (global as any).localStorage) {
    return (global as any).localStorage as Storage;
  }

  if (typeof window !== "undefined" && (window as any).localStorage) {
    return (window as any).localStorage as Storage;
  }

  return undefined;
}

/**
 * Initialize storage systems
 * Sets up IndexedDB and verifies localStorage availability
 */
export async function initStorage(): Promise<void> {
  try {
    // Initialize IndexedDB
    await indexedDBManager.initialize();

    // Verify localStorage is available
    const ls = getLocalStorage();
    if (!ls) {
      logger.warn("localStorage is not available");
    }

    logger.info("Storage systems initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize storage:", error);
    throw error;
  }
}

/**
 * Get item from storage
 * Uses IndexedDB for structured data, localStorage for simple values
 *
 * @param key - Storage key or store name
 * @param id - Optional item ID for IndexedDB stores
 * @returns Stored value or undefined
 */
export async function getItem<T>(
  key: string | StoreName,
  id?: string
): Promise<T | undefined> {
  try {
    // If ID is provided, fetch from IndexedDB
    if (id) {
      return await indexedDBManager.read<T>(key as StoreName, id);
    }

    // Otherwise, try localStorage
    const ls = getLocalStorage();
    if (!ls) {
      logger.error(
        `Failed to get item ${key}:`,
        new Error("localStorage is not available")
      );
      return undefined;
    }

    const item = ls.getItem(key);
    if (!item) return undefined;

    try {
      return JSON.parse(item) as T;
    } catch {
      // If parsing fails, return as string
      return item as T;
    }
  } catch (error) {
    logger.error(`Failed to get item ${key}:`, error);
    return undefined;
  }
}

/**
 * Set item in storage
 * Uses localStorage for simple key-value pairs
 * For structured data, use IndexedDB methods directly
 *
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    const ls = getLocalStorage();
    if (!ls) {
      throw new Error("localStorage is not available");
    }

    ls.setItem(key, serialized);
  } catch (error) {
    logger.error(`Failed to set item ${key}:`, error);
    throw error;
  }
}

/**
 * Remove item from storage
 * Only works with localStorage keys
 * For IndexedDB, use indexedDBManager.delete() directly
 *
 * @param key - Storage key to remove
 */
export async function removeItem(key: string): Promise<void> {
  try {
    const ls = getLocalStorage();
    if (!ls) {
      throw new Error("localStorage is not available");
    }

    ls.removeItem(key);
  } catch (error) {
    logger.error(`Failed to remove item ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all storage
 * Clears both localStorage and IndexedDB
 * WARNING: This will remove ALL application data
 */
export async function clear(): Promise<void> {
  try {
    // Clear localStorage
    const ls = getLocalStorage();
    if (!ls) {
      throw new Error("localStorage is not available");
    }

    ls.clear();

    // Clear IndexedDB
    await indexedDBManager.clearAll();

    logger.info("All storage cleared");
  } catch (error) {
    logger.error("Failed to clear storage:", error);
    throw error;
  }
}

/**
 * Check if storage is available
 * @returns True if both localStorage and IndexedDB are available
 */
export function isStorageAvailable(): boolean {
  try {
    const ls = getLocalStorage();
    if (!ls) return false;

    const testKey = "__storage_test__";
    ls.setItem(testKey, "test");
    ls.removeItem(testKey);
    return indexedDBManager.isReady();
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns Object with storage usage details
 */
export async function getStorageInfo(): Promise<{
  localStorage: { used: number; available: number };
  indexedDB: { stores: string[]; totalItems: number };
}> {
  try {
    const ls = getLocalStorage();
    if (!ls) {
      throw new Error("localStorage is not available");
    }

    // Calculate localStorage usage
    let localStorageUsed = 0;
    for (const key in ls) {
      if (Object.prototype.hasOwnProperty.call(ls, key)) {
        localStorageUsed += key.length + (ls.getItem(key)?.length || 0);
      }
    }

    // Get IndexedDB info
    const dbInfo = await indexedDBManager.getDatabaseInfo();

    return {
      localStorage: {
        used: localStorageUsed,
        available: 5 * 1024 * 1024, // Typical 5MB limit
      },
      indexedDB: {
        stores: dbInfo.stores,
        totalItems: dbInfo.totalSize,
      },
    };
  } catch (error) {
    logger.error("Failed to get storage info:", error);
    throw error;
  }
}

/**
 * Export IndexedDB manager for direct access to advanced features
 */
export { indexedDBManager };
