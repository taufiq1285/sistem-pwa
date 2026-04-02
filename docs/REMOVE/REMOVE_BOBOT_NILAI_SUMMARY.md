# 📝 Summary: Remove Bobot Nilai dari Role Mahasiswa

**Date:** 2025-12-09
**Reason:** Setiap dosen memiliki bobot penilaian yang berbeda-beda

---

## 🎯 Rationale

### Kenapa Dihapus:

1. **Bobot Nilai Bervariasi per Dosen**
   - Setiap dosen bisa punya sistem penilaian sendiri
   - Bobot bisa berbeda antar kelas/mata kuliah
   - Tidak ada standar bobot yang universal

2. **Mahasiswa Tidak Perlu Tahu Detail Bobot**
   - Mahasiswa cukup lihat **nilai akhir** dan **grade**
   - Detail perhitungan adalah hak dosen
   - Fokus mahasiswa: hasil, bukan cara hitung

3. **Avoid Confusion**
   - Menampilkan bobot fixed (15%, 20%, dll) akan misleading
   - Mahasiswa akan komplain jika bobot actual berbeda
   - Better not show than show wrong information

---

## ✅ Changes Made

### File Modified: `src/pages/mahasiswa/NilaiPage.tsx`

**BEFORE (Line 473-504):**
```tsx
{/* Legend */}
<Card>
  <CardHeader>
    <CardTitle>Keterangan Bobot Nilai</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
      <div><span className="font-semibold">Kuis:</span> 15%</div>
      <div><span className="font-semibold">Tugas:</span> 20%</div>
      <div><span className="font-semibold">UTS:</span> 25%</div>
      <div><span className="font-semibold">UAS:</span> 30%</div>
      <div><span className="font-semibold">Praktikum:</span> 5%</div>
      <div><span className="font-semibold">Kehadiran:</span> 5%</div>
    </div>
    <div className="mt-4 text-sm text-gray-600">
      Nilai Akhir = (Kuis × 15%) + (Tugas × 20%) + (UTS × 25%) +
                    (UAS × 30%) + (Praktikum × 5%) + (Kehadiran × 5%)
    </div>
  </CardContent>
</Card>
```

**AFTER:**
```tsx
{/* Card "Keterangan Bobot Nilai" removed */}
{/* Mahasiswa hanya lihat nilai akhir, tidak perlu tahu bobot detail */}
```

**Lines Removed:** 32 lines (473-504)

---

## 📊 What Mahasiswa Can Still See

### ✅ Information Available:

1. **Nilai Detail per Komponen:**
   - Nilai Kuis
   - Nilai Tugas
   - Nilai UTS
   - Nilai UAS
   - Nilai Praktikum
   - Nilai Kehadiran

2. **Nilai Akhir & Grade:**
   - Nilai Akhir (0-100)
   - Nilai Huruf (A, B, C, D, E)
   - Status (Lulus/Tidak Lulus)

3. **Summary Statistics:**
   - IPK/GPA
   - Total SKS
   - Distribusi Grade (berapa A, B, C, dll)

### ❌ Information Hidden:

- ❌ Bobot perhitungan (15%, 20%, 25%, dll)
- ❌ Formula perhitungan nilai akhir
- ❌ Detail bagaimana nilai dihitung

---

## 💡 Recommendation: Where to Show Bobot

### Option 1: Di Halaman Dosen (Per Kelas)

**Location:** `src/pages/dosen/PenilaianPage.tsx` atau Kelas Detail

**UI Suggestion:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Pengaturan Bobot Nilai - {kelas.nama_kelas}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Bobot Kuis (%)</label>
          <Input type="number" value={bobot.kuis} />
        </div>
        <div>
          <label>Bobot Tugas (%)</label>
          <Input type="number" value={bobot.tugas} />
        </div>
        {/* dst... */}
      </div>
      <Alert>
        Total Bobot: {totalBobot}% (harus 100%)
      </Alert>
    </div>
  </CardContent>
</Card>
```

### Option 2: Di Database (Per Kelas atau Per Mata Kuliah)

**Schema Extension:**
```sql
-- Add bobot columns to kelas table
ALTER TABLE kelas ADD COLUMN bobot_kuis INTEGER DEFAULT 15;
ALTER TABLE kelas ADD COLUMN bobot_tugas INTEGER DEFAULT 20;
ALTER TABLE kelas ADD COLUMN bobot_uts INTEGER DEFAULT 25;
ALTER TABLE kelas ADD COLUMN bobot_uas INTEGER DEFAULT 30;
ALTER TABLE kelas ADD COLUMN bobot_praktikum INTEGER DEFAULT 5;
ALTER TABLE kelas ADD COLUMN bobot_kehadiran INTEGER DEFAULT 5;

-- Add constraint: total must be 100
ALTER TABLE kelas ADD CONSTRAINT bobot_total_check
CHECK (
  bobot_kuis + bobot_tugas + bobot_uts +
  bobot_uas + bobot_praktikum + bobot_kehadiran = 100
);
```

**Benefit:**
- ✅ Setiap kelas bisa punya bobot sendiri
- ✅ Dosen bisa customize per kelas
- ✅ Perhitungan nilai otomatis mengikuti bobot kelas

### Option 3: Default di Sistem, Customizable per Kelas

**Config File:** `src/config/grading.config.ts`
```typescript
export const DEFAULT_GRADING_WEIGHTS = {
  kuis: 15,
  tugas: 20,
  uts: 25,
  uas: 30,
  praktikum: 5,
  kehadiran: 5,
} as const;

// Validate total = 100
const total = Object.values(DEFAULT_GRADING_WEIGHTS).reduce((a, b) => a + b);
if (total !== 100) {
  throw new Error('Grading weights must total 100%');
}
```

---

## 🔄 Current Behavior

### Nilai Calculation (Backend):

Currently di `src/lib/validations/nilai.schema.ts` ada formula:

```typescript
// CURRENT: Hard-coded weights
export function calculateNilaiAkhir(nilai: Partial<Nilai>): number {
  const weights = {
    kuis: 0.15,
    tugas: 0.20,
    uts: 0.25,
    uas: 0.30,
    praktikum: 0.05,
    kehadiran: 0.05,
  };

  return (
    (nilai.nilai_kuis || 0) * weights.kuis +
    (nilai.nilai_tugas || 0) * weights.tugas +
    (nilai.nilai_uts || 0) * weights.uts +
    (nilai.nilai_uas || 0) * weights.uas +
    (nilai.nilai_praktikum || 0) * weights.praktikum +
    (nilai.nilai_kehadiran || 0) * weights.kehadiran
  );
}
```

**Issue:** Weights are **hard-coded** globally!

---

## 🚀 Future Enhancement (Optional)

### Phase 1: Remove Hard-coded Weights ⚠️

**Current Problem:**
- All kelas use same weights (15%, 20%, 25%, 30%, 5%, 5%)
- Dosen cannot customize

**Proposed Solution:**
1. Add `bobot_*` columns to `kelas` table
2. Create dosen UI to set custom weights per kelas
3. Update calculation to use kelas-specific weights

### Phase 2: Show Bobot to Mahasiswa (Per Kelas) ℹ️

**Only after Phase 1**, optionally show bobot **specific to each kelas**:

```tsx
// In NilaiPage.tsx - per row
<TableRow>
  <TableCell>Kelas PWA-A</TableCell>
  <TableCell>
    <Button variant="ghost" size="sm">
      Lihat Bobot
    </Button>
  </TableCell>
</TableRow>

// Dialog shows kelas-specific weights
<Dialog>
  <DialogTitle>Bobot Penilaian - PWA-A</DialogTitle>
  <DialogContent>
    Kuis: {kelas.bobot_kuis}%
    Tugas: {kelas.bobot_tugas}%
    {/* etc */}
  </DialogContent>
</Dialog>
```

**Benefit:**
- ✅ Mahasiswa tahu bobot **yang actual dipakai**
- ✅ Per kelas, bukan global
- ✅ Accurate information

---

## ✅ Verification

### What to Test:

1. **Mahasiswa Login → Nilai Page**
   - ✅ No "Keterangan Bobot Nilai" card
   - ✅ Still see nilai detail (kuis, tugas, uts, uas, dll)
   - ✅ Still see nilai akhir & grade
   - ✅ Still see distribusi nilai

2. **UI Cleaner**
   - ✅ Less clutter
   - ✅ Focus on actual grades
   - ✅ No misleading information

3. **No Broken Tests**
   - ✅ UI tests still pass
   - ✅ No component errors

---

## 📋 Checklist

### Completed ✅
- [x] Remove "Keterangan Bobot Nilai" card from NilaiPage.tsx
- [x] Verify no other mahasiswa pages show bobot
- [x] Document removal reason
- [x] Suggest future enhancements

### Not Changed (OK) ✅
- [x] Nilai calculation logic (still works with current weights)
- [x] Mahasiswa can still see all nilai components
- [x] Nilai akhir still displayed correctly
- [x] Grade distribution still shown

### Future Work (Optional) 📝
- [ ] Add bobot columns to kelas table
- [ ] Create dosen UI to set custom weights
- [ ] Update calculation to use kelas-specific weights
- [ ] Optionally show kelas-specific bobot to mahasiswa

---

## 📝 Notes

**Design Philosophy:**
- Mahasiswa = **Consumer** of grades (lihat hasil)
- Dosen = **Producer** of grades (set rules)
- Bobot = **Dosen's domain**, not mahasiswa's concern

**User Experience:**
- Simpler is better
- Show what matters: hasil akhir
- Hide implementation details: cara hitung

**Data Integrity:**
- Current: Bobot hard-coded (consistent but inflexible)
- Future: Bobot per kelas (flexible and accurate)

---

**Status:** ✅ **COMPLETED**
**Impact:** Positive - Cleaner UI, no misleading info
**Breaking Change:** No - Only removed display, calculation unchanged

---

**Created:** 2025-12-09
**Version:** 1.0
