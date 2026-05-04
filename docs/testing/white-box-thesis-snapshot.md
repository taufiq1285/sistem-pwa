# White Box Thesis Snapshot

Dokumen ini mengunci angka white box yang dipakai pada naskah skripsi agar tidak berubah ketika repo terus berkembang.

## Status Snapshot

- Status: final untuk pelaporan skripsi
- Basis pelaporan: snapshot eksekusi terakhir pengujian white box
- Angka resmi skripsi: 241 file test
- Angka resmi skripsi: 5231 test case
- Hasil resmi skripsi: 5231 passed, 0 failed

## Aturan Penggunaan

- Narasi skripsi harus merujuk ke snapshot ini, bukan ke total test aktif repo saat ini.
- Test baru setelah snapshot tetap boleh ditambahkan untuk regresi internal dan pengembangan harian.
- Penambahan, pemindahan, atau penghapusan test setelah snapshot tidak otomatis mengubah angka skripsi.
- Perubahan angka skripsi hanya boleh dilakukan jika dibuat snapshot skripsi baru secara sadar dan seluruh narasi dokumen diperbarui kembali.

## Ruang Lingkup

- Snapshot ini mencakup test file `*.test.ts` dan `*.test.tsx` di bawah `src/__tests__`.
- Daftar file yang dihitung disimpan di [white-box-thesis-manifest.md](/f:/sistem-praktikum/sistem-praktikum-pwa/docs/testing/white-box-thesis-manifest.md).

## Catatan

- Snapshot ini memisahkan kebutuhan pelaporan akademik dari kebutuhan regresi pengembangan.
- Dengan pemisahan ini, repo tetap boleh bertambah tanpa membuat angka white box pada skripsi berubah-ubah.
