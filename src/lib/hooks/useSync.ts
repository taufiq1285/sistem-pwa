/**
 * useSync Hook
 *
 * React hook for managing offline sync queue
 * - Add items to sync queue
 * - Monitor sync status
 * - Retry failed syncs
 * - View queue statistics
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { queueManager } from '../offline/queue-manager';
import type {
  SyncQueueItem,
  SyncOperation,
  SyncEntity,
  SyncStatus,
} from '@/types/offline.types';
import type { QueueStats, QueueEvent } from '../offline/queue-manager';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSyncReturn {
  /** Add item to sync queue */
  addToQueue: (
    entity: SyncEntity,
    operation: SyncOperation,
    data: Record<string, unknown>
  ) => Promise<string>;
  /** Process the sync queue */
  processQueue: () => Promise<void>;
  /** Retry failed items */
  retryFailed: () => Promise<number>;
  /** Clear completed items */
  clearCompleted: () => Promise<number>;
  /** Get queue statistics */
  stats: QueueStats | null;
  /** Whether queue is currently processing */
  isProcessing: boolean;
  /** Whether queue manager is ready */
  isReady: boolean;
  /** Refresh queue statistics */
  refreshStats: () => Promise<void>;
  /** Get all items with optional status filter */
  getAllItems: (status?: SyncStatus) => Promise<SyncQueueItem[]>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing offline sync queue
 *
 * @returns Sync queue helpers and status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { addToQueue, processQueue, stats, isProcessing } = useSync();
 *
 *   const handleOfflineSave = async (data) => {
 *     // Add to queue for later sync
 *     await addToQueue('kuis', 'create', data);
 *   };
 *
 *   return (
 *     <div>
 *       <div>Pending: {stats?.pending || 0}</div>
 *       <button onClick={processQueue} disabled={isProcessing}>
 *         Sync Now
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSync(): UseSyncReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Refresh queue statistics
   */
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await queueManager.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh queue stats:', error);
    }
  }, []);

  /**
   * Handle queue events
   */
  const handleQueueEvent = useCallback(
    (event: QueueEvent) => {
      // Update processing state
      if (event.type === 'processing') {
        setIsProcessing(true);
      } else if (event.type === 'completed' || event.type === 'failed') {
        setIsProcessing(false);
      }

      // Refresh stats after any queue change
      refreshStats();
    },
    [refreshStats]
  );

  /**
   * Add item to sync queue
   */
  const addToQueue = useCallback(
    async (
      entity: SyncEntity,
      operation: SyncOperation,
      data: Record<string, unknown>
    ): Promise<string> => {
      try {
        const item = await queueManager.enqueue(entity, operation, data);
        await refreshStats();
        return item.id;
      } catch (error) {
        console.error('Failed to add item to queue:', error);
        throw error;
      }
    },
    [refreshStats]
  );

  /**
   * Process the sync queue
   */
  const processQueue = useCallback(async () => {
    try {
      setIsProcessing(true);
      await queueManager.processQueue();
      await refreshStats();
    } catch (error) {
      console.error('Failed to process queue:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshStats]);

  /**
   * Retry failed items
   */
  const retryFailed = useCallback(async (): Promise<number> => {
    try {
      const count = await queueManager.retryFailed();
      await refreshStats();
      return count;
    } catch (error) {
      console.error('Failed to retry failed items:', error);
      return 0;
    }
  }, [refreshStats]);

  /**
   * Clear completed items
   */
  const clearCompleted = useCallback(async (): Promise<number> => {
    try {
      const count = await queueManager.clearCompleted();
      await refreshStats();
      return count;
    } catch (error) {
      console.error('Failed to clear completed items:', error);
      return 0;
    }
  }, [refreshStats]);

  /**
   * Get all items with optional status filter
   */
  const getAllItems = useCallback(
    async (status?: SyncStatus): Promise<SyncQueueItem[]> => {
      try {
        return await queueManager.getAllItems(status);
      } catch (error) {
        console.error('Failed to get queue items:', error);
        return [];
      }
    },
    []
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialize queue manager and subscribe to events
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Initialize queue manager if not already initialized
        if (!queueManager.isReady()) {
          await queueManager.initialize();
        }

        // Subscribe to queue events
        const unsubscribe = queueManager.on(handleQueueEvent);

        // Load initial stats
        if (mounted) {
          await refreshStats();
          setIsReady(true);
          setIsProcessing(queueManager.isProcessingQueue());
        }

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize useSync:', error);
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;

    init().then((unsubscribe) => {
      if (mounted) {
        cleanup = unsubscribe;
      } else {
        unsubscribe?.();
      }
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [handleQueueEvent, refreshStats]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return useMemo(
    () => ({
      addToQueue,
      processQueue,
      retryFailed,
      clearCompleted,
      stats,
      isProcessing,
      isReady,
      refreshStats,
      getAllItems,
    }),
    [
      addToQueue,
      processQueue,
      retryFailed,
      clearCompleted,
      stats,
      isProcessing,
      isReady,
      refreshStats,
      getAllItems,
    ]
  );
}
