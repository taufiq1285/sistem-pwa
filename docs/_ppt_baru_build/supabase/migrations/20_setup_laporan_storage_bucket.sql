-- ============================================================================
-- Migration: Setup Laporan Storage Bucket
-- Description: Create storage bucket for student report uploads with RLS policies
-- Date: 2025-12-15
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET FOR LAPORAN
-- ============================================================================

-- Create the 'laporan' bucket for storing student report files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laporan',
  'laporan',
  false, -- Private bucket, access controlled by RLS
  20971520, -- 20MB max file size for reports
  ARRAY[
    -- Documents (PDF & Word)
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    -- Images (for scanned reports)
    'image/jpeg',
    'image/jpg',
    'image/png',
    -- Archives
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. ADD file_url COLUMN TO jawaban TABLE
-- ============================================================================

-- Add file_url column for storing uploaded file reference
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_name column for display purposes
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Add file_size column for validation
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add file_type column
ALTER TABLE jawaban
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jawaban_file_url ON jawaban(file_url) WHERE file_url IS NOT NULL;

-- ============================================================================
-- 3. STORAGE RLS POLICIES FOR LAPORAN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- POLICY 1: Mahasiswa can INSERT (upload) files to their own folders
-- Path structure: {kelas_id}/{mahasiswa_id}/{attempt_id}/{filename}
-- ----------------------------------------------------------------------------
CREATE POLICY "Mahasiswa can upload laporan files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'laporan'
  AND auth.uid() IN (
    SELECT user_id
    FROM mahasiswa
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 2: Mahasiswa can SELECT (view) their own files
-- ----------------------------------------------------------------------------
CREATE POLICY "Mahasiswa can view their own laporan files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan'
  AND auth.uid() IN (
    SELECT user_id
    FROM mahasiswa
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 3: Mahasiswa can UPDATE their own files (for re-uploads)
-- ----------------------------------------------------------------------------
CREATE POLICY "Mahasiswa can update their own laporan files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'laporan'
  AND auth.uid() IN (
    SELECT user_id
    FROM mahasiswa
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 4: Mahasiswa can DELETE their own files
-- ----------------------------------------------------------------------------
CREATE POLICY "Mahasiswa can delete their own laporan files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'laporan'
  AND auth.uid() IN (
    SELECT user_id
    FROM mahasiswa
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 5: Dosen can SELECT (view/download) laporan from their kelas
-- ----------------------------------------------------------------------------
CREATE POLICY "Dosen can view laporan from their kelas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan'
  AND EXISTS (
    -- Check if dosen owns the kelas
    SELECT 1
    FROM kelas k
    JOIN dosen d ON k.dosen_id = d.id
    WHERE k.id::text = (string_to_array(name, '/'))[1]
      AND d.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 6: Admin can view all laporan files
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin can view all laporan files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan'
  AND EXISTS (
    SELECT 1
    FROM users u
    WHERE u.auth_id = auth.uid()
      AND u.role = 'admin'
  )
);

-- ============================================================================
-- 4. ADD tipe_soal VALUE FOR FILE UPLOAD
-- ============================================================================

-- Note: If tipe_soal is an enum, we need to add 'file_upload' value
-- Check if enum exists and add value
DO $$
BEGIN
  -- Try to add 'file_upload' to existing enum
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipe_soal') THEN
    BEGIN
      ALTER TYPE tipe_soal ADD VALUE IF NOT EXISTS 'file_upload';
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Value already exists
    END;
  END IF;
END$$;

-- ============================================================================
-- 5. HELPER FUNCTION TO GET SIGNED URL
-- ============================================================================

-- Function to generate signed URL for file download
CREATE OR REPLACE FUNCTION get_laporan_signed_url(
  p_file_path TEXT,
  p_expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signed_url TEXT;
BEGIN
  -- This is a placeholder - actual implementation depends on Supabase client
  -- The signed URL generation should be done in the application layer
  RETURN p_file_path;
END;
$$;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE storage.objects IS 'Storage objects including laporan files from students';
COMMENT ON COLUMN jawaban.file_url IS 'URL to uploaded file in storage (for file_upload type questions)';
COMMENT ON COLUMN jawaban.file_name IS 'Original filename of uploaded file';
COMMENT ON COLUMN jawaban.file_size IS 'File size in bytes';
COMMENT ON COLUMN jawaban.file_type IS 'MIME type of uploaded file';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration:
-- 1. Creates 'laporan' storage bucket (20MB max, PDF/Word/Images/ZIP)
-- 2. Adds file_url, file_name, file_size, file_type columns to jawaban table
-- 3. Creates RLS policies:
--    - Mahasiswa: upload, view, update, delete own files
--    - Dosen: view files from their kelas
--    - Admin: view all files
-- 4. Adds 'file_upload' to tipe_soal enum (if applicable)
-- ============================================================================
