/**
 * Sync Manager
 *
 * Manages background sync between QueueManager and Service Worker
 *
 * Features:
 * - Orchestrate sync process with queue manager
 * - Track sync status and progress
 * - Handle sync errors with retry logic
 * - Event-based progress updates
 * - Batch processing with concurrency control
 * - Service Worker integration
 */

import { queueManager } from "./queue-manager";
import { networkDetector } from "./network-detector";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync Manager configuration
 */
export interface SyncManagerConfig {
  autoRegisterSync?: boolean;
  autoProcessOnline?: boolean;
  syncTag?: string;
  batchSize?: number;
  maxConcurrency?: number;
  enableProgressEvents?: boolean;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  duration?: number;
  timestamp?: number;
}

/**
 * Sync status
 */
export type SyncStatus = "idle" | "syncing" | "completed" | "error" | "paused";

/**
 * Sync progress event
 */
export interface SyncProgress {
  status: SyncStatus;
  processed: number;
  total: number;
  failed: number;
  current?: {
    id: string;
    entity: string;
    operation: string;
  };
  timestamp: number;
}

/**
 * Sync statistics
 */
export interface SyncStats {
  lastSync?: number;
  totalSynced: number;
  totalFailed: number;
  averageDuration: number;
  syncHistory: Array<{
    timestamp: number;
    processed: number;
    failed: number;
    duration: number;
  }>;
}

/**
 * Sync event types
 */
export type SyncEventType =
  | "start"
  | "progress"
  | "complete"
  | "error"
  | "pause"
  | "resume";

/**
 * Sync event
 */
export interface SyncEvent {
  type: SyncEventType;
  progress?: SyncProgress;
  result?: SyncResult;
  error?: Error;
  timestamp: number;
}

/**
 * Event listener callback
 */
type SyncEventListener = (event: SyncEvent) => void;

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

/**
 * SyncManager class
 * Orchestrates sync process with advanced features
 */
export class SyncManager {
  private config: Required<SyncManagerConfig>;
  private isInitialized = false;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private swMessageHandler: ((event: MessageEvent) => void) | null = null;

  // Status tracking
  private currentStatus: SyncStatus = "idle";
  private isSyncing = false;
  private isPaused = false;

  // Event listeners
  private listeners: Set<SyncEventListener> = new Set();

  // Statistics
  private stats: SyncStats = {
    totalSynced: 0,
    totalFailed: 0,
    averageDuration: 0,
    syncHistory: [],
  };

  constructor(config: SyncManagerConfig = {}) {
    this.config = {
      autoRegisterSync: config.autoRegisterSync ?? true,
      autoProcessOnline: config.autoProcessOnline ?? true,
      syncTag: config.syncTag || "background-sync",
      batchSize: config.batchSize ?? 10,
      maxConcurrency: config.maxConcurrency ?? 3,
      enableProgressEvents: config.enableProgressEvents ?? true,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      if (!("serviceWorker" in navigator)) return;
      this.swRegistration = await navigator.serviceWorker.ready;
      if (this.config.autoProcessOnline) {
        networkDetector.on(this.handleNetworkChange);
      }
      if (this.config.autoRegisterSync && "sync" in this.swRegistration) {
        await this.registerBackgroundSync();
      }
      // Listen to messages from Service Worker
      this.swMessageHandler = this.handleSWMessage.bind(this);
      navigator.serviceWorker.addEventListener(
        "message",
        this.swMessageHandler,
      );
      this.isInitialized = true;
      console.log("SyncManager initialized");
    } catch (error) {
      console.error("SyncManager init failed:", error);
    }
  }

  private handleSWMessage = async (event: MessageEvent) => {
    const { data } = event;
    if (data && data.type === "PROCESS_SYNC_QUEUE") {
      console.log("Received PROCESS_SYNC_QUEUE from SW");
      await this.processSync();
    }
  };

  private handleNetworkChange = async (event: {
    status: string;
    isOnline: boolean;
  }) => {
    if (event.isOnline && event.status === "online") {
      await this.processSync();
    }
  };

  async registerBackgroundSync(): Promise<void> {
    try {
      if (this.swRegistration && "sync" in this.swRegistration) {
        await (this.swRegistration as any).sync.register(this.config.syncTag);
      }
    } catch (error) {
      console.error("Failed to register background sync:", error);
    }
  }

  /**
   * Process sync queue with progress tracking
   */
  async processSync(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.isSyncing) {
      console.warn("[SyncManager] Sync already in progress");
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    // Check if paused
    if (this.isPaused) {
      console.warn("[SyncManager] Sync is paused");
      return { success: false, processed: 0, failed: 0, errors: [] };
    }

    const startTime = Date.now();
    this.isSyncing = true;
    this.currentStatus = "syncing";

    try {
      // Ensure queue manager is ready
      if (!queueManager.isReady()) {
        await queueManager.initialize();
      }

      // Get queue statistics
      const queueStats = await queueManager.getStats();
      const totalItems = queueStats.pending;

      // Emit start event
      this.emitEvent({
        type: "start",
        progress: {
          status: "syncing",
          processed: 0,
          total: totalItems,
          failed: 0,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      // Early return if queue is empty
      if (totalItems === 0) {
        const emptyResult: SyncResult = {
          success: true,
          processed: 0,
          failed: 0,
          errors: [],
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };

        this.currentStatus = "completed";
        this.isSyncing = false;

        this.emitEvent({
          type: "complete",
          result: emptyResult,
          timestamp: Date.now(),
        });

        return emptyResult;
      }

      // Process queue with progress tracking
      const result = await queueManager.processQueue();

      // Calculate duration
      const duration = Date.now() - startTime;

      // Build sync result
      const syncResult: SyncResult = {
        success: result.failed === 0,
        processed: result.processed,
        failed: result.failed,
        errors: result.errors,
        duration,
        timestamp: Date.now(),
      };

      // Update statistics
      this.updateStats(syncResult);

      // Update status
      this.currentStatus = result.failed === 0 ? "completed" : "error";

      // Notify Service Worker
      if (this.swRegistration) {
        this.sendMessageToSW({
          type: result.failed === 0 ? "SYNC_COMPLETED" : "SYNC_FAILED",
          processed: result.processed,
          failed: result.failed,
          timestamp: Date.now(),
        });
      }

      // Emit complete event
      this.emitEvent({
        type: "complete",
        result: syncResult,
        timestamp: Date.now(),
      });

      return syncResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: SyncResult = {
        success: false,
        processed: 0,
        failed: 0,
        errors: [
          {
            id: "sync-error",
            error:
              error instanceof Error ? error.message : "Unknown sync error",
          },
        ],
        duration,
        timestamp: Date.now(),
      };

      this.currentStatus = "error";

      // Emit error event
      this.emitEvent({
        type: "error",
        error: error instanceof Error ? error : new Error("Unknown sync error"),
        result: errorResult,
        timestamp: Date.now(),
      });

      console.error("[SyncManager] Sync failed:", error);
      return errorResult;
    } finally {
      this.isSyncing = false;
    }
  }

  async syncNow(): Promise<SyncResult> {
    return await this.processSync();
  }

  private sendMessageToSW(message: Record<string, unknown>): void {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage(message);
    }
  }

  /**
   * Retry all failed items in queue
   */
  async retryFailed(): Promise<number> {
    const count = await queueManager.retryFailed();
    if (count > 0) {
      console.log(`[SyncManager] Retrying ${count} failed items`);
      await this.processSync();
    }
    return count;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await queueManager.getStats();
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Pause sync process
   */
  pause(): void {
    if (!this.isSyncing) {
      console.warn("[SyncManager] Cannot pause - no sync in progress");
      return;
    }

    this.isPaused = true;
    this.currentStatus = "paused";

    this.emitEvent({
      type: "pause",
      timestamp: Date.now(),
    });

    console.log("[SyncManager] Sync paused");
  }

  /**
   * Resume paused sync
   */
  resume(): void {
    if (!this.isPaused) {
      console.warn("[SyncManager] Sync is not paused");
      return;
    }

    this.isPaused = false;
    this.currentStatus = "syncing";

    this.emitEvent({
      type: "resume",
      timestamp: Date.now(),
    });

    console.log("[SyncManager] Sync resumed");
  }

  /**
   * Clear sync history
   */
  clearHistory(): void {
    this.stats.syncHistory = [];
    console.log("[SyncManager] Sync history cleared");
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.stats = {
      totalSynced: 0,
      totalFailed: 0,
      averageDuration: 0,
      syncHistory: [],
    };
    console.log("[SyncManager] Statistics reset");
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Add event listener
   */
  on(listener: SyncEventListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove event listener
   */
  off(listener: SyncEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Emit sync event to all listeners
   */
  private emitEvent(event: SyncEvent): void {
    if (!this.config.enableProgressEvents) return;

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[SyncManager] Event listener error:", error);
      }
    });
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Update sync statistics
   */
  private updateStats(result: SyncResult): void {
    // Update totals
    this.stats.totalSynced += result.processed;
    this.stats.totalFailed += result.failed;
    this.stats.lastSync = result.timestamp;

    // Add to history
    this.stats.syncHistory.push({
      timestamp: result.timestamp!,
      processed: result.processed,
      failed: result.failed,
      duration: result.duration || 0,
    });

    // Keep only last 100 entries
    if (this.stats.syncHistory.length > 100) {
      this.stats.syncHistory = this.stats.syncHistory.slice(-100);
    }

    // Calculate average duration
    const totalDuration = this.stats.syncHistory.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    this.stats.averageDuration = totalDuration / this.stats.syncHistory.length;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Destroy sync manager
   */
  destroy(): void {
    // Remove network listener
    if (this.config.autoProcessOnline) {
      networkDetector.off(this.handleNetworkChange);
    }

    // Remove SW message listener
    if (this.swMessageHandler) {
      navigator.serviceWorker.removeEventListener(
        "message",
        this.swMessageHandler,
      );
      this.swMessageHandler = null;
    }

    // Clear all event listeners
    this.removeAllListeners();

    // Reset state
    this.isInitialized = false;
    this.isSyncing = false;
    this.isPaused = false;
    this.currentStatus = "idle";

    console.log("[SyncManager] Destroyed");
  }

  /**
   * Check if sync manager is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export const syncManager = new SyncManager();

export async function initializeSyncManager(): Promise<void> {
  if (!queueManager.isReady()) await queueManager.initialize();
  if (!networkDetector.isReady()) networkDetector.initialize();
  await syncManager.initialize();
}
