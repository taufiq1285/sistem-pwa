/**
 * Sync Management API for Admin
 * Fetches offline sync and queue statistics
 */

import { syncManager } from '@/lib/offline/sync-manager';
import type { QueueStats } from '@/lib/offline/queue-manager';
import type { SyncStats } from '@/lib/offline/sync-manager';
import {
  requirePermission,
  requirePermissionAndOwnership,
} from '@/lib/middleware';

export interface SyncManagementStats {
  pendingSync: number;
  synced: number;
  failed: number;
  conflicts: number;
  lastSync: string;
  queueStats: QueueStats;
  syncStats: SyncStats;
}

/**
 * Get comprehensive sync management statistics
 */
export async function getSyncManagementStats(): Promise<SyncManagementStats> {
  try {
    const queueStats = await syncManager.getQueueStats();
    const syncStats = syncManager.getSyncStats();

    // Format last sync time
    const lastSync = syncStats.lastSync
      ? new Date(syncStats.lastSync).toLocaleString()
      : 'Never';

    return {
      pendingSync: queueStats.pending,
      synced: queueStats.completed,
      failed: queueStats.failed,
      conflicts: 0, // TODO: implement conflict detection
      lastSync,
      queueStats,
      syncStats,
    };
  } catch (error) {
    console.error('Error fetching sync stats:', error);
    return {
      pendingSync: 0,
      synced: 0,
      failed: 0,
      conflicts: 0,
      lastSync: 'Never',
      queueStats: { total: 0, pending: 0, syncing: 0, completed: 0, failed: 0 },
      syncStats: { totalSynced: 0, totalFailed: 0, averageDuration: 0, syncHistory: [] },
    };
  }
}

/**
 * Force trigger sync process
 */
async function forceSyncNowImpl(): Promise<void> {
  try {
    await syncManager.processSync();
  } catch (error) {
    console.error('Error forcing sync:', error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires manage:sync permission
export const forceSyncNow = requirePermission('manage:sync', forceSyncNowImpl);


