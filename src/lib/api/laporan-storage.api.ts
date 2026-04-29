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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // ✅ Reduced to 10MB for faster upload
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

const STORAGE_PUBLIC_SEGMENT = `/storage/v1/object/public/${BUCKET_NAME}/`;
const STORAGE_SIGN_SEGMENT = `/storage/v1/object/sign/${BUCKET_NAME}/`;
const STORAGE_AUTH_SEGMENT = `/storage/v1/object/authenticated/${BUCKET_NAME}/`;

// ============================================================================
// VALIDATION
// ============================================================================

function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `Ukuran file terlalu besar. Maksimal 10MB, file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB. Kompres file PDF/Word Anda terlebih dahulu.`,
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

  console.log("⏳ Starting upload...");

  // Upload to Supabase Storage with timeout to prevent indefinite hanging
  const UPLOAD_TIMEOUT = 120000; // 2 minutes timeout

  const uploadPromise = supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Don't overwrite existing files
    });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          "Upload timeout. File terlalu besar atau koneksi terlalu lambat. Coba kecilkan ukuran file atau periksa koneksi internet Anda.",
        ),
      );
    }, UPLOAD_TIMEOUT);
  });

  const { data, error } = (await Promise.race([
    uploadPromise,
    timeoutPromise,
  ])) as any;

  if (error) {
    console.error("❌ Upload error:", error);
    throw new Error(`Gagal mengupload file: ${error.message}`);
  }

  console.log("✅ Upload success:", data);
  console.log(
    `⏱️ Upload completed for ${fileName} (${(file.size / 1024).toFixed(2)} KB)`,
  );

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

function extractLaporanPath(source: string): string | null {
  const value = source.trim();
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname;

    for (const segment of [
      STORAGE_PUBLIC_SEGMENT,
      STORAGE_SIGN_SEGMENT,
      STORAGE_AUTH_SEGMENT,
    ]) {
      const index = pathname.indexOf(segment);
      if (index >= 0) {
        return pathname.slice(index + segment.length);
      }
    }
  } catch (error) {
    console.warn("Failed to parse laporan URL:", error);
  }

  return null;
}

export async function resolveLaporanAccessUrl(
  storedValue?: string | null,
): Promise<string | null> {
  if (!storedValue) {
    return null;
  }

  const normalized = storedValue.trim();
  if (!normalized) {
    return null;
  }

  const filePath = extractLaporanPath(normalized);

  if (!filePath) {
    return normalized;
  }

  try {
    return await getLaporanSignedUrl(filePath, 60 * 60 * 24);
  } catch (signedError) {
    console.warn("Failed to generate signed URL for laporan:", signedError);

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data?.publicUrl || normalized;
  }
}

function inferLaporanMimeType(
  fileUrl?: string | null,
  fileType?: string | null,
  fileName?: string | null,
): string {
  const normalizedType = fileType?.trim().toLowerCase();
  if (normalizedType) {
    return normalizedType;
  }

  const source = `${fileName || ""} ${fileUrl || ""}`.toLowerCase();

  if (source.includes(".pdf")) return "application/pdf";
  if (source.includes(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (source.includes(".doc")) return "application/msword";
  if (source.includes(".png")) return "image/png";
  if (source.includes(".jpeg") || source.includes(".jpg")) return "image/jpeg";
  if (source.includes(".zip")) return "application/zip";

  return "application/octet-stream";
}

export async function openLaporanFileInNewTab(params: {
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
}): Promise<void> {
  // Browser hanya mengizinkan tab baru jika dibuka langsung dari gesture klik.
  // Buka tab kosong dulu, lalu isi URL setelah signed URL/blob selesai disiapkan.
  const openedWindow = window.open("", "_blank");

  if (!openedWindow) {
    throw new Error("Tab baru gagal dibuka. Periksa popup blocker browser.");
  }

  openedWindow.document.write(
    "<!doctype html><title>Membuka laporan...</title><body style=\"font-family: sans-serif; padding: 24px;\">Membuka file laporan...</body>",
  );

  const showOpenError = (message: string) => {
    try {
      openedWindow.document.body.innerHTML = `<p style="font-family: sans-serif; padding: 24px;">${message}</p>`;
    } catch {
      // Ignore cross-window rendering errors. The caller will still show a toast.
    }
  };

  try {
    const accessUrl = await resolveLaporanAccessUrl(params.fileUrl);

    if (!accessUrl) {
      showOpenError("URL file laporan belum tersedia.");
      throw new Error("URL file laporan belum tersedia.");
    }

    const response = await fetch(accessUrl);
    if (!response.ok) {
      showOpenError(`Gagal memuat file laporan (${response.status}).`);
      throw new Error(`Gagal memuat file laporan (${response.status}).`);
    }

    const blob = await response.blob();
    const safeBlob = new Blob([blob], {
      type: inferLaporanMimeType(accessUrl, params.fileType, params.fileName),
    });
    const blobUrl = URL.createObjectURL(safeBlob);

    openedWindow.location.href = blobUrl;

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch (error) {
    showOpenError((error as Error).message || "Gagal membuka file laporan.");
    throw error;
  }
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
      /\/storage\/v1\/object\/(?:sign|public)\/(.+)/,
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
