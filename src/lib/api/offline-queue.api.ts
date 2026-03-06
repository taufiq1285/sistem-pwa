/**
 * Offline Queue API
 *
 * Helper functions untuk menambahkan operasi ke sync queue saat offline.
 * Digunakan oleh fitur-fitur yang perlu mendukung offline mode.
 */

import { queueManager } from "@/lib/offline/queue-manager";
import { networkDetector } from "@/lib/offline/network-detector";
import type { SyncEntity, SyncOperation } from "@/types/offline.types";

/**
 * Tambah operasi ke offline queue.
 * Gunakan ini sebagai fallback saat network tidak tersedia.
 */
export async function enqueueOfflineOperation(
  entity: SyncEntity,
  operation: SyncOperation,
  data: Record<string, unknown>,
): Promise<string> {
  if (!queueManager.isReady()) {
    await queueManager.initialize();
  }
  const item = await queueManager.enqueue(entity, operation, data);
  return item.id;
}

/**
 * Cek apakah jaringan tersedia.
 * Berguna untuk memutuskan apakah langsung ke Supabase atau ke queue.
 */
export function isNetworkAvailable(): boolean {
  if (!networkDetector.isReady()) {
    // Fallback ke navigator.onLine jika detector belum init
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }
  return networkDetector.isOnline();
}

/**
 * Smart execute: jalankan operasi online, atau queue jika offline.
 *
 * @param onlineAction - Fungsi async yang melakukan operasi ke Supabase
 * @param entity - Jenis entitas untuk queue
 * @param operation - Jenis operasi (create/update/delete)
 * @param data - Data payload
 * @returns { queued: boolean, queueId?: string }
 *
 * @example
 * ```ts
 * const result = await executeOrQueue(
 *   () => supabase.from('nilai').insert(payload),
 *   'nilai', 'create', payload
 * );
 * if (result.queued) {
 *   toast.info('Tersimpan lokal, akan disinkronkan saat online.');
 * }
 * ```
 */
export async function executeOrQueue(
  onlineAction: () => Promise<void>,
  entity: SyncEntity,
  operation: SyncOperation,
  data: Record<string, unknown>,
): Promise<{ queued: boolean; queueId?: string }> {
  if (isNetworkAvailable()) {
    await onlineAction();
    return { queued: false };
  }

  const queueId = await enqueueOfflineOperation(entity, operation, data);
  return { queued: true, queueId };
}

/**
 * Ambil statistik queue saat ini.
 */
export async function getOfflineQueueStats() {
  if (!queueManager.isReady()) {
    await queueManager.initialize();
  }
  return queueManager.getStats();
}
