# Complete RLS Setup Guide - Fresh & Clean

## 📋 Overview

Setup RLS dengan benar untuk 6 table utama:
1. `users` - User accounts (all roles)
2. `mahasiswa` - Student data
3. `dosen` - Lecturer data
4. `admin` - Admin data
5. `kelas` - Classes
6. `kelas_mahasiswa` - Student enrollment in classes

---

## 🚀 Step-by-Step Process

### STEP 1: Check Current State
**File:** `STEP1_CHECK_ALL_RLS.sql`

**Apa yang dilakukan:**
- ✅ Cek RLS enabled/disabled pada semua table
- ✅ List semua policies yang ada
- ✅ Identify masalah (infinite recursion, etc)

**Langkah:**
1. Buka Supabase SQL Editor
2. Copy & paste `STEP1_CHECK_ALL_RLS.sql`
3. Click **RUN**
4. Lihat hasil

**Expected Result:**
- Beberapa table punya RLS ENABLED
- Beberapa punya policies
- Ada yang recursive/problematic

---

### STEP 2: Clean Slate - Drop Semua & Disable RLS
**File:** `STEP2_CLEAN_ALL_RLS.sql`

**Apa yang dilakukan:**
- ✅ DROP SEMUA policies dari 6 table
- ✅ DISABLE RLS pada semua table
- ✅ Fresh slate untuk start baru

**Langkah:**
1. Di SQL Editor, clear query sebelumnya
2. Copy & paste `STEP2_CLEAN_ALL_RLS.sql`
3. Click **RUN**
4. ⚠️ Ini akan DROP semua policies lama!

**Expected Result:**
- Semua table: RLS DISABLED
- Semua policies: DELETED
- Status: Clean slate ✅

---

### STEP 3: Create New RLS Policies - Fresh & Safe
**File:** `STEP3_CREATE_NEW_RLS_POLICIES.sql`

**Apa yang dilakukan:**
- ✅ ENABLE RLS pada semua 6 table
- ✅ Create policies baru yang CLEAN & NON-RECURSIVE
- ✅ Policies per ROLE (admin, dosen, mahasiswa)

**Langkah:**
1. Di SQL Editor, clear query
2. Copy & paste `STEP3_CREATE_NEW_RLS_POLICIES.sql`
3. Click **RUN**
4. Tunggu sampai sukses

**Expected Result:**
- Semua table: RLS ENABLED ✅
- Policies created: 22 policies total ✅
- Verification: Lihat report di bawah

**Breakdown per table:**
| Table | Policies | Purpose |
|-------|----------|---------|
| users | 3 | SELECT all, INSERT own, UPDATE own |
| mahasiswa | 6 | SELECT (own + admin), INSERT (own + admin), UPDATE (own + admin) |
| dosen | 6 | SELECT (own + admin), INSERT (own + admin), UPDATE (own + admin) |
| admin | 3 | SELECT, INSERT, UPDATE (admin only) |
| kelas | 4 | Admin ALL, Dosen own, Mahasiswa view |
| kelas_mahasiswa | 3 | Admin ALL, Mahasiswa own, Dosen view |

---

## 🔐 RLS Policy Details by Role

### For MAHASISWA:

**users table:**
- ✅ SELECT: Bisa lihat semua users (untuk auth)
- ✅ INSERT: Bisa create akun sendiri saat registration
- ✅ UPDATE: Bisa update profile sendiri

**mahasiswa table:**
- ✅ SELECT: Bisa lihat data diri sendiri
- ✅ INSERT: Bisa insert data saat registration
- ✅ UPDATE: Bisa update profile sendiri

**kelas table:**
- ✅ SELECT: Bisa lihat semua kelas (untuk browse & enroll)

**kelas_mahasiswa table:**
- ✅ SELECT: Bisa lihat enrollment diri sendiri

---

### For DOSEN:

**users table:**
- ✅ SELECT: Bisa lihat semua users
- ✅ UPDATE: Bisa update profile sendiri

**dosen table:**
- ✅ SELECT: Bisa lihat data diri sendiri
- ✅ UPDATE: Bisa update profile sendiri

**kelas table:**
- ✅ SELECT: Bisa lihat kelas mereka sendiri
- ✅ INSERT: Bisa buat kelas
- ✅ UPDATE: Bisa update kelas mereka sendiri

**kelas_mahasiswa table:**
- ✅ SELECT: Bisa lihat mahasiswa di kelas mereka

---

### For ADMIN:

**semua table:**
- ✅ SELECT: Bisa lihat semua
- ✅ INSERT: Bisa insert
- ✅ UPDATE: Bisa update
- ✅ DELETE: Bisa delete (jika policy ada)

---

## 📊 What Happens After Setup

### Saat Mahasiswa Register:
```
1. auth.signUp() → Create auth user
   ↓
2. INSERT into users table
   RLS Policy: "users_allow_insert_own" ✅
   CHECK: auth.uid() IS NOT NULL
   ✅ ALLOWED (karena user baru auth)
   ↓
3. INSERT into mahasiswa table
   RLS Policy: "mahasiswa_insert_own" ✅
   CHECK: auth.uid() = user_id
   ✅ ALLOWED (karena mereka insert data mereka sendiri)
   ↓
4. Registration Complete ✅
```

### Saat Admin Lihat Mahasiswa:
```
1. Admin login
   ↓
2. Query: SELECT * FROM mahasiswa
   RLS Policy: "mahasiswa_select_admin" ✅
   USING: EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
   ✅ ALLOWED (karena admin)
   ↓
3. Admin lihat list mahasiswa ✅
```

### Saat Admin Create Kelas & Enroll Mahasiswa:
```
1. Admin INSERT into kelas
   RLS Policy: "kelas_admin_all" ✅
   ✅ ALLOWED
   ↓
2. Admin INSERT into kelas_mahasiswa
   RLS Policy: "kelas_mhs_admin_all" ✅
   ✅ ALLOWED
   ↓
3. Kelas created + Mahasiswa enrolled ✅
```

---

## ✅ Verification & Testing

### After STEP 3, verify:

Run di SQL Editor:
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa');

-- Check policy count
SELECT tablename, COUNT(*) as policies FROM pg_policies
WHERE tablename IN ('users', 'mahasiswa', 'dosen', 'admin', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename;
```

**Expected:**
```
TABLE        RLS      POLICIES
users        true     3
mahasiswa    true     6
dosen        true     6
admin        true     3
kelas        true     4
kelas_mhs    true     3
TOTAL:       6/6      22
```

---

## 🧪 Test After Setup

### Test 1: Register Mahasiswa Baru
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Register sebagai mahasiswa
4. ✅ Should succeed (no infinite recursion)

### Test 2: Check Admin Panel
1. Login sebagai admin
2. Buka Mahasiswa list
3. ✅ Should see registered mahasiswa

### Test 3: Create Kelas & Enroll
1. Masih login admin
2. Create kelas baru
3. Add mahasiswa ke kelas
4. ✅ Should work

### Test 4: Mahasiswa Login
1. Login sebagai mahasiswa yang tadi register
2. Buka "Available Classes"
3. ✅ Should see classes

### Test 5: Dosen Create Jadwal
1. Login sebagai dosen
2. Create jadwal praktikum
3. ✅ Should succeed

---

## ⚠️ Important Notes

1. **Non-Recursive Policies**
   - Tidak ada policy yang refer ke table yang sama
   - Avoid infinite recursion

2. **Simple & Safe**
   - Policies fokus pada role (admin/dosen/mahasiswa)
   - Menggunakan EXISTS dengan simple SELECT

3. **No Denials (DROP POLICIES)**
   - Hanya ada ALLOW policies
   - Tidak ada DENY policies
   - Lebih simple & predictable

4. **All Roles Covered**
   - Admin: Full access
   - Dosen: Own classes & manage
   - Mahasiswa: Own data & view classes
   - Laboran: (can be added later)

---

## 📁 Files Used

1. **STEP1_CHECK_ALL_RLS.sql** - Check current state
2. **STEP2_CLEAN_ALL_RLS.sql** - Drop all & disable RLS
3. **STEP3_CREATE_NEW_RLS_POLICIES.sql** - Create fresh policies

---

## 🎯 Final Checklist

- [ ] Run STEP1_CHECK_ALL_RLS.sql
- [ ] Run STEP2_CLEAN_ALL_RLS.sql (⚠️ drops all policies!)
- [ ] Run STEP3_CREATE_NEW_RLS_POLICIES.sql
- [ ] Verify RLS enabled on all 6 tables
- [ ] Verify 22 policies created
- [ ] Hard refresh browser
- [ ] Test register mahasiswa
- [ ] Test admin panel
- [ ] Test create kelas
- [ ] Test enrollment

---

**Status:** Ready to execute! 🚀
**Safety:** Clean slate approach = No corrupted policies
**Result:** Fresh RLS setup for all roles
