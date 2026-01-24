-- ============================================================================
-- Migration: Check and Verify Materi Bucket Configuration
-- Description: Verify materi bucket exists and is configured correctly
-- Date: 2025-01-17
-- ============================================================================

-- Check current bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'materi';
