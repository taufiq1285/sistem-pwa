-- ============================================================================
-- Check INVENTARIS table schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Get all columns from inventaris table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'inventaris'
ORDER BY ordinal_position;

-- Get foreign keys from inventaris table
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'inventaris'
ORDER BY kcu.column_name;
