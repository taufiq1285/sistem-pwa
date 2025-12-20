# Testing Perbaikan Fitur Kehadiran Dosen

## Perbaikan yang Sudah Dilakukan

✅ **Update API `getMyKelas()`** - Menggunakan manual join approach yang lebih robust
✅ **Menghindari nested select** - Query terpisah untuk kelas dan mata kuliah
✅ **Menambahkan logging detail** - Untuk debugging

## Langkah Testing

### 1. **Clear Browser Cache & Reload**

**Penting!** Aplikasi mungkin masih menggunakan JavaScript lama yang di-cache.

**Cara Clear Cache:**
- **Chrome/Edge:** Tekan `Ctrl + Shift + Delete` → Pilih "Cached images and files" → Clear
- **Atau:** Hard refresh dengan `Ctrl + Shift + R` atau `Ctrl + F5`

### 2. **Verifikasi Data di Database (Jika Belum)**

Jalankan SQL query ini di Supabase SQL Editor:

```sql
-- Cek apakah ada kelas dengan mata_kuliah_id yang valid
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NULL THEN '❌ BROKEN FK'
        ELSE '✅ OK'
    END as status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true;
```

**Expected result:**
- Semua baris harus punya status "✅ OK"
- Kolom `kode_mk` dan `nama_mk` harus terisi (tidak NULL)

**Jika ada "❌ BROKEN FK":**
Berarti ada kelas yang `mata_kuliah_id`-nya invalid. Perbaiki dengan:

```sql
-- Lihat semua mata kuliah yang tersedia
SELECT id, kode_mk, nama_mk FROM mata_kuliah;

-- Update kelas yang broken (ganti <kelas_id> dan <valid_mk_id>)
UPDATE kelas
SET mata_kuliah_id = '<valid_mk_id>'
WHERE id = '<kelas_id>';
```

### 3. **Test di Aplikasi**

#### A. Buka Browser Developer Tools
1. Tekan `F12`
2. Buka tab **Console**
3. Clear console log (klik icon 🚫 atau `Ctrl + L`)

#### B. Login sebagai Dosen & Buka Halaman Kehadiran

Navigasi: **Dashboard Dosen** → **Kehadiran**

#### C. Cek Console Log

**Log yang diharapkan muncul:**

```javascript
🔍 DEBUG getMyKelas: Getting ALL available courses
📚 DEBUG: Found 1 active kelas
🔍 DEBUG: Extracting 1 unique mata_kuliah_ids: [...]
📚 DEBUG: Found 1 mata kuliah records
🔍 DEBUG: Mata kuliah data: [{id: "...", kode_mk: "...", nama_mk: "..."}]
🔍 DEBUG: Processed kelas = {
  id: "...",
  nama_kelas: "...",
  mk_id: "...",
  mk_nama: "Algoritma Pemrograman",  // ← Harus terisi!
  mk_kode: "IF101"                     // ← Harus terisi!
}
✅ DEBUG: Returning 1 kelas with mata kuliah data
```

**Di KehadiranPage:**
```javascript
🔍 DEBUG KehadiranPage loadMataKuliah: kelasData = [{...}]
🔍 DEBUG First kelas item structure: {
  keys: [...],
  fullData: {...},
  mata_kuliah_nama: "Algoritma Pemrograman",  // ← HARUS TERISI!
  mata_kuliah_kode: "IF101",                  // ← HARUS TERISI!
  mata_kuliah_id: "..."                       // ← HARUS TERISI!
}
🔍 DEBUG Processing kelas: {...}
🔍 DEBUG Added mata kuliah: {
  key: "Algoritma Pemrograman-IF101",
  nama_mk: "Algoritma Pemrograman",
  kode_mk: "IF101"
}
🔍 DEBUG KehadiranPage: mataKuliahArray = [{...}]  // ← HARUS ADA ISI!
```

#### D. Test UI

1. **Step 1: Mata Kuliah**
   - ✅ Dropdown harus terisi dengan pilihan mata kuliah
   - ✅ Contoh: "IF101 - Algoritma Pemrograman"

2. **Step 2: Kelas**
   - ✅ Pilih mata kuliah dari dropdown
   - ✅ Dropdown kelas harus terisi
   - ✅ Contoh: "Kelas A (A1)"

3. **Step 3: Tanggal**
   - ✅ Pilih kelas
   - ✅ Pilih tanggal kehadiran

4. **Daftar Mahasiswa**
   - ✅ Setelah pilih kelas + tanggal, daftar mahasiswa harus muncul
   - ✅ Bisa ubah status kehadiran (Hadir/Izin/Sakit/Alpha)
   - ✅ Bisa tambah keterangan

5. **Simpan Kehadiran**
   - ✅ Klik tombol "Simpan Kehadiran"
   - ✅ Harus muncul toast "Kehadiran berhasil disimpan"
   - ✅ Tidak ada error di console

## Troubleshooting

### ❌ Problem: Dropdown Mata Kuliah Masih Kosong

**Kemungkinan Penyebab:**
1. Browser masih menggunakan JavaScript lama (cached)
2. Tidak ada mata kuliah di database
3. Kelas tidak memiliki `mata_kuliah_id` yang valid

**Solusi:**

**1. Clear Cache & Hard Refresh**
```
Ctrl + Shift + R  atau  Ctrl + F5
```

**2. Cek Console untuk Error**

Jika muncul:
```javascript
⚠️ DEBUG: No mata_kuliah_ids found in kelas data!
```
Berarti kelas tidak punya `mata_kuliah_id`. Perbaiki dengan:

```sql
-- Lihat kelas mana yang mata_kuliah_id-nya NULL
SELECT id, nama_kelas, mata_kuliah_id
FROM kelas
WHERE is_active = true AND mata_kuliah_id IS NULL;

-- Update dengan mata_kuliah_id yang valid
UPDATE kelas
SET mata_kuliah_id = (SELECT id FROM mata_kuliah LIMIT 1)
WHERE mata_kuliah_id IS NULL;
```

**3. Cek apakah ada data mata kuliah di database**

```sql
SELECT COUNT(*) as jumlah_mk FROM mata_kuliah;
```

Jika hasilnya 0, buat mata kuliah baru:
- Login sebagai **Admin**
- Menu **Master Data** → **Mata Kuliah**
- Klik **Tambah Mata Kuliah**

### ❌ Problem: Console Error "permission denied"

**Solusi:** Jalankan SQL script:
```sql
-- File: FIX_KEHADIRAN_DOSEN_ACCESS.sql
```

### ❌ Problem: Mata Kuliah Terisi, Tapi Kelas Kosong

**Kemungkinan:**
- Tidak ada kelas untuk mata kuliah yang dipilih
- Semua kelas sudah inactive

**Solusi:**
```sql
-- Cek kelas untuk mata kuliah tertentu
SELECT k.id, k.nama_kelas, mk.nama_mk
FROM kelas k
JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true
  AND mk.nama_mk = 'Algoritma Pemrograman';  -- Ganti dengan nama MK

-- Jika tidak ada hasil, buat kelas baru via Admin panel
```

## Struktur Data Expected

### getMyKelas() Return Value:
```typescript
[
  {
    id: "uuid-kelas",
    kode_kelas: "A1",
    nama_kelas: "Kelas A",
    tahun_ajaran: "2025/2026",
    semester_ajaran: 1,
    totalMahasiswa: 30,
    mata_kuliah_id: "uuid-mk",      // ← Harus ada!
    mata_kuliah_kode: "IF101",       // ← Harus ada!
    mata_kuliah_nama: "Algoritma Pemrograman"  // ← Harus ada!
  }
]
```

### mataKuliahList State:
```typescript
[
  {
    id: "uuid-mk",
    nama_mk: "Algoritma Pemrograman",
    kode_mk: "IF101"
  }
]
```

### kelasList State (setelah pilih mata kuliah):
```typescript
[
  {
    id: "uuid-kelas",
    nama_kelas: "Kelas A",
    kode_kelas: "A1"
  }
]
```

## Success Checklist

- [ ] Browser cache sudah di-clear
- [ ] Console log menunjukkan data mata kuliah terisi
- [ ] Dropdown "Mata Kuliah" terisi dengan pilihan
- [ ] Dropdown "Kelas" terisi setelah pilih mata kuliah
- [ ] Daftar mahasiswa muncul setelah pilih kelas
- [ ] Bisa menyimpan kehadiran tanpa error
- [ ] Tidak ada error di console (warning OK)

## Next Steps Jika Masih Error

Jika masih ada masalah, berikan screenshot atau copy-paste:
1. **Console log lengkap** (dari buka halaman sampai error)
2. **Screenshot dropdown** yang kosong
3. **Hasil query SQL** untuk verifikasi data

Saya akan bantu debug lebih lanjut!
