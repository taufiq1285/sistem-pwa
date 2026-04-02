# 🔧 FIX: Email Sudah Terdaftar Tapi Tidak Bisa Login

## 🐛 Masalah

User mencoba registrasi → Error → Email sudah terdaftar tapi tidak bisa login

**Root Cause:**

- ✅ User berhasil dibuat di Supabase Auth
- ❌ Data profile gagal dibuat di database
- ❌ User tidak bisa login karena data tidak lengkap

---

## ✅ Solusi 1: Hapus User Manual (Via Supabase Dashboard)

### Step 1: Buka Supabase Dashboard

1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **Authentication** di sidebar
4. Klik **Users**

### Step 2: Cari & Hapus User

1. Cari email user yang bermasalah (contoh: `asti@test.com`)
2. Klik **•••** (three dots) di row user tersebut
3. Pilih **Delete User**
4. Confirm deletion

### Step 3: User Bisa Daftar Ulang

Setelah dihapus, user bisa registrasi lagi dengan email yang sama.

---

## ✅ Solusi 2: Hapus Via SQL Editor (Lebih Cepat)

### Step 1: Buka SQL Editor

1. Di Supabase Dashboard, klik **SQL Editor**
2. Klik **New Query**

### Step 2: Cari User ID

```sql
-- Cari user berdasarkan email
SELECT
  au.id as user_id,
  au.email,
  u.id as profile_exists
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'asti@test.com';  -- Ganti dengan email yang bermasalah
```

### Step 3: Hapus dari Database Tables

Copy `user_id` dari hasil query, lalu:

```sql
-- Ganti 'USER_ID_DISINI' dengan ID dari step 2
DELETE FROM mahasiswa WHERE user_id = 'USER_ID_DISINI';
DELETE FROM dosen WHERE user_id = 'USER_ID_DISINI';
DELETE FROM laboran WHERE user_id = 'USER_ID_DISINI';
DELETE FROM users WHERE id = 'USER_ID_DISINI';
```

### Step 4: Hapus dari Auth (Dashboard atau Function)

**Option A: Via Dashboard**

- Ikuti Solusi 1 Step 2

**Option B: Via Edge Function** (Jika sudah deploy)

```javascript
const response = await fetch(
  "https://YOUR_PROJECT.supabase.co/functions/v1/delete-auth-user",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer YOUR_ACCESS_TOKEN",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: "USER_ID_DISINI" }),
  }
);
```

---

## ✅ Solusi 3: Bulk Cleanup Test Users

Jika banyak test user yang bermasalah:

```sql
-- HATI-HATI: Ini akan hapus SEMUA user dengan email mengandung 'test'
-- Hanya untuk development!

-- 1. Hapus dari role tables
DELETE FROM mahasiswa WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);
DELETE FROM dosen WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);
DELETE FROM laboran WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%test%'
);

-- 2. Hapus dari users table
DELETE FROM users WHERE email LIKE '%test%';

-- 3. Hapus dari auth.users (manual di Dashboard)
-- Atau gunakan edge function untuk setiap user
```

---

## 🔍 Debug: Cek Status User

```sql
-- Query untuk cek lengkap status user
SELECT
  au.id,
  au.email,
  au.created_at,
  u.id as has_users_entry,
  u.role,
  m.id as has_mahasiswa_profile,
  d.id as has_dosen_profile,
  l.id as has_laboran_profile,
  CASE
    WHEN u.id IS NULL THEN '❌ Missing users table'
    WHEN u.role = 'mahasiswa' AND m.user_id IS NULL THEN '❌ Missing mahasiswa profile'
    WHEN u.role = 'dosen' AND d.user_id IS NULL THEN '❌ Missing dosen profile'
    WHEN u.role = 'laboran' AND l.user_id IS NULL THEN '❌ Missing laboran profile'
    ELSE '✅ Complete'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN mahasiswa m ON u.id = m.user_id
LEFT JOIN dosen d ON u.id = d.user_id
LEFT JOIN laboran l ON u.id = l.user_id
WHERE au.email = 'asti@test.com'  -- Ganti email disini
ORDER BY au.created_at DESC;
```

---

## 🚀 Cara Mencegah Di Masa Depan

### Fix Sudah Diterapkan:

✅ **Automatic Rollback** - Jika profile creation gagal, auth user akan otomatis dihapus
✅ **Better Error Logging** - Error lebih jelas di console
✅ **Transaction-like Behavior** - Auth creation + profile creation lebih atomic

### Code yang Sudah Diupdate:

File: `src/lib/supabase/auth.ts`

```typescript
// Sekarang jika createUserProfile gagal, auth user akan di-rollback
try {
  await createUserProfile(authData.user.id, data);
} catch (profileError) {
  // Rollback auth user
  await supabase.auth.admin.deleteUser(authData.user.id);
  throw new Error("Gagal membuat profil");
}
```

---

## 📝 Untuk Kasus Anda (asti@test.com)

### Quick Fix:

1. Buka Supabase Dashboard → Authentication → Users
2. Cari `asti@test.com`
3. Delete user
4. Coba registrasi ulang

Atau pakai SQL:

```sql
-- 1. Cari ID
SELECT id FROM auth.users WHERE email = 'asti@test.com';

-- 2. Copy ID, lalu delete
DELETE FROM mahasiswa WHERE user_id = 'PASTE_ID_DISINI';
DELETE FROM users WHERE id = 'PASTE_ID_DISINI';

-- 3. Delete dari Dashboard Authentication → Users
```

---

## ⚠️ Important Notes

- ✅ **Development**: Aman untuk delete test users
- ⚠️ **Production**: Double check sebelum delete
- 🔒 **Admin Only**: Hanya admin yang bisa delete users
- 📧 **Email Verification**: Pastikan email verification setting sesuai kebutuhan

---

## 🆘 Jika Masih Error

Check console untuk error detail:

- Network error → Cek koneksi internet
- Permission error → Cek RLS policies
- Constraint error → Cek foreign key constraints
- Duplicate key → User sudah ada (pakai solusi diatas)

---

**Last Updated:** December 5, 2025
**Status:** ✅ Fix Applied + Documentation Complete
