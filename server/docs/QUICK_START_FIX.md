# Quick Start: Fix Mahasiswa Registration & Admin Panel

## 🎯 Apa masalahnya?

Saat ini:
- ❌ Mahasiswa register tapi tidak langsung terlihat di Admin panel
- ❌ Admin tidak bisa melihat list mahasiswa untuk assign ke kelas
- ❌ 3 tabel (users, admin, dosen) tidak punya RLS enabled

## ✅ Solusinya

Ada 2 SQL query yang harus dijalankan di Supabase.

---

## 📋 Fix #1: Enable RLS (IMPORTANT!)

**Tujuan:** Aktifkan Row Level Security di 3 tabel

**Di Supabase Dashboard:**
1. Buka SQL Editor
2. Copy & paste ini:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
```

3. Klik **RUN**
4. ✅ Done!

---

## 📋 Fix #2: Fix Missing Data (Optional)

**Tujuan:** Create mahasiswa record untuk asti@asti.com

**Di Supabase Dashboard:**
1. Buka SQL Editor (clear previous query)
2. Copy & paste ini:

```sql
INSERT INTO mahasiswa (
  user_id,
  nim,
  program_studi,
  angkatan,
  semester
) VALUES (
  'df490dde-5738-4ecf-a5a2-b200ff48c248',
  '232100002',
  'D3 Kebidanan',
  2023,
  1
);
```

3. Klik **RUN**
4. ✅ Done!

---

## 🧪 Setelah Fix - Test Ini:

### Test 1: Clear Cache & Hard Refresh
```
Ctrl+Shift+Delete → Clear cache
Ctrl+Shift+R → Hard refresh
```

### Test 2: Admin Lihat List Mahasiswa
1. Log in sebagai **admin** (superadmin@akbid.ac.id atau test@admin.com)
2. Buka **Admin Panel** → **Mahasiswa** atau **Users**
3. Verify: Lihat semua mahasiswa yang terdaftar

### Test 3: Register Mahasiswa Baru
1. Log out
2. Click **Register**
3. Isi form sebagai mahasiswa:
   - Name: Andi Pratama
   - Email: andi@test.com
   - Password: Test123!@
   - Role: **Mahasiswa**
   - NIM: 232100003
   - Program Studi: D3 Kebidanan
   - Angkatan: 2024
   - Semester: 1
4. Click **Create Account**
5. ✅ Seharusnya success

### Test 4: Verify di Admin Panel
1. Log in sebagai admin
2. Buka **Admin** → **Mahasiswa/Users**
3. Verify: **Andi Pratama** sudah terlihat di list!
4. ✅ Jika terlihat = FIX BERHASIL!

### Test 5: Create Kelas & Assign Mahasiswa
1. Tetap login sebagai admin
2. Buka **Admin** → **Kelas**
3. Click **Create Kelas**
4. Isi form kelas
5. Setelah create, click **Add Students**
6. Verify: Lihat semua mahasiswa yang terdaftar
7. Select mahasiswa → Click **Enroll**
8. ✅ Jika berhasil = semuanya GOOD!

---

## 📊 Before & After

### Before (Sekarang):
```
Mahasiswa Register
       ↓
Auth user created ✅
User record created ✅
Mahasiswa record created ✅
       ↓
Admin Panel KOSONG ❌
(tidak bisa lihat mahasiswa)
```

### After (Setelah Fix):
```
Mahasiswa Register
       ↓
Auth user created ✅
User record created ✅
Mahasiswa record created ✅
       ↓
Admin Panel LANGSUNG MUNCUL ✅
(bisa lihat & assign ke kelas)
```

---

## ⚡ Quick Summary

| Masalah | Fix | Status |
|---------|-----|--------|
| RLS disabled pada users | Run ALTER TABLE users ENABLE RLS | ⏳ Pending |
| RLS disabled pada admin | Run ALTER TABLE admin ENABLE RLS | ⏳ Pending |
| RLS disabled pada dosen | Run ALTER TABLE dosen ENABLE RLS | ⏳ Pending |
| Missing mahasiswa record (asti) | Run INSERT mahasiswa | ⏳ Pending |
| Code untuk create profile | ✅ Sudah fixed di auth.ts | ✅ Done |
| RLS policy di mahasiswa | ✅ Sudah ada | ✅ OK |

---

## 🎯 Action Items

- [ ] **Step 1:** Run FIX #1 (Enable RLS)
- [ ] **Step 2:** Run FIX #2 (Fix missing data) - optional
- [ ] **Step 3:** Clear cache & hard refresh
- [ ] **Step 4:** Test register mahasiswa baru
- [ ] **Step 5:** Verify muncul di admin panel
- [ ] **Step 6:** Test create kelas & assign mahasiswa

---

## ❓ Pertanyaan?

Jika ada error saat run SQL, screenshot error message dan send ke saya!

**Status:** Ready to Fix! 🚀
