/**
 * Laporan Storage API
 *
 * Purpose: Upload/download file laporan mahasiswa ke Supabase Storage
 * Bucket: 'laporan'
 * Path structure: {kelas_id}/{mahasiswa_id}/{attempt_id}/{filename}
 */

import { supabase } from "@/lib/supabase/client";
import type { UploadedFile } from "@/components/features/kuis/FileUpload";

// ============================================================================
// CONSTANTS
// ============================================================================

const BUCKET_NAME = "laporan";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/zip",
];

// ============================================================================
// TYPES
// ============================================================================

interface UploadLaporanParams {
  file: File;
  kelasId: string;
  mahasiswaId: string;
  attemptId: string;
  soalId?: string; // Optional: for specific question
}

interface LaporanFileInfo {
  url: string;
  signedUrl?: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file terlalu besar. Maksimal 20MB, file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Tipe file tidak didukung: ${file.type}. Gunakan PDF, Word, gambar (JPG/PNG), atau ZIP.`,
    );
  }
}

// ============================================================================
// UPLOAD FUNCTION
// ============================================================================

/**
 * Upload file laporan ke Supabase Storage
 */
export async function uploadLaporan(
  params: UploadLaporanParams,
): Promise<LaporanFileInfo> {
  const { file, kelasId, mahasiswaId, attemptId, soalId } = params;

  // Validate file
  validateFile(file);

  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileName = `${timestamp}_${sanitizedName}`;

  // Build path: kelas_id/mahasiswa_id/attempt_id/filename
  // or: kelas_id/mahasiswa_id/attempt_id/soal_id/filename (if soalId provided)
  let filePath = `${kelasId}/${mahasiswaId}/${attemptId}`;
  if (soalId) {
    filePath += `/${soalId}`;
  }
  filePath += `/${fileName}`;

  console.log("📤 Uploading laporan:", {
    filePath,
    fileName,
    size: file.size,
    type: file.type,
  });

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error("❌ Upload error:", error);
    throw new Error(`Gagal mengupload file: ${error.message}`);
  }

  console.log("✅ Upload success:", data);

  // Get public URL (or signed URL for private bucket)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // For private buckets, we need signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours validity

  if (signedError) {
    console.warn("⚠️ Could not create signed URL:", signedError);
  }

  return {
    url: urlData?.publicUrl || filePath,
    signedUrl: signedData?.signedUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    path: filePath,
  };
}

/**
 * Wrapper function for FileUpload component
 */
export function createLaporanUploader(
  kelasId: string,
  mahasiswaId: string,
  attemptId: string,
  soalId?: string,
): (file: File) => Promise<UploadedFile> {
  return async (file: File): Promise<UploadedFile> => {
    const result = await uploadLaporan({
      file,
      kelasId,
      mahasiswaId,
      attemptId,
      soalId,
    });

    return {
      url: result.signedUrl || result.url,
      name: result.name,
      size: result.size,
      type: result.type,
    };
  };
}

// ============================================================================
// DOWNLOAD / GET FUNCTIONS
// ============================================================================

/**
 * Get signed URL for downloading a file
 */
export async function getLaporanSignedUrl(
  filePath: string,
  expiresIn: number = 60 * 60, // 1 hour default
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Gagal mendapatkan URL download: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Download file directly
 */
export async function downloadLaporan(filePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    throw new Error(`Gagal mendownload file: ${error.message}`);
  }

  return data;
}

// ============================================================================
// DELETE FUNCTION
// ============================================================================

/**
 * Delete uploaded file
 */
export async function deleteLaporan(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Gagal menghapus file: ${error.message}`);
  }

  console.log("🗑️ File deleted:", filePath);
}

// ============================================================================
// LIST FILES
// ============================================================================

/**
 * List all files in a specific attempt folder
 */
export async function listLaporanFiles(
  kelasId: string,
  mahasiswaId: string,
  attemptId: string,
): Promise<Array<{ name: string; size: number; created_at: string }>> {
  const folderPath = `${kelasId}/${mahasiswaId}/${attemptId}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath);

  if (error) {
    throw new Error(`Gagal mengambil daftar file: ${error.message}`);
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size || 0,
    created_at: file.created_at,
  }));
}

// ============================================================================
// HELPER: Extract path from URL
// ============================================================================

/**
 * Extract storage path from full URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    // Handle signed URLs
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/(?:sign|public)\/laporan\/(.+)/,
    );
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1].split("?")[0]);
    }
    return null;
  } catch {
    // If it's already just a path
    if (url.includes("/")) {
      return url;
    }
    return null;
  }
}
