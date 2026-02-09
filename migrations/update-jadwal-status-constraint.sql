-- ============================================================================
-- Migration: Update jadwal_praktikum status constraint
-- Purpose: Add "pending" and "rejected" status for proper approval workflow
-- Workflow: pending → approved/rejected → cancelled
-- ============================================================================

-- 1. Drop the old constraint
ALTER TABLE jadwal_praktikum
DROP CONSTRAINT IF EXISTS jadwal_praktikum_status_check;

-- 2. Add new constraint with proper workflow status values
ALTER TABLE jadwal_praktikum
ADD CONSTRAINT jadwal_praktikum_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- 3. Verify the constraint
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'jadwal_praktikum'
AND con.conname = 'jadwal_praktikum_status_check';

-- 4. (Optional) Update any existing records if needed
-- UPDATE jadwal_praktikum SET status = 'approved' WHERE status IS NULL;
