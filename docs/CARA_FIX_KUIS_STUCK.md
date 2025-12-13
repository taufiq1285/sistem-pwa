# 🔧 Fix: Tombol "Menyimpan" Stuck saat Buat Kuis

## 🔍 Masalah Yang Ditemukan

Saat dosen klik "Simpan Kuis", tombol stuck di "Menyimpan..." dan tidak pernah selesai.

**Root Cause:** Database columns **TIDAK COCOK** dengan TypeScript types!

```
❌ Database punya:          ✅ TypeScript mengirim:
   - is_shuffled               - randomize_questions
   - show_result               - randomize_options
                                - show_results_immediately
```

Akibatnya SQL INSERT **GAGAL** dan tombol stuck!

---

## ✅ SOLUSI

### Langkah 1: Buka Supabase Dashboard

1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### Langkah 2: Jalankan SQL Fix

Copy-paste SQL ini ke SQL Editor:

```sql
-- Rename columns
ALTER TABLE kuis RENAME COLUMN is_shuffled TO randomize_questions;
ALTER TABLE kuis RENAME COLUMN show_result TO show_results_immediately;

-- Add missing columns
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN DEFAULT false;
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT true;
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS is_offline_capable BOOLEAN DEFAULT false;
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS auto_save_interval INTEGER DEFAULT 30;
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE kuis ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
```

Atau gunakan file: **`FIX_KUIS_STUCK_SAVING.sql`**

### Langkah 3: Klik "RUN"

Klik tombol **RUN** di SQL Editor.

### Langkah 4: Test Lagi

1. Refresh browser (F5)
2. Login sebagai dosen
3. Buat kuis baru
4. Isi semua field
5. Klik **"Simpan Kuis"**
6. ✅ Seharusnya berhasil sekarang!

---

## 📝 Logging untuk Debug

Saya sudah tambahkan console.log di code. Buka **Browser Console** (F12) untuk lihat:

```
🔵 Starting quiz save...          ← Mulai save
🔵 API createKuis called...       ← API dipanggil
✅ Quiz created: {...}             ← Berhasil!
🔵 Saving complete...              ← Selesai

ATAU jika error:

❌ API createKuis error: ...       ← Error message
❌ Error saving quiz: ...          ← Error detail
```

---

## ⚠️ Jika Masih Stuck

1. **Cek Console Browser (F12)** → Lihat error message
2. **Screenshot error** → Kirim ke saya
3. **Cek Supabase Logs** → Dashboard > Logs > Error Logs
4. **Verify SQL berhasil** → Jalankan di Supabase SQL Editor:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'kuis'
   ORDER BY ordinal_position;
   ```

Seharusnya muncul columns:
- `randomize_questions` (boolean)
- `randomize_options` (boolean)
- `show_results_immediately` (boolean)

---

## 🎯 Kenapa Ini Terjadi?

1. Database schema dibuat dengan nama field lama
2. TypeScript types update ke nama field baru
3. Migration tidak dijalankan
4. INSERT gagal karena field name tidak cocok

Fix ini menyamakan database dengan TypeScript types! ✅
