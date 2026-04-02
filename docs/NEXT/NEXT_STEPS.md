# Next Steps - Setelah STEP 1 Check

## ✅ STEP 1 Hasil:

26 tables dengan RLS ENABLED ✅
1 table dengan RLS DISABLED: `laboran` (tidak kritis)

---

## 📋 STEP 2 (Modified): Clean 6 Tables Only

**File:** `STEP2_CLEAN_ONLY_6_TABLES.sql`

**Apa yang dilakukan:**
- DROP semua policies HANYA dari 6 table kritis
- Keep RLS ENABLED pada semua table
- Tidak touch 20+ other tables

**6 Tabel:**
1. users
2. mahasiswa
3. dosen
4. admin
5. kelas
6. kelas_mahasiswa

**Langkah:**
1. Di Supabase SQL Editor, clear sebelumnya
2. Copy & paste `STEP2_CLEAN_ONLY_6_TABLES.sql`
3. Click **RUN**
4. ✅ Done - policies dari 6 table sudah di-drop

---

## 📋 STEP 3: Create Fresh Policies

**File:** `STEP3_CREATE_NEW_RLS_POLICIES.sql` (file yang sudah dibuat)

**Apa yang dilakukan:**
- CREATE 22 policies baru yang CLEAN & SAFE
- Non-recursive (tidak refer ke table yang sama)
- Proper role-based access (admin, dosen, mahasiswa)

**Langkah:**
1. Di SQL Editor, clear sebelumnya
2. Copy & paste `STEP3_CREATE_NEW_RLS_POLICIES.sql`
3. Click **RUN**
4. ✅ Done - 22 fresh policies created

---

## 🧪 STEP 4: Verify

**Run verification query:**

```sql
-- Check all 6 tables have RLS + policies
SELECT
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;
```

**Expected Result:**
```
TABLE              RLS    POLICIES
users              true   3
mahasiswa          true   6
dosen              true   6
admin              true   3
kelas              true   4
kelas_mahasiswa    true   3
TOTAL: 6/6        TRUE   22
```

---

## 🎯 After Verify - Final Test

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Clear cache** (Ctrl+Shift+Delete)
3. **Register mahasiswa baru**
   - Should succeed ✅
4. **Check admin panel**
   - Should see mahasiswa ✅
5. **Create kelas**
   - Should succeed ✅
6. **Assign mahasiswa to kelas**
   - Should succeed ✅

---

## ✨ Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Check RLS status | ✅ Done |
| 2 | Drop policies (6 tables) | ⏳ Next |
| 3 | Create fresh policies | ⏳ After Step 2 |
| 4 | Verify | ⏳ After Step 3 |
| 5 | Test (register, admin, kelas) | ⏳ After Step 4 |

---

**Ready to proceed with STEP 2?** 🚀

Run `STEP2_CLEAN_ONLY_6_TABLES.sql` now!
