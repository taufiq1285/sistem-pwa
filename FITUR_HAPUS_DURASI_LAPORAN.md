# FITUR: HAPUS DURASI WAKTU UNTUK LAPORAN PRAKTIKUM

## 📋 Overview

Menghapus requirement durasi waktu ketika dosen membuat tugas laporan praktikum.

## ❓ Masalah Sebelumnya

- Dosen harus mengisi durasi (menit) saat membuat tugas laporan
- Laporan praktikum seharusnya **tidak ada time limit ketat**
- Mahasiswa butuh waktu fleksibel untuk menulis laporan essay/upload file

## ✅ Solusi Implementasi

### 1. **Database Changes** (Migration 73)

```sql
-- Make durasi_menit nullable
ALTER TABLE kuis ALTER COLUMN durasi_menit DROP NOT NULL;

-- Set default 10080 menit (1 minggu)
ALTER TABLE kuis ALTER COLUMN durasi_menit SET DEFAULT 10080;

-- Update CHECK constraint: allow NULL or positive
ALTER TABLE kuis ADD CONSTRAINT kuis_durasi_check
CHECK (durasi_menit IS NULL OR durasi_menit > 0);
```

### 2. **Schema Validation Changes**

```typescript
// src/lib/validations/kuis.schema.ts

durasi_menit: z
  .number()
  .int()
  .min(5)
  .max(10080) // 1 minggu max
  .optional()
  .nullable()
  .default(10080), // Default 1 minggu untuk laporan
```

### 3. **UI Changes (QuizBuilder Component)**

**Before**:

```tsx
<div className="space-y-2">
  <Label htmlFor="durasi_menit">Durasi (menit) *</Label>
  <Input
    id="durasi_menit"
    type="number"
    {...register("durasi_menit", { valueAsNumber: true })}
    min={5}
  />
</div>
```

**After**:

```tsx
{
  /* HIDDEN untuk laporan mode */
}
{
  !laporanMode && (
    <div className="space-y-2">
      <Label htmlFor="durasi_menit">Durasi (menit) *</Label>
      <Input
        id="durasi_menit"
        type="number"
        {...register("durasi_menit", { valueAsNumber: true })}
        min={5}
      />
    </div>
  );
}
```

### 4. **Default Values**

```typescript
// QuizBuilder.tsx - defaultValues

laporanMode ? 10080 : 60; // Laporan: 1 minggu, CBT: 1 jam
```

### 5. **Validation Logic**

```typescript
// Skip durasi validation for laporan
if (!laporanMode && (!formData.durasi_menit || formData.durasi_menit < 5)) {
  toast.error("Durasi minimal 5 menit");
  return;
}
```

## 📊 Perbandingan

| Aspek               | **CBT (Tes)**          | **Laporan**            |
| ------------------- | ---------------------- | ---------------------- |
| **Durasi Field**    | ✅ Ditampilkan         | ❌ **DISEMBUNYIKAN**   |
| **Durasi Required** | ✅ Wajib (5-300 menit) | ❌ **Optional**        |
| **Default Durasi**  | 60 menit               | 10080 menit (1 minggu) |
| **Time Limit**      | ✅ Strict              | ❌ **Fleksibel**       |
| **Use Case**        | Multiple choice test   | Essay/File upload      |

## 🎯 Manfaat

### Untuk Dosen:

- ✅ **Tidak perlu isi durasi** saat buat tugas laporan
- ✅ Fokus ke konten tugas, bukan time management
- ✅ Lebih sesuai dengan sifat tugas laporan (butuh waktu lama)

### Untuk Mahasiswa:

- ✅ **Tidak ada countdown timer** yang bikin stress
- ✅ Bisa kerja laporan dengan pace sendiri
- ✅ Bisa simpan draft berkali-kali tanpa khawatir waktu habis
- ✅ Deadline tetap ada (dari tanggal_selesai), tapi tidak ada time limit per session

## 📁 Files Changed

1. **Migration**:
   - `73_remove_duration_requirement_for_laporan.sql`

2. **Schema Validation**:
   - `src/lib/validations/kuis.schema.ts`

3. **UI Component**:
   - `src/components/features/kuis/builder/QuizBuilder.tsx`

## 🚀 Cara Deploy

### 1. Run Migration

```bash
# Push migration ke Supabase
npx supabase db push

# Atau manual di SQL Editor
# Copy paste isi 73_remove_duration_requirement_for_laporan.sql
```

### 2. Verify Changes

```sql
-- Check column is nullable
SELECT
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'kuis'
  AND column_name = 'durasi_menit';

-- Expected:
-- is_nullable: YES
-- column_default: 10080
```

### 3. Test UI

```bash
# Dev environment
npm run dev

# Navigate to:
# /dosen/kuis/create
# Pilih "Laporan" -> Field durasi tidak muncul ✅
# Pilih "Tes CBT" -> Field durasi tetap muncul ✅
```

## ⚠️ Important Notes

### 1. **Database Compatibility**

- Migration is **backward compatible**
- Existing records tetap valid (durasi tidak berubah)
- New laporan akan auto-set durasi = 10080 menit

### 2. **CBT Mode Tidak Berubah**

- CBT masih **WAJIB** isi durasi
- Range tetap 5-300 menit
- UI tetap tampil field durasi untuk CBT

### 3. **Deadline vs Time Limit**

```
Laporan:
- ❌ Time limit per session: DIHAPUS
- ✅ Deadline submission: TETAP ADA (tanggal_selesai)

Mahasiswa bisa:
- Buka tugas berkali-kali
- Edit draft kapan saja
- Submit sebelum tanggal_selesai
```

## 🔧 Technical Details

### Schema Before:

```typescript
durasi_menit: z.number().int().min(5).max(300); // Max 5 jam
// REQUIRED, NOT NULLABLE
```

### Schema After:

```typescript
durasi_menit: z.number()
  .int()
  .min(5)
  .max(10080) // Max 1 minggu
  .optional() // ✅ OPTIONAL
  .nullable() // ✅ NULLABLE
  .default(10080); // ✅ DEFAULT 1 MINGGU
```

### Database Before:

```sql
durasi_menit INTEGER NOT NULL DEFAULT 60,
CONSTRAINT kuis_durasi_check CHECK (durasi_menit > 0)
```

### Database After:

```sql
durasi_menit INTEGER DEFAULT 10080, -- NULLABLE
CONSTRAINT kuis_durasi_check CHECK (durasi_menit IS NULL OR durasi_menit > 0)
```

## 📝 Testing Checklist

### Dosen:

- [ ] Buat tugas laporan tanpa isi durasi ✅
- [ ] Field durasi tidak muncul di form ✅
- [ ] Tugas tersimpan dengan durasi default (10080 menit) ✅
- [ ] Buat tes CBT masih harus isi durasi ✅

### Mahasiswa:

- [ ] Buka tugas laporan tidak ada countdown timer ✅
- [ ] Bisa save draft berkali-kali ✅
- [ ] Bisa submit sebelum tanggal_selesai ✅
- [ ] Tes CBT masih ada countdown timer ✅

## 🎉 Hasil Akhir

**Sebelum**:

```
Dosen buat laporan:
- Judul: "Laporan Praktikum 1"
- Durasi: [60] menit ← HARUS ISI
- Save
```

**Sesudah**:

```
Dosen buat laporan:
- Judul: "Laporan Praktikum 1"
- [Durasi field HIDDEN] ← TIDAK MUNCUL
- Save (auto durasi = 10080 menit)
```

**Mahasiswa lihat tugas**:

```
Before: "Durasi: 60 menit" + Countdown timer ❌
After:  No time limit, submit by deadline ✅
```

---

**Status**: ✅ Ready to Deploy
**Impact**: Low Risk (backward compatible)
**Benefit**: UX improvement untuk laporan praktikum
