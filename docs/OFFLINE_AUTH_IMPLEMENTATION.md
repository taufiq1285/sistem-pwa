# Implementasi Sistem Autentikasi Offline-First

## Ringkasan

Dokumen ini menjelaskan implementasi sistem autentikasi offline-first yang memastikan pengguna harus login online terlebih dahulu sebelum dapat menggunakan aplikasi dalam mode offline.

## Arsitektur Sistem

### 1. Online-First Authentication Manager (`online-first-auth.ts`)

File ini mengelola kebijakan bahwa pengguna harus login online terlebih dahulu sebelum dapat login offline. Fitur utamanya:

- **Pencatatan Login Online**: Mencatat kapan pengguna pertama kali login online
- **Verifikasi Riwayat Login**: Memastikan pengguna memiliki riwayat login online sebelum mengizinkan login offline
- **Keamanan Offline**: Mencegah pengguna membuat kredensial offline tanpa otentikasi online yang sah

#### Fungsi Utama:
- `recordOnlineLogin()`: Mencatat bahwa pengguna telah login online
- `hasLoggedInOnlineBefore()`: Memeriksa apakah pengguna pernah login online sebelumnya
- `canLoginOffline()`: Memverifikasi apakah pengguna dapat login offline
- `secureOfflineLogin()`: Proses login offline yang aman dengan verifikasi online-first

### 2. Integrasi dengan AuthProvider (`AuthProvider.tsx`)

AuthProvider telah diperbarui untuk:

- Memanggil `recordOnlineLogin()` setelah login online berhasil
- Menggunakan fungsi `secureOfflineLogin()` saat mode offline aktif
- Menjaga konsistensi antara status online dan offline

### 3. Perubahan pada Sistem Offline (`offline-auth.ts`)

Fungsi `offlineLogin()` telah diganti untuk menggunakan pendekatan yang lebih aman:

- Mengimpor dan menggunakan `secureOfflineLogin()` dari `online-first-auth.ts`
- Memastikan bahwa semua login offline melalui verifikasi online-first

## Alur Kerja Otentikasi

### Login Online
```
1. Pengguna memasukkan kredensial
2. Sistem memverifikasi dengan Supabase
3. Jika berhasil:
   - Simpan kredensial offline
   - Simpan sesi offline
   - Simpan data pengguna
   - CATAT bahwa pengguna telah login online (recordOnlineLogin)
4. Update state otentikasi
```

### Login Offline
```
1. Sistem mendeteksi mode offline
2. Verifikasi bahwa pengguna:
   - Telah login online sebelumnya
   - Memiliki kredensial offline yang valid
   - Kredensial belum kadaluarsa
3. Jika semua syarat terpenuhi, izinkan login offline
4. Jika tidak, tolak dengan pesan bahwa pengguna harus login online dulu
```

## Keamanan

### Perlindungan Terhadap Serangan Offline
- Kredensial offline di-hash menggunakan SHA-256
- Kredensial memiliki masa berlaku (30 hari)
- Harus login online terlebih dahulu sebelum bisa login offline
- Sesi offline memiliki masa berlaku (24 jam)

### Perlindungan Terhadap Serangan Replay
- Salt diturunkan dari email pengguna
- Setiap kredensial disimpan dengan timestamp
- Mekanisme pembersihan otomatis untuk data yang kadaluarsa

## Konfigurasi

### Waktu Kadaluarsa
- Kredensial offline: 30 hari
- Sesi offline: 24 jam
- Cache otentikasi: 24 jam

### Penyimpanan Data
- Kredensial: IndexedDB (metadata store)
- Sesi: IndexedDB (metadata store)
- Data pengguna: IndexedDB (users store)
- Catatan login online: IndexedDB (metadata store)

## Testing

### Kasus Uji yang Harus Diuji

1. **Login Online Berhasil**
   - Pengguna dapat login online
   - Data disimpan dengan benar untuk penggunaan offline
   - Catatan login online dibuat

2. **Login Offline Setelah Online**
   - Pengguna yang pernah login online dapat login offline
   - Data pengguna tersedia dalam mode offline
   - Fungsi-fungsi aplikasi dasar berfungsi

3. **Percobaan Login Offline Tanpa Online Terlebih Dahulu**
   - Pengguna yang belum pernah login online TIDAK dapat login offline
   - Pesan kesalahan yang jelas ditampilkan
   - Tidak ada akses ke fitur aplikasi

4. **Logout dan Pembersihan**
   - Saat logout, sesi offline dihapus
   - Kredensial offline dipertahankan untuk login offline di masa depan
   - Catatan login online dipertahankan (untuk menjaga status "pernah login online")

## Integrasi dengan Role-Based Access Control

Sistem otentikasi offline ini sepenuhnya kompatibel dengan sistem kontrol akses berbasis peran (RBAC) yang ada:

- Data peran pengguna disimpan bersama data pengguna
- Middleware izin dapat beroperasi dalam mode offline
- Fungsi-fungsi seperti `getCurrentUserWithRole()` memiliki fallback offline

## Kesimpulan

Implementasi ini memastikan bahwa:
1. Keamanan tetap terjaga meskipun dalam mode offline
2. Pengguna harus memiliki hubungan otentikasi yang sah dengan sistem sebelum dapat mengaksesnya secara offline
3. Pengalaman pengguna dalam mode offline tetap optimal
4. Sistem tetap dapat berfungsi ketika koneksi internet tidak tersedia

Dengan pendekatan online-first, kita memastikan integritas sistem sambil memberikan fleksibilitas penggunaan dalam mode offline.