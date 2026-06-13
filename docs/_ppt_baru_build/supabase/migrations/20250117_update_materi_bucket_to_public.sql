-- ============================================================================
-- Migration: Update Materi Bucket to Public with JSON Support
-- Description: Update existing materi bucket to public and add JSON support
-- Date: 2025-01-17
-- ============================================================================

-- Update the existing materi bucket to be public and include JSON MIME type
UPDATE storage.buckets
SET
  public = true, -- Change to public so files can be accessed directly
  allowed_mime_types = ARRAY[
    -- Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    -- Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    -- Text
    'text/plain',
    'text/csv',
    'application/json'
  ]::text[]
WHERE id = 'materi';

-- Verify the update
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'materi';
