-- ============================================================================
-- Debug: Check Materi Bucket Status
-- Description: Comprehensive check of materi bucket configuration
-- Date: 2025-01-17
-- ============================================================================

-- Check bucket configuration
SELECT
  'BUCKET CONFIG' as section,
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_type_count
FROM storage.buckets
WHERE id = 'materi';

-- Check if there are any files in the bucket
SELECT
  'FILE COUNT' as section,
  COUNT(*) as total_files
FROM storage.objects
WHERE bucket_id = 'materi';

-- Sample file URLs to check format
SELECT
  'SAMPLE FILES' as section,
  name,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'materi'
ORDER BY created_at DESC
LIMIT 3;

-- Check RLS policies
SELECT
  'RLS POLICIES' as section,
  schemaname || '.' || tablename as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
