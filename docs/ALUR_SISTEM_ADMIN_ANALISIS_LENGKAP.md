# 📊 ANALISIS LENGKAP ALUR SISTEM - ROLE ADMIN

> **Tanggal Analisis:** 8 Desember 2025  
> **Status:** ✅ Verified from actual codebase

---

## 🎯 KESIMPULAN UTAMA

Berdasarkan analisis mendalam terhadap kode, database schema, dan RLS policies, berikut adalah **ALUR YANG SEBENARNYA TERJADI**:

### ✅ **YANG BENAR (Confirmed)**

1. **Admin dapat membuat MATA KULIAH** ✅
2. **Admin dapat membuat KELAS tanpa terikat mata kuliah** ✅
3. **Kelas berdiri sendiri (standalone)** ✅
4. **Admin assign mahasiswa ke kelas** ✅
5. **Admin dapat hapus kelas** ✅

---

## 📋 ALUR LENGKAP ROLE ADMIN

### **1️⃣ PERMISSIONS ADMIN**

**File:** `src/types/role.types.ts`

```typescript
admin: {
  permissions: [
    "manage:mata_kuliah", // ✅ Kelola mata kuliah
    "manage:kelas", // ✅ Kelola kelas
    "manage:kelas_mahasiswa", // ✅ Kelola enrollment mahasiswa
    "manage:mahasiswa", // ✅ Kelola data mahasiswa
    "manage:user", // ✅ Kelola users
    // ... 26 total permissions
  ];
}
```

**RLS Policies (Database):**

```sql
-- Tabel: kelas
CREATE POLICY "kelas_insert_admin" ON kelas
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "kelas_update_admin" ON kelas
    FOR UPDATE USING (is_admin());

CREATE POLICY "kelas_delete_admin" ON kelas
    FOR DELETE USING (is_admin());

-- Tabel: mata_kuliah
CREATE POLICY "mata_kuliah_insert_admin" ON mata_kuliah
    FOR INSERT WITH CHECK (is_admin());

-- Tabel: kelas_mahasiswa
CREATE POLICY "kelas_mahasiswa_insert_admin" ON kelas_mahasiswa
    FOR INSERT WITH CHECK (is_admin());
```

✅ **KESIMPULAN:** Admin punya **FULL ACCESS** ke semua tabel penting.

---

### **2️⃣ ALUR MATA KULIAH**

**File:** `src/lib/api/mata-kuliah.api.ts`

#### **2.1. Admin Membuat Mata Kuliah**

```typescript
// API Call
createMataKuliah({
  kode_mk: "PRAK-001",
  nama_mk: "Praktikum Kebidanan",
  sks: 2,
  semester: 1,
  program_studi: "D3 Kebidanan",
  is_active: true,
});
```

**Database Schema:**

```sql
CREATE TABLE mata_kuliah (
    id UUID PRIMARY KEY,
    kode_mk VARCHAR(20) UNIQUE NOT NULL,
    nama_mk VARCHAR(255) NOT NULL,
    sks INTEGER,
    semester INTEGER,
    program_studi VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);
```

#### **2.2. Admin Hapus Mata Kuliah**

```typescript
// ⚠️ VALIDATION: Tidak bisa hapus jika masih ada kelas terkait
async function deleteMataKuliahImpl(id: string) {
  // Check if mata kuliah has kelas
  const kelasCount = await count("kelas", [
    { column: "mata_kuliah_id", operator: "eq", value: id },
  ]);

  if (kelasCount > 0) {
    throw new Error(
      "Cannot delete mata kuliah that has active kelas. " +
        "Please delete all kelas first."
    );
  }

  return await remove("mata_kuliah", id);
}
```

✅ **KESIMPULAN:** Admin bisa create/update/delete mata kuliah, TAPI tidak bisa delete jika masih ada kelas yang menggunakan.

---

### **3️⃣ ALUR KELAS (PALING PENTING)**

**File:** `src/pages/admin/KelasPage.tsx`

#### **3.1. Schema Kelas (Database)**

**File:** `supabase/migrations/01_tables.sql`

```sql
CREATE TABLE kelas (
    id UUID PRIMARY KEY,
    mata_kuliah_id UUID REFERENCES mata_kuliah(id),  -- ❌ NOT NULL (awalnya)
    dosen_id UUID REFERENCES dosen(id),              -- ❌ NOT NULL (awalnya)
    kode_kelas VARCHAR(10),
    nama_kelas VARCHAR(255) NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester_ajaran INTEGER NOT NULL,
    kuota INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true
);
```

**File:** `supabase/migrations/09_make_kelas_fields_nullable.sql`

```sql
-- ✅ PERUBAHAN PENTING!
ALTER TABLE kelas
    ALTER COLUMN mata_kuliah_id DROP NOT NULL;  -- ✅ NULLABLE sekarang

ALTER TABLE kelas
    ALTER COLUMN dosen_id DROP NOT NULL;        -- ✅ NULLABLE sekarang

ALTER TABLE kelas
    ALTER COLUMN kode_kelas DROP NOT NULL;      -- ✅ NULLABLE sekarang

COMMENT ON COLUMN kelas.mata_kuliah_id IS
  'Optional - nullable to support standalone class lists';

COMMENT ON COLUMN kelas.dosen_id IS
  'Optional - nullable to support standalone class lists';
```

✅ **ARTINYA:** Kelas **TIDAK WAJIB** terikat dengan mata kuliah atau dosen!

---

#### **3.2. Admin Membuat Kelas**

**File:** `src/pages/admin/KelasPage.tsx` (line 150-210)

```typescript
// Form untuk create kelas
const formData = {
  nama_kelas: "", // ✅ WAJIB
  semester_ajaran: 1, // ✅ WAJIB
  tahun_ajaran: "2024/2025", // ✅ WAJIB
};

// ❌ TIDAK ADA field: mata_kuliah_id
// ❌ TIDAK ADA field: dosen_id

// Create kelas
await createKelas({
  ...formData,
  is_active: true,
});
```

**File:** `src/lib/api/kelas.api.ts`

```typescript
// API implementation
async function createKelasImpl(data: CreateKelasData): Promise<Kelas> {
  return await insert<Kelas>("kelas", {
    nama_kelas: data.nama_kelas,
    kode_kelas: data.kode_kelas || null, // ✅ Optional
    mata_kuliah_id: data.mata_kuliah_id || null, // ✅ Optional (NULL)
    dosen_id: data.dosen_id || null, // ✅ Optional (NULL)
    semester_ajaran: data.semester_ajaran,
    tahun_ajaran: data.tahun_ajaran,
    kuota: data.kuota || 40,
    is_active: data.is_active ?? true,
  });
}
```

✅ **KESIMPULAN:** Admin membuat kelas **TANPA** pilih mata kuliah atau dosen!

---

#### **3.3. Admin Assign Mahasiswa ke Kelas**

**File:** `src/pages/admin/KelasPage.tsx` (line 230-300)

```typescript
// 1. Admin click "Manage Students" button
handleManageStudents(kelas) {
  // Load enrolled students
  const enrolled = await getEnrolledStudents(kelas.id);

  // Load all available mahasiswa
  const all = await getAllMahasiswa();

  setShowStudentsDialog(true);
}

// 2. Admin add student (2 cara):

// CARA A: Pilih dari mahasiswa yang sudah ada
await enrollStudent(kelasId, mahasiswaId);

// CARA B: Input manual (buat mahasiswa baru sekaligus enroll)
await createOrEnrollMahasiswa(kelasId, {
  full_name: "Siti Nurhaliza",
  nim: "BD2321001",
  email: "siti@mahasiswa.ac.id"
});
```

**File:** `src/lib/api/kelas.api.ts`

```typescript
// Validation saat enroll
async function enrollStudentImpl(kelasId, mahasiswaId) {
  // ✅ STEP 1: Get kelas info
  const { kuota, nama_kelas } = await getKelas(kelasId);

  // ✅ STEP 2: Check kapasitas
  const currentEnrollment = await count("kelas_mahasiswa", [
    { column: "kelas_id", operator: "eq", value: kelasId },
  ]);

  if (currentEnrollment >= kuota) {
    throw new Error(`Kelas ${nama_kelas} sudah penuh!`);
  }

  // ✅ STEP 3: Check duplicate
  const existing = await checkExisting(kelasId, mahasiswaId);
  if (existing) {
    throw new Error("Mahasiswa sudah terdaftar di kelas ini");
  }

  // ✅ STEP 4: Enroll
  await insert("kelas_mahasiswa", {
    kelas_id: kelasId,
    mahasiswa_id: mahasiswaId,
    is_active: true,
  });
}
```

✅ **KESIMPULAN:** Admin bisa assign mahasiswa dengan validation kuota dan duplicate.

---

#### **3.4. Admin Hapus Kelas**

**File:** `src/pages/admin/KelasPage.tsx`

```typescript
const handleDelete = (kelas: Kelas) => {
  setDeletingKelas(kelas);
  setIsDeleteDialogOpen(true);
};

const confirmDelete = async () => {
  await deleteKelas(deletingKelas.id);
  toast.success("Kelas berhasil dihapus");
};
```

**File:** `src/lib/api/kelas.api.ts`

```typescript
async function deleteKelasImpl(id: string): Promise<boolean> {
  return await remove("kelas", id);
}
```

**Database:** Cascade Delete

```sql
CREATE TABLE kelas_mahasiswa (
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE
);

CREATE TABLE jadwal_praktikum (
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE
);
```

✅ **KESIMPULAN:** Admin bisa hapus kelas, dan semua data terkait (enrollment, jadwal) akan terhapus otomatis (CASCADE).

---

## 🔄 ALUR LENGKAP: ADMIN WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN PANEL - Complete Workflow                │
└─────────────────────────────────────────────────────────────┘

STEP 1: Buat Mata Kuliah (Optional)
├─ Admin → Menu "Mata Kuliah"
├─ Click "Tambah Mata Kuliah"
├─ Input:
│  ├─ Kode MK: "PRAK-001"
│  ├─ Nama MK: "Praktikum Kebidanan"
│  ├─ SKS: 2
│  ├─ Semester: 1
│  └─ Program Studi: "D3 Kebidanan"
└─ Save → mata_kuliah table

STEP 2: Buat Kelas (Standalone)
├─ Admin → Menu "Kelas"
├─ Click "Tambah Kelas"
├─ Input:
│  ├─ Nama Kelas: "Kelas A (Pin Merah - 2022)"
│  ├─ Semester: 1
│  ├─ Tahun Ajaran: "2024/2025"
│  ├─ ❌ TIDAK pilih mata kuliah
│  └─ ❌ TIDAK pilih dosen
└─ Save → kelas table (mata_kuliah_id = NULL, dosen_id = NULL)

STEP 3: Assign Mahasiswa ke Kelas
├─ Admin → Kelas List
├─ Click "Manage Students" pada kelas yang dipilih
├─ Dialog muncul dengan 2 options:
│
│  OPTION A: Pilih dari mahasiswa yang sudah ada
│  ├─ Dropdown mahasiswa (dari tabel mahasiswa)
│  ├─ Select mahasiswa
│  └─ Click "Add" → Insert ke kelas_mahasiswa
│
│  OPTION B: Input mahasiswa baru manual
│  ├─ Input NIM: "BD2321001"
│  ├─ Input Nama: "Siti Nurhaliza"
│  ├─ Input Email: "siti@mahasiswa.ac.id"
│  ├─ System create:
│  │  ├─ User account (users table)
│  │  └─ Mahasiswa record (mahasiswa table)
│  └─ Auto-enroll ke kelas (kelas_mahasiswa table)
│
└─ Result: Mahasiswa ter-assign ke kelas

STEP 4: Mahasiswa dapat lihat kelas mereka
├─ Mahasiswa login
├─ Dashboard mahasiswa
└─ Lihat kelas yang mereka enrolled (via kelas_mahasiswa)

STEP 5: Dosen membuat jadwal
├─ Dosen login
├─ Menu "Jadwal"
├─ Click "Tambah Jadwal"
├─ Pilih kelas dari dropdown (hanya kelas yang punya mahasiswa)
├─ Input tanggal, jam, laboratorium
└─ Save → jadwal_praktikum table

STEP 6: Admin bisa hapus kelas
├─ Admin → Kelas List
├─ Click "Delete" pada kelas
├─ Confirm delete
└─ Kelas dihapus (CASCADE: enrollment & jadwal juga terhapus)
```

---

## 📊 RELASI TABEL (Current State)

```
┌──────────────┐
│ mata_kuliah  │ (Optional - bisa standalone)
└──────┬───────┘
       │ (NULLABLE FK)
       │
┌──────▼───────┐        ┌───────────────┐
│    kelas     │───────→│ kelas_mahasiswa│ (many-to-many)
└──────┬───────┘        └────────┬──────┘
       │ (NULLABLE FK)           │
       │                         │
┌──────▼───────┐        ┌───────▼──────┐
│    dosen     │        │  mahasiswa   │
└──────────────┘        └──────────────┘
       │
       │
┌──────▼─────────────┐
│ jadwal_praktikum   │
└────────────────────┘
```

**Key Points:**

1. ✅ `kelas.mata_kuliah_id` → **NULLABLE** (kelas bisa standalone)
2. ✅ `kelas.dosen_id` → **NULLABLE** (dosen assign nanti)
3. ✅ `kelas_mahasiswa` → Junction table (many-to-many)
4. ✅ Admin full control semua tabel

---

## ❓ PERTANYAAN KLARIFIKASI

Berdasarkan analisis, ada **INKONSISTENSI** dalam sistem:

### **Inkonsistensi #1: Mata Kuliah**

**Pertanyaan:** Apakah kelas HARUS terikat dengan mata kuliah?

- **Saat ini:** TIDAK wajib (nullable)
- **Dokumentasi CREATE_3_KELAS:** Buat kelas dengan mata_kuliah_id
- **Form Admin:** Tidak ada pilihan mata kuliah

**Rekomendasi:** Pilih salah satu:

- **Option A:** Kelas standalone (hapus mata_kuliah_id sepenuhnya)
- **Option B:** Kelas wajib punya mata kuliah (add form field)

---

### **Inkonsistensi #2: Dosen**

**Pertanyaan:** Kapan dosen di-assign ke kelas?

- **Saat ini:** TIDAK wajib (nullable)
- **RLS Policy:** Ada policy "Dosen can manage own kelas"
- **Form Admin:** Tidak ada pilihan dosen saat create

**Rekomendasi:**

- Admin buat kelas → dosen_id = NULL
- Dosen assign ke kelas nanti (by admin or auto)

---

## ✅ KESIMPULAN FINAL

### **ALUR YANG TERJADI SEKARANG:**

1. ✅ Admin membuat MATA KULIAH (optional, berdiri sendiri)
2. ✅ Admin membuat KELAS (standalone, tidak terikat mata kuliah/dosen)
3. ✅ Admin assign MAHASISWA ke kelas (manual atau create new)
4. ✅ Mahasiswa bisa lihat kelas mereka (via kelas_mahasiswa)
5. ✅ Dosen buat JADWAL untuk kelas yang sudah punya mahasiswa
6. ✅ Admin bisa HAPUS kelas (cascade delete)

### **YANG PERLU DIKLARIFIKASI:**

1. ❓ Apakah kelas perlu terikat dengan mata kuliah?
2. ❓ Kapan dosen di-assign ke kelas?
3. ❓ Apakah perlu auto-generate kelas berdasarkan angkatan?

---

## 📝 DOKUMENTASI TERKAIT

- `docs/ADMIN_KELAS_WORKFLOW_REVISI.md` - Proposal workflow
- `docs/CREATE_3_KELAS_FOR_ANGKATAN.md` - SQL untuk create kelas
- `supabase/migrations/09_make_kelas_fields_nullable.sql` - Schema change
- `src/pages/admin/KelasPage.tsx` - Admin UI implementation
- `src/lib/api/kelas.api.ts` - Kelas API functions

---

**Status:** ✅ **ANALISIS COMPLETE**  
**Next Step:** Klarifikasi dari user tentang alur yang diinginkan
