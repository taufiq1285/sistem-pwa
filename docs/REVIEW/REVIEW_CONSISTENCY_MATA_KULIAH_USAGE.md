# Review: Consistency Penggunaan "Mata Kuliah" vs "Praktikum"

## 📊 Status: Analysis Complete

---

## 🎯 Objective

Review seluruh halaman mahasiswa untuk memastikan consistency dalam penggunaan istilah "Mata Kuliah" vs "Praktikum/Kelas Praktikum".

---

## ✅ Yang Sudah Diperbaiki (Previous Session)

1. **Dashboard Mahasiswa** - `src/pages/mahasiswa/DashboardPage.tsx`
   - ✅ Stats card: "Total Mata Kuliah" → "Kelas Praktikum"
   - ✅ Description: "Kelas yang di-assign" → "Kelas yang diikuti"
   - ✅ API: `totalMataKuliah` → `totalKelasPraktikum`

---

## 📋 Findings: Penggunaan "Mata Kuliah" di Halaman Mahasiswa

### 1. ✅ Navigation Menu (GOOD)

**File:** `src/config/navigation.config.ts`

**Status:** ✅ **SUDAH BAIK**

```typescript
// Mahasiswa Navigation
{
  label: "Jadwal Praktikum",  // ✅ FOKUS PRAKTIKUM
  href: "/mahasiswa/jadwal",
  description: "Jadwal praktikum kebidanan",
},
{
  label: "Presensi",
  href: "/mahasiswa/presensi",
  description: "Kehadiran praktikum",  // ✅ FOKUS PRAKTIKUM
}
```

**Analysis:**
- ✅ Menu labels sudah fokus praktikum
- ✅ Descriptions jelas (praktikum kebidanan, kehadiran praktikum)
- ✅ Tidak ada yang perlu diubah

---

### 2. 🟡 NilaiPage.tsx (NEEDS CONTEXT ANALYSIS)

**File:** `src/pages/mahasiswa/NilaiPage.tsx`

**Findings:**

#### Location 1: Stats Card Title (Line 244)
```typescript
<CardTitle className="text-sm font-medium text-gray-600">
  Mata Kuliah  // 🟡 PERLU REVIEW
</CardTitle>
```

**Context:** Ini adalah card yang menunjukkan jumlah mata kuliah.

**Recommendation:**
- 🔄 **PERLU DIGANTI** menjadi "Kelas Praktikum" (consistency dengan dashboard)

---

#### Location 2: Description (Line 326)
```typescript
<CardDescription>
  Nilai akademik untuk semua mata kuliah yang Anda ambil  // 🟡 PERLU REVIEW
</CardDescription>
```

**Recommendation:**
- 🔄 **PERLU DIGANTI** menjadi "Nilai untuk semua kelas praktikum yang Anda ikuti"

---

#### Location 3: Table Header (Line 345)
```html
<TableHead>Mata Kuliah</TableHead>  <!-- ✅ OK - FIELD NAME -->
```

**Context:** Kolom tabel yang menampilkan NAMA mata kuliah (field informasi).

**Recommendation:**
- ✅ **BOLEH DIPERTAHANKAN** - Ini adalah nama kolom/field yang menunjukkan mata kuliah apa yang dipraktikumkan
- **ATAU** bisa diganti menjadi "Praktikum" untuk consistency

**Reasoning:**
- Pada tabel data, "Mata Kuliah" berfungsi sebagai **field label**, bukan fokus utama
- Seperti: "Kode MK", "SKS", "Semester" - ini adalah field informasi
- Tapi untuk **consistency maksimal**, bisa diganti "Praktikum"

---

### 3. 🟡 PresensiPage.tsx (NEEDS REVIEW)

**File:** `src/pages/mahasiswa/PresensiPage.tsx`

**Findings:**

#### Location: Table Header (Line 295)
```html
<TableHead>Mata Kuliah</TableHead>  <!-- 🟡 BISA DIGANTI -->
```

**Context:** Kolom tabel presensi.

**Recommendation:**
- 🔄 **BISA DIGANTI** menjadi "Praktikum" untuk consistency
- Ini halaman presensi praktikum, jadi lebih tepat "Praktikum"

---

### 4. 🟡 KuisListPage.tsx (NEEDS REVIEW)

**File:** `src/pages/mahasiswa/kuis/KuisListPage.tsx`

**Findings:**

#### Location: Search Placeholder (Line 387)
```typescript
<Input
  placeholder="Cari kuis, mata kuliah, atau kelas..."  // 🟡 PERLU REVIEW
/>
```

**Recommendation:**
- 🔄 **PERLU DIGANTI** menjadi "Cari kuis, praktikum, atau kelas..."

---

## 📊 Summary Rekomendasi

| File | Location | Current | Recommendation | Priority |
|------|----------|---------|----------------|----------|
| `NilaiPage.tsx` | Stats card title | "Mata Kuliah" | "Kelas Praktikum" | 🔴 HIGH |
| `NilaiPage.tsx` | Description | "mata kuliah yang Anda ambil" | "kelas praktikum yang Anda ikuti" | 🔴 HIGH |
| `NilaiPage.tsx` | Table header | "Mata Kuliah" | "Praktikum" | 🟡 MEDIUM |
| `PresensiPage.tsx` | Table header | "Mata Kuliah" | "Praktikum" | 🟡 MEDIUM |
| `KuisListPage.tsx` | Search placeholder | "mata kuliah" | "praktikum" | 🟢 LOW |

---

## 🎯 Prinsip Penggunaan "Mata Kuliah" vs "Praktikum"

### ✅ Kapan Boleh Menggunakan "Mata Kuliah"?

1. **Sebagai Context/Field Info (Optional):**
   - Kolom tabel yang menunjukkan nama mata kuliah
   - Field informasi detail (kode_mk, nama_mk)
   - Tapi **LEBIH BAIK** diganti "Praktikum" untuk consistency

2. **Halaman Admin (WAJIB):**
   - Admin manage master data mata kuliah
   - Menu "Mata Kuliah" di admin navigation ✅ CORRECT

### ❌ Kapan HARUS Menggunakan "Kelas Praktikum/Praktikum"?

1. **Focus/Primary Data:**
   - Stats cards (counting total)
   - Page titles
   - Main headings
   - Primary descriptions

2. **Context Mahasiswa:**
   - Semua yang berhubungan dengan apa yang mahasiswa **ikuti/lakukan**
   - "Kelas praktikum yang diikuti" (bukan "mata kuliah yang diambil")

3. **Search/Filter:**
   - Placeholder text
   - Filter labels

---

## 🔄 Rekomendasi Perbaikan

### Option 1: Consistency Maksimal (RECOMMENDED) ⭐

Ganti **SEMUA** "Mata Kuliah" di halaman mahasiswa menjadi "Praktikum" atau "Kelas Praktikum".

**Reasoning:**
- Fokus penuh pada praktikum
- User tidak bingung
- Consistent dengan domain sistem (Sistem Praktikum PWA)

**Changes:**
- ✅ Stats cards: "Kelas Praktikum"
- ✅ Descriptions: "kelas praktikum yang Anda ikuti"
- ✅ Table headers: "Praktikum" (instead of "Mata Kuliah")
- ✅ Search placeholders: "praktikum"

---

### Option 2: Hybrid (ACCEPTABLE) ⚠️

Ganti yang **fokus/utama** saja, pertahankan field info.

**Changes:**
- ✅ Stats cards: "Kelas Praktikum"
- ✅ Descriptions: "kelas praktikum"
- ⚠️ Table headers: tetap "Mata Kuliah" (field info)
- ✅ Search placeholders: "praktikum"

**Reasoning:**
- Less intrusive
- Tapi ada inconsistency minor

---

## 📝 Implementation Plan (If Approved)

### Phase 1: High Priority (Quick Win)
1. ✅ **NilaiPage.tsx** - Stats card & description
2. ✅ **KuisListPage.tsx** - Search placeholder

### Phase 2: Medium Priority (Consistency)
3. ✅ **NilaiPage.tsx** - Table header
4. ✅ **PresensiPage.tsx** - Table header

**Estimated Time:** ~15-20 minutes
**Risk:** Very low (cosmetic changes)
**Impact:** High (better UX & consistency)

---

## ✅ Kesimpulan

### Current Status:
- ✅ Dashboard: FIXED (previous session)
- 🟡 NilaiPage: NEEDS UPDATE (3 locations)
- 🟡 PresensiPage: NEEDS UPDATE (1 location)
- 🟡 KuisListPage: NEEDS UPDATE (1 location)
- ✅ Navigation: ALREADY GOOD

### Recommendation:
**Implement Option 1 (Consistency Maksimal)** untuk:
- Better UX
- Clear focus on praktikum
- Eliminate confusion
- Professional consistency

**Next Step:** Tunggu approval user, lalu implement perubahan.

---

**Date:** 2025-12-09
**Reviewer:** Claude Code
**Status:** ⏳ Waiting for User Approval
