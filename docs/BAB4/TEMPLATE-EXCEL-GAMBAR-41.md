# Template Excel — Gambar 41 Diagram Distribusi Kategori Skor SUS

Dokumen ini disiapkan untuk memudahkan pembuatan diagram final di Excel untuk **Gambar 41**.

## 1) Data Siap Tempel ke Excel

Salin blok berikut lalu paste ke Excel mulai sel `A1`:

```text
Kategori Hasil,Rentang Skor,Jumlah Responden,Persentase
Excellent,80-100,9,19.6%
Good,70-79,23,50.0%
OK,60-69,9,19.6%
Poor,<60,5,10.9%
Total,-,46,100%
```

> Catatan: untuk diagram, gunakan baris `Excellent` s.d. `Poor` saja (tanpa `Total`).

## 2) Struktur Tabel di Excel

- Kolom A: `Kategori Hasil`
- Kolom B: `Rentang Skor`
- Kolom C: `Jumlah Responden`
- Kolom D: `Persentase`

## 3) Langkah Buat Diagram di Excel (Disarankan Pie Chart)

1. Blok data `A1:A5` dan `C1:C5` (kategori + jumlah, tanpa baris `Total`).
2. Klik menu **Insert** → **Pie Chart** → pilih **2-D Pie**.
3. Klik chart → **Add Data Labels**.
4. Atur label tampil **Category Name + Percentage**.
5. Ubah judul chart menjadi:
   - `Diagram Distribusi Kategori Skor SUS (n=46)`

## 4) Alternatif Diagram (Bar/Column)

Jika pembimbing meminta visual perbandingan lebih jelas:
1. Blok data `A1:A5` dan `C1:C5`.
2. **Insert** → **Column Chart**.
3. Tambahkan data labels pada tiap batang.
4. Judul tetap sama.

## 5) Saran Format Agar Siap Skripsi

- Font: Calibri/Times New Roman ukuran 10–11.
- Warna konsisten per kategori (Excellent/Good/OK/Poor).
- Hindari efek 3D agar tetap akademik.
- Gunakan latar putih dan grid minimal.

## 6) Ekspor Gambar

1. Klik chart.
2. Klik kanan → **Save as Picture...**
3. Format: `PNG`
4. Nama file saran: `gambar-41-distribusi-kategori-skor-sus.png`

## 7) Penempatan di Naskah

Sisipkan hasil gambar pada bagian:
- `Gambar 41. Diagram Distribusi Kategori Skor SUS`
- Referensi lokasi naskah: `docs/BAB4/BAB4.md`

## 8) Validasi Angka (Checklist)

- [ ] Excellent = 9 (19,6%)
- [ ] Good = 23 (50,0%)
- [ ] OK = 9 (19,6%)
- [ ] Poor = 5 (10,9%)
- [ ] Total = 46 (100%)
