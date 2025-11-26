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

import { indexedDBManager } from './indexeddb';
import type { StoreName } from '@/types/offline.types';
import { logger } from '@/lib/utils/logger';

/**
 * Initialize storage systems
 * Sets up IndexedDB and verifies localStorage availability
 */
export async function initStorage(): Promise<void> {
  try {
    // Initialize IndexedDB
    await indexedDBManager.initialize();

    // Verify localStorage is available
    if (typeof localStorage === 'undefined') {
      logger.warn('localStorage is not available');
    }

    logger.info('Storage systems initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize storage:', error);
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
    const item = localStorage.getItem(key);
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
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
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
    localStorage.removeItem(key);
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
    localStorage.clear();

    // Clear IndexedDB
    await indexedDBManager.clearAll();

    logger.info('All storage cleared');
  } catch (error) {
    logger.error('Failed to clear storage:', error);
    throw error;
  }
}

/**
 * Check if storage is available
 * @returns True if both localStorage and IndexedDB are available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
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
    // Calculate localStorage usage
    let localStorageUsed = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        localStorageUsed += key.length + (localStorage.getItem(key)?.length || 0);
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
    logger.error('Failed to get storage info:', error);
    throw error;
  }
}

/**
 * Export IndexedDB manager for direct access to advanced features
 */
export { indexedDBManager };
