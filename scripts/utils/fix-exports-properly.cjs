const fs = require('fs');
const path = require('path');

console.log('Fixing export conflicts properly...\n');

// Fix 1: sync.types.ts - DON'T re-export conflicting types, only import them
const syncTypesPath = path.join(__dirname, 'src/types/sync.types.ts');
const syncTypesContent = `/**
 * Sync Types
 *
 * Re-exports from offline.types.ts with additional sync-specific types
 * for data synchronization between local and remote storage
 */

// Re-export non-conflicting types from offline.types
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
} from './offline.types';

// Import (but don't re-export) from offline.types to avoid conflicts
// Use these types from offline.types directly
import type { SyncConfig, SyncResult, SyncConflict } from './offline.types';

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
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'sync_item_success'
  | 'sync_item_failed'
  | 'sync_conflict_detected';

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
`;

fs.writeFileSync(syncTypesPath, syncTypesContent, 'utf8');
console.log('✓ Fixed: sync.types.ts');

// Fix 2: user.types.ts - proper import AND re-export
const userTypesPath = path.join(__dirname, 'src/types/user.types.ts');
let userTypes = fs.readFileSync(userTypesPath, 'utf8');

// Replace the import/export section
userTypes = userTypes.replace(
  /\/\/.*Re-export.*\n.*export type \{.*\} from '\.\/auth\.types';/,
  `// Re-export types from auth.types for convenience
export type { UserRole, AuthUser, RegisterData, RegisterableRole } from './auth.types';`
);

fs.writeFileSync(userTypesPath, userTypes, 'utf8');
console.log('✓ Fixed: user.types.ts');

// Fix 3: peminjaman.types.ts - proper import AND re-export
const peminjamanTypesPath = path.join(__dirname, 'src/types/peminjaman.types.ts');
let peminjamanTypes = fs.readFileSync(peminjamanTypesPath, 'utf8');

// Replace the import/export section
peminjamanTypes = peminjamanTypes.replace(
  /\/\/.*Re-export.*\n.*export type \{.*\} from '\.\/inventaris\.types';/,
  `// Re-export types from inventaris.types for convenience
export type { Inventaris, Peminjaman, CreatePeminjamanData, EquipmentCondition, BorrowingStatus } from './inventaris.types';`
);

fs.writeFileSync(peminjamanTypesPath, peminjamanTypes, 'utf8');
console.log('✓ Fixed: peminjaman.types.ts');

console.log('\nAll export conflicts resolved!');
