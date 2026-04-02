# Panduan Pengujian Online-First Authentication

## Tujuan

Dokumen ini menjelaskan cara menguji bahwa sistem online-first authentication berfungsi sebagaimana mestinya, yaitu pengguna HARUS login online terlebih dahulu sebelum dapat login offline.

## Persyaratan Sistem

Sebelum melakukan pengujian, pastikan:

- Aplikasi telah terinstal dan berjalan
- Koneksi internet tersedia untuk login awal
- Sudah memiliki akun pengguna yang valid (mahasiswa, dosen, laboran, atau admin)

## Skenario Pengujian

### 1. Pengujian Login Online Berhasil

**Tujuan**: Memastikan bahwa login online berfungsi dan mencatat bahwa pengguna telah login online.

**Langkah-langkah**:
1. Aktifkan koneksi internet
2. Buka aplikasi
3. Lakukan login dengan akun yang valid
4. Pastikan login berhasil
5. Periksa bahwa data pengguna disimpan untuk penggunaan offline
6. Periksa bahwa catatan login online telah dibuat

**Hasil yang Diharapkan**:
- Login berhasil
- Data pengguna disimpan di IndexedDB
- Catatan bahwa pengguna telah login online disimpan
- Aplikasi berfungsi normal

### 2. Pengujian Login Offline Setelah Login Online

**Tujuan**: Memastikan bahwa pengguna yang telah login online sebelumnya dapat login offline.

**Langkah-langkah**:
1. Pastikan pengguna telah login online setidaknya sekali
2. Matikan koneksi internet (simulasikan mode offline)
3. Tutup dan buka kembali aplikasi
4. Coba login dengan kredensial yang sama
5. Periksa bahwa login offline berhasil

**Hasil yang Diharapkan**:
- Login offline berhasil
- Aplikasi berfungsi dalam mode offline
- Data pengguna tersedia
- Fitur-fitur dasar aplikasi dapat diakses

### 3. Pengujian Gagal Login Offline Tanpa Login Online Terlebih Dahulu

**Tujuan**: Memastikan bahwa pengguna yang belum pernah login online TIDAK dapat login offline.

**Langkah-langkah**:
1. Gunakan akun baru yang belum pernah login online
2. Matikan koneksi internet (simulasikan mode offline)
3. Coba login dengan akun tersebut
4. Perhatikan pesan kesalahan yang muncul

**Hasil yang Diharapkan**:
- Login offline GAGAL
- Pesan kesalahan muncul: "Login offline gagal. Anda perlu login online minimal 1x sebelum bisa login offline."
- Pengguna tidak dapat mengakses fitur aplikasi
- Sistem tidak memberikan akses tanpa login online terlebih dahulu

### 4. Pengujian Kedaluwarsaan Kredensial Offline

**Tujuan**: Memastikan bahwa kredensial offline memiliki batas waktu dan akan kedaluwarsa.

**Langkah-langkah**:
1. Login online dan gunakan aplikasi dalam mode offline
2. Tunggu lebih dari 30 hari (atau modifikasi kode untuk waktu tes yang lebih singkat)
3. Coba login offline kembali
4. Periksa perilaku sistem

**Hasil yang Diharapkan**:
- Kredensial offline kedaluwarsa setelah 30 hari
- Sistem meminta login online kembali
- Login offline tidak diperbolehkan dengan kredensial kedaluwarsa

### 5. Pengujian Logout dan Pembersihan

**Tujuan**: Memastikan bahwa logout membersihkan sesi offline tetapi mempertahankan kebutuhan login online.

**Langkah-langkah**:
1. Login online dan gunakan aplikasi
2. Logout dari aplikasi
3. Login kembali dalam mode online
4. Matikan internet dan coba login offline

**Hasil yang Diharapkan**:
- Setelah logout, sesi offline dihapus
- Namun catatan bahwa pengguna pernah login online dipertahankan
- Login offline masih diperbolehkan karena pengguna pernah login online sebelumnya

### 6. Pengujian Integrasi dengan Role-Based Access

**Tujuan**: Memastikan bahwa sistem RBAC tetap berfungsi dalam mode offline.

**Langkah-langkah**:
1. Login online sebagai pengguna dengan peran tertentu (misalnya mahasiswa)
2. Masuki mode offline
3. Coba akses fitur-fitur yang seharusnya hanya tersedia untuk peran tersebut
4. Coba akses fitur-fitur yang seharusnya tidak tersedia untuk peran tersebut

**Hasil yang Diharapkan**:
- Akses ke fitur sesuai dengan peran pengguna
- Pembatasan akses diberlakukan meskipun dalam mode offline
- Data role-specific tersedia dalam mode offline

## Validasi Teknis

### Validasi Penyimpanan IndexedDB

Untuk memvalidasi bahwa sistem bekerja dengan benar, periksa isi IndexedDB:

1. Buka Developer Tools di browser
2. Pergi ke tab Application/Storage
3. Cari IndexedDB aplikasi
4. Periksa store berikut:
   - `users`: Harus berisi data pengguna
   - Metadata store: Harus berisi:
     - `offline_credentials`: Kredensial yang di-hash
     - `offline_session`: Sesi offline
     - `online_login_record`: Catatan bahwa pengguna telah login online

### Validasi Struktur Data

Struktur data yang disimpan harus sesuai dengan definisi:

```typescript
interface OnlineLoginRecord {
  id: string;
  userId: string;
  email: string;
  firstOnlineLoginAt: number;
  lastOnlineLoginAt: number;
  onlineLoginCount: number;
}
```

## Troubleshooting

### Jika Pengguna Dapat Login Offline Tanpa Login Online

**Gejala**: Pengguna dapat login offline meskipun belum pernah login online sebelumnya.

**Solusi**:
1. Periksa fungsi `hasLoggedInOnlineBefore()` di `online-first-auth.ts`
2. Pastikan fungsi `recordOnlineLogin()` dipanggil setelah login online berhasil
3. Verifikasi bahwa catatan login online disimpan dengan benar di IndexedDB

### Jika Login Online Tidak Mencatat Riwayat

**Gejala**: Setelah login online, pengguna tetap tidak dapat login offline.

**Solusi**:
1. Periksa apakah fungsi `recordOnlineLogin()` dipanggil di `AuthProvider.tsx`
2. Pastikan tidak ada error saat menyimpan catatan login online
3. Verifikasi bahwa userId cocok antara kredensial dan catatan login online

### Jika Fungsi-Fungsi Aplikasi Tidak Berfungsi dalam Mode Offline

**Gejala**: Login offline berhasil tetapi fitur-fitur aplikasi tidak berfungsi.

**Solusi**:
1. Pastikan data pengguna disimpan lengkap termasuk informasi role
2. Periksa integrasi dengan sistem RBAC
3. Verifikasi bahwa middleware permission memiliki fallback offline

## Kesimpulan

Pengujian online-first authentication sangat penting untuk memastikan keamanan dan integritas sistem. Dengan mengikuti panduan ini, kita dapat memastikan bahwa:

1. Pengguna harus login online terlebih dahulu sebelum dapat menggunakan mode offline
2. Sistem tetap aman meskipun dalam mode offline
3. Pengalaman pengguna tetap optimal dalam kedua mode
4. Kontrol akses berbasis peran tetap berfungsi dalam mode offline