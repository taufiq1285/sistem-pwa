# Complete Setup: Admin Panel & Mahasiswa Management

## 📋 Overview

Dokumentasi lengkap untuk setup admin panel yang bisa:
1. ✅ Lihat semua mahasiswa yang register
2. ✅ Membuat kelas baru
3. ✅ Assign mahasiswa ke kelas
4. ✅ Manage jadwal praktikum
5. ✅ Input kehadiran

---

## 🔄 Complete Flow Chart

```
┌──────────────────────────────────────────────────────────┐
│                   MAHASISWA REGISTER                      │
│  (RegisterForm.tsx → auth.register → createUserProfile)   │
└────────────┬─────────────────────────────────────────────┘
             │
      ┌──────▼───────┐
      │  Auth.signUp │
      │  Create Auth │
      │    User      │
      └──────┬───────┘
             │
      ┌──────▼──────────────────────────┐
      │  createUserProfile()            │
      │  ├─ INSERT into users table     │
      │  └─ INSERT into mahasiswa table │
      └──────┬──────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│         ADMIN PANEL (KelasPage.tsx)           │
│                                               │
│  1. Buka Admin → Users/Mahasiswa              │
│  ✅ Lihat semua mahasiswa                     │
│  (RLS Policy: "Admins can manage mahasiswa")  │
└────────────┬──────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│  2. Click Create Kelas                        │
│     ├─ Pilih Mata Kuliah                      │
│     ├─ Input Kode & Nama Kelas                │
│     ├─ Set Kuota                              │
│     └─ Save ✅                                 │
│                                               │
│  (RLS Policy: "Admins can manage all kelas")  │
└────────────┬──────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│  3. Click "Add Students" di Kelas             │
│     ├─ Query: getAllMahasiswa()               │
│     ├─ Select mahasiswa dari dropdown         │
│     ├─ Click "Enroll"                         │
│     └─ Save ✅                                 │
│                                               │
│  (RLS: kelas_mahasiswa INSERT)                │
└────────────┬──────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│  4. Dosen Input Jadwal Praktikum              │
│     (JadwalPage.tsx)                          │
│                                               │
│     ├─ Pilih Kelas                            │
│     ├─ Input Tanggal & Jam                    │
│     ├─ Pilih Laboratorium                     │
│     └─ Save ✅                                 │
└────────────┬──────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│  5. Dosen Input Kehadiran                     │
│     (KehadiranPage.tsx)                       │
│                                               │
│     ├─ Pilih Jadwal Praktikum                 │
│     ├─ Sistem auto-load mahasiswa dari       │
│     │  kelas_mahasiswa table                  │
│     ├─ Input status (hadir/izin/sakit/alpha) │
│     └─ Save ✅                                 │
└────────────┬──────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────┐
│  6. Lihat Report Kehadiran                    │
│     (Admin/Dosen)                             │
│                                               │
│     ✅ Per kelas                              │
│     ✅ Per mahasiswa                          │
│     ✅ Per tanggal                            │
└──────────────────────────────────────────────┘
```

---

## 🔐 RLS Policies Requirements

### Tabel: `users`
**RLS Status:** ❌ DISABLED (Perlu di-ENABLE)

**Policies yang ada:**
1. "Admins can manage all users" - Admin dapat lihat/modify semua user
2. "Allow authenticated users to read for auth" - Public read
3. "Enable read access for users" - Public read
4. "Users can update own profile" - User bisa update diri sendiri
5. "Users can view all users" - Public read

**Harusnya:**
- RLS ENABLED ✅
- Policies allow admin & user auth ✅

**Action:** Run SQL: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`

---

### Tabel: `mahasiswa`
**RLS Status:** ✅ ENABLED

**Policies yang ada:**
1. "Admins can manage mahasiswa" ✅ - Admin dapat manage
2. "Allow authenticated users to view mahasiswa" ✅ - Auth users bisa lihat
3. "Mahasiswa can update own profile" ✅ - User bisa update diri
4. "mahasiswa_insert_own" ✅ - User/admin bisa INSERT
5. "mahasiswa_select_own" ✅ - User/admin bisa SELECT
6. "mahasiswa_update_own" ✅ - User/admin bisa UPDATE

**Status:** ✅ GOOD! Semua policy sudah benar

---

### Tabel: `admin`
**RLS Status:** ❌ DISABLED (Perlu di-ENABLE)

**Policies yang ada:** 3 policies

**Action:** Run SQL: `ALTER TABLE admin ENABLE ROW LEVEL SECURITY;`

---

### Tabel: `dosen`
**RLS Status:** ❌ DISABLED (Perlu di-ENABLE)

**Policies yang ada:** 3 policies

**Action:** Run SQL: `ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;`

---

### Tabel: `kelas`
**RLS Status:** ✅ ENABLED

**Policies yang ada:**
1. "Admins can manage all kelas" ✅ - Admin dapat manage
2. "Dosen can insert kelas" ✅ - Dosen bisa create
3. "Dosen can manage own kelas" ✅ - Dosen manage kelas mereka
4. "Kelas viewable by authenticated users" ✅ - Auth users bisa lihat

**Status:** ✅ GOOD! Semua policy sudah benar

---

### Tabel: `kelas_mahasiswa`
**RLS Status:** ✅ ENABLED

**Policies yang ada:** 6 policies

**Status:** ✅ GOOD! Enrollment management sudah aman

---

## 🔧 Implementation Details

### 1. User Registration Flow
**File:** `src/lib/supabase/auth.ts`

```typescript
export async function register(data: RegisterData): Promise<AuthResponse> {
  // 1. Create auth user
  const { data: authData } = await supabase.auth.signUp({...});

  // 2. Create user profile & role-specific record
  await createUserProfile(authData.user.id, data);

  return { success: true };
}

async function createUserProfile(userId: string, data: RegisterData) {
  // 1. Insert into users table
  await supabase.from('users').insert({
    id: userId,
    full_name: data.full_name,
    email: data.email,
    role: data.role,
  });

  // 2. Insert into mahasiswa/dosen/laboran table
  if (data.role === 'mahasiswa') {
    await supabase.from('mahasiswa').insert({
      user_id: userId,
      nim: data.nim,
      program_studi: data.program_studi,
      angkatan: data.angkatan,
      semester: data.semester,
    });
  }
}
```

### 2. Admin Get Mahasiswa List
**File:** `src/lib/api/kelas.api.ts`

```typescript
export async function getAllMahasiswa() {
  // Get mahasiswa data
  const { data: mahasiswaData } = await supabase
    .from('mahasiswa')
    .select(`
      id,
      nim,
      user_id
    `)
    .order('nim', { ascending: true });

  // RLS check: Admin memiliki policy "Admins can manage mahasiswa"
  // ✅ Query hanya return mahasiswa yang admin bisa akses

  return mahasiswaData;
}
```

### 3. Admin Create Kelas & Assign Mahasiswa
**File:** `src/pages/admin/KelasPage.tsx`

```typescript
// 1. Create kelas
const { error } = await supabase.from('kelas').insert({
  mata_kuliah_id: selectedMataKuliah.id,
  dosen_id: selectedDosen.id,
  kode_kelas: formData.kode_kelas,
  nama_kelas: formData.nama_kelas,
  // ...
});

// 2. Assign mahasiswa
const { error } = await supabase
  .from('kelas_mahasiswa')
  .insert({
    kelas_id: kelasId,
    mahasiswa_id: selectedMahasiswaId,
    is_active: true,
  });
```

---

## 📊 Data Model

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ email       │
│ full_name   │
│ role        │
│ is_active   │
└──────┬──────┘
       │ (1:1)
       │
  ┌────┴─────────────────────────┐
  │                              │
┌─┴──────────┐           ┌──────┴──┐
│ mahasiswa  │           │ admin   │
├────────────┤           ├─────────┤
│ id (PK)    │           │ id (PK) │
│ user_id(FK)│───┐       │ user_id │
│ nim        │   │       │ level   │
│ program... │   │       └─────────┘
└────────────┘   │
                 │
            ┌────┴────────────────────────┐
            │                             │
       ┌────┴─────────┐          ┌───────┴────┐
       │ kelas_mahasiswa (junction)         │
       ├────────────────┤                   │
       │ id (PK)        │                   │
       │ kelas_id (FK)──┼───────────┐       │
       │ mahasiswa_id(FK)           │       │
       │ enrolled_at    │      ┌────┴──────┐
       │ is_active      │      │   kelas   │
       └────────────────┘      ├───────────┤
                               │ id (PK)   │
                               │ nama      │
                               │ kuota     │
                               │ dosen_id──┼──────┐
                               └───────────┘      │
                                            ┌──────┴───┐
                                            │  dosen   │
                                            ├──────────┤
                                            │ id (PK)  │
                                            │ user_id  │
                                            │ nidn     │
                                            └──────────┘
```

---

## 🧪 Testing Checklist

- [ ] **Test 1:** Mahasiswa register sukses
  - [ ] Auth user created
  - [ ] User record di tabel users
  - [ ] Mahasiswa record di tabel mahasiswa

- [ ] **Test 2:** Admin bisa lihat mahasiswa
  - [ ] Login sebagai admin
  - [ ] Buka admin panel mahasiswa list
  - [ ] Verify: Lihat semua mahasiswa yang terdaftar

- [ ] **Test 3:** Admin create kelas
  - [ ] Click "Create Kelas"
  - [ ] Isi form lengkap
  - [ ] Kelas terbuat sukses

- [ ] **Test 4:** Admin assign mahasiswa ke kelas
  - [ ] Select kelas
  - [ ] Click "Add Students"
  - [ ] Verify: Lihat dropdown dengan semua mahasiswa
  - [ ] Select mahasiswa → Enroll
  - [ ] Mahasiswa sukses di-assign

- [ ] **Test 5:** Mahasiswa bisa lihat kelas mereka
  - [ ] Login sebagai mahasiswa
  - [ ] Buka "Available Classes"
  - [ ] Verify: Lihat kelas yang mereka enroll

- [ ] **Test 6:** Dosen create jadwal
  - [ ] Login sebagai dosen
  - [ ] Create jadwal praktikum
  - [ ] Select kelas, tanggal, jam, lab
  - [ ] Jadwal terbuat sukses

- [ ] **Test 7:** Dosen input kehadiran
  - [ ] Login sebagai dosen
  - [ ] Buka kehadiran page
  - [ ] Select jadwal praktikum
  - [ ] Verify: Mahasiswa auto-load dari enrollment
  - [ ] Input status untuk setiap mahasiswa
  - [ ] Save sukses

---

## 🚀 Status

**Current Status:** ⏳ Waiting for RLS Fix

**Pending Tasks:**
1. ⏳ Run: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
2. ⏳ Run: `ALTER TABLE admin ENABLE ROW LEVEL SECURITY;`
3. ⏳ Run: `ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;`
4. ⏳ Test mahasiswa registration & admin visibility

**Completion:** After RLS fixes + testing = 100% Ready! 🎉

---

**Last Updated:** 2025-11-27
**Documentation Version:** 1.0
**Status:** Complete Setup Guide
