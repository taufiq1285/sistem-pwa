# Perbaikan Fitur Kehadiran Dosen

## Masalah yang Ditemukan

Dosen tidak bisa mengambil data mata kuliah dan kelas pada halaman kehadiran. Masalah ini disebabkan oleh:

1. **Query nested select yang bisa gagal silently** - Query dengan nested select seperti `mata_kuliah (kode_mk, nama_mk)` dapat gagal tanpa error yang jelas
2. **Kemungkinan RLS policy yang kurang lengkap** - Policy untuk akses dosen ke tabel `kelas` dan `mata_kuliah` mungkin belum lengkap

## Perbaikan yang Dilakukan

### 1. Perbaikan API `getMyKelas()` (src/lib/api/dosen.api.ts)

**Perubahan:**
- Menambahkan **fallback mechanism** jika nested select gagal
- Jika query pertama dengan nested select gagal, akan otomatis mencoba query terpisah:
  1. Ambil data kelas terlebih dahulu
  2. Ambil data mata kuliah secara terpisah
  3. Gabungkan data secara manual (manual join)

**Keuntungan:**
- Lebih robust dan tidak akan gagal silently
- Memberikan logging yang lebih detail untuk debugging
- Menambahkan fallback message jika mata kuliah tidak ditemukan

**Kode yang ditambahkan:**
```typescript
if (kelasError) {
  // Try fallback query without nested select
  const { data: fallbackKelas, error: fallbackError } = await supabase
    .from("kelas")
    .select("id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id")
    .eq("is_active", true);

  // Get mata kuliah separately
  const { data: mkData } = await supabase
    .from("mata_kuliah")
    .select("id, kode_mk, nama_mk")
    .in("id", mkIds);

  // Manual join
  const mkMap = new Map(mkData.map(mk => [mk.id, mk]));
  const uniqueKelas = fallbackKelas.map(k => ({
    ...k,
    mata_kuliah: mkMap.get(k.mata_kuliah_id) || null
  }));
}
```

### 2. Update Type Definition

Menambahkan field `mata_kuliah_id` ke interface `KelasWithStats` untuk mendukung tracking mata kuliah ID.

### 3. SQL Script untuk Verifikasi

**File: `FIX_KEHADIRAN_DOSEN_ACCESS.sql`**

Script ini akan:
- Memverifikasi RLS policies untuk tabel `kelas` dan `mata_kuliah`
- Membuat policy jika belum ada
- Mengecek apakah ada data kelas dan mata kuliah di database
- Memverifikasi foreign key relationship antara kelas dan mata kuliah
- Menampilkan RLS policies yang aktif

**File: `DEBUG_KEHADIRAN_KELAS.sql`**

Script untuk debugging yang akan mengecek:
- Jumlah kelas dan mata kuliah di database
- Test join antara kelas dan mata kuliah
- RLS policies yang aktif
- Apakah RLS enabled di tabel

## Cara Testing

### 1. Jalankan SQL Script di Supabase

```bash
# Login sebagai admin di Supabase SQL Editor
# Jalankan script:
FIX_KEHADIRAN_DOSEN_ACCESS.sql
```

Output yang diharapkan:
```
NOTICE: kelas_select_dosen policy already exists
NOTICE: mata_kuliah_select_all policy already exists
NOTICE: Active kelas count: <jumlah>
NOTICE: Mata kuliah count: <jumlah>
```

Jika ada WARNING:
- `No active kelas found!` → Admin perlu membuat data kelas
- `No mata kuliah found!` → Admin perlu membuat data mata kuliah

### 2. Test di Aplikasi

**Login sebagai Dosen:**

1. Buka halaman **Kehadiran** (`/dosen/kehadiran`)
2. Periksa apakah dropdown **Mata Kuliah** (Step 1) terisi dengan data
3. Pilih salah satu mata kuliah
4. Periksa apakah dropdown **Kelas** (Step 2) terisi dengan data kelas yang sesuai
5. Pilih kelas dan tanggal
6. Periksa apakah daftar mahasiswa muncul

**Debugging di Browser Console:**

Buka Developer Tools (F12) → Console, lalu cek log:

```javascript
// Harus muncul log seperti ini:
🔍 DEBUG getMyKelas: Getting ALL available courses
📚 DEBUG: Found X active kelas
✅ DEBUG: Returning X kelas with mata kuliah data
```

Jika ada error:
```javascript
❌ DEBUG: kelasError = ...
✅ DEBUG: Using fallback query, found X kelas
```

Ini berarti fallback mechanism aktif (yang bagus - artinya nested select gagal tapi data tetap bisa diambil).

### 3. Verifikasi Data

**Jika tidak ada data kelas/mata kuliah:**

Login sebagai **Admin** dan buat data:

1. **Mata Kuliah:**
   - Buka menu **Mata Kuliah**
   - Tambah mata kuliah baru (misal: "Algoritma Pemrograman", kode: "IF101")

2. **Kelas:**
   - Buka menu **Kelas**
   - Tambah kelas baru
   - Pilih mata kuliah yang sudah dibuat
   - Assign dosen (optional, karena sekarang semua dosen bisa akses semua kelas)

3. **Mahasiswa:**
   - Tambahkan mahasiswa ke kelas via menu **Kelas** → pilih kelas → tab **Mahasiswa**

## Catatan Penting

### Perubahan Behavior

**SEBELUMNYA:**
- Dosen hanya bisa lihat kelas yang di-assign ke mereka (via `dosen_id` di tabel `kelas`)

**SEKARANG:**
- Dosen bisa lihat **SEMUA kelas aktif** di sistem
- Ini untuk mendukung workflow input kehadiran yang lebih fleksibel
- Dosen bisa input kehadiran untuk kelas mana saja (bukan hanya kelas mereka)

Jika Anda ingin mengembalikan ke behavior lama (hanya kelas yang di-assign), ubah di `dosen.api.ts` line 313:

```typescript
// Tambahkan kembali filter dosen_id:
const dosenId = await getDosenId();
if (!dosenId) return [];

const { data: allKelas, error: kelasError } = await supabase
  .from("kelas")
  .select(...)
  .eq("dosen_id", dosenId)  // <- TAMBAHKAN INI
  .eq("is_active", true);
```

## Troubleshooting

### Error: "No active kelas found"

**Solusi:**
- Login sebagai Admin
- Buat data kelas di menu **Manajemen Kelas**
- Pastikan status kelas adalah **Active** (`is_active = true`)

### Error: "Mata Kuliah Tidak Ditemukan"

**Penyebab:**
- Data kelas ada tapi `mata_kuliah_id` tidak valid (foreign key broken)

**Solusi:**
```sql
-- Jalankan di Supabase SQL Editor:
SELECT k.id, k.nama_kelas, k.mata_kuliah_id, mk.nama_mk
FROM kelas k
LEFT JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
WHERE k.is_active = true AND mk.id IS NULL;

-- Jika ada hasil, update kelas tersebut dengan mata_kuliah_id yang valid
```

### Dropdown Mata Kuliah/Kelas kosong meskipun ada data

**Solusi:**
1. Buka Browser Console (F12)
2. Lihat error message
3. Cek apakah ada RLS policy error:
   - Jika ada error "permission denied" → Jalankan `FIX_KEHADIRAN_DOSEN_ACCESS.sql`
4. Clear browser cache dan reload halaman

## File yang Diubah

1. `src/lib/api/dosen.api.ts` - Perbaikan fungsi `getMyKelas()`
2. `FIX_KEHADIRAN_DOSEN_ACCESS.sql` - Script untuk fix RLS policies
3. `DEBUG_KEHADIRAN_KELAS.sql` - Script untuk debugging

## Testing Checklist

- [ ] SQL script berhasil dijalankan tanpa error
- [ ] Ada data kelas aktif di database (minimal 1)
- [ ] Ada data mata kuliah di database (minimal 1)
- [ ] Dropdown Mata Kuliah terisi saat buka halaman kehadiran
- [ ] Dropdown Kelas terisi setelah pilih mata kuliah
- [ ] Daftar mahasiswa muncul setelah pilih kelas
- [ ] Bisa menyimpan kehadiran tanpa error
- [ ] Browser console tidak menampilkan error (warning OK)
