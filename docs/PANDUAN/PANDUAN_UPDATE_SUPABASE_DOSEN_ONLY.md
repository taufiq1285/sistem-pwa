# 📋 Panduan Update Supabase - Peminjaman Dosen Only

## 🎯 Tujuan
Mengubah sistem peminjaman agar **HANYA DOSEN** yang bisa meminjam, bukan mahasiswa.

Dengan mengubah foreign key `peminjam_id` dari **mahasiswa** → **dosen**

## ⚠️ PENTING
- Ini adalah **DESTRUCTIVE migration**
- **BACKUP database dulu** sebelum jalankan!
- Baca semua step sebelum mulai

---

## 📊 Status Saat Ini vs Sesudah

### ❌ SEBELUMNYA
```
peminjaman.peminjam_id → mahasiswa.id (SALAH!)
                          ↓
                    Dosen tidak ada di mahasiswa
                          ↓
                    Foreign key violation (409 error)
```

### ✅ SESUDAH FIX
```
peminjaman.peminjam_id → dosen.id (BENAR!)
                          ↓
                    Dosen langsung jadi peminjam
                          ↓
                    Tidak perlu mahasiswa record
```

---

## 🚀 STEP-BY-STEP EXECUTION

### STEP 1: Backup Database
**Di Supabase Dashboard:**
1. Buka https://app.supabase.com
2. Pilih project "sistem-praktikum-pwa"
3. Klik **Settings** → **Backups**
4. Klik **Backup now** (opsional tapi recommended)

### STEP 2: Jalankan Migration SQL

**Di Supabase Dashboard:**
1. Klik **SQL Editor**
2. Klik **New Query**
3. Copy **SEMUA** code dari bawah
4. Paste ke SQL editor
5. Klik **Run**
6. Tunggu sampai selesai (harus "Success")

---

## 📝 SQL CODE - COPY SELURUHNYA

```sql
-- ============================================================================
-- STEP 1: Create backup column
-- ============================================================================
ALTER TABLE peminjaman
ADD COLUMN peminjam_id_backup UUID;

-- Copy data to backup
UPDATE peminjaman
SET peminjam_id_backup = peminjam_id;

-- ============================================================================
-- STEP 2: Drop old foreign key
-- ============================================================================
ALTER TABLE peminjaman
DROP CONSTRAINT IF EXISTS peminjaman_peminjam_id_fkey;

-- ============================================================================
-- STEP 3: Add new foreign key ke dosen
-- ============================================================================
ALTER TABLE peminjaman
ADD CONSTRAINT peminjaman_peminjam_id_fkey
FOREIGN KEY (peminjam_id)
REFERENCES dosen(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 4: Verify migration (jalankan query ini untuk check)
-- ============================================================================
-- SELECT COUNT(*) as total_peminjaman FROM peminjaman;
-- SELECT * FROM peminjaman LIMIT 1;

-- ============================================================================
-- AFTER VERIFIED: Drop backup column
-- ============================================================================
-- ALTER TABLE peminjaman DROP COLUMN peminjam_id_backup;
```

---

## ✅ Verification Queries

Setelah jalankan SQL di atas, jalankan query ini untuk verify:

```sql
-- Check foreign key constraint
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'peminjaman'
AND constraint_name LIKE '%peminjam%';

-- Should return:
-- peminjaman_peminjam_id_fkey

-- Check total records
SELECT COUNT(*) as total FROM peminjaman;

-- Check sample data
SELECT id, peminjam_id, dosen_id, status
FROM peminjaman LIMIT 5;
```

---

## 🔄 Rollback (Jika Ada Error)

Jika ada masalah dan ingin rollback:

```sql
-- Step 1: Drop new constraint
ALTER TABLE peminjaman
DROP CONSTRAINT peminjaman_peminjam_id_fkey;

-- Step 2: Add back old constraint
ALTER TABLE peminjaman
ADD CONSTRAINT peminjaman_peminjam_id_fkey
FOREIGN KEY (peminjam_id)
REFERENCES mahasiswa(id);

-- Step 3: (Optional) Restore from backup
-- UPDATE peminjaman
-- SET peminjam_id = peminjam_id_backup;

-- Step 4: (Optional) Drop backup column
-- ALTER TABLE peminjaman DROP COLUMN peminjam_id_backup;
```

---

## 📱 Testing Setelah Migration

### Test 1: Verify Database
1. Buka Supabase → Table editor
2. Klik tabel **peminjaman**
3. Lihat column **peminjam_id**
4. Seharusnya isinya adalah dosen ID (UUID format)

### Test 2: Test di Aplikasi
1. Refresh browser (Ctrl+F5)
2. Clear cache (F12 → Application → Clear)
3. Logout & Login sebagai dosen
4. Buka "Peminjaman Alat" → "Ajukan Peminjaman"
5. Isi form & submit

**Harapan:**
- ✅ Tidak ada error 409
- ✅ Permintaan berhasil dibuat
- ✅ Muncul di "Riwayat Peminjaman" dengan status "Menunggu"

---

## 📊 Checklist Completion

- [ ] Backup database di Supabase
- [ ] Copy SQL code dari section "SQL CODE - COPY SELURUHNYA"
- [ ] Jalankan di Supabase SQL Editor
- [ ] Tunggu "Success" message
- [ ] Jalankan verification queries
- [ ] Confirm foreign key constraint berubah ke dosen
- [ ] Refresh aplikasi & test
- [ ] Drop backup column (optional, setelah semua berjalan lancar)

---

## 💡 Notes

### Kenapa Foreign Key ke Dosen?
- Peminjaman hanya untuk dosen, bukan mahasiswa
- Lebih clean dan logical
- Menghilangkan kebutuhan create dummy mahasiswa record

### Kenapa Keep dosen_id?
- `dosen_id` tetap ada untuk backward compatibility
- Mungkin dipakai di query atau logic tertentu
- Tidak ada salahnya redundant dalam hal ini

### Troubleshooting

**Error: "relation mahasiswa does not exist"**
- Diabaikan, itu normal saat migration

**Error: "foreign key violation"**
- Ada peminjaman dengan peminjam_id yang invalid
- Buka console Supabase, lihat error detail
- Mungkin perlu manual cleanup peminjaman record

**Build error di aplikasi:**
- Clear browser cache (Ctrl+Shift+Delete)
- Logout & login ulang
- Refresh (Ctrl+F5)

---

## 🎉 SELESAI!

Setelah semua step done:
- ✅ Peminjaman = dosen only
- ✅ Foreign key = peminjam_id → dosen
- ✅ Tidak perlu mahasiswa record
- ✅ Sistem lebih clean dan sederhana

**Next:** Aplikasi sudah siap, dosen bisa langsung membuat peminjaman alat!
