/**
 * useSync Hook
 *
 * React hook for managing offline sync queue
 * - Add items to sync queue
 * - Monitor sync status
 * - Retry failed syncs
 * - View queue statistics
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { queueManager } from "../offline/queue-manager";
import type {
  SyncQueueItem,
  SyncOperation,
  SyncEntity,
  SyncStatus,
} from "@/types/offline.types";
import type { QueueStats, QueueEvent } from "../offline/queue-manager";
import { supabase } from "@/lib/supabase/client";
import { submitAnswerSafe } from "@/lib/api/kuis-versioned-simple.api";

// ============================================================================
// TYPES
// ============================================================================

export interface UseSyncReturn {
  /** Add item to sync queue */
  addToQueue: (
    entity: SyncEntity,
    operation: SyncOperation,
    data: Record<string, unknown>,
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
// SYNC PROCESSOR
// ============================================================================

function sanitizeQueueData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const payload = { ...data };
  delete (payload as any)._metadata;
  return payload;
}

async function processSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const data = sanitizeQueueData(item.data);

  if (item.entity === "kuis_jawaban") {
    if (item.operation === "delete") {
      throw new Error(
        "Delete operation is not supported for kuis_jawaban offline sync",
      );
    }

    const attempt_id = data.attempt_id as string | undefined;
    const soal_id = data.soal_id as string | undefined;
    const jawaban = data.jawaban as string | undefined;

    if (!attempt_id || !soal_id || jawaban === undefined) {
      throw new Error(
        "Invalid kuis_jawaban payload: attempt_id, soal_id, dan jawaban wajib ada",
      );
    }

    await submitAnswerSafe({ attempt_id, soal_id, jawaban });
    return;
  }

  const tableByEntity: Record<Exclude<SyncEntity, "kuis_jawaban">, string> = {
    kuis: "kuis",
    kuis_soal: "soal",
    nilai: "nilai",
    materi: "materi",
    kelas: "kelas",
    user: "users",
  };

  const table =
    tableByEntity[item.entity as Exclude<SyncEntity, "kuis_jawaban">];

  if (!table) {
    throw new Error(`Unsupported sync entity: ${item.entity}`);
  }

  if (item.operation === "create") {
    const { error } = await (supabase as any).from(table).insert(data);
    if (error) throw error;
    return;
  }

  const id = data.id as string | undefined;
  if (!id) {
    throw new Error(`Missing id for ${item.operation} ${item.entity}`);
  }

  if (item.operation === "update") {
    const { id: _ignored, ...updateData } = data;
    const { error } = await (supabase as any)
      .from(table)
      .update(updateData)
      .eq("id", id);
    if (error) throw error;
    return;
  }

  if (item.operation === "delete") {
    const { error } = await (supabase as any).from(table).delete().eq("id", id);
    if (error) throw error;
    return;
  }

  throw new Error(`Unsupported sync operation: ${item.operation}`);
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
      console.error("Failed to refresh queue stats:", error);
    }
  }, []);

  /**
   * Handle queue events
   */
  const handleQueueEvent = useCallback(
    (event: QueueEvent) => {
      // Update processing state
      if (event.type === "processing") {
        setIsProcessing(true);
      } else if (event.type === "completed" || event.type === "failed") {
        setIsProcessing(false);
      }

      // Refresh stats after any queue change
      refreshStats();
    },
    [refreshStats],
  );

  /**
   * Add item to sync queue
   */
  const addToQueue = useCallback(
    async (
      entity: SyncEntity,
      operation: SyncOperation,
      data: Record<string, unknown>,
    ): Promise<string> => {
      try {
        const item = await queueManager.enqueue(entity, operation, data);
        await refreshStats();
        return item.id;
      } catch (error) {
        console.error("Failed to add item to queue:", error);
        throw error;
      }
    },
    [refreshStats],
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
      console.error("Failed to process queue:", error);
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
      console.error("Failed to retry failed items:", error);
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
      console.error("Failed to clear completed items:", error);
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
        console.error("Failed to get queue items:", error);
        return [];
      }
    },
    [],
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

        // IMPORTANT: Runtime processor that actually syncs queue items to Supabase
        // Guarded for test mocks that may not expose setProcessor
        if (typeof (queueManager as any).setProcessor === "function") {
          (queueManager as any).setProcessor(processSyncQueueItem);
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
        console.error("Failed to initialize useSync:", error);
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
    ],
  );
}
