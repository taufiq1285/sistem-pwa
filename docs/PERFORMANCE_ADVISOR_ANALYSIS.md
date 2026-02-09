# Supabase Performance Advisor Analysis

## 📊 Ringkasan Masalah

Supabase Performance Advisor mendeteksi **2 kategori masalah performa** di database:

### 1. **auth_rls_initplan** (7 warnings)

- **Masalah**: RLS policies memanggil `auth.<function>()` atau `current_setting()` berulang kali untuk setiap row
- **Dampak**: Query lambat saat tabel memiliki banyak data
- **Solusi**: Wrap function calls dengan subquery `(select auth.<function>())`

### 2. **multiple_permissive_policies** (76+ warnings)

- **Masalah**: Multiple permissive policies untuk table/role/action yang sama
- **Dampak**: Setiap policy dieksekusi, mengakibatkan overhead berlipat
- **Solusi**: Konsolidasikan policies menjadi satu dengan kondisi OR

---

## 🎯 Tabel yang Terpengaruh

### A. **auth_rls_initplan** Issues

| Table                    | Policy                           | Issue                              |
| ------------------------ | -------------------------------- | ---------------------------------- |
| `kelas_dosen_assignment` | Dosen can view own assignments   | Re-evaluates auth function per row |
| `kelas_dosen_assignment` | Dosen can self-assign to kelas   | Re-evaluates auth function per row |
| `kelas_dosen_assignment` | Dosen can update own assignments | Re-evaluates auth function per row |
| `kelas_dosen_assignment` | Dosen can delete own assignments | Re-evaluates auth function per row |
| `kelas_dosen_assignment` | Admin full access to assignments | Re-evaluates auth function per row |
| `peminjaman`             | peminjaman_update                | Re-evaluates auth function per row |
| `audit_logs`             | audit_logs_select_admin          | Re-evaluates auth function per row |

**Root Cause**: Policies menggunakan:

```sql
-- ❌ SLOW (evaluates for each row)
WHERE dosen_id = get_current_dosen_id()

-- ✅ FAST (evaluates once)
WHERE dosen_id = (SELECT get_current_dosen_id())
```

---

### B. **multiple_permissive_policies** Issues

#### **Kategori 1: Dosen + Unified Policies** (Duplikasi)

| Table              | Duplicate Policies                                                                                                      | Actions Affected                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `kuis`             | kuis_select_dosen + kuis_select_unified                                                                                 | SELECT                               |
| `attempt_kuis`     | attempt_kuis_select_dosen + attempt_kuis_select_unified                                                                 | SELECT, UPDATE                       |
| `jawaban`          | jawaban_select_dosen + jawaban_select_unified<br>jawaban_update_dosen + jawaban_update_unified                          | SELECT, UPDATE                       |
| `jadwal_praktikum` | jadwal*praktikum*{select\|insert\|update\|delete}_dosen<br>+ jadwal_praktikum_{select\|insert\|update\|delete}\_unified | ALL (SELECT, INSERT, UPDATE, DELETE) |
| `peminjaman`       | peminjaman_update + peminjaman_update_unified                                                                           | UPDATE                               |

**Analisis**:

- Policies dengan suffix `_dosen` dan `_unified` **konflik**
- `_dosen` policies berasal dari migration **21_enhanced_rls_policies.sql**
- `_unified` policies kemungkinan dari migration lama atau manual creation di Supabase
- **Rekomendasi**: Drop semua `_unified` policies, keep `_dosen` policies yang sudah di-update di migration 70

---

#### **Kategori 2: Admin + Role Policies** (By Design)

| Table                    | Duplicate Policies                                                                            | Reason                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `kelas_dosen_assignment` | Admin full access + Dosen can {view\|self-assign\|update\|delete}                             | Intentional - Admin bypass + Dosen self-service |
| `kehadiran`              | kehadiran*admin_all + kehadiran*{select\|insert\|update\|delete}\_{dosen\|mahasiswa\|unified} | Admin bypass + Role-specific                    |

**Analisis**:

- Multiple policies by design untuk separation of concerns
- **Admin policies**: Bypass semua, full access
- **Role policies**: Specific logic per role (dosen/mahasiswa)
- **Masalah**: `_unified` policies membuat redundansi

**Rekomendasi**:

- Keep admin bypass policies (by design)
- Drop `_unified` policies (redundant)
- Keep role-specific policies (dosen, mahasiswa)

---

## 🔍 Akar Masalah: `_unified` Policies

### Kenapa `_unified` Policies Ada?

1. **Migration History**: Kemungkinan dari migration lama sebelum migration 21_enhanced_rls_policies.sql
2. **Manual Creation**: Admin mungkin create policies manual di Supabase Dashboard
3. **Failed DROP**: Migration 21 tidak berhasil drop old policies

### Policies yang Harus Di-DROP:

```sql
-- Kuis table
DROP POLICY IF EXISTS kuis_select_unified ON kuis;

-- Attempt Kuis table
DROP POLICY IF EXISTS attempt_kuis_select_unified ON attempt_kuis;
DROP POLICY IF EXISTS attempt_kuis_update_unified ON attempt_kuis;

-- Jawaban table
DROP POLICY IF EXISTS jawaban_select_unified ON jawaban;
DROP POLICY IF EXISTS jawaban_update_unified ON jawaban;

-- Jadwal Praktikum table
DROP POLICY IF EXISTS jadwal_praktikum_select_unified ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_insert_unified ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_update_unified ON jadwal_praktikum;
DROP POLICY IF EXISTS jadwal_praktikum_delete_unified ON jadwal_praktikum;

-- Kehadiran table
DROP POLICY IF EXISTS kehadiran_select_unified ON kehadiran;
DROP POLICY IF EXISTS kehadiran_insert_unified ON kehadiran;
DROP POLICY IF EXISTS kehadiran_update_unified ON kehadiran;
DROP POLICY IF EXISTS kehadiran_delete_unified ON kehadiran;

-- Peminjaman table
DROP POLICY IF EXISTS peminjaman_update_unified ON peminjaman;
```

---

## 📈 Expected Performance Improvement

### Before Fix:

```sql
-- Example: Query attempt_kuis for 1000 rows
-- WITH duplicate policies:
-- - attempt_kuis_select_dosen (1000 evaluations)
-- - attempt_kuis_select_unified (1000 evaluations)
-- = 2000 total evaluations (100% overhead)
```

### After Fix:

```sql
-- Example: Query attempt_kuis for 1000 rows
-- WITH single optimized policy:
-- - attempt_kuis_select_dosen (1 evaluation, cached)
-- = 1 evaluation (99.9% reduction)
```

**Estimated Improvement**:

- **Query time**: 50-80% faster (tergantung ukuran dataset)
- **Database load**: 50-90% reduction (multiple policy elimination)
- **Scalability**: Better performance dengan dataset besar (>10k rows)

---

## ✅ Action Plan

### Step 1: Fix `auth_rls_initplan` Issues

**File**: `71_fix_rls_performance_auth_initplan.sql`

1. **kelas_dosen_assignment** policies (5 policies)
   - Wrap `get_current_dosen_id()` dengan subquery
   - Wrap `is_admin()` dengan subquery

2. **peminjaman** policies (1 policy)
   - Wrap `is_admin()` dengan subquery

3. **audit_logs** policies (1 policy)
   - Wrap `is_admin()` dengan subquery

### Step 2: Fix `multiple_permissive_policies` Issues

**File**: `72_fix_rls_performance_duplicate_policies.sql`

1. **Drop all `_unified` policies** (redundant)
2. **Verify `_dosen` policies** from migration 21 & 70
3. **Keep admin bypass policies** (by design)

### Step 3: Verification

**File**: `CHECK_PERFORMANCE_ADVISOR_FIXES.sql`

Query untuk verify:

- Semua auth functions wrapped dengan subquery
- Tidak ada duplicate policies
- Admin bypass policies tetap exist

---

## 🚨 Risk Assessment

### Low Risk:

- **Drop `_unified` policies**: Safe karena sudah ada `_dosen` policies yang lebih spesifik
- **Wrap auth functions**: Backward compatible, hanya optimization

### Medium Risk:

- **kelas_dosen_assignment** policies: Table baru dari migration 60, perlu testing

### Testing Checklist:

- [ ] Dosen dapat view own assignments
- [ ] Dosen dapat self-assign ke kelas
- [ ] Admin dapat view all assignments
- [ ] Mahasiswa dapat submit attempt
- [ ] Dosen dapat grade student work (multi-dosen scenario)
- [ ] Query performance improvement verified

---

## 📝 Next Steps

1. **Review this analysis** - Confirm understanding
2. **Run migration 71** - Fix auth_rls_initplan issues
3. **Run migration 72** - Fix multiple_permissive_policies issues
4. **Run verification** - Check Supabase Performance Advisor again
5. **Test features** - Ensure nothing broken
6. **Monitor performance** - Verify improvement

---

## 🔗 References

- [Supabase Docs: RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Supabase Linter: auth_rls_initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Supabase Linter: multiple_permissive_policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)

---

**Created**: 2026-01-14  
**Migration**: 71_fix_rls_performance_auth_initplan.sql, 72_fix_rls_performance_duplicate_policies.sql  
**Status**: Ready for deployment
