# 🛡️ Potential Errors & Prevention Fixes
## Sistem Praktikum Kebidanan - Pre-Testing Audit

**Audit Date**: 2025-12-01
**Purpose**: Mencegah errors saat blackbox/whitebox testing
**Status**: 🟡 **NEEDS ATTENTION**

---

## 📋 Executive Summary

Ditemukan **10 potential errors** yang bisa muncul saat testing. Beberapa sudah ada handling, beberapa perlu diperbaiki untuk memperkuat aplikasi.

**Severity Breakdown**:
- 🔴 **CRITICAL**: 3 issues (must fix before testing)
- 🟡 **HIGH**: 4 issues (should fix to avoid common errors)
- 🟢 **MEDIUM**: 3 issues (good to have, enhance robustness)

---

## 🔴 CRITICAL ISSUES (Must Fix)

### Issue #1: Race Condition pada Peminjaman Approval
**File**: `src/lib/api/laboran.api.ts:352-413`
**Severity**: 🔴 **CRITICAL**

#### Problem:
Jika 2 laboran approve peminjaman yang sama secara bersamaan, bisa terjadi:
1. Laboran A check stok: 5 tersedia ✅
2. Laboran B check stok: 5 tersedia ✅ (bersamaan)
3. Laboran A approve: stok → 2 (pinjam 3)
4. Laboran B approve: stok → -1 (pinjam 3) ❌ NEGATIVE!

**Example Scenario**:
```
T0: Stok Phantom Bayi = 5 unit
T1: Laboran A check stok (5 >= 3) → OK
T1: Laboran B check stok (5 >= 3) → OK
T2: Laboran A approve → stok = 5-3 = 2
T3: Laboran B approve → stok = 2-3 = -1 ❌
```

**Root Cause**: Tidak ada locking mechanism atau atomic operation.

#### Prevention Fix:
Gunakan **database-level check** atau **transaction** untuk atomic operation.

**Option 1: Add Unique Constraint (RECOMMENDED)**
```sql
-- Migration: Add unique constraint untuk prevent double approval
ALTER TABLE peminjaman
  ADD CONSTRAINT peminjaman_status_check
  CHECK (
    status IN ('pending', 'approved', 'rejected', 'dipinjam', 'dikembalikan')
  );

-- Ensure only ONE approval per peminjaman
-- Already handled by update with .eq('status', 'pending')
```

**Option 2: Use Database Transaction** (Better)
```typescript
async function approvePeminjamanImpl(peminjamanId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 🔥 FIX: Use RPC function for atomic operation
    const { error } = await supabase.rpc('approve_peminjaman_atomic', {
      p_peminjaman_id: peminjamanId,
      p_approved_by: user.id
    });

    if (error) {
      // Check error message
      if (error.message.includes('Stok tidak cukup')) {
        throw new Error(error.message);
      }
      if (error.message.includes('already approved')) {
        throw new Error('Peminjaman sudah diapprove sebelumnya');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error approving peminjaman:', error);
    throw error;
  }
}
```

**Database Function** (PostgreSQL):
```sql
-- Migration: Create atomic approve function
CREATE OR REPLACE FUNCTION approve_peminjaman_atomic(
  p_peminjaman_id UUID,
  p_approved_by UUID
) RETURNS VOID AS $$
DECLARE
  v_inventaris_id UUID;
  v_jumlah_pinjam INTEGER;
  v_jumlah_tersedia INTEGER;
BEGIN
  -- Step 1: Lock peminjaman row (prevent concurrent approval)
  SELECT inventaris_id, jumlah_pinjam
  INTO v_inventaris_id, v_jumlah_pinjam
  FROM peminjaman
  WHERE id = p_peminjaman_id
  AND status = 'pending'
  FOR UPDATE; -- LOCK ROW

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peminjaman not found or already approved';
  END IF;

  -- Step 2: Lock and check inventaris stock
  SELECT jumlah_tersedia
  INTO v_jumlah_tersedia
  FROM inventaris
  WHERE id = v_inventaris_id
  FOR UPDATE; -- LOCK ROW

  IF v_jumlah_tersedia < v_jumlah_pinjam THEN
    RAISE EXCEPTION 'Stok tidak cukup! Tersedia: %, Diminta: %',
      v_jumlah_tersedia, v_jumlah_pinjam;
  END IF;

  -- Step 3: Update peminjaman status
  UPDATE peminjaman
  SET
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW()
  WHERE id = p_peminjaman_id
  AND status = 'pending'; -- Double check

  -- Step 4: Decrease stock (atomic)
  UPDATE inventaris
  SET jumlah_tersedia = jumlah_tersedia - v_jumlah_pinjam
  WHERE id = v_inventaris_id;

  -- Commit transaction automatically
END;
$$ LANGUAGE plpgsql;
```

**Test Scenario**:
```typescript
// Simulate concurrent approval
const approveA = approvePeminjaman('peminjaman-1');
const approveB = approvePeminjaman('peminjaman-1');

await Promise.all([approveA, approveB]);
// Expected: One succeeds, one throws "already approved"
```

**Priority**: 🔴 **CRITICAL** - Fix sebelum production
**Estimated Fix Time**: 30 minutes (create migration + update function)

---

### Issue #2: NULL Pointer Exception pada User Mapping
**File**: `src/lib/api/kelas.api.ts:414-420`
**Severity**: 🟡 **HIGH**

#### Problem:
```typescript
// Line 405: Filter null user_ids
const userIds = mahasiswaData.map(m => m.user_id).filter(Boolean);

// Line 414: Create map
const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

// Line 419: Fallback ada, tapi...
users: usersMap.get(m.user_id) || { full_name: '-', email: '-' }
```

**Scenario yang bisa error**:
1. Mahasiswa dengan `user_id` = null tidak di-query
2. Tapi saat mapping, tetap coba get dari usersMap
3. Fallback ke `{ full_name: '-', email: '-' }` ✅ (sudah OK)

**Actually**: Ini **SUDAH OK** karena ada fallback! ✅

Tapi bisa diperbaiki untuk lebih robust:

```typescript
return mahasiswaData.map(m => ({
  id: m.id,
  nim: m.nim,
  // ✅ IMPROVEMENT: Handle null user_id explicitly
  users: m.user_id
    ? (usersMap.get(m.user_id) || { full_name: 'Unknown User', email: '-' })
    : { full_name: 'No User Account', email: '-' }
}));
```

**Priority**: 🟢 **LOW** - Already has fallback, optional improvement
**Estimated Fix Time**: 5 minutes

---

### Issue #3: Rollback Missing pada Peminjaman Approval
**File**: `src/lib/api/laboran.api.ts:401-408`
**Severity**: 🟡 **MEDIUM**

#### Problem:
```typescript
// Step 3: Update peminjaman status
await supabase.update({ status: 'approved' }) // ✅ SUCCESS

// Step 4: Decrease stock
const { error: stockError } = await supabase.update({ jumlah_tersedia: newStock })

if (stockError) throw stockError; // ❌ NO ROLLBACK!
// Peminjaman status sudah 'approved', tapi stok tidak berkurang
```

**Scenario**:
```
1. Peminjaman status → 'approved' ✅
2. Update inventaris stok → FAILED ❌ (network error, constraint, etc)
3. Throw error
Result: Peminjaman approved tapi stok tidak berkurang! Inconsistent state!
```

#### Prevention Fix:
Menggunakan **RPC function** (Option 2 di Issue #1) akan solve ini karena atomik.

Atau, add manual rollback:

```typescript
async function approvePeminjamanImpl(peminjamanId: string): Promise<void> {
  try {
    // ... validations ...

    // Step 3: Update peminjaman
    const { error: updateError } = await supabase
      .update({ status: 'approved' })
      .eq('id', peminjamanId);

    if (updateError) throw updateError;

    // Step 4: Decrease stock
    const { error: stockError } = await supabase
      .update({ jumlah_tersedia: newStock })
      .eq('id', inventaris_id);

    if (stockError) {
      // 🔥 FIX: Rollback peminjaman status
      await supabase
        .from('peminjaman')
        .update({
          status: 'pending',
          approved_by: null,
          approved_at: null
        })
        .eq('id', peminjamanId);

      throw new Error('Failed to update stock. Peminjaman approval rolled back.');
    }
  } catch (error) {
    console.error('Error approving peminjaman:', error);
    throw error;
  }
}
```

**Better Solution**: Use database transaction (RPC function) untuk atomic operation.

**Priority**: 🟡 **MEDIUM** - Can cause data inconsistency
**Estimated Fix Time**: 20 minutes (if manual rollback) or 30 minutes (if RPC)

---

## 🟡 HIGH PRIORITY ISSUES

### Issue #4: Insert with .single() Can Throw Unexpected Error
**File**: `src/lib/api/kelas.api.ts:498`, `src/lib/api/nilai.api.ts:299`, dll
**Severity**: 🟡 **HIGH**

#### Problem:
`.single()` expects exactly ONE row. If query returns:
- 0 rows → Throws error
- 2+ rows → Throws error

**Pada INSERT**:
```typescript
const { data: newMahasiswa, error } = await supabase
  .insert({ ... })
  .select('id')
  .single(); // ❌ Bisa throw jika insert fail

if (error) throw error;
mahasiswaId = newMahasiswa.id; // ❌ newMahasiswa could be null!
```

**Scenario**:
```
1. Insert mahasiswa
2. Database constraint violation (duplicate NIM, etc)
3. Insert returns 0 rows
4. .single() throws: "JSON object requested, multiple (or no) rows returned"
5. error !== null, tapi error message tidak jelas
```

#### Prevention Fix:
```typescript
// ✅ BETTER: Check error first, then check data
const { data: newMahasiswa, error: mahasiswaError } = await supabase
  .insert({
    user_id: newUser.user.id,
    nim: data.nim,
    angkatan: new Date().getFullYear(),
    program_studi: 'Unknown',
  })
  .select('id')
  .single();

if (mahasiswaError) {
  // Handle specific errors
  if (mahasiswaError.code === '23505') {
    throw new Error('NIM sudah terdaftar');
  }
  throw mahasiswaError;
}

if (!newMahasiswa) {
  throw new Error('Failed to create mahasiswa record');
}

mahasiswaId = newMahasiswa.id;
```

**Priority**: 🟡 **HIGH** - Common error during testing
**Estimated Fix Time**: 10 minutes per file (multiple files affected)

---

### Issue #5: Array.isArray Check Bisa Return Undefined
**File**: `src/lib/api/nilai.api.ts:299`
**Severity**: 🟢 **MEDIUM**

#### Problem:
```typescript
const created = await insert<Nilai>('nilai', nilaiData);
return Array.isArray(created) ? created[0] : created;
// ❌ created[0] could be undefined if array is empty!
```

**Scenario**:
```
insert() returns []
Array.isArray([]) → true
created[0] → undefined ❌
```

#### Prevention Fix:
```typescript
const created = await insert<Nilai>('nilai', nilaiData);

// ✅ FIX: Check array and length
if (Array.isArray(created)) {
  if (created.length === 0) {
    throw new Error('Failed to create nilai: No data returned');
  }
  return created[0];
}

return created;
```

**Priority**: 🟢 **MEDIUM** - Edge case, but good to handle
**Estimated Fix Time**: 5 minutes

---

### Issue #6: Missing Validation untuk Tanggal
**File**: Multiple API files (jadwal, peminjaman, etc)
**Severity**: 🟡 **HIGH**

#### Problem:
Tidak ada validasi untuk tanggal di masa lalu.

**Example**: `src/lib/api/jadwal.api.ts`
```typescript
// User bisa create jadwal di masa lalu
const data = {
  tanggal_praktikum: '2020-01-01', // ❌ Tahun 2020!
  jam_mulai: '08:00',
  jam_selesai: '10:00'
};

await createJadwal(data); // ✅ SUCCESS (WRONG!)
```

**Peminjaman**:
```typescript
const data = {
  tanggal_pinjam: '2020-01-01', // ❌ Masa lalu!
  tanggal_kembali_rencana: '2020-01-05'
};

// No validation!
```

#### Prevention Fix:

**For Jadwal**:
```typescript
async function createJadwalImpl(data: CreateJadwalData): Promise<Jadwal> {
  try {
    // ✅ VALIDATE: Tanggal tidak boleh masa lalu
    const tanggalPraktikum = data.tanggal_praktikum instanceof Date
      ? data.tanggal_praktikum
      : new Date(data.tanggal_praktikum);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    if (tanggalPraktikum < today) {
      throw new Error('Tanggal praktikum tidak boleh di masa lalu');
    }

    // ... rest of code ...
  }
}
```

**For Peminjaman** (in dosen.api.ts or peminjaman creation):
```typescript
// ✅ VALIDATE: Tanggal pinjam >= hari ini
const today = new Date().toISOString().split('T')[0];
if (data.tanggal_pinjam < today) {
  throw new Error('Tanggal peminjaman tidak boleh di masa lalu');
}

// ✅ VALIDATE: Tanggal kembali > tanggal pinjam
if (data.tanggal_kembali_rencana <= data.tanggal_pinjam) {
  throw new Error('Tanggal pengembalian harus setelah tanggal peminjaman');
}
```

**Priority**: 🟡 **HIGH** - Common user error
**Estimated Fix Time**: 15 minutes

---

### Issue #7: Email Duplicate pada User Creation
**File**: `src/lib/api/kelas.api.ts:458`
**Severity**: 🟡 **HIGH**

#### Problem:
Saat create mahasiswa baru via `createOrEnrollMahasiswa()`:
```typescript
const { data: newUser, error: signUpError } = await supabase.auth.signUp({
  email: data.email, // ❌ Bisa duplicate!
  password: defaultPassword,
  ...
});

if (signUpError) throw signUpError;
// ❌ Error message tidak jelas jika email sudah terdaftar
```

**Scenario**:
```
Admin enroll mahasiswa baru dengan email yang sudah ada
→ signUpError: "User already registered"
→ Generic error, tidak user-friendly
```

#### Prevention Fix:
```typescript
// ✅ CHECK: Email already exists before signup
const { data: existingUser } = await supabase
  .from('users')
  .select('id, email')
  .eq('email', data.email)
  .maybeSingle();

if (existingUser) {
  throw new Error(`Email ${data.email} sudah terdaftar di sistem`);
}

// Now safe to signup
const { data: newUser, error: signUpError } = await supabase.auth.signUp({
  email: data.email,
  password: defaultPassword,
  ...
});

if (signUpError) {
  // Handle specific Supabase auth errors
  if (signUpError.message.includes('already registered')) {
    throw new Error('Email sudah terdaftar');
  }
  throw signUpError;
}
```

**Priority**: 🟡 **HIGH** - Common during data entry
**Estimated Fix Time**: 10 minutes

---

## 🟢 MEDIUM PRIORITY ISSUES

### Issue #8: Batch Update Continues on Error
**File**: `src/lib/api/nilai.api.ts:387-414`
**Severity**: 🟢 **MEDIUM**

#### Current Behavior:
```typescript
async function batchUpdateNilaiImpl(batchData: BatchUpdateNilaiData): Promise<Nilai[]> {
  const results: Nilai[] = [];

  for (const item of batchData.nilai_list) {
    try {
      const updated = await updateNilaiImpl(item.mahasiswa_id, batchData.kelas_id, item);
      results.push(updated);
    } catch (error) {
      console.error('batchUpdateNilai - single update failed:', error);
      // ❌ Continue with other updates even if one fails
      // No info returned about which failed!
    }
  }

  return results; // ✅ Returns successful updates only
}
```

**Problem**: User tidak tahu mana yang fail!

#### Prevention Fix:
```typescript
// ✅ BETTER: Return both success and failures
interface BatchUpdateResult {
  success: Nilai[];
  failed: Array<{
    mahasiswa_id: string;
    error: string;
  }>;
}

async function batchUpdateNilaiImpl(
  batchData: BatchUpdateNilaiData
): Promise<BatchUpdateResult> {
  const success: Nilai[] = [];
  const failed: Array<{ mahasiswa_id: string; error: string }> = [];

  for (const item of batchData.nilai_list) {
    try {
      const updated = await updateNilaiImpl(
        item.mahasiswa_id,
        batchData.kelas_id,
        item
      );
      success.push(updated);
    } catch (error) {
      failed.push({
        mahasiswa_id: item.mahasiswa_id,
        error: (error as Error).message,
      });
    }
  }

  return { success, failed };
}
```

**Priority**: 🟢 **MEDIUM** - UX improvement
**Estimated Fix Time**: 15 minutes

---

### Issue #9: Large Batch Operations Bisa Timeout
**File**: `src/lib/api/nilai.api.ts:387`, other batch operations
**Severity**: 🟢 **MEDIUM**

#### Problem:
Batch update dengan loop sequential bisa sangat lambat untuk data besar.

**Example**:
```
Update nilai untuk 100 mahasiswa
→ 100 sequential API calls
→ 100 * 200ms = 20 seconds! (Could timeout)
```

#### Prevention Fix (Optional):
```typescript
// ✅ OPTIMIZE: Use Promise.all for parallel updates
async function batchUpdateNilaiImpl(
  batchData: BatchUpdateNilaiData
): Promise<BatchUpdateResult> {
  // Execute in parallel (max 10 concurrent)
  const BATCH_SIZE = 10;
  const success: Nilai[] = [];
  const failed: Array<{ mahasiswa_id: string; error: string }> = [];

  for (let i = 0; i < batchData.nilai_list.length; i += BATCH_SIZE) {
    const batch = batchData.nilai_list.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(item =>
        updateNilaiImpl(item.mahasiswa_id, batchData.kelas_id, item)
      )
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        failed.push({
          mahasiswa_id: batch[index].mahasiswa_id,
          error: result.reason.message,
        });
      }
    });
  }

  return { success, failed };
}
```

**Priority**: 🟢 **MEDIUM** - Performance optimization
**Estimated Fix Time**: 20 minutes

---

### Issue #10: Missing Input Sanitization
**File**: Multiple API files
**Severity**: 🟢 **MEDIUM**

#### Problem:
User input tidak di-sanitize sebelum masuk database.

**Example**: Keterangan, catatan, deskripsi, dll bisa berisi:
- HTML/Script tags: `<script>alert('xss')</script>`
- SQL injection attempts: `'; DROP TABLE users; --`
- Extra whitespace, newlines

#### Prevention Fix:
```typescript
// ✅ ADD: Input sanitization helper
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string | null | undefined): string | null {
  if (!input) return null;

  // Trim whitespace
  let sanitized = input.trim();

  // Remove HTML tags (keep plain text only)
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  return sanitized || null;
}

// Use in API functions
const nilaiData = {
  ...data,
  keterangan: sanitizeInput(data.keterangan), // ✅ Sanitized
};
```

**Note**: Database sudah protected by Supabase parameter binding (no SQL injection risk), tapi sanitization tetap good practice untuk XSS prevention di frontend.

**Priority**: 🟢 **MEDIUM** - Security hardening
**Estimated Fix Time**: 30 minutes (install library + apply to fields)

---

## 📊 Summary Table

| # | Issue | File | Severity | Impact | Fix Time | Priority |
|---|-------|------|----------|--------|----------|----------|
| 1 | Race condition peminjaman | laboran.api.ts:352 | 🔴 CRITICAL | Data corruption | 30min | **MUST FIX** |
| 2 | NULL pointer (fallback OK) | kelas.api.ts:414 | 🟢 LOW | None (has fallback) | 5min | Optional |
| 3 | No rollback on approval | laboran.api.ts:401 | 🟡 MEDIUM | Inconsistent state | 20min | Should fix |
| 4 | .single() on insert | kelas.api.ts:498 | 🟡 HIGH | Unclear errors | 10min | Should fix |
| 5 | Array[0] undefined | nilai.api.ts:299 | 🟢 MEDIUM | Edge case | 5min | Good to have |
| 6 | Past date validation | jadwal.api.ts | 🟡 HIGH | Invalid data | 15min | Should fix |
| 7 | Email duplicate | kelas.api.ts:458 | 🟡 HIGH | Poor UX | 10min | Should fix |
| 8 | Batch error reporting | nilai.api.ts:387 | 🟢 MEDIUM | UX | 15min | Good to have |
| 9 | Batch timeout | nilai.api.ts:387 | 🟢 MEDIUM | Performance | 20min | Good to have |
| 10 | Input sanitization | Multiple | 🟢 MEDIUM | Security | 30min | Good to have |

---

## 🎯 Recommended Action Plan

### Phase 1: CRITICAL FIXES (Before Testing) - **30 minutes**
**MUST FIX untuk avoid data corruption**:

1. ✅ **Fix Issue #1**: Implement atomic approval dengan RPC function
   - Create migration file
   - Create `approve_peminjaman_atomic()` PostgreSQL function
   - Update `approvePeminjamanImpl()` to use RPC

### Phase 2: HIGH PRIORITY FIXES (Before Testing) - **45 minutes**
**SHOULD FIX untuk avoid common errors**:

2. ✅ **Fix Issue #4**: Better error handling untuk insert with .single()
3. ✅ **Fix Issue #6**: Add past date validation
4. ✅ **Fix Issue #7**: Check email duplicate before signup

### Phase 3: MEDIUM PRIORITY (After Initial Testing) - **1 hour**
**GOOD TO HAVE untuk better UX dan robustness**:

5. ⏭️ **Fix Issue #3**: Add rollback mechanism (atau solved by RPC di #1)
6. ⏭️ **Fix Issue #5**: Better array handling
7. ⏭️ **Fix Issue #8**: Better batch error reporting
8. ⏭️ **Fix Issue #9**: Optimize batch operations
9. ⏭️ **Fix Issue #10**: Input sanitization

---

## ✅ Already Good (No Fix Needed)

### ✅ Error Handling Structure
Kebanyakan API functions sudah ada try-catch dengan proper error handling:
```typescript
try {
  // ... operation ...
} catch (error) {
  console.error('Descriptive error:', error);
  throw handleError(error); // atau throw error
}
```

### ✅ NULL Safety
Banyak yang sudah pakai:
- `.maybeSingle()` instead of `.single()` untuk avoid errors
- Optional chaining: `current?.nilai_kuis`
- Null coalescing: `data.nilai ?? 0`
- Fallback values: `usersMap.get(id) || { default }`

### ✅ Type Safety
TypeScript types sudah defined dengan baik, ada interfaces untuk semua entities.

### ✅ Permission Middleware
RBAC sudah implemented dengan `requirePermission()` wrapper.

---

## 🧪 Testing Recommendations

### Before Testing:
1. ✅ Fix Issue #1 (race condition) → **CRITICAL**
2. ✅ Fix Issue #4 (insert error handling) → Prevents test failures
3. ✅ Fix Issue #6 (date validation) → Prevents invalid test data
4. ✅ Fix Issue #7 (email duplicate) → Better error messages

### During Testing:
- Monitor for database lock timeouts (could indicate Issue #1)
- Check for unclear error messages (Issue #4, #7)
- Test batch operations with large data (Issue #9)
- Test concurrent operations (Issue #1)

### Test Cases to Add:
```typescript
// Test: Concurrent approval (Issue #1)
test('Should prevent race condition on approval', async () => {
  const peminjaman = createPeminjaman({ jumlah: 5 });

  // Approve bersamaan
  const [result1, result2] = await Promise.allSettled([
    approvePeminjaman(peminjaman.id),
    approvePeminjaman(peminjaman.id)
  ]);

  // One should succeed, one should fail
  expect([result1.status, result2.status]).toContain('rejected');
});

// Test: Past date rejection (Issue #6)
test('Should reject past date for jadwal', async () => {
  await expect(
    createJadwal({
      tanggal_praktikum: '2020-01-01',
      // ...
    })
  ).rejects.toThrow('tidak boleh di masa lalu');
});

// Test: Email duplicate (Issue #7)
test('Should reject duplicate email', async () => {
  await createOrEnrollMahasiswa(kelasId, {
    nim: '001',
    email: 'test@example.com',
    full_name: 'Test'
  });

  await expect(
    createOrEnrollMahasiswa(kelasId, {
      nim: '002',
      email: 'test@example.com', // Same email
      full_name: 'Test 2'
    })
  ).rejects.toThrow('sudah terdaftar');
});
```

---

## 📝 Implementation Priority

**For immediate testing** (Total: ~1.5 hours):
1. 🔴 Issue #1: Atomic approval (30min) - **CRITICAL**
2. 🟡 Issue #4: Insert error handling (10min)
3. 🟡 Issue #6: Date validation (15min)
4. 🟡 Issue #7: Email duplicate check (10min)

**Can defer** (implement after initial testing):
- Issue #3, #5, #8, #9, #10

**No fix needed**:
- Issue #2 (already has fallback)

---

## 🚀 Next Steps

### Option A: Fix Critical Only (30 min)
- Fix Issue #1 saja
- Lanjut testing
- Fix issues lain jika muncul saat testing

### Option B: Fix All High Priority (1.5 hours) - **RECOMMENDED**
- Fix Issue #1, #4, #6, #7
- Testing akan lebih smooth
- Fewer errors encountered

### Option C: Continue Testing As-Is
- Lanjut testing sekarang
- Document errors yang muncul
- Fix setelah testing

---

**Recommendation**: **Option B** - Fix 4 critical/high issues sekarang (1.5 jam), baru testing. Ini akan save waktu debugging saat testing nanti.

Mau saya implement fixes-nya sekarang atau lanjut testing dulu?

---

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Status**: 🟡 **NEEDS FIXES BEFORE TESTING**
