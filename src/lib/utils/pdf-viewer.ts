/**
 * PDF Viewer Utilities
 *
 * Purpose: Handle PDF viewing with CORS workaround
 * Features:
 * - Fetch PDF as blob to bypass CORS
 * - Create object URL for iframe
 * - Error handling
 */

import { supabase } from "@/lib/supabase/client";

/**
 * Extract storage path from Supabase URL
 * URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
 */
export function extractPathFromUrl(
  url: string,
): { bucket: string; path: string } | null {
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split("/");

  // Format: /storage/v1/object/public/{bucket}/{path}
  const publicIndex = parts.indexOf("public");
  if (
    publicIndex === -1 ||
    publicIndex !== 4 ||
    publicIndex + 1 >= parts.length
  ) {
    return null;
  }

  const bucket = parts[publicIndex + 1];
  if (!bucket) return null;

  const path =
    parts.slice(publicIndex + 2).join("/") + urlObj.search + urlObj.hash;

  return { bucket, path };
}

/**
 * Fetch file as blob and create object URL
 */
export async function getFileAsBlobUrl(fileUrl: string): Promise<string> {
  const pathInfo = extractPathFromUrl(fileUrl);

  if (pathInfo) {
    // Use Supabase storage download to get the file with auth
    const { data, error } = await supabase.storage
      .from(pathInfo.bucket)
      .download(pathInfo.path);

    if (error) {
      console.error("Supabase storage error:", error);
      // Fall back to direct fetch on error
    } else if (!data) {
      throw new Error("File not found");
    } else {
      // Create object URL from blob
      return URL.createObjectURL(data);
    }
  }

  // Fallback: fetch directly (either pathInfo extraction failed or storage had error)
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to free memory
 */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (url && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore errors for malformed/already-revoked URLs
      // Browser handles this gracefully
    }
  }
}
