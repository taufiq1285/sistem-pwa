# 🎓 Multi-Dosen Grading System

## 📋 Overview

Sistem ini memungkinkan **beberapa dosen yang mengajar mata kuliah yang sama** untuk saling akses dan menilai hasil kerja mahasiswa (laporan praktikum, kuis, dll).

### **Use Case:**

```
Mata Kuliah: "Praktikum Kimia Organik"
├── Kelas A1 (Dosen A - Dr. Siti)
│   └── 25 Mahasiswa
└── Kelas A2 (Dosen B - Dr. Budi)
    └── 30 Mahasiswa

Scenario:
- Dr. Siti membuat "Laporan Praktikum 1" untuk Kelas A1
- Dr. Budi juga mengajar mata kuliah yang sama (Praktikum Kimia Organik)
- ✅ Dr. Budi SEKARANG BISA lihat dan grading laporan dari Kelas A1
- ✅ Dr. Siti SEKARANG BISA lihat dan grading laporan dari Kelas A2
```

---

## 🏗️ Architecture

### **1. Database Schema Changes**

#### **Added Column: `kuis.mata_kuliah_id`**

```sql
ALTER TABLE kuis ADD COLUMN mata_kuliah_id UUID REFERENCES mata_kuliah(id);
```

**Purpose:** Link kuis directly to mata kuliah (independent dari kelas)

**Relationship:**

```
kuis
├── kelas_id → kelas (original - which class the kuis was created for)
├── dosen_id → dosen (original - who created the kuis)
└── mata_kuliah_id → mata_kuliah (NEW - allows multi-dosen access)
```

#### **Auto-Population Trigger**

```sql
CREATE TRIGGER trigger_auto_set_kuis_mata_kuliah
    BEFORE INSERT OR UPDATE ON kuis
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_kuis_mata_kuliah();
```

**Behavior:**

- Saat dosen buat kuis, `mata_kuliah_id` auto-populated dari `kelas.mata_kuliah_id`
- Backward compatible: existing kuis akan di-update via migration

---

### **2. Helper Function**

#### **`dosen_teaches_mata_kuliah(mata_kuliah_id UUID)`**

```sql
CREATE FUNCTION dosen_teaches_mata_kuliah(p_mata_kuliah_id UUID)
RETURNS BOOLEAN
```

**Logic:**

```sql
SELECT EXISTS (
    SELECT 1 FROM kelas
    WHERE mata_kuliah_id = p_mata_kuliah_id
    AND dosen_id = get_current_dosen_id()
    AND is_active = TRUE
)
```

**Returns:**

- `TRUE` → Dosen punya kelas aktif untuk mata kuliah ini
- `FALSE` → Dosen tidak mengajar mata kuliah ini

---

### **3. Updated RLS Policies**

#### **KUIS Table Policy**

```sql
CREATE POLICY "kuis_select_dosen" ON kuis
FOR SELECT USING (
    is_dosen() AND (
        dosen_id = get_current_dosen_id()  -- Own kuis
        OR
        dosen_teaches_mata_kuliah(mata_kuliah_id)  -- Co-teaching access
    )
);
```

**Access Rules:**

- ✅ Dosen can see **their own kuis** (created by them)
- ✅ Dosen can see **all kuis from mata kuliah they teach**

---

#### **ATTEMPT_KUIS Table Policy**

```sql
CREATE POLICY "attempt_kuis_select_dosen" ON attempt_kuis
FOR SELECT USING (
    is_dosen() AND kuis_id IN (
        SELECT id FROM kuis
        WHERE dosen_id = get_current_dosen_id()
        OR dosen_teaches_mata_kuliah(mata_kuliah_id)
    )
);
```

**Access Rules:**

- ✅ Dosen can see attempts from **their own kuis**
- ✅ Dosen can see attempts from **co-teaching mata kuliah**

---

#### **JAWABAN Table Policy (Grading Access)**

```sql
CREATE POLICY "jawaban_update_dosen" ON jawaban
FOR UPDATE USING (
    is_dosen() AND attempt_id IN (
        SELECT ak.id FROM attempt_kuis ak
        INNER JOIN kuis k ON ak.kuis_id = k.id
        WHERE k.dosen_id = get_current_dosen_id()
        OR dosen_teaches_mata_kuliah(k.mata_kuliah_id)
    )
);
```

**Access Rules:**

- ✅ Dosen can **grade jawaban** from their own kuis
- ✅ Dosen can **grade jawaban** from co-teaching mata kuliah
- ✅ Supports file upload grading (laporan praktikum)

---

## 📊 Dashboard View

### **`v_dosen_grading_access`**

View untuk dosen dashboard showing all work they can grade:

```sql
SELECT * FROM v_dosen_grading_access
WHERE kelas_dosen_user_id = auth.uid()
   OR creator_user_id = auth.uid();
```

**Columns:**

- `kuis_id`, `kuis_judul`, `kuis_deskripsi`
- `mata_kuliah_id`, `kode_mk`, `nama_mk`
- `kelas_id`, `nama_kelas`
- `creator_name` (who created the kuis)
- `kelas_dosen_name` (who teaches the kelas)
- `total_attempts`, `pending_grading`, `graded_count`

**Use Cases:**

1. Dosen dashboard: Show all kuis I can grade (own + co-teaching)
2. Filter by mata kuliah
3. Sort by pending_grading (prioritize ungraded work)

---

## 🔐 Security & Permissions

### **Who Can Grade What?**

| Role                  | Access Rule                                 | Example                                               |
| --------------------- | ------------------------------------------- | ----------------------------------------------------- |
| **Kuis Creator**      | ✅ Full access to their kuis + all attempts | Dr. Siti created "Laporan 1" → can grade all attempts |
| **Co-Teaching Dosen** | ✅ Can grade if teach same mata kuliah      | Dr. Budi teaches same MK → can grade "Laporan 1"      |
| **Other Dosen**       | ❌ No access                                | Dr. Ani teaches different MK → cannot grade           |
| **Admin**             | ✅ Full access to everything                | Can grade any attempt                                 |
| **Mahasiswa**         | ❌ Cannot grade                             | Can only submit                                       |

---

## 💡 Usage Examples

### **Example 1: Dosen Creates Kuis**

```typescript
// Frontend: QuizBuilder.tsx
const handleSave = async (data: CreateKuisData) => {
  await createKuis({
    judul: "Laporan Praktikum 1",
    kelas_id: "uuid-kelas-a1",
    dosen_id: "uuid-dr-siti",
    // mata_kuliah_id: AUTO-POPULATED via trigger!
  });
};
```

**Backend Magic:**

1. Trigger fires: `auto_set_kuis_mata_kuliah()`
2. Gets `mata_kuliah_id` from `kelas.mata_kuliah_id`
3. Saves to `kuis.mata_kuliah_id`

---

### **Example 2: Dosen Views Student Attempts**

```typescript
// Frontend: KuisResultsPage.tsx
const loadAttempts = async (kuisId: string) => {
  // API call automatically filtered by RLS
  const attempts = await getAttemptsByKuis(kuisId);
  // Returns attempts from:
  // 1. Own kuis
  // 2. Co-teaching mata kuliah
};
```

**RLS Check:**

```sql
-- Dr. Budi queries attempts for "Laporan 1" (created by Dr. Siti)
-- RLS checks:
1. Is Dr. Budi the creator? NO (Dr. Siti is creator)
2. Does Dr. Budi teach the same mata kuliah? YES
   → Access GRANTED ✅
```

---

### **Example 3: Dosen Grades File Upload**

```typescript
// Frontend: AttemptDetailPage.tsx
const handleGrade = async (
  jawabanId: string,
  poin: number,
  feedback: string
) => {
  await gradeAnswer(jawabanId, poin, true, feedback);
  // RLS checks if dosen teaches the mata kuliah
};
```

**RLS Flow:**

1. Get `jawaban.attempt_id`
2. Get `attempt_kuis.kuis_id`
3. Get `kuis.mata_kuliah_id`
4. Check: `dosen_teaches_mata_kuliah(mata_kuliah_id)`
5. Access granted if TRUE ✅

---

## 🎯 Benefits

### **For Dosen:**

- ✅ **Collaborative grading** - Share grading workload with co-lecturers
- ✅ **Standardization** - All dosen teaching same MK see same student work
- ✅ **Flexibility** - Can help grade when other dosen is unavailable

### **For Mahasiswa:**

- ✅ **Faster grading** - Multiple dosen can grade in parallel
- ✅ **Consistent feedback** - All dosen aligned on grading criteria

### **For Admin:**

- ✅ **Transparency** - Clear audit trail of who graded what
- ✅ **Scalability** - Support large mata kuliah with multiple sections

---

## 📝 Implementation Checklist

- [x] Create migration `70_multi_dosen_grading_access.sql`
- [x] Add `mata_kuliah_id` column to `kuis` table
- [x] Create `dosen_teaches_mata_kuliah()` helper function
- [x] Update RLS policies for `kuis`, `attempt_kuis`, `jawaban`
- [x] Create auto-population trigger
- [x] Create `v_dosen_grading_access` view
- [ ] Update TypeScript types (add `mata_kuliah_id` to `Kuis` interface)
- [ ] Update API documentation
- [ ] Update UI to show co-teaching status
- [ ] Add tests for multi-dosen grading scenarios

---

## 🧪 Testing Scenarios

### **Test 1: Basic Co-Teaching Access**

```sql
-- Setup
INSERT INTO mata_kuliah (id, kode_mk, nama_mk)
VALUES ('mk-1', 'KIM101', 'Praktikum Kimia');

INSERT INTO kelas (id, mata_kuliah_id, dosen_id, nama_kelas)
VALUES
  ('kelas-1', 'mk-1', 'dosen-a', 'Kelas A'),
  ('kelas-2', 'mk-1', 'dosen-b', 'Kelas B');

INSERT INTO kuis (id, kelas_id, dosen_id, mata_kuliah_id, judul)
VALUES ('kuis-1', 'kelas-1', 'dosen-a', 'mk-1', 'Laporan 1');

-- Test: Dosen B should see kuis created by Dosen A
SET LOCAL role TO 'dosen';
SET LOCAL request.jwt.claims TO '{"user_id": "dosen-b"}';

SELECT * FROM kuis WHERE id = 'kuis-1';
-- Expected: 1 row (access granted via co-teaching)
```

### **Test 2: Grading Permission**

```sql
-- Dosen B grades attempt from Dosen A's kuis
UPDATE jawaban
SET poin_diperoleh = 85, feedback = 'Bagus'
WHERE attempt_id IN (
  SELECT id FROM attempt_kuis WHERE kuis_id = 'kuis-1'
);
-- Expected: Success (RLS allows co-teaching grading)
```

### **Test 3: No Cross-MK Access**

```sql
-- Dosen C teaches different mata kuliah
INSERT INTO kelas (mata_kuliah_id, dosen_id, nama_kelas)
VALUES ('mk-2', 'dosen-c', 'Kelas C');

SET LOCAL request.jwt.claims TO '{"user_id": "dosen-c"}';

SELECT * FROM kuis WHERE id = 'kuis-1';
-- Expected: 0 rows (no access - different mata kuliah)
```

---

## 🔧 Maintenance

### **Adding New Dosen to Mata Kuliah**

```sql
-- Admin assigns new dosen to mata kuliah
INSERT INTO kelas (mata_kuliah_id, dosen_id, nama_kelas, tahun_ajaran)
VALUES ('mk-1', 'dosen-new', 'Kelas D', '2025/2026');

-- Dosen automatically gets grading access to all existing kuis
-- No additional configuration needed! ✅
```

### **Removing Dosen from Mata Kuliah**

```sql
-- Deactivate kelas
UPDATE kelas
SET is_active = FALSE
WHERE dosen_id = 'dosen-old' AND mata_kuliah_id = 'mk-1';

-- Dosen loses grading access automatically
-- (function checks is_active = TRUE)
```

---

## 📚 Related Documentation

- [ANALISIS_SISTEM_KEHADIRAN_DOSEN.md](./ANALISIS_SISTEM_KEHADIRAN_DOSEN.md) - Sistem kehadiran dengan multi-dosen
- [60_kelas_assignment_system.sql](./supabase/migrations/60_kelas_assignment_system.sql) - Kelas assignment system
- [21_enhanced_rls_policies.sql](./supabase/migrations/21_enhanced_rls_policies.sql) - Original RLS policies

---

## 🚀 Migration Instructions

### **Run Migration:**

```bash
# 1. Backup database first
pg_dump -h localhost -U postgres -d praktikum_db > backup_before_multi_dosen.sql

# 2. Run migration
psql -h localhost -U postgres -d praktikum_db -f supabase/migrations/70_multi_dosen_grading_access.sql

# 3. Verify
psql -h localhost -U postgres -d praktikum_db -c "SELECT COUNT(*) FROM kuis WHERE mata_kuliah_id IS NOT NULL;"
```

### **Rollback (if needed):**

```sql
-- Drop new objects
DROP VIEW IF EXISTS v_dosen_grading_access;
DROP TRIGGER IF EXISTS trigger_auto_set_kuis_mata_kuliah ON kuis;
DROP FUNCTION IF EXISTS auto_set_kuis_mata_kuliah();
DROP FUNCTION IF EXISTS dosen_teaches_mata_kuliah(UUID);

-- Remove column
ALTER TABLE kuis DROP COLUMN IF EXISTS mata_kuliah_id;

-- Restore old policies (from 21_enhanced_rls_policies.sql)
-- ... (restore original policies)
```

---

## ✅ Status

- **Migration:** ✅ Created (`70_multi_dosen_grading_access.sql`)
- **Database:** ⏳ Pending deployment
- **Backend:** ⏳ Types need update
- **Frontend:** ⏳ UI enhancement needed
- **Testing:** ⏳ Not yet tested
- **Documentation:** ✅ Complete

---

**Last Updated:** 2026-01-14
**Author:** GitHub Copilot
**Version:** 1.0.0
