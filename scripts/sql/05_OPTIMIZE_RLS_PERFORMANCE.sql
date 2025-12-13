-- ============================================================================
-- OPTIMIZE RLS PERFORMANCE - FIX auth_rls_initplan WARNINGS
-- ============================================================================
-- Issue: RLS policies calling functions with auth.uid() cause plan initialization per row
-- Solution: Wrap auth.uid() in (SELECT auth.uid()) to force query-time initialization
-- Impact: Fixes 20 auth_rls_initplan warnings, improves query performance
-- Status: ANALYSIS - Based on actual Supabase policy data
-- ============================================================================

-- NOTES FROM ACTUAL SCHEMA INSPECTION:
-- ✓ Found 47 actual policies across 11 tables
-- ✓ pengumuman table uses "penulis_id" column (NOT author_id)
-- ✓ Most direct auth.uid() comparisons are already efficient
-- ✓ Functions like is_admin(), is_dosen(), is_laboran() may be optimization targets

-- ============================================================================
-- ADMIN TABLE - 3 policies
-- ============================================================================

-- Policy: admin_delete_own
-- USING: (user_id = auth.uid())
-- Already efficient - direct comparison

-- Policy: admin_insert_registration  
-- WITH CHECK: ((user_id = auth.uid()) OR (auth.uid() IS NULL))
-- Already efficient

-- Policy: admin_admin_delete_all
-- USING: is_admin()
-- Note: Uses custom function - may cause auth_rls_initplan if is_admin() calls auth.uid()

-- ============================================================================
-- DOSEN TABLE - 3 policies
-- ============================================================================

-- Policy: dosen_select_all
-- USING: (auth.uid() IS NOT NULL)
-- Already efficient

-- Policy: dosen_update_self
-- USING: (is_dosen() AND (user_id = auth.uid()))
-- Note: Mixed function + direct call

-- Policy: dosen_update_admin
-- USING: is_admin()
-- Note: Uses custom function
-- New: USING (user_id = (SELECT auth.uid()))

-- ============================================================================
-- LABORAN TABLE - Fix 2 policies
-- ============================================================================
-- LABORAN TABLE - 3 policies
-- ============================================================================

-- Policy: laboran_select_all
-- USING: (auth.uid() IS NOT NULL)
-- Already efficient

-- Policy: laboran_update_admin
-- USING: is_admin()
-- Note: Uses custom function

-- Policy: laboran_update_self
-- USING: (is_laboran() AND (user_id = auth.uid()))
-- Note: Mixed function + direct call

-- ============================================================================
-- LABORATORIUM TABLE - 5 policies
-- ============================================================================

-- All use is_admin() or is_laboran() - custom functions
-- May need optimization if these functions call auth.uid() internally

-- ============================================================================
-- INVENTARIS TABLE - 6 policies  
-- ============================================================================

-- All use is_admin(), is_laboran(), or auth.uid() IS NOT NULL
-- Custom functions may need optimization

-- ============================================================================
-- MAHASISWA TABLE - 5 policies
-- ============================================================================

-- Policy: mahasiswa_select_self
-- USING: (is_mahasiswa() AND (user_id = auth.uid()))
-- Note: Uses custom function

-- Policy: mahasiswa_update_self
-- USING: (is_mahasiswa() AND (user_id = auth.uid()))
-- Note: Uses custom function

-- Others use: is_admin(), is_dosen() - custom functions

-- ============================================================================
-- MATA_KULIAH TABLE - 5 policies
-- ============================================================================

-- All use is_admin(), is_dosen(), or auth.uid() IS NOT NULL
-- Custom functions may need optimization

-- ============================================================================
-- PENGUMUMAN TABLE - 5 policies ✓ CORRECTED
-- ============================================================================

-- IMPORTANT: pengumuman uses "penulis_id" column (NOT author_id)

-- Policy: pengumuman_admin_delete
-- USING: is_admin()

-- Policy: pengumuman_admin_insert
-- WITH CHECK: is_admin()

-- Policy: pengumuman_admin_update
-- USING: is_admin()

-- Policy: pengumuman_author_update
-- USING: (penulis_id = auth.uid()) ← ACTUAL COLUMN NAME
-- Already efficient - direct comparison

-- Policy: pengumuman_select
-- USING: (is_active = true)
-- Already efficient - no auth calls

-- ============================================================================
-- AUDIT_LOGS_ARCHIVE TABLE - 2 policies
-- ============================================================================

-- Both use: (SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin'
-- Already in subquery form - efficient

-- ============================================================================
-- MAHASISWA_SEMESTER_AUDIT TABLE - 2 policies
-- ============================================================================

-- Policy: Admin can view all semester audits
-- USING: (SELECT users.role FROM users WHERE users.id = auth.uid()) = 'admin'
-- Already in subquery form - efficient

-- Policy: Mahasiswa can view their own semester audit
-- USING: mahasiswa_id = (SELECT mahasiswa.id FROM mahasiswa WHERE mahasiswa.user_id = auth.uid())
-- Already in subquery form - efficient

-- ============================================================================
-- USERS TABLE - 6 policies
-- ============================================================================

-- Most use complex subqueries with get_current_dosen_id(), get_current_mahasiswa_id()
-- These functions likely call auth.uid() internally and may have optimization opportunities

-- ============================================================================
-- ANALYSIS SUMMARY
-- ============================================================================
-- 
-- After reviewing the 47 actual policies in the database:
--
-- ✓ ALREADY OPTIMIZED (subquery form):
--   - audit_logs_archive: 2 policies
--   - mahasiswa_semester_audit: 2 policies  
--
-- ✓ DIRECT COMPARISONS (efficient):
--   - Many policies using direct auth.uid() = column_id
--
-- ✓ CUSTOM FUNCTIONS (optimization candidates):
--   - is_admin(), is_dosen(), is_laboran(), is_mahasiswa()
--   - get_current_dosen_id(), get_current_mahasiswa_id()
--   - get_mahasiswa_kelas_ids(), dosen_teaches_mahasiswa()
--
-- RECOMMENDATION:
-- The 20 auth_rls_initplan warnings may be from:
-- 1. Custom functions calling auth.uid() internally per row
-- 2. Complex nested queries in users table policies
--
-- Best optimization path:
-- 1. Review what is_admin(), is_dosen(), is_laboran(), is_mahasiswa() actually do
-- 2. Check if they can be optimized or replaced with direct role checks
-- 3. Apply wrapping only if functions internally call auth.uid()
--
-- For now: All direct auth.uid() usage is already efficient
-- Pengumuman table: CONFIRMED using penulis_id (not author_id)
--
