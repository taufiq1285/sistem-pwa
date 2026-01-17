# 🔗 INTEGRATION CHECKLIST - Step-by-Step

## 🎯 PHASE 1: DATABASE SETUP (5 minutes)

### Step 1.1: Apply Migration

```bash
# ✅ Lokasi file: supabase/migrations/99_add_semester_progression_support.sql

Action:
1. Buka: https://app.supabase.com
2. Pilih project: sistem-praktikum-pwa
3. Go to: SQL Editor (sidebar kiri)
4. Click: "+ New Query"
5. Open file: supabase/migrations/99_add_semester_progression_support.sql
6. Copy semua content
7. Paste di SQL Editor
8. Click: "RUN" (top right)
9. Wait untuk "Success" notification
10. Check Tables: kelas, kelas_mahasiswa updated dengan column baru
11. Check Functions: suggest_kelas_for_semester exists
12. Check Tables: mahasiswa_semester_audit exists
```

**Verification:**

```sql
-- Run di Supabase SQL Editor untuk verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'kelas' AND column_name = 'min_semester';
-- Expected: 1 row with min_semester

SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'suggest_kelas_for_semester';
-- Expected: 1 row with function name
```

---

## 🎯 PHASE 2: ROUTE SETUP (2 minutes)

### Step 2.1: Find Router File

```typescript
// Find: src/App.tsx atau src/routes/admin.routes.ts
// atau main routing config file
```

### Step 2.2: Add Route

```typescript
import MahasiswaManagementPage from '@/pages/admin/MahasiswaManagementPage';

// Di dalam route array/config, tambahkan:
{
  path: "/admin/mahasiswa-management",
  element: <MahasiswaManagementPage />,
  requireAuth: true,
  roles: ["admin"],
  title: "Manajemen Mahasiswa"
}

// Jika menggunakan React Router:
{
  path: "mahasiswa-management",
  element: <MahasiswaManagementPage />,
  errorElement: <ErrorPage />
}
```

**Verification:**

```bash
# Test akses di browser:
http://localhost:5173/admin/mahasiswa-management

# Expected: Page loads tanpa 404 error
```

---

## 🎯 PHASE 3: NAVIGATION SETUP (1 minute)

### Step 3.1: Find Navigation Component

```typescript
// Find: src/components/layout/Sidebar.tsx
// atau: src/components/navigation/AdminNav.tsx
// atau: src/config/navigation.ts
```

### Step 3.2: Add Menu Item

**Option A - If using array config:**

```typescript
// Buka: src/config/adminNavigation.ts (atau similar)

export const adminNavigation = [
  // ... existing items ...
  {
    label: "Manajemen Mahasiswa",
    href: "/admin/mahasiswa-management",
    icon: "Users", // dari lucide-react
    description: "Update semester, kelola mahasiswa",
  },
];
```

**Option B - If hardcoded in JSX:**

```typescript
// Di Sidebar.tsx, tambahkan di navigation items:

<NavItem
  href="/admin/mahasiswa-management"
  icon={<Users size={20} />}
  label="Manajemen Mahasiswa"
  description="Update semester & kelola data mahasiswa"
/>
```

**Verification:**

```bash
# Login ke admin
# Check sidebar: harus muncul "Manajemen Mahasiswa"
# Click item: harus navigate ke /admin/mahasiswa-management
```

---

## 🎯 PHASE 4: COMPONENT VERIFICATION (2 minutes)

### Step 4.1: Verify Files Exist

```bash
ls -la src/components/admin/UpdateSemesterDialog.tsx
ls -la src/pages/admin/MahasiswaManagementPage.tsx
ls -la src/lib/api/mahasiswa-semester.api.ts
```

### Step 4.2: Check Imports

```bash
# Verify bisa di-import:
grep -r "import.*UpdateSemesterDialog" src/
grep -r "import.*MahasiswaManagementPage" src/
grep -r "import.*mahasiswa-semester" src/
```

**Expected output:** File paths exist tanpa error

---

## 🎯 PHASE 5: API VERIFICATION (3 minutes)

### Step 5.1: Test API Functions

```typescript
// File: src/lib/api/mahasiswa-semester.api.ts

// Verify functions exported:
export async function getMahasiswaSemester(mahasiswaId: string) {}
export async function getSemesterRecommendations(
  mahasiswaId: string,
  semesterBaru: number
) {}
export async function updateMahasiswaSemester(data: UpdateSemesterPayload) {}
export async function enrollToRecommendedClass(
  mahasiswaId: string,
  kelasId: string
) {}
export async function getMahasiswaSemesterHistory(mahasiswaId: string) {}
```

### Step 5.2: Test RPC Function

```typescript
// Di Supabase Dashboard → SQL Editor, test:

SELECT * FROM suggest_kelas_for_semester(
  p_angkatan := 2022,
  p_new_semester := 2,
  p_tahun_ajaran := '2024/2025'
);

-- Expected: Return list of kelas yang sesuai
```

---

## 🎯 PHASE 6: PERMISSION SETUP (1 minute)

### Step 6.1: Verify RLS Policies

```sql
-- Di Supabase Dashboard → SQL Editor

-- Check if user ada permission manage:mahasiswa
SELECT role_permissions FROM user_roles
WHERE role_id = 'admin'
AND permission = 'manage:mahasiswa';

-- Expected: At least 1 row
```

### Step 6.2: If Missing, Add Permission

```sql
-- Add permission untuk admin role:
INSERT INTO permissions (permission_name, description)
VALUES ('manage:mahasiswa', 'Can manage mahasiswa data and semester updates');

INSERT INTO role_permissions (role_id, permission)
VALUES ('admin', 'manage:mahasiswa');
```

---

## 🎯 PHASE 7: FEATURE TEST (5 minutes)

### Test 1: Navigate to Page

```
1. Login sebagai Admin
2. Click: Manajemen Mahasiswa (sidebar)
3. Page loads dengan table mahasiswa
4. Check: Filters visible (Search, Angkatan, Semester, Program)
```

### Test 2: Filter Mahasiswa

```
1. Search: "Siti" (if exists)
   → Table filtered, show hanya Siti
2. Angkatan: "2022"
   → Show mahasiswa dari 2022
3. Semester: "1"
   → Show mahasiswa semester 1
4. Click: "Clear"
   → Reset semua filter, show all
```

### Test 3: Update Semester

```
1. Find mahasiswa: "Siti" (Semester 1)
2. Click: ✎ (Edit button)
3. Dialog opens: UpdateSemesterDialog
   - Show Siti's info
   - Select Semester: 2
   - Click: "Update Semester"
4. Step 2 shows: Recommendations list
   - Select: Some kelas
   - Click: "Enroll ke Kelas Terpilih"
5. Step 3 shows: Success message
   - Click: "Selesai"
6. Back to table: Siti's semester now = 2 ✅
```

### Test 4: Audit Trail

```
1. Open browser DevTools → Network tab
2. Repeat Test 3 for different mahasiswa
3. Check mahasiswa_semester_audit table:

-- Di Supabase SQL Editor:
SELECT * FROM mahasiswa_semester_audit
ORDER BY updated_at DESC
LIMIT 5;

Expected: Latest updates visible
```

---

## 🎯 PHASE 8: DATA PREPARATION (10 minutes)

### Step 8.1: Create Test Kelas

```sql
-- Di Supabase SQL Editor, create test kelas:

INSERT INTO kelas (nama_kelas, min_semester, tahun_ajaran, dosen_id)
VALUES
  ('Kelas A S2 2022', 2, '2024/2025', NULL),
  ('Kelas B S2 2022', 2, '2024/2025', NULL),
  ('Kelas C S3 2022', 3, '2024/2025', NULL);
```

### Step 8.2: Verify Kelas Created

```sql
SELECT kelas_id, nama_kelas, min_semester FROM kelas
WHERE tahun_ajaran = '2024/2025';
-- Expected: 3 rows
```

### Step 8.3: Check Mahasiswa Data

```sql
SELECT m.mahasiswa_id, u.full_name, m.nim, m.angkatan, COUNT(DISTINCT km.kelas_id) as kelas_count
FROM mahasiswa m
JOIN users u ON m.user_id = u.user_id
LEFT JOIN kelas_mahasiswa km ON m.mahasiswa_id = km.mahasiswa_id
GROUP BY m.mahasiswa_id, u.full_name, m.nim, m.angkatan
LIMIT 10;

-- Expected: List mahasiswa with kelas count
```

---

## 🎯 PHASE 9: PRODUCTION CHECKLIST

### Before Launch:

- [ ] Migration applied ✅
- [ ] Route added to router ✅
- [ ] Navigation menu updated ✅
- [ ] Components verified ✅
- [ ] API functions working ✅
- [ ] RLS policies correct ✅
- [ ] Admin permission exists ✅
- [ ] Test kelas created ✅
- [ ] TC-1: Update single semester ✅
- [ ] TC-2: Smart recommendations ✅
- [ ] TC-3: No recommendations handling ✅
- [ ] TC-4: Audit trail logging ✅

### After Launch:

- [ ] Monitor error logs
- [ ] Check audit trail regularly
- [ ] Verify recommendations quality
- [ ] Collect user feedback
- [ ] Plan Phase 2 features (bulk update, etc)

---

## 🔄 ROLLBACK PLAN (If Needed)

```sql
-- Drop migration if needed:
DROP TABLE IF EXISTS mahasiswa_semester_audit;
DROP FUNCTION IF EXISTS suggest_kelas_for_semester(integer, integer, text);
DROP TRIGGER IF EXISTS track_semester_saat_enroll ON kelas_mahasiswa;
DROP FUNCTION IF EXISTS track_semester_saat_enroll_func();

ALTER TABLE kelas_mahasiswa DROP COLUMN IF EXISTS semester_saat_enroll;
ALTER TABLE kelas_mahasiswa DROP COLUMN IF EXISTS semester_terakhir;
ALTER TABLE kelas DROP COLUMN IF EXISTS min_semester;
```

---

## 📞 SUPPORT CONTACTS

| Issue              | Contact                                    | Status |
| ------------------ | ------------------------------------------ | ------ |
| DB Migration Error | Check Supabase Dashboard SQL Editor error  | Active |
| Route not working  | Check router configuration                 | Active |
| API error 500      | Check browser console & backend logs       | Active |
| RLS policy error   | Check Supabase Dashboard → Auth → Policies | Active |
| Permission denied  | Check user role & permissions              | Active |

---

**Status:** ✅ READY FOR DEPLOYMENT
**Estimated Time:** 30-40 minutes untuk complete semua phases
**Last Updated:** December 8, 2025
