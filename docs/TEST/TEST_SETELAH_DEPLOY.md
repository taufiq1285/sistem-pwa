# Test Setelah Deploy - Verifikasi Fix Berhasil

## ✅ Yang Sudah Di-Deploy

1. ✅ Migration 31: Trigger `on_auth_user_created` sudah dihapus
2. ✅ Edge Function: `rollback-registration` sudah aktif
3. ✅ Kode aplikasi: Sudah diupdate untuk call edge function jika gagal

---

## 🧪 Test Case: Registrasi dengan NIM Duplicate

### Tujuan
Verifikasi bahwa jika registrasi gagal (NIM duplicate), user **TIDAK** masuk ke `auth.users`.

---

### Persiapan

**STEP 1: Cari NIM yang Sudah Ada**

Jalankan di SQL Editor:
```sql
SELECT nim, user_id
FROM mahasiswa
LIMIT 1;
```

**Catat NIM-nya**, misalnya: `123456789`

---

### Test Execution

**STEP 2: Test Registrasi dengan NIM Duplicate**

1. Buka aplikasi di **Incognito/Private Browser** (penting!)
   ```
   http://localhost:5173/register
   ```
   atau URL production Anda

2. Isi form registrasi:
   ```
   Email: test-after-fix@example.com
   Password: test123456
   Full Name: Test After Fix
   Role: Mahasiswa
   NIM: 123456789  <-- GUNAKAN NIM YANG SUDAH ADA DARI STEP 1
   Program Studi: Teknik Informatika
   Angkatan: 2024
   Semester: 1
   ```

3. Klik **"Daftar"**

4. **Expected Result**:
   - ❌ Error muncul: "Data sudah terdaftar (NIM duplicate)" atau similar
   - ❌ Tidak bisa login
   - ❌ User **TIDAK** masuk ke database (ini yang penting!)

---

### Verifikasi Fix Berhasil

**STEP 3: Cek User TIDAK Ada di Authentication**

Jalankan di SQL Editor:

```sql
-- Cek di auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-after-fix@example.com';
```

**Expected (FIX BERHASIL)**:
- ✅ **0 rows** (user TIDAK ada di auth.users)

```sql
-- Cek di public.users
SELECT id, email, full_name
FROM public.users
WHERE email = 'test-after-fix@example.com';
```

**Expected**:
- ✅ **0 rows** (user TIDAK ada di public.users)

```sql
-- Cek di mahasiswa
SELECT m.*, u.email
FROM mahasiswa m
LEFT JOIN public.users u ON m.user_id = u.id
WHERE u.email = 'test-after-fix@example.com';
```

**Expected**:
- ✅ **0 rows** (data mahasiswa TIDAK dibuat)

---

### Verifikasi Statistik

**STEP 4: Cek Orphaned Users**

```sql
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;
```

**Expected (Setelah Test)**:
- `orphaned_users`: Tetap **1** (orphaned superadmin yang lama, tidak bertambah!)

**Jika bertambah jadi 2 atau lebih**: ❌ Fix GAGAL, ada masalah!

---

## 🎯 Test Case 2: Registrasi Normal (Harus Tetap Berfungsi)

**STEP 5: Test Registrasi Normal**

1. Buka aplikasi di **Incognito/Private Browser** baru

2. Isi form dengan **data yang BENAR-BENAR BARU**:
   ```
   Email: test-normal-registration@example.com
   Password: test123456
   Full Name: Test Normal Registration
   Role: Mahasiswa
   NIM: 999888777  <-- NIM BARU yang belum ada
   Program Studi: Teknik Informatika
   Angkatan: 2024
   Semester: 1
   ```

3. Klik **"Daftar"**

4. **Expected Result**:
   - ✅ Success message: "Registrasi berhasil! Silakan cek email untuk verifikasi"
   - ✅ User masuk ke database

**STEP 6: Verifikasi Registrasi Normal Berhasil**

```sql
-- Cek user ada
SELECT id, email, full_name, role
FROM public.users
WHERE email = 'test-normal-registration@example.com';
```

**Expected**: ✅ **1 row** (user ada)

```sql
-- Cek data mahasiswa ada
SELECT m.*, u.email
FROM mahasiswa m
JOIN public.users u ON m.user_id = u.id
WHERE u.email = 'test-normal-registration@example.com';
```

**Expected**: ✅ **1 row** (data mahasiswa lengkap)

---

## 📊 Hasil Test

| Test Case | Registrasi Sukses? | User di auth.users? | User di public.users? | User di mahasiswa? | Status |
|-----------|-------------------|---------------------|----------------------|-------------------|---------|
| NIM Duplicate | ❌ Gagal (Expected) | ✅ **TIDAK ADA** (FIXED!) | ✅ **TIDAK ADA** (FIXED!) | ✅ Tidak ada | **✅ PASSED** |
| Normal Registration | ✅ Sukses | ✅ Ada | ✅ Ada | ✅ Ada | **✅ PASSED** |

---

## 🔍 Troubleshooting

### Masalah 1: User Duplicate Masih Masuk ke auth.users

**Penyebab**:
- Edge function tidak dipanggil
- Edge function error

**Solusi**:
1. Cek logs edge function:
   ```
   https://supabase.com/dashboard/project/rkyoifqbfcztnhevpnpx/functions/rollback-registration/logs
   ```

2. Cek browser console untuk error

3. Cek `VITE_SUPABASE_URL` di `.env.local` sudah benar

---

### Masalah 2: Registrasi Normal Juga Gagal

**Penyebab**:
- Kode aplikasi bermasalah
- Database policy issue

**Solusi**:
1. Cek error message di aplikasi
2. Cek browser console
3. Cek Supabase logs

---

## ✅ Checklist

Setelah test, pastikan:

- [ ] Test 1: NIM duplicate → User TIDAK masuk auth.users ✅
- [ ] Test 2: Registrasi normal → Berhasil ✅
- [ ] Orphaned users tidak bertambah ✅
- [ ] Screenshot hasil test
- [ ] Cleanup user test dari database

---

## 🧹 Cleanup Setelah Test

Hapus user test yang dibuat:

```sql
-- Hapus user test normal
DELETE FROM mahasiswa
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'test-normal-registration@example.com'
);

DELETE FROM users
WHERE email = 'test-normal-registration@example.com';
```

Lalu hapus dari Authentication via Dashboard.

---

## 🎉 Kesimpulan

Jika semua test **PASSED**, maka:

✅ **Fix Berhasil!** User yang gagal registrasi tidak akan masuk ke auth.users lagi.

Masalah registrasi sudah teratasi! 🚀
