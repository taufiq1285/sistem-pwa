# 🔍 Hasil Perbandingan Database

## Database Anda vs Yang Dibutuhkan Aplikasi

---

## ✅ TABEL YANG SUDAH ADA (Good!)

| No | Nama Tabel | Status | Keterangan |
|----|------------|--------|------------|
| 1 | `dosen` | ✅ | OK |
| 2 | `mahasiswa` | ✅ | OK |
| 3 | `laboran` | ✅ | OK |
| 4 | `mata_kuliah` | ✅ | OK |
| 5 | `kelas` | ✅ | OK |
| 6 | `laboratorium` | ✅ | OK |
| 7 | `inventaris` | ✅ | OK |
| 8 | `peminjaman` | ✅ | OK |
| 9 | `materi` | ✅ | OK |
| 10 | `kuis` | ✅ | OK |
| 11 | `kehadiran` | ✅ | OK |
| 12 | `offline_queue` | ✅ | OK - untuk PWA sync |

**Total: 12 tabel ✅**

---

## ⚠️ TABEL YANG BERBEDA NAMA

| Yang Dibutuhkan | Yang Ada di DB Anda | Status | Action |
|-----------------|---------------------|--------|--------|
| `users` | `admin` ? | ⚠️ | Perlu dicek - mungkin sama? |
| `jadwal` | `jadwal_praktikum` | ⚠️ | Beda nama - perlu disesuaikan |
| `soal` | - | ❌ | Tidak ada |
| `jawaban_mahasiswa` | `jawaban` | ⚠️ | Beda nama - perlu dicek |

---

## ❌ TABEL YANG HILANG (CRITICAL!)

| No | Nama Tabel | Priority | Dampak Jika Tidak Ada |
|----|------------|----------|----------------------|
| 1 | **`pengumuman`** | 🔴 **HIGH** | Fitur pengumuman tidak jalan! |
| 2 | `program_studi` | 🟡 MEDIUM | Data prodi tidak terstruktur |
| 3 | `soal` | 🟡 MEDIUM | Kuis tidak bisa dibuat |

---

## 📊 TABEL TAMBAHAN (Di DB Anda, Tidak di Dokumentasi)

| Nama Tabel | Kemungkinan Fungsi | Status |
|------------|-------------------|--------|
| `attempt_kuis` | Quiz attempts tracking | ✅ Bagus - untuk track percobaan |
| `kelas_mahasiswa` | Junction table kelas-mahasiswa | ✅ Bagus - untuk many-to-many |
| `nilai` | Grades/scoring | ✅ Bagus - untuk nilai mahasiswa |
| `cache_metadata` | PWA cache tracking | ✅ Bagus - untuk PWA |
| `conflict_log` | Sync conflict logging | ✅ Bagus - untuk debugging |
| `notifications` | Push notifications | ✅ Bagus - untuk notifikasi |

**Tabel tambahan ini OK dan berguna!** ✅

---

## 🎯 ANALISA DETAIL

### 1. Tabel `users` vs `admin`

**Kemungkinan**:
- A. Database Anda pakai Supabase Auth built-in (tabel `auth.users`)
- B. Tabel `admin` adalah custom user table

**Perlu Dicek**:
```sql
-- Cek struktur tabel admin
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin'
ORDER BY ordinal_position;
```

**Jika tabel `admin` punya kolom**: id, email, full_name, role, dll
→ Ini mungkin pengganti tabel `users` ✅

---

### 2. ❌ TABEL `pengumuman` - TIDAK ADA! (CRITICAL)

**Dampak**:
- ❌ Halaman Pengumuman tidak jalan
- ❌ Mahasiswa tidak bisa lihat pengumuman
- ❌ Dosen/Admin tidak bisa buat pengumuman

**HARUS DIBUAT!** 🔴

**SQL untuk Buat Tabel**:
```sql
CREATE TABLE public.pengumuman (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    judul VARCHAR NOT NULL,
    konten TEXT NOT NULL,
    tipe VARCHAR DEFAULT 'info',
    prioritas VARCHAR DEFAULT 'normal',
    penulis_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT[],
    target_kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    tanggal_mulai TIMESTAMPTZ,
    tanggal_selesai TIMESTAMPTZ,
    attachment_url TEXT,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

-- Policy: Semua user bisa baca pengumuman aktif
CREATE POLICY "Allow read active announcements"
ON public.pengumuman
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Admin/Dosen bisa buat pengumuman
CREATE POLICY "Allow admin/dosen create announcements"
ON public.pengumuman
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'dosen')
    )
);
```

---

### 3. Tabel `program_studi` - TIDAK ADA

**Dampak**:
- ⚠️ Program studi di tabel mahasiswa jadi string, bukan relasi
- ⚠️ Tidak ada data terstruktur untuk prodi

**Apakah Perlu?**
- Jika aplikasi sudah jalan dengan program_studi sebagai string → **TIDAK URGENT**
- Jika mau data lebih terstruktur → **BUAT NANTI**

**SQL (Optional)**:
```sql
CREATE TABLE public.program_studi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kode_prodi VARCHAR UNIQUE NOT NULL,
    nama_prodi VARCHAR NOT NULL,
    fakultas VARCHAR,
    jenjang VARCHAR DEFAULT 'S1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 4. Tabel `soal` - TIDAK ADA

**Kemungkinan**:
- Soal disimpan sebagai JSON di tabel `kuis`
- Atau ada di tabel lain?

**Perlu Dicek**:
```sql
-- Cek struktur tabel kuis
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;
```

**Jika soal ada di tabel kuis sebagai JSON** → OK ✅
**Jika tidak ada sama sekali** → Perlu dibuat ❌

---

### 5. Tabel `jadwal` vs `jadwal_praktikum`

**Status**: Kemungkinan besar sama, cuma beda nama

**Perlu Dicek**:
```sql
-- Cek struktur jadwal_praktikum
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;
```

**Action**: Update aplikasi untuk pakai nama `jadwal_praktikum` ✅

---

## 🔧 ACTION PLAN - Yang HARUS Dilakukan

### 🔴 PRIORITY 1 - CRITICAL (HARUS!)

#### ✅ Task 1: Buat Tabel `pengumuman`
**Why**: Aplikasi butuh ini untuk fitur pengumuman!
**Time**: 5 menit
**SQL**: Lihat di atas ☝️

---

### 🟡 PRIORITY 2 - MEDIUM (Perlu Dicek)

#### ✅ Task 2: Cek Tabel `admin` = `users`?
```sql
-- Jalankan ini untuk cek
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin'
ORDER BY ordinal_position;
```

**Jika punya kolom**: id, email, full_name, role
→ **Update aplikasi** untuk pakai tabel `admin` instead of `users`

#### ✅ Task 3: Cek Tabel `soal`
```sql
-- Cek apakah soal ada di tabel kuis
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;
```

**Jika ada kolom** `soal` atau `questions` (JSON)
→ OK ✅

**Jika tidak ada**
→ Perlu dibuat atau update aplikasi

#### ✅ Task 4: Verify Nama Tabel
- `jadwal_praktikum` → Update aplikasi pakai nama ini
- `jawaban` → Cek apakah ini sama dengan `jawaban_mahasiswa`

---

### 🟢 PRIORITY 3 - LOW (Optional)

#### ⚪ Task 5: Buat Tabel `program_studi` (Optional)
**Why**: Untuk data prodi yang lebih terstruktur
**Time**: 5 menit
**Urgent?**: TIDAK - bisa nanti

---

## 📝 SQL Queries untuk Verifikasi

### Query 1: Cek Tabel `admin`
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin'
ORDER BY ordinal_position;
```

### Query 2: Cek Tabel `kuis` (apakah ada soal?)
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kuis'
ORDER BY ordinal_position;
```

### Query 3: Cek Tabel `jadwal_praktikum`
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal_praktikum'
ORDER BY ordinal_position;
```

### Query 4: Cek Tabel `jawaban`
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jawaban'
ORDER BY ordinal_position;
```

---

## ✅ KESIMPULAN

### Database Anda:
- ✅ **80% sudah sesuai** dengan yang dibutuhkan!
- ❌ **1 tabel CRITICAL hilang**: `pengumuman`
- ⚠️ **Beberapa nama tabel berbeda** (perlu disesuaikan)

### Yang HARUS Dilakukan SEKARANG:
1. 🔴 **Buat tabel `pengumuman`** (CRITICAL!)
2. 🟡 **Cek struktur tabel** `admin`, `kuis`, `jadwal_praktikum`, `jawaban`
3. 🟡 **Share hasil cek** ke saya untuk analisa lanjutan

### Estimasi Waktu Fix:
- **Buat tabel pengumuman**: 5 menit
- **Cek & verify tabel lain**: 10 menit
- **Update aplikasi jika perlu**: 15 menit
- **TOTAL**: ~30 menit untuk 100% compatibility

---

## 🚀 Next Steps

1. **Jalankan SQL untuk buat tabel `pengumuman`** (lihat di atas)
2. **Jalankan 4 SQL queries verifikasi** (lihat di atas)
3. **Share hasil query** ke saya
4. **Saya akan bantu adjust** aplikasi atau database sesuai hasil

---

**Status**: Database 80% ready, perlu 1 tabel critical + beberapa adjustments
**Time to Fix**: ~30 menit
**Priority**: 🔴 HIGH - Perlu segera untuk fitur pengumuman!
