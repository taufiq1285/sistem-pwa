# Gambar 1. Diagram Alir Penelitian Metode R&D Ellis dan Levy

```mermaid
flowchart TD
    A["1. Identifikasi Masalah"] --> B(["2. Penetapan Tujuan"])
    B --> C{"3. Perancangan & Pengembangan\nSolusi/Artefak"}
    C --> D["4. Pengujian"]
    D --> E["5. Evaluasi Hasil"]
    E --> F["6. Komunikasi Hasil"]
    D -. Revisi .-> C
    E -. Penyempurnaan .-> C

    classDef box fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef rounded fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;
    classDef decision fill:#ffffff,stroke:#000000,stroke-width:1.5px,color:#000000;

    class A,D,E,F box;
    class B rounded;
    class C decision;
```

## Keterangan

Diagram ini mengikuti alur contoh yang Anda kirim:

1. Identifikasi Masalah
2. Penetapan Tujuan
3. Perancangan & Pengembangan Solusi/Artefak
4. Pengujian
5. Evaluasi Hasil
6. Komunikasi Hasil

Panah putus-putus dari tahap pengujian dan evaluasi menunjukkan proses iteratif berupa revisi atau penyempurnaan kembali ke tahap perancangan dan pengembangan.

## Catatan penggunaan di draw.io

Jika ingin dipakai di draw.io, salin blok `mermaid` di atas lalu gunakan fitur insert/import Mermaid pada draw.io.