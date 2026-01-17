# Cara Fix Inventaris Database Issue

## 🔴 Error yang Muncul:
```
Failed to load resource: the server responded with a status of 400
Error creating inventaris
```

**Penyebab:** Kolom `laboratorium_id` di database masih **NOT NULL** (required), tapi form sudah tidak mengirim nilai ini karena inventaris adalah untuk depot pusat.

---

## ✅ Solusi: Make laboratorium_id NULLABLE

### Step 1: Buka Supabase Dashboard
1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di menu sebelah kiri

### Step 2: Jalankan Migration SQL
1. Klik **New Query**
2. Copy paste SQL berikut:

```sql
-- Make laboratorium_id nullable
ALTER TABLE inventaris
ALTER COLUMN laboratorium_id DROP NOT NULL;

-- Verify the change
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'inventaris'
    AND column_name = 'laboratorium_id';
```

3. Klik **Run** atau tekan **Ctrl + Enter**
4. Lihat hasil query di bagian bawah

### Step 3: Verifikasi Hasil
Hasil query harus menunjukkan:
```
column_name       | laboratorium_id
data_type         | uuid (atau text)
is_nullable       | YES  ← HARUS YES!
column_default    | NULL
```

Jika `is_nullable = YES`, berarti **BERHASIL!** ✅

---

## 🧪 Testing Setelah Migration

### 1. Hard Refresh Browser
- Windows/Linux: **Ctrl + Shift + R**
- Mac: **Cmd + Shift + R**

### 2. Test Buat Inventaris Baru
1. Login sebagai Laboran
2. Buka halaman **Inventaris**
3. Klik **Tambah Inventaris**
4. Isi form:
   - Kode Barang: `TEST-001`
   - Nama Barang: `Stetoskop`
   - Kategori: `Alat Medis`
   - Jumlah: `10`
5. Klik **Simpan**

**Expected:**
- ✅ Sukses tersimpan
- ✅ Tidak ada error 400
- ✅ Data muncul di tabel

### 3. Test Edit Inventaris
1. Pilih item yang baru dibuat
2. Klik **Edit**
3. Ubah jumlah atau data lain
4. Klik **Simpan**

**Expected:**
- ✅ Sukses terupdate
- ✅ Tidak ada error

---

## 📊 Konsep Database Setelah Migration

### Tabel: inventaris

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | NO | Primary key |
| kode_barang | text | NO | Kode unik barang |
| nama_barang | text | NO | Nama barang |
| kategori | text | YES | Kategori |
| laboratorium_id | uuid | **YES** ✅ | **NULLABLE - untuk depot pusat** |
| ... | ... | ... | ... |

### Use Cases:

**1. Alat di Depot Pusat (MAYORITAS)**
```sql
INSERT INTO inventaris (
  kode_barang,
  nama_barang,
  laboratorium_id  -- NULL (tidak terikat ke lab tertentu)
) VALUES (
  'ST-001',
  'Stetoskop',
  NULL  ← Alat di depot, belum di-assign ke lab
);
```

**2. Alat yang Sudah Di-assign ke Lab (OPTIONAL)**
```sql
UPDATE inventaris
SET laboratorium_id = 'lab-id-123'
WHERE kode_barang = 'ST-001';
-- Jika suatu saat alat dipindahkan permanent ke lab tertentu
```

---

## 🎯 Keuntungan Pendekatan Ini

### ✅ Fleksibel
- Alat bisa tidak terikat ke lab (depot) ← **Default**
- Alat bisa di-assign ke lab jika perlu ← **Optional**

### ✅ Sesuai Konsep
- Inventaris = Central depot/storage
- Bukan per-lab inventory

### ✅ Data Integrity
- Masih bisa track alat yang ada di lab tertentu
- Foreign key constraint tetap jalan (untuk yang ada laboratorium_id)

---

## 🚨 Troubleshooting

### Error: "permission denied for table inventaris"
**Solusi:**
- Anda tidak punya permission untuk ALTER TABLE
- Hubungi database admin / owner project
- Atau jalankan sebagai superuser di Supabase

### Error: "column laboratorium_id is referenced by..."
**Artinya:** Ada foreign key constraint yang mencegah perubahan
**Solusi:**
```sql
-- Drop foreign key dulu (jika ada)
ALTER TABLE inventaris
DROP CONSTRAINT IF EXISTS inventaris_laboratorium_id_fkey;

-- Lalu make nullable
ALTER TABLE inventaris
ALTER COLUMN laboratorium_id DROP NOT NULL;

-- Re-add foreign key (optional)
ALTER TABLE inventaris
ADD CONSTRAINT inventaris_laboratorium_id_fkey
FOREIGN KEY (laboratorium_id)
REFERENCES laboratorium(id)
ON DELETE SET NULL;  -- Jika lab dihapus, set inventaris jadi NULL
```

---

## 📝 File SQL Migration
File SQL sudah dibuat di:
```
migration-make-laboratorium-id-nullable.sql
```

Bisa langsung dibuka dan copy paste ke Supabase SQL Editor!

---

**Setelah migration berhasil, aplikasi akan berfungsi normal!** 🎉
