# Integrasi Role-Based Access Control (RBAC) dengan Mode Offline

## Ringkasan

Dokumen ini menjelaskan bagaimana sistem Role-Based Access Control (RBAC) terintegrasi dengan mode offline dalam aplikasi PWA ini.

## Arsitektur Integrasi

### 1. Middleware Izin (`permission.middleware.ts`)

Middleware izin telah dirancang untuk bekerja dalam mode online dan offline:

- **Fallback Offline**: Jika Supabase tidak tersedia, sistem akan menggunakan sesi offline yang tersimpan
- **Caching Peran**: Peran pengguna disimpan dalam cache untuk menghindari panggilan jaringan berulang
- **Kompatibilitas Offline**: Fungsi-fungsi seperti `getCurrentUserWithRole()` memiliki fallback ke sesi offline

### 2. Fungsi-Fungsi Konteks Pengguna

Fungsi-fungsi berikut mendukung mode offline:

- `getCurrentUser()`: Mendapatkan informasi pengguna saat ini, dengan fallback ke sesi offline
- `getCurrentUserWithRole()`: Mendapatkan pengguna dengan informasi perannya, dengan fallback ke sesi offline
- `getCurrentDosenId()`: Mendapatkan ID dosen saat ini, dengan fallback ke sesi offline
- `getCurrentMahasiswaId()`: Mendapatkan ID mahasiswa saat ini, dengan fallback ke sesi offline
- `getCurrentLaboranId()`: Mendapatkan ID laboran saat ini, dengan fallback ke sesi offline

### 3. Penyimpanan Data Peran

Saat login online, data peran pengguna disimpan bersama data pengguna:

- Data peran disimpan dalam IndexedDB bersama data pengguna utama
- Struktur data mencakup informasi role-specific (mahasiswa, dosen, laboran, admin)
- Data ini tersedia untuk digunakan dalam mode offline

## Implementasi Spesifik

### Fallback ke Sesi Offline

```typescript
// Dalam permission.middleware.ts
export async function getCurrentUserWithRole(): Promise<CurrentUser> {
  // Coba mode online terlebih dahulu
  try {
    // ... logika online
  } catch (error) {
    // Supabase tidak tersedia, lanjutkan ke mode offline
  }

  // Fallback ke sesi offline
  const offlineSession = await restoreOfflineSession();
  if (offlineSession) {
    // Gunakan data dari sesi offline
  }
}
```

### Caching Peran Pengguna

Sistem menggunakan cache in-memory untuk menyimpan peran pengguna:

```typescript
const userRoleCache = new Map<string, { role: UserRole; timestamp: number }>();
```

Cache ini membantu mengurangi panggilan jaringan dan meningkatkan kinerja, terutama dalam mode offline.

## Pengujian Integrasi

### Kasus Uji yang Harus Diuji

1. **Akses Online dengan Peran Valid**
   - Pengguna dengan peran tertentu dapat mengakses fitur yang sesuai
   - Middleware izin berfungsi sebagaimana mestinya
   - Tidak ada pembatasan akses yang tidak semestinya

2. **Akses Offline dengan Peran Tersimpan**
   - Pengguna dapat mengakses fitur-fitur dasar dalam mode offline
   - Peran pengguna dipertahankan dari sesi online sebelumnya
   - Fungsi-fungsi middleware berfungsi dengan fallback offline

3. **Perubahan Peran (Online)**
   - Jika peran pengguna diubah saat online, perubahan tersebut akan terlihat pada login berikutnya
   - Cache peran diperbarui sesuai dengan peran terbaru

4. **Konsistensi Data Peran**
   - Data role-specific (seperti NIM untuk mahasiswa, NIDN untuk dosen) tersedia dalam mode offline
   - Data ini disimpan bersama dengan data pengguna utama

## Keamanan

### Pembatasan Akses Offline

- Meskipun dalam mode offline, pembatasan akses berbasis peran tetap diberlakukan
- Fungsi-fungsi sensitif mungkin dinonaktifkan dalam mode offline untuk alasan keamanan
- Data penting mungkin tidak tersedia dalam mode offline untuk mencegah kebocoran

### Validasi Peran

- Peran pengguna divalidasi saat login online
- Data peran disimpan dengan cara yang aman dalam IndexedDB
- Tidak ada cara bagi pengguna untuk memalsukan peran mereka dalam sistem

## Kompatibilitas dengan Online-First Auth

Sistem RBAC bekerja seiring dengan sistem online-first auth:

- Pengguna harus login online terlebih dahulu untuk mendapatkan data peran
- Data peran kemudian tersedia untuk digunakan dalam mode offline
- Ini memastikan bahwa hanya pengguna yang sah yang dapat mengakses fitur berdasarkan peran mereka

## Kesimpulan

Integrasi RBAC dengan mode offline telah dirancang untuk:
1. Menjaga keamanan akses berbasis peran bahkan dalam mode offline
2. Memberikan pengalaman pengguna yang konsisten antara mode online dan offline
3. Menyediakan fallback yang aman ketika layanan backend tidak tersedia
4. Memastikan bahwa peran pengguna tetap valid dan konsisten

Dengan pendekatan ini, aplikasi dapat berfungsi secara efektif dalam lingkungan dengan koneksi jaringan yang tidak stabil atau tidak tersedia, tanpa mengorbankan kontrol akses yang penting untuk sistem manajemen praktikum laboratorium.