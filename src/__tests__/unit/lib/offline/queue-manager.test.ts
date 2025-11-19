/**
 * QueueManager Unit Tests
 *
 * Comprehensive test suite with >90% coverage
 * Tests FIFO queue, batch processing, retry logic, and event emitters
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { QueueManager } from '@/lib/offline/queue-manager';
import { indexedDBManager } from '@/lib/offline/indexeddb';
import type { QueueEvent } from '@/lib/offline/queue-manager';
import type { SyncQueueItem } from '@/types/offline.types';
import 'fake-indexeddb/auto';

// ============================================================================
// TESTS
// ============================================================================

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeAll(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    // Initialize IndexedDB
    await indexedDBManager.initialize();
    await indexedDBManager.clear('sync_queue');

    // Create new queue manager
    queueManager = new QueueManager();
  });

  afterEach(async () => {
    // Cleanup
    if (queueManager && queueManager.isReady()) {
      await queueManager.clearAll();
    }
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should create queue manager with default config', () => {
      expect(queueManager).toBeDefined();
      expect(queueManager.isReady()).toBe(false);
    });

    it('should create queue manager with custom config', () => {
      const customQueue = new QueueManager({
        maxRetries: 5,
        retryDelay: 2000,
        batchSize: 20,
        autoProcess: true,
      });

      expect(customQueue).toBeDefined();
      expect(customQueue.getConfig().maxRetries).toBe(5);
      expect(customQueue.getConfig().retryDelay).toBe(2000);
      expect(customQueue.getConfig().batchSize).toBe(20);
    });

    it('should initialize successfully', async () => {
      await queueManager.initialize();

      expect(queueManager.isReady()).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await queueManager.initialize();
      await queueManager.initialize(); // Second call

      expect(queueManager.isReady()).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('QueueManager already initialized');
    });

    it('should auto-initialize when enqueuing', async () => {
      expect(queueManager.isReady()).toBe(false);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      expect(queueManager.isReady()).toBe(true);
    });
  });

  // ============================================================================
  // ENQUEUE TESTS
  // ============================================================================

  describe('Enqueue', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should enqueue an item', async () => {
      const item = await queueManager.enqueue('kuis', 'create', { name: 'Test Quiz' });

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.entity).toBe('kuis');
      expect(item.operation).toBe('create');
      expect(item.data).toEqual({ name: 'Test Quiz' });
      expect(item.status).toBe('pending');
      expect(item.retryCount).toBe(0);
    });

    it('should store item in IndexedDB', async () => {
      const item = await queueManager.enqueue('materi', 'update', { id: '123' });

      const stored = await indexedDBManager.read<SyncQueueItem>('sync_queue', item.id);

      expect(stored).toBeDefined();
      expect(stored?.entity).toBe('materi');
      expect(stored?.operation).toBe('update');
    });

    it('should enqueue multiple items', async () => {
      await queueManager.enqueue('kuis', 'create', { name: 'Quiz 1' });
      await queueManager.enqueue('kuis', 'update', { id: '1' });
      await queueManager.enqueue('materi', 'delete', { id: '2' });

      const stats = await queueManager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(3);
    });

    it('should emit added event', async () => {
      const listener = vi.fn();
      queueManager.on(listener);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      expect(listener).toHaveBeenCalled();
      const event: QueueEvent = listener.mock.calls[0][0];
      expect(event.type).toBe('added');
      expect(event.item).toBeDefined();
    });

    it('should call onQueueChange callback', async () => {
      const callback = vi.fn();
      const customQueue = new QueueManager({
        onQueueChange: callback,
      });

      await customQueue.enqueue('kuis', 'create', { name: 'Test' });

      expect(callback).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // FIFO QUEUE TESTS
  // ============================================================================

  describe('FIFO Queue', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should get next batch in FIFO order', async () => {
      // Enqueue items with delays to ensure different timestamps
      const item1 = await queueManager.enqueue('kuis', 'create', { order: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const item2 = await queueManager.enqueue('kuis', 'create', { order: 2 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await queueManager.enqueue('kuis', 'create', { order: 3 });

      const batch = await queueManager.getNextBatch(2);

      expect(batch).toHaveLength(2);
      expect(batch[0].id).toBe(item1.id); // Oldest first
      expect(batch[1].id).toBe(item2.id);
      expect(batch[0].timestamp).toBeLessThan(batch[1].timestamp);
    });

    it('should respect batch size', async () => {
      // Enqueue 5 items
      for (let i = 0; i < 5; i++) {
        await queueManager.enqueue('kuis', 'create', { index: i });
      }

      const batch = await queueManager.getNextBatch(3);

      expect(batch).toHaveLength(3);
    });

    it('should only get pending items', async () => {
      const item1 = await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.enqueue('kuis', 'create', { name: '2' });

      // Mark first item as completed
      const updated = { ...item1, status: 'completed' as const };
      await indexedDBManager.update('sync_queue', updated);

      const batch = await queueManager.getNextBatch();

      expect(batch).toHaveLength(1);
      expect(batch[0].data.name).toBe('2');
    });

    it('should return empty array when no pending items', async () => {
      const batch = await queueManager.getNextBatch();

      expect(batch).toEqual([]);
    });
  });

  // ============================================================================
  // PROCESS QUEUE TESTS
  // ============================================================================

  describe('Process Queue', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should throw error if processor not set', async () => {
      await expect(queueManager.processQueue()).rejects.toThrow(
        'Queue processor not set'
      );
    });

    it('should process items successfully', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.enqueue('materi', 'update', { id: '1' });

      const result = await queueManager.processQueue();

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      expect(processor).toHaveBeenCalledTimes(2);
    });

    it('should mark items as syncing during processing', async () => {
      let syncingItem: SyncQueueItem | undefined;

      const processor = vi.fn().mockImplementation(async (item: SyncQueueItem) => {
        // Check status during processing
        const current = await indexedDBManager.read<SyncQueueItem>('sync_queue', item.id);
        if (current?.status === 'syncing') {
          syncingItem = current;
        }
      });

      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.processQueue();

      expect(syncingItem).toBeDefined();
      expect(syncingItem?.status).toBe('syncing');
    });

    it('should mark items as completed after processing', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      const item = await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.processQueue();

      const processed = await queueManager.getItem(item.id);

      expect(processed?.status).toBe('completed');
    });

    it('should handle processor errors', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      const result = await queueManager.processQueue();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Processing failed');
    });

    it('should emit processing events', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      const listener = vi.fn();
      queueManager.on(listener);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.processQueue();

      // Should emit: processing, completed
      const events = listener.mock.calls.map((call) => call[0].type);
      expect(events).toContain('processing');
      expect(events).toContain('completed');
    });

    it('should emit failed event on error', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Failed'));
      queueManager.setProcessor(processor);

      const listener = vi.fn();
      queueManager.on(listener);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.processQueue();

      const events = listener.mock.calls.map((call) => call[0].type);
      expect(events).toContain('failed');
    });

    it('should not process if already processing', async () => {
      const processor = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      // Start first process (don't await)
      const promise1 = queueManager.processQueue();

      // Try to start second process while first is running
      const result2 = await queueManager.processQueue();

      expect(result2.processed).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Queue processing already in progress');

      await promise1; // Cleanup
    });

    it('should process empty queue gracefully', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      const result = await queueManager.processQueue();

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should respect batch size during processing', async () => {
      const customQueue = new QueueManager({ batchSize: 2 });
      await customQueue.initialize();

      const processor = vi.fn().mockResolvedValue(undefined);
      customQueue.setProcessor(processor);

      // Enqueue 5 items
      for (let i = 0; i < 5; i++) {
        await customQueue.enqueue('kuis', 'create', { index: i });
      }

      const result = await customQueue.processQueue();

      // Should only process batch size (2)
      expect(result.processed).toBe(2);
    });
  });

  // ============================================================================
  // RETRY LOGIC TESTS
  // ============================================================================

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should retry failed items up to maxRetries', async () => {
      const customQueue = new QueueManager({ maxRetries: 2 });
      await customQueue.initialize();

      let callCount = 0;
      const processor = vi.fn().mockImplementation(() => {
        callCount++;
        throw new Error('Always fails');
      });
      customQueue.setProcessor(processor);

      await customQueue.enqueue('kuis', 'create', { name: 'Test' });

      // First attempt
      await customQueue.processQueue();
      // Second attempt (retry 1 - should fail permanently after 2 attempts with maxRetries=2)
      await customQueue.processQueue();

      const stats = await customQueue.getStats();

      expect(stats.pending).toBe(0);
      expect(stats.failed).toBe(1);
      expect(callCount).toBe(2); // maxRetries = 2, so 2 attempts total
    });

    it('should increment retry count on failure', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Failed'));
      queueManager.setProcessor(processor);

      const item = await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      await queueManager.processQueue();

      const updated = await queueManager.getItem(item.id);

      expect(updated?.retryCount).toBe(1);
      expect(updated?.error).toBe('Failed');
    });

    it('should reset failed items to pending', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Failed'));
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      // Process to fail
      await queueManager.processQueue();
      await queueManager.processQueue();
      await queueManager.processQueue(); // Should fail after 3 retries

      const stats1 = await queueManager.getStats();
      expect(stats1.failed).toBe(1);

      // Retry failed items
      const count = await queueManager.retryFailed();

      expect(count).toBe(1);

      const stats2 = await queueManager.getStats();
      expect(stats2.failed).toBe(0);
      expect(stats2.pending).toBe(1);
    });

    it('should calculate exponential backoff delay', () => {
      expect(queueManager.calculateRetryDelay(0)).toBeGreaterThanOrEqual(1000);
      expect(queueManager.calculateRetryDelay(0)).toBeLessThan(3000);

      expect(queueManager.calculateRetryDelay(1)).toBeGreaterThanOrEqual(2000);
      expect(queueManager.calculateRetryDelay(1)).toBeLessThan(4000);

      expect(queueManager.calculateRetryDelay(2)).toBeGreaterThanOrEqual(4000);
      expect(queueManager.calculateRetryDelay(2)).toBeLessThan(6000);
    });
  });

  // ============================================================================
  // CLEAR OPERATIONS TESTS
  // ============================================================================

  describe('Clear Operations', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should clear completed items', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.enqueue('kuis', 'create', { name: '2' });

      await queueManager.processQueue();

      const stats1 = await queueManager.getStats();
      expect(stats1.completed).toBe(2);

      const count = await queueManager.clearCompleted();

      expect(count).toBe(2);

      const stats2 = await queueManager.getStats();
      expect(stats2.completed).toBe(0);
      expect(stats2.total).toBe(0);
    });

    it('should clear failed items', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Fail'));
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      // Fail it
      await queueManager.processQueue();
      await queueManager.processQueue();
      await queueManager.processQueue();

      const stats1 = await queueManager.getStats();
      expect(stats1.failed).toBe(1);

      const count = await queueManager.clearFailed();

      expect(count).toBe(1);

      const stats2 = await queueManager.getStats();
      expect(stats2.failed).toBe(0);
    });

    it('should clear all items', async () => {
      await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.enqueue('kuis', 'create', { name: '2' });
      await queueManager.enqueue('kuis', 'create', { name: '3' });

      const stats1 = await queueManager.getStats();
      expect(stats1.total).toBe(3);

      const count = await queueManager.clearAll();

      expect(count).toBe(3);

      const stats2 = await queueManager.getStats();
      expect(stats2.total).toBe(0);
    });

    it('should emit cleared event', async () => {
      const listener = vi.fn();
      queueManager.on(listener);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });
      await queueManager.clearAll();

      const events = listener.mock.calls.map((call) => call[0]);
      const clearedEvent = events.find((e) => e.type === 'cleared');

      expect(clearedEvent).toBeDefined();
      expect(clearedEvent?.count).toBe(1);
    });
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('Statistics', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should get accurate statistics', async () => {
      const successProcessor = vi.fn().mockResolvedValue(undefined);
      const failProcessor = vi.fn().mockRejectedValue(new Error('Fail'));

      // Process some items successfully
      queueManager.setProcessor(successProcessor);
      await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.processQueue();

      // Add and fail some items
      queueManager.setProcessor(failProcessor);
      await queueManager.enqueue('kuis', 'create', { name: '2' });
      await queueManager.processQueue(); // Fail once
      await queueManager.processQueue(); // Fail twice
      await queueManager.processQueue(); // Fail third time (maxRetries reached)

      // Add pending item
      await queueManager.enqueue('kuis', 'create', { name: '3' });

      const stats = await queueManager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(1);
    });

    it('should include oldest and newest items', async () => {
      const item1 = await queueManager.enqueue('kuis', 'create', { order: 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const item2 = await queueManager.enqueue('kuis', 'create', { order: 2 });

      const stats = await queueManager.getStats();

      expect(stats.oldestItem?.id).toBe(item1.id);
      expect(stats.newestItem?.id).toBe(item2.id);
    });

    it('should return empty stats for empty queue', async () => {
      const stats = await queueManager.getStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.oldestItem).toBeUndefined();
      expect(stats.newestItem).toBeUndefined();
    });
  });

  // ============================================================================
  // GET ITEMS TESTS
  // ============================================================================

  describe('Get Items', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should get item by ID', async () => {
      const item = await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      const retrieved = await queueManager.getItem(item.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(item.id);
      expect(retrieved?.entity).toBe('kuis');
    });

    it('should return undefined for non-existent ID', async () => {
      const retrieved = await queueManager.getItem('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should get all items', async () => {
      await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.enqueue('materi', 'update', { id: '2' });
      await queueManager.enqueue('nilai', 'delete', { id: '3' });

      const items = await queueManager.getAllItems();

      expect(items).toHaveLength(3);
    });

    it('should filter items by status', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: '1' });
      await queueManager.enqueue('kuis', 'create', { name: '2' });

      await queueManager.processQueue();

      const completed = await queueManager.getAllItems('completed');
      const pending = await queueManager.getAllItems('pending');

      expect(completed).toHaveLength(2);
      expect(pending).toHaveLength(0);
    });
  });

  // ============================================================================
  // EVENT EMITTER TESTS
  // ============================================================================

  describe('Event Emitter', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should add listener', () => {
      const listener = vi.fn();
      queueManager.on(listener);

      expect(queueManager.getListenerCount()).toBe(1);
    });

    it('should remove listener', () => {
      const listener = vi.fn();
      queueManager.on(listener);
      queueManager.off(listener);

      expect(queueManager.getListenerCount()).toBe(0);
    });

    it('should remove listener with unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = queueManager.on(listener);

      expect(queueManager.getListenerCount()).toBe(1);

      unsubscribe();

      expect(queueManager.getListenerCount()).toBe(0);
    });

    it('should call multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      queueManager.on(listener1);
      queueManager.on(listener2);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle errors in listeners gracefully', async () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      queueManager.on(errorListener);
      queueManager.on(normalListener);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration', () => {
    beforeEach(async () => {
      await queueManager.initialize();
    });

    it('should handle complete enqueue -> process -> clear workflow', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      // Enqueue
      await queueManager.enqueue('kuis', 'create', { name: 'Quiz 1' });
      await queueManager.enqueue('materi', 'update', { id: '123' });

      let stats = await queueManager.getStats();
      expect(stats.total).toBe(2);
      expect(stats.pending).toBe(2);

      // Process
      const result = await queueManager.processQueue();
      expect(result.succeeded).toBe(2);

      stats = await queueManager.getStats();
      expect(stats.completed).toBe(2);

      // Clear
      await queueManager.clearCompleted();

      stats = await queueManager.getStats();
      expect(stats.total).toBe(0);
    });

    it('should handle retry workflow', async () => {
      let attempts = 0;
      const processor = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Not yet');
        }
        // Succeed on second attempt
      });

      queueManager.setProcessor(processor);

      await queueManager.enqueue('kuis', 'create', { name: 'Test' });

      // First attempt fails
      await queueManager.processQueue();

      let stats = await queueManager.getStats();
      expect(stats.pending).toBe(1); // Still pending (will retry)

      // Second attempt succeeds
      await queueManager.processQueue();

      stats = await queueManager.getStats();
      expect(stats.completed).toBe(1);
    });

    it('should handle large batch processing', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      queueManager.setProcessor(processor);

      // Enqueue 50 items
      for (let i = 0; i < 50; i++) {
        await queueManager.enqueue('kuis', 'create', { index: i });
      }

      const stats = await queueManager.getStats();
      expect(stats.total).toBe(50);

      // Process all (batch size is 10, so should process 10 at a time)
      const result = await queueManager.processQueue();

      expect(result.processed).toBe(10); // Default batch size
      expect(result.succeeded).toBe(10);
    });
  });
});
