# Gambar 2. Diagram Konteks Sistem DFD Level 0

```mermaid
flowchart LR
    subgraph EX[Entitas Eksternal (Pengguna Aplikasi)]
        direction TB
        D[Dosen]
        M[Mahasiswa]
        L[Laboran]
        A[Admin Sistem]
    end

    S["(0)<br/>Sistem Informasi Praktikum PWA<br/>Akademi Kebidanan Mega Buana"]

    D -->|Input: Data Materi, Jadwal Praktikum, Penilaian| S
    S -->|Output: Laporan Kemajuan, Rekap Nilai, Informasi Terpusat| D

    M -->|Input: Data Logbook| S
    S -->|Output: Info Jadwal, Materi, Panduan, Nilai, Notifikasi| M

    L -->|Input: Data Inventaris Alat, Persetujuan Peminjaman| S
    S -->|Output: Laporan Peminjaman, Status Ketersediaan Alat| L

    A -->|Input: Manajemen Data Pengguna & Peran, Konfigurasi Sistem| S
    S -->|Output: Laporan Aktivitas Sistem, Statistik Penggunaan| A

    classDef entity fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef system fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    class D,M,L,A entity;
    class S system;
```

## Keterangan

Diagram konteks ini menunjukkan interaksi antara sistem utama dengan empat entitas eksternal:

1. Dosen
2. Mahasiswa
3. Laboran
4. Admin Sistem

Sistem pusat direpresentasikan sebagai proses `(0)` yaitu **Sistem Informasi Praktikum PWA Akademi Kebidanan Mega Buana**.

## Rincian arus data

### 1. Dosen
- Input ke sistem: data materi, jadwal praktikum, penilaian
- Output dari sistem: laporan kemajuan, rekap nilai, informasi terpusat

### 2. Mahasiswa
- Input ke sistem: data logbook
- Output dari sistem: info jadwal, materi, panduan, nilai, notifikasi

### 3. Laboran
- Input ke sistem: data inventaris alat, persetujuan peminjaman
- Output dari sistem: laporan peminjaman, status ketersediaan alat

### 4. Admin Sistem
- Input ke sistem: manajemen data pengguna & peran, konfigurasi sistem
- Output dari sistem: laporan aktivitas sistem, statistik penggunaan

## Catatan penggunaan di draw.io

Salin blok `mermaid` di atas lalu gunakan fitur insert/import Mermaid pada draw.io.