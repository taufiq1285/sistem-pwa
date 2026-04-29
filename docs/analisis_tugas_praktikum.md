# Analisis Alur Fitur Tugas Praktikum — Dosen ↔ Mahasiswa

> **Catatan Teknis**: Fitur ini menggunakan tabel database `kuis` secara internal, namun seluruh label UI ditampilkan sebagai **"Tugas Praktikum"**.

---

## 🗺️ Peta Alur Keseluruhan (End-to-End)

```mermaid
flowchart TD
    subgraph DOSEN["👨‍🏫 ROLE: DOSEN"]
        D1["📋 Daftar Tugas\n/dosen/kuis"] --> D2["➕ Buat Tugas\n/dosen/kuis/create"]
        D2 --> D2a["Pilih Jenis:\n📄 Laporan (WAJIB)\n🖥️ Tes CBT (OPSIONAL)"]
        D2a --> D3["🔧 Quiz Builder\n(QuizBuilder component)"]
        D3 --> D4["💾 Simpan & Publish"]
        D4 --> D1

        D1 --> D5["✏️ Edit Tugas\n/dosen/kuis/:id/edit"]
        D5 --> D3

        D1 --> D6["📊 Lihat Hasil\n/dosen/kuis/:id/results"]
        D6 --> D6a{"Jenis Tugas?"}
        D6a -->|"📄 Laporan"| D7["Review Laporan\n(Manual Grading)"]
        D6a -->|"🖥️ CBT"| D8["Lihat Jawaban CBT\n(Auto Graded)"]
        D7 --> D9["💯 Simpan Nilai\n→ syncNilaiPraktikum\n→ Notifikasi Mahasiswa"]
        D8 --> D10["📥 Export CSV"]
    end

    subgraph MAHASISWA["👩‍🎓 ROLE: MAHASISWA"]
        M1["📋 Daftar Tugas\n/mahasiswa/kuis"] --> M1a{"Status Tugas"}
        M1a -->|"upcoming"| M2["⏳ Belum Dimulai\n(Tombol disabled)"]
        M1a -->|"ongoing"| M3{"Jenis Tugas?"}
        M1a -->|"completed"| M4["👁️ Lihat Hasil\n/mahasiswa/kuis/:id/result/:attemptId"]
        M1a -->|"missed"| M5["❌ Terlewat\n(Tombol disabled)"]

        M3 -->|"📄 Laporan"| M6["📤 Kirim Laporan\n/mahasiswa/kuis/:id/attempt"]
        M3 -->|"🖥️ TES/CBT"| M7["▶️ Mulai CBT\n/mahasiswa/kuis/:id/attempt"]

        M6 --> M8["📄 QuizAttempt\n(essay/file_upload mode)"]
        M7 --> M8

        M8 --> M9["✅ Submit → Hasil\n/mahasiswa/kuis/:id/result/:attemptId"]
        M9 --> M10{"Tipe Soal?"}
        M10 -->|"pilihan_ganda"| M11["🤖 Auto-Grade\n(Langsung dapat nilai)"]
        M10 -->|"essay/file_upload"| M12["⏳ Tunggu Nilai Dosen\n(Manual Grading)"]
    end

    D4 -.->|"Published → Mahasiswa bisa akses"| M1
    D9 -.->|"Nilai tersimpan + Notifikasi"| M12
```

---

## 📐 Struktur Route

| Route | Role | File | Fungsi |
|---|---|---|---|
| `/dosen/kuis` | Dosen | `dosen/kuis/KuisListPage.tsx` | Daftar semua tugas milik dosen |
| `/dosen/kuis/create` | Dosen | `dosen/kuis/KuisCreatePage.tsx` | Pilih jenis tugas + buat baru |
| `/dosen/kuis/:kuisId/edit` | Dosen | `dosen/kuis/KuisBuilderPage.tsx` (edit mode) | Edit tugas yang ada |
| `/dosen/kuis/:kuisId/results` | Dosen | `dosen/kuis/KuisResultsPage.tsx` | Lihat & nilai submission mahasiswa |
| `/dosen/kuis/:kuisId/attempt/:attemptId` | Dosen | `dosen/kuis/AttemptDetailPage.tsx` | Detail jawaban satu mahasiswa |
| `/mahasiswa/kuis` | Mahasiswa | `mahasiswa/kuis/KuisListPage.tsx` | Daftar tugas yang tersedia |
| `/mahasiswa/kuis/:kuisId/attempt` | Mahasiswa | `mahasiswa/kuis/KuisAttemptPage.tsx` | Mengerjakan / submit tugas |
| `/mahasiswa/kuis/:kuisId/result/:attemptId` | Mahasiswa | `mahasiswa/kuis/KuisResultPage.tsx` | Lihat hasil setelah submit |

---

## 🔄 Sinkronisasi Alur Dosen ↔ Mahasiswa

### Fase 1 — Dosen Membuat Tugas

```mermaid
sequenceDiagram
    participant D as 👨‍🏫 Dosen
    participant DB as 🗄️ Database (tabel: kuis)
    participant MW as 📡 Mahasiswa

    D->>D: Buka /dosen/kuis → Klik "Buat Tugas Baru"
    D->>D: Pilih jenis: 📄 Laporan atau 🖥️ Tes CBT
    D->>D: Isi form QuizBuilder (judul, kelas, tanggal, soal)
    D->>DB: INSERT kuis (status = 'draft')
    D->>D: Publish tugas → UPDATE kuis (status = 'published')
    DB-->>MW: Realtime subscription → kuis:changed event
    MW->>MW: loadQuizzes(force=true) → Tugas muncul di daftar
```

### Fase 2 — Mahasiswa Mengerjakan Tugas

```mermaid
sequenceDiagram
    participant MW as 👩‍🎓 Mahasiswa
    participant DB as 🗄️ Database
    participant D as 👨‍🏫 Dosen

    MW->>MW: Buka /mahasiswa/kuis
    MW->>DB: getUpcomingQuizzes(mahasiswaId)
    DB-->>MW: Daftar tugas dengan status (upcoming/ongoing/completed/missed)

    alt Status = "ongoing" + can_attempt = true
        MW->>MW: Klik "Mulai CBT" atau "Kirim Laporan"
        MW->>DB: Validasi: status=published, waktu valid?
        DB-->>MW: ✅ Akses diizinkan
        MW->>MW: Kerjakan di QuizAttempt component
        MW->>DB: Submit jawaban → attempt_kuis (status='submitted')
    end

    alt Tipe = "pilihan_ganda" (CBT)
        DB-->>MW: Auto-grade jawaban langsung
        MW->>MW: Redirect → /mahasiswa/kuis/:id/result/:attemptId
    else Tipe = "essay/file_upload" (Laporan)
        MW->>MW: Redirect → /mahasiswa/kuis/:id/result/:attemptId
        MW->>MW: Tampilkan "Menunggu Penilaian Dosen"
        MW->>D: (menunggu dosen menilai)
    end
```

### Fase 3 — Dosen Menilai Laporan

```mermaid
sequenceDiagram
    participant D as 👨‍🏫 Dosen
    participant DB as 🗄️ Database
    participant MW as 👩‍🎓 Mahasiswa

    D->>DB: getAttemptsByKuis(kuisId)
    DB-->>D: List mahasiswa + status submission

    D->>D: Buka detail laporan mahasiswa
    DB-->>D: Laporan/file URL (via resolveLaporanAccessUrl)

    D->>D: Input nilai (poin_diperoleh) + feedback per soal
    D->>DB: gradeAnswer(jawabanId, poin, feedback)
    D->>DB: syncNilaiPraktikumFromAttempts() → UPDATE tabel nilai
    D->>DB: notifyMahasiswaTugasGraded() → Notifikasi

    DB-->>MW: Notifikasi: "Tugas [judul] telah dinilai: [skor]"
    MW->>MW: KuisResultPage menampilkan nilai final
```

---

## 🧩 Dua Jenis Tugas & Perbedaan Alurnya

| Aspek | 📄 Laporan (Essay/File Upload) | 🖥️ Tes CBT (Pilihan Ganda) |
|---|---|---|
| **Dibuat** | `tipe_kuis = 'essay'` / soal tipe `file_upload` | Soal tipe `pilihan_ganda` |
| **Durasi** | `durasi_menit = null/0` (tanpa timer) | Ada durasi timer |
| **Mahasiswa Submit** | Upload PDF/Word atau isian essay | Jawab soal pilihan ganda |
| **Penilaian** | **Manual** oleh Dosen | **Otomatis** (auto-grade) |
| **Notifikasi** | Dikirim setelah dosen grade | Tidak ada (langsung lihat) |
| **Status Laporan** | Dosen lihat badge: "Belum Upload / Sudah Upload / Sudah Dinilai" | Dosen lihat badge: "Belum Selesai / Lulus / Tidak Lulus" |
| **Sinkronisasi Nilai** | `syncNilaiPraktikumFromAttempts()` saat grade disimpan | Sync otomatis saat auto-grade |

---

## ⚠️ Gap / Ketidaksinkronan yang Terdeteksi

> [!WARNING]
> Beberapa potensi ketidaksinkronan ditemukan antara alur dosen dan mahasiswa.

### 1. Status Mahasiswa vs Kondisi di Dosen

| Kondisi Dosen | Dampak ke Mahasiswa |
|---|---|
| Dosen hapus tugas saat mahasiswa sedang mengerjakan | Mahasiswa mungkin mendapat error 404 saat submit |
| Dosen ubah tanggal selesai ke belakang (diperpanjang) | Mahasiswa yang sudah `completed` tidak bisa mengulang (max_attempts) |
| Dosen belum menilai laporan | Mahasiswa di halaman result melihat "Menunggu Penilaian" tanpa estimasi waktu |

### 2. `KuisBuilderPage` vs `KuisCreatePage` — Duplikasi

> [!NOTE]
> Ada **dua file berbeda** dengan fungsi serupa:
> - `KuisCreatePage.tsx` — digunakan untuk buat baru (dengan pilih jenis laporan/CBT terlebih dulu)
> - `KuisBuilderPage.tsx` — digunakan untuk edit (langsung ke `QuizBuilder`)
>
> Keduanya menggunakan `QuizBuilder` component yang sama. `KuisCreatePage` memiliki step pilih tipe yang tidak ada di `KuisBuilderPage`.

### 3. Status Filter Berbeda antara Dosen dan Mahasiswa

| Status di Dosen (`KuisListPage`) | Status di Mahasiswa (`KuisListPage`) |
|---|---|
| `draft` | - (tidak terlihat oleh mahasiswa) |
| `active` (= published) | `upcoming` / `ongoing` / `completed` / `missed` |
| `ended` (= archived) | `missed` |

> [!IMPORTANT]
> **Status "ended" vs "missed"**: Di dosen, tugas yang diarsipkan tampil sebagai "Diarsipkan". Di mahasiswa, tugas yang sudah melewati deadline tetapi belum dikerjakan tampil sebagai "Terlewat". Keduanya berbeda konsep — bisa membingungkan jika dosen mengarsipkan tugas yang masih ada mahasiswa yang belum selesai.

### 4. `can_attempt` vs Realtime Refresh

> [!NOTE]
> Mahasiswa: `KuisListPage` menggunakan `getUpcomingQuizzes()` yang mengembalikan field `can_attempt`. Field ini dikontrol server-side. Namun jika dosen meng-unpublish tugas di tengah jalan, mahasiswa perlu refresh manual agar status terupdate (walaupun ada realtime subscription via Supabase).

### 5. Notifikasi Hanya untuk Laporan

Notifikasi (`notifyMahasiswaTugasGraded`) hanya dipanggil saat dosen menyimpan nilai laporan. Untuk tugas CBT, tidak ada notifikasi ke mahasiswa bahwa nilainya sudah otomatis dinilai.

---

## 🗄️ Tabel Database yang Terlibat

```mermaid
erDiagram
    kuis {
        uuid id PK
        uuid dosen_id FK
        uuid kelas_id FK
        uuid mata_kuliah_id FK
        string judul
        string deskripsi
        string tipe_kuis
        string status
        timestamp tanggal_mulai
        timestamp tanggal_selesai
        int durasi_menit
        int max_attempts
        float passing_score
    }

    soal {
        uuid id PK
        uuid kuis_id FK
        string tipe_soal
        string pertanyaan
        string jawaban_benar
        int poin
    }

    attempt_kuis {
        uuid id PK
        uuid kuis_id FK
        uuid mahasiswa_id FK
        string status
        timestamp started_at
        timestamp submitted_at
        float total_poin
        int attempt_number
    }

    jawaban_kuis {
        uuid id PK
        uuid attempt_id FK
        uuid soal_id FK
        string jawaban_mahasiswa
        string file_url
        float poin_diperoleh
        boolean is_correct
        string feedback
    }

    nilai {
        uuid id PK
        uuid mahasiswa_id FK
        uuid kelas_id FK
        float nilai_tugas
    }

    kuis ||--o{ soal : "punya"
    kuis ||--o{ attempt_kuis : "dikerjakan"
    attempt_kuis ||--o{ jawaban_kuis : "berisi"
    attempt_kuis }o--|| nilai : "sync ke"
```

---

## ✅ Ringkasan Sinkronisasi yang Sudah Berjalan dengan Baik

| Mekanisme | Keterangan |
|---|---|
| **Realtime Supabase** | `KuisListPage` (dosen & mahasiswa) subscribe ke perubahan tabel `kuis` |
| **Cache invalidation** | Setelah create/update/delete, cache di-invalidate + event `kuis:changed` ditrigger |
| **Offline support** | Mahasiswa bisa akses daftar tugas & kerjakan soal offline (dengan `cacheAPI` + `staleWhileRevalidate`) |
| **syncNilaiPraktikum** | Nilai otomatis sync ke tabel `nilai` setelah dosen menyimpan penilaian laporan |
| **Notifikasi** | Mahasiswa diberitahu via notifikasi ketika laporan selesai dinilai |
