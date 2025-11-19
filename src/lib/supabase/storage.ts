/**
 * Supabase Storage Helpers
 *
 * Purpose: Handle file operations with Supabase Storage
 * Features:
 * - Upload files with progress tracking
 * - Download files
 * - Delete files
 * - Generate unique file names
 * - Get file metadata
 * - List files in folder
 */

import { supabase } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadOptions {
  /**
   * Cache control header (seconds)
   */
  cacheControl?: string;

  /**
   * Overwrite existing file
   */
  upsert?: boolean;

  /**
   * Progress callback (0-100)
   */
  onProgress?: (progress: number) => void;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_BUCKETS = {
  MATERI: 'materi',
  AVATARS: 'avatars',
  UPLOADS: 'uploads',
} as const;

/**
 * Allowed file types for materi
 */
export const ALLOWED_MATERI_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Video
  'video/mp4',
  'video/webm',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
];

/**
 * Max file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Upload file to storage bucket
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const { cacheControl = '3600', upsert = false, onProgress } = options;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl,
      upsert,
    });

  if (error) throw error;

  // Simulate progress (Supabase doesn't support progress callback yet)
  if (onProgress) {
    onProgress(100);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Upload materi file with validation
 */
export async function uploadMateriFile(
  kelasId: string,
  dosenId: string,
  file: File,
  options?: UploadOptions
): Promise<{ url: string; path: string }> {
  // Validate file type
  if (!ALLOWED_MATERI_TYPES.includes(file.type)) {
    throw new Error(
      `Tipe file tidak diizinkan. File harus berupa dokumen, gambar, video, atau arsip.`
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  // Generate unique file path
  const fileName = generateUniqueFileName(file.name);
  const filePath = `${kelasId}/${dosenId}/${fileName}`;

  // Upload file
  const url = await uploadFile(STORAGE_BUCKETS.MATERI, filePath, file, options);

  return { url, path: filePath };
}

// ============================================================================
// FILE DOWNLOAD
// ============================================================================

/**
 * Download file from storage
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) throw error;
  if (!data) throw new Error('File tidak ditemukan');

  return data;
}

/**
 * Download file and trigger browser download
 */
export async function downloadFileAsBlob(
  bucket: string,
  path: string,
  fileName?: string
): Promise<void> {
  const blob = await downloadFile(bucket, path);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || path.split('/').pop() || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

// ============================================================================
// FILE DELETE
// ============================================================================

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

// ============================================================================
// FILE INFO
// ============================================================================

/**
 * Get file public URL
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  bucket: string,
  path: string
): Promise<FileMetadata> {
  const { data, error } = await supabase.storage.from(bucket).list(
    path.substring(0, path.lastIndexOf('/')),
    {
      limit: 1,
      search: path.split('/').pop(),
    }
  );

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('File tidak ditemukan');

  const file = data[0];
  const url = getFileUrl(bucket, path);

  return {
    name: file.name,
    size: file.metadata?.size || 0,
    type: file.metadata?.mimetype || '',
    lastModified: new Date(file.updated_at || file.created_at).getTime(),
    url,
  };
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: string,
  folderPath: string = ''
): Promise<FileMetadata[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folderPath);

  if (error) throw error;
  if (!data) return [];

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size || 0,
    type: file.metadata?.mimetype || '',
    lastModified: new Date(file.updated_at || file.created_at).getTime(),
    url: getFileUrl(bucket, `${folderPath}/${file.name}`),
  }));
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate unique file name with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(`.${extension}`, '');

  // Clean file name (remove special characters)
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);

  return `${cleanName}_${timestamp}_${random}.${extension}`;
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get file type category
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  if (mimeType.startsWith('text/')) return 'text';
  return 'other';
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}