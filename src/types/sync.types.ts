/**
 * Sync Types
 *
 * Re-exports from offline.types.ts with additional sync-specific types
 * for data synchronization between local and remote storage
 */

// Import types for use in this file
import type { SyncResult } from "./offline.types";

// Re-export non-conflicting types from offline.types
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
} from "./offline.types";

// Note: SyncConfig, SyncResult, SyncConflict are available from offline.types via index.ts

// ============================================================================
// ADDITIONAL SYNC TYPES
// ============================================================================

/**
 * Sync batch result
 */
export interface SyncBatchResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<SyncResult>;
  duration: number; // milliseconds
}

/**
 * Sync state
 */
export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  failedCount: number;
  error: string | null;
}

/**
 * Sync event types
 */
export type SyncEvent =
  | "sync_started"
  | "sync_completed"
  | "sync_failed"
  | "sync_item_success"
  | "sync_item_failed"
  | "sync_conflict_detected";

/**
 * Sync event data
 */
export interface SyncEventData {
  event: SyncEvent;
  timestamp: number;
  data?: unknown;
  error?: string;
}

/**
 * Sync listener callback
 */
export type SyncListener = (event: SyncEventData) => void;
