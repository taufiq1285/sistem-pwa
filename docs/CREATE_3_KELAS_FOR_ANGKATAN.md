# 📝 Buat 3 Kelas Baru untuk 3 Angkatan

## 🎯 Tujuan
Membuat 3 kelas baru yang akan digunakan oleh dosen untuk membuat jadwal praktikum:
- **Kelas A (Pin Merah - 2022)** - Angkatan 2022
- **Kelas B (Pin Kuning - 2023)** - Angkatan 2023
- **Kelas C (Pin Hijau - 2024)** - Angkatan 2024

---

## 📋 Cara Run SQL

### Step 1: Buka Supabase Dashboard
1. Go to: **https://app.supabase.com**
2. Login dengan akun Anda
3. Select project: **sistem-praktikum-pwa**

### Step 2: Buka SQL Editor
1. Di sidebar kiri, klik **"SQL Editor"**
2. Klik **"+ New Query"**

### Step 3: Copy & Paste SQL Script

**Copy query ini:**

```sql
-- ============================================================================
-- CREATE 3 KELAS BARU UNTUK 3 ANGKATAN
-- ============================================================================
-- Pin Merah (2022), Pin Kuning (2023), Pin Hijau (2024)

-- FIRST - Check if mata kuliah exists, if not create one
WITH mk_check AS (
  SELECT id FROM mata_kuliah
  WHERE nama_mk = 'Praktikum Kebidanan'
  LIMIT 1
)
INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester, program_studi, is_active)
SELECT 'PRAK-001', 'Praktikum Kebidanan', 2, 1, 'Kebidanan', true
WHERE NOT EXISTS (SELECT 1 FROM mata_kuliah WHERE nama_mk = 'Praktikum Kebidanan');

-- Get the mata_kuliah_id
WITH mk AS (
  SELECT id FROM mata_kuliah WHERE nama_mk = 'Praktikum Kebidanan' LIMIT 1
)
-- CREATE 3 KELAS
INSERT INTO kelas (kode_kelas, nama_kelas, mata_kuliah_id, tahun_ajaran, semester_ajaran, kuota, is_active)
SELECT 'KELAS-A-2022', 'Kelas A (Pin Merah - 2022)', id, '2024/2025', 1, 40, true FROM mk
UNION ALL
SELECT 'KELAS-B-2023', 'Kelas B (Pin Kuning - 2023)', id, '2024/2025', 1, 40, true FROM mk
UNION ALL
SELECT 'KELAS-C-2024', 'Kelas C (Pin Hijau - 2024)', id, '2024/2025', 1, 40, true FROM mk
ON CONFLICT DO NOTHING;

-- Show hasil
SELECT id, kode_kelas, nama_kelas, tahun_ajaran FROM kelas
WHERE nama_kelas LIKE '%Pin%'
ORDER BY created_at DESC
LIMIT 3;
```

### Step 4: Run Query
1. **Paste** ke SQL Editor
2. Click **"RUN"** button
3. Wait for hasil

---

## ✅ Expected Result

Setelah run, Anda akan melihat 3 baris seperti ini:

```
id                                   | kode_kelas    | nama_kelas                        | tahun_ajaran
------------------------------------ | ------------- | --------------------------------- | -----------
uuid-1...                            | KELAS-A-2022  | Kelas A (Pin Merah - 2022)        | 2024/2025
uuid-2...                            | KELAS-B-2023  | Kelas B (Pin Kuning - 2023)       | 2024/2025
uuid-3...                            | KELAS-C-2024  | Kelas C (Pin Hijau - 2024)        | 2024/2025
```

---

## 🎯 Setelah Create Kelas

1. **Test di aplikasi:**
   - Dosen login ke JADWAL page
   - Click "Tambah Jadwal"
   - Dropdown "Kelas" sekarang akan menampilkan 3 kelas baru! ✅

2. **Buat Jadwal untuk setiap Kelas:**
   - Pilih Kelas A (2022)
   - Fill tanggal, jam, lab
   - Save jadwal
   - Ulangi untuk Kelas B dan C

3. **Test Kehadiran:**
   - Go to KEHADIRAN page
   - Dropdown "Pilih Jadwal Praktikum" akan menampilkan jadwal-jadwal yang baru dibuat ✅

---

## 📝 What This Script Does

1. **Check mata_kuliah**: Cek apakah sudah ada "Praktikum Kebidanan"
2. **Create if not exists**: Jika tidak ada, buat mata kuliah baru
3. **Create 3 kelas**: Buat 3 kelas yang link ke mata kuliah
4. **Show result**: Display hasil yang baru dibuat

**Important:** Script ini menggunakan `ON CONFLICT DO NOTHING`, jadi aman di-run berkali-kali tanpa duplikasi!

---

## ⚠️ Jika Ada Error

**Error: "mata_kuliah_id tidak valid"**
→ Artinya mata kuliah belum dibuat. Cek apakah script berhasil run 100%

**Error: "kelas sudah ada"**
→ Itu normal! ON CONFLICT DO NOTHING akan skip duplikasi

---

## ✅ NEXT STEP

**Setelah kelas berhasil dibuat:**

1. Test dosen buat jadwal dengan kelas baru
2. Verify jadwal muncul di kehadiran dropdown
3. Coba input kehadiran!

---

## 📸 Screenshot Location

Jika ada masalah, screenshot:
1. SQL Editor hasil query
2. Error message (jika ada)
3. Kirim ke developer!

Terima kasih! 🚀
