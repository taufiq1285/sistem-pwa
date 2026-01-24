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
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");

    // Format: /storage/v1/object/public/{bucket}/{path}
    const publicIndex = parts.indexOf("public");
    if (publicIndex === -1 || publicIndex + 1 >= parts.length) {
      return null;
    }

    const bucket = parts[publicIndex + 1];
    const path = parts.slice(publicIndex + 2).join("/");

    return { bucket, path };
  } catch {
    return null;
  }
}

/**
 * Fetch file as blob and create object URL
 */
export async function getFileAsBlobUrl(fileUrl: string): Promise<string> {
  try {
    const pathInfo = extractPathFromUrl(fileUrl);

    if (pathInfo) {
      // Use Supabase storage download to get the file with auth
      const { data, error } = await supabase.storage
        .from(pathInfo.bucket)
        .download(pathInfo.path);

      if (error) throw error;
      if (!data) throw new Error("File not found");

      // Create object URL from blob
      return URL.createObjectURL(data);
    } else {
      // Fallback: fetch directly
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error("Error fetching file as blob:", error);
    throw error;
  }
}

/**
 * Revoke object URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
