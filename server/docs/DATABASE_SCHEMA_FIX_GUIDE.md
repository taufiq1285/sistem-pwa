# 🔧 Panduan Fix Database Schema Mismatch

## 📊 Status Saat Ini

✅ **database.types.ts sudah ada** (58KB)
✅ **Build errors turun dari 100+ menjadi 13 production errors**
⚠️ **Ada type mismatch antara database schema dan type definitions**

## 🎯 Langkah-Langkah Perbaikan

### **Step 1: Cek Schema Database di Supabase**

Ada 3 cara:

#### Cara A: Via SQL Editor (Paling Cepat)
1. Buka Supabase Dashboard → SQL Editor
2. Copy paste queries dari file `check-database-schema.sql`
3. Jalankan untuk melihat kolom-kolom actual di database

#### Cara B: Via Table Editor
1. Buka Supabase Dashboard → Table Editor
2. Klik tabel yang ingin dicek (pengumuman, mahasiswa, peminjaman)
3. Lihat nama kolom yang sebenarnya

#### Cara C: Regenerate Types (Most Accurate)
```bash
npx supabase gen types typescript --linked > src/types/database-new.types.ts
```
Lalu bandingkan dengan `src/types/database.types.ts` yang sekarang

---

### **Step 2: Fix Type Mismatches**

Berdasarkan analisis, ada beberapa tabel yang perlu disesuaikan:

#### 1. **Tabel PENGUMUMAN**

**Problem**: Error di `PengumumanPage.tsx`
```
Type missing properties: 'isi', 'created_by'
```

**Kemungkinan penyebab**:
- Database pakai kolom `konten` tapi type definition pakai `isi`
- Database pakai `penulis_id` tapi type definition pakai `created_by`

**Solusi**:
```typescript
// Cek di common.types.ts, ubah:
export interface Pengumuman extends PengumumanTable {
  // Sesuaikan dengan nama kolom actual di database
  // Jika database pakai 'konten', jangan tambah 'isi'
  // Jika database pakai 'penulis_id', pakai itu
  penulis?: {
    full_name: string;
    role: string;
  };
  target_kelas?: {
    nama_kelas: string;
  };
}
```

#### 2. **Tabel MAHASISWA**

**Problem**: Error di `ProfilePage.tsx`
```
Type missing properties: 'prodi_id', 'semester_aktif', 'tahun_masuk', 'is_active'
```

**Solusi**:
- Cek apakah kolom-kolom ini ada di database
- Jika TIDAK ada → hapus dari type definition
- Jika ADA → pastikan nama kolomnya sama persis

#### 3. **Tabel PEMINJAMAN**

**Problem**: Error di `peminjaman-extensions.ts`
```
Column 'kondisi_saat_pinjam' does not exist
```

**Kemungkinan**:
- Database pakai nama kolom yang berbeda
- Mungkin: `kondisi_pinjam` atau `kondisi_awal` atau lainnya

**Solusi**:
```sql
-- Jalankan di SQL Editor untuk cek nama kolom yang benar:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'peminjaman'
  AND column_name LIKE '%kondisi%';
```

---

### **Step 3: Update Type Definitions**

Setelah tahu nama kolom yang benar dari database:

1. **Update common.types.ts** (untuk Pengumuman)
2. **Update type di ProfilePage** atau buat MahasiswaProfile type baru
3. **Update peminjaman-extensions.ts** dengan nama kolom yang benar

---

## 🚀 Quick Fix untuk Error yang Tersisa

### Fix 1: OfflineSyncPage (5 errors)

**Problem**: `queueStats.synced` tidak ada

**Cek di database**:
```sql
-- Lihat struktur tabel sync/queue
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('offline_queue', 'sync_history');
```

**Quick Fix** (jika property memang tidak ada):
```typescript
// Ganti semua queueStats.synced dengan queueStats.completed
// ATAU tambahkan computed property
const syncedCount = queueStats.completed || 0;
```

### Fix 2: Unused Variables

**Quick Fix**:
```bash
# Jalankan script ini untuk hapus unused imports/variables:
node fix-unused-variables.cjs
```

---

## 📝 Checklist

Centang setelah selesai:

- [ ] Jalankan queries di `check-database-schema.sql` untuk 3 tabel: pengumuman, mahasiswa, peminjaman
- [ ] Catat nama kolom yang SEBENARNYA ada di database
- [ ] Update `common.types.ts` untuk Pengumuman
- [ ] Update type definition untuk Mahasiswa
- [ ] Update `peminjaman-extensions.ts` dengan nama kolom yang benar
- [ ] Fix queueStats.synced di OfflineSyncPage
- [ ] Hapus unused variables
- [ ] Run `npm run build` untuk verify

---

## 🎯 Target Akhir

Setelah semua langkah di atas:
- ✅ **0 production errors**
- ✅ Type definitions 100% match dengan database schema
- ✅ Build sukses dan siap deploy

---

## ❓ Butuh Bantuan?

Jika ada kesulitan di langkah manapun, beritahu saya:
1. Hasil query SQL yang Anda jalankan
2. Nama kolom actual yang ada di database
3. Error spesifik yang masih muncul

Saya akan bantu fix langsung! 🚀
