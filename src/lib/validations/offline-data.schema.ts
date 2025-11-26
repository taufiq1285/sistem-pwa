/**
 * Offline Data Validation Schemas
 *
 * Purpose: Zod schemas for validating offline data structures
 * Priority: Medium
 * Dependencies: zod
 */

import { z } from 'zod';

/**
 * Sync Operation Schema
 */
export const SyncOperationSchema = z.enum(['create', 'update', 'delete']);

/**
 * Sync Status Schema
 */
export const SyncStatusSchema = z.enum(['pending', 'syncing', 'completed', 'failed']);

/**
 * Sync Entity Schema
 */
export const SyncEntitySchema = z.enum([
  'kuis',
  'kuis_soal',
  'kuis_jawaban',
  'nilai',
  'materi',
  'kelas',
  'user',
]);

/**
 * Offline Queue Item Schema
 */
export const OfflineQueueItemSchema = z.object({
  id: z.string(),
  entity: SyncEntitySchema,
  operation: SyncOperationSchema,
  data: z.record(z.string(), z.unknown()),
  timestamp: z.number(),
  status: SyncStatusSchema,
  retryCount: z.number().min(0),
  error: z.string().optional(),
});

/**
 * Sync Metadata Schema
 */
export const SyncMetadataSchema = z.object({
  lastSyncTime: z.number(),
  pendingChanges: z.number().min(0),
  failedChanges: z.number().min(0),
  nextSyncTime: z.number().optional(),
  syncEnabled: z.boolean(),
});

/**
 * Cached Data Schema
 */
export const CachedDataSchema = z.object({
  key: z.string(),
  data: z.unknown(),
  timestamp: z.number(),
  expiresAt: z.number().optional(),
  version: z.number().default(1),
});

/**
 * Offline Kuis Schema
 */
export const OfflineKuisSchema = z.object({
  id: z.string(),
  judul: z.string(),
  deskripsi: z.string().nullable(),
  kelas_id: z.string(),
  dosen_id: z.string(),
  tipe_kuis: z.enum(['kuis', 'uts', 'uas']),
  waktu_mulai: z.string(),
  waktu_selesai: z.string(),
  durasi_menit: z.number().nullable(),
  passing_grade: z.number(),
  is_published: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  _offline_created: z.boolean().optional(),
  _offline_updated: z.boolean().optional(),
  _last_synced: z.number().optional(),
});

/**
 * Offline Kuis Soal Schema
 */
export const OfflineKuisSoalSchema = z.object({
  id: z.string(),
  kuis_id: z.string(),
  nomor_soal: z.number(),
  tipe_soal: z.enum(['pilihan_ganda', 'esai', 'isian_singkat']),
  pertanyaan: z.string(),
  poin: z.number(),
  pilihan_jawaban: z.record(z.string(), z.unknown()).nullable(),
  jawaban_benar: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  _offline_created: z.boolean().optional(),
  _offline_updated: z.boolean().optional(),
  _last_synced: z.number().optional(),
});

/**
 * Offline Kuis Jawaban Schema
 */
export const OfflineKuisJawabanSchema = z.object({
  id: z.string(),
  kuis_id: z.string(),
  soal_id: z.string(),
  mahasiswa_id: z.string(),
  jawaban: z.string().nullable(),
  poin_diperoleh: z.number().nullable(),
  is_correct: z.boolean().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  _offline_created: z.boolean().optional(),
  _offline_updated: z.boolean().optional(),
  _last_synced: z.number().optional(),
});

/**
 * Database Metadata Schema
 */
export const DatabaseMetadataSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updated_at: z.number(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate offline queue item
 * @param data - Data to validate
 * @returns Validated queue item or throws error
 */
export function validateOfflineQueue(data: unknown) {
  return OfflineQueueItemSchema.parse(data);
}

/**
 * Safely validate offline queue item
 * @param data - Data to validate
 * @returns Validation result with success status
 */
export function safeValidateOfflineQueue(data: unknown) {
  return OfflineQueueItemSchema.safeParse(data);
}

/**
 * Validate sync metadata
 * @param data - Data to validate
 * @returns Validated metadata or throws error
 */
export function validateSyncMetadata(data: unknown) {
  return SyncMetadataSchema.parse(data);
}

/**
 * Safely validate sync metadata
 * @param data - Data to validate
 * @returns Validation result with success status
 */
export function safeValidateSyncMetadata(data: unknown) {
  return SyncMetadataSchema.safeParse(data);
}

/**
 * Validate cached data
 * @param data - Data to validate
 * @returns Validated cached data or throws error
 */
export function validateCachedData(data: unknown) {
  return CachedDataSchema.parse(data);
}

/**
 * Safely validate cached data
 * @param data - Data to validate
 * @returns Validation result with success status
 */
export function safeValidateCachedData(data: unknown) {
  return CachedDataSchema.safeParse(data);
}

/**
 * Validate offline kuis data
 * @param data - Data to validate
 * @returns Validated kuis or throws error
 */
export function validateOfflineKuis(data: unknown) {
  return OfflineKuisSchema.parse(data);
}

/**
 * Validate offline kuis soal data
 * @param data - Data to validate
 * @returns Validated soal or throws error
 */
export function validateOfflineKuisSoal(data: unknown) {
  return OfflineKuisSoalSchema.parse(data);
}

/**
 * Validate offline kuis jawaban data
 * @param data - Data to validate
 * @returns Validated jawaban or throws error
 */
export function validateOfflineKuisJawaban(data: unknown) {
  return OfflineKuisJawabanSchema.parse(data);
}

// Export all schemas
export default {
  SyncOperationSchema,
  SyncStatusSchema,
  SyncEntitySchema,
  OfflineQueueItemSchema,
  SyncMetadataSchema,
  CachedDataSchema,
  OfflineKuisSchema,
  OfflineKuisSoalSchema,
  OfflineKuisJawabanSchema,
  DatabaseMetadataSchema,
};
