# Debug: Tombol "Buat Soal" Tidak Berfungsi

## Langkah Debug:

### 1. Buka Browser Console
- Buka `http://localhost:5174`
- Login sebagai **Dosen**
- Buka Developer Tools (F12)
- Pergi ke tab Console

### 2. Test Buat Kuis
- Klik menu **Kuis** di sidebar
- Klik tombol **"Buat Kuis Baru"**
- Isi form:
  - **Judul**: Test Kuis Debug
  - **Kelas**: Pilih salah satu kelas
  - **Deskripsi**: (opsional)
  - **Durasi**: 60 menit

### 3. Klik Tombol "Buat Soal"
- Klik tombol **"Buat Soal"** (biru, di pojok kanan atas section "Daftar Soal")
- **Perhatikan di Console**, harusnya muncul log:
  ```
  🔵 handleAddQuestion called
  🔵 currentQuiz: null
  🔵 Form data: { judul: ..., kelas_id: ..., ... }
  ```

### 4. Kemungkinan Masalah:

#### A. Jika TIDAK ADA LOG sama sekali:
- ❌ onClick handler tidak terpasang
- ❌ Tombol disabled
- ❌ Ada error di component

#### B. Jika ada log "❌ Judul kosong":
- Form data tidak ter-sync dengan react-hook-form

#### C. Jika ada log "❌ Kelas tidak dipilih":
- Dropdown kelas tidak ter-select

#### D. Jika ada log "❌ Durasi kurang dari 5 menit":
- Input durasi tidak ter-sync

#### E. Jika ada error di backend:
- Cek network tab
- Lihat response error dari API

### 5. Check Tombol Disabled
Di console browser, jalankan:
```javascript
document.querySelector('button[disabled]')
```

Jika tombol "Buat Soal" muncul, berarti tombol sedang disabled.

## Screenshot yang Dibutuhkan:
1. Screenshot halaman buat kuis
2. Screenshot console browser (dengan log)
3. Screenshot error (jika ada)

## File yang Sudah Dimodifikasi:
- `src/components/features/kuis/builder/QuizBuilder.tsx` (tambah console.log)

## Rollback Console.log (setelah debug):
Setelah debug selesai, hapus console.log yang ditambahkan.
