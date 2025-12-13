# 🔧 FIX: Jadwal Tidak Muncul di Kehadiran Dropdown

## ❌ MASALAH YANG DITEMUKAN

User mengatakan:
> "Dosen sudah buat jadwal tapi tidak ada muncul pilihan jadwal di kehadiran page"

**ROOT CAUSE ANALYSIS:**

Saat dosen membuat kelas baru via JadwalPage, kelas di-create tanpa link ke dosen (dosen_id = null):

```typescript
// ❌ BEFORE - JadwalPage.tsx LINE 320
const newKelas = await insert('kelas', {
  // ... fields ...
  dosen_id: null,  // ❌ MASALAH! Tidak ter-link ke dosen
  // ...
});
```

Tapi saat load jadwal di KehadiranPage, sistem mencari kelas berdasarkan dosen_id:

```typescript
// KehadiranPage.tsx LINE 148
const { data: kelasData } = await supabase
  .from('kelas')
  .select('id, nama_kelas, mata_kuliah_id')
  .eq('dosen_id', user?.dosen?.id!);  // ← Cari kelas yang ada dosen_id
```

**Hasil:**
- Kelas tidak ter-filter (karena dosen_id = null)
- Jadwal tidak muncul di dropdown
- KehadiranPage tidak ada mahasiswa yg muncul

---

## ✅ FIX DITERAPKAN

**File: `src/pages/dosen/JadwalPage.tsx`**

### PERUBAHAN 1: Import supabase (LINE 84)
```typescript
import { supabase } from '@/lib/supabase/client';
```

### PERUBAHAN 2: getOrCreateKelas function (LINE 315-330)
**BEFORE:**
```typescript
const getOrCreateKelas = async (namaKelas: string, mataKuliahId: string) => {
  // ... existing ...
  try {
    const currentYear = new Date().getFullYear();
    const newKelas = await insert('kelas', {
      // ... fields ...
      dosen_id: null,  // ❌ WRONG
```

**AFTER:**
```typescript
const getOrCreateKelas = async (namaKelas: string, mataKuliahId: string) => {
  // ... existing ...
  try {
    // ✅ Get current dosen ID
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("User tidak terautentikasi");

    const { data: dosenData, error: dosenError } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (dosenError || !dosenData) {
      throw new Error("Data dosen tidak ditemukan. Pastikan Anda login sebagai dosen.");
    }

    const currentYear = new Date().getFullYear();
    const newKelas = await insert('kelas', {
      // ... fields ...
      dosen_id: dosenData.id,  // ✅ CORRECT - Link ke dosen!
```

---

## 🔄 FLOW SETELAH FIX

```
1. Dosen buat Jadwal → Pilih atau Buat Kelas
                      ↓
2. System get dosen ID dari auth user
                      ↓
3. Create kelas dengan dosen_id = current dosen
                      ↓
4. Dosen buka Kehadiran
                      ↓
5. System load kelas WHERE dosen_id = current dosen
                      ↓
6. System load jadwal dari kelas itu
                      ↓
7. ✅ Jadwal MUNCUL di dropdown!
                      ↓
8. Dosen select jadwal
                      ↓
9. ✅ Mahasiswa auto-load dari enrollment
```

---

## 📋 VERIFICATION STEPS

### Step 1: Verify Code Fix
```bash
grep -n "dosen_id: dosenData.id" src/pages/dosen/JadwalPage.tsx
# Should show: LINE 333 → ✅
```

### Step 2: Build Success
```bash
npm run build
# Should compile without errors ✅
```

### Step 3: Test in App
1. **Login as Dosen**
2. **Go to JADWAL page**
3. **Click "Tambah Jadwal"**
4. **Fill form and CREATE new kelas**
5. **Save jadwal**
6. **Go to KEHADIRAN page**
7. **Check "Pilih Jadwal Praktikum" dropdown**
   - ✅ Should see: "Kelas A | Practical XYZ | 27-Nov-2024 09:00"
8. **Select jadwal**
   - ✅ Should see: Mahasiswa auto-loaded from enrollment
9. **Input kehadiran**
   - ✅ Should work normally

---

## 🔍 TECHNICAL DETAILS

### Database Flow
```
kehadiran → jadwal_praktikum → kelas (dosen_id linked)
                                 ↓
                        KehadiranPage filter
                        .eq('dosen_id', user.dosen_id)
                                 ↓
                        ✅ Kelas appears!
```

### Code Changes Summary
- **Files Modified:** 1 (JadwalPage.tsx)
- **Functions Modified:** 1 (getOrCreateKelas)
- **Lines Added:** 13 (get dosen data)
- **Lines Changed:** 1 (dosen_id: null → dosen_id: dosenData.id)
- **Build Status:** ✅ Success
- **Type Errors:** 0

---

## 🎯 RESULT

| Aspect | Before | After |
|--------|--------|-------|
| **Kelas dosen_id** | null (❌) | dosenData.id (✅) |
| **Kehadiran filter** | No results | Works correctly |
| **Jadwal dropdown** | Empty | Shows all jadwal |
| **Mahasiswa load** | N/A | Auto-loads |
| **Kehadiran input** | Not possible | Works perfect |

---

## ⚠️ IMPORTANT NOTE

**User harus test di aplikasi:**
1. Test create jadwal dengan kelas baru
2. Verify jadwal muncul di kehadiran dropdown
3. Verify mahasiswa auto-load ketika jadwal dipilih
4. Test input kehadiran

Jika ada error, hubungi developer untuk debugging lebih lanjut.

---

## 📝 ADDITIONAL NOTES

### Why This Fix Works
- Dosen adalah creator of jadwal
- Jadwal tertaut ke kelas
- Kelas sekarang tertaut ke dosen (via dosen_id)
- KehadiranPage bisa filter kelas by dosen_id
- Jadwal akan muncul di dropdown

### Future Improvement (Optional)
- Add validation: Prevent edit kelas jika sudah ada jadwal
- Add warning: "Kelas sudah ada dengan nama ini"
- Add feature: Share kelas antar dosen

---

## ✅ STATUS

**FIX COMPLETED:** ✅
- Code modified
- Build success
- Ready for user testing

**NEXT STEP:** User tests in app and confirms fix works
