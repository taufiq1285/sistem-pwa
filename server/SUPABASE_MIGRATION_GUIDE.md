# 🔧 CARA MENJALANKAN SQL SCRIPTS DI SUPABASE

## 📋 Ada 3 Script SQL yang sudah siap:

### **1️⃣ CHECK_COMPLETE_DATABASE_STRUCTURE.sql**

Cek struktur database yang sekarang

### **2️⃣ CREATE_MISSING_TABLES.sql** ⭐ PENTING

Buat 8 tabel yang hilang + fix kolom missing

### **3️⃣ SETUP_RLS_POLICIES.sql**

Setup Row Level Security policies untuk semua tabel

---

## 🚀 LANGKAH-LANGKAH:

### **STEP 1: Buka Supabase Dashboard**

1. Pergi ke https://app.supabase.com
2. Login ke project Anda
3. Klik **"SQL Editor"** di sidebar

### **STEP 2: Jalankan Script 1 (CHECK)**

1. Copy semua isi file: `scripts/sql/01_CHECK_COMPLETE_DATABASE_STRUCTURE.sql`
2. Paste di SQL Editor
3. Klik **"Run"** (Ctrl + Enter)
4. Lihat hasilnya - ini untuk verifikasi status awal

### **STEP 3: Jalankan Script 2 (CREATE MISSING TABLES)** ⭐

1. Copy semua isi file: `scripts/sql/02_CREATE_MISSING_TABLES.sql`
2. Paste di SQL Editor (clear yang sebelumnya)
3. Klik **"Run"**
4. Tunggu hingga selesai (~10-30 detik)
5. Jika sukses, akan ada pesan "Query succeeded"

**Tabel yang dibuat:**

- `jadwal` - Jadwal praktikum (PALING PENTING!)
- `soal_kuis` - Soal kuis
- `jawaban_kuis` - Jawaban kuis
- `kategori_inventaris` - Kategori inventaris
- `penilaian` - Template penilaian
- `komponen_nilai` - Komponen penilaian
- `nilai_mahasiswa` - Nilai mahasiswa
- `notifikasi` - Notifikasi

**Kolom yang ditambah:**

- `users.status` - Status akun
- `jadwal.status, cancelled_by, cancelled_at, cancellation_reason` - Approval workflow

### **STEP 4: Jalankan Script 3 (SETUP RLS)**

1. Copy semua isi file: `scripts/sql/03_SETUP_RLS_POLICIES.sql`
2. Paste di SQL Editor
3. Klik **"Run"**
4. Ini setup Row Level Security untuk keamanan

### **STEP 5: Verifikasi Lagi**

1. Buka Script 1 lagi
2. Run untuk memastikan semua table sudah ada

---

## ⚠️ JIKA ADA ERROR:

### Error: "Table already exists"

- Itu normal! Script sudah menggunakan `IF NOT EXISTS`
- Artinya tabel sudah ada
- Lanjut ke script berikutnya

### Error: "Column already exists"

- Normal juga! Ada `ADD COLUMN IF NOT EXISTS`
- Tabel sudah memiliki kolom tersebut
- Lanjut execution

### Error: "Reference violation"

- Mungkin data sudah ada dan inconsistent
- Coba jalankan di table yang kosong dulu
- Atau bersihkan data terlebih dahulu

### Error: "RLS policy already exists"

- Script 3 akan fail jika policy sudah ada
- Itu OK, berarti policy sudah di-setup
- Cek di menu **Authentication > Policies**

---

## ✅ VERIFIKASI HASIL

Setelah semua script selesai, buka **SQL Editor** dan jalankan query ini:

```sql
-- Cek semua tabel ada
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- Cek jadwal table ada dengan kolom status
SELECT COUNT(*) FROM jadwal LIMIT 1;
SELECT status, cancelled_by, cancelled_at FROM jadwal LIMIT 1;

-- Cek soal_kuis table
SELECT COUNT(*) FROM soal_kuis LIMIT 1;

-- Cek RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Jika semua returns 0 error, database siap! ✅

---

## 📂 LOKASI FILE SCRIPTS

Semua script ada di folder:

```
f:/tes 9/sistem-praktikum-pwa/scripts/sql/
```

- `01_CHECK_COMPLETE_DATABASE_STRUCTURE.sql`
- `02_CREATE_MISSING_TABLES.sql`
- `03_SETUP_RLS_POLICIES.sql`

---

## 🎯 RINGKASAN

| Tahap | Script | Aksi                           | Status     |
| ----- | ------ | ------------------------------ | ---------- |
| 1     | CHECK  | Verifikasi struktur awal       | ✅ Done    |
| 2     | CREATE | Buat tabel & kolom yang hilang | ⏳ Pending |
| 3     | RLS    | Setup keamanan database        | ⏳ Pending |
| 4     | VERIFY | Cek hasil akhir                | ⏳ Pending |

---

**Butuh bantuan? Buka file-file tersebut dan copy-paste ke Supabase SQL Editor!**
