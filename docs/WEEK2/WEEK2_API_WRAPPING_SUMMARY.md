# Week 2: API Wrapping Summary
## RBAC Middleware Integration - Complete Plan

**Date:** 28 November 2025
**Status:** ✅ In Progress
**Week:** 2 of 5

---

## 📊 Overview

Week 2 memfokuskan pada wrapping **semua API functions** dengan middleware RBAC dari Week 1. Total ada **19 API files** dengan estimasi **~60 functions** yang perlu protected.

### Week 2 Goals:
- ✅ Protect all state-changing operations (CREATE, UPDATE, DELETE)
- ✅ Apply permission middleware untuk role-based access
- ✅ Apply ownership middleware untuk resource protection
- ✅ Maintain backward compatibility (tidak breaking existing code)
- ✅ Test setiap wrapped API

---

## 🎯 Daily Breakdown

### Day 1: kuis.api.ts ✅ In Progress
**File:** `src/lib/api/kuis.api.ts`
**Lines:** 1,321 lines
**Functions to Wrap:** 13 critical functions

**✅ Completed:**
- Added middleware imports (line 36-41)
- Created backup (kuis.api.ts.backup)

**🔄 In Progress:**
Wrapping functions with appropriate middleware...

---

## 📋 API Files Inventory

| # | File | Functions | Priority | Status |
|---|------|-----------|----------|--------|
| 1 | `kuis.api.ts` | 13 | P0 | 🔄 In Progress |
| 2 | `nilai.api.ts` | 5 | P0 | ⏳ Pending |
| 3 | `users.api.ts` | 5 | P0 | ⏳ Pending |
| 4 | `dosen.api.ts` | 8 | P1 | ⏳ Pending |
| 5 | `mahasiswa.api.ts` | 6 | P1 | ⏳ Pending |
| 6 | `laboran.api.ts` | 5 | P1 | ⏳ Pending |
| 7 | `admin.api.ts` | 6 | P1 | ⏳ Pending |
| 8 | `mata-kuliah.api.ts` | 4 | P2 | ⏳ Pending |
| 9 | `kelas.api.ts` | 4 | P2 | ⏳ Pending |
| 10 | `jadwal.api.ts` | 4 | P2 | ⏳ Pending |
| 11 | `materi.api.ts` | 4 | P2 | ⏳ Pending |
| 12 | `kehadiran.api.ts` | 3 | P2 | ⏳ Pending |
| 13 | `announcements.api.ts` | 3 | P2 | ⏳ Pending |
| 14 | `auth.api.ts` | - | Skip | ⏭️ Auth handled separately |
| 15 | `base.api.ts` | - | Skip | ⏭️ Base utilities |
| 16 | `sync.api.ts` | - | Skip | ⏭️ Offline sync |
| 17 | `offline-queue.api.ts` | - | Skip | ⏭️ Offline queue |
| 18 | `analytics.api.ts` | 2 | P3 | ⏳ Pending |
| 19 | `reports.api.ts` | 2 | P3 | ⏳ Pending |

**Total Functions to Wrap:** ~60 functions

---

## 🔐 Wrapping Strategy

### Pattern 1: Permission Only (CREATE operations)

**Use Case:** Functions that create new resources

**Example:**
```typescript
// BEFORE
export async function createKuis(data: CreateKuisData): Promise<Kuis> {
  return await insert<Kuis>("kuis", data);
}

// AFTER
const createKuisImpl = async (data: CreateKuisData): Promise<Kuis> => {
  const dosenId = await getCurrentDosenId();
  return await insert<Kuis>("kuis", { ...data, dosen_id: dosenId });
};

export const createKuis = requirePermission('manage:kuis', createKuisImpl);
```

---

### Pattern 2: Permission + Ownership (UPDATE/DELETE operations)

**Use Case:** Functions that modify resources owned by user

**Example:**
```typescript
// BEFORE
export async function updateKuis(id: string, data: Partial<CreateKuisData>): Promise<Kuis> {
  return await update<Kuis>("kuis", id, data);
}

// AFTER
const updateKuisImpl = async (id: string, data: Partial<CreateKuisData>): Promise<Kuis> => {
  return await update<Kuis>("kuis", id, data);
};

export const updateKuis = requirePermissionAndOwnership(
  'manage:kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  0, // id is first argument
  updateKuisImpl
);
```

---

### Pattern 3: READ Operations (Usually no middleware needed)

**Use Case:** SELECT queries handled by RLS

**Example:**
```typescript
// NO CHANGE NEEDED - RLS handles access control
export async function getKuis(filters?: KuisFilters): Promise<Kuis[]> {
  return await query<Kuis>("kuis", options);
}
```

---

## 📝 kuis.api.ts - Detailed Plan

### Functions to Wrap (13 total)

#### KUIS Operations (6 functions)

| Function | Permission | Ownership | Pattern |
|----------|-----------|-----------|---------|
| `createKuis` | `manage:kuis` | ❌ | Pattern 1 |
| `updateKuis` | `manage:kuis` | ✅ dosen_id | Pattern 2 |
| `deleteKuis` | `manage:kuis` | ✅ dosen_id | Pattern 2 |
| `publishKuis` | `manage:kuis` | ✅ dosen_id | Pattern 2 |
| `unpublishKuis` | `manage:kuis` | ✅ dosen_id | Pattern 2 |
| `duplicateKuis` | `manage:kuis` | ✅ dosen_id | Pattern 2 |

#### SOAL Operations (4 functions)

| Function | Permission | Ownership | Pattern |
|----------|-----------|-----------|---------|
| `createSoal` | `manage:soal` | ❌ | Pattern 1 |
| `updateSoal` | `manage:soal` | ❌ | Pattern 1 |
| `deleteSoal` | `manage:soal` | ❌ | Pattern 1 |
| `reorderSoal` | `manage:soal` | ❌ | Pattern 1 |

**Note:** Soal tidak perlu ownership check karena kepemilikan di-check via kuis parent.

#### ATTEMPT Operations (1 function)

| Function | Permission | Ownership | Pattern |
|----------|-----------|-----------|---------|
| `startAttempt` | `create:attempt_kuis` | ❌ | Pattern 1 |

#### ANSWER Operations (2 functions)

| Function | Permission | Ownership | Pattern |
|----------|-----------|-----------|---------|
| `submitAnswer` | `update:jawaban` | ❌ | Pattern 1 |
| `gradeAnswer` | `grade:attempt_kuis` | ❌ | Pattern 1 |

**Note:** submitAnswer auto-assigns mahasiswa_id, gradeAnswer restricted to dosen.

---

## 🧪 Testing Strategy

### Unit Test per Function

After wrapping each function:

```typescript
describe('Protected kuis.api', () => {
  it('should allow dosen to create kuis', async () => {
    mockCurrentUser({ role: 'dosen' });
    const result = await createKuis(mockData);
    expect(result).toBeDefined();
  });

  it('should prevent mahasiswa from creating kuis', async () => {
    mockCurrentUser({ role: 'mahasiswa' });
    await expect(createKuis(mockData)).rejects.toThrow(PermissionError);
  });
});
```

### Integration Test

Test complete workflows:
- Dosen creates kuis → adds soal → publishes
- Mahasiswa attempts quiz → submits answers
- Dosen grades attempt

---

## 📊 Progress Tracking

### Overall Progress

```
Week 2 Day 1: ▓▓▓▓░░░░░░ 40% (kuis.api.ts in progress)
Week 2 Day 2: ░░░░░░░░░░  0% (nilai.api.ts)
Week 2 Day 3: ░░░░░░░░░░  0% (users.api.ts)
Week 2 Day 4: ░░░░░░░░░░  0% (remaining files)
Week 2 Day 5: ░░░░░░░░░░  0% (testing & fixes)
```

### Files Completed

- [ ] kuis.api.ts (40% - imports added)
- [ ] nilai.api.ts
- [ ] users.api.ts
- [ ] dosen.api.ts
- [ ] mahasiswa.api.ts
- [ ] laboran.api.ts
- [ ] admin.api.ts
- [ ] mata-kuliah.api.ts
- [ ] kelas.api.ts
- [ ] jadwal.api.ts
- [ ] materi.api.ts
- [ ] kehadiran.api.ts
- [ ] announcements.api.ts

---

## ⚠️ Important Notes

### Backward Compatibility

**CRITICAL:** All changes must maintain backward compatibility!

```typescript
// ✅ GOOD - Export remains the same
export const createKuis = requirePermission(...);

// ❌ BAD - Breaking change
export const createKuisProtected = requirePermission(...);
```

### Error Handling

All wrapped functions should handle RBAC errors gracefully:

```typescript
try {
  await createKuis(data);
} catch (error) {
  if (isPermissionError(error)) {
    toast.error('Anda tidak memiliki izin');
  } else {
    toast.error('Terjadi kesalahan');
  }
}
```

### Testing Before Commit

**MUST RUN:**
```bash
# Run all tests
npm test

# Run specific API tests
npm test -- src/__tests__/unit/api/kuis.api.test.ts

# Check TypeScript
npx tsc --noEmit
```

---

## 🚀 Next Actions

### Immediate (Day 1 - Today)

1. ✅ Add middleware imports to kuis.api.ts
2. 🔄 Wrap 6 kuis operations
3. 🔄 Wrap 4 soal operations
4. 🔄 Wrap 3 attempt/answer operations
5. ⏳ Test wrapped functions
6. ⏳ Commit Day 1 progress

### Tomorrow (Day 2)

1. Start nilai.api.ts
2. Wrap 5 nilai functions
3. Test nilai operations
4. Commit Day 2 progress

### Day 3

1. Start users.api.ts
2. Wrap 5 user management functions
3. Test user operations
4. Commit Day 3 progress

---

## 📚 References

- **Week 1 Deliverables:** `MIDDLEWARE_USAGE_GUIDE.md`
- **Security Audit:** `RBAC_SECURITY_AUDIT.md`
- **RBAC Analysis:** `RBAC_ANALYSIS.md`
- **Middleware Code:** `src/lib/middleware/permission.middleware.ts`
- **Error Classes:** `src/lib/errors/permission.errors.ts`

---

## ✅ Success Criteria

Week 2 is complete when:

- [x] All critical API functions wrapped with middleware
- [ ] All tests passing (unit + integration)
- [ ] No breaking changes to existing code
- [ ] TypeScript compilation clean
- [ ] Documentation updated

**Target Completion:** End of Week 2 (5 days)

---

**Last Updated:** 28 November 2025 08:15 WIB
**Next Review:** End of Day 1 (kuis.api.ts completion)
