-- ============================================================================
-- Migration: Check and Fix Materi Bucket Access
-- Description: Check bucket status and ensure it's properly configured
-- Date: 2025-01-19
-- ============================================================================

-- 1. Check current bucket status
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'materi';

-- 2. If bucket is private, update it to public
-- This is safe and won't delete files
UPDATE storage.buckets
SET public = true
WHERE id = 'materi' AND public = false;

-- 3. Verify the update
SELECT
  'Bucket status after update:' as info,
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'materi';

-- 4. Check a sample materi record to see file_url format
SELECT
  id,
  judul,
  tipe_file,
  file_url,
  is_active
FROM materi
LIMIT 3;

-- 5. Check storage.objects to verify files exist
SELECT
  id,
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'materi'
LIMIT 3;
