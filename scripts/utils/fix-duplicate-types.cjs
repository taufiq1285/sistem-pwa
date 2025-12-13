const fs = require('fs');
const path = require('path');

const fixes = [
  // Fix 1: common.types.ts - remove ApiResponse duplicate
  {
    file: 'src/types/common.types.ts',
    find: `export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}`,
    replace: `export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Re-export ApiResponse from api.types.ts to avoid duplication
export type { ApiResponse } from './api.types';

export interface SelectOption {
  label: string;
  value: string;
}`
  },

  // Fix 2: dosen.types.ts - remove MataKuliahWithStats duplicate
  {
    file: 'src/types/dosen.types.ts',
    find: `/**
 * Dosen Types
 * Types for dosen dashboard and management
 */

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DosenStats {
  totalKelas: number;
  totalMahasiswa: number;
  activeKuis: number;
  pendingGrading: number;
}

// ============================================================================
// COURSE & CLASS DATA
// ============================================================================

export interface MataKuliahWithStats {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  totalKelas: number;
  totalMahasiswa: number;
  is_active: boolean;
}`,
    replace: `/**
 * Dosen Types
 * Types for dosen dashboard and management
 */

// Re-export MataKuliahWithStats from mata-kuliah.types.ts to avoid duplication
export type { MataKuliahWithStats } from './mata-kuliah.types';

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export interface DosenStats {
  totalKelas: number;
  totalMahasiswa: number;
  activeKuis: number;
  pendingGrading: number;
}

// ============================================================================
// COURSE & CLASS DATA
// ============================================================================`
  },

  // Fix 3: sync.types.ts - remove SyncConfig, SyncResult, SyncConflict duplicates
  {
    file: 'src/types/sync.types.ts',
    find: `/**
 * Sync Types
 *
 * Re-exports from offline.types.ts with additional sync-specific types
 * for data synchronization between local and remote storage
 */

// Re-export main sync types from offline.types
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
} from './offline.types';

// ============================================================================
// ADDITIONAL SYNC TYPES
// ============================================================================

/**
 * Sync result for a single entity
 */
export interface SyncResult {
  entity: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Sync batch result
 */
export interface SyncBatchResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
  duration: number; // milliseconds
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
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
 * Sync conflict
 */
export interface SyncConflict {
  id: string;
  entity: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  localTimestamp: number;
  remoteTimestamp: number;
  resolution?: 'local' | 'remote' | 'manual';
}`,
    replace: `/**
 * Sync Types
 *
 * Re-exports from offline.types.ts with additional sync-specific types
 * for data synchronization between local and remote storage
 */

// Re-export main sync types from offline.types (including SyncConfig, SyncResult, SyncConflict)
export type {
  SyncOperation,
  SyncStatus,
  SyncEntity,
  SyncQueueItem,
  SyncConfig,
  SyncResult,
  SyncConflict,
} from './offline.types';

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
  results: Array<{ entity: string; success: boolean; error?: string; timestamp: number }>;
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
}`
  }
];

console.log('Fixing duplicate type exports...\n');

fixes.forEach(({ file, find, replace }) => {
  const filePath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(find)) {
      content = content.replace(find, replace);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${file}`);
    } else {
      console.log(`⚠ Skipped: ${file} (pattern not found or already fixed)`);
    }
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone!');
