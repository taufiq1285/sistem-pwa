-- ============================================================================
-- Migration: Check and Fix Storage Objects Metadata
-- Description: Check MIME type metadata in storage.objects
-- Date: 2025-01-19
-- ============================================================================

-- Check current metadata for materi files
SELECT
  id,
  name,
  bucket_id,
  metadata,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'materi'
ORDER BY created_at DESC
LIMIT 10;

-- The issue: metadata->>'mimetype' might be missing or wrong
-- If metadata is incorrect, we need to re-upload the file with correct metadata
