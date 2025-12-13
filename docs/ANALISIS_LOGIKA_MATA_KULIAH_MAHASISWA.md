# Analisis Logika Mata Kuliah di Dashboard Mahasiswa

## 🔍 Pertanyaan User
> "Mengapa dashboard mahasiswa menampilkan mata kuliah? Seharusnya fokus menampilkan praktikum saja karena ini adalah sistem informasi praktikum berbasis PWA."

## ✅ ANALISIS MASALAH

### 1. Alur Sistem Saat Ini

**Entitas & Hubungan:**
```
Admin → Membuat Mata Kuliah → Admin Membuat Kelas → Mahasiswa Didaftarkan
                                        ↓
                                  Dosen Membuat Jadwal Praktikum
                                        ↓
                                  Mahasiswa Lihat Praktikum
```

### 2. Apa yang Ditampilkan di Dashboard Mahasiswa Saat Ini

**Dashboard Mahasiswa (src/pages/mahasiswa/DashboardPage.tsx):**
```typescript
// Line 140-150
<Card>
  <CardTitle>Total Mata Kuliah</CardTitle>
  <div className="text-2xl">{stats?.totalMataKuliah || 0}</div>
  <p>Kelas yang di-assign</p>
</Card>
```

**Sumber Data (src/lib/api/mahasiswa.api.ts Line 168-174):**
```typescript
// GET ENROLLED CLASSES
const { data: kelasData } = await supabase
  .from("kelas_mahasiswa")
  .select("kelas_id")
  .eq("mahasiswa_id", mahasiswaId)
  .eq("is_active", true);

const totalMataKuliah = kelasData?.length || 0; // ❌ MISLEADING!
```

### 3. Masalah yang Ditemukan

#### ❌ MASALAH 1: Naming Misleading
**Variable name:** `totalMataKuliah`
**Actual value:** Jumlah KELAS yang diikuti, bukan jumlah mata kuliah unik

**Contoh Case:**
```
Mahasiswa terdaftar di:
1. PWA-A (Mata Kuliah: Praktikum Pemrograman Web)
2. PWA-B (Mata Kuliah: Praktikum Pemrograman Web) ← sama mata kuliahnya
3. BD-A (Mata Kuliah: Praktikum Basis Data)

Result: totalMataKuliah = 3
Expected: totalMataKuliah = 2 (hanya 2 mata kuliah unik)

TAPI SEHARUSNYA: Tidak perlu counting mata kuliah sama sekali!
```

#### ❌ MASALAH 2: Fokus yang Salah
**Sistem ini:** Sistem Informasi **PRAKTIKUM** PWA
**Yang ditampilkan:** Mata Kuliah (entitas administratif)

**Seharusnya fokus pada:**
- ✅ Jadwal Praktikum
- ✅ Kuis Praktikum
- ✅ Materi Praktikum
- ✅ Nilai dari Praktikum
- ✅ Kelas Praktikum yang diikuti

**Bukan:**
- ❌ Mata Kuliah (ini concern Admin/Kurikulum)

#### ❌ MASALAH 3: Redundansi di UI
Dashboard Mahasiswa menampilkan:
1. Card "Total Mata Kuliah"
2. Section "Kelas Saya" dengan detail mata kuliah

**Redundan!** Informasi mata kuliah sudah ada di "Kelas Saya".

## 💡 REKOMENDASI PERBAIKAN

### Rekomendasi 1: Ganti "Total Mata Kuliah" → "Total Kelas Praktikum"

**Alasan:**
1. Lebih akurat (memang menghitung jumlah kelas, bukan mata kuliah)
2. Lebih relevan dengan context sistem praktikum
3. Tidak misleading

**Implementasi:**
```typescript
// src/lib/api/mahasiswa.api.ts
export interface MahasiswaStats {
  totalKelasPraktikum: number;  // ← RENAME dari totalMataKuliah
  totalKuis: number;
  rataRataNilai: number | null;
  jadwalHariIni: number;
}

// src/pages/mahasiswa/DashboardPage.tsx
<Card>
  <CardTitle>Total Kelas Praktikum</CardTitle>
  <div className="text-2xl">{stats?.totalKelasPraktikum || 0}</div>
  <p>Kelas yang diikuti</p>
</Card>
```

### Rekomendasi 2: Fokus UI pada Praktikum

**Dashboard Mahasiswa Seharusnya Menampilkan:**

```
┌─────────────────────────────────────────────────────────────┐
│                  DASHBOARD MAHASISWA                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📚 Kelas Praktikum    📝 Kuis Aktif    📊 Rata² Nilai     │
│        3 Kelas            2 Kuis           85.5            │
│                                                             │
│  📅 Jadwal Hari Ini                                         │
│        2 Praktikum                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📚 Kelas Praktikum Saya                                    │
│  ┌─────────────────────────────────────────────┐           │
│  │ Praktikum Pemrograman Web - Kelas A         │           │
│  │ PWA • 2 SKS • 2024/2025 Ganjil              │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  📅 Jadwal Praktikum Minggu Ini                             │
│  ┌─────────────────────────────────────────────┐           │
│  │ Praktikum Pemrograman Web                   │           │
│  │ Senin, 10 Des 2025 • 08:00-10:00            │           │
│  │ Lab Komputer 1                               │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Rekomendasi 3: Penyederhanaan Informasi

**Hilangkan:**
- ❌ Istilah "Mata Kuliah" dari UI mahasiswa (kecuali sebagai context info)
- ❌ Counting mata kuliah

**Gunakan:**
- ✅ "Kelas Praktikum" atau "Praktikum"
- ✅ Fokus pada jadwal, kuis, materi, nilai

**Contoh Perubahan:**

**SEBELUM:**
```
Card: "Total Mata Kuliah: 3"
List: "Kelas Saya" → menampilkan nama mata kuliah + kelas
```

**SESUDAH:**
```
Card: "Kelas Praktikum: 3"  (atau "Praktikum yang Diikuti: 3")
List: "Kelas Praktikum Saya" → fokus ke kelas praktikum
```

## 📊 Perbandingan Sebelum vs Sesudah

| Aspek | Sebelum (❌) | Sesudah (✅) |
|-------|-------------|-------------|
| **Fokus** | Mata Kuliah (administratif) | Praktikum (operational) |
| **Naming** | totalMataKuliah (misleading) | totalKelasPraktikum (accurate) |
| **UI** | Redundan (mata kuliah di 2 tempat) | Streamlined (fokus praktikum) |
| **User Understanding** | Bingung (apa bedanya mata kuliah vs kelas?) | Jelas (ini kelas praktikum yang diikuti) |

## 🎯 KESIMPULAN

### Pertanyaan User:
> "Mengapa dashboard mahasiswa menampilkan mata kuliah juga, mengapa tidak fokus hanya menampilkan praktikum saja?"

### Jawaban:
**User BENAR! Dashboard mahasiswa seharusnya fokus pada PRAKTIKUM.**

### Alasan:
1. **Sistem ini adalah Sistem Informasi PRAKTIKUM**, bukan Sistem Informasi Akademik
2. **Mata Kuliah adalah entitas administratif** yang lebih relevan untuk Admin/Kurikulum
3. **Mahasiswa perlu fokus pada eksekusi praktikum**: jadwal, kuis, materi, nilai
4. **Nama variable misleading**: `totalMataKuliah` sebenarnya menghitung total kelas

### Solusi yang Direkomendasikan:
1. ✅ Ganti "Total Mata Kuliah" → "Total Kelas Praktikum"
2. ✅ Fokus UI pada: Jadwal, Kuis, Materi, Nilai Praktikum
3. ✅ Hilangkan redundansi informasi mata kuliah
4. ✅ Gunakan istilah "Kelas Praktikum" atau "Praktikum" di seluruh UI mahasiswa

### Prioritas Implementasi:
1. **HIGH PRIORITY**: Rename variable dan UI text (quick win)
2. **MEDIUM PRIORITY**: Refactor dashboard layout untuk fokus praktikum
3. **LOW PRIORITY**: Review seluruh UI mahasiswa untuk consistency

---

## 📝 Catatan Implementasi

Jika Anda setuju dengan analisis ini, saya dapat membantu:
1. Rename variable `totalMataKuliah` → `totalKelasPraktikum` di seluruh codebase
2. Update UI dashboard mahasiswa untuk fokus pada praktikum
3. Simplify informasi yang ditampilkan
4. Pastikan consistency di seluruh halaman mahasiswa

Apakah Anda ingin saya lakukan perubahan ini?
