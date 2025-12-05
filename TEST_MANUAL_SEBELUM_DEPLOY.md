# Test Manual Sebelum Deploy Fix Registration

## 🎯 Tujuan Test

Memverifikasi bahwa masalah registrasi memang terjadi SEBELUM deploy fix, sehingga kita yakin fix yang dibuat benar-benar diperlukan.

## ⚠️ PENTING

Test ini akan membuat **user sampah** di database production. Siapkan cara untuk cleanup setelah test (lihat bagian Cleanup di bawah).

---

## 📋 Test Scenario 1: Reproduksi Masalah (Sebelum Deploy)

### Langkah Test:

#### 1. **Cek Status Awal**

Di Supabase Dashboard > SQL Editor, jalankan:

```sql
-- Cek trigger masih ada
SELECT
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';
```

**Expected**: Harus return 1 row (trigger masih aktif)

```sql
-- Count users sekarang
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users;
```

**Catat hasilnya** untuk dibandingkan nanti.

---

#### 2. **Test Registrasi dengan NIM yang Sudah Ada**

A. Cari NIM mahasiswa yang sudah terdaftar:

```sql
SELECT nim, user_id FROM mahasiswa LIMIT 1;
```

Catat NIM-nya, misalnya: `123456789`

B. Buka aplikasi di browser (Incognito/Private mode)

C. Coba registrasi dengan data:
```
Email: test-duplicate-nim@example.com
Password: test123456
Full Name: Test Duplicate NIM
Role: Mahasiswa
NIM: 123456789  <-- GUNAKAN NIM YANG SUDAH ADA DARI QUERY ATAS
Program Studi: Teknik Informatika
Angkatan: 2024
Semester: 1
```

D. Klik "Daftar"

**Expected Result**:
- ❌ Error muncul: "Data sudah terdaftar (NIM duplicate)" atau similar
- ❌ User TIDAK bisa login
- ❌ Tapi...

---

#### 3. **Verifikasi Masalah: User Masuk ke Auth Meskipun Gagal**

Di Supabase Dashboard:

**A. Cek Authentication > Users**

Cari email: `test-duplicate-nim@example.com`

**Expected (MASALAH)**: ❌ **User ADA di list!** Ini masalahnya!

**B. Cek di SQL Editor:**

```sql
-- Cek di auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'test-duplicate-nim@example.com';
```

**Expected**: Harus return 1 row (user ada di auth)

```sql
-- Cek di public.users
SELECT id, email, full_name
FROM public.users
WHERE email = 'test-duplicate-nim@example.com';
```

**Expected**: Harus return 1 row (trigger otomatis buat user)

```sql
-- Cek di mahasiswa table
SELECT *
FROM mahasiswa m
JOIN public.users u ON m.user_id = u.id
WHERE u.email = 'test-duplicate-nim@example.com';
```

**Expected**: Return 0 rows (registrasi gagal, data mahasiswa tidak dibuat)

**KESIMPULAN**: User ada di `auth.users` dan `public.users` tapi TIDAK ada di `mahasiswa` → Ini adalah **partial registration** yang bermasalah!

---

#### 4. **Test Registrasi dengan Email yang Sudah Ada**

A. Cari email yang sudah terdaftar:

```sql
SELECT email FROM users LIMIT 1;
```

Catat email-nya.

B. Coba registrasi dengan email yang sama di aplikasi

**Expected**:
- ❌ Error: "Email sudah terdaftar"
- ✅ User TIDAK masuk ke auth (ini harusnya sudah di-handle Supabase)

---

## 📊 Hasil yang Diharapkan (Sebelum Deploy)

| Test Case | Registrasi Sukses? | User di auth.users? | User di public.users? | User di mahasiswa? | Status |
|-----------|-------------------|---------------------|----------------------|-------------------|---------|
| NIM Duplicate | ❌ Gagal | ❌ **TAPI ADA** (BUG!) | ❌ **TAPI ADA** (BUG!) | ✅ Tidak ada | **BROKEN** |
| Email Duplicate | ❌ Gagal | ✅ Tidak ada | ✅ Tidak ada | ✅ Tidak ada | OK |

---

## 🧹 Cleanup Setelah Test

Hapus user test yang dibuat:

```sql
-- 1. Hapus dari mahasiswa (jika ada)
DELETE FROM mahasiswa
WHERE user_id IN (
    SELECT id FROM users WHERE email = 'test-duplicate-nim@example.com'
);

-- 2. Hapus dari public.users
DELETE FROM users
WHERE email = 'test-duplicate-nim@example.com';

-- 3. Hapus dari auth.users (perlu admin access)
-- Lakukan via Supabase Dashboard > Authentication > Users
-- Cari email test-duplicate-nim@example.com dan klik Delete
```

Atau gunakan edge function yang sudah ada:

```bash
# Via API call (perlu auth token admin)
curl -X POST \
  https://lqkzhrdhrbexdtrgmogd.supabase.co/functions/v1/delete-auth-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID_DARI_QUERY"}'
```

---

## ✅ Setelah Deploy Fix

Ulangi Test Scenario 1 dengan email berbeda:
- Email: `test-after-fix@example.com`
- NIM: Gunakan NIM yang sama (yang duplicate)

**Expected (SETELAH FIX)**:

| Test Case | Registrasi Sukses? | User di auth.users? | User di public.users? | User di mahasiswa? | Status |
|-----------|-------------------|---------------------|----------------------|-------------------|---------|
| NIM Duplicate | ❌ Gagal | ✅ **TIDAK ADA** (FIXED!) | ✅ **TIDAK ADA** (FIXED!) | ✅ Tidak ada | **FIXED!** |

---

## 📝 Checklist Test

**Sebelum Deploy:**
- [ ] Jalankan `backup-before-deploy.sql` dan save hasilnya
- [ ] Test registrasi dengan NIM duplicate
- [ ] Verifikasi user masuk ke auth.users (masalah terkonfirmasi)
- [ ] Screenshot untuk dokumentasi
- [ ] Cleanup user test

**Siap Deploy:**
- [ ] Backup data sudah disave
- [ ] Masalah sudah terkonfirmasi
- [ ] Siap deploy migration + edge function

**Setelah Deploy:**
- [ ] Test registrasi dengan NIM duplicate lagi
- [ ] Verifikasi user TIDAK masuk ke auth.users (fix berhasil)
- [ ] Test registrasi normal (harus tetap berfungsi)
- [ ] Screenshot hasil test

---

## 🚨 Troubleshooting

### Masalah: User test tidak bisa dihapus dari auth.users

**Solusi**: Gunakan Supabase Dashboard:
1. Go to Authentication > Users
2. Cari email test
3. Klik "..." > "Delete User"

### Masalah: Trigger tidak ada di hasil query

Berarti trigger sudah dihapus. Deploy migration tidak diperlukan, tinggal deploy edge function saja.

### Masalah: Test menunjukkan user TIDAK masuk ke auth.users

Berarti masalah sudah tidak terjadi (mungkin trigger sudah di-drop sebelumnya). Cek dengan:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Jika return 0 rows, trigger sudah tidak ada.
