# Gambar 4. Diagram Arsitektur Sistem PWA

```mermaid
flowchart LR
    subgraph U[Pengguna]
        direction TB
        U1[Dosen]
        U2[Mahasiswa]
        U3[Laboran]
        U4[Admin Sistem]
    end

    subgraph C[Client-Side]
        direction TB
        SW[Service Worker<br/>Caching, Offline Access]
        WM[Web App Manifest<br/>Instalasi]
        UI[Antarmuka Pengguna<br/>React, Vite, TypeScript, TailwindCSS]
    end

    subgraph S[Server-Side Supabase]
        direction TB
        SA[Supabase Auth<br/>RBAC, Autentikasi]
        SD[Supabase Database<br/>PostgreSQL - Data Praktikum]
        SS[Supabase Storage<br/>File Materi, Tugas]
        SR[Supabase Realtime<br/>Notifikasi]
    end

    U1 --> UI
    U2 --> UI
    U3 --> UI
    U4 --> UI

    SW -.-> UI
    WM -.-> UI

    UI <--> SA
    UI <--> SD
    UI <--> SS
    UI <--> SR

    classDef actor fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef component fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef infra fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;

    class U1,U2,U3,U4 actor;
    class UI,SW,WM component;
    class SA,SD,SS,SR infra;
```

## Keterangan

Diagram ini menggambarkan arsitektur sistem informasi praktikum berbasis PWA yang terdiri dari tiga bagian utama:

1. Pengguna
2. Client-Side
3. Server-Side Supabase

## Komponen utama

### 1. Pengguna
- Dosen
- Mahasiswa
- Laboran
- Admin Sistem

Seluruh aktor mengakses sistem melalui antarmuka pengguna pada sisi klien.

### 2. Client-Side
- Antarmuka Pengguna: React, Vite, TypeScript, TailwindCSS
- Service Worker: caching dan akses offline
- Web App Manifest: instalasi aplikasi

Komponen `Service Worker` dan `Web App Manifest` mendukung karakteristik Progressive Web Application.

### 3. Server-Side Supabase
- Supabase Auth: RBAC dan autentikasi
- Supabase Database: PostgreSQL untuk data praktikum
- Supabase Storage: penyimpanan file materi dan tugas
- Supabase Realtime: notifikasi dan pembaruan data langsung

## Relasi antarkomponen

- Pengguna berinteraksi dengan sistem melalui antarmuka pengguna.
- Antarmuka pengguna terhubung dengan layanan autentikasi, basis data, penyimpanan file, dan realtime pada Supabase.
- Service worker dan web app manifest memperkuat dukungan offline dan instalasi aplikasi.

## Catatan penggunaan di draw.io

Salin blok `mermaid` di atas lalu gunakan fitur insert/import Mermaid pada draw.io.