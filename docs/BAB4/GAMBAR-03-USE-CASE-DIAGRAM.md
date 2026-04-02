# Gambar 3. Use Case Diagram

```mermaid
flowchart LR
    AS[Admin Sistem]
    LB[Laboran]
    DS[Dosen]
    MH[Mahasiswa]

    subgraph SYS[Sistem Informasi Praktikum PWA]
        direction TB

        subgraph UC1[Use Case Admin]
            direction TB
            A1([Kelola Pengguna])
            A2([Konfigurasi Sistem])
        end

        subgraph UC2[Use Case Laboran]
            direction TB
            L1([Kelola Inventaris Alat])
            L2([Setujui Peminjaman Alat])
        end

        subgraph UC3[Use Case Dosen]
            direction TB
            D1([Kelola Materi Praktikum])
            D2([Buat Jadwal Praktikum])
            D3([Input Nilai])
            D4([Pantau Logbook])
            D5([Kirim Pengumuman])
        end

        subgraph UC4[Use Case Mahasiswa]
            direction TB
            M1([Lihat Jadwal])
            M2([Booking Lab/Alat])
            M3([Unggah Logbook])
            M4([Lihat Nilai])
            M5([Terima Pengumuman])
        end
    end

    AS --> A1
    AS --> A2

    LB --> L1
    LB --> L2

    DS --> D1
    DS --> D2
    DS --> D3
    DS --> D4
    DS --> D5
    DS --> M1
    DS --> M2

    MH --> M1
    MH --> M3
    MH --> M4
    MH --> M5
    MH --> M2

    classDef actor fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef usecase fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef group fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000;

    class AS,LB,DS,MH actor;
    class A1,A2,L1,L2,D1,D2,D3,D4,D5,M1,M2,M3,M4,M5 usecase;
```

## Keterangan

Diagram use case ini menunjukkan interaksi empat aktor utama dengan sistem:

1. Admin Sistem
2. Laboran
3. Dosen
4. Mahasiswa

## Rincian use case per aktor

### 1. Admin Sistem
- Kelola Pengguna
- Konfigurasi Sistem

### 2. Laboran
- Kelola Inventaris Alat
- Setujui Peminjaman Alat

### 3. Dosen
- Kelola Materi Praktikum
- Buat Jadwal Praktikum
- Input Nilai
- Pantau Logbook
- Kirim Pengumuman
- Lihat Jadwal
- Booking Lab/Alat

### 4. Mahasiswa
- Lihat Jadwal
- Booking Lab/Alat
- Unggah Logbook
- Lihat Nilai
- Terima Pengumuman

## Catatan penggunaan di draw.io

Salin blok `mermaid` di atas lalu gunakan fitur insert/import Mermaid pada draw.io.