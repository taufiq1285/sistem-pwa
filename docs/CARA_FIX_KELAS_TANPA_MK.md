# Cara Memperbaiki Kelas Tanpa Mata Kuliah

## 🔍 Masalah yang Ditemukan

Kelas "Kelas A" (ID: df6527c4-a1f7-4573-b443-de0533c62479) tidak memiliki mata kuliah yang di-assign (`mata_kuliah_id` = NULL).

Ini menyebabkan:
- ❌ Dropdown "Mata Kuliah" di halaman Kehadiran kosong
- ❌ Dosen tidak bisa input kehadiran untuk kelas ini

## ✅ Cara Memperbaiki

### PILIHAN A: Via SQL (Cepat) ⚡

**1. Cek apakah ada mata kuliah di database:**

```sql
SELECT id, kode_mk, nama_mk
FROM mata_kuliah
ORDER BY kode_mk;
```

**2a. Jika SUDAH ADA mata kuliah:**

Pilih satu mata kuliah yang ingin di-assign, copy `id`-nya, lalu jalankan:

```sql
-- Ganti <ID_MATA_KULIAH> dengan ID yang di-copy
UPDATE kelas
SET mata_kuliah_id = '<ID_MATA_KULIAH>'
WHERE id = 'df6527c4-a1f7-4573-b443-de0533c62479';
```

**2b. Jika BELUM ADA mata kuliah:**

Buat mata kuliah baru dulu:

```sql
-- Buat mata kuliah sample
INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, program_studi)
VALUES ('IF101', 'Algoritma dan Pemrograman', 4, 1, 'Informatika')
RETURNING id, kode_mk, nama_mk;

-- Copy ID yang dihasilkan, lalu update kelas:
UPDATE kelas
SET mata_kuliah_id = '<ID_DARI_INSERT_DIATAS>'
WHERE id = 'df6527c4-a1f7-4573-b443-de0533c62479';
```

**3. Verify hasilnya:**

```sql
SELECT
    k.id,
    k.nama_kelas,
    mk.kode_mk,
    mk.nama_mk,
    CASE
        WHEN mk.id IS NULL THEN '❌ BROKEN'
        ELSE '✅ OK'
    END as status
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.id = 'df6527c4-a1f7-4573-b443-de0533c62479';
```

Expected result: status = "✅ OK"

---

### PILIHAN B: Via Admin UI (Lebih Aman) 🖱️

#### Step 1: Buat Mata Kuliah (Jika Belum Ada)

1. **Login sebagai Admin**
2. Buka menu **Master Data** → **Mata Kuliah**
3. Klik tombol **+ Tambah Mata Kuliah**
4. Isi form:
   - **Kode MK:** IF101
   - **Nama MK:** Algoritma dan Pemrograman
   - **SKS:** 4
   - **Semester:** 1
   - **Program Studi:** Informatika
5. Klik **Simpan**

#### Step 2: Update Kelas dengan Mata Kuliah

**Option 2a: Edit Kelas Existing**

1. Buka menu **Manajemen Kelas** atau **Kelas**
2. Cari "Kelas A"
3. Klik tombol **Edit** (icon pensil)
4. Pilih **Mata Kuliah** dari dropdown (pilih "IF101 - Algoritma dan Pemrograman")
5. Klik **Simpan**

**Option 2b: Jika tidak ada menu Edit**

Mungkin perlu hapus kelas lama dan buat baru:

1. **Hapus kelas lama** (atau set `is_active = false` via SQL):
   ```sql
   UPDATE kelas
   SET is_active = false
   WHERE id = 'df6527c4-a1f7-4573-b443-de0533c62479';
   ```

2. **Buat kelas baru via Admin UI:**
   - Buka menu **Manajemen Kelas**
   - Klik **+ Tambah Kelas**
   - Isi form:
     - **Nama Kelas:** Kelas A
     - **Kode Kelas:** A1
     - **Mata Kuliah:** IF101 - Algoritma dan Pemrograman (pilih dari dropdown)
     - **Tahun Ajaran:** 2025/2026
     - **Semester:** 1
     - **Kuota:** 40
   - Klik **Simpan**

---

## 🧪 Testing Setelah Fix

### 1. Verify di Database

```sql
SELECT
    k.id,
    k.nama_kelas,
    k.mata_kuliah_id,
    mk.kode_mk,
    mk.nama_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true;
```

**Expected:**
- Semua kelas harus punya `mata_kuliah_id` yang tidak NULL
- Kolom `kode_mk` dan `nama_mk` harus terisi

### 2. Test di Aplikasi

1. **Clear browser cache:** `Ctrl + Shift + R`
2. **Login sebagai Dosen**
3. **Buka halaman Kehadiran**
4. **Cek dropdown "Mata Kuliah"** → Harus terisi!

Expected console log:
```javascript
📚 DEBUG: Found 1 active kelas
🔍 DEBUG: Extracting 1 unique mata_kuliah_ids: ["<uuid>"]
📚 DEBUG: Found 1 mata kuliah records
🔍 DEBUG: Mata kuliah data: [{kode_mk: "IF101", nama_mk: "Algoritma dan Pemrograman"}]
🔍 DEBUG: Processed kelas = {
  mk_nama: "Algoritma dan Pemrograman",  // ✅ Terisi!
  mk_kode: "IF101"                        // ✅ Terisi!
}
✅ DEBUG: Returning 1 kelas with mata kuliah data
```

### 3. Test Fitur Kehadiran

- ✅ Dropdown "Mata Kuliah" terisi
- ✅ Pilih mata kuliah → Dropdown "Kelas" terisi
- ✅ Pilih kelas + tanggal → Daftar mahasiswa muncul
- ✅ Bisa simpan kehadiran

---

## 🚨 Catatan Penting

### Mengapa Kelas Bisa NULL?

Kemungkinan penyebab:
1. **Kelas dibuat sebelum mata kuliah dibuat** - Urutan pembuatan data salah
2. **Kelas dibuat via SQL tanpa mata_kuliah_id** - INSERT manual yang tidak lengkap
3. **Mata kuliah di-delete** - Mata kuliah yang di-assign ke kelas sudah dihapus
4. **Migration issue** - Schema database berubah tapi data lama tidak di-migrate

### Pencegahan ke Depan

**Di Aplikasi:**
- Pastikan form "Tambah Kelas" **WAJIB** memilih mata kuliah (required field)
- Validasi di backend: `mata_kuliah_id` tidak boleh NULL

**Di Database:**
- Tambahkan constraint NOT NULL (tapi harus fix data lama dulu):
  ```sql
  -- JANGAN RUN INI sebelum fix data lama!
  ALTER TABLE kelas
  ALTER COLUMN mata_kuliah_id SET NOT NULL;
  ```

**Best Practice:**
1. Buat **Mata Kuliah** dulu
2. Baru buat **Kelas** (assign ke mata kuliah yang sudah ada)
3. Baru buat **Jadwal Praktikum** (assign ke kelas)

---

## 📝 Checklist

Setelah fix, pastikan:

- [ ] Semua kelas aktif punya `mata_kuliah_id` yang valid
- [ ] Query verify menunjukkan status "✅ OK" untuk semua kelas
- [ ] Dropdown "Mata Kuliah" di halaman Kehadiran terisi
- [ ] Bisa pilih kelas dan input kehadiran
- [ ] Tidak ada error di console

---

## 💡 Quick Fix Script

Untuk cepat, jalankan file SQL yang sudah saya buat:

```bash
FIX_KELAS_BROKEN_FK.sql
```

Script ini akan:
1. Cek jumlah kelas yang broken
2. Cek jumlah mata kuliah yang ada
3. Jika belum ada MK, buat MK sample
4. Update semua kelas broken dengan MK tersebut
5. Verify hasilnya

Silakan pilih cara yang paling nyaman untuk Anda! 🚀
