/**
 * useSignedUrl Hook
 *
 * Purpose: Generate signed URLs for private storage buckets
 * Features:
 * - Generate signed URL for viewing files in private buckets
 * - Auto-refresh before expiration
 * - Error handling
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Materi } from "@/types/materi.types";

export function useSignedUrl(materi: Materi | null, enabled: boolean = true) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!materi || !enabled) {
      setSignedUrl(null);
      return;
    }

    let mounted = true;

    async function generateSignedUrl() {
      try {
        setLoading(true);
        setError(null);

        // Extract file path from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/materi/path/to/file
        // We need to extract the path after the bucket name
        const urlParts = materi.file_url.split("/");
        const bucketIndex = urlParts.findIndex((part) => part === "materi");

        if (bucketIndex === -1) {
          throw new Error("Invalid file URL format");
        }

        const filePath = urlParts.slice(bucketIndex + 1).join("/");

        // Generate signed URL valid for 1 hour
        const { data, error: signError } = await supabase.storage
          .from("materi")
          .createSignedUrl(filePath, 3600); // 1 hour

        if (signError) throw signError;
        if (!data?.signedUrl) throw new Error("Failed to generate signed URL");

        if (mounted) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Error generating signed URL:", err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    generateSignedUrl();

    // Refresh signed URL before it expires (refresh every 50 minutes)
    const refreshInterval = setInterval(
      () => {
        generateSignedUrl();
      },
      50 * 60 * 1000,
    ); // 50 minutes

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
    };
  }, [materi, enabled]);

  return { signedUrl, loading, error };
}
