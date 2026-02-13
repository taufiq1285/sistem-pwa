# 🔬 Analisis Whitebox Testing - File Core Logic Tanpa Unit Test

**Generated:** 2026-02-12  
**Purpose:** Penelitian Whitebox Testing  
**Total Files Missing Tests:** 30 files (43% dari core logic)

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Core Logic Files** | 116 files |
| **Files With Tests** | 89 tests |
| **Files Missing Tests** | 30 files (43%) |
| **Estimated Test Cases** | ~250 test cases |
| **Priority Critical** | 3 files |
| **Priority High** | 8 files |
| **Priority Medium** | 11 files |
| **Priority Low** | 8 files |

### Coverage by Category

| Category | Missing | Total | % Missing |
|----------|---------|-------|-----------|
| **API** | 11 | 20 | 55% |
| **Hooks** | 3 | 12 | 25% |
| **Utils** | 3 | 13 | 23% |
| **Validations** | 3 | 7 | 43% |
| **Offline** | 3 | 8 | 38% |
| **PWA** | 3 | 5 | 60% |
| **Supabase** | 2 | 7 | 29% |

---

## 🔴 CRITICAL PRIORITY (3 files) - **HARUS DIBUAT SEGERA**

### 1. `src/lib/api/kehadiran.api.ts` ⚠️

**Complexity:** High  
**Business Impact:** Absensi mahasiswa tidak tercatat dengan benar

#### Core Functions:
```typescript
- markAttendance()
- getAttendanceByKelas()
- getAttendanceByMahasiswa()
- validateAttendance()
- updateAttendance()
- calculateAttendancePercentage()
```

#### Test Cases (8 TC):
```
TC001: Mark attendance untuk mahasiswa yang valid
TC002: Prevent duplicate attendance di hari yang sama
TC003: Validate attendance time (harus dalam jadwal)
TC004: Calculate attendance percentage dengan benar
TC005: Handle late attendance
TC006: Handle early checkout
TC007: Reject attendance untuk mahasiswa tidak terdaftar
TC008: Update attendance status (hadir/izin/sakit/alpa)
```

#### Whitebox Testing Focus:
- ✅ **Statement Coverage (100%)**: Semua path di markAttendance()
- ✅ **Branch Coverage (100%)**: If-else untuk validasi waktu
  ```typescript
  if (isEnrolled && inTimeRange && !duplicate) {
    // Success path
  } else {
    // Error path
  }
  ```
- ✅ **Path Coverage (95%)**: Success/error/edge-case paths
- ✅ **Condition Coverage**: Test kombinasi (isEnrolled && inTimeRange && !duplicate)
  - isEnrolled=true, inTimeRange=true, duplicate=false → ✅ Success
  - isEnrolled=false → ❌ Not enrolled
  - inTimeRange=false → ❌ Outside time range
  - duplicate=true → ❌ Already marked

---

### 2. `src/lib/api/kelas.api.ts` ⚠️

**Complexity:** High  
**Business Impact:** Manajemen kelas tidak berfungsi

#### Core Functions:
```typescript
- getKelas()
- createKelas()
- updateKelas()
- deleteKelas()
- getKelasStudents()
- addStudentToKelas()
- removeStudentFromKelas()
- checkKelasCapacity()
```

#### Test Cases (8 TC):
```
TC001: Create kelas dengan data valid
TC002: Prevent duplicate kelas name untuk mata kuliah yang sama
TC003: Validate kuota (max 30 mahasiswa)
TC004: Add student dengan capacity check
TC005: Remove student dan update kuota
TC006: Delete kelas dengan cascade (hapus enrollment)
TC007: Get students dengan pagination
TC008: Update kelas info (nama, kuota, jadwal)
```

#### Whitebox Testing Focus:
- ✅ **Statement Coverage**: Semua CRUD operations
- ✅ **Branch Coverage**: Capacity validation
  ```typescript
  if (jumlah_terisi < kuota) {
    // Allow enrollment
  } else {
    // Reject: Kelas penuh
  }
  ```
- ✅ **Path Coverage**: 
  - Create success
  - Create duplicate (error)
  - Create when full (error)
- ✅ **Loop Coverage**: Pagination logic di getKelasStudents()

---

### 3. `src/lib/api/users.api.ts` ⚠️

**Complexity:** High  
**Business Impact:** User management tidak bekerja

#### Core Functions:
```typescript
- getUsers()
- getUserById()
- createUser()
- updateUser()
- deleteUser()
- updateProfile()
- changePassword()
- validateUserRole()
```

#### Test Cases (8 TC):
```
TC001: Create user dengan role yang valid
TC002: Prevent duplicate email
TC003: Update profile dengan validasi
TC004: Change password dengan current password check
TC005: Delete user dengan cascade (hapus related data)
TC006: Get users dengan filter by role
TC007: Validate user permissions
TC008: Handle user tidak ditemukan
```

#### Whitebox Testing Focus:
- ✅ **Statement Coverage**: Semua CRUD + auth operations
- ✅ **Branch Coverage**: Role validation
  ```typescript
  switch (role) {
    case 'admin': // Admin privileges
    case 'dosen': // Dosen privileges
    case 'mahasiswa': // Mahasiswa privileges
    case 'laboran': // Laboran privileges
  }
  ```
- ✅ **Path Coverage**: Success/error/not-found paths
- ✅ **Condition Coverage**: Password validation rules

---

## 🟠 HIGH PRIORITY (8 files) - **SANGAT DIREKOMENDASIKAN**

### 4. `src/lib/api/mata-kuliah.api.ts`

**Complexity:** Medium  
**Business Impact:** Mata kuliah tidak bisa dikelola

#### Core Functions:
- getMataKuliah(), createMataKuliah(), updateMataKuliah()
- deleteMataKuliah(), getMataKuliahByDosen()
- assignDosenToMataKuliah()

#### Whitebox Focus:
- Branch coverage: SKS validation (1 <= sks <= 4)
- Data flow: kode_mk uniqueness check
- Path coverage: CRUD operations

---

### 5. `src/lib/api/materi.api.ts`

**Complexity:** High  
**Business Impact:** Materi pembelajaran tidak bisa diupload/download

#### Core Functions:
- uploadMateri(), downloadMateri(), deleteMateri()
- getMateriByKelas(), downloadForOffline()

#### Whitebox Focus:
- Branch coverage: File validation (size && type)
  ```typescript
  if (fileSize <= MAX_SIZE && fileType === 'PDF') {
    // Allow upload
  }
  ```
- Exception handling: Storage errors
- Path coverage: Success/error/storage-error

---

### 6. `src/lib/api/sync.api.ts`

**Complexity:** High  
**Business Impact:** Offline sync tidak bekerja

#### Core Functions:
- syncData(), getSyncStatus(), forceSyncAll()
- resolveSyncConflict(), syncByEntity()

#### Whitebox Focus:
- Branch coverage: Conflict resolution logic
- Loop coverage: Sync queue processing
- Path coverage: Success/conflict/error paths

---

### 7. `src/lib/api/analytics.api.ts`

**Complexity:** Medium  
**Business Impact:** Dashboard analytics tidak berfungsi

#### Whitebox Focus:
- Data flow: Aggregation logic
- Branch coverage: Empty data handling
- Statement coverage: Calculation functions

---

### 8. `src/lib/api/announcements.api.ts`

**Complexity:** Medium  
**Business Impact:** Pengumuman tidak bisa dikelola

#### Whitebox Focus:
- Branch coverage: Role filtering (admin/dosen/mahasiswa)
- Condition coverage: Date filtering
- Path coverage: CRUD operations

---

### 9. `src/lib/offline/storage-manager.ts`

**Complexity:** High  
**Business Impact:** Offline storage tidak terkelola

#### Whitebox Focus:
- Branch coverage: Quota check
- Exception handling: Storage errors
- Path coverage: Success/quota-exceeded/error

---

### 10. `src/lib/offline/api-cache.ts`

**Complexity:** High  
**Business Impact:** API caching tidak bekerja

#### Whitebox Focus:
- Branch coverage: TTL (Time To Live) check
- Path coverage: Hit/miss/expired paths
- Data flow: Cache invalidation logic

---

### 11. `src/lib/validations/jadwal.schema.ts`

**Complexity:** Medium  
**Business Impact:** Validasi jadwal tidak teruji

#### Whitebox Focus:
- Branch coverage: Time/date validation
- Condition coverage: Complex validation rules
- Statement coverage: All validation paths

---

## 🟡 MEDIUM PRIORITY (11 files)

### 12. `src/lib/api/reports.api.ts`
- generateAttendanceReport(), generateGradeReport()
- exportToExcel(), exportToPDF()
- **Whitebox:** Format selection (Excel/PDF), data aggregation

### 13. `src/lib/api/peminjaman-extensions.ts`
- extendPeminjaman(), returnPeminjaman()
- calculateLateFee()
- **Whitebox:** Late fee calculation, stock update flow

### 14. `src/lib/hooks/useLocalStorage.ts`
- setItem(), getItem(), removeItem()
- **Whitebox:** Try-catch error handling, quota exceeded

### 15. `src/lib/hooks/useSessionTimeout.ts`
- resetTimeout(), handleActivity(), logout()
- **Whitebox:** Timer coverage (setTimeout/clearTimeout)

### 16. `src/lib/offline/offline-auth.ts`
- authenticateOffline(), validateOfflineToken()
- **Whitebox:** Token validation, security coverage

### 17. `src/lib/pwa/update-manager.ts`
- checkForUpdates(), installUpdate()
- **Whitebox:** Update flow, SW lifecycle events

### 18. `src/lib/utils/kehadiran-export.ts`
- exportKehadiranToExcel(), exportKehadiranToPDF()
- **Whitebox:** Export format selection, data formatting

### 19. `src/lib/validations/mata-kuliah.schema.ts`
- mataKuliahFormSchema, validateKodeMK()
- **Whitebox:** Field validation, schema coverage

---

## ⚪ LOW PRIORITY (8 files)

20. `src/lib/hooks/useSignedUrl.ts` - Signed URL generation
21. `src/lib/utils/pdf-viewer.ts` - PDF viewer utility
22. `src/lib/utils/device-detect.ts` - Device detection
23. `src/lib/pwa/register-sw.ts` - Service worker registration
24. `src/lib/pwa/push-notifications.ts` - Push notifications
25. `src/lib/supabase/storage.ts` - File storage operations
26. `src/lib/supabase/realtime.ts` - Realtime subscriptions
27. `src/lib/validations/Jadwal.schema .ts` - **TO DELETE** (duplicate file)
28. `src/lib/api/index.ts` - **NO TESTS NEEDED** (re-export only)

---

## 🎯 Whitebox Testing Techniques

### 1. Statement Coverage
**Goal:** 100%  
**Definition:** Setiap statement code harus dieksekusi minimal 1x

```typescript
// Example: markAttendance()
function markAttendance(data) {
  const enrolled = checkEnrollment(data.mahasiswa_id); // Line 1 ✅
  if (enrolled) {                                      // Line 2 ✅
    return saveAttendance(data);                       // Line 3 ✅
  }
  return { error: 'Not enrolled' };                    // Line 4 ✅
}

// Need 2 tests:
// Test 1: enrolled=true → covers Line 1,2,3
// Test 2: enrolled=false → covers Line 1,2,4
```

---

### 2. Branch Coverage
**Goal:** 100%  
**Definition:** Setiap if-else branch harus ditest

```typescript
// Example: addStudentToKelas()
if (jumlah_terisi < kuota) {
  // Branch TRUE ✅
  enrollStudent();
} else {
  // Branch FALSE ✅
  throw new Error('Kelas penuh');
}

// Need 2 tests:
// Test 1: jumlah_terisi=15, kuota=20 → TRUE branch
// Test 2: jumlah_terisi=20, kuota=20 → FALSE branch
```

---

### 3. Condition Coverage
**Goal:** 100%  
**Definition:** Setiap atomic condition harus ditest true/false

```typescript
// Example: validateAttendance()
if (isEnrolled && inTimeRange && !duplicate) {
  // Success
}

// Need 4+ tests untuk cover semua kombinasi:
// Test 1: T && T && T → Success ✅
// Test 2: F && T && T → Not enrolled ❌
// Test 3: T && F && T → Outside time range ❌
// Test 4: T && T && F → Duplicate ❌
```

---

### 4. Path Coverage
**Goal:** 95%  
**Definition:** Setiap possible path di function harus ditest

```typescript
// Example: createKelas()
function createKelas(data) {
  // Path 1: Success
  if (isValid(data)) {
    if (!isDuplicate(data)) {
      return saveKelas(data);
    }
  }
  // Path 2: Invalid data
  // Path 3: Duplicate
  return { error: 'Invalid' };
}

// Need 3 tests:
// Test 1: Valid + Not duplicate → Path 1 (Success)
// Test 2: Invalid data → Path 2 (Error)
// Test 3: Valid + Duplicate → Path 3 (Duplicate)
```

---

### 5. Loop Coverage
**Goal:** 100%  
**Definition:** Test loop 0x, 1x, 2x, many times

```typescript
// Example: getKelasStudents() dengan pagination
function getKelasStudents(page, limit) {
  const students = [];
  for (let i = 0; i < totalPages; i++) {
    students.push(fetchPage(i));
  }
  return students;
}

// Need 4 tests:
// Test 1: totalPages=0 → Loop 0x
// Test 2: totalPages=1 → Loop 1x
// Test 3: totalPages=2 → Loop 2x
// Test 4: totalPages=10 → Loop many times
```

---

### 6. Data Flow Coverage
**Goal:** 90%  
**Definition:** Follow variable dari definisi sampai penggunaan

```typescript
// Example: approvePeminjaman()
function approvePeminjaman(id) {
  const peminjaman = getPeminjaman(id);      // Define
  const stok = getInventarisStok(peminjaman.inventaris_id); // Use peminjaman
  
  if (stok >= peminjaman.jumlah) {           // Use stok
    updateStok(stok - peminjaman.jumlah);    // Define new stok
    return approvePeminjaman(peminjaman);    // Use peminjaman
  }
  
  return rejectPeminjaman(peminjaman);       // Use peminjaman
}

// Data flow test:
// Test 1: Follow stok from query → validation → update
// Test 2: Follow peminjaman from query → approval → status update
```

---

## 📋 Implementation Roadmap

### Phase 1: Critical (Week 1) - **3 files**
**Priority:** MUST DO
- ✅ kehadiran.api.ts (Attendance tracking)
- ✅ kelas.api.ts (Class management)
- ✅ users.api.ts (User management)

**Estimated:** 24 test cases  
**Coverage Goal:** 95%+ all metrics

---

### Phase 2: High Priority (Week 2) - **8 files**
**Priority:** STRONGLY RECOMMENDED
- mata-kuliah.api.ts
- materi.api.ts
- sync.api.ts
- analytics.api.ts
- announcements.api.ts
- storage-manager.ts
- api-cache.ts
- jadwal.schema.ts

**Estimated:** 64 test cases  
**Coverage Goal:** 90%+ all metrics

---

### Phase 3: Medium Priority (Week 3) - **11 files**
**Priority:** RECOMMENDED
- reports.api.ts
- peminjaman-extensions.ts
- useLocalStorage.ts
- useSessionTimeout.ts
- offline-auth.ts
- update-manager.ts
- kehadiran-export.ts
- mata-kuliah.schema.ts
- (+ 3 validation schemas)

**Estimated:** 88 test cases  
**Coverage Goal:** 85%+ all metrics

---

### Phase 4: Low Priority (Week 4) - **8 files**
**Priority:** OPTIONAL
- useSignedUrl.ts
- pdf-viewer.ts
- device-detect.ts
- register-sw.ts
- push-notifications.ts
- storage.ts
- realtime.ts

**Estimated:** 48 test cases  
**Coverage Goal:** 80%+ all metrics

---

## 📊 Expected Results

### Coverage Targets

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 | After Phase 4 |
|--------|---------|---------------|---------------|---------------|---------------|
| **Files Tested** | 86/116 (74%) | 89/116 (77%) | 97/116 (84%) | 108/116 (93%) | 114/116 (98%) |
| **Statement** | ~90% | 92% | 94% | 96% | 97% |
| **Branch** | ~85% | 87% | 90% | 93% | 95% |
| **Condition** | ~80% | 83% | 87% | 91% | 93% |
| **Path** | ~75% | 78% | 82% | 87% | 90% |

### Research Contribution

✅ **Whitebox testing** sebagai pengganti/komplemen unit testing  
✅ **Systematic coverage** dengan metrics yang terukur  
✅ **Business logic validation** untuk critical systems  
✅ **Quality assurance** melalui code analysis

---

## 🔧 Testing Tools

### Recommended Tools:
1. **Vitest** - Test runner (already installed)
2. **Istanbul/c8** - Coverage reporting
3. **Vitest UI** - Visual test interface
4. **Coverage Report** - HTML coverage viewer

### Run Tests:
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific file
npm run test src/lib/api/kehadiran.api.test.ts

# Watch mode
npm run test:watch
```

---

## 📚 References

### Documentation:
- ✅ [UNIT_TEST_COVERAGE_AUDIT.md](../../docs/UNIT_TEST_COVERAGE_AUDIT.md)
- ✅ [UNIT_TEST_COMPLETE_STATUS.md](../../docs/UNIT_TEST_COMPLETE_STATUS.md)
- ✅ [BASE_API_TEST_COMPLETE_SUMMARY.md](../../docs/BASE_API_TEST_COMPLETE_SUMMARY.md)

### Related Files:
- [missing-test-analysis.ts](./missing-test-analysis.ts) - TypeScript analysis
- [WHITEBOX_TEST_PLAN.md](./WHITEBOX_TEST_PLAN.md) - Detailed test plan (to be created)

---

**Generated by:** Claude Code  
**Date:** 2026-02-12  
**Purpose:** Penelitian Whitebox Testing  
**Status:** 🔴 **30 FILES MISSING TESTS** (Critical: 3, High: 8, Medium: 11, Low: 8)
