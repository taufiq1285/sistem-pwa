# Fix Registration - Deployment Guide

## Masalah yang Diperbaiki

Sebelumnya, jika registrasi gagal (misalnya NIM duplicate), user tetap terbuat di Supabase Authentication meskipun data profil tidak lengkap. Ini terjadi karena:

1. **Database trigger** `on_auth_user_created` otomatis membuat user di tabel `users` saat signup
2. Kode aplikasi juga mencoba membuat user profile
3. Jika terjadi error (NIM duplicate, dll), user auth sudah terlanjur dibuat
4. `signOut()` hanya logout session, tidak menghapus user dari auth

## Solusi yang Diimplementasikan

1. ✅ **Drop trigger database** yang konflik dengan kode aplikasi
2. ✅ **Edge Function baru** untuk rollback registrasi yang gagal
3. ✅ **Update kode aplikasi** untuk memanggil edge function jika gagal

## Langkah Deployment

### 1. Deploy Migration (Drop Trigger)

```bash
# Jika menggunakan Supabase CLI (local development)
npx supabase db reset

# Atau apply migration ke production
npx supabase db push

# Atau jalankan manual di Supabase Dashboard > SQL Editor:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

### 2. Deploy Edge Function

```bash
# Deploy edge function ke Supabase
npx supabase functions deploy rollback-registration

# Atau deploy semua functions sekaligus
npx supabase functions deploy
```

### 3. Set Environment Variables (Jika Belum)

Pastikan environment variables sudah diset di Supabase Dashboard:
- `VITE_SUPABASE_URL` - Sudah ada dari project
- `SUPABASE_SERVICE_ROLE_KEY` - Sudah auto tersedia untuk edge functions

### 4. Test Registrasi

Test berbagai skenario:

#### Test 1: Registrasi Normal (Harus Sukses)
```
Email: test1@example.com
Password: test123
Role: mahasiswa
NIM: 123456789 (baru)
```

#### Test 2: Email Duplicate (Harus Gagal, User Tidak Masuk DB)
```
Email: test1@example.com (sama dengan Test 1)
Password: test123
Role: mahasiswa
NIM: 987654321
```
**Expected**: Error "Email sudah terdaftar"
**Verify**: User TIDAK ada di Authentication

#### Test 3: NIM Duplicate (Harus Gagal, User Tidak Masuk DB)
```
Email: test2@example.com
Password: test123
Role: mahasiswa
NIM: 123456789 (sama dengan Test 1)
```
**Expected**: Error "Data sudah terdaftar (NIM duplicate)"
**Verify**: User TIDAK ada di Authentication

### 5. Verify di Supabase Dashboard

Setelah test, cek:

1. **Authentication > Users**
   - User dari Test 2 dan Test 3 TIDAK boleh ada
   - Hanya user dari Test 1 yang ada

2. **Table Editor > users**
   - Hanya user dari Test 1 yang ada

3. **Table Editor > mahasiswa**
   - Hanya user dari Test 1 yang ada

## Cara Kerja Edge Function

File: `supabase/functions/rollback-registration/index.ts`

Edge function ini:
1. ✅ Menerima JWT token dari user yang baru signup
2. ✅ Verifikasi token valid
3. ✅ Safety check: User harus dibuat < 5 menit yang lalu
4. ✅ Safety check: User tidak boleh punya profile lengkap
5. ✅ Delete dari tabel role-specific (mahasiswa/dosen/laboran/admin)
6. ✅ Delete dari tabel users
7. ✅ Delete dari auth.users menggunakan admin API

## Files yang Dimodifikasi

1. ✅ `supabase/migrations/31_drop_auto_user_creation_trigger.sql` - Drop trigger
2. ✅ `supabase/functions/rollback-registration/index.ts` - Edge function baru
3. ✅ `supabase/functions/rollback-registration/deno.json` - Config
4. ✅ `src/lib/supabase/auth.ts` - Update logic registrasi

## Troubleshooting

### Edge Function Error: "Invalid or expired token"
- Pastikan `VITE_SUPABASE_URL` sudah benar di .env
- Cek edge function logs: `npx supabase functions logs rollback-registration`

### User Masih Masuk ke Authentication
- Cek apakah edge function sudah deployed
- Cek logs edge function untuk error
- Verifikasi trigger sudah di-drop dengan:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
  (Harus return 0 rows)

### Docker Tidak Running
- Install Docker Desktop dari https://docs.docker.com/desktop
- Atau deploy langsung ke production dengan:
  ```bash
  npx supabase link
  npx supabase db push
  npx supabase functions deploy rollback-registration
  ```

## Testing Checklist

- [ ] Migration applied (trigger dropped)
- [ ] Edge function deployed
- [ ] Test 1: Registrasi normal berhasil
- [ ] Test 2: Email duplicate gagal & user tidak masuk DB
- [ ] Test 3: NIM duplicate gagal & user tidak masuk DB
- [ ] Verify di Authentication dashboard
- [ ] Verify di Table Editor

## Security Notes

Edge function ini aman karena:
- ✅ Hanya bisa menghapus user yang baru dibuat (< 5 menit)
- ✅ Hanya bisa menghapus user tanpa profile lengkap
- ✅ Memerlukan valid JWT token dari user yang baru signup
- ✅ Menggunakan service role key hanya di server-side (edge function)
