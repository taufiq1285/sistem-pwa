# Runbook Backup & Restore Supabase (Tanpa Docker)

Dokumen ini untuk skenario antisipasi ketika project Supabase lama tidak aktif lagi, agar **tabel, RLS policy, trigger, function, dan data** bisa dipulihkan ke project baru.

---

## 1) Prinsip Penting

1. Backup harus dibuat **sebelum** project lama mati total.
2. Jangan hanya ekspor CSV dari table editor (CSV tidak menyimpan RLS/trigger/function).
3. Simpan backup minimal dalam 3 komponen:
   - **Schema SQL** (struktur database)
   - **Data SQL/CSV** (isi tabel)
   - **Storage file** (bucket/object)

---

## 2) Opsi A (Direkomendasikan): PostgreSQL client (`pg_dump`) – Tanpa Docker

> Opsi paling lengkap untuk disaster recovery.

### 2.1 Persiapan

1. Install PostgreSQL client tools di Windows (agar ada `pg_dump` dan `psql`).
2. Ambil kredensial database dari Supabase:
   - Host
   - Port
   - Database name
   - User
   - Password

### 2.2 Buat backup schema (struktur: tabel, index, FK, function, trigger, RLS policy)

Jalankan di CMD:

```bat
set PGPASSWORD=PASSWORD_ANDA
pg_dump -h HOST_ANDA -p 5432 -U USER_ANDA -d postgres --schema-only --no-owner --no-privileges -f backups\schema_backup.sql
```

### 2.3 Buat backup data

```bat
set PGPASSWORD=PASSWORD_ANDA
pg_dump -h HOST_ANDA -p 5432 -U USER_ANDA -d postgres --data-only --inserts --no-owner --no-privileges -f backups\data_backup.sql
```

### 2.4 Validasi cepat isi backup

```bat
findstr /i /c:"CREATE TABLE" backups\schema_backup.sql
findstr /i /c:"CREATE POLICY" backups\schema_backup.sql
findstr /i /c:"CREATE TRIGGER" backups\schema_backup.sql
findstr /i /c:"CREATE FUNCTION" backups\schema_backup.sql
```

Jika baris-baris di atas muncul, berarti objek utama terbackup.

---

## 3) Opsi B: Supabase CLI (Tanpa Docker)

> Gunakan jika Anda lebih nyaman dengan tooling Supabase.

### 3.1 Persiapan

1. Install Supabase CLI.
2. Login:

```bat
supabase login
```

3. Link project lama:

```bat
supabase link --project-ref PROJECT_REF_ANDA
```

### 3.2 Dump schema dan data

> Flag/perintah bisa sedikit berbeda tergantung versi CLI, cek:

```bat
supabase db dump --help
```

Contoh pola (sesuaikan versi):

```bat
supabase db dump --schema public -f backups\schema_public.sql
supabase db dump --data-only -f backups\data_public.sql
```

Jika versi CLI Anda berbeda, tetap ikuti prinsip yang sama: pisahkan **schema dump** dan **data dump**.

---

## 4) Backup objek non-database yang sering terlupa

1. **Storage bucket & file**
   - Download seluruh file bucket ke lokal.
   - Simpan struktur folder dengan konsisten.

2. **Auth config**
   - Provider OAuth
   - Redirect URL
   - SMTP
   - Template email

3. **Environment variables aplikasi**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - service role key (server side)
   - API key pihak ketiga

4. **Edge Functions**
   - Simpan source code di repo/Git, bukan berharap dari dump DB.

---

## 5) Restore ke Project Supabase Baru

### 5.1 Buat project baru

Buat project Supabase baru dari dashboard.

### 5.2 Restore schema dulu

```bat
set PGPASSWORD=PASSWORD_PROJECT_BARU
psql -h HOST_BARU -p 5432 -U USER_BARU -d postgres -f backups\schema_backup.sql
```

### 5.3 Restore data setelah schema sukses

```bat
set PGPASSWORD=PASSWORD_PROJECT_BARU
psql -h HOST_BARU -p 5432 -U USER_BARU -d postgres -f backups\data_backup.sql
```

### 5.4 Restore storage dan konfigurasi

1. Re-create bucket.
2. Upload ulang file.
3. Set ulang Auth provider/redirect/SMTP.
4. Set ulang environment variables di aplikasi.

---

## 6) Checklist Wajib Uji Setelah Restore

- Tabel inti terbentuk.
- FK/constraint aktif.
- Trigger jalan saat insert/update.
- RLS policy aktif (`ENABLE ROW LEVEL SECURITY` + `CREATE POLICY`).
- Login/auth tetap berfungsi.
- Query aplikasi tidak error.
- Upload/download storage normal.

---

## 7) SOP Backup Berkala (Saran Operasional)

- Harian: backup data.
- Mingguan: backup schema + data + storage.
- Bulanan: simulasi restore ke project dummy.
- Simpan backup ke 2 lokasi berbeda (lokal + cloud drive privat).

---

## 8) Catatan Risiko

1. Jika project lama benar-benar sudah tidak bisa diakses database-nya, backup baru tidak dapat diambil lagi.
2. Karena itu, lakukan backup berkala dari sekarang.
3. Simulasi restore sama pentingnya dengan membuat backup.

---

## 9) Ringkasan Praktis

Untuk skenario Anda (tanpa Docker), jalur paling aman:

1. `pg_dump` schema
2. `pg_dump` data
3. backup storage file
4. catat config auth/env
5. restore ke project baru pakai `psql`

Dengan pola ini, tabel + RLS + trigger + function + data bisa dipindahkan dengan risiko paling kecil.
