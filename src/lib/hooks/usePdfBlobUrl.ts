/**
 * usePdfBlobUrl Hook
 *
 * Purpose: Fetch PDF as blob URL to work around Content-Type issues
 * Features:
 * - Fetches PDF file as blob
 * - Creates object URL for inline viewing
 * - Forces blob type to application/pdf
 * - Handles loading and error states
 * - Cleans up blob URL on unmount
 */

import { useState, useEffect, useRef } from "react";
import type { Materi } from "@/types/materi.types";

export function usePdfBlobUrl(materi: Materi | null, enabled: boolean = true) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!materi || !enabled) {
      setBlobUrl(null);
      return;
    }

    // Check for PDF MIME type (more robust check)
    const fileType = materi.tipe_file || "";
    const isPdf = fileType.includes("pdf") || fileType === "application/pdf";

    if (!isPdf) {
      setBlobUrl(null);
      return;
    }

    let mounted = true;
    let objectUrl: string | null = null;

    async function fetchPdfAsBlob() {
      try {
        setLoading(true);
        setError(null);

        // Fetch the PDF file as blob
        const response = await fetch(materi.file_url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF: ${response.status} ${response.statusText}`,
          );
        }

        const blob = await response.blob();

        // Force create a new blob with correct MIME type
        // This fixes the issue where Supabase returns application/json
        const pdfBlob = new Blob([blob], { type: "application/pdf" });

        if (mounted) {
          // Create object URL from blob
          objectUrl = URL.createObjectURL(pdfBlob);
          blobUrlRef.current = objectUrl;
          setBlobUrl(objectUrl);
        }
      } catch (err) {
        console.error("Error fetching PDF as blob:", err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPdfAsBlob();

    // Cleanup function
    return () => {
      mounted = false;
      // Revoke the object URL to free memory
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (blobUrlRef.current && blobUrlRef.current !== objectUrl) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = null;
    };
  }, [materi, enabled]);

  return { blobUrl, loading, error };
}
