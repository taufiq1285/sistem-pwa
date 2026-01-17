/**
 * useLocalData Hook
 *
 * React hook for managing local IndexedDB data with caching
 * - Load and cache data from IndexedDB
 * - Real-time updates and reactivity
 * - Optimistic updates
 * - Query and filter support
 * - Auto-refresh capabilities
 *
 * ✅ FIXED: Infinite loop issue by using refs for filter/sort/transform
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { indexedDBManager } from "../offline/indexeddb";
import type { StoreName } from "@/types/offline.types";

// ============================================================================
// TYPES
// ============================================================================

export interface UseLocalDataOptions<T> {
  /** Auto-load data on mount */
  autoLoad?: boolean;
  /** Polling interval in milliseconds (0 = disabled) */
  refreshInterval?: number;
  /** Filter function for loaded data */
  filter?: (item: T) => boolean;
  /** Sort function for loaded data */
  sort?: (a: T, b: T) => number;
  /** Transform function for each item */
  transform?: (item: T) => T;
  /** Enable optimistic updates */
  optimistic?: boolean;
}

export interface UseLocalDataReturn<T> {
  /** Cached data array */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Whether data has been loaded */
  loaded: boolean;
  /** Load/reload data from IndexedDB */
  load: () => Promise<void>;
  /** Get single item by ID */
  getById: (id: string) => T | undefined;
  /** Add new item */
  add: (item: T) => Promise<void>;
  /** Update existing item */
  update: (id: string, updates: Partial<T>) => Promise<void>;
  /** Delete item by ID */
  remove: (id: string) => Promise<void>;
  /** Clear all data from store */
  clear: () => Promise<void>;
  /** Refresh data from IndexedDB */
  refresh: () => Promise<void>;
  /** Find items matching predicate */
  find: (predicate: (item: T) => boolean) => T[];
  /** Check if item exists */
  has: (id: string) => boolean;
  /** Total count */
  count: number;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing local IndexedDB data
 *
 * @param storeName - Name of the IndexedDB store
 * @param options - Hook options
 * @returns Local data helpers and state
 *
 * @example
 * ```tsx
 * function KuisListComponent() {
 *   const { data, loading, add, update, remove } = useLocalData<Kuis>('kuis', {
 *     autoLoad: true,
 *     refreshInterval: 5000, // Refresh every 5 seconds
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {data.map(kuis => (
 *         <KuisCard key={kuis.id} kuis={kuis} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalData<T extends { id: string }>(
  storeName: StoreName,
  options: UseLocalDataOptions<T> = {},
): UseLocalDataReturn<T> {
  const {
    autoLoad = true,
    refreshInterval = 0,
    filter,
    sort,
    transform,
    optimistic = true,
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Refs for cleanup
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const mountedRef = useRef<boolean>(true);

  // ✅ FIX: Use refs for filter/sort/transform to prevent infinite loops
  // These functions can change on every render, causing useCallback to recreate
  const filterRef = useRef(filter);
  const sortRef = useRef(sort);
  const transformRef = useRef(transform);

  // Update refs when options change
  useEffect(() => {
    filterRef.current = filter;
    sortRef.current = sort;
    transformRef.current = transform;
  }, [filter, sort, transform]);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Load data from IndexedDB
   * ✅ FIXED: Uses refs instead of direct dependencies to prevent infinite loops
   */
  const load = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Load data from IndexedDB
      let items = await indexedDBManager.getAll<T>(storeName);

      // Apply transform if provided (use ref to avoid recreating callback)
      if (transformRef.current) {
        items = items.map(transformRef.current);
      }

      // Apply filter if provided (use ref to avoid recreating callback)
      if (filterRef.current) {
        items = items.filter(filterRef.current);
      }

      // Apply sort if provided (use ref to avoid recreating callback)
      if (sortRef.current) {
        items = items.sort(sortRef.current);
      }

      if (mountedRef.current) {
        setData(items);
        setLoaded(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error =
          err instanceof Error ? err : new Error("Failed to load data");
        setError(error);
        console.error(`Failed to load data from ${storeName}:`, err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [storeName]); // ✅ FIXED: Only depend on storeName

  /**
   * Get item by ID from cached data
   */
  const getById = useCallback(
    (id: string): T | undefined => {
      return data.find((item) => item.id === id);
    },
    [data],
  );

  /**
   * Add new item
   */
  const add = useCallback(
    async (item: T) => {
      try {
        // Optimistic update
        if (optimistic && mountedRef.current) {
          setData((prev) => {
            // Apply filter and sort (use refs)
            let newData = [...prev, item];
            if (filterRef.current) newData = newData.filter(filterRef.current);
            if (sortRef.current) newData = newData.sort(sortRef.current);
            return newData;
          });
        }

        // Persist to IndexedDB
        await indexedDBManager.create(storeName, item);

        // Reload to ensure consistency
        if (!optimistic) {
          await load();
        }
      } catch (err) {
        console.error(`Failed to add item to ${storeName}:`, err);

        // Revert optimistic update on error
        if (optimistic) {
          await load();
        }

        throw err;
      }
    },
    [storeName, load, optimistic],
  );

  /**
   * Update existing item
   */
  const update = useCallback(
    async (id: string, updates: Partial<T>) => {
      try {
        // Optimistic update
        if (optimistic && mountedRef.current) {
          setData((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...updates } : item,
            ),
          );
        }

        // Persist to IndexedDB
        const existingItem = await indexedDBManager.read<T>(storeName, id);
        if (existingItem) {
          await indexedDBManager.update(storeName, {
            ...existingItem,
            ...updates,
          });
        }

        // Reload to ensure consistency
        if (!optimistic) {
          await load();
        }
      } catch (err) {
        console.error(`Failed to update item in ${storeName}:`, err);

        // Revert optimistic update on error
        if (optimistic) {
          await load();
        }

        throw err;
      }
    },
    [storeName, load, optimistic],
  );

  /**
   * Delete item by ID
   */
  const remove = useCallback(
    async (id: string) => {
      try {
        // Optimistic update
        if (optimistic && mountedRef.current) {
          setData((prev) => prev.filter((item) => item.id !== id));
        }

        // Delete from IndexedDB
        await indexedDBManager.delete(storeName, id);

        // Reload to ensure consistency
        if (!optimistic) {
          await load();
        }
      } catch (err) {
        console.error(`Failed to delete item from ${storeName}:`, err);

        // Revert optimistic update on error
        if (optimistic) {
          await load();
        }

        throw err;
      }
    },
    [storeName, load, optimistic],
  );

  /**
   * Clear all data from store
   */
  const clear = useCallback(async () => {
    try {
      // Optimistic update
      if (optimistic && mountedRef.current) {
        setData([]);
      }

      // Clear from IndexedDB
      await indexedDBManager.clear(storeName);

      // Reload to ensure consistency
      if (!optimistic) {
        await load();
      }
    } catch (err) {
      console.error(`Failed to clear ${storeName}:`, err);

      // Revert optimistic update on error
      if (optimistic) {
        await load();
      }

      throw err;
    }
  }, [storeName, load, optimistic]);

  /**
   * Refresh data from IndexedDB
   */
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  /**
   * Find items matching predicate
   */
  const find = useCallback(
    (predicate: (item: T) => boolean): T[] => {
      return data.filter(predicate);
    },
    [data],
  );

  /**
   * Check if item exists in cache
   */
  const has = useCallback(
    (id: string): boolean => {
      return data.some((item) => item.id === id);
    },
    [data],
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Auto-load on mount
   * ✅ FIXED: load is now stable (only depends on storeName)
   */
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  /**
   * Setup refresh interval
   * ✅ FIXED: load is now stable (only depends on storeName)
   */
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        load();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, load]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const count = useMemo(() => data.length, [data]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return useMemo(
    () => ({
      data,
      loading,
      error,
      loaded,
      load,
      getById,
      add,
      update,
      remove,
      clear,
      refresh,
      find,
      has,
      count,
    }),
    [
      data,
      loading,
      error,
      loaded,
      load,
      getById,
      add,
      update,
      remove,
      clear,
      refresh,
      find,
      has,
      count,
    ],
  );
}
