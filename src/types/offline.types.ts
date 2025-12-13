/**
 * Offline Types
 *
 * Type definitions for offline functionality using IndexedDB
 */

// ============================================================================
// SYNC QUEUE TYPES
// ============================================================================

/**
 * Sync operation types
 */
export type SyncOperation = "create" | "update" | "delete";

/**
 * Sync status
 */
export type SyncStatus = "pending" | "syncing" | "completed" | "failed";

/**
 * Entity types that can be synced
 */
export type SyncEntity =
  | "kuis"
  | "kuis_soal"
  | "kuis_jawaban"
  | "nilai"
  | "materi"
  | "kelas"
  | "user";

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  error?: string;
}

// ============================================================================
// OFFLINE STORAGE TYPES
// ============================================================================

/**
 * Offline Kuis (Quiz)
 */
export interface OfflineKuis {
  id: string;
  judul: string;
  deskripsi: string | null;
  kelas_id: string;
  dosen_id: string;
  tipe_kuis: "kuis" | "uts" | "uas";
  waktu_mulai: string;
  waktu_selesai: string;
  durasi_menit: number | null;
  passing_grade: number;
  is_published: boolean;
  created_at: string;
  updated_at: string | null;
  // Metadata for offline
  _offline_created?: boolean;
  _offline_updated?: boolean;
  _last_synced?: number;
}

/**
 * Offline Kuis Soal (Quiz Question)
 */
export interface OfflineKuisSoal {
  id: string;
  kuis_id: string;
  nomor_soal: number;
  tipe_soal: "pilihan_ganda" | "esai" | "isian_singkat";
  pertanyaan: string;
  poin: number;
  pilihan_jawaban: Record<string, unknown> | null;
  jawaban_benar: string | null;
  created_at: string;
  updated_at: string | null;
  // Metadata
  _offline_created?: boolean;
  _offline_updated?: boolean;
  _last_synced?: number;
}

/**
 * Offline Kuis Jawaban (Quiz Answer)
 */
export interface OfflineKuisJawaban {
  id: string;
  kuis_id: string;
  soal_id: string;
  mahasiswa_id: string;
  jawaban: string | null;
  poin_diperoleh: number | null;
  is_correct: boolean | null;
  created_at: string;
  updated_at: string | null;
  // Metadata
  _offline_created?: boolean;
  _offline_updated?: boolean;
  _last_synced?: number;
}

/**
 * Offline Nilai (Grade)
 */
export interface OfflineNilai {
  id: string;
  mahasiswa_id: string;
  kelas_id: string;
  nilai_kuis: number;
  nilai_tugas: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_praktikum: number;
  nilai_kehadiran: number;
  nilai_akhir: number | null;
  nilai_huruf: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string | null;
  // Metadata
  _offline_created?: boolean;
  _offline_updated?: boolean;
  _last_synced?: number;
}

/**
 * Offline Materi (Material)
 */
export interface OfflineMateri {
  id: string;
  judul: string;
  deskripsi: string | null;
  kelas_id: string;
  dosen_id: string;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  order_number: number;
  is_published: boolean;
  created_at: string;
  updated_at: string | null;
  // Metadata
  _offline_created?: boolean;
  _offline_updated?: boolean;
  _last_synced?: number;
  _offline_file_data?: string; // Base64 encoded file for offline
}

/**
 * Offline Kelas (Class)
 */
export interface OfflineKelas {
  id: string;
  nama_kelas: string;
  kode_kelas: string | null;
  mata_kuliah_id: string | null;
  dosen_id: string | null;
  ruangan: string | null;
  kuota: number | null;
  is_active: boolean | null;
  semester_ajaran: number;
  tahun_ajaran: string;
  bobot_nilai: Record<string, number> | null;
  created_at: string;
  updated_at: string | null;
  // Metadata
  _last_synced?: number;
}

/**
 * Offline User
 */
export interface OfflineUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "dosen" | "mahasiswa";
  created_at: string;
  // Metadata
  _last_synced?: number;
}

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

/**
 * IndexedDB Store Names
 */
export type StoreName =
  | "kuis"
  | "kuis_soal"
  | "kuis_jawaban"
  | "nilai"
  | "materi"
  | "kelas"
  | "users"
  | "sync_queue"
  | "metadata"
  | "offline_quiz"
  | "offline_questions"
  | "offline_answers"
  | "offline_attempts";

/**
 * Database metadata
 */
export interface DatabaseMetadata {
  key: string;
  value: unknown;
  updated_at: number;
}

/**
 * Common metadata keys
 */
export type MetadataKey =
  | "last_full_sync"
  | "last_partial_sync"
  | "db_version"
  | "user_id"
  | "sync_enabled";

// ============================================================================
// INDEXEDDB MANAGER TYPES
// ============================================================================

/**
 * IndexedDB configuration
 */
export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: StoreConfig[];
}

/**
 * Store configuration
 */
export interface StoreConfig {
  name: StoreName;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

/**
 * Index configuration
 */
export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

/**
 * Query options
 */
export interface QueryOptions {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T> {
  success: boolean;
  data?: T[];
  failed?: Array<{ item: T; error: Error }>;
  count: number;
}

// ============================================================================
// SYNC MANAGER TYPES
// ============================================================================

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  batchSize: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  timestamp: number;
}

/**
 * Conflict resolution strategy
 */
export type ConflictStrategy =
  | "server-wins"
  | "client-wins"
  | "last-write-wins"
  | "manual";

/**
 * Sync conflict
 */
export interface SyncConflict<T = unknown> {
  id: string;
  entity: SyncEntity;
  localData: T;
  serverData: T;
  localTimestamp: number;
  serverTimestamp: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * IndexedDB Error
 */
export interface IndexedDBError {
  name: string;
  message: string;
  code: string;
  originalError?: Error;
}

/**
 * Sync Error
 */
export interface SyncError {
  name: string;
  message: string;
  entity: SyncEntity;
  operation: SyncOperation;
  originalError?: Error;
}
