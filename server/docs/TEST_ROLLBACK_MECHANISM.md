# Test Rollback Mechanism - NIM Duplicate

## 🎯 Tujuan Test

Membuktikan bahwa jika registrasi gagal (NIM duplicate), user **TIDAK** masuk ke `auth.users` karena rollback mechanism bekerja.

---

## 📋 Test Execution

### STEP 1: Catat Statistik Sebelum Test

Jalankan di SQL Editor:

```sql
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM mahasiswa) AS mahasiswa,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;
```

**Catat hasilnya** (sebelum test):
- auth_users: **4**
- public_users: **3**
- mahasiswa: **1**
- orphaned_users: **1**

---

### STEP 2: Test Registrasi dengan NIM Duplicate

1. **Buka aplikasi di Incognito/Private Browser** (PENTING!)
   - Jangan gunakan browser yang masih login

2. **Buka halaman register**
   ```
   http://localhost:5173/register
   ```

3. **Isi form dengan NIM DUPLICATE:**
   ```
   Email: test-duplicate@example.com  ← EMAIL BARU
   Password: test123456
   Full Name: Test Duplicate NIM
   Role: Mahasiswa
   NIM: BD2501005  ← NIM YANG SUDAH ADA (dari user Arni tadi)
   Program Studi: Kebidanan
   Angkatan: 2025
   Semester: 1
   ```

4. **Klik "Daftar"**

---

### STEP 3: Expected Result

**Di UI:**
- ❌ Error message muncul
- Kemungkinan message:
  - "Data sudah terdaftar (NIM duplicate)"
  - "Gagal membuat profil: duplicate key value violates unique constraint"
- ❌ **TIDAK bisa login** ke dashboard

**Di Console (Browser DevTools):**
- Mungkin ada error logs (ini OK, yang penting rollback jalan)
- Cek Network tab: Request ke `/functions/v1/rollback-registration` harus ada dan **status 200**

---

### STEP 4: Verifikasi Rollback Berhasil

**Jalankan query di SQL Editor:**

```sql
-- Cek user test-duplicate@example.com TIDAK ADA di auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-duplicate@example.com';
```

**Expected**: ✅ **0 rows** (user TIDAK ada karena di-rollback)

```sql
-- Cek user TIDAK ADA di public.users
SELECT id, email, full_name
FROM public.users
WHERE email = 'test-duplicate@example.com';
```

**Expected**: ✅ **0 rows** (user TIDAK ada)

```sql
-- Cek statistik setelah test
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM mahasiswa) AS mahasiswa,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;
```

**Expected (setelah test rollback):**
- auth_users: **4** (TETAP, tidak bertambah!)
- public_users: **3** (TETAP, tidak bertambah!)
- mahasiswa: **1** (TETAP, tidak bertambah!)
- orphaned_users: **1** (TETAP, tidak bertambah!)

---

## ✅ Kriteria Test PASSED

| Kriteria | Expected | Status |
|----------|----------|--------|
| Error muncul di UI | ✅ Ya | ⬜ |
| User TIDAK bisa login | ✅ Ya | ⬜ |
| User TIDAK di auth.users | ✅ 0 rows | ⬜ |
| User TIDAK di public.users | ✅ 0 rows | ⬜ |
| orphaned_users tidak bertambah | ✅ Tetap 1 | ⬜ |
| Edge function dipanggil | ✅ Status 200 | ⬜ |

Jika **SEMUA** kriteria terpenuhi: **🎉 ROLLBACK MECHANISM BEKERJA!**

---

## 🎯 Bonus Test: Email Duplicate

Setelah test NIM duplicate sukses, test juga dengan **email duplicate**:

```
Email: test@arni.com  ← EMAIL YANG SUDAH ADA
Password: test123456
Full Name: Test Duplicate Email
Role: Mahasiswa
NIM: 999999999  ← NIM BARU
Program Studi: Kebidanan
Angkatan: 2025
Semester: 1
```

**Expected:**
- Error: "Email sudah terdaftar"
- User TIDAK masuk ke auth.users (Supabase sudah handle ini by default)

---

## 📊 Summary

Setelah kedua test:

| Test Case | Registrasi | User di auth? | User di public? | Orphaned? | Status |
|-----------|------------|---------------|-----------------|-----------|--------|
| Normal (Arni) | ✅ Sukses | ✅ Ada | ✅ Ada | ❌ Tidak | ✅ PASS |
| NIM Duplicate | ❌ Gagal | ❌ Tidak ada | ❌ Tidak ada | ❌ Tidak | ✅ PASS |
| Email Duplicate | ❌ Gagal | ❌ Tidak ada | ❌ Tidak ada | ❌ Tidak | ✅ PASS |

---

## 🎉 Kesimpulan

Jika semua test PASS:

✅ **FIX BERHASIL!**
- Registrasi normal: Berfungsi ✅
- Registrasi gagal: User ter-rollback, tidak ada orphaned users ✅
- Database tetap bersih ✅

**Masalah registrasi sudah TERATASI!** 🚀
