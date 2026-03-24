# Rencana Arsitektur Offline Penuh Sistem Praktikum PWA

## Tujuan Utama

Target akhir bukan hanya aplikasi bisa dibuka saat offline, tetapi:
- semua halaman semua role dapat dibuka dalam mode offline
- semua fitur minimal memiliki perilaku offline yang terdefinisi jelas
- fitur yang mendukung input/edit dapat menyimpan perubahan lokal lalu sinkron saat online kembali
- user selalu tahu status data: lokal, sinkron, konflik, atau butuh koneksi

## Kondisi Arsitektur Saat Ini

### Kekuatan yang sudah ada
- app shell PWA sudah lebih stabil untuk startup offline
- service worker sudah bisa mengembalikan index.html untuk navigasi offline
- auth startup offline sudah lebih baik
- sudah ada IndexedDB manager
- sudah ada queue manager dan sync manager
- sudah ada sebagian store offline untuk domain kuis

### Hambatan besar saat ini
1. route memakai lazy loading secara luas, sehingga halaman bisa gagal dibuka offline bila chunk belum pernah tercache
2. IndexedDB belum memodelkan semua domain fitur lintas role
3. sebagian besar halaman masih diasumsikan membaca langsung dari API online
4. sinkronisasi belum dirancang sebagai kontrak domain-by-domain untuk semua entitas
5. belum ada matriks resmi yang menetapkan setiap fitur masuk kategori:
   - shell-only offline
   - read-only offline
   - edit offline + sync
   - online-only sementara

## Prinsip Desain Arsitektur Offline Penuh

1. Offline first untuk read path
   - UI membaca dari local repository dulu
   - network hanya untuk refresh saat tersedia

2. Local write with sync later untuk write path
   - operasi create update delete disimpan ke local store
   - setiap operasi masuk antrean sinkronisasi
   - UI langsung mendapat optimistic result lokal

3. Route always open
   - semua halaman tetap dapat dibuka
   - jika data belum pernah tersedia lokal, halaman tetap tampil dengan state kosong terkontrol, bukan error atau blank

4. Feature contract per page
   - setiap halaman harus punya definisi offline behavior yang eksplisit

5. Conflict aware
   - data lokal dan server bisa berbeda
   - harus ada strategi merge atau resolusi konflik

## Target Arsitektur Besar

### Lapisan 1: App Shell dan Route Availability
Tujuan:
- semua halaman semua role dapat dibuka offline

Solusi arsitektur:
1. buat manifest route-chunk offline kritis
2. preload atau precache semua chunk halaman role-based
3. service worker memanaskan cache chunk halaman inti setelah login berdasarkan role user
4. fallback route tetap ke app shell bila chunk tidak ditemukan, tetapi target akhir adalah chunk tersedia lokal

Pendekatan implementasi:
- kelompokkan halaman berdasarkan role
- definisikan daftar import chunk wajib untuk admin, dosen, mahasiswa, laboran
- saat login sukses atau saat app idle online, lakukan background warmup import untuk semua halaman role aktif
- tahap lanjutan: warmup seluruh halaman lintas role jika target benar-benar semua role dalam satu instalasi

Konsekuensi:
- ukuran cache naik
- startup pertama online bisa lebih berat
- perlu strategi bertahap dan idle prefetch

### Lapisan 2: Offline Data Repository
Tujuan:
- setiap halaman punya sumber data lokal yang konsisten

Arsitektur yang diusulkan:
- buat repository per domain
- setiap repository punya API standar:
  - getLocalList
  - getLocalById
  - refreshFromRemote
  - saveLocalSnapshot
  - queueCreate
  - queueUpdate
  - queueDelete
  - getSyncStatus

Contoh domain utama:
- auth dan profile
- pengguna dan peran
- kelas dan mata kuliah
- materi
- jadwal
- presensi atau kehadiran
- logbook
- kuis dan attempt
- nilai
- pengumuman
- laboratorium
- inventaris
- peminjaman dan persetujuan
- laporan atau dashboard summary

Setiap domain harus punya object store lokal sendiri, bukan hanya sebagian seperti saat ini.

### Lapisan 3: Data Classification Matrix
Setiap fitur harus dikategorikan.

#### A. Full Offline Read Write Sync
Fitur cocok untuk input offline lalu sinkron:
- logbook mahasiswa
- presensi jika model bisnis mengizinkan checkin offline bertanda timestamp lokal
- jawaban kuis selama attempt diizinkan offline
- draft materi atau draft pengumuman jika dosen atau admin diizinkan bekerja offline
- peminjaman draft atau persetujuan draft jika bisnis mengizinkan workflow tertunda

#### B. Read Only Offline
Halaman tetap terbuka dan menampilkan snapshot lokal terakhir:
- dashboard semua role
- jadwal
- materi
- nilai
- profile
- daftar pengumuman
- daftar laboratorium
- daftar inventaris
- laporan yang hanya bersifat baca

#### C. Shell Only Offline
Halaman tetap bisa dibuka tetapi menampilkan pemberitahuan bahwa data belum pernah diunduh atau fitur belum mendukung operasi offline penuh.
Ini hanya status sementara dalam fase transisi implementasi.

#### D. Online Only Sementara
Hanya dipakai selama masa migrasi jika ada proses bisnis yang sangat riskan bila offline, misalnya operasi yang harus tervalidasi server secara real time.
Target jangka akhir adalah meminimalkan kategori ini.

## Pemetaan Awal Per Role

### Admin
Kemungkinan halaman:
- dashboard
- users
- mata kuliah
- kelas
- kelas mata kuliah
- laboratorium
- equipments atau inventaris
- pengumuman
- peminjaman approval
- assignment management
- profile

Target offline:
- semua halaman dapat dibuka
- master data tetap dapat dilihat dari snapshot lokal
- perubahan master data memakai queue sinkronisasi
- approval workflow butuh aturan konflik paling ketat

### Dosen
Kemungkinan halaman:
- dashboard
- jadwal
- materi
- penilaian
- kuis list create edit results detail
- bank soal
- kehadiran
- pengumuman
- peminjaman
- logbook review
- profile

Target offline:
- semua halaman dapat dibuka
- bank soal, draft kuis, draft materi, draft pengumuman bisa disimpan lokal
- hasil akhir publish mungkin butuh validasi sinkronisasi saat online
- review data mahasiswa bergantung pada snapshot terakhir yang tersimpan

### Mahasiswa
Kemungkinan halaman:
- dashboard
- jadwal
- logbook
- kuis list attempt result
- materi
- nilai
- presensi
- pengumuman
- profile
- offline sync

Target offline:
- semua halaman dapat dibuka
- materi, jadwal, pengumuman, nilai menampilkan snapshot lokal
- logbook dan jawaban kuis bisa bekerja offline dengan sinkronisasi antrean
- presensi offline perlu keputusan bisnis apakah diizinkan penuh atau butuh tanda verifikasi tambahan

### Laboran
Kemungkinan halaman:
- dashboard
- inventaris
- persetujuan
- peminjaman aktif
- laboratorium
- jadwal approval
- laporan
- pengumuman
- profile

Target offline:
- semua halaman dapat dibuka
- inventaris dan laboratorium tampil dari snapshot lokal
- perubahan stok atau approval perlu desain konflik kuat
- laporan baca dari snapshot lokal terakhir

## Strategi Cache dan Chunk Semua Halaman

### Tahap target
1. semua chunk route masuk ke katalog offline
2. role-aware prefetch setelah login
3. global idle prefetch untuk halaman yang belum dimiliki cache
4. service worker menyimpan hasil chunk fetch ke cache khusus route assets

### Opsi desain
#### Opsi A: Precache semua chunk hasil build
Kelebihan:
- semua halaman pasti bisa dibuka offline
Kekurangan:
- ukuran cache instalasi besar
- update lebih berat

#### Opsi B: Hybrid precache + role prefetch
Kelebihan:
- lebih efisien
- user aktif mendapat halaman role-nya offline penuh
Kekurangan:
- bila target absolut adalah semua role di satu perangkat, perlu warmup tambahan

Rekomendasi:
- gunakan hybrid
- precache app shell dan halaman publik wajib
- role-prefetch setelah login
- optional admin tool untuk warmup semua halaman semua role pada device uji atau perangkat institusi

## Model Data Offline yang Diusulkan

### Struktur store minimum per domain
Setiap store menyimpan:
- id
- payload utama
- syncedAt
- updatedAtLocal
- updatedAtRemote
- syncStatus
- dirtyFields opsional
- deletedLocally boolean jika soft delete queue
- version atau etag jika tersedia

### Store tambahan lintas domain
- sync_queue
- sync_conflicts
- sync_failures
- offline_metadata
- offline_capabilities
- route_chunk_registry
- per_role_snapshot_state

### Snapshot strategy
Untuk list besar gunakan:
- entity store untuk item tunggal
- query snapshot store untuk hasil list atau dashboard aggregate

Contoh:
- dashboard_admin_snapshot
- dashboard_dosen_snapshot
- dashboard_mahasiswa_snapshot
- dashboard_laboran_snapshot

## Kontrak Sinkronisasi

### Jenis operasi
- create_local
- update_local
- delete_local
- refresh_pull
- reconcile_conflict
- retry_failed

### Alur sinkronisasi standar
1. user melakukan perubahan
2. perubahan disimpan ke local store
3. item masuk sync_queue
4. UI menandai status pending sync
5. saat online kembali, sync manager memproses queue
6. bila sukses, store lokal diperbarui dengan canonical server state
7. bila gagal, item masuk failed atau conflict
8. UI menampilkan resolusi atau retry

### Jenis konflik yang harus didukung
- update update conflict
- delete update conflict
- stale reference conflict
- approval state conflict
- inventory stock conflict
- schedule overlap conflict

### Strategi resolusi konflik
- last write wins hanya untuk data non-kritis
- merge field-level untuk draft text seperti materi atau pengumuman
- manual resolution untuk approval, stok inventaris, presensi, dan penilaian final

## Kontrak UI Offline

Setiap halaman wajib punya 4 state:
1. local-ready
2. local-empty-never-synced
3. pending-sync
4. conflict-or-failed-sync

Komponen UI umum yang perlu nanti dibuat:
- offline data badge
- sync status badge
- unsynced changes banner
- conflict resolver panel
- never downloaded placeholder
- offline action queue viewer

## Strategi Per Halaman

### Halaman baca murni
- selalu buka dari local snapshot
- refresh diam-diam saat online
- tampilkan waktu sinkron terakhir

### Halaman form atau edit
- submit ke local first
- tampilkan status pending sync
- izinkan edit ulang item yang belum sinkron

### Halaman approval atau transaksi sensitif
- tetap bisa dibuka offline
- boleh membuat decision draft offline jika bisnis setuju
- keputusan final disinkronkan saat online dan diverifikasi konflik

### Halaman laporan dan dashboard
- gunakan snapshot summary lokal
- tampilkan label bahwa angka adalah data sinkron terakhir

## Tahap Implementasi yang Direkomendasikan

### Prinsip rollout aman
- setiap fase harus bisa dirilis tanpa mematikan fitur online yang sudah jalan
- perubahan dilakukan dengan mode additive dulu, bukan rewrite total
- setiap lapisan baru diberi fallback ke alur lama bila terjadi error
- setiap domain diaktifkan bertahap memakai feature flag atau offline capability flag
- setiap fase wajib lulus verifikasi build, type-check, dan uji skenario online maupun offline

### Fase 1: Fondasi route offline penuh
Tujuan:
- semua halaman dapat dibuka offline tanpa blank screen

Ruang lingkup aman:
- inventaris semua route semua role
- buat registry chunk per route
- implement role-aware prefetch
- jangan ubah logic bisnis halaman dulu
- fokus hanya pada availability halaman

Proteksi agar tidak merusak code berjalan:
- fallback ke lazy import normal bila prefetch gagal
- jangan hapus lazy loading lama, hanya tambahkan warm-cache layer
- simpan cache route di namespace terpisah agar mudah rollback

Risiko error:
- chunk gagal diprefetch
- cache membengkak
- update service worker memuat aset lama dan baru bersamaan

Mitigasi:
- batasi prefetch bertahap berbasis role aktif
- gunakan cache versioning ketat
- sediakan kill switch untuk mematikan route prefetch bila bermasalah

### Fase 2: Fondasi repository offline lintas domain
Tujuan:
- read path bisa memakai data lokal tanpa merusak API lama

Ruang lingkup aman:
- buat kontrak repository generik
- perluas IndexedDB schema untuk semua domain utama
- migrasikan read path ke pola local-first plus remote-refresh
- adapter API lama tetap dipertahankan

Proteksi agar tidak merusak code berjalan:
- repository baru berada di lapisan tambahan di atas API existing
- bila local read gagal, otomatis fallback ke API lama saat online
- migrasi schema IndexedDB dilakukan versioned dan reversible sejauh mungkin

Risiko error:
- migrasi IndexedDB gagal
- bentuk data lokal tidak cocok dengan UI lama
- data lama belum ada snapshot lokal

Mitigasi:
- tambah store baru tanpa menghapus store lama di awal
- buat mapper DTO lokal ke view model yang kompatibel
- halaman wajib punya state local-empty-never-synced

### Fase 3: Offline read coverage semua halaman
Tujuan:
- semua halaman semua role bisa tampil dengan snapshot lokal terakhir

Ruang lingkup aman:
- dashboard semua role
- jadwal, materi, nilai, pengumuman, profile
- inventaris, laboratorium, laporan, users, kelas
- belum menyentuh write sensitif

Proteksi agar tidak merusak code berjalan:
- mode offline read diaktifkan per halaman, bukan sekaligus
- jika query snapshot gagal, UI kembali ke online-fetch saat koneksi tersedia
- tambahkan badge sumber data agar user tahu data berasal dari cache lokal

Risiko error:
- dashboard aggregate tidak sinkron dengan entity store
- tampilan data basi dianggap bug
- beberapa halaman masih diam-diam hardcoded ke API online

Mitigasi:
- pisahkan snapshot dashboard dari entity source
- tampilkan waktu sync terakhir
- audit semua hook fetch per halaman sebelum aktivasi offline read

### Fase 4: Offline write coverage prioritas tinggi
Tujuan:
- fitur input prioritas dapat tetap dipakai offline dan disinkron belakangan

Ruang lingkup aman:
- logbook
- kuis attempt dan jawaban
- draft materi
- draft pengumuman
- perubahan master data yang aman

Proteksi agar tidak merusak code berjalan:
- submit disimpan lokal dulu lalu antre sinkronisasi
- endpoint online lama tetap dipakai saat koneksi stabil
- optimistic update hanya aktif pada domain yang sudah lolos uji antrean

Risiko error:
- duplicate submit
- urutan sinkronisasi salah
- user melihat data lokal tetapi server menolak saat online

Mitigasi:
- gunakan id lokal stabil dan idempotency key
- queue FIFO per domain sensitif
- tampilkan status pending sync, failed, dan retry secara eksplisit

### Fase 5: Offline workflow sensitif
Tujuan:
- workflow bisnis kritis mendukung offline tanpa merusak integritas data

Ruang lingkup aman:
- approval
- stok inventaris
- presensi
- penilaian final
- assignment management

Proteksi agar tidak merusak code berjalan:
- awalnya implement sebagai draft offline, bukan final commit offline
- keputusan final diproses saat online dengan validasi konflik
- fitur sensitif tidak boleh langsung memakai last write wins

Risiko error:
- konflik approval
- stok negatif atau ganda
- presensi dobel
- penilaian final tertimpa data lama

Mitigasi:
- tambahkan conflict store terpisah
- gunakan server reconciliation saat online kembali
- butuh manual resolution UI untuk kasus kritis

### Fase 6: Konflik dan observability
Tujuan:
- sistem bisa didiagnosis cepat bila ada error setelah rollout

Ruang lingkup aman:
- conflict store
- retry policy
- audit sync logs
- halaman admin untuk kesehatan sinkronisasi
- metrik local queue, failed sync, dan last successful sync

Proteksi agar tidak merusak code berjalan:
- observability bersifat tambahan, tidak mengubah alur bisnis existing
- log disimpan terpisah dari data domain utama

Risiko error:
- error sinkronisasi sulit dilacak
- user tidak tahu kenapa data tidak muncul sama antara offline dan online

Mitigasi:
- buat audit trail per item queue
- tampilkan alasan gagal yang bisa dipahami user
- sediakan tombol retry domain-specific dan safe reset cache

## Strategi Anti-Rusak Saat Implementasi

### Aturan perubahan kode
1. jangan refactor besar banyak domain sekaligus
2. jangan ganti semua fetch menjadi offline-first dalam satu tahap
3. pertahankan adapter ke API lama sampai repository baru stabil
4. semua perubahan bersifat additive dulu
5. rollback harus bisa dilakukan per fase, bukan menunggu seluruh proyek selesai

### Guardrail teknis
- feature flag per role atau per domain
- cache versioning per fase
- schema versioning IndexedDB
- fallback ke online path saat local layer error dan koneksi tersedia
- fallback ke read-only mode saat write queue domain belum stabil

### Skenario error yang wajib dipertimbangkan
- service worker update race condition
- IndexedDB blocked upgrade
- snapshot lokal korup atau tidak lengkap
- queue macet karena satu item gagal terus
- conflict data sensitif saat reconnect
- user logout lalu login role berbeda dengan cache lama masih ada
- route chunk berubah hash setelah deploy tetapi cache lama belum bersih

### Respons aman jika error terjadi
- matikan feature flag domain terkait
- pakai cache reset hanya pada namespace domain bermasalah
- biarkan halaman tetap terbuka dalam mode read-only lokal
- kembalikan submit ke online-only untuk domain yang belum stabil
- tampilkan pesan status sinkronisasi, bukan generic error

## Kriteria Sukses Verifikasi

### Kriteria minimum
- semua route semua role terbuka offline tanpa blank screen
- app tetap bisa start dari icon install saat offline
- user tetap bisa login dari session lokal yang valid

### Kriteria menengah
- halaman baca utama menampilkan data snapshot lokal terakhir
- halaman yang belum pernah tersinkron menampilkan state kosong yang terkontrol

### Kriteria tinggi
- create update delete pada fitur yang didukung tetap bisa dilakukan offline
- semua perubahan masuk antrean dan sinkron saat online
- konflik dapat dideteksi dan diselesaikan

### Kriteria final
- semua role dapat memakai aplikasi secara bermakna saat offline
- online hanya menjadi media sinkronisasi dan refresh, bukan syarat agar halaman bisa dipakai

## Rekomendasi Arsitektur Final

Saya merekomendasikan target arsitektur berikut:
- App shell offline penuh
- Semua route chunk tersedia offline melalui hybrid role-prefetch plus optional global warm cache
- Semua domain punya local repository dan IndexedDB store sendiri
- Semua halaman minimal read-only offline
- Fitur input prioritas memakai local write plus queued sync
- Fitur sensitif memakai conflict-aware sync contract
- Semua halaman punya UI status offline yang eksplisit

## Risiko dan Trade-off

1. ukuran cache dan IndexedDB akan meningkat
2. kompleksitas sinkronisasi bertambah signifikan
3. beberapa fitur sensitif tidak boleh memakai last write wins sederhana
4. implementasi harus dilakukan bertahap agar tidak merusak logic bisnis existing
5. perlu uji nyata lintas role, bukan hanya build test

## Keputusan Desain yang Perlu Disetujui Sebelum Implementasi Besar

1. apakah target benar-benar semua halaman semua role wajib bisa dibuka offline pada satu perangkat
2. apakah semua fitur edit boleh dilakukan offline, atau ada subset sensitif yang hanya draft offline
3. apakah perangkat institusi boleh menyimpan cache besar untuk semua role
4. bagaimana aturan bisnis untuk presensi, approval, stok inventaris, dan penilaian saat offline
5. apakah konflik akan diselesaikan manual untuk fitur sensitif

## Kesimpulan

Agar aplikasi benar-benar dianggap berhasil sebagai PWA offline penuh, arsitekturnya harus berubah dari:
- PWA startup offline
menjadi:
- full offline-capable product per role, per halaman, per domain

Artinya fokus implementasi berikutnya bukan hanya service worker, tetapi kombinasi:
- ketersediaan route chunk
- repository local-first
- store IndexedDB lintas domain
- queue dan conflict engine
- status UI offline per halaman
- verifikasi nyata per role
