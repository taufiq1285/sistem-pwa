-- ============================================================================
-- Fix: Create Missing Dosen Record
-- ============================================================================
-- Run this as ADMIN if the diagnostic shows no dosen record (query #3 is empty)
-- ============================================================================

-- Check which users have role='dosen' but no dosen record
SELECT
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.created_at,
  CASE
    WHEN d.id IS NULL THEN '❌ MISSING DOSEN RECORD'
    ELSE '✅ DOSEN RECORD EXISTS'
  END as status
FROM users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.role = 'dosen'
ORDER BY u.created_at DESC;

-- ============================================================================
-- FIX: Create missing dosen records
-- ============================================================================

INSERT INTO dosen (user_id, nip, fakultas, program_studi)
SELECT
  u.id,
  'NIP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'), -- Generate temporary NIP
  'Fakultas Kesehatan', -- Default fakultas
  'D3 Kebidanan' -- Default program studi
FROM users u
WHERE u.role = 'dosen'
AND u.id NOT IN (SELECT user_id FROM dosen WHERE user_id IS NOT NULL)
RETURNING *;

-- ============================================================================
-- VERIFICATION: Check if dosen records were created
-- ============================================================================

SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  d.id as dosen_id,
  d.nip,
  d.fakultas,
  d.program_studi,
  '✅ COMPLETE' as status
FROM users u
INNER JOIN dosen d ON d.user_id = u.id
WHERE u.role = 'dosen'
ORDER BY u.created_at DESC;
