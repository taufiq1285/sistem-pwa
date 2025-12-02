/**
 * Sync API Unit Tests
 * Tests for offline sync management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSyncManagementStats, forceSyncNow } from '../../../lib/api/sync.api';

vi.mock('../../../lib/offline/sync-manager', () => ({
  syncManager: {
    getQueueStats: vi.fn(),
    getSyncStats: vi.fn(),
    processSync: vi.fn(),
  },
}));

vi.mock('../../../lib/middleware', () => ({
  requirePermission: vi.fn((permission, fn) => fn),
}));

import { syncManager } from '../../../lib/offline/sync-manager';

describe('Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSyncManagementStats', () => {
    it('should return sync statistics', async () => {
      vi.mocked(syncManager.getQueueStats).mockResolvedValue({
        total: 100,
        pending: 10,
        syncing: 5,
        completed: 80,
        failed: 5,
      });

      vi.mocked(syncManager.getSyncStats).mockReturnValue({
        totalSynced: 80,
        totalFailed: 5,
        lastSync: Date.now(),
        averageDuration: 100,
        syncHistory: [],
      });

      const result = await getSyncManagementStats();

      expect(result).toHaveProperty('pendingSync', 10);
      expect(result).toHaveProperty('synced', 80);
      expect(result).toHaveProperty('failed', 5);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(syncManager.getQueueStats).mockRejectedValue(new Error('Sync error'));

      const result = await getSyncManagementStats();

      expect(result.pendingSync).toBe(0);
    });
  });

  describe('forceSyncNow', () => {
    it('should trigger sync process', async () => {
      vi.mocked(syncManager.processSync).mockResolvedValue();

      await forceSyncNow();

      expect(syncManager.processSync).toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      vi.mocked(syncManager.processSync).mockRejectedValue(new Error('Sync failed'));

      await expect(forceSyncNow()).rejects.toThrow();
    });
  });
});
