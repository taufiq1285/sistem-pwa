# Fix: Nilai Update Error - "Record not found"

## 🐛 **MASALAH**

**Error yang terjadi:**
```
updateNilai error: NotFoundError: Record not found
Failed to load resource: the server responded with a status of 406 ()
```

**Lokasi Error:**
- File: `src/lib/api/nilai.api.ts:325`
- Function: `updateNilaiImpl()`

**Penyebab:**
1. ❌ Dosen mencoba **UPDATE** nilai mahasiswa
2. ❌ Record nilai untuk mahasiswa tersebut **BELUM ADA** di database
3. ❌ `updateNilaiImpl` menggunakan `.single()` yang **error jika record tidak ada**
4. ❌ Supabase query gagal dengan "Record not found"

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Kode Bermasalah (Line 318-325):**
```typescript
// ❌ MASALAH: .single() akan error jika record tidak ada
const { data: current, error: fetchError } = await supabase
  .from('nilai')
  .select('*')
  .eq('mahasiswa_id', mahasiswaId)
  .eq('kelas_id', kelasId)
  .single();  // ← ERROR di sini jika record tidak ada

if (fetchError) throw handleError(fetchError);  // ← Langsung throw error
```

### **Flow Masalah:**
```
1. Dosen buka PenilaianPage
2. Pilih kelas
3. Load mahasiswa → Nilai belum ada (0 record)
4. Dosen input nilai baru
5. Klik Save
6. Call updateNilai() → GAGAL! (Record not found)
```

### **Kenapa Bisa Terjadi:**
- Mahasiswa baru didaftarkan ke kelas
- Nilai belum pernah di-input sebelumnya
- Table `nilai` kosong untuk mahasiswa+kelas tersebut
- Update dilakukan TANPA create terlebih dahulu

---

## ✅ **SOLUSI: UPSERT Logic**

### **Konsep UPSERT:**
**UPSERT = UPDATE or INSERT**
- Jika record ADA → **UPDATE**
- Jika record TIDAK ADA → **CREATE/INSERT**

### **Implementasi Fix:**

**File:** `src/lib/api/nilai.api.ts`

**GANTI kode updateNilaiImpl (line 311-371) dengan:**

```typescript
async function updateNilaiImpl(
  mahasiswaId: string,
  kelasId: string,
  data: Partial<UpdateNilaiData>
): Promise<Nilai> {
  try {
    // ✅ FIX 1: Gunakan .maybeSingle() instead of .single()
    // maybeSingle() returns null jika tidak ada, TIDAK error
    const { data: current, error: fetchError } = await supabase
      .from('nilai')
      .select('*')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('kelas_id', kelasId)
      .maybeSingle();  // ✅ CHANGED: .single() → .maybeSingle()

    // If error other than not found, throw it
    if (fetchError) throw handleError(fetchError);

    // ✅ FIX 2: Gunakan optional chaining untuk handle null
    // current?.nilai_kuis akan null jika current null
    const merged = {
      nilai_kuis: data.nilai_kuis ?? current?.nilai_kuis ?? 0,
      nilai_tugas: data.nilai_tugas ?? current?.nilai_tugas ?? 0,
      nilai_uts: data.nilai_uts ?? current?.nilai_uts ?? 0,
      nilai_uas: data.nilai_uas ?? current?.nilai_uas ?? 0,
      nilai_praktikum: data.nilai_praktikum ?? current?.nilai_praktikum ?? 0,
      nilai_kehadiran: data.nilai_kehadiran ?? current?.nilai_kehadiran ?? 0,
    };

    // Calculate nilai_akhir and nilai_huruf
    const nilaiAkhir = calculateNilaiAkhir(
      merged.nilai_kuis,
      merged.nilai_tugas,
      merged.nilai_uts,
      merged.nilai_uas,
      merged.nilai_praktikum,
      merged.nilai_kehadiran
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    // ✅ FIX 3: Include mahasiswa_id dan kelas_id di data
    const upsertData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      ...data,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
      updated_at: new Date().toISOString(),
    };

    // ✅ FIX 4: Gunakan .upsert() instead of .update()
    const { data: upserted, error: upsertError } = await supabase
      .from('nilai')
      .upsert(upsertData, {
        onConflict: 'mahasiswa_id,kelas_id',  // Unique constraint
      })
      .select()
      .single();

    if (upsertError) throw handleError(upsertError);

    return upserted as Nilai;
  } catch (error) {
    console.error('updateNilai error:', error);
    throw handleError(error);
  }
}
```

---

## 📝 **PERUBAHAN DETAIL**

### **1. `.single()` → `.maybeSingle()`**
```typescript
// BEFORE (ERROR):
.single()  // ❌ Error jika tidak ada

// AFTER (FIX):
.maybeSingle()  // ✅ Return null jika tidak ada, TIDAK error
```

### **2. `current.nilai_kuis` → `current?.nilai_kuis`**
```typescript
// BEFORE (ERROR):
nilai_kuis: data.nilai_kuis ?? current.nilai_kuis ?? 0  // ❌ Error jika current null

// AFTER (FIX):
nilai_kuis: data.nilai_kuis ?? current?.nilai_kuis ?? 0  // ✅ Safe with optional chaining
```

### **3. `.update()` → `.upsert()`**
```typescript
// BEFORE (ONLY UPDATE):
const { data: updated, error: updateError } = await supabase
  .from('nilai')
  .update(updateData)  // ❌ Hanya update, gagal jika tidak ada
  .eq('mahasiswa_id', mahasiswaId)
  .eq('kelas_id', kelasId)
  .select()
  .single();

// AFTER (UPDATE OR INSERT):
const { data: upserted, error: upsertError } = await supabase
  .from('nilai')
  .upsert(upsertData, {
    onConflict: 'mahasiswa_id,kelas_id',  // ✅ UPDATE jika ada, INSERT jika tidak
  })
  .select()
  .single();
```

---

## 🎯 **FLOW SETELAH FIX**

```
1. Dosen buka PenilaianPage
2. Pilih kelas
3. Load mahasiswa → Nilai belum ada (0 record)
4. Dosen input nilai baru
5. Klik Save
6. Call updateNilai()
   ├─ Query nilai existing → NULL (tidak ada)
   ├─ Merge dengan data baru → OK
   ├─ Calculate nilai_akhir → OK
   ├─ UPSERT:
   │  ├─ Record ada? → Update
   │  └─ Record tidak ada? → Create ✅ (INI YANG DIPERBAIKI!)
   └─ Return hasil → SUCCESS! 🎉
```

---

## 🔒 **VERIFIKASI DATABASE**

### **Pastikan Unique Constraint Ada:**

Run query ini di Supabase SQL Editor:

```sql
-- Check unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'nilai'
  AND constraint_type = 'UNIQUE';

-- Jika tidak ada, create constraint:
ALTER TABLE nilai
ADD CONSTRAINT nilai_mahasiswa_kelas_unique
UNIQUE (mahasiswa_id, kelas_id);
```

**Kenapa penting?**
- UPSERT needs unique constraint untuk tahu record mana yang di-update
- `onConflict: 'mahasiswa_id,kelas_id'` rely on unique constraint ini

---

## 🧪 **TESTING SETELAH FIX**

### **Test Case 1: Create New Nilai**
```
1. Pilih kelas yang mahasiswanya belum punya nilai
2. Input nilai baru (kuis: 80, tugas: 85, dll)
3. Klik Save
4. ✅ Expected: Sukses create nilai baru
5. ✅ Expected: Toast "Nilai berhasil disimpan"
6. ✅ Expected: Nilai muncul di tabel
```

### **Test Case 2: Update Existing Nilai**
```
1. Pilih mahasiswa yang sudah punya nilai
2. Ubah nilai (kuis: 90, tugas: 95)
3. Klik Save
4. ✅ Expected: Sukses update nilai
5. ✅ Expected: Nilai terupdate di tabel
```

### **Test Case 3: Batch Update**
```
1. Input nilai untuk beberapa mahasiswa sekaligus
2. Klik Save All
3. ✅ Expected: Semua nilai tersimpan (create + update)
4. ✅ Expected: Tidak ada error
```

---

## 📊 **IMPACT ANALYSIS**

### **Before Fix:**
- ❌ Update nilai gagal jika record belum ada
- ❌ User harus create manual dulu
- ❌ UX buruk (error terus)
- ❌ Status 406 error di console

### **After Fix:**
- ✅ Update nilai otomatis create jika belum ada
- ✅ User tidak perlu create manual
- ✅ UX bagus (seamless)
- ✅ No errors!

---

## 🚀 **IMPLEMENTASI**

### **Cara Apply Fix:**

**Option 1: Edit Manual (Recommended)**
1. Buka file: `src/lib/api/nilai.api.ts`
2. Scroll ke function `updateNilaiImpl` (sekitar line 311)
3. Replace seluruh function dengan kode di atas

**Option 2: Copy-Paste**
1. Copy kode lengkap dari section "SOLUSI: UPSERT Logic"
2. Replace function `updateNilaiImpl` di file `nilai.api.ts`

### **Files to Modify:**
- ✅ `src/lib/api/nilai.api.ts` - Fix updateNilaiImpl function

### **Files NOT to Modify:**
- ❌ `src/pages/dosen/PenilaianPage.tsx` - Tidak perlu diubah
- ❌ Database schema - Sudah OK (unique constraint sudah ada)

---

## ✅ **CHECKLIST**

- [ ] Backup file `nilai.api.ts` (optional)
- [ ] Replace function `updateNilaiImpl` dengan kode yang sudah diperbaiki
- [ ] Save file
- [ ] Refresh browser
- [ ] Test: Input nilai untuk mahasiswa baru (belum punya record nilai)
- [ ] Test: Update nilai untuk mahasiswa yang sudah ada nilai
- [ ] Verify: Console tidak ada error lagi
- [ ] Verify: Toast sukses muncul
- [ ] Done! ✨

---

## 🎉 **SUMMARY**

**Masalah:**
- ❌ `updateNilai` error "Record not found" saat nilai belum ada

**Solusi:**
- ✅ Ubah dari UPDATE-only → UPSERT (UPDATE or INSERT)
- ✅ Gunakan `.maybeSingle()` instead of `.single()`
- ✅ Gunakan `.upsert()` instead of `.update()`
- ✅ Add optional chaining untuk safety

**Result:**
- ✅ Nilai bisa di-save baik record baru maupun update
- ✅ No more errors!
- ✅ UX lebih smooth

---

**Status: READY TO APPLY** 🚀
