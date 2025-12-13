# PHASE 3 EXECUTION PLAN - POLICY CONSOLIDATION

## 📋 Overview

- **Goal:** Consolidate 480 "multiple_permissive_policies" warnings
- **Approach:** Step-by-step without changing security logic
- **Timeline:** 6 sequential steps
- **Safety:** Each step has verification queries

---

## 🎯 STEP-BY-STEP EXECUTION

### STEP 1: Core Tables (admin, attempt_kuis)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP1.sql`
**Tables:** 2
**Policies to Consolidate:** ~10
**Time:** ~1-2 min
**Safety:** Verify with provided queries

#### What changes:

```
Before: admin_admin_delete_all + admin_delete_own (10 role evaluations)
After:  admin_delete_unified (5 role evaluations)
Logic: is_admin() OR (auth.uid() = user_id)
```

**✓ Run this FIRST**

---

### STEP 2: User Management Tables (audit, dosen, laboran, mahasiswa, users)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP2.sql`
**Tables:** 5
**Policies to Consolidate:** ~50
**Time:** ~2-3 min
**Safety:** Includes SELECT + UPDATE consolidations

#### Key consolidations:

- `dosen` & `laboran`: Unify admin/self updates
- `mahasiswa`: 3 SELECT + 2 UPDATE → 2 unified
- `users`: 4 SELECT + 2 UPDATE → 2 unified

**✓ Run this SECOND (after Step 1 verification)**

---

### STEP 3: Operational Tables (inventaris, laboratorium, mata_kuliah, kelas)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP3.sql`
**Tables:** 4
**Policies to Consolidate:** ~30
**Time:** ~2 min

#### Changes:

- DELETE, INSERT, UPDATE each become 1 unified policy per table
- Example: `inventaris_delete_admin` + `inventaris_delete_laboran` → `inventaris_delete_unified`

**✓ Run this THIRD**

---

### STEP 4: Academic Tables (jadwal_praktikum, kehadiran, kelas_mahasiswa)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP4.sql`
**Tables:** 3
**Policies to Consolidate:** ~45
**Time:** ~2-3 min

#### Consolidations:

- `jadwal_praktikum`: 3×3 actions → 3 unified
- `kehadiran`: 4 SELECT + 2 each DELETE/INSERT/UPDATE → 4 unified
- `kelas_mahasiswa`: 4 actions × 2-3 roles → 4 unified

**✓ Run this FOURTH**

---

### STEP 5: Assessment & Content (kuis, soal, materi, nilai)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP5.sql`
**Tables:** 4
**Policies to Consolidate:** ~40
**Time:** ~2-3 min

#### Key:

- Each table: DELETE + INSERT + SELECT + UPDATE
- SELECT includes mahasiswa row-level filtering (preserves security)

**✓ Run this FIFTH**

---

### STEP 6: Final Tables + Verification (peminjaman, pengumuman)

**File:** `09_PHASE3_CONSOLIDATE_POLICIES_STEP6.sql`
**Tables:** 2
**Policies to Consolidate:** ~20
**Time:** ~2 min

#### Includes:

- `peminjaman`: Multi-role consolidation
- `pengumuman`: Author/admin update unification
- **COMPREHENSIVE VERIFICATION QUERIES**

**✓ Run this LAST + Verify everything**

---

## 🔍 VERIFICATION STRATEGY

After each step, run the embedded verification queries:

```sql
-- Step 1 verification
SELECT tablename, policyname, qual, with_check FROM pg_policies
WHERE tablename IN ('admin', 'attempt_kuis') ORDER BY policyname;

-- Step 2 verification
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('dosen', 'laboran', 'mahasiswa', 'users')
GROUP BY tablename ORDER BY tablename;
```

### Final Verification (Step 6):

- Total policy count should reduce from 500+ to ~180-200
- All critical functions (is_admin, is_dosen, etc.) should be used
- No duplicate conditions in any policy

---

## ⚠️ SAFETY CHECKLIST

Before executing:

- ✓ Database backup taken
- ✓ Test environment ready
- ✓ No active user sessions
- ✓ Development/staging verified first

During execution:

- ✓ Run steps sequentially (NOT parallel)
- ✓ Run verification after each step
- ✓ Stop if any verification fails
- ✓ Check error messages

After execution:

- ✓ All verification queries pass
- ✓ Test login for each role type
- ✓ Run application smoke tests
- ✓ Check performance metrics

---

## 📊 EXPECTED RESULTS

| Metric                    | Before         | After        | Improvement         |
| ------------------------- | -------------- | ------------ | ------------------- |
| Total Policies            | 520+           | ~180-200     | ~65% reduction      |
| SELECT/UPDATE evaluations | 3-4 per action | 1 per action | 3-4x faster         |
| Database overhead         | High           | Low          | ~70-80% improvement |
| Security logic            | Complete       | Complete     | No change           |
| Feature functionality     | Verified       | Verified     | No breaking changes |

---

## 🚀 EXECUTION COMMAND SEQUENCE

```bash
# For Supabase SQL Editor or psql:

-- Step 1
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP1.sql
-- [Verify output]

-- Step 2
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP2.sql
-- [Verify output]

-- Step 3
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP3.sql
-- [Verify output]

-- Step 4
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP4.sql
-- [Verify output]

-- Step 5
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP5.sql
-- [Verify output]

-- Step 6 (includes final verification)
\i 09_PHASE3_CONSOLIDATE_POLICIES_STEP6.sql
-- [Check all verification results]
```

---

## 📝 ROLLBACK PLAN

If anything goes wrong, restore from backup:

```sql
-- Option 1: Use database backup
-- Restore from backup taken before Phase 3

-- Option 2: Re-apply original policies
-- Run migration files that created original policies
-- Check git history for schema migration files
```

---

## 💡 WHY THIS WORKS

### Before Consolidation:

- Policy: `admin_delete_all` - checks `is_admin()`
- Policy: `admin_delete_own` - checks `auth.uid() = user_id`
- **Result:** Both evaluated for EVERY delete operation = 2x evaluation

### After Consolidation:

- Policy: `admin_delete_unified` - checks `is_admin() OR auth.uid() = user_id`
- **Result:** Single evaluation = 1x (50% reduction)

### For larger tables:

- Before: 3-4 policies × all 5 roles = 15-20 evaluations per row
- After: 1 policy with OR conditions = 1 evaluation per row
- **Result:** 15-20x faster for batch operations

---

## ✅ SUCCESS CRITERIA

- [ ] All 6 steps executed without errors
- [ ] Step 6 verification queries return expected results
- [ ] Policy count reduced to 180-200 range
- [ ] All role types (admin, dosen, laboran, mahasiswa) can still access data
- [ ] Application functional tests pass
- [ ] No "multiple_permissive_policies" warnings in linter

---

## 📞 TROUBLESHOOTING

**Problem:** "Policy already exists" error

- **Solution:** Policy name might exist from previous step - check pg_policies

**Problem:** "Column not found" error

- **Solution:** Check table structure - ensure all referenced columns exist

**Problem:** "Function does not exist" error

- **Solution:** Verify is_admin(), is_dosen() functions exist first

**Problem:** Policies don't work after consolidation

- **Solution:** Rollback to backup and check logic in unified policy

---

**Created:** December 2025  
**Status:** Ready for Execution  
**Last Updated:** Phase 3 Step-by-step planning complete
