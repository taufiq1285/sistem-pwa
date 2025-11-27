# Panduan Setup RLS Policy di Supabase

## 🎯 Tujuan
Fix error 403 saat dosen membuat permintaan peminjaman alat dengan mengubah RLS policy di tabel `peminjaman`.

## ⚠️ Error yang Dialami
```
POST https://rkyoifqbfcztnhevpnpx.supabase.co/rest/v1/peminjaman 403 (Forbidden)
{code: '42501', message: 'new row violates row-level security policy for table "peminjaman"'}
```

---

## 📋 Langkah-Langkah Fix

### Langkah 1: Login ke Supabase Dashboard
1. Buka https://app.supabase.com
2. Pilih project: **sistem-praktikum-pwa**
3. Tunggu dashboard load

### Langkah 2: Buka SQL Editor
1. Klik menu di sidebar kiri: **SQL Editor**
2. Atau: Authentication → Policies (alternatif)

### Langkah 3: Copy & Paste SQL Code

Pilih **SATU** dari opsi di bawah:

#### ✅ OPSI A: RECOMMENDED (Lebih Aman)
Copy code ini dan paste di SQL Editor, lalu klik **Run**:

```sql
-- Hapus policy lama
DROP POLICY IF EXISTS "Allow dosen to create borrowing requests" ON peminjaman;
DROP POLICY IF EXISTS "Allow laboran to manage peminjaman" ON peminjaman;
DROP POLICY IF EXISTS "Users can view peminjaman" ON peminjaman;

-- Policy 1: Allow create requests
CREATE POLICY "Allow authenticated users to create borrowing requests"
ON peminjaman
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow view
CREATE POLICY "Allow authenticated users to view peminjaman"
ON peminjaman
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 3: Allow laboran update
CREATE POLICY "Allow laboran to update peminjaman"
ON peminjaman
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM laboran WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM laboran WHERE user_id = auth.uid()
  )
);

-- Enable RLS
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
```

#### ⚡ OPSI B: SIMPLE (Lebih Mudah, Less Secure)
Jika OPSI A error, gunakan ini:

```sql
-- Hapus semua policy lama
DROP POLICY IF EXISTS "Allow dosen to create borrowing requests" ON peminjaman;
DROP POLICY IF EXISTS "Allow laboran to manage peminjaman" ON peminjaman;
DROP POLICY IF EXISTS "Users can view peminjaman" ON peminjaman;
DROP POLICY IF EXISTS "Allow authenticated users to create borrowing requests" ON peminjaman;
DROP POLICY IF EXISTS "Allow authenticated users to view peminjaman" ON peminjaman;
DROP POLICY IF EXISTS "Allow laboran to update peminjaman" ON peminjaman;

-- Policy tunggal yang simple
CREATE POLICY "Allow all authenticated actions on peminjaman"
ON peminjaman
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
```

### Langkah 4: Jalankan Query
1. Pastikan semua code sudah ter-select
2. Klik tombol **Run** (atau tekan Ctrl+Enter)
3. Tunggu sampai muncul **Success** message

### Langkah 5: Verifikasi
Copy & run query ini untuk memastikan RLS aktif:

```sql
-- Cek apakah RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'peminjaman';
```

Expected result: `rowsecurity = true`

---

## 🧪 Test Aplikasi

Setelah SQL selesai:

1. **Refresh browser** (Ctrl+F5 atau Cmd+Shift+R)
2. **Log out** dan **log in kembali** (jika diperlukan)
3. Buka halaman **Peminjaman Alat** (Dosen menu)
4. Klik **Ajukan Peminjaman Alat**
5. Isi form dan submit

### ✅ Jika Berhasil
- Toast message: "Pengajuan peminjaman berhasil dibuat!"
- Permintaan muncul di "Riwayat Peminjaman" dengan status "Menunggu"

### ❌ Jika Masih Error
- Buka **Developer Console** (F12 → Console)
- Copy error message
- Hubungi admin dengan error message tersebut

---

## 📝 Penjelasan SQL Code

### Policy 1: INSERT (Allow Membuat Request)
```sql
CREATE POLICY "Allow authenticated users to create borrowing requests"
ON peminjaman
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```
**Arti:** Siapa saja yang sudah login bisa membuat permintaan peminjaman baru.

### Policy 2: SELECT (Allow Baca Data)
```sql
CREATE POLICY "Allow authenticated users to view peminjaman"
ON peminjaman
FOR SELECT
USING (auth.uid() IS NOT NULL);
```
**Arti:** User yang login bisa melihat daftar peminjaman.

### Policy 3: UPDATE (Allow Laboran Edit)
```sql
CREATE POLICY "Allow laboran to update peminjaman"
ON peminjaman
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM laboran WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM laboran WHERE user_id = auth.uid()
  )
);
```
**Arti:** Hanya user yang terdaftar di tabel `laboran` yang bisa update/approve peminjaman.

---

## ⚠️ Troubleshooting

### Error: "relation 'laboran' does not exist"
**Solusi:** Gunakan OPSI B (Simple version)

### Error: "syntax error at or near ..."
**Solusi:**
- Pastikan copy-paste seluruh code tanpa potongan
- Cek tidak ada karakter aneh/unicode
- Coba hapus semua dan copy lagi

### Masih 403 Error setelah fix
**Solusi:**
1. Hard refresh browser: Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
2. Clear cookies/localStorage:
   - F12 → Application → Clear All
   - Log in kembali
3. Tunggu 1-2 menit (cache server)

### Permintaan tidak muncul di approval
**Solusi:** Pastikan dosen profile sudah dibuat di tabel `dosen`

---

## 📚 File Terkait

- `sql_rls_fix.sql` - SQL code lengkap dalam format file
- `RLS_POLICY_FIX.md` - Penjelasan detail masalah RLS
- `SUPABASE_RLS_SETUP.md` - File ini (panduan setup)

---

## ✅ Checklist Selesai

- [ ] Login ke Supabase dashboard
- [ ] Buka SQL Editor
- [ ] Copy & paste code (Opsi A atau B)
- [ ] Run query dan tunggu success
- [ ] Verifikasi RLS dengan query check
- [ ] Refresh aplikasi dan test
- [ ] Dosen bisa membuat permintaan ✨

---

## 💡 Tips

- Simpan SQL code di file untuk referensi nanti
- Jangan share project URL/key kepada orang lain
- Backup database sebelum ubah RLS di production
- Test dengan akun dosen test dulu sebelum user lain

---

**Pertanyaan?** Hubungi tim development atau dokumentasi Supabase di https://supabase.com/docs
