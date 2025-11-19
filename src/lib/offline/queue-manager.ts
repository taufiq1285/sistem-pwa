/**
 * Queue Manager
 *
 * Manages offline operation queue with FIFO processing
 * - Store queue in IndexedDB
 * - Add to queue
 * - Process queue with batch support
 * - Retry failed items with exponential backoff
 * - Clear processed items
 */

import { indexedDBManager } from './indexeddb';
import type { SyncQueueItem, SyncOperation, SyncEntity, SyncStatus } from '@/types/offline.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Queue processor function type
 */
export type QueueProcessor = (item: SyncQueueItem) => Promise<void>;

/**
 * Queue event types
 */
export type QueueEventType = 'added' | 'processing' | 'completed' | 'failed' | 'cleared';

/**
 * Queue event
 */
export interface QueueEvent {
  type: QueueEventType;
  item?: SyncQueueItem;
  count?: number;
  timestamp: number;
}

/**
 * Queue manager configuration
 */
export interface QueueManagerConfig {
  maxRetries?: number;
  retryDelay?: number; // Base delay in milliseconds
  batchSize?: number;
  autoProcess?: boolean;
  onQueueChange?: (event: QueueEvent) => void;
}

/**
 * Process result
 */
export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  total: number;
  pending: number;
  syncing: number;
  completed: number;
  failed: number;
  oldestItem?: SyncQueueItem;
  newestItem?: SyncQueueItem;
}

/**
 * Event listener callback
 */
type QueueEventListener = (event: QueueEvent) => void;

// ============================================================================
// QUEUE MANAGER CLASS
// ============================================================================

/**
 * QueueManager class
 * Manages FIFO queue with IndexedDB persistence
 */
export class QueueManager {
  private config: Required<QueueManagerConfig>;
  private processor: QueueProcessor | null = null;
  private isProcessing = false;
  private listeners: Set<QueueEventListener> = new Set();
  private isInitialized = false;

  constructor(config: QueueManagerConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000, // 1 second base delay
      batchSize: config.batchSize ?? 10,
      autoProcess: config.autoProcess ?? false,
      onQueueChange: config.onQueueChange || (() => {}),
    };
  }

  /**
   * Initialize queue manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('QueueManager already initialized');
      return;
    }

    // Ensure IndexedDB is initialized
    if (!indexedDBManager.isReady()) {
      await indexedDBManager.initialize();
    }

    this.isInitialized = true;
    console.log('✅ QueueManager initialized');

    // Auto-process if enabled
    if (this.config.autoProcess && this.processor) {
      await this.processQueue();
    }
  }

  /**
   * Set queue processor function
   */
  setProcessor(processor: QueueProcessor): void {
    this.processor = processor;
  }

  /**
   * Add item to queue
   */
  async enqueue(
    entity: SyncEntity,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<SyncQueueItem> {
    await this.ensureInitialized();

    const item: SyncQueueItem = {
      id: this.generateId(),
      entity,
      operation,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await indexedDBManager.create('sync_queue', item);

    console.log(`📥 Enqueued ${entity} ${operation}:`, item.id);

    this.emitEvent({
      type: 'added',
      item,
      timestamp: Date.now(),
    });

    // Auto-process if enabled
    if (this.config.autoProcess && this.processor && !this.isProcessing) {
      // Process in background (don't await)
      this.processQueue().catch((error) => {
        console.error('Auto-process failed:', error);
      });
    }

    return item;
  }

  /**
   * Get next pending items (FIFO)
   */
  async getNextBatch(batchSize?: number): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();

    const size = batchSize || this.config.batchSize;

    // Get all pending items, sorted by timestamp (FIFO)
    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');

    const pendingItems = allItems
      .filter((item) => item.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, size);

    return pendingItems;
  }

  /**
   * Process queue with configured processor
   */
  async processQueue(): Promise<ProcessResult> {
    await this.ensureInitialized();

    if (!this.processor) {
      throw new Error('Queue processor not set. Call setProcessor() first.');
    }

    if (this.isProcessing) {
      console.warn('Queue processing already in progress');
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
      };
    }

    this.isProcessing = true;

    const result: ProcessResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    try {
      const batch = await this.getNextBatch();

      if (batch.length === 0) {
        console.log('📭 Queue is empty');
        return result;
      }

      console.log(`🔄 Processing ${batch.length} items from queue`);

      for (const item of batch) {
        try {
          // Mark as syncing
          await this.updateItemStatus(item.id, 'syncing');

          this.emitEvent({
            type: 'processing',
            item,
            timestamp: Date.now(),
          });

          // Process item
          await this.processor(item);

          // Mark as completed
          await this.updateItemStatus(item.id, 'completed');

          result.succeeded++;

          this.emitEvent({
            type: 'completed',
            item,
            timestamp: Date.now(),
          });

          console.log(`✅ Processed ${item.entity} ${item.operation}:`, item.id);
        } catch (error) {
          // Handle failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          result.failed++;
          result.errors.push({ id: item.id, error: errorMessage });

          // Update item with error and retry
          await this.handleFailedItem(item, errorMessage);

          this.emitEvent({
            type: 'failed',
            item,
            timestamp: Date.now(),
          });

          console.error(`❌ Failed to process ${item.entity} ${item.operation}:`, errorMessage);
        }

        result.processed++;
      }

      console.log(
        `✨ Queue processing complete: ${result.succeeded}/${result.processed} succeeded`
      );
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Handle failed item with retry logic
   */
  private async handleFailedItem(item: SyncQueueItem, errorMessage: string): Promise<void> {
    const updatedItem = {
      ...item,
      retryCount: item.retryCount + 1,
      error: errorMessage,
      status: (item.retryCount + 1 >= this.config.maxRetries ? 'failed' : 'pending') as SyncStatus,
    };

    await indexedDBManager.update('sync_queue', updatedItem);

    if (updatedItem.status === 'failed') {
      console.warn(
        `⚠️  Item ${item.id} failed after ${this.config.maxRetries} retries`
      );
    } else {
      console.log(
        `🔄 Item ${item.id} will be retried (attempt ${updatedItem.retryCount + 1}/${this.config.maxRetries})`
      );
    }
  }

  /**
   * Retry all failed items
   */
  async retryFailed(): Promise<number> {
    await this.ensureInitialized();

    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');
    const failedItems = allItems.filter((item) => item.status === 'failed');

    for (const item of failedItems) {
      const updatedItem = {
        ...item,
        status: 'pending' as SyncStatus,
        retryCount: 0,
        error: undefined,
      };

      await indexedDBManager.update('sync_queue', updatedItem);
    }

    console.log(`🔄 Reset ${failedItems.length} failed items to pending`);

    // Auto-process if enabled
    if (this.config.autoProcess && this.processor && !this.isProcessing) {
      this.processQueue().catch((error) => {
        console.error('Auto-process after retry failed:', error);
      });
    }

    return failedItems.length;
  }

  /**
   * Clear completed items
   */
  async clearCompleted(): Promise<number> {
    await this.ensureInitialized();

    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');
    const completedItems = allItems.filter((item) => item.status === 'completed');

    const ids = completedItems.map((item) => item.id);
    await indexedDBManager.batchDelete('sync_queue', ids);

    console.log(`🗑️  Cleared ${ids.length} completed items`);

    this.emitEvent({
      type: 'cleared',
      count: ids.length,
      timestamp: Date.now(),
    });

    return ids.length;
  }

  /**
   * Clear failed items
   */
  async clearFailed(): Promise<number> {
    await this.ensureInitialized();

    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');
    const failedItems = allItems.filter((item) => item.status === 'failed');

    const ids = failedItems.map((item) => item.id);
    await indexedDBManager.batchDelete('sync_queue', ids);

    console.log(`🗑️  Cleared ${ids.length} failed items`);

    this.emitEvent({
      type: 'cleared',
      count: ids.length,
      timestamp: Date.now(),
    });

    return ids.length;
  }

  /**
   * Clear all items
   */
  async clearAll(): Promise<number> {
    await this.ensureInitialized();

    const count = await indexedDBManager.count('sync_queue');
    await indexedDBManager.clear('sync_queue');

    console.log(`🗑️  Cleared all ${count} queue items`);

    this.emitEvent({
      type: 'cleared',
      count,
      timestamp: Date.now(),
    });

    return count;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    await this.ensureInitialized();

    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');

    const stats: QueueStats = {
      total: allItems.length,
      pending: allItems.filter((item) => item.status === 'pending').length,
      syncing: allItems.filter((item) => item.status === 'syncing').length,
      completed: allItems.filter((item) => item.status === 'completed').length,
      failed: allItems.filter((item) => item.status === 'failed').length,
    };

    // Get oldest and newest items
    if (allItems.length > 0) {
      const sorted = [...allItems].sort((a, b) => a.timestamp - b.timestamp);
      stats.oldestItem = sorted[0];
      stats.newestItem = sorted[sorted.length - 1];
    }

    return stats;
  }

  /**
   * Get item by ID
   */
  async getItem(id: string): Promise<SyncQueueItem | undefined> {
    await this.ensureInitialized();
    return await indexedDBManager.read<SyncQueueItem>('sync_queue', id);
  }

  /**
   * Get all items with optional status filter
   */
  async getAllItems(status?: SyncStatus): Promise<SyncQueueItem[]> {
    await this.ensureInitialized();

    const allItems = await indexedDBManager.getAll<SyncQueueItem>('sync_queue');

    if (status) {
      return allItems.filter((item) => item.status === status);
    }

    return allItems;
  }

  /**
   * Update item status
   */
  private async updateItemStatus(id: string, status: SyncStatus): Promise<void> {
    const item = await indexedDBManager.read<SyncQueueItem>('sync_queue', id);

    if (!item) {
      throw new Error(`Queue item not found: ${id}`);
    }

    const updatedItem = {
      ...item,
      status,
    };

    await indexedDBManager.update('sync_queue', updatedItem);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: baseDelay * 2^retryCount
    // With jitter to avoid thundering herd
    const exponentialDelay = this.config.retryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // 0-1000ms jitter
    return exponentialDelay + jitter;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // ============================================================================
  // EVENT EMITTER METHODS
  // ============================================================================

  /**
   * Subscribe to queue events
   */
  on(listener: QueueEventListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from queue events
   */
  off(listener: QueueEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit queue event
   */
  private emitEvent(event: QueueEvent): void {
    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });

    // Call config callback
    if (this.config.onQueueChange) {
      this.config.onQueueChange(event);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Check if queue is processing
   */
  isProcessingQueue(): boolean {
    return this.isProcessing;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<QueueManagerConfig>> {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default queue manager instance
 */
export const queueManager = new QueueManager();
