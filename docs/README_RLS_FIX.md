# 🔧 RLS POLICY FIX - Peminjaman Alat

## 📍 File-File Panduan yang Sudah Dibuat

Berikut adalah file-file yang siap untuk di-gunakan untuk fix error RLS:

### 1. **SQL_COPY_PASTE.txt** ⭐ (MULAI DARI SINI!)
   - File paling sederhana dan cepat
   - Berisi 3 opsi SQL code siap copy-paste
   - Tidak ada penjelasan, langsung kode
   - **Waktu: 2 menit**
   - 📍 Lokasi: `F:/tes 9/sistem-praktikum-pwa/SQL_COPY_PASTE.txt`

### 2. **FIX_RLS_STEP_BY_STEP.txt** 📋 (STEP BY STEP VISUAL)
   - Panduan step-by-step yang sangat detail
   - Dengan ASCII diagram untuk visualisasi
   - Instruksi klik-per-klik di Supabase
   - Include troubleshooting tips
   - **Waktu: 5-10 menit**
   - 📍 Lokasi: `F:/tes 9/sistem-praktikum-pwa/FIX_RLS_STEP_BY_STEP.txt`

### 3. **SUPABASE_RLS_SETUP.md** 📚 (PANDUAN LENGKAP)
   - Penjelasan detail tentang error dan solusi
   - 3 opsi fix dengan penjelasan masing-masing
   - Troubleshooting section
   - Testing checklist
   - **Waktu: 15 menit**
   - 📍 Lokasi: `F:/tes 9/sistem-praktikum-pwa/SUPABASE_RLS_SETUP.md`

### 4. **RLS_POLICY_FIX.md** 📖 (PENJELASAN TEKNIS)
   - Penjelasan mendalam tentang RLS & error 42501
   - Workflow lengkap dari request hingga return
   - API changes yang sudah dilakukan
   - **Waktu: 20 menit**
   - 📍 Lokasi: `F:/tes 9/sistem-praktikum-pwa/RLS_POLICY_FIX.md`

### 5. **sql_rls_fix.sql** 💾 (SQL FILE)
   - Semua SQL code dalam format file `.sql`
   - Bisa dibuka dengan text editor
   - Untuk backup atau import langsung
   - 📍 Lokasi: `F:/tes 9/sistem-praktikum-pwa/sql_rls_fix.sql`

---

## 🚀 QUICK START (Tercepat!)

Jika ingin langsung beres dalam 2 menit:

1. Buka file: **`SQL_COPY_PASTE.txt`**
2. Copy code OPSI 1 (recommended)
3. Ke https://app.supabase.com
4. SQL Editor → Paste → Run
5. Tunggu "Success"
6. Done! ✅

---

## 📖 REKOMENDASI MEMBACA SESUAI SITUASI

### Situasi A: "Aku mau cepet selesai"
→ Baca: **SQL_COPY_PASTE.txt** (2 menit)

### Situasi B: "Aku mau tau langkah-langkahnya"
→ Baca: **FIX_RLS_STEP_BY_STEP.txt** (10 menit)

### Situasi C: "Aku mau paham masalahnya dulu"
→ Baca: **SUPABASE_RLS_SETUP.md** (15 menit)

### Situasi D: "Aku developer, jelas-jelas dong!"
→ Baca: **RLS_POLICY_FIX.md** (20 menit)

### Situasi E: "Ada error, gimana?"
→ Lihat: **TROUBLESHOOTING** section di FIX_RLS_STEP_BY_STEP.txt

---

## 🔍 ERROR YANG FIXED

```
POST https://rkyoifqbfcztnhevpnpx.supabase.co/rest/v1/peminjaman 403 (Forbidden)
{code: '42501', message: 'new row violates row-level security policy for table "peminjaman"'}
```

**Penyebab:** RLS policy tidak allow dosen untuk insert ke tabel peminjaman

**Solusi:** Update RLS policy dengan code yang sudah disediakan

---

## ✅ SETELAH FIX, DOSEN BISA:

- ✅ Buat permintaan peminjaman alat
- ✅ Lihat status permintaan (Menunggu/Disetujui/Ditolak)
- ✅ Tandai alat sudah diambil (Ambil)
- ✅ Kembalikan alat dengan kondisi tracking
- ✅ Lihat stok yang tersedia

---

## 💡 CATATAN PENTING

### Opsi Mana yang Harus Dipilih?

| Opsi | Kapan | Keamanan | Kompleksitas |
|------|-------|----------|--------------|
| **Opsi 1** | Default, coba dulu | ⭐⭐⭐ Tinggi | Sedang |
| **Opsi 2** | Jika Opsi 1 error | ⭐⭐ Menengah | Rendah |
| **Opsi 3** | Last resort only | ⭐ Rendah | Sangat Rendah |

**Rekomendasi:** Mulai dari OPSI 1, jika error lanjut ke OPSI 2, baru ke OPSI 3

### Hal Yang Harus Dilakukan Sebelum RUN SQL

- ✅ Backup database (optional tapi recommended)
- ✅ Login ke Supabase dashboard
- ✅ Pastikan di project yang benar: "sistem-praktikum-pwa"
- ✅ Buka SQL Editor
- ✅ Copy code UTUH tanpa potongan

### Hal Yang Harus Dilakukan Setelah RUN SQL

- ✅ Tunggu "Success" message
- ✅ Refresh browser: Ctrl+F5
- ✅ Clear cache: F12 → Application → Clear All
- ✅ Logout & Login ulang
- ✅ Test dengan akun dosen: buat permintaan
- ✅ Lihat apakah muncul di "Riwayat Peminjaman"

---

## 📞 JIKA MASIH ERROR

1. Buka file: **FIX_RLS_STEP_BY_STEP.txt**
2. Cari section: **JIKA STUCK**
3. Ikuti instruksi di sana
4. Screenshot error & hubungi admin

---

## 📂 RINGKASAN FILE

```
Folder: F:/tes 9/sistem-praktikum-pwa/

├── SQL_COPY_PASTE.txt          ⭐ Mulai dari sini!
├── FIX_RLS_STEP_BY_STEP.txt    Step-by-step panduan
├── SUPABASE_RLS_SETUP.md       Panduan lengkap
├── RLS_POLICY_FIX.md           Penjelasan teknis
├── sql_rls_fix.sql             SQL file (backup)
└── README_RLS_FIX.md           File ini (index)
```

---

## 🎯 TUJUAN FIX

**Sebelum Fix:**
- Dosen TIDAK bisa membuat permintaan peminjaman
- Error 403: RLS policy blocking

**Setelah Fix:**
- Dosen BISA membuat permintaan
- Workflow peminjaman berfungsi normal
- Stock tracking otomatis bekerja

---

## 🏁 CHECKLIST SELESAI

- [ ] Baca file panduan yang sesuai situasi
- [ ] Copy SQL code yang tepat
- [ ] Login ke Supabase dashboard
- [ ] Paste code di SQL Editor
- [ ] Run query
- [ ] Tunggu "Success"
- [ ] Refresh browser & clear cache
- [ ] Test dengan akun dosen
- [ ] Buat permintaan peminjaman
- [ ] Lihat apakah berhasil ✅

---

**Happy Fixing! 🎉**

Jika ada pertanyaan, lihat file FAQ di bawah atau hubungi development team.
