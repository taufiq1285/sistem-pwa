# Mapping Perubahan PPT Sempro ke PPT Ujian Hasil

Dokumen ini memetakan perubahan dari presentasi seminar proposal pada [`docs/ppt sempro Teknik Informatika.pptx`](docs/ppt%20sempro%20Teknik%20Informatika.pptx) ke susunan presentasi ujian hasil pada [`docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md).

Tujuannya agar proses penyusunan ulang lebih mudah: Anda dapat mengetahui slide mana yang **dipertahankan**, **diganti isi**, **diringkas**, atau **tidak dipakai lagi**.

---

## Prinsip Mapping

- **Dipertahankan** berarti struktur slide lama masih relevan.
- **Diganti isi** berarti layout atau posisi slide masih bisa dipakai, tetapi isi harus diperbarui total.
- **Digabung** berarti beberapa slide lama diringkas menjadi satu slide ujian hasil.
- **Dihapus / tidak dipakai** berarti slide tersebut khas seminar proposal dan tidak perlu menjadi bagian utama ujian hasil.

---

## Ringkasan Strategi

Strategi terbaik adalah:
- mempertahankan alur dasar dari PPT sempro,
- menghapus bagian yang hanya relevan untuk proposal,
- memperkuat bagian hasil implementasi, pengujian, pembahasan, kesimpulan, dan saran,
- lalu menyesuaikan tampilan dengan template visual yang paling rapi.

---

## Mapping Slide per Slide

## 1. Slide pembuka sempro
**Acuan lama:** [`ppt/slides/slide2.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Isi lama:**
- Judul penelitian
- Nama, NIM
- Pembimbing
- Penguji
- Penanda BAB 1

**Keputusan:**
**Dipertahankan dengan revisi ringan**

**Menjadi:**
[`Slide 1`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Judul Penelitian

**Yang diubah:**
- Tambahkan label **Ujian Hasil Skripsi**
- Rapikan identitas
- Fokuskan sebagai slide pembuka resmi

---

## 2. Slide agenda presentasi
**Acuan lama:** [`ppt/slides/slide3.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Isi lama:**
- Agenda presentasi
- Daftar bagian proposal: pendahuluan, rumusan masalah, tinjauan pustaka, metodologi, desain sistem, jadwal, hasil yang diharapkan, tanya jawab

**Keputusan:**
**Tidak dipakai sebagai slide utama**

**Alasan:**
Pada ujian hasil, agenda panjang biasanya tidak perlu ditampilkan sebagai slide tersendiri karena memakan waktu.

**Penggantian fungsi:**
Alur presentasi langsung dibawa melalui urutan slide baru pada [`docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md).

---

## 3. Slide BAB I – Pendahuluan
**Acuan lama:** [`ppt/slides/slide4.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan sebagai pembuka BAB I, tetapi isi diringkas**

**Menjadi:**
- [`Slide 2`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Latar Belakang
- [`Slide 3`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Rumusan Masalah
- [`Slide 4`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Tujuan Penelitian

**Catatan:**
Bagian pendahuluan tetap penting, tetapi harus dibuat singkat agar presentasi lebih fokus ke hasil.

---

## 4. Slide latar belakang sempro
**Acuan lama:** [`ppt/slides/slide5.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan dengan revisi isi**

**Menjadi:**
[`Slide 2`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Latar Belakang

**Yang diubah:**
- Hilangkan deskripsi terlalu panjang
- Gunakan poin yang lebih padat
- Pertahankan masalah inti: pengelolaan manual, informasi tidak terintegrasi, kebutuhan digitalisasi

---

## 5. Slide solusi PWA dan urgensi
**Acuan lama:** [`ppt/slides/slide6.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Digabung dan diubah fungsi**

**Menjadi:**
- [`Slide 2`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Latar Belakang
- [`Slide 13`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Dukungan PWA dan Akses Fleksibel

**Catatan:**
Pada sempro, slide ini berfungsi menjelaskan alasan memilih PWA.
Pada ujian hasil, alasannya tidak lagi menjadi fokus utama; yang lebih penting adalah menunjukkan **bagaimana PWA benar-benar diimplementasikan**.

---

## 6. Slide rumusan masalah dan tujuan
**Acuan lama:** [`ppt/slides/slide7.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipecah menjadi dua slide yang lebih bersih**

**Menjadi:**
- [`Slide 3`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Rumusan Masalah
- [`Slide 4`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Tujuan Penelitian

**Yang diubah:**
- Pisahkan rumusan masalah dan tujuan agar lebih mudah dipresentasikan.
- Hilangkan placeholder yang tidak diperlukan.

---

## 7. Slide tujuan penelitian
**Acuan lama:** [`ppt/slides/slide8.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan dengan penyesuaian narasi**

**Menjadi:**
[`Slide 4`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Tujuan Penelitian

**Yang diubah:**
- Ubah gaya bahasa dari target proposal menjadi tujuan yang telah dicapai.
- Ringkas poin supaya tidak terlalu padat.

---

## 8. Slide manfaat / hasil yang diharapkan / ruang lingkup
**Acuan lama:** tersebar pada slide tengah sempro

**Keputusan:**
**Diringkas dan dipilih yang masih relevan**

**Menjadi:**
- [`Slide 5`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Batasan Masalah
- jika diperlukan secara lisan, manfaat cukup disampaikan singkat tanpa slide tambahan

**Catatan:**
Untuk ujian hasil, manfaat biasanya tidak perlu terlalu panjang. Yang lebih penting adalah capaian implementasi dan hasil pengujian.

---

## 9. Slide BAB II – Tinjauan Pustaka
**Acuan lama:** [`ppt/slides/slide25.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Tidak dijadikan slide utama ujian hasil**

**Alasan:**
Pada ujian hasil, tinjauan pustaka biasanya tidak perlu dipresentasikan panjang. Jika ditanya penguji, cukup dijelaskan secara lisan.

**Penggantian fungsi:**
Tidak dibuat slide tersendiri dalam susunan baru.

---

## 10. Slide metodologi penelitian
**Acuan lama:** beberapa slide metodologi dan teknik pengumpulan data, termasuk [`ppt/slides/slide21.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan tetapi diringkas**

**Menjadi:**
[`Slide 6`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Metode Penelitian

**Yang diubah:**
- Jadikan hanya satu slide ringkas.
- Fokus pada pendekatan R&D, tahapan, dan evaluasi.
- Detail teknik pengumpulan data cukup disebutkan singkat jika perlu saat menjawab penguji.

---

## 11. Slide desain arsitektur sistem PWA
**Acuan lama:** [`ppt/slides/slide20.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan dengan pembaruan fungsi**

**Menjadi:**
[`Slide 7`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Teknologi dan Arsitektur Sistem

**Yang diubah:**
- Dari fokus rancangan menjadi jembatan ke hasil implementasi.
- Jelaskan teknologi final secara singkat dan aman.

---

## 12. Slide rancangan antarmuka pengguna
**Acuan lama:** [`ppt/slides/slide21.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Diubah menjadi gambaran umum sistem**

**Menjadi:**
[`Slide 8`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Gambaran Umum Sistem

**Yang diubah:**
- Jangan terlalu menekankan mockup/rancangan.
- Ubah menjadi penjelasan singkat tentang peran sistem dan pengguna.

---

## 13. Slide fitur / desain sistem
**Acuan lama:** tersebar di bagian desain sistem dan antarmuka

**Keputusan:**
**Dipertahankan sebagai daftar fitur hasil implementasi**

**Menjadi:**
[`Slide 9`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Fitur Utama Sistem

**Yang diubah:**
- Fokuskan pada fitur yang benar-benar ada.
- Hindari menyebut fitur yang masih lemah seolah sudah matang sepenuhnya.

---

## 14. Slide BAB IV – Hasil Penelitian
**Acuan lama:** [`ppt/slides/slide24.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan, tetapi isi diganti total**

**Menjadi:**
- [`Slide 10`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Hasil Implementasi Sistem
- [`Slide 11`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Hasil Implementasi Modul Akademik
- [`Slide 12`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Hasil Implementasi Modul Laboratorium
- [`Slide 13`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Dukungan PWA dan Akses Fleksibel

**Catatan:**
Ini adalah bagian yang paling penting untuk dibesarkan pada ujian hasil.

---

## 15. Slide hasil pengujian
**Acuan lama:** tidak muncul kuat sebagai bagian final pada sempro

**Keputusan:**
**Ditambahkan sebagai inti baru ujian hasil**

**Menjadi:**
- [`Slide 14`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Hasil Pengujian Fungsional
- [`Slide 15`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Hasil Pengujian Usability

**Alasan:**
Bagian ini belum menjadi inti saat sempro, tetapi wajib kuat saat ujian hasil.

---

## 16. Slide pembahasan hasil
**Acuan lama:** belum ada dalam bentuk final pada sempro

**Keputusan:**
**Ditambahkan baru**

**Menjadi:**
[`Slide 16`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Pembahasan Hasil

**Fungsi:**
Menjelaskan arti hasil implementasi dan pengujian.

---

## 17. Slide keterbatasan penelitian
**Acuan lama:** implisit di proposal, belum menjadi bagian utama

**Keputusan:**
**Ditambahkan baru**

**Menjadi:**
[`Slide 17`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Keterbatasan Penelitian

**Fungsi:**
Menjaga presentasi aman dari overclaim.

---

## 18. Slide kesimpulan awal dan hasil yang diharapkan
**Acuan lama:** [`ppt/slides/slide26.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Diganti total**

**Menjadi:**
[`Slide 18`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Kesimpulan

**Yang diubah:**
- Hapus istilah **kesimpulan awal** dan **hasil yang diharapkan**
- Ganti menjadi **kesimpulan akhir berdasarkan hasil implementasi dan pengujian**

---

## 19. Slide saran / penutup
**Acuan lama:** [`ppt/slides/slide27.xml`](docs/ppt%20sempro%20Teknik%20Informatika.pptx)

**Keputusan:**
**Dipertahankan dengan revisi**

**Menjadi:**
- [`Slide 19`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Saran
- [`Slide 20`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md) – Penutup

**Yang diubah:**
- Pisahkan slide saran dan terima kasih.
- Penutup dibuat lebih formal dan singkat.

---

## Bagian yang Sebaiknya Tidak Dipakai Lagi

Bagian dari PPT sempro yang sebaiknya dihapus atau tidak dijadikan slide utama di ujian hasil:
- agenda presentasi panjang,
- tinjauan pustaka detail,
- jadwal penelitian,
- hasil yang diharapkan,
- kesimpulan awal,
- elemen desain placeholder atau lorem ipsum,
- penjelasan terlalu panjang tentang urgensi pasar PWA yang tidak langsung mendukung hasil akhir.

---

## Bagian yang Harus Diperkuat pada Ujian Hasil

Bagian yang justru harus ditambah atau diperkuat dibanding versi sempro:
- hasil implementasi sistem,
- hasil implementasi modul akademik,
- hasil implementasi modul laboratorium,
- bukti dukungan PWA,
- hasil pengujian fungsional,
- hasil pengujian usability,
- pembahasan hasil,
- keterbatasan penelitian,
- kesimpulan final.

---

## Rekomendasi Praktis Penyusunan

Urutan kerja yang paling efisien:
1. Ambil struktur visual terbaik dari template yang paling rapi.
2. Gunakan alur isi baru pada [`docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md`](docs/ANALISIS/SUSUN-ULANG-PPT-UJIAN-HASIL.md).
3. Jadikan PPT sempro hanya sebagai referensi urutan lama dan elemen identitas.
4. Ganti total slide proposal yang sudah tidak relevan.
5. Pastikan bagian hasil dan pengujian mendapatkan porsi presentasi paling besar.

---

## Kesimpulan Mapping

PPT sempro Anda **tidak perlu dibuang**, tetapi **harus ditransformasikan**.
Struktur lamanya masih berguna sebagai kerangka dasar, namun isi untuk ujian hasil harus berpusat pada:
- implementasi,
- pengujian,
- pembahasan,
- kesimpulan,
- dan saran.

Dengan pendekatan ini, presentasi akan tetap konsisten dengan proposal, tetapi lebih tepat untuk konteks **sidang ujian hasil skripsi**.