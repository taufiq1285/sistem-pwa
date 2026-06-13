-- ============================================================================
-- Migration: Verify Materi File Access
-- Description: Test if materi files can be accessed properly
-- Date: 2025-01-19
-- ============================================================================

-- This will help verify that the materi bucket and files are accessible
-- Run this after applying the fix_materi_bucket migration

-- 1. List all materi records
SELECT
  id,
  judul,
  tipe_file,
  file_url,
  file_size,
  is_active,
  created_at
FROM materi
ORDER BY created_at DESC;

-- 2. List all files in materi storage
SELECT
  id,
  name,
  bucket_id,
  created_at,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'materi'
ORDER BY created_at DESC;

-- 3. Check for any discrepancies
-- (materi records that don't have matching storage files)
SELECT
  m.id,
  m.judul,
  m.file_url,
  'No matching storage object found' as issue
FROM materi m
WHERE NOT EXISTS (
  SELECT 1
  FROM storage.objects o
  WHERE o.bucket_id = 'materi'
    AND m.file_url LIKE '%' || o.name || '%'
)
ORDER BY m.created_at DESC;
