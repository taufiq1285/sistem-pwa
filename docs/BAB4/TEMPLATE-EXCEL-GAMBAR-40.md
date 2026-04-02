# Template Excel — Gambar 40 Diagram Distribusi Responden SUS per Peran

Dokumen ini disiapkan untuk memudahkan pembuatan diagram final di Excel yang akan dipakai pada skripsi.

## 1) Data Siap Tempel ke Excel

Salin blok berikut lalu paste ke Excel mulai sel `A1`:

```text
Peran,Jumlah,Persentase
Mahasiswa,38,82.6%
Dosen,6,13.0%
Laboran,1,2.2%
Admin,1,2.2%
Total,46,100%
```

> Catatan: untuk diagram pie, gunakan baris `Mahasiswa` s.d. `Admin` saja (tanpa baris `Total`).

## 2) Struktur Tabel di Excel

- Kolom A: `Peran`
- Kolom B: `Jumlah`
- Kolom C: `Persentase`

## 3) Langkah Buat Diagram Pie di Excel

1. Blok data `A1:B5` (tanpa baris `Total`).
2. Klik menu **Insert** → **Pie Chart** → pilih **2-D Pie**.
3. Klik chart → **Add Data Labels**.
4. Atur label tampil **Category Name + Percentage**.
5. Ubah judul chart menjadi:
   - `Diagram Distribusi Responden SUS per Peran (n=46)`

## 4) Saran Format Agar Siap Skripsi

- Font: Calibri/Times New Roman ukuran 10–11.
- Warna sederhana dan kontras (maks. 4 warna).
- Legend di posisi bawah/kanan.
- Hindari efek 3D agar tetap akademik.

## 5) Ekspor Gambar

1. Klik chart.
2. Klik kanan → **Save as Picture...**
3. Format: `PNG`
4. Nama file saran: `gambar-40-distribusi-responden-sus.png`

## 6) Penempatan di Naskah

Sisipkan hasil gambar pada bagian:
- `Gambar 40. Diagram Distribusi Responden SUS per Peran`
- Referensi lokasi naskah: `docs/BAB4/BAB4.md`

## 7) Validasi Angka (Checklist)

- [ ] Mahasiswa = 38 (82,6%)
- [ ] Dosen = 6 (13,0%)
- [ ] Laboran = 1 (2,2%)
- [ ] Admin = 1 (2,2%)
- [ ] Total = 46 (100%)
