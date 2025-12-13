# 📊 Mahasiswa Pages Audit Report

**Date:** 2025-11-26
**Status:** ⚠️ ISSUES FOUND - Requires attention
**Overall Risk Level:** MEDIUM

---

## 🎯 Executive Summary

Mahasiswa pages (JadwalPage, PresensiPage, NilaiPage) have **functional** workflows but have **consistency issues** with dosen/admin logic and **critical data filtering gaps**:

| Page | Status | Key Issue |
|------|--------|-----------|
| **JadwalPage** | ✅ Good | 7-day hardcoding, time window limitation |
| **PresensiPage** | ⚠️ Issue | No enrollment verification - shows ALL attendance |
| **NilaiPage** | ✅ Good | Scope unclear (historical vs current semester) |

---

## 📋 DETAILED FINDINGS

### 1️⃣ JADWAL PAGE (JadwalPage.tsx)

#### ✅ What's Working:
- Correctly filters by enrolled classes (`kelas_mahasiswa`)
- Shows only active schedules (`is_active = true`)
- Proper relationship chain: `mahasiswa → kelas_mahasiswa → kelas → jadwal_praktikum`
- Clean UI with date grouping and tabs

#### ⚠️ Issues Found:

**Issue #1: Hardcoded 7-Day Window**
```typescript
// Current: Only shows next 7 days
.gte('tanggal_praktikum', today)
.lte('tanggal_praktikum', nextWeekStr)

// Problem: Misses schedules beyond 7 days
// Example: Student can't see next month's schedule
```

**Priority:** LOW
**Fix:** Remove date filtering or align with semester calendar

---

### 2️⃣ PRESENSI PAGE (PresensiPage.tsx) - 🔴 CRITICAL ISSUE

#### ✅ What's Working:
- Displays attendance summary (Hadir, Izin, Sakit, Alpha)
- Shows attendance percentage with progress bar
- Readable table format with icons
- Attendance percentage calculation is accurate

#### 🔴 CRITICAL ISSUES:

**Issue #1: No Enrollment Verification**
```typescript
// Current (WRONG):
const data = await getMahasiswaKehadiran(mahasiswa_id);
// Shows attendance for ALL classes student ever took

// Expected (CORRECT):
// Should filter by kelas_mahasiswa WHERE is_active = true
```

**Example Scenario:**
- Student enrolled in "Kelas A" → marked attendance 5 times
- Student drops "Kelas A"
- Student still sees those 5 attendance records (WRONG!)
- Should only see current active classes

**Risk Level:** 🔴 HIGH
**Type:** Data Integrity Issue

**Fix Required:**
```typescript
// Before showing kehadiran, verify enrollment:
.from('kehadiran')
.select('...')
.eq('mahasiswa_id', mahasiswaId)
// ADD THIS:
.in('jadwal(kelas_id)', [active_kelas_ids])
```

---

**Issue #2: Inconsistent Data Loading Pattern**
```typescript
// Current (not following pattern):
const { data: mahasiswaData } = await supabase
  .from('mahasiswa')
  .select('id')
  .eq('user_id', user.id)
  .single();

// Better pattern (like NilaiPage):
const { user } = useAuth();
const mahasiswaId = user?.mahasiswa?.id;
```

**Risk Level:** MEDIUM
**Type:** Code Quality Issue

---

### 3️⃣ NILAI PAGE (NilaiPage.tsx)

#### ✅ What's Working:
- Uses auth context properly (`useAuth()` hook)
- Shows complete grade information
- IPK calculation is correct
- Filter by semester/year is helpful
- Grade distribution chart is useful

#### ⚠️ Potential Issues:

**Issue #1: Scope Ambiguity**
```typescript
// Current: Shows ALL grades ever recorded
const data = await getNilaiByMahasiswa(user.mahasiswa.id);

// Question: Should this be:
// Option A: All historical grades (for transcript) ← Current
// Option B: Only current semester
// Option C: All with enrollment indicator
```

**Decision Needed:** Is this intentional for transcript purposes?

**Risk Level:** LOW
**Type:** Requirement Clarification

---

## 🔀 CONSISTENCY WITH DOSEN/ADMIN

### Permission Model Comparison:

| Aspect | Mahasiswa | Dosen | Admin | Status |
|--------|-----------|-------|-------|--------|
| **Role Verification** | Implicit (page-based) | Explicit (`dosen_id`) | Explicit (role) | ❌ INCONSISTENT |
| **Permission Source** | Enrollment table | Foreign key | Database role | ❌ DIFFERENT |
| **Active Status Check** | Partial | Full | Full | ⚠️ PARTIAL |
| **Data Loading** | Mixed patterns | API helpers | Varied | ⚠️ INCONSISTENT |
| **Error Handling** | toast.error() | Structured | Structured | ⚠️ DIFFERENT |

### Recommendation:
Add explicit role checks to all mahasiswa pages:
```typescript
// Add to all mahasiswa pages:
if (user?.role !== 'mahasiswa') {
  navigate('/login');
  return;
}
```

---

## 🔧 REQUIRED FIXES

### Priority 1 - CRITICAL (Data Integrity)

#### Fix #1: Add Enrollment Verification to PresensiPage
**File:** `src/pages/dosen/PresensiPage.tsx` Line ~245
**Severity:** CRITICAL
**Effort:** MEDIUM

```typescript
// Step 1: Get active enrolled classes
const { data: enrolledKelas } = await supabase
  .from('kelas_mahasiswa')
  .select('kelas_id')
  .eq('mahasiswa_id', mahasiswaId)
  .eq('is_active', true);

const kelasIds = enrolledKelas?.map(k => k.kelas_id) || [];

// Step 2: Filter kehadiran by enrolled classes
if (kelasIds.length === 0) {
  setReportRecords([]);
  return;
}

const data = await getMahasiswaKehadiran(mahasiswaId);
// Filter to only enrolled classes:
const filtered = data.filter(k => kelasIds.includes(k.jadwal.kelas_id));
```

---

### Priority 2 - IMPORTANT (Code Quality)

#### Fix #2: Standardize Data Loading Pattern
**Files:**
- `src/pages/mahasiswa/PresensiPage.tsx`
- `src/pages/mahasiswa/JadwalPage.tsx`

**Severity:** MEDIUM
**Effort:** LOW

```typescript
// Instead of direct query:
// const { data: mahasiswaData } = await supabase.from('mahasiswa')...

// Use auth context:
const { user } = useAuth();
const mahasiswaId = user?.mahasiswa?.id;

// Or create helper:
import { getMahasiswaId } from '@/lib/api/mahasiswa.api';
const mahasiswaId = await getMahasiswaId();
```

---

#### Fix #3: Add Explicit Role Checks
**Files:** All mahasiswa pages
**Severity:** MEDIUM
**Effort:** LOW

```typescript
export default function DosenPresensiPage() {
  const { user } = useAuth();

  // Add this guard:
  if (user?.role !== 'mahasiswa') {
    return <UnauthorizedPage />;
  }

  // ... rest of component
}
```

---

### Priority 3 - NICE TO HAVE (Polish)

#### Fix #4: Remove 7-Day Window in JadwalPage
**File:** `src/pages/mahasiswa/JadwalPage.tsx`
**Severity:** LOW
**Effort:** LOW

```typescript
// Remove date filters for "All" tab:
// .gte('tanggal_praktikum', today)
// .lte('tanggal_praktikum', nextWeekStr)

// Or use semester end date instead
```

---

#### Fix #5: Clarify Nilai Page Scope
**Decision Required:** Is `NilaiPage` showing:
- ✅ All historical grades (transcript) - CORRECT
- ❌ Current semester only - CHANGE BEHAVIOR

**File:** `src/pages/mahasiswa/NilaiPage.tsx` documentation

---

## 📊 Implementation Checklist

### Must Fix (Critical Path):
- [ ] **PresensiPage: Add enrollment verification** (Line ~245)
  - [ ] Get active kelas_mahasiswa records
  - [ ] Filter kehadiran by enrolled class IDs
  - [ ] Test: Student in 2 classes, drop 1, verify only 1 shows
- [ ] **All mahasiswa pages: Add role check** (security gate)
  - [ ] JadwalPage
  - [ ] PresensiPage
  - [ ] NilaiPage
  - [ ] Test: Try to access as dosen/admin, should reject

### Should Fix (Quality):
- [ ] **Standardize data loading to useAuth()** (consistency)
  - [ ] PresensiPage: Use auth context instead of direct query
  - [ ] JadwalPage: Check if already using correct pattern
- [ ] **Improve error handling** (match dosen/admin pattern)
  - [ ] Add structured error messages
  - [ ] Add error boundaries

### Nice to Fix (Polish):
- [ ] **Remove 7-day hardcoding** (flexibility)
- [ ] **Clarify NilaiPage requirements** (documentation)

---

## 🧪 Testing Plan

### Test Case 1: Enrollment Verification
**Scenario:** Student drops a class
**Steps:**
1. Enroll student in Kelas A, Kelas B
2. Dosen mark attendance for both
3. Drop student from Kelas A (`kelas_mahasiswa.is_active = false`)
4. Open PresensiPage

**Expected:** Only Kelas B attendance shows
**Actual:** ❌ Both Kelas A & B show (BUG)

---

### Test Case 2: Role-Based Access
**Scenario:** Try to access mahasiswa pages as dosen
**Steps:**
1. Login as dosen
2. Try to visit `/mahasiswa/presensi`

**Expected:** Redirect to unauthorized or dashboard
**Actual:** ❌ Can view if route not protected

---

### Test Case 3: Historical Grades
**Scenario:** Student enrolls in multiple semesters
**Steps:**
1. Student took grades in 2022, 2023, 2024
2. Open NilaiPage

**Expected:** Shows all grades OR current semester (clarify)
**Actual:** ✅ Shows all (verify if intentional)

---

## 📝 Code Comparison

### Data Loading Pattern (Should Match):

**GOOD Pattern (NilaiPage):**
```typescript
const { user } = useAuth();

useEffect(() => {
  if (user?.mahasiswa?.id) {
    loadNilai();
  }
}, [user?.mahasiswa?.id]);
```

**BAD Pattern (PresensiPage):**
```typescript
const { data: mahasiswaData } = await supabase
  .from('mahasiswa')
  .select('id')
  .eq('user_id', user.id)
  .single();
// Redundant - auth already has this!
```

---

## 🔐 Security Considerations

### Current Security Model:
- **Route-based:** Pages in `/mahasiswa/*` assumed to be mahasiswa-only
- **Data-based:** Filters by `kelas_mahasiswa` enrollment
- **Issue:** No explicit role check = relying on route protection only

### Recommended Security Layers:
1. ✅ Route-based (already have)
2. ❌ Role-based (add explicit check)
3. ✅ Data-based (add enrollment verification)

---

## 📞 Questions for Product Owner

1. **Nilai Page:** Should show all historical grades or current semester only?
2. **PresensiPage:** When student drops class, should old attendance be hidden or marked differently?
3. **JadwalPage:** Should show all active schedules or limited to current semester?
4. **General:** Is implicit role protection (route-based) sufficient or should we add explicit checks?

---

## 📈 Next Steps

1. **Week 1:** Fix PresensiPage enrollment verification (CRITICAL)
2. **Week 1:** Add role checks to all mahasiswa pages
3. **Week 2:** Standardize data loading patterns
4. **Week 2:** Clarify Nilai page requirements
5. **Week 3:** Remove 7-day hardcoding from JadwalPage

---

## 📎 Related Issues

- Previously fixed: `mahasiswa->users` relationship query (KehadiranPage)
- Related to: Dosen/Admin role consistency improvements
- Impact on: Data integrity and user experience

---

**Report Generated:** 2025-11-26
**Reviewed By:** System Audit
**Status:** Ready for Review
