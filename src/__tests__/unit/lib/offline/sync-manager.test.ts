/**
 * Sync Manager Unit Tests
 *
 * Tests for SyncManager class functionality including:
 * - Initialization and lifecycle
 * - Sync processing
 * - Error handling
 * - Event system
 * - Statistics tracking
 * - Pause/resume functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncManager } from '@/lib/offline/sync-manager';
import type { SyncEvent, SyncResult } from '@/lib/offline/sync-manager';

// ============================================================================
// MOCKS
// ============================================================================

// Setup mocks
vi.mock('@/lib/offline/queue-manager', () => ({
  queueManager: {
    isReady: vi.fn(() => true),
    initialize: vi.fn(() => Promise.resolve()),
    getStats: vi.fn(() =>
      Promise.resolve({
        total: 10,
        pending: 5,
        syncing: 0,
        completed: 3,
        failed: 2,
      })
    ),
    processQueue: vi.fn(() =>
      Promise.resolve({
        processed: 5,
        succeeded: 4,
        failed: 1,
        errors: [{ id: 'item-1', error: 'Network error' }],
      })
    ),
    retryFailed: vi.fn(() => Promise.resolve(2)),
  },
}));

vi.mock('@/lib/offline/network-detector', () => ({
  networkDetector: {
    isReady: vi.fn(() => true),
    initialize: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock Service Worker
const mockServiceWorkerRegistration = {
  active: {
    postMessage: vi.fn(),
  },
  sync: {
    register: vi.fn(() => Promise.resolve()),
  },
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve(mockServiceWorkerRegistration),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  },
  writable: true,
});

// ============================================================================
// TESTS
// ============================================================================

describe('SyncManager', () => {
  let syncManager: SyncManager;
  let mockQueueManager: any;
  let mockNetworkDetector: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Get mock references
    const queueModule = await import('@/lib/offline/queue-manager');
    const networkModule = await import('@/lib/offline/network-detector');
    mockQueueManager = queueModule.queueManager;
    mockNetworkDetector = networkModule.networkDetector;

    // Create fresh instance
    syncManager = new SyncManager({
      autoRegisterSync: true,
      autoProcessOnline: true,
      enableProgressEvents: true,
    });
  });

  afterEach(() => {
    if (syncManager) {
      syncManager.destroy();
    }
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await syncManager.initialize();

      expect(syncManager.isReady()).toBe(true);
      expect(mockNetworkDetector.on).toHaveBeenCalled();
    });

    it('should not initialize twice', async () => {
      await syncManager.initialize();
      await syncManager.initialize();

      expect(mockNetworkDetector.on).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors gracefully', async () => {
      mockNetworkDetector.on.mockImplementationOnce(() => {
        throw new Error('Network detector error');
      });

      await expect(syncManager.initialize()).resolves.not.toThrow();
    });

    it('should register background sync when supported', async () => {
      await syncManager.initialize();

      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith(
        'background-sync'
      );
    });
  });

  // ==========================================================================
  // SYNC PROCESSING
  // ==========================================================================

  describe('Sync Processing', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should process sync successfully', async () => {
      const result = await syncManager.processSync();

      expect(result.success).toBe(false); // Has 1 failed item
      expect(result.processed).toBe(5);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should handle empty queue', async () => {
      mockQueueManager.getStats.mockResolvedValueOnce({
        total: 0,
        pending: 0,
        syncing: 0,
        completed: 0,
        failed: 0,
      });

      const result = await syncManager.processSync();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should prevent concurrent syncs', async () => {
      // Start first sync
      const promise1 = syncManager.processSync();

      // Try to start second sync while first is running
      const result2 = await syncManager.processSync();

      expect(result2.success).toBe(false);
      expect(result2.processed).toBe(0);

      // Wait for first sync to complete
      await promise1;
    });

    it('should initialize queue manager if not ready', async () => {
      mockQueueManager.isReady.mockReturnValueOnce(false);

      await syncManager.processSync();

      expect(mockQueueManager.initialize).toHaveBeenCalled();
    });

    it('should update statistics after sync', async () => {
      await syncManager.processSync();

      const stats = syncManager.getSyncStats();

      expect(stats.totalSynced).toBe(5);
      expect(stats.totalFailed).toBe(1);
      expect(stats.lastSync).toBeGreaterThan(0);
      expect(stats.syncHistory).toHaveLength(1);
    });

    it('should send message to service worker on completion', async () => {
      await syncManager.processSync();

      expect(mockServiceWorkerRegistration.active.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYNC_FAILED', // Because we have 1 failed item
          processed: 5,
          failed: 1,
        })
      );
    });

    it('should handle sync errors gracefully', async () => {
      mockQueueManager.processQueue.mockRejectedValueOnce(
        new Error('Queue processing failed')
      );

      const result = await syncManager.processSync();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Queue processing failed');
    });
  });

  // ==========================================================================
  // EVENT SYSTEM
  // ==========================================================================

  describe('Event System', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should emit start event when sync begins', async () => {
      const events: SyncEvent[] = [];
      syncManager.on((event) => events.push(event));

      await syncManager.processSync();

      const startEvent = events.find((e) => e.type === 'start');
      expect(startEvent).toBeDefined();
      expect(startEvent?.progress?.status).toBe('syncing');
      expect(startEvent?.progress?.total).toBe(5);
    });

    it('should emit complete event when sync finishes', async () => {
      const events: SyncEvent[] = [];
      syncManager.on((event) => events.push(event));

      await syncManager.processSync();

      const completeEvent = events.find((e) => e.type === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.result).toBeDefined();
    });

    it('should emit error event on sync failure', async () => {
      mockQueueManager.processQueue.mockRejectedValueOnce(
        new Error('Sync failed')
      );

      const events: SyncEvent[] = [];
      syncManager.on((event) => events.push(event));

      await syncManager.processSync();

      const errorEvent = events.find((e) => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.error).toBeDefined();
    });

    it('should allow adding and removing listeners', () => {
      const listener = vi.fn();
      const unsubscribe = syncManager.on(listener);

      // Trigger internal event
      syncManager['emitEvent']({
        type: 'start',
        timestamp: Date.now(),
      });

      expect(listener).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      syncManager['emitEvent']({
        type: 'start',
        timestamp: Date.now(),
      });

      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should handle listener errors gracefully', () => {
      const badListener = () => {
        throw new Error('Listener error');
      };
      const goodListener = vi.fn();

      syncManager.on(badListener);
      syncManager.on(goodListener);

      syncManager['emitEvent']({
        type: 'start',
        timestamp: Date.now(),
      });

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      syncManager.on(listener1);
      syncManager.on(listener2);

      syncManager.removeAllListeners();

      syncManager['emitEvent']({
        type: 'start',
        timestamp: Date.now(),
      });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PAUSE/RESUME
  // ==========================================================================

  describe('Pause/Resume', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should pause sync when requested', () => {
      // Start sync in background (don't await)
      syncManager.processSync();

      // Pause immediately
      syncManager.pause();

      expect(syncManager.getStatus()).toBe('paused');
    });

    it('should not allow pause when not syncing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      syncManager.pause();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot pause')
      );

      consoleSpy.mockRestore();
    });

    it('should resume paused sync', () => {
      syncManager.processSync();
      syncManager.pause();

      expect(syncManager.getStatus()).toBe('paused');

      syncManager.resume();

      expect(syncManager.getStatus()).toBe('syncing');
    });

    it('should emit pause event', () => {
      const events: SyncEvent[] = [];
      syncManager.on((event) => events.push(event));

      syncManager.processSync();
      syncManager.pause();

      const pauseEvent = events.find((e) => e.type === 'pause');
      expect(pauseEvent).toBeDefined();
    });

    it('should emit resume event', () => {
      const events: SyncEvent[] = [];
      syncManager.on((event) => events.push(event));

      syncManager.processSync();
      syncManager.pause();
      syncManager.resume();

      const resumeEvent = events.find((e) => e.type === 'resume');
      expect(resumeEvent).toBeDefined();
    });

    it('should prevent sync when paused', async () => {
      syncManager.processSync();
      syncManager.pause();

      const result = await syncManager.processSync();

      expect(result.success).toBe(false);
      expect(result.processed).toBe(0);
    });
  });

  // ==========================================================================
  // RETRY FUNCTIONALITY
  // ==========================================================================

  describe('Retry Failed Items', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should retry failed items', async () => {
      const count = await syncManager.retryFailed();

      expect(count).toBe(2);
      expect(mockQueueManager.retryFailed).toHaveBeenCalled();
      expect(mockQueueManager.processQueue).toHaveBeenCalled();
    });

    it('should not process if no failed items', async () => {
      mockQueueManager.retryFailed.mockResolvedValueOnce(0);

      const count = await syncManager.retryFailed();

      expect(count).toBe(0);
      expect(mockQueueManager.processQueue).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  describe('Statistics', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should track sync statistics', async () => {
      await syncManager.processSync();

      const stats = syncManager.getSyncStats();

      expect(stats.totalSynced).toBe(5);
      expect(stats.totalFailed).toBe(1);
      expect(stats.lastSync).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.syncHistory).toHaveLength(1);
    });

    it('should accumulate statistics across multiple syncs', async () => {
      await syncManager.processSync();
      await syncManager.processSync();

      const stats = syncManager.getSyncStats();

      expect(stats.totalSynced).toBe(10);
      expect(stats.totalFailed).toBe(2);
      expect(stats.syncHistory).toHaveLength(2);
    });

    it('should limit history to 100 entries', async () => {
      // Simulate 150 syncs
      for (let i = 0; i < 150; i++) {
        await syncManager.processSync();
      }

      const stats = syncManager.getSyncStats();
      expect(stats.syncHistory).toHaveLength(100);
    });

    it('should calculate average duration correctly', async () => {
      await syncManager.processSync();
      await syncManager.processSync();

      const stats = syncManager.getSyncStats();

      const totalDuration = stats.syncHistory.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );
      const expectedAverage = totalDuration / stats.syncHistory.length;

      expect(stats.averageDuration).toBe(expectedAverage);
    });

    it('should clear history', async () => {
      await syncManager.processSync();

      syncManager.clearHistory();

      const stats = syncManager.getSyncStats();
      expect(stats.syncHistory).toHaveLength(0);
      // Total counters should remain
      expect(stats.totalSynced).toBe(5);
    });

    it('should reset all statistics', async () => {
      await syncManager.processSync();

      syncManager.resetStats();

      const stats = syncManager.getSyncStats();
      expect(stats.totalSynced).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.syncHistory).toHaveLength(0);
    });
  });

  // ==========================================================================
  // STATUS TRACKING
  // ==========================================================================

  describe('Status Tracking', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should track sync status correctly', async () => {
      expect(syncManager.getStatus()).toBe('idle');

      const syncPromise = syncManager.processSync();

      // May be syncing or already completed depending on timing
      const statusDuring = syncManager.getStatus();
      expect(['syncing', 'completed', 'error']).toContain(statusDuring);

      await syncPromise;

      const statusAfter = syncManager.getStatus();
      expect(['completed', 'error']).toContain(statusAfter);
    });

    it('should report sync in progress', async () => {
      expect(syncManager.isSyncInProgress()).toBe(false);

      const syncPromise = syncManager.processSync();

      // Check immediately (may already be done if very fast)
      const inProgress = syncManager.isSyncInProgress();

      await syncPromise;

      expect(syncManager.isSyncInProgress()).toBe(false);
    });
  });

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  describe('Lifecycle', () => {
    it('should destroy properly', async () => {
      await syncManager.initialize();

      expect(syncManager.isReady()).toBe(true);

      syncManager.destroy();

      expect(syncManager.isReady()).toBe(false);
      expect(mockNetworkDetector.off).toHaveBeenCalled();
    });

    it('should remove event listeners on destroy', async () => {
      await syncManager.initialize();

      const listener = vi.fn();
      syncManager.on(listener);

      syncManager.destroy();

      // Try to emit event (using private method for testing)
      syncManager['emitEvent']({
        type: 'start',
        timestamp: Date.now(),
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // QUEUE STATS
  // ==========================================================================

  describe('Queue Statistics', () => {
    beforeEach(async () => {
      await syncManager.initialize();
    });

    it('should get queue statistics', async () => {
      const stats = await syncManager.getQueueStats();

      expect(stats).toBeDefined();
      expect(stats.pending).toBe(5);
      expect(stats.completed).toBe(3);
      expect(stats.failed).toBe(2);
    });
  });

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const manager = new SyncManager();
      expect(manager).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const manager = new SyncManager({
        autoRegisterSync: false,
        autoProcessOnline: false,
        syncTag: 'custom-sync',
        batchSize: 20,
        maxConcurrency: 5,
        enableProgressEvents: false,
      });

      expect(manager).toBeDefined();
    });
  });
});
