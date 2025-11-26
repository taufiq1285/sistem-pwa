/**
 * useOffline Hook
 *
 * React hook that combines network status and IndexedDB functionality
 * for offline-first development
 */

import { useCallback, useMemo } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { indexedDBManager } from '../offline/indexeddb';
import type { StoreName } from '@/types/offline.types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseOfflineReturn {
  /** Whether the app is online */
  isOnline: boolean;
  /** Whether the app is offline */
  isOffline: boolean;
  /** Whether the network is unstable */
  isUnstable: boolean;
  /** Network status */
  status: 'online' | 'offline' | 'unstable';
  /** Save data for offline use */
  saveOffline: <T extends { id: string }>(
    storeName: StoreName,
    data: T
  ) => Promise<void>;
  /** Get offline data */
  getOffline: <T>(storeName: StoreName, id: string) => Promise<T | undefined>;
  /** Get all offline data from a store */
  getAllOffline: <T>(storeName: StoreName) => Promise<T[]>;
  /** Delete offline data */
  deleteOffline: (storeName: StoreName, id: string) => Promise<void>;
  /** Network quality metrics */
  quality?: {
    latency: number;
    downlink: number;
    effectiveType: string;
    saveData: boolean;
    rtt: number;
  };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for offline-first functionality
 *
 * @returns Offline helpers and network status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOffline, saveOffline, getOffline } = useOffline();
 *
 *   const handleSave = async (data) => {
 *     if (isOffline) {
 *       await saveOffline('kuis', data);
 *     } else {
 *       await api.save(data);
 *     }
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useOffline(): UseOfflineReturn {
  const { isOnline, isOffline, isUnstable, status, quality } =
    useNetworkStatus();

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Save data for offline use
   */
  const saveOffline = useCallback(
    async <T extends { id: string }>(storeName: StoreName, data: T) => {
      try {
        await indexedDBManager.create(storeName, data);
      } catch (error) {
        console.error(`Failed to save offline data to ${storeName}:`, error);
        throw error;
      }
    },
    []
  );

  /**
   * Get offline data by ID
   */
  const getOffline = useCallback(
    async <T,>(storeName: StoreName, id: string): Promise<T | undefined> => {
      try {
        return await indexedDBManager.read<T>(storeName, id);
      } catch (error) {
        console.error(`Failed to get offline data from ${storeName}:`, error);
        return undefined;
      }
    },
    []
  );

  /**
   * Get all offline data from a store
   */
  const getAllOffline = useCallback(async <T,>(storeName: StoreName): Promise<T[]> => {
    try {
      const result = await indexedDBManager.getAll<T>(storeName);
      return result as unknown as T[];
    } catch (error) {
      console.error(`Failed to get all offline data from ${storeName}:`, error);
      return [];
    }
  }, []);

  /**
   * Delete offline data by ID
   */
  const deleteOffline = useCallback(
    async (storeName: StoreName, id: string) => {
      try {
        await indexedDBManager.delete(storeName, id);
      } catch (error) {
        console.error(`Failed to delete offline data from ${storeName}:`, error);
        throw error;
      }
    },
    []
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return useMemo(
    () => ({
      isOnline,
      isOffline,
      isUnstable,
      status,
      quality,
      saveOffline,
      getOffline,
      getAllOffline,
      deleteOffline,
    }),
    [
      isOnline,
      isOffline,
      isUnstable,
      status,
      quality,
      saveOffline,
      getOffline,
      getAllOffline,
      deleteOffline,
    ]
  );
}
