# CHECKLIST PERSIAPAN PRESENTASI SIDANG SKRIPSI

## Persiapan 1 Minggu Sebelum Sidang

### Dokumen:
- [ ] Slide presentasi (PowerPoint/Google Slides/Canva) - 20 slide
- [ ] Naskah/speaker notes untuk setiap slide
- [ ] Handout ringkasan (opsional, 1-2 halaman)

### Visual:
- [ ] Screenshot dashboard (Admin, Dosen, Mahasiswa, Laboran)
- [ ] Screenshot fitur utama (Kuis, Jadwal, Logbook, Peminjaman)
- [ ] Screenshot offline mode demo
- [ ] Diagram DFD Level 1
- [ ] Diagram ERD Overview
- [ ] Arsitektur PWA diagram
- [ ] Chart hasil pengujian (Black Box, White Box, SUS)
- [ ] Pie chart distribusi responden

### File Kode:
- [ ] Service Worker ([src/sw.ts](src/sw.ts))
- [ ] IndexedDB ([src/lib/offline/indexeddb.ts](src/lib/offline/indexeddb.ts))
- [ ] RBAC Routing ([src/routes/index.tsx](src/routes/index.tsx))
- [ ] Auth Types ([src/types/auth.types.ts](src/types/auth.types.ts))
- [ ] Test Setup ([src/__tests__/setup.ts](src/__tests__/setup.ts))
- [ ] Coverage Config ([vitest.config.ts](vitest.config.ts))

---

## Persiapan 3 Hari Sebelum Sidang

### Latihan Presentasi:
- [ ] Latihan presentasi minimal 3x dengan timer
- [ ] Pastikan waktu sesuai (48-62 menit)
- [ ] Latihan Q&A untuk setiap slide
- [ ] Latihan demo kode (bisa buka file dengan cepat)

### Teknis:
- [ ] Backup slide ke flash drive
- [ ] Upload slide ke Google Drive
- [ ] Kirim slide ke moderator/reviewer
- [ ] Test proyektor/layar
- [ ] Siapkan laptop sebagai backup

### Checklist Demo:
- [ ] Buka aplikasi di localhost
- [ ] Test login dengan setiap role
- [ ] Test offline mode (matikan WiFi)
- [ ] Test install PWA
- [ ] Pastikan semua screenshot sudah siap

---

## Persiapan 1 Hari Sebelum Sidang

### Fisik:
- [ ] Baju rapi (kemeja dan celana resmi)
- [ ]ID card mahasiswa
- [ ] Flash drive dengan backup
- [ ] Laptop + charger
- [ ] Mouse (opsional)

### Dokumen:
- [ ] Print slide outline (1 copy)
- [ ] Print catatan penting (angka, fakta)
- [ ] Print naskah Q&A

### Mental:
- [ ] Tidur cukup (7-8 jam)
- [ ] Sarapan sebelum presentasi
- [ ] Datang 30 menit lebih awal

---

## Checklist Hari Sidang

### Sebelum Dimulai:
- [ ] Check-in di lokasi
- [ ] Setup laptop ke proyektor
- [ ] Test audio (jika ada)
- [ ] Pastikan remote presentasi bekerja
- [ ] Matikan notifikasi laptop

### Saat Presentasi:

#### Slide 1-4 (7-9 menit): PENDAHULUAN
- [ ] Salam pembuka
- [ ] Perkenalan diri
- [ ] jelaskan judul dengan jelas
- [ ] jelaskan latar belakang masalah
- [ ] sampaikan rumusan masalah
- [ ] sampaikan tujuan penelitian
- [ ] sebutkan batasan dan manfaat

#### Slide 5-9 (11-14 menit): TINJAUAN PUSTAKA
- [ ] jelaskan kajian pustaka dengan singkat
- [ ] sampaikan perbedaan dari penelitian terdahulu
- [ ] jelaskan teknologi PWA (Service Worker, IndexedDB, Manifest)
- [ ] jelaskan RBAC (4 role, permission matrix)
- [ ] jelaskan metode R&D (Ellis & Levy)

#### Slide 10-13 (10-13 menit): METODOLOGI
- [ ] jelaskan alur penelitian (6 tahap)
- [ ] sampaikan objek dan sampel (46 responden)
- [ ] tampilkan DFD Level 1
- [ ] tampilkan ERD

#### Slide 14-17 (13-17 menit): IMPLEMENTASI & HASIL
- [ ] tampilkan screenshot dashboard
- [ ] jelaskan fitur PWA (offline, install, sync)
- [ ] sampaikan hasil Black Box (45 skenario, 100% pass)
- [ ] sampaikan hasil White Box (241 file, 5.231 test cases, 100% pass)
- [ ] **MOMEN "PAMER":** Highlight jumlah test case yang tinggi

#### Slide 18-20 (7-9 menit): EVALUASI & PENUTUP
- [ ] sampaikan skor SUS (75,11, Grade B, Good)
- [ ] sampaikan kesimpulan (4 poin utama)
- [ ] sampaikan saran pengembangan
- [ ] ucapkan terima kasih

### Saat Q&A:
- [ ] Dengarkan pertanyaan dengan baik
- [ ] Jawab dengan tenang dan percaya diri
- [ ] Jika tidak tahu, bilang "akan saya cari tahu dan jawab nanti"
- [ ] Referensi file kode jika perlu

---

## Angka Penting yang Perlu Dihafal

### Statistik Project:
| Metric | Value |
|--------|-------|
| Test Files | 241 |
| Test Cases | 5.231 |
| Black Box Skenario | 45 |
| Test Pass Rate | 100% |
| SUS Score | 75,11 |
| Grade | B (Good) |
| Respondents | 46 |

### Implementasi:
| Feature | Detail |
|---------|--------|
| IndexedDB Stores | 14 |
| User Roles | 4 (Admin, Dosen, Mahasiswa, Laboran) |
| Caching Strategies | 3 (Cache First, Network First, SWR) |
| Database Tables | 24+ |
| PWA Icons | 8 sizes (48-512px) |

### Teknis:
| Komponen | File |
|----------|------|
| Service Worker | src/sw.ts |
| IndexedDB | src/lib/offline/indexeddb.ts |
| RBAC Routes | src/routes/index.tsx |
| Auth Types | src/types/auth.types.ts |
| Database Schema | src/lib/supabase/database.types.ts |

---

## Tips Presentasi

### Yang Harus Dilakukan:
1. **Bicara jelas dan tidak terburu-buru**
2. **Maintain kontak mata dengan penguji**
3. **Gunakan pointer laser/kursor saat menunjukkan slide**
4. **referensi kode secara langsung (buka file di VS Code)**
5. **Tunjukkan percaya diri tapi tidak sombong**
6. **"Slamat" saat tidak tahu jawaban, daripada berbohong

### Yang Tidak Boleh Dilakukan:
1. **Membaca slide secara verbatim**
2. **Menghafal teks slide**
3. **Mengatakan "saya akan lewatkan slide ini"**
4. **Terlalu cepat atau terlalu lambat**
5. **Menatap layar, bukan audience**

### Cara Memamerkan dengan Halus:
1. **"Jumlah test case 5.231 sangat tinggi untuk skripsi informatika..."**
2. **"Ini menunjukkan ketelitian kami dalam membangun sistem yang stabil"**
3. **"Coverage fungsi dan branch mencapai 80-90%"**
4. **"100% test pass, tidak ada satu pun yang gagal"**
5. **"Offline-first architecture memungkinkan akses tanpa internet..."**

---

## Kontak Darurat

- Nomor moderator/reviewer
- Nomor sekretariat jika ada masalah teknis
- Nomor teman yang bisa bantu jika ada masalah

---

## Catatan Tambahan

[Isi dengan catatan personal, misalnya:]
- Pertanyaan yang mungkin ditanyakan penguji
- Jawaban untuk pertanyaan yang mungkin muncul
- Hal-hal yang perlu dihindari
- نقاط penting yang perlu diulang

---

## Form untuk Evaluasi Diri (Setelah Sidang)

### Kekuatan:
- [ ] ...
- [ ] ...
- [ ] ...

### Kelemahan:
- [ ] ...
- [ ] ...
- [ ] ...

### Perbaikan untuk Masa Depan:
- [ ] ...
- [ ] ...
- [ ] ...
