/**
 * Materi API
 *
 * Purpose: Handle learning materials operations
 * Features:
 * - CRUD operations for materi
 * - File upload/download integration
 * - Filter by kelas, dosen, minggu
 * - Download count tracking
 * - Materi publication
 */

import {
  query,
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
  withApiResponse,
} from './base.api';
import type { Materi, CreateMateriData } from '@/types/materi.types';
import {
  uploadMateriFile,
  deleteFile,
  downloadFileAsBlob,
  STORAGE_BUCKETS,
  type UploadOptions,
} from '@/lib/supabase/storage';
import { handleError, logError } from '@/lib/utils/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface MateriFilters {
  kelas_id?: string;
  dosen_id?: string;
  minggu_ke?: number;
  is_active?: boolean;
  search?: string;
}

export interface UploadMateriData {
  kelas_id: string;
  dosen_id: string;
  judul: string;
  deskripsi?: string;
  file: File;
  minggu_ke?: number;
  is_downloadable?: boolean;
}

// ============================================================================
// MATERI CRUD OPERATIONS
// ============================================================================

/**
 * Get all materi with filters
 */
export async function getMateri(filters?: MateriFilters): Promise<Materi[]> {
  try {
    const filterConditions = [];

    if (filters?.kelas_id) {
      filterConditions.push({
        column: 'kelas_id',
        operator: 'eq' as const,
        value: filters.kelas_id,
      });
    }

    if (filters?.dosen_id) {
      filterConditions.push({
        column: 'dosen_id',
        operator: 'eq' as const,
        value: filters.dosen_id,
      });
    }

    if (filters?.minggu_ke !== undefined) {
      filterConditions.push({
        column: 'minggu_ke',
        operator: 'eq' as const,
        value: filters.minggu_ke,
      });
    }

    if (filters?.is_active !== undefined) {
      filterConditions.push({
        column: 'is_active',
        operator: 'eq' as const,
        value: filters.is_active,
      });
    }

    const options = {
      select: `
        *,
        kelas:kelas_id (
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          ),
          gelar_depan,
          gelar_belakang
        )
      `,
      order: {
        column: 'created_at',
        ascending: false,
      },
    };

    const data =
      filterConditions.length > 0
        ? await queryWithFilters<Materi>('materi', filterConditions, options)
        : await query<Materi>('materi', options);

    // Client-side search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return data.filter(
        (m) =>
          m.judul.toLowerCase().includes(searchLower) ||
          m.deskripsi?.toLowerCase().includes(searchLower)
      );
    }

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'getMateri');
    throw apiError;
  }
}

/**
 * Get materi by ID
 */
export async function getMateriById(id: string): Promise<Materi> {
  try {
    return await getById<Materi>('materi', id, {
      select: `
        *,
        kelas:kelas_id (
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          ),
          gelar_depan,
          gelar_belakang
        )
      `,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMateriById:${id}`);
    throw apiError;
  }
}

/**
 * Get materi by kelas
 */
export async function getMateriByKelas(kelasId: string): Promise<Materi[]> {
  try {
    return await getMateri({ kelas_id: kelasId, is_active: true });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMateriByKelas:${kelasId}`);
    throw apiError;
  }
}

/**
 * Get materi by dosen
 */
export async function getMateriByDosen(dosenId: string): Promise<Materi[]> {
  try {
    return await getMateri({ dosen_id: dosenId });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMateriByDosen:${dosenId}`);
    throw apiError;
  }
}

/**
 * Create materi with file upload
 */
export async function createMateri(
  data: UploadMateriData,
  uploadOptions?: UploadOptions
): Promise<Materi> {
  try {
    // Upload file to storage
    const { url } = await uploadMateriFile(
      data.kelas_id,
      data.dosen_id,
      data.file,
      uploadOptions
    );

    // Create materi record
    const materiData: CreateMateriData = {
      kelas_id: data.kelas_id,
      dosen_id: data.dosen_id,
      judul: data.judul,
      deskripsi: data.deskripsi,
      tipe_file: data.file.type,
      file_url: url,
      file_size: data.file.size,
      minggu_ke: data.minggu_ke,
      is_downloadable: data.is_downloadable ?? true,
    };

    const materi = await insert<Materi>('materi', materiData);

    return materi;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, 'createMateri');
    throw apiError;
  }
}

/**
 * Update materi metadata (without file)
 */
export async function updateMateri(
  id: string,
  data: Partial<CreateMateriData>
): Promise<Materi> {
  try {
    return await update<Materi>('materi', id, data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateMateri:${id}`);
    throw apiError;
  }
}

/**
 * Delete materi (including file from storage)
 */
export async function deleteMateri(id: string): Promise<boolean> {
  try {
    // Get materi to get file path
    const materi = await getMateriById(id);

    // Extract file path from URL
    const urlParts = materi.file_url.split('/');
    const bucketIndex = urlParts.findIndex((part) =>
      part.includes(STORAGE_BUCKETS.MATERI)
    );
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Delete file from storage
    if (filePath) {
      try {
        await deleteFile(STORAGE_BUCKETS.MATERI, filePath);
      } catch (err) {
        console.warn('Failed to delete file from storage:', err);
        // Continue even if storage deletion fails
      }
    }

    // Delete materi record
    return await remove('materi', id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteMateri:${id}`);
    throw apiError;
  }
}

// ============================================================================
// MATERI DOWNLOAD
// ============================================================================

/**
 * Download materi file
 */
export async function downloadMateri(id: string): Promise<void> {
  try {
    const materi = await getMateriById(id);

    // Extract file path from URL
    const urlParts = materi.file_url.split('/');
    const bucketIndex = urlParts.findIndex((part) =>
      part.includes(STORAGE_BUCKETS.MATERI)
    );
    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    if (!filePath) {
      throw new Error('File path tidak valid');
    }

    // Download file
    await downloadFileAsBlob(STORAGE_BUCKETS.MATERI, filePath, materi.judul);

    // Increment download count
    await incrementDownloadCount(id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `downloadMateri:${id}`);
    throw apiError;
  }
}

/**
 * Increment download count
 */
export async function incrementDownloadCount(id: string): Promise<void> {
  try {
    const materi = await getMateriById(id);
    await updateMateri(id, {
      // @ts-ignore - download_count exists in database but not in type
      download_count: (materi as any).download_count + 1,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `incrementDownloadCount:${id}`);
    // Don't throw error, just log it
  }
}

// ============================================================================
// MATERI PUBLICATION
// ============================================================================

/**
 * Publish materi (make it visible to students)
 */
export async function publishMateri(id: string): Promise<Materi> {
  try {
    return await updateMateri(id, {
      // @ts-ignore - is_active and published_at exist in database
      is_active: true,
      published_at: new Date().toISOString(),
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `publishMateri:${id}`);
    throw apiError;
  }
}

/**
 * Unpublish materi (hide from students)
 */
export async function unpublishMateri(id: string): Promise<Materi> {
  try {
    return await updateMateri(id, {
      // @ts-ignore - is_active exists in database
      is_active: false,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `unpublishMateri:${id}`);
    throw apiError;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get materi statistics by kelas
 */
export async function getMateriStatsByKelas(
  kelasId: string
): Promise<{
  total: number;
  published: number;
  draft: number;
  total_downloads: number;
}> {
  try {
    const materiList = await getMateriByKelas(kelasId);

    const total = materiList.length;
    const published = materiList.filter((m) => (m as any).is_active === true)
      .length;
    const draft = total - published;
    const total_downloads = materiList.reduce(
      (sum, m) => sum + ((m as any).download_count || 0),
      0
    );

    return {
      total,
      published,
      draft,
      total_downloads,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMateriStatsByKelas:${kelasId}`);
    throw apiError;
  }
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export const materiApi = {
  getAll: (filters?: MateriFilters) => withApiResponse(() => getMateri(filters)),
  getById: (id: string) => withApiResponse(() => getMateriById(id)),
  getByKelas: (kelasId: string) =>
    withApiResponse(() => getMateriByKelas(kelasId)),
  getByDosen: (dosenId: string) =>
    withApiResponse(() => getMateriByDosen(dosenId)),
  create: (data: UploadMateriData, uploadOptions?: UploadOptions) =>
    withApiResponse(() => createMateri(data, uploadOptions)),
  update: (id: string, data: Partial<CreateMateriData>) =>
    withApiResponse(() => updateMateri(id, data)),
  delete: (id: string) => withApiResponse(() => deleteMateri(id)),
  download: (id: string) => withApiResponse(() => downloadMateri(id)),
  publish: (id: string) => withApiResponse(() => publishMateri(id)),
  unpublish: (id: string) => withApiResponse(() => unpublishMateri(id)),
  getStats: (kelasId: string) =>
    withApiResponse(() => getMateriStatsByKelas(kelasId)),
};
