-- ============================================================================
-- Migration: Fix PDF MIME Type Metadata in Storage
-- Description: Update metadata for PDF files to have correct MIME type
-- Date: 2025-01-19
-- ============================================================================

-- Check current metadata for PDF files
SELECT
  id,
  name,
  bucket_id,
  metadata->>'mimetype' as current_mime_type,
  metadata
FROM storage.objects
WHERE bucket_id = 'materi'
  AND (name LIKE '%.pdf' OR metadata->>'mimetype' = 'application/json')
ORDER BY created_at DESC;

-- Update metadata for PDF files
-- Note: This requires manual intervention as we can't directly update metadata via SQL
-- You need to:
-- 1. Download the file
-- 2. Re-upload with correct metadata

-- Alternative: Create a function to fix this
CREATE OR REPLACE FUNCTION fix_pdf_mime_type()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT id, name
    FROM storage.objects
    WHERE bucket_id = 'materi'
      AND (name LIKE '%.pdf' OR metadata->>'mimetype' = 'application/json')
  LOOP
    -- Log the files that need fixing
    RAISE NOTICE 'File % needs MIME type fix', obj.name;
  END LOOP;
END;
$$;

-- Run the function to see which files need fixing
SELECT fix_pdf_mime_type();

-- ============================================================================
-- NOTES
-- ============================================================================
-- Due to Supabase limitations, metadata in storage.objects cannot be directly updated via SQL.
--
-- Solutions:
--
-- 1. MANUAL FIX (for existing files):
--    - Download each PDF file
--    - Re-upload with correct metadata using the Supabase Dashboard or API
--
-- 2. CODE FIX (automatic for new uploads):
--    - The Frontend now fetches PDF as blob and forces correct MIME type
--    - This is already implemented in usePdfBlobUrl.ts
--
-- 3. PREVENTION (for future uploads):
--    - Ensure upload code explicitly sets the content-type metadata
--    - See storage.ts uploadFile function
-- ============================================================================

-- Check if upload code is setting metadata correctly
-- The uploadFile function in storage.ts should be updated to set metadata:
-- const { data, error } = await supabase.storage
--   .from(bucket)
--   .upload(path, file, {
--     cacheControl,
--     upsert,
--     contentType: file.type  // <-- This should be set!
--   });
