# Landasan Metodologis: Pendekatan PWA Offline pada Sistem Praktikum

Dokumen ini menguraikan landasan metodologis penelitian terkait implementasi *Progressive Web App* (PWA) Offline pada Sistem Praktikum. Fokus utama dari dokumen ini adalah memberikan pijakan rasional dan akademis mengapa arsitektur luring yang diterapkan beralur secara spesifik.

Sistem dikembangkan menggunakan pendekatan stabilisasi PWA bertahap. Penelitian ini menyusun panduan stabilisasi offline sebagai standar implementasi, kemudian menerapkannya secara prioritas pada jalur kritis seperti startup aplikasi, autentikasi offline, warm-cache route, local-first read pada halaman prioritas, dan sinkronisasi offline-critical.

## 1. Mengapa Pendekatannya Bertahap (Phased Approach)?
Sistem Praktikum memiliki aliran data yang memiliki kebergantungan relasional (relational dependencies) yang sangat erat di _database_ (misalnya keterikatan antara struktur Jadwal, Absensi/Kehadiran Praktikan, dan Peminjaman Alat). 
Mengubah seluruh arsitektur sistem menjadi offline murni (100%) dalam satu siklus pengembangan memiliki risiko tinggi merusak tatanan *business logic* yang sudah berjalan. Pendekatan bertahap (_phased implementation_) dipilih karena:
- Integritas data historis tetap terjaga dan perubahan transisi diproses aman.
- Masing-masing rute (halaman) prioritas dapat diverifikasi dan diuji regresi (_regression testing_) sebelum membongkar rute lainnya.
- Aplikasi tetap dapat di-_deploy_ ke ranah produksi tanpa waktu henti operasional sambil pelan-pelan beradaptasi dengan fitur offline-first.

## 2. Mengapa Tidak Memaksa Offline Total untuk Semua Fitur?
Penelitian menyadari bahwa **tidak semua fitur operasional aman** untuk diserahkan ke memori lokal tanpa validasi _real-time_ master ke server.
- **Konflik Sinkronisasi Lintas Aktor (Race Condition):** Jika seorang Dosen A dan Dosen B mengedit skor mahasiswa yang sama saat sedang luring, maka saat internet hidup secara bersamaan, database akan kesulitan menetapkan mana sumber kebenaran data dominan.
- **Integritas Konkurensi Kritis:** Operasi seperti *Approval Peminjaman Barang* oleh Laboran mengharuskan perhitungan jumlah stok absolut secara instan. Dua orang tidak boleh meminjam alat/sisa stok yang sama pada menit yang bersamaan saat offline.
Atas pertimbangan ini, _write flow_ (fitur penulisan / mutasi rumit) secara pragmatis ditahan pada metodologi `Online-First`.

## 3. Baseline Minimal yang Ditargetkan
Batas tolak ukur (_baseline_) kesuksesan stabilisasi penelitian PWA ini ditargetkan sebagai:
1. **Zero Blank Screen (_App Shell_ Mandiri):** Pengguna yang terputus internetnya saat masuk ke PWA tak akan dijebak pada layar _error network default browser_ atau putih polos, melainkan ditakar oleh mitigasi (Error Boundary).
2. **Kesiagaan Modul Dasar (Lazy Route Protection):** _Service Worker_ melacak alur putusnya file komponen sehingga aplikasi mampu membimbing interaksi ke rute aman.
3. **Pemuatan "Local-First Read" di Halaman Prioritas:** Layar monitor operasional (contoh: _Dashboard_, _Jadwal Praktikum_, _Daftar Materi_, _Daftar Kehadiran_) menyajikan *Snapshot Data Lokal* (_IndexedDB_) otomatis kepada pemakai yang menempuh login pertama kali saat online.

## 4. Batasan yang Masih Diakui
Untuk memperoleh stabilitas akademik yang kuat, batasan keterbatasan yang dipegang erat antara lain:
- **Keterbatasan Memori Lampiran:** Unduhan statis (PDF, DOCX materi, foto komplit) tidak bisa dipaksa masuk ke seluruh perangkat praktikan saat pertama dimuat. Hanya yang di-_tap_ di saat sinkron akan terbuka kembali tanpa sinyal.
- **Operasi Mutasi Berbayang:** Fitur hapus, rilis, tambah, atau ubah drastis disekat interaksinya (`Disabled State` / Terkunci) sementara saat _network offline_.
- **Memori Kehampaan Logis:** Apabila _user_ bergegas membuka sub-menu spesifik yang **belum pernah disinggahi** saat kondisi internet ada, perangkat jelas tak bisa menyulap memori kosong berisi muatan. Diakui adanya layar *graceful handling* "Akses ini membutuhkan internet."

---
_Referensi Silang Integrasi Akademik:_
_• Rujukan SOP stabilisasi / target pedoman sistem ada pada dokumen **`docs/PWA_STABILIZATION_GUIDE.md`**._
_• Bukti apa saja yang sudah mendarat komplit di _source code_ terdokumentasi rapi di **`docs/PWA_OFFLINE_PROGRESS_STAGE3.md`**._
