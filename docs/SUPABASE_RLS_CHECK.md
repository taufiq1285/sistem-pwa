# Checklist: Supabase RLS Policy untuk Mahasiswa Registration

## 🎯 Tujuan
Pastikan mahasiswa yang baru register **langsung terlihat di Admin panel** tanpa delay.

## 📋 Yang Harus Dicek

### 1. Tabel `users` - RLS Policy

**Tabel: `users`**
- Columns: id, email, full_name, role, created_at, is_active
- FK: references auth.users(id)

**Yang harus bisa:**
- ✅ Admin bisa SELECT semua user
- ✅ Mahasiswa bisa SELECT diri sendiri (WHERE id = auth.uid())
- ✅ INSERT bisa dilakukan saat registration

**RLS Policy yang harus ada:**
```sql
-- Policy 1: Admin bisa lihat semua
CREATE POLICY "admin_can_view_all_users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin WHERE user_id = auth.uid())
  );

-- Policy 2: User bisa lihat diri sendiri
CREATE POLICY "users_can_view_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Policy 3: Insert saat registration
CREATE POLICY "can_insert_own_user" ON users
  FOR INSERT WITH CHECK (id = auth.uid() OR auth.uid() IS NOT NULL);
```

### 2. Tabel `mahasiswa` - RLS Policy

**Tabel: `mahasiswa`**
- Columns: id, user_id, nim, program_studi, angkatan, semester
- FK: user_id references users(id)

**Yang harus bisa:**
- ✅ Admin bisa SELECT semua mahasiswa
- ✅ Mahasiswa bisa SELECT diri sendiri
- ✅ INSERT saat registration
- ✅ Real-time appear di Admin panel

**RLS Policy yang harus ada:**
```sql
-- Policy 1: Admin bisa lihat semua
CREATE POLICY "admin_can_view_all_mahasiswa" ON mahasiswa
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin WHERE user_id = auth.uid())
  );

-- Policy 2: Mahasiswa bisa lihat diri sendiri
CREATE POLICY "mahasiswa_can_view_own" ON mahasiswa
  FOR SELECT USING (user_id = auth.uid());

-- Policy 3: Insert saat registration
CREATE POLICY "can_insert_mahasiswa" ON mahasiswa
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR user_id = auth.uid());
```

### 3. Tabel `kelas` - RLS Policy

**Tabel: `kelas`**
- Columns: id, mata_kuliah_id, dosen_id, kode_kelas, nama_kelas, kuota
- FKs: mata_kuliah_id, dosen_id

**Yang harus bisa:**
- ✅ Admin bisa INSERT kelas baru
- ✅ Admin bisa SELECT semua kelas
- ✅ Dosen bisa SELECT kelas mereka
- ✅ Mahasiswa bisa SELECT kelas yang tersedia

**RLS Policy yang harus ada:**
```sql
-- Admin dapat melakukan semua
CREATE POLICY "admin_can_manage_kelas" ON kelas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin WHERE user_id = auth.uid())
  );

-- Dosen bisa lihat kelas mereka
CREATE POLICY "dosen_can_view_own_kelas" ON kelas
  FOR SELECT USING (
    dosen_id IN (SELECT id FROM dosen WHERE user_id = auth.uid())
  );

-- Mahasiswa bisa lihat semua kelas (untuk enroll)
CREATE POLICY "mahasiswa_can_view_available_kelas" ON kelas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM mahasiswa WHERE user_id = auth.uid())
    AND is_active = true
  );
```

### 4. Tabel `kelas_mahasiswa` - RLS Policy

**Tabel: `kelas_mahasiswa`**
- Columns: id, kelas_id, mahasiswa_id, enrolled_at, is_active
- FKs: kelas_id, mahasiswa_id

**Yang harus bisa:**
- ✅ Admin bisa INSERT/UPDATE enrollment
- ✅ Mahasiswa bisa lihat enrollment mereka
- ✅ Dosen bisa lihat mahasiswa di kelas mereka

---

## 🔧 Cara Cek RLS Policy di Supabase

### Step 1: Buka Supabase Dashboard
1. Go to https://app.supabase.com
2. Pilih project: `sistem-praktikum-pwa`

### Step 2: Lihat RLS Policies
1. Click **"Database"** → **"Tables"** (left sidebar)
2. Klik tabel `users`
3. Pilih tab **"Policies"** atau **"RLS"**
4. Lihat semua policies yang ada
5. Ulangi untuk tabel `mahasiswa`, `kelas`, `kelas_mahasiswa`

### Step 3: Run SQL Query untuk Check
Copy & paste di SQL Editor:

```sql
-- Check RLS status untuk semua tabel
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'mahasiswa', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

-- Check semua policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'mahasiswa', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename, policyname;
```

---

## ⚠️ Common Issues

### Issue 1: Admin tidak bisa lihat Mahasiswa
**Symptom:** Admin page kosong, tidak ada mahasiswa
**Cause:** RLS policy tidak allow admin
**Fix:** Pastikan policy punya `EXISTS (SELECT 1 FROM admin WHERE user_id = auth.uid())`

### Issue 2: Mahasiswa tidak bisa enroll ke kelas
**Symptom:** Error saat mahasiswa coba enroll
**Cause:** RLS policy di kelas atau kelas_mahasiswa terlalu ketat
**Fix:** Pastikan mahasiswa bisa INSERT ke kelas_mahasiswa

### Issue 3: Mahasiswa tidak muncul real-time
**Symptom:** Register berhasil, tapi Admin harus refresh untuk lihat
**Cause:** Bukan RLS issue, tapi caching di frontend
**Fix:** Gunakan Supabase real-time subscriptions atau polling

---

## ✅ Checklist

- [ ] Cek RLS policies pada tabel `users`
- [ ] Cek RLS policies pada tabel `mahasiswa`
- [ ] Cek RLS policies pada tabel `kelas`
- [ ] Cek RLS policies pada tabel `kelas_mahasiswa`
- [ ] Run SQL query untuk verify all RLS enabled
- [ ] Test: Mahasiswa register
- [ ] Test: Admin bisa lihat mahasiswa baru
- [ ] Test: Admin bisa buat kelas
- [ ] Test: Admin bisa assign mahasiswa ke kelas
- [ ] Test: Mahasiswa bisa lihat kelas dan enroll

---

## 📝 Notes

- **RLS harus ENABLED** pada semua tabel
- **Admin harus ada** dengan proper role
- **Auth user harus created** saat registration
- **User record harus ada** di tabel `users`
- **Mahasiswa record harus ada** di tabel `mahasiswa`

Jika ada yang error, kita fix satu per satu!
