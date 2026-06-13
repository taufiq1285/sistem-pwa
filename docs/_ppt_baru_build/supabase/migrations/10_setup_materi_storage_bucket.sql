-- ============================================================================
-- Migration: Setup Materi Storage Bucket
-- Description: Create storage bucket for learning materials with RLS policies
-- Date: 2025-01-17
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Create the 'materi' bucket for storing learning materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materi',
  'materi',
  false, -- Private bucket, access controlled by RLS
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
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE RLS POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- POLICY 1: Dosen can INSERT (upload) files to their own folders
-- Path structure: {kelas_id}/{dosen_id}/{filename}
-- ----------------------------------------------------------------------------
CREATE POLICY "Dosen can upload materi files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM dosen
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 2: Dosen can SELECT (view) their own files
-- ----------------------------------------------------------------------------
CREATE POLICY "Dosen can view their own materi files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM dosen
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 3: Mahasiswa can SELECT (view/download) published materi from enrolled kelas
-- ----------------------------------------------------------------------------
CREATE POLICY "Mahasiswa can view published materi from enrolled kelas"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'materi'
  AND EXISTS (
    -- Check if student is enrolled in the kelas
    SELECT 1
    FROM kelas_mahasiswa km
    JOIN mahasiswa m ON m.id = km.mahasiswa_id
    WHERE m.user_id = auth.uid()
      AND km.kelas_id::text = (string_to_array(name, '/'))[1]
      AND km.is_active = true
  )
  AND EXISTS (
    -- Check if materi is published (is_active = true)
    SELECT 1
    FROM materi mat
    WHERE mat.file_url LIKE '%' || name || '%'
      AND mat.is_active = true
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 4: Dosen can UPDATE their own files (metadata only)
-- ----------------------------------------------------------------------------
CREATE POLICY "Dosen can update their own materi files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM dosen
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
)
WITH CHECK (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM dosen
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 5: Dosen can DELETE their own files
-- ----------------------------------------------------------------------------
CREATE POLICY "Dosen can delete their own materi files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM dosen
    WHERE id::text = (string_to_array(name, '/'))[2]
  )
);

-- ----------------------------------------------------------------------------
-- POLICY 6: Admin can do everything with materi files
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin can manage all materi files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM admin
  )
)
WITH CHECK (
  bucket_id = 'materi'
  AND auth.uid() IN (
    SELECT user_id
    FROM admin
  )
);

-- ============================================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on materi.file_url for faster lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_materi_file_url ON materi(file_url);

-- Index on materi.is_active for filtering published materials
CREATE INDEX IF NOT EXISTS idx_materi_is_active ON materi(is_active);

-- Index on kelas_mahasiswa for enrollment checks
CREATE INDEX IF NOT EXISTS idx_kelas_mahasiswa_user_kelas
ON kelas_mahasiswa(mahasiswa_id, kelas_id)
WHERE is_active = true;

-- ============================================================================
-- 4. ADD HELPFUL FUNCTIONS (Optional)
-- ============================================================================

-- Function to check if a user can access a materi file
CREATE OR REPLACE FUNCTION can_access_materi_file(file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  kelas_id_from_path text;
  dosen_id_from_path text;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM user_profiles
  WHERE user_id = auth.uid();

  -- Parse path: {kelas_id}/{dosen_id}/{filename}
  kelas_id_from_path := split_part(file_path, '/', 1);
  dosen_id_from_path := split_part(file_path, '/', 2);

  -- Admin can access everything
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  -- Dosen can access their own files
  IF user_role = 'dosen' THEN
    RETURN EXISTS (
      SELECT 1
      FROM dosen
      WHERE user_id = auth.uid()
        AND id::text = dosen_id_from_path
    );
  END IF;

  -- Mahasiswa can access published materi from enrolled kelas
  IF user_role = 'mahasiswa' THEN
    RETURN EXISTS (
      SELECT 1
      FROM kelas_mahasiswa km
      JOIN mahasiswa m ON m.id = km.mahasiswa_id
      JOIN materi mat ON mat.kelas_id = km.kelas_id
      WHERE m.user_id = auth.uid()
        AND km.kelas_id::text = kelas_id_from_path
        AND km.is_active = true
        AND mat.is_active = true
        AND mat.file_url LIKE '%' || file_path || '%'
    );
  END IF;

  RETURN false;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (For testing)
-- ============================================================================

-- Uncomment to verify bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'materi';

-- Uncomment to verify policies were created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================================================
-- NOTES
-- ============================================================================

-- Path structure: {kelas_id}/{dosen_id}/{unique_filename}
-- Example: "550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/materi-database-1234567890-abcd.pdf"

-- File access control:
-- 1. Dosen: Can upload, view, update, delete their own files
-- 2. Mahasiswa: Can view/download published materi from enrolled kelas only
-- 3. Admin: Full access to all files
-- 4. Unauthenticated users: No access (bucket is private)

-- Security considerations:
-- - Files are private by default (public = false)
-- - RLS policies enforce access control
-- - File size limit: 50MB
-- - Allowed MIME types are whitelisted
-- - Path structure prevents unauthorized access

-- Performance optimizations:
-- - Indexes on materi.file_url and materi.is_active
-- - Index on kelas_mahasiswa for enrollment checks
-- - Helper function for complex access checks
