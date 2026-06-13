-- ============================================================================
-- Migration: Fix Materi Bucket Configuration
-- Description: Ensure materi bucket exists with proper configuration
-- Date: 2025-01-17
-- ============================================================================

-- First, delete the bucket if it exists (to recreate with correct config)
-- This will NOT delete the files, just the bucket configuration
DELETE FROM storage.buckets WHERE id = 'materi';

-- Recreate the bucket with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materi',
  'materi',
  true, -- Changed to PUBLIC so files can be accessed without signed URLs
  52428800, -- 50MB max file size
  ARRAY[
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
);

-- ============================================================================
-- NOTES
-- ============================================================================
-- IMPORTANT: This migration changes the bucket from private to public.
-- This means:
-- 1. Files can be accessed directly via public URL (no signed URL needed)
-- 2. The MateriViewer component needs to be updated to use public URLs again
-- 3. RLS policies still control who can see the materi records in the database
--
-- If you want to keep the bucket private, change 'public' back to false
-- and ensure the MateriViewer uses signed URLs (which we already implemented)
