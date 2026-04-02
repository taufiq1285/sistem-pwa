# 🐛 DEBUG: Mata Kuliah Stuck Saat Menyimpan

**Problem**: Button "Menyimpan..." stuck terus, tidak ada error di console

---

## 🔍 STEP 1: Check Browser Network Tab

### Buka Chrome DevTools:
1. Tekan **F12** atau **Ctrl+Shift+I**
2. Klik tab **"Network"**
3. Filter: Klik **"Fetch/XHR"**
4. Coba save mata kuliah lagi
5. Lihat request API yang pending

### ❓ Yang Harus Dicek:

**A. Apakah ada request ke `/rest/v1/mata_kuliah`?**
- ✅ Ada → Lanjut ke B
- ❌ Tidak ada → Problem di frontend (permission middleware)

**B. Status request:**
- **Pending** (terus menerus) → RLS Policy hang
- **400/401/403** → Permission/Auth issue
- **500** → Server error
- **504 Gateway Timeout** → Query terlalu lama

**C. Response (jika ada):**
- Klik request → Tab "Response"
- Copy error message (jika ada)

---

## 🔧 STEP 2: Quick Fix - Bypass Permission Check (Temporary)

**File**: `src/lib/api/mata-kuliah.api.ts`

### Option A: Direct Export (Temporary Debug)

**Line 286-289**, tambahkan export bypass:

```typescript
// 🔒 PROTECTED: Requires manage:mata_kuliah permission
export const createMataKuliah = requirePermission(
  "manage:mata_kuliah",
  createMataKuliahImpl,
);

// ⚠️ TEMPORARY DEBUG: Direct export (bypass permission)
export const createMataKuliahDebug = createMataKuliahImpl;
```

**Line 327-330**, tambahkan export bypass:

```typescript
// 🔒 PROTECTED: Requires manage:mata_kuliah permission
export const updateMataKuliah = requirePermission(
  "manage:mata_kuliah",
  updateMataKuliahImpl,
);

// ⚠️ TEMPORARY DEBUG: Direct export (bypass permission)
export const updateMataKuliahDebug = updateMataKuliahImpl;
```

### Option B: Update Page to Use Debug Version

**File**: `src/pages/admin/MataKuliahPage.tsx`

**Line 32-36**, ganti import:

```typescript
// BEFORE:
import {
  getMataKuliah,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
} from "@/lib/api/mata-kuliah.api";

// AFTER (TEMPORARY DEBUG):
import {
  getMataKuliah,
  createMataKuliahDebug as createMataKuliah,
  updateMataKuliahDebug as updateMataKuliah,
  deleteMataKuliah,
} from "@/lib/api/mata-kuliah.api";
```

**Coba lagi save mata kuliah**:
- ✅ Berhasil → Problem di permission middleware
- ❌ Masih stuck → Problem di RLS policy

---

## 🔍 STEP 3: Check RLS Policy dengan SQL

Buka **Supabase SQL Editor**, run query ini:

### A. Check is_admin() Function

```sql
-- Test is_admin() function
SELECT
    auth.uid() as current_user_id,
    (SELECT role FROM users WHERE id = auth.uid()) as user_role,
    is_admin() as is_admin_result;
```

**Expected**:
```
current_user_id | user_role | is_admin_result
----------------|-----------|----------------
[your-id]       | admin     | true
```

**Jika `is_admin_result = false`** → Problem di role detection!

---

### B. Test INSERT Permission Directly

```sql
-- Test insert mata kuliah (bypass API)
INSERT INTO mata_kuliah (
    kode_mk,
    nama_mk,
    sks,
    semester,
    program_studi
) VALUES (
    'TEST001',
    'Test Mata Kuliah',
    3,
    1,
    'D3 Kebidanan'
);
```

**Hasil**:
- ✅ Success → RLS OK, problem di API layer
- ❌ Error: "new row violates row-level security" → RLS policy problem
- ⏳ Stuck/hanging → RLS policy query terlalu lama (infinite loop?)

---

### C. Check Existing Policies

```sql
-- List all policies for mata_kuliah
SELECT
    policyname,
    cmd as operation,
    qual as using_clause
FROM pg_policies
WHERE tablename = 'mata_kuliah'
ORDER BY cmd, policyname;
```

**Expected**: Minimal ada `mata_kuliah_insert_admin`

---

## 🔧 STEP 4: Fix RLS Policy (If Needed)

Jika RLS policy hang, run fix ini:

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "mata_kuliah_insert_admin" ON mata_kuliah;
DROP POLICY IF EXISTS "mata_kuliah_update_admin" ON mata_kuliah;

-- Recreate simple policies
CREATE POLICY "mata_kuliah_insert_admin" ON mata_kuliah
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "mata_kuliah_update_admin" ON mata_kuliah
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
```

**Kenapa fix ini?**
- Ganti `is_admin()` dengan direct query
- Menghindari potential infinite loop di helper function
- Lebih cepat (inline query)

---

## 🔍 STEP 5: Check Permission Middleware

**File**: `src/lib/middleware/permission.middleware.ts`

Cek apakah ada infinite loop di `requirePermission`:

```typescript
// Find this function and check for:
// 1. Recursive calls
// 2. Infinite while loops
// 3. Unresolved promises
```

**Common Issue**: Permission check call API → API call permission check → Infinite loop

---

## 🧪 STEP 6: Test Alternative Approach

### Quick Test via Console

Buka browser console (F12 → Console), run:

```javascript
// Import API
import { supabase } from '@/lib/supabase/client';

// Direct insert (bypass all middleware)
const { data, error } = await supabase
  .from('mata_kuliah')
  .insert({
    kode_mk: 'CONSOLE001',
    nama_mk: 'Console Test',
    sks: 3,
    semester: 1,
    program_studi: 'D3 Kebidanan'
  })
  .select();

console.log('Result:', { data, error });
```

**Hasil**:
- ✅ Success → Problem di API wrapper/middleware
- ❌ Error → Problem di RLS atau auth

---

## 📊 TROUBLESHOOTING DECISION TREE

```
Stuck Menyimpan
    │
    ├─→ Network Tab: Request pending?
    │   ├─→ YES → RLS Policy hang
    │   │   └─→ Fix: Run STEP 4 (recreate policies)
    │   │
    │   └─→ NO → Permission middleware hang
    │       └─→ Fix: Run STEP 2 (bypass permission)
    │
    ├─→ Network Tab: 401/403 error?
    │   └─→ Fix: Check user role di database
    │
    └─→ Network Tab: 500 error?
        └─→ Check Supabase logs
```

---

## ✅ QUICK FIX SUMMARY

### Jika RLS Policy Problem:
```sql
-- Recreate policies (run di Supabase SQL Editor)
-- Copy dari STEP 4
```

### Jika Permission Middleware Problem:
```typescript
// Bypass permission (temporary)
// Copy dari STEP 2
```

---

## 📞 NEXT STEPS

1. **Run STEP 1** (Network tab)
2. **Kasih tau hasil**:
   - Request status (pending/error)
   - Error message (jika ada)
   - Screenshot network tab

3. Saya akan kasih fix yang spesifik! 🔧

---

**Created**: 2025-12-09
**File**: `DEBUG_MATA_KULIAH_STUCK.md`
