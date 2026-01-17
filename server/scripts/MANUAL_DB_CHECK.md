# 🔍 Manual Database Check - Supabase Dashboard

Buka Supabase Dashboard Anda dan cek hal-hal berikut:

## 📋 1. CEK TABEL YANG HARUS ADA

Login ke: https://app.supabase.com/project/YOUR_PROJECT/editor

### Core Tables (User Management)

- [ ] `users` - Tabel pengguna utama
- [ ] `mahasiswa` - Data mahasiswa
- [ ] `dosen` - Data dosen
- [ ] `admin` - Data admin

### Academic Tables

- [ ] `mata_kuliah` - Mata kuliah
- [ ] `kelas` - Kelas praktikum
- [ ] `kelas_mahasiswa` - Relasi mahasiswa-kelas

### Lab & Schedule Tables

- [ ] `laboratorium` - Data laboratorium
- [ ] `jadwal` - Jadwal praktikum
- [ ] `kehadiran` - Kehadiran mahasiswa

### Quiz Tables

- [ ] `kuis` - Data kuis
- [ ] `soal_kuis` - Soal-soal kuis
- [ ] `attempt_kuis` - Percobaan mengerjakan kuis
- [ ] `jawaban_kuis` - Jawaban mahasiswa

### Equipment Tables

- [ ] `inventaris` - Inventaris alat
- [ ] `kategori_inventaris` - Kategori alat
- [ ] `peminjaman` - Peminjaman alat

### Assessment Tables

- [ ] `penilaian` - Template penilaian
- [ ] `komponen_nilai` - Komponen penilaian
- [ ] `nilai_mahasiswa` - Nilai mahasiswa

### Other Tables

- [ ] `notifikasi` - Notifikasi

---

## 🔑 2. CEK KOLOM KRITIS

### Tabel `jadwal`

Buka: Table Editor > jadwal

Pastikan kolom ini ada:

- [ ] `id` (uuid, primary key)
- [ ] `kelas_id` (uuid, foreign key ke kelas) - **PENTING!**
- [ ] `laboratorium_id` (uuid, foreign key)
- [ ] `tanggal_praktikum` (date)
- [ ] `jam_mulai` (time)
- [ ] `jam_selesai` (time)
- [ ] `status` (text) - **BARU untuk approval workflow**
- [ ] `cancelled_by` (uuid) - **BARU untuk approval workflow**
- [ ] `cancelled_at` (timestamptz) - **BARU untuk approval workflow**
- [ ] `cancellation_reason` (text) - **BARU untuk approval workflow**

### Tabel `users`

- [ ] `id` (uuid, primary key)
- [ ] `email` (text)
- [ ] `nama` (text)
- [ ] `role` (enum: 'admin', 'dosen', 'mahasiswa')
- [ ] `status` (enum: 'active', 'inactive', 'suspended')

### Tabel `kuis`

- [ ] `randomize_options` (boolean) - Acak pilihan
- [ ] `allow_review` (boolean) - Izinkan review
- [ ] `is_offline_capable` (boolean) - Offline mode
- [ ] `auto_save_interval` (integer) - Auto-save

### Tabel `attempt_kuis`

- [ ] `sync_status` (enum: 'pending', 'synced', 'failed') - Offline sync
- [ ] `is_offline_attempt` (boolean)

---

## 🔒 3. CEK ROW LEVEL SECURITY (RLS)

Buka: Authentication > Policies

### Pastikan RLS ENABLED untuk semua tabel:

- [ ] `users` RLS enabled
- [ ] `mahasiswa` RLS enabled
- [ ] `dosen` RLS enabled
- [ ] `admin` RLS enabled
- [ ] `jadwal` RLS enabled
- [ ] `kuis` RLS enabled

### Cek Policy untuk `jadwal`:

- [ ] Mahasiswa hanya bisa read jadwal kelasnya
- [ ] Dosen bisa CRUD jadwal kelasnya
- [ ] Laboran bisa approve/reject jadwal
- [ ] Admin full access

---

## 🔗 4. CEK FOREIGN KEY RELATIONSHIPS

Buka: Table Editor > [table] > Relationships

### jadwal table:

- [ ] `kelas_id` → `kelas.id` (ON DELETE CASCADE)
- [ ] `laboratorium_id` → `laboratorium.id`

### kelas_mahasiswa table:

- [ ] `kelas_id` → `kelas.id`
- [ ] `mahasiswa_id` → `mahasiswa.id`

### attempt_kuis table:

- [ ] `kuis_id` → `kuis.id`
- [ ] `mahasiswa_id` → `mahasiswa.id`

---

## ⚙️ 5. CEK ENUMS

Buka: Database > Enums

- [ ] `user_role` - ('admin', 'dosen', 'mahasiswa', 'laboran')
- [ ] `user_status` - ('active', 'inactive', 'suspended')
- [ ] `jadwal_status` - ('pending', 'approved', 'rejected', 'cancelled')
- [ ] `attempt_status` - ('not_started', 'in_progress', 'completed', 'abandoned')
- [ ] `sync_status` - ('pending', 'synced', 'failed')
- [ ] `peminjaman_status` - ('pending', 'approved', 'rejected', 'returned')

---

## 🔥 6. CEK FUNCTIONS & TRIGGERS

Buka: Database > Functions

### Functions yang harus ada:

- [ ] `handle_new_user()` - Auto create mahasiswa/dosen/admin record
- [ ] `check_kehadiran_overlap()` - Prevent duplicate attendance
- [ ] `update_updated_at_column()` - Auto update timestamp

### Triggers:

- [ ] users - `on_auth_user_created` → handle_new_user()
- [ ] All tables - `set_updated_at` → update_updated_at_column()

---

## 🧪 7. TEST QUERIES

Jalankan di SQL Editor:

### Cek struktur jadwal table:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jadwal'
ORDER BY ordinal_position;
```

### Cek apakah status field ada:

```sql
SELECT status, cancelled_by, cancelled_at
FROM jadwal
LIMIT 1;
```

### Cek kelas_id reference:

```sql
SELECT j.id, j.kelas_id, k.nama_kelas
FROM jadwal j
LEFT JOIN kelas k ON j.kelas_id = k.id
LIMIT 5;
```

### Cek RLS policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('jadwal', 'users', 'kuis')
ORDER BY tablename, policyname;
```

---

## ✅ CHECKLIST FINAL

- [ ] Semua 20+ tabel ada
- [ ] Kolom `jadwal.status`, `cancelled_by`, `cancelled_at` ada
- [ ] Kolom `jadwal.kelas_id` ada (bukan hanya `kelas` string)
- [ ] RLS enabled di semua tabel
- [ ] Foreign keys configured correctly
- [ ] Enums defined properly
- [ ] Functions & triggers working

---

## 🚀 JIKA ADA YANG KURANG

Jalankan migration scripts di folder `scripts/sql/`:

```bash
# 1. Cek struktur tabel
psql -f scripts/sql/CHECK_JADWAL_TABLE_STRUCTURE.sql

# 2. Fix missing fields
psql -f scripts/sql/FIX_KUIS_STUCK_SAVING.sql

# 3. Verify migration
psql -f scripts/sql/VERIFY_MIGRATION_COMPLETE.sql
```

Atau copy-paste isi file SQL ke Supabase SQL Editor dan run manual.
