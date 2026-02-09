# ✅ DURASI WAKTU LAPORAN - DIHAPUS

## 🎯 Perubahan

**Sebelum**: Dosen harus isi durasi (menit) saat buat tugas laporan
**Sesudah**: Field durasi **DISEMBUNYIKAN** untuk laporan (no time limit)

## 📋 Files Changed

1. ✅ **Migration 73**: `73_remove_duration_requirement_for_laporan.sql`
2. ✅ **Schema**: `src/lib/validations/kuis.schema.ts`
3. ✅ **UI**: `src/components/features/kuis/builder/QuizBuilder.tsx`
4. ✅ **Types**: `src/types/kuis.types.ts`
5. ✅ **Docs**: `FITUR_HAPUS_DURASI_LAPORAN.md`

## 🚀 Deploy

```bash
# 1. Push migration
npx supabase db push

# 2. Verify
npm run dev
# Go to /dosen/kuis/create
# Pilih "Laporan" -> Field durasi TIDAK MUNCUL ✅
# Pilih "CBT" -> Field durasi MUNCUL ✅
```

## 📊 Hasil

| Mode        | Durasi Field | Time Limit  | Default                |
| ----------- | ------------ | ----------- | ---------------------- |
| **Laporan** | ❌ Hidden    | ❌ No limit | 10080 menit (1 minggu) |
| **CBT**     | ✅ Visible   | ✅ Strict   | 60 menit               |

## ⚠️ Notes

- **Database**: durasi_menit sekarang NULLABLE
- **Default**: 10080 menit (7 hari) untuk laporan
- **CBT**: Tidak berubah, tetap wajib isi durasi
- **Mahasiswa**: Tidak ada countdown timer untuk laporan
- **Deadline**: Tetap ada via tanggal_selesai

---

**Impact**: ✅ Low Risk (backward compatible)
**Status**: ✅ Ready to Deploy
