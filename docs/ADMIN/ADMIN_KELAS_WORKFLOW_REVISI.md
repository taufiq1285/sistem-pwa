# 📋 Admin Kelas Workflow - Revisi Proposal

## 🎯 Tujuan Revisi

Sesuaikan workflow admin kelas agar:
1. **Admin TIDAK bisa buat kelas manual**
2. **Admin HANYA bisa select kelas dari mahasiswa yang sudah registrasi**
3. **Kelas auto-generated berdasarkan angkatan mahasiswa**

---

## 📊 WORKFLOW YANG DIUSULKAN

### SEKARANG (Current):
```
Admin → Input Kelas Manual (Nama, Kode, dll)
        ↓
     Create Kelas
        ↓
     Dosen → Select Kelas → Buat Jadwal
```

### YANG DIUSULKAN (Better):
```
Mahasiswa Register (NIM, Angkatan 2022/2023/2024)
        ↓
  Auto-Generate Kelas berdasarkan Angkatan
  (Kelas A - 2022, Kelas B - 2023, Kelas C - 2024)
        ↓
  Admin → View List Kelas (readonly)
       OR
        → Link Mahasiswa ke Kelas
        ↓
     Dosen → Select Kelas → Buat Jadwal
```

---

## 🔄 DETAILED WORKFLOW

### STEP 1: Mahasiswa Registrasi
**Sudah ada di RegisterForm.tsx**

```
Input:
  - Full Name: "Siti Nurhaliza"
  - Email: "siti@mahasiswa.ac.id"
  - Password: ****
  - Role: "Mahasiswa"
  - NIM: "BD2321001"
  - Program Studi: "Kebidanan"
  - Angkatan: 2023  ← KEY FIELD!
  - Semester: 1

Output:
  → users table (email, password)
  → mahasiswa table (nim, program_studi, angkatan, semester)
```

---

### STEP 2: Auto-Generate Kelas (NEW)

**Trigger:** Saat mahasiswa pertama registrasi dengan angkatan baru

```sql
-- Jika tidak ada kelas untuk angkatan 2023, buat otomatis:
INSERT INTO kelas (
  nama_kelas,
  kode_kelas,
  mata_kuliah_id,
  tahun_ajaran,
  semester_ajaran,
  kuota
)
SELECT
  'Kelas ' || CASE
    WHEN angkatan = 2022 THEN 'A (Pin Merah)'
    WHEN angkatan = 2023 THEN 'B (Pin Kuning)'
    WHEN angkatan = 2024 THEN 'C (Pin Hijau)'
  END as nama_kelas,
  'KELAS-' || angkatan || '-' || CURRENT_DATE as kode_kelas,
  (SELECT id FROM mata_kuliah WHERE nama_mk = 'Praktikum Kebidanan'),
  '2024/2025',
  1,
  50
FROM (SELECT DISTINCT angkatan FROM mahasiswa)
WHERE NOT EXISTS (
  SELECT 1 FROM kelas WHERE tahun_ajaran = '2024/2025'
);
```

---

### STEP 3: Admin Link Mahasiswa ke Kelas (NEW)

**Interface yang diusulkan:**

```
Admin Panel → Kelas Management
  ├─ View Kelas List (readonly)
  │  └─ Kelas A (Pin Merah - 2022)
  │     ├─ Total Mahasiswa: 0
  │     ├─ Dosen: -
  │     └─ [Edit Dosen] [Add Mahasiswa]
  │
  └─ For each kelas → "Add Mahasiswa" Button
     └─ Dialog: Select Mahasiswa
        ├─ Filter by Angkatan
        ├─ Checkbox multiple select
        └─ [Save]

Result:
  → Insert into kelas_mahasiswa table
  → (kelas_id, mahasiswa_id, is_active=true)
```

---

### STEP 4: Dosen Create Jadwal

**Same as before - tidak berubah**

```
Dosen → JADWAL page
      → "Tambah Jadwal"
      → SELECT Kelas (dari dropdown - only kelas with enrolled mahasiswa)
      → Fill tanggal, jam, lab
      → Save
```

---

## 📋 IMPLEMENTATION OPTIONS

### OPTION A: Manual Registration + Trigger (RECOMMENDED)
**Pros:**
- Mahasiswa control kapan registrasi
- Kelas auto-generate on demand
- Admin have flexibility

**Cons:**
- Need database trigger

**Effort:** MEDIUM

---

### OPTION B: Batch Upload Mahasiswa
**Pros:**
- Admin control
- All mahasiswa in system before semester

**Cons:**
- Admin must do upload
- Extra admin work

**Effort:** HIGH (need CSV upload feature)

---

### OPTION C: Hybrid (BEST)
**Pros:**
- Admin can pre-create kelas manually OR
- Kelas auto-generate on first mahasiswa registrasi
- Flexible!

**Cons:**
- More complex code

**Effort:** MEDIUM

---

## 🔧 CHANGES NEEDED

### 1. Update mahasiswa Table (OPTIONAL)
Add auto-link to kelas:

```typescript
// When mahasiswa registers, after user + mahasiswa created:
const { data: mhsData } = await supabase
  .from('mahasiswa')
  .select('id, angkatan')
  .eq('user_id', user.id)
  .single();

// Find or create kelas for this angkatan
const kelasName = getKelasNameByAngkatan(mhsData.angkatan);
const { data: kelas } = await supabase
  .from('kelas')
  .select('id')
  .eq('tahun_ajaran', '2024/2025')
  .ilike('nama_kelas', `%${kelasName}%`)
  .single();

// Link mahasiswa to kelas
if (kelas) {
  await supabase
    .from('kelas_mahasiswa')
    .insert({
      kelas_id: kelas.id,
      mahasiswa_id: mhsData.id,
      is_active: true
    });
}
```

---

### 2. Create Admin Kelas Management Page (NEW)

**File:** `src/pages/admin/KelasManagementPage.tsx`

**Features:**
- List all kelas with angkatan
- View mahasiswa per kelas
- Add/Remove mahasiswa
- Assign dosen to kelas
- Auto-generate button (if needed)

---

### 3. Disable Manual Kelas Creation (REMOVE)

**Current:** Admin can create kelas via form
**New:** Remove this feature

**Files to update:**
- Remove kelas creation modal/form from admin
- Only allow View + Edit (assign dosen, add mahasiswa)

---

## 🎯 KEUNTUNGAN APPROACH INI

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| **Admin Effort** | Buat kelas manual | Just link mahasiswa |
| **Data Accuracy** | Bisa salah input | Auto from registrasi |
| **Mahasiswa** | Confusing (mana kelas mereka) | Clear (auto-linked) |
| **Dosen** | Ada kelas kosong | Semua kelas have mahasiswa |
| **Enrollment** | Manual | Auto |

---

## 📝 DETAILED ACTION PLAN

### Phase 1: Database Setup
- [ ] Add auto-trigger untuk create kelas (optional)
- [ ] Add kelas_mahasiswa auto-link saat registrasi

### Phase 2: Update Registration
- [ ] Modify `auth.api.ts` - Add auto-link mahasiswa to kelas
- [ ] Test: Registrasi mahasiswa 2023, verify linked to Kelas B

### Phase 3: Create Admin Page
- [ ] Create `KelasManagementPage.tsx`
- [ ] Features: View, Add mahasiswa, Assign dosen
- [ ] Test: Admin can manage kelas

### Phase 4: Remove Manual Creation
- [ ] Remove kelas creation form dari admin
- [ ] Keep only View + Edit

### Phase 5: Testing
- [ ] Test full workflow: Registrasi → Auto-link → Admin view → Dosen create jadwal
- [ ] Verify mahasiswa see correct jadwal

---

## 🧪 TEST SCENARIOS

### Scenario 1: Single Angkatan
```
1. Mahasiswa A registrasi (angkatan 2023)
   → Auto: Kelas B created? ✓
   → Auto: A linked to Kelas B? ✓

2. Mahasiswa B registrasi (angkatan 2023)
   → Auto: Link to same Kelas B? ✓
   → No duplicate Kelas B? ✓
```

### Scenario 2: Multiple Angkatan
```
1. A registrasi (angkatan 2022) → Kelas A created ✓
2. B registrasi (angkatan 2023) → Kelas B created ✓
3. C registrasi (angkatan 2024) → Kelas C created ✓

4. Admin view: See 3 kelas with correct angkatan ✓
```

### Scenario 3: Admin Management
```
1. Admin view Kelas A
2. Admin click "Add Mahasiswa"
3. Select 10 mahasiswa from 2022 angkatan
4. Save
5. Verify: All 10 linked to Kelas A ✓
```

---

## ❓ QUESTIONS FOR YOU

1. **Should kelas auto-generate** saat mahasiswa pertama registrasi?
   - YES → Auto-trigger (easier untuk user)
   - NO → Admin create (more control)

2. **Should admin ONLY link mahasiswa**, atau juga bisa:
   - Edit kelas nama/kode?
   - Delete kelas?
   - Create new kelas?

3. **Kapan jalanin** approach ini?
   - Sekarang?
   - Setelah kehadiran fix?

---

## 📎 RELATED FILES

- `src/components/forms/RegisterForm.tsx` - sudah ada angkatan input ✓
- `src/lib/api/auth.api.ts` - registerUser function (perlu update)
- `src/pages/admin/KelasPage.tsx` - (buat baru atau update existing)

---

Apa pendapat? Ini approach yang benar? Atau ada perubahan?
