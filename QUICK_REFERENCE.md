# Quick Reference Card - RLS Setup

## 🎯 Current Progress
✅ STEP 1: Checked RLS status
⏳ STEP 2: Ready to clean 6 tables
⏳ STEP 3: Ready to create 22 policies
⏳ STEP 4: Verify
⏳ STEP 5: Test

---

## 🔧 Next 3 Actions

### **Action 1:** Copy & Run STEP2
**File:** `STEP2_CLEAN_ONLY_6_TABLES.sql`

1. Buka Supabase SQL Editor
2. Copy & paste file ini
3. Click **RUN**
4. Tunggu sampai selesai

**Expected:** Policies dari 6 table sudah di-drop

---

### **Action 2:** Copy & Run STEP3
**File:** `STEP3_CREATE_NEW_RLS_POLICIES.sql`

1. Buka Supabase SQL Editor (clear previous)
2. Copy & paste file ini
3. Click **RUN**
4. Tunggu sampai selesai

**Expected:** 22 new policies created

---

### **Action 3:** Verify Results
**Copy & run in SQL Editor:**
```sql
SELECT tablename, rowsecurity,
  (SELECT COUNT(*) FROM pg_policies
   WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE tablename IN ('users','mahasiswa','dosen','admin','kelas','kelas_mahasiswa');
```

**Expected Result:**
- All 6 tables: rowsecurity = true
- Total policies: 22
- All tables have policies

---

## 📊 Policy Count Summary
| Table | Policies |
|-------|----------|
| users | 3 |
| mahasiswa | 6 |
| dosen | 6 |
| admin | 3 |
| kelas | 4 |
| kelas_mahasiswa | 3 |
| **TOTAL** | **22** |

---

## 🧪 Final Test (After All Steps)
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Register mahasiswa → ✅ Success
4. Login admin → ✅ See mahasiswa list
5. Create kelas → ✅ Success
6. Assign mahasiswa → ✅ Success

---

## 📁 Key Files
- `STEP2_CLEAN_ONLY_6_TABLES.sql` ← Run next
- `STEP3_CREATE_NEW_RLS_POLICIES.sql` ← Run after STEP 2
- `RLS_SETUP_COMPLETE_GUIDE.md` ← Full documentation
- `EXECUTION_SUMMARY.md` ← Detailed summary

---

**Status:** Ready for STEP 2! 🚀

Run STEP2_CLEAN_ONLY_6_TABLES.sql now!
