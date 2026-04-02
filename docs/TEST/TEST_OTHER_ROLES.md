# Test Rollback Mechanism - Role Lain

## 🎯 Tujuan

Memverifikasi bahwa rollback mechanism juga bekerja untuk role:
- Dosen (NIP/NIDN duplicate)
- Laboran (NIP duplicate)
- Admin (jika ada unique constraint)

---

## 📋 Test 1: Dosen dengan NIDN Duplicate

### Persiapan

**STEP 1: Buat dosen pertama (normal registration)**

1. Buka aplikasi → Register
2. Isi data:
   ```
   Email: dosen1@akbid.ac.id
   Password: test123456
   Full Name: Dosen Test 1
   Role: Dosen
   NIDN: 1234567890
   NIP: 9876543210 (optional)
   Gelar Depan: Dr. (optional)
   Gelar Belakang: M.Kom (optional)
   ```

3. **Expected**: Registrasi sukses

**STEP 2: Verifikasi dosen pertama di database**

```sql
SELECT d.*, u.email, u.full_name
FROM dosen d
JOIN public.users u ON d.user_id = u.id
WHERE d.nidn = '1234567890';
```

Expected: 1 row (dosen berhasil dibuat)

---

### Test Execution: NIDN Duplicate

**STEP 3: Coba registrasi dengan NIDN yang sama**

1. Buka Incognito browser
2. Register dengan:
   ```
   Email: dosen-duplicate@akbid.ac.id  ← EMAIL BARU
   Password: test123456
   Full Name: Dosen Duplicate
   Role: Dosen
   NIDN: 1234567890  ← SAMA (DUPLICATE!)
   NIP: 1111111111
   ```

3. **Expected**:
   - ❌ Error: "Data sudah terdaftar" atau "duplicate key"
   - ❌ Tidak bisa login

---

### Verifikasi Rollback

**STEP 4: Cek user TIDAK ada di database**

```sql
-- Cek di auth.users
SELECT * FROM auth.users
WHERE email = 'dosen-duplicate@akbid.ac.id';
```

**Expected**: ✅ **0 rows** (rollback berhasil!)

```sql
-- Cek statistik
SELECT
    (SELECT COUNT(*) FROM auth.users) AS auth_users,
    (SELECT COUNT(*) FROM public.users) AS public_users,
    (SELECT COUNT(*) FROM dosen) AS total_dosen,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;
```

**Expected**:
- total_dosen: **1** (tidak bertambah)
- orphaned_users: **1** (tidak bertambah)

---

## 📋 Test 2: Laboran dengan NIP Duplicate

### Persiapan

**STEP 1: Buat laboran pertama**

```
Email: laboran1@akbid.ac.id
Password: test123456
Full Name: Laboran Test 1
Role: Laboran
NIP: 5555555555
```

**STEP 2: Verifikasi**

```sql
SELECT l.*, u.email, u.full_name
FROM laboran l
JOIN public.users u ON l.user_id = u.id
WHERE l.nip = '5555555555';
```

Expected: 1 row

---

### Test Execution: NIP Duplicate

**STEP 3: Registrasi dengan NIP yang sama**

```
Email: laboran-duplicate@akbid.ac.id
Role: Laboran
NIP: 5555555555  ← DUPLICATE!
```

**Expected**: Error dan rollback

---

### Verifikasi

```sql
-- User TIDAK ada
SELECT * FROM auth.users
WHERE email = 'laboran-duplicate@akbid.ac.id';
```

Expected: ✅ **0 rows**

```sql
-- Statistik
SELECT
    (SELECT COUNT(*) FROM laboran) AS total_laboran,
    (SELECT COUNT(*) FROM auth.users au
     LEFT JOIN public.users pu ON au.id = pu.id
     WHERE pu.id IS NULL) AS orphaned_users;
```

Expected:
- total_laboran: **1** (tidak bertambah)
- orphaned_users: **1** (tidak bertambah)

---

## ⚠️ Test 3: Admin Role (WARNING!)

### ⚠️ PERHATIAN

**Role Admin TIDAK ADA handler di `createUserProfile()`!**

Artinya:
- ❌ Registrasi admin akan **SELALU GAGAL** (data admin tidak dibuat)
- ⚠️ User akan masuk `auth.users` dan `public.users` tapi tidak ada di table `admin`
- ✅ Rollback **AKAN BEKERJA** (menghapus user dari auth)

---

### Test Execution (Optional)

**Hanya test jika Anda ingin verify rollback untuk admin:**

1. Register sebagai admin:
   ```
   Email: admin-test@akbid.ac.id
   Role: Admin
   ```

2. **Expected**:
   - ❌ Registrasi gagal (tidak ada code untuk create admin)
   - ✅ User ter-rollback (tidak masuk database)

---

### Fix untuk Admin Role (Jika Diperlukan)

Jika Anda butuh fitur registrasi admin, perlu tambahkan code di `createUserProfile()`:

```typescript
else if (data.role === "admin") {
  const { error: adminError } = await supabase.from("admin").insert([
    {
      user_id: userId,
      level: data.level || 'staff', // atau default level
      permissions: data.permissions || {},
    },
  ]);

  if (adminError) throw adminError;
  logger.debug("createUserProfile: Admin record created", { userId });
}
```

**TAPI** biasanya admin tidak dibuat via public registration, melainkan via:
- Admin panel
- Database migration
- Invite system

---

## 📊 Summary Test Results

| Role | Test Case | User di DB? | Rollback? | Status |
|------|-----------|-------------|-----------|--------|
| Mahasiswa | NIM Duplicate | ❌ Tidak | ✅ Ya | ✅ **TESTED & PASSED** |
| Dosen | NIDN Duplicate | ❌ Tidak | ✅ Ya | ⬜ Need test |
| Laboran | NIP Duplicate | ❌ Tidak | ✅ Ya | ⬜ Need test |
| Admin | No handler | ❌ Tidak | ✅ Ya | ⚠️ No handler |

---

## 🔍 Checklist Unique Constraints

Perlu cek apakah table punya unique constraint:

```sql
-- Cek unique constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('mahasiswa', 'dosen', 'laboran', 'admin')
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;
```

**Expected unique constraints:**
- `mahasiswa.nim` → UNIQUE ✅
- `dosen.nidn` → UNIQUE ✅
- `dosen.nip` → UNIQUE ✅
- `laboran.nip` → UNIQUE ✅
- `admin.???` → Cek apakah ada

---

## ✅ Kesimpulan

**Rollback mechanism AMAN untuk semua role yang memiliki:**
1. ✅ Handler di `createUserProfile()`
2. ✅ Unique constraint di database
3. ✅ RLS policy yang benar

**Role yang sudah aman:**
- ✅ Mahasiswa (tested & verified)
- ✅ Dosen (code ada, perlu test)
- ✅ Laboran (code ada, perlu test)
- ⚠️ Admin (tidak ada handler, tapi rollback tetap jalan)

---

## 🎯 Rekomendasi

1. **Test Dosen & Laboran** (opsional tapi recommended)
   - Untuk memastikan 100% semua role aman
   - Gunakan panduan di atas

2. **Admin Role**:
   - Jika tidak perlu public registration → Biarkan saja ✅
   - Jika perlu public registration → Tambah handler ⚠️

3. **Monitor unique constraints**:
   - Pastikan semua field penting punya unique constraint
   - Rollback hanya efektif jika ada constraint yang dilanggar
