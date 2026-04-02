# 4.4 Hasil Pengujian White Box (Unit Test)
## Sistem Praktikum PWA

**Tanggal Eksekusi Terbaru**: 2026-03-08  
**Perintah Eksekusi**: `npm run test`  
**Runner**: Vitest (`v3.2.4`)

---

## 4.4.1 Framework dan Infrastruktur Pengujian

Pengujian white box pada sistem ini dilaksanakan menggunakan pendekatan unit test dan integration test yang bersifat otomatis dan dapat dieksekusi ulang kapan saja. Seluruh pengujian dijalankan sekaligus melalui perintah `npm run test` tanpa memerlukan intervensi manual pada setiap skenario.

### Tabel 4.x. Perangkat Pengujian White Box

| Komponen | Keterangan |
|---|---|
| Framework | Vitest v3.2.4 |
| Testing Library | React Testing Library ([`@testing-library/react`](package.json:68)) |
| Assertion Library | [`@testing-library/jest-dom`](package.json:67) |
| DOM Environment | [`happy-dom`](package.json:84) |
| Runner Mode | Concurrent dengan [`pool: 'forks'`](vitest.config.ts:20) |
| Setup File | [`./src/__tests__/setup.ts`](vitest.config.ts:16) |
| Pola Include | [`src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`](vitest.config.ts:18) |
| Perintah Eksekusi | [`npm run test`](package.json:16) |

Konfigurasi [`pool: 'forks'`](vitest.config.ts:20) memastikan setiap file test dijalankan dalam proses terpisah sehingga tidak terjadi kebocoran state antar file pengujian. Seluruh pengujian menggunakan environment [`happy-dom`](vitest.config.ts:15) agar komponen React, hooks, dan utilitas yang berinteraksi dengan DOM dapat diuji secara konsisten dalam lingkungan yang ringan dan stabil. Modul eksternal seperti Supabase, routing, browser API, dan layanan sinkronisasi digantikan oleh mock menggunakan pola [`vi.mock()`](src/__tests__/setup.ts:1), dan pada beberapa modul tertentu digunakan pendekatan hoisted mocking agar tetap kompatibel dengan sistem modul ESM yang digunakan aplikasi ini.

Selain itu, script [`test`](package.json:16) dikonfigurasi dengan alokasi memori Node yang lebih besar agar keseluruhan suite pengujian dapat dijalankan secara penuh dan stabil pada skala ratusan file test. Dengan infrastruktur tersebut, pengujian dapat diulang kapan saja dengan hasil yang konsisten, sehingga sesuai digunakan sebagai dasar verifikasi white box pada tahap implementasi dan evaluasi sistem.

---

## 4.4.2 Struktur dan Distribusi File Test

Pengujian mencakup seluruh lapisan arsitektur sistem sesuai pola Clean Architecture yang diterapkan, mulai dari lapisan core logic seperti API, hooks, offline/PWA, utilitas, validasi, wrapper Supabase, konfigurasi, dan context, hingga lapisan presentation seperti halaman, komponen fitur, komponen bersama, provider, layout, dan services. Selain itu, tersedia pula integration test yang menguji alur lintas modul, serta legacy test yang masih dipertahankan sebagai pengaman regresi. Total terdapat **238 file test aktif** dengan **5.317 test case** pada eksekusi penuh terbaru.

### Tabel 4.x. Distribusi File Test dan Test Case per Kelompok Modul

| No | Kelompok Modul | Lapisan | Jumlah File | Jumlah Test Case |
|---|---|---|---:|---:|
| 1 | API Layer | Core Logic | 34 | 1.471 |
| 2 | Hooks | Core Logic | 21 | 561 |
| 3 | Offline & PWA | Core Logic | 15 | 738 |
| 4 | Utils & Helpers | Core Logic | 21 | 776 |
| 5 | Validasi (Schema) | Core Logic | 8 | 533 |
| 6 | Supabase | Core Logic | 5 | 103 |
| 7 | Config & Context | Core Logic | 11 | 170 |
| 8 | Halaman (Pages) | Presentation | 33 | 169 |
| 9 | Komponen Fitur | Presentation | 32 | 227 |
| 10 | Komponen Bersama | Presentation | 24 | 294 |
| 11 | Provider | Presentation | 6 | 84 |
| 12 | Layout | Presentation | 9 | 30 |
| 13 | Services & Lainnya | Presentation | 4 | 60 |
| 14 | Integration Test | Cross-layer | 8 | 90 |
| 15 | Legacy | — | 7 | 11 |
|   | **Total** |   | **238** | **5.317** |

Pada konteks penelitian ini, **legacy test** adalah file pengujian generasi sebelumnya yang masih dipertahankan dan tetap dijalankan bersama suite utama sebagai pengaman regresi, meskipun telah dipisahkan dari struktur utama unit test dan integration test. Keberadaan kelompok ini menunjukkan bahwa pengujian tidak hanya berorientasi pada modul baru, tetapi juga tetap menjaga stabilitas perilaku fitur yang telah diuji pada fase pengembangan sebelumnya.

Distribusi tersebut menunjukkan bahwa pengujian white box tidak hanya berfokus pada fungsi-fungsi utilitas, tetapi juga menjangkau perilaku halaman, interaksi komponen, provider global, mekanisme offline, dan skenario integrasi lintas modul. Dengan struktur seperti ini, pengujian mampu merepresentasikan kondisi riil eksekusi aplikasi dari unit terkecil hingga alur bisnis yang saling terhubung.

---

## 4.4.3 Rincian Modul yang Diuji

### A. API Layer — 34 File, 1.471 Test Case

Seluruh fungsi pemanggilan API ke Supabase diuji pada lapisan ini. Setiap fungsi diuji terhadap: (1) skenario sukses dengan data valid, (2) penanganan error dari Supabase, (3) kondisi batas seperti data kosong atau parameter `null`, dan (4) logika offline-first seperti fallback ke cache ketika API tidak dapat dijangkau.

### Tabel 4.x. Daftar File Test pada Kelompok API Layer

| File Test | Fungsi Utama yang Diuji |
|---|---|
| [`admin.api.test.ts`](src/__tests__/unit/core-logic/api/admin.api.test.ts) | `getDashboardStats`, `getUserGrowth`, `getUserDistribution`, `getLabUsage` |
| [`announcements.api.test.ts`](src/__tests__/unit/core-logic/api/announcements.api.test.ts) | `getAllAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` |
| [`auth.api.test.ts`](src/__tests__/unit/core-logic/api/auth.api.test.ts) | `login`, `register`, `logout`, `resetPassword`, `updatePassword` |
| [`bank-soal.api.test.ts`](src/__tests__/unit/core-logic/api/bank-soal.api.test.ts) | `getBankSoal`, `createBankSoal`, `checkDuplicateBankSoal`, `addQuestionsFromBank` |
| [`dosen.api.test.ts`](src/__tests__/unit/core-logic/api/dosen.api.test.ts) | `getDosen`, `createDosen`, `updateDosen`, `assignKelas` |
| [`jadwal.api.test.ts`](src/__tests__/unit/core-logic/api/jadwal.api.test.ts) | `getJadwal`, `createJadwal`, `updateJadwal`, `approveJadwal` |
| [`kehadiran.api.test.ts`](src/__tests__/unit/core-logic/api/kehadiran.api.test.ts) | `getKehadiran`, `createKehadiran`, `updateKehadiran`, `bulkUpdateKehadiran` |
| [`kuis.api.test.ts`](src/__tests__/unit/core-logic/api/kuis.api.test.ts) | `getKuis`, `createKuis`, `cacheQuizOffline`, `syncOfflineAnswers`, `getKuisByIdOffline` |
| [`kuis-secure.api.test.ts`](src/__tests__/unit/core-logic/api/kuis-secure.api.test.ts) | `getSoalForAttempt`, `validateAttemptAccess`, `startAttempt`, `submitAttempt` |
| [`kuis-versioned-simple.api.test.ts`](src/__tests__/unit/core-logic/api/kuis-versioned-simple.api.test.ts) | operasi kuis berversi dan pengelolaan draft |
| [`mahasiswa.api.test.ts`](src/__tests__/unit/core-logic/api/mahasiswa.api.test.ts) | `getMahasiswa`, `createMahasiswa`, `updateMahasiswa`, `enrollKelas` |
| [`nilai.api.test.ts`](src/__tests__/unit/core-logic/api/nilai.api.test.ts) | `getNilai`, `createNilai`, `updateNilai`, `calculateFinalScore` |
| [`permintaan-perbaikan.api.test.ts`](src/__tests__/unit/core-logic/api/permintaan-perbaikan.api.test.ts) | `getPermintaan`, `createPermintaan`, `updatePermintaan` |
| [`sync.api.test.ts`](src/__tests__/unit/core-logic/api/sync.api.test.ts) | `syncQueue`, `processSync`, `retryFailed`, `clearCompleted` |
| [`users.api.test.ts`](src/__tests__/unit/core-logic/api/users.api.test.ts) | `getUsers`, `createUser`, `updateUserRole`, `deleteUser` |
| 19 file lainnya | laporan-storage, logbook, materi, notification, offline-queue, profile, reports, kelas, laboran, mata-kuliah, mahasiswa-semester, assignment, cleanup, versioned update, dan modul API lain yang relevan |

Beberapa contoh skenario pengujian spesifik dari [`kuis.api.test.ts`](src/__tests__/unit/core-logic/api/kuis.api.test.ts) adalah sebagai berikut:
- “menerapkan filter default `status != archived` dan search”
- “mematikan cache saat `forceRefresh = true`”
- “`cacheQuizOffline`: create saat belum ada cache”
- “`syncOfflineAnswers`: hapus jawaban lokal setelah sync sukses”
- “`getKuisByIdOffline` fallback ke cache saat API gagal”

Rangkaian pengujian tersebut menunjukkan bahwa lapisan API tidak hanya diverifikasi dari sisi keberhasilan request, tetapi juga dari sisi ketahanan sistem dalam menghadapi error, data kosong, dan skenario sinkronisasi offline.

### B. Hooks — 21 File, 561 Test Case

Seluruh custom React hooks diuji menggunakan `renderHook` dari React Testing Library. Setiap hook diuji terhadap state awal, perubahan state akibat aksi pengguna, side effect seperti pemanggilan API atau pembaruan `localStorage`, serta pembersihan (cleanup) saat komponen di-unmount.

### Tabel 4.x. Daftar File Test pada Kelompok Hooks

| File Test | Aspek Utama yang Diuji |
|---|---|
| [`useAuth.test.ts`](src/__tests__/unit/core-logic/hooks/useAuth.test.ts) | state autentikasi, login/logout, pengecekan role, session expiry |
| [`useAutoSave.test.ts`](src/__tests__/unit/core-logic/hooks/useAutoSave.test.ts) | debounce auto-save, manual save, status menyimpan, error recovery |
| [`useConflicts.test.ts`](src/__tests__/unit/core-logic/hooks/useConflicts.test.ts) | deteksi konflik data antar perangkat, strategi resolusi |
| [`useDebounce.test.ts`](src/__tests__/unit/core-logic/hooks/useDebounce.test.ts) | delay debounce, reset saat nilai berubah, immediate mode |
| [`useNetworkStatus.test.ts`](src/__tests__/unit/core-logic/hooks/useNetworkStatus.test.ts) | deteksi status online/offline dan event listener `navigator.onLine` |
| [`useNotifications.test.ts`](src/__tests__/unit/core-logic/hooks/useNotifications.test.ts) | perilaku dasar pemuatan notifikasi |
| [`useNotificationPolling.test.ts`](src/__tests__/unit/core-logic/hooks/useNotificationPolling.test.ts) | interval polling, berhenti saat `unmount`, backoff saat error |
| [`useOffline.test.ts`](src/__tests__/unit/core-logic/hooks/useOffline.test.ts) | mode offline, antrian operasi, eksekusi saat kembali online |
| [`useRole.test.ts`](src/__tests__/unit/core-logic/hooks/useRole.test.ts) | pengecekan peran dan pembatasan akses resource |
| [`useSync.test.ts`](src/__tests__/unit/core-logic/hooks/useSync.test.ts) | inisialisasi, `addToQueue`, `processQueue`, `retryFailed`, statistik antrian |
| [`useUnreadNotifications.test.ts`](src/__tests__/unit/core-logic/hooks/useUnreadNotifications.test.ts) | filter notifikasi berdasarkan role, rentang tanggal aktif, dan prioritas |
| [`useSessionTimeout.test.ts`](src/__tests__/unit/core-logic/hooks/useSessionTimeout.test.ts) | deteksi idle, peringatan sebelum logout, auto-logout |
| 9 file lainnya | `useLocalData`, `useLocalStorage`, `useMultiTabSync`, `usePdfBlobUrl`, `useSignedUrl`, `useSupabase`, `useTheme`, dan hooks pendukung lainnya |

Kelompok hooks ini penting karena sebagian besar logika stateful pada aplikasi berada pada level hook. Oleh karena itu, keberhasilan pengujian hooks berkontribusi langsung terhadap kestabilan perilaku antarmuka pengguna.

### C. Offline & PWA — 15 File, 738 Test Case

Kelompok ini menguji mekanisme kerja aplikasi saat tidak ada koneksi internet serta infrastruktur Progressive Web App. Pengujian dibagi menjadi dua subkelompok berikut.

**Offline Core (7 file)** — menguji lapisan helper offline di atas IndexedDB: `ApiCache`, `ConflictRulesConfig`, `OfflineApiHelper`, `OfflineAuth`, `QueueManagerIdempotent`, `SmartConflictResolver`, dan `StorageManager`.

**PWA Library (8 file)** — menguji infrastruktur PWA tingkat rendah: `ConflictResolver`, `IndexedDB`, `NetworkDetector`, `QueueManager`, `SyncManager`, `BackgroundSync`, `CacheStrategies`, dan `RegisterServiceWorker`.

Contoh skenario dari `CacheStrategies`:
- “`cacheFirst`: mengembalikan respons dari cache jika masih valid”
- “`cacheFirst`: mengambil dari network saat cache miss”
- “`networkFirst`: memprioritaskan network, fallback ke cache saat gagal”
- “`staleWhileRevalidate`: mengembalikan cache sembari memperbarui di latar belakang”

Contoh skenario dari `QueueManager`:
- “should enqueue item with correct structure”
- “should process items in FIFO order”
- “should retry failed items up to `maxRetries`”
- “should mark item as completed after success”

Kelompok ini menjadi salah satu fokus utama penelitian karena aplikasi dirancang untuk tetap andal pada kondisi koneksi internet yang terbatas. Oleh sebab itu, pengujian white box pada area offline dan PWA memiliki peran yang sangat penting dalam membuktikan keunggulan sistem.

### D. Utils & Helpers — 21 File, 776 Test Case

Seluruh fungsi utilitas pendukung sistem diuji secara unit terhadap berbagai input, termasuk nilai batas, tipe data yang salah, dan string kosong.

### Tabel 4.x. Daftar File Test pada Kelompok Utils

| File Test | Aspek Utama yang Diuji |
|---|---|
| [`quiz-scoring.test.ts`](src/__tests__/unit/core-logic/utils/quiz-scoring.test.ts) | `gradeAnswer`, `calculateQuizScore`, `getGradeColor`, `isLaporanMode`, `calculateGradeLetter` |
| [`format.test.ts`](src/__tests__/unit/core-logic/utils/format.test.ts) | format tanggal Indonesia, format angka, format nama lengkap |
| [`permissions.test.ts`](src/__tests__/unit/core-logic/utils/permissions.test.ts) | pengecekan hak akses per role dan resource |
| [`normalize.test.ts`](src/__tests__/unit/core-logic/utils/normalize.test.ts) | normalisasi data dari API ke format aplikasi |
| [`retry.test.ts`](src/__tests__/unit/core-logic/utils/retry.test.ts) | logika retry dengan exponential backoff dan batas maksimum percobaan |
| [`error-logger.test.ts`](src/__tests__/unit/core-logic/utils/error-logger.test.ts) | pencatatan error, format pesan, level severity |
| [`kehadiran-export.test.ts`](src/__tests__/unit/core-logic/utils/kehadiran-export.test.ts) | ekspor data kehadiran ke format file |
| [`cache-manager.test.ts`](src/__tests__/unit/core-logic/utils/cache-manager.test.ts) | manajemen cache, TTL, invalidasi cache |
| [`idempotency.test.ts`](src/__tests__/unit/core-logic/utils/idempotency.test.ts) | pembuatan kunci idempoten dan deduplikasi operasi |
| [`helpers.test.ts`](src/__tests__/unit/core-logic/utils/helpers.test.ts) | fungsi-fungsi helper umum |
| 11 file lainnya | `cache-cleaner`, `constants`, `debounce`, `device-detect`, `errors`, `fetch-with-timeout`, `field-mappers`, `logger`, `network-status`, `pdf-viewer`, dan `error-messages` |

Besarnya jumlah test case pada kelompok ini menunjukkan bahwa utilitas dan helper merupakan fondasi penting yang memengaruhi banyak modul lain. Oleh sebab itu, kestabilan lapisan ini berpengaruh langsung terhadap kestabilan sistem secara keseluruhan.

### E. Validasi / Schema — 8 File, 533 Test Case

Seluruh skema validasi input menggunakan Zod diuji dengan data valid dan berbagai variasi data tidak valid untuk memastikan aturan validasi diterapkan secara konsisten di seluruh formulir sistem.

### Tabel 4.x. Daftar File Test pada Kelompok Validasi

| File Test | Skenario yang Diuji |
|---|---|
| [`auth.schema.test.ts`](src/__tests__/unit/core-logic/validations/auth.schema.test.ts) | format email, panjang password minimum 8 karakter, konfirmasi password, field kosong |
| [`kuis.schema.test.ts`](src/__tests__/unit/core-logic/validations/kuis.schema.test.ts) | judul minimal 5 karakter, durasi 5–300 menit, UUID `kelas_id` valid, update parsial |
| [`jadwal.schema.test.ts`](src/__tests__/unit/core-logic/validations/jadwal.schema.test.ts) | format tanggal ISO, rentang jam praktikum, `tanggal_selesai > tanggal_mulai` |
| [`nilai.schema.test.ts`](src/__tests__/unit/core-logic/validations/nilai.schema.test.ts) | rentang nilai 0–100 dan tipe komponen nilai valid |
| [`user.schema.test.ts`](src/__tests__/unit/core-logic/validations/user.schema.test.ts) | format NIM, format NIDN, validasi enum role |
| [`offline-data.schema.test.ts`](src/__tests__/unit/core-logic/validations/offline-data.schema.test.ts) | struktur data antrian offline dan tipe operasi `create/update/delete` |
| [`mata-kuliah.schema.test.ts`](src/__tests__/unit/core-logic/validations/mata-kuliah.schema.test.ts) | kode mata kuliah, jumlah SKS 1–6, nama tidak boleh kosong |
| [`validations.test.ts`](src/__tests__/unit/core-logic/validations/validations.test.ts) | fungsi validasi utilitas umum |

Kelompok ini menunjukkan bahwa validasi tidak hanya diperiksa pada level antarmuka, tetapi juga pada level schema inti. Dengan demikian, data yang tidak memenuhi syarat dapat ditolak secara deterministik sebelum diproses lebih lanjut oleh sistem.

### F. Supabase — 5 File, 103 Test Case

Lapisan wrapper Supabase diuji untuk memastikan fungsi autentikasi, query database, dan penyimpanan file bekerja sesuai kontrak. File test yang termasuk dalam kelompok ini adalah [`auth.test.ts`](src/__tests__/unit/core-logic/supabase/auth.test.ts), [`client.test.ts`](src/__tests__/unit/core-logic/supabase/client.test.ts), [`database.test.ts`](src/__tests__/unit/core-logic/supabase/database.test.ts), [`storage.test.ts`](src/__tests__/unit/core-logic/supabase/storage.test.ts), dan [`warmup.test.ts`](src/__tests__/unit/core-logic/supabase/warmup.test.ts).

### G. Config & Context — 11 File, 170 Test Case

Konfigurasi rute aplikasi, konfigurasi cache, konfigurasi offline, konfigurasi navigasi, dan React Context diuji untuk memastikan nilai default dan logika kondisional berjalan dengan benar. Berdasarkan struktur test yang tersedia, kelompok ini mencakup file konfigurasi seperti [`app.config.test.ts`](src/__tests__/unit/core-logic/config/app.config.test.ts), [`cache.config.test.ts`](src/__tests__/unit/core-logic/config/cache.config.test.ts), [`navigation.config.test.ts`](src/__tests__/unit/core-logic/config/navigation.config.test.ts), [`offline.config.test.ts`](src/__tests__/unit/core-logic/config/offline.config.test.ts), [`routes.config.test.ts`](src/__tests__/unit/core-logic/config/routes.config.test.ts), serta pengujian context seperti [`AuthContext.test.ts`](src/__tests__/unit/core-logic/context/AuthContext.test.ts), [`NotificationContext.test.ts`](src/__tests__/unit/core-logic/context/NotificationContext.test.ts), dan [`ThemeContext.test.ts`](src/__tests__/unit/core-logic/context/ThemeContext.test.ts).

### H. Halaman (Pages) — 33 File, 169 Test Case

Pengujian halaman mencakup kelompok halaman utama yang aktif pada router aplikasi sesuai peran pengguna. Setiap halaman diuji terhadap empat aspek utama: (1) tampilan loading atau indikator awal saat data dimuat, (2) rendering judul atau heading utama halaman, (3) tampilan data yang dimuat dari API yang di-mock, dan (4) penanganan kondisi error atau data kosong (`empty state`).

### Tabel 4.x. Cakupan Halaman per Role Pengguna

| Role | Halaman yang Diuji |
|---|---|
| Mahasiswa | Dashboard, KuisListPage, KuisAttemptPage, KuisResultPage, MateriPage, NilaiPage, JadwalPage, PresensiPage, LogbookPage, ProfilePage, PengumumanPage, OfflineSyncPage |
| Dosen | Dashboard, MateriPage, PenilaianPage, KehadiranPage, JadwalPage, KuisListPage, KuisCreatePage, KuisBuilderPage, BankSoalPage, KuisResultsPage, AttemptDetailPage, LogbookReviewPage, PeminjamanPage, ProfilePage, PengumumanPage |
| Laboran | Dashboard, PeminjamanPage, ApprovalPage, JadwalPage, ProfilePage, PengumumanPage |
| Admin | Dashboard, UsersPage, KelasPage, MataKuliahPage, LaboratoriumPage, InventarisPage, LaporanPage, AnnouncementsPage, ProfilePage |
| Publik | HomePage, LoginPage, RegisterPage, ForgotPasswordPage, NotFoundPage, UnauthorizedPage, OfflinePage |

Kelompok halaman ini menunjukkan bahwa pengujian white box juga menjangkau lapisan presentasi yang berinteraksi langsung dengan pengguna, bukan hanya logika internal pada lapisan core.

### I. Komponen Fitur — 32 File, 227 Test Case

Komponen React yang mengimplementasikan logika bisnis utama diuji secara unit. Kelompok ini mencakup komponen pada fitur kuis, penilaian, kehadiran, logbook, bank soal, peminjaman, serta komponen pendukung sinkronisasi dan konflik data. Dengan pengujian pada level komponen fitur, sistem dapat diverifikasi hingga level perilaku UI yang memuat aturan bisnis.

### J. Komponen Bersama — 24 File, 294 Test Case

Komponen yang digunakan bersama di seluruh halaman aplikasi diuji secara unit.

### Tabel 4.x. Cakupan Komponen Bersama

| Subkelompok | Komponen yang Diuji |
|---|---|
| DataTable | komponen tabel bersama, toolbar, bulk action, empty state, pagination, dan pengaturan kolom |
| Calendar | komponen kalender dan event dialog |
| CrudModal | modal create/edit/delete dan dialog konfirmasi |
| Common | `PageHeader`, `EmptyState`, `ErrorBoundary`, `LoadingSpinner`, `NetworkStatus`, `OfflineIndicator` |
| Notification | `NotificationBell`, `NotificationDropdown` |

Kelompok ini penting karena komponen bersama digunakan berulang di banyak halaman. Kesalahan pada satu komponen bersama dapat berdampak luas ke berbagai bagian sistem, sehingga pengujian pada kelompok ini memiliki kontribusi signifikan terhadap kualitas antarmuka aplikasi.

### K. Provider — 6 File, 84 Test Case

Provider React yang membungkus seluruh aplikasi diuji untuk memastikan nilai context tersedia dan berubah dengan benar saat terjadi aksi. Kelompok ini mencakup `AuthProvider`, `NotificationProvider`, `OfflineProvider`, `SyncProvider`, `ThemeProvider`, serta wrapper provider aplikasi.

### L. Layout — 9 File, 30 Test Case

Komponen layout utama aplikasi juga diuji untuk memastikan struktur navigasi, sidebar, header, dan wrapper antarmuka berfungsi sesuai role dan kondisi aplikasi.

### M. Services & Lainnya — 4 File, 60 Test Case

Kelompok ini mencakup layanan pada layer presentasi dan helper yang dekat dengan antarmuka pengguna, seperti autentikasi berbasis Supabase, storage helper, dan service dasar yang mendukung perilaku halaman dan komponen.

### N. Integration Test — 8 File, 90 Test Case

Integration test menguji skenario lintas modul yang mencerminkan alur nyata penggunaan sistem oleh pengguna.

### Tabel 4.x. Daftar dan Cakupan Integration Test

| File Test | Skenario yang Diuji |
|---|---|
| [`auth-flow.test.tsx`](src/__tests__/integration/auth-flow.test.tsx) | login sukses/gagal dengan kredensial valid/tidak valid, registrasi mahasiswa dan dosen, penanganan error jaringan saat autentikasi |
| [`kuis-attempt-offline.test.tsx`](src/__tests__/integration/kuis-attempt-offline.test.tsx) | mulai kuis saat online, kehilangan koneksi di tengah pengerjaan, penyimpanan jawaban ke IndexedDB, sinkronisasi otomatis saat koneksi pulih |
| [`kuis-builder-autosave.test.tsx`](src/__tests__/integration/kuis-builder-autosave.test.tsx) | auto-save draft saat membangun kuis, konfirmasi data tersimpan, pemulihan draft setelah refresh halaman |
| [`offline-sync-flow.test.tsx`](src/__tests__/integration/offline-sync-flow.test.tsx) | simpan data ke IndexedDB saat offline, pembentukan antrian sinkronisasi, urutan pemrosesan antrian, eksekusi sync saat reconnect |
| [`conflict-resolution.test.tsx`](src/__tests__/integration/conflict-resolution.test.tsx) | deteksi konflik data ketika dua perangkat mengubah data yang sama dan resolusi konflik |
| [`middleware-rbac.test.ts`](src/__tests__/integration/middleware-rbac.test.ts) | dosen hanya dapat mengelola kuis miliknya sendiri, mahasiswa tidak dapat membuat kuis, validasi kepemilikan resource sebelum operasi |
| [`role-access.test.tsx`](src/__tests__/integration/role-access.test.tsx) | pembatasan akses rute berdasarkan role dan redirect otomatis saat akses tidak diizinkan |
| [`network-reconnect.test.tsx`](src/__tests__/integration/network-reconnect.test.tsx) | pemulihan koneksi internet, retry otomatis operasi gagal, dan eksekusi antrian saat reconnect |

### O. Legacy — 7 File, 11 Test Case

Selain test aktif utama, sistem masih mempertahankan sejumlah legacy test sebagai lapisan keamanan regresi tambahan. File-file tersebut dipisahkan dari struktur utama karena berasal dari fase pengembangan sebelumnya, tetapi tetap dijalankan bersama keseluruhan suite untuk memastikan perilaku dasar tertentu tidak mengalami regresi.

---

## 4.4.4 Hasil Eksekusi Pengujian

Pengujian dieksekusi secara keseluruhan menggunakan perintah [`npm run test`](package.json:16). Hasil eksekusi final adalah sebagai berikut.

### Tabel 4.x. Ringkasan Hasil Eksekusi Unit Test

| Metrik | Hasil |
|---|---|
| Total File Test | 238 |
| Total Test Case | 5.317 |
| Test Case Lulus (Pass) | 5.317 |
| Test Case Gagal (Fail) | 0 |
| Persentase Kelulusan | 100% |
| Durasi Eksekusi | 313,75 detik |

Seluruh **5.317 test case** pada **238 file test** berhasil dieksekusi dan memberikan hasil lulus (`pass`) tanpa ada satu pun kegagalan. Hasil ini memperlihatkan bahwa keseluruhan suite pengujian berada dalam kondisi stabil pada saat evaluasi akhir dilakukan.

### Potongan Output Penting

```text
Test Files  238 passed (238)
Tests       5317 passed (5317)
Duration    313.75s
```

---

## 4.4.5 Pembahasan

Hasil pengujian white box menunjukkan bahwa logika inti sistem telah diverifikasi secara komprehensif. Berikut pembahasan terhadap aspek-aspek penting dari hasil tersebut.

**Kelengkapan cakupan seluruh lapisan sistem.** Dengan **238 file test** yang mencakup **15 kelompok modul berbeda**, pengujian ini menjangkau seluruh lapisan arsitektur sistem, mulai dari API layer, hooks, mekanisme offline dan PWA, validasi input, wrapper Supabase, konfigurasi, hingga komponen antarmuka pengguna. Pendekatan ini menunjukkan bahwa pengujian tidak dilakukan secara parsial, melainkan dirancang untuk memverifikasi perilaku sistem secara menyeluruh pada berbagai tingkat abstraksi.

**Verifikasi fitur offline sebagai keunggulan utama sistem.** Kemampuan bekerja dalam kondisi tanpa internet merupakan salah satu fitur pembeda utama sistem ini dibanding sistem konvensional. Fitur tersebut diverifikasi melalui **15 file test** pada kelompok Offline & PWA (**738 test case**) serta **8 integration test** (**90 test case**) yang mensimulasikan skenario nyata, seperti kehilangan koneksi saat mahasiswa mengerjakan kuis, penyimpanan jawaban ke IndexedDB, pembentukan antrian sinkronisasi, dan pemulihan data ketika koneksi kembali tersedia. Hal ini memperkuat argumentasi bahwa sistem benar-benar dirancang untuk mendukung operasional pada kondisi jaringan yang tidak selalu stabil.

**Verifikasi kontrol akses berbasis peran (RBAC).** Sistem menerapkan kontrol akses yang ketat, di mana setiap pengguna hanya dapat mengakses sumber daya sesuai perannya. Aspek ini diverifikasi melalui integration test [`middleware-rbac.test.ts`](src/__tests__/integration/middleware-rbac.test.ts) dan [`role-access.test.tsx`](src/__tests__/integration/role-access.test.tsx). Hasil pengujian menunjukkan bahwa dosen hanya dapat mengelola kuis miliknya sendiri, mahasiswa tidak dapat membuat atau mengubah kuis, dan setiap peran diarahkan ke halaman yang sesuai ketika mencoba mengakses rute yang tidak diizinkan.

**Verifikasi validasi input yang konsisten.** Delapan file test pada kelompok validasi (**533 test case**) memastikan setiap formulir masukan dalam sistem menerapkan aturan validasi yang konsisten menggunakan Zod schema. Data yang tidak memenuhi syarat, seperti email tidak valid, password terlalu pendek, nilai di luar rentang 0–100, atau UUID tidak valid, dapat ditolak secara langsung sebelum dikirim ke server. Konsistensi validasi ini penting untuk menjaga integritas data di seluruh modul aplikasi.

**Konsistensi dan keandalan hasil akhir.** Keseluruhan **5.317 test case** lulus tanpa satu pun kegagalan pada eksekusi final. Kondisi ini menunjukkan bahwa fungsi-fungsi utama sistem bekerja sesuai spesifikasi yang telah ditetapkan, tidak terdapat regresi pada modul yang diuji, dan kualitas implementasi terjaga secara konsisten di seluruh lapisan sistem. Dengan tingkat kelulusan **100%**, pengujian white box ini dapat dijadikan dasar yang kuat untuk menyimpulkan bahwa unit-unit program serta integrasi utamanya telah tervalidasi dengan baik.

---

## 4.4.6 Unsur Tambahan yang Wajib Dibahas pada Bagian White Box

Agar subbab white box pada Bab 4 lebih kuat secara akademik, selain hasil kuantitatif jumlah file dan jumlah test, terdapat beberapa unsur yang sebaiknya ikut dibahas secara singkat.

### A. Tujuan Pengujian White Box
Jelaskan bahwa pengujian white box dilakukan untuk memverifikasi logika internal program, alur keputusan, penanganan error, validasi input, dan konsistensi perilaku modul pada berbagai kondisi uji.

### B. Dasar Pemilihan Unit yang Diuji
Jelaskan mengapa modul seperti API, hooks, offline/PWA, validasi, dan RBAC diprioritaskan. Pada penelitian ini, modul-modul tersebut merupakan bagian yang paling kritis karena berhubungan langsung dengan sinkronisasi data, autentikasi, hak akses, dan keandalan sistem saat offline.

### C. Strategi dan Teknik Pengujian
Jelaskan bahwa pengujian dilakukan menggunakan unit test dan integration test otomatis, dengan pendekatan mocking untuk dependensi eksternal. Bagian ini penting agar pembaca memahami bahwa pengujian benar-benar mengisolasi logika internal aplikasi.

### D. Skenario Uji yang Direpresentasikan
Cantumkan bahwa skenario uji meliputi kondisi normal, kondisi error, boundary value, data kosong, input tidak valid, konflik data, serta skenario offline–online recovery. Unsur ini penting agar pembahasan white box tidak hanya berisi angka, tetapi juga memperlihatkan kualitas desain pengujiannya.

### E. Hasil dan Interpretasi
Selain menampilkan angka pass/fail, jelaskan maknanya. Misalnya, angka kelulusan 100% menunjukkan bahwa implementasi saat evaluasi akhir berada dalam kondisi stabil dan tidak ditemukan kegagalan pada modul yang diuji.

### F. Keterbatasan Pengujian
Untuk naskah skripsi, sangat baik jika Anda menambahkan satu paragraf singkat bahwa hasil pengujian white box merepresentasikan modul yang telah dibuatkan test otomatis, sehingga interpretasi hasil tetap perlu dipahami dalam ruang lingkup cakupan test yang tersedia. Kalimat seperti ini akan membuat pembahasan Anda lebih ilmiah dan tidak terkesan overclaim.

### G. Keterkaitan dengan Tujuan Penelitian
Bagian white box akan lebih kuat jika dihubungkan langsung dengan tujuan penelitian. Pada sistem ini, hubungannya sangat jelas: pengujian white box membuktikan keandalan logika pembelajaran praktikum, mekanisme offline, sinkronisasi data, dan kontrol akses berbasis peran yang menjadi karakteristik utama aplikasi.

---

## Catatan Pembaruan Dokumen

Dokumen ini memperbarui laporan sebelumnya yang masih memakai angka run lama **131 file / 4.382 test case**. Data terbaru telah disesuaikan dengan hasil eksekusi aktual [`npm run test`](package.json:16) pada basis kode saat ini, yaitu **238 file test** dan **5.317 test case** dengan seluruh hasil **pass**.
