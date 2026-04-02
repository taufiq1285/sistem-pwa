# Validation Schema Test Plan

**Date**: 2025-12-02
**Status**: PLANNED

---

## 📊 SCHEMA FILES TO TEST

### 1. auth.schema.ts (4 schemas - SIMPLE)
- `loginSchema` - Email & password validation
- `registerSchema` - Complex discriminated union (mahasiswa/dosen/laboran)
- `passwordResetSchema` - Email validation
- `passwordUpdateSchema` - Password matching validation

**Estimated Tests**: 25-30 tests
**Complexity**: Medium (discriminated union for register)

### 2. kuis.schema.ts (13+ schemas - COMPLEX)
- `createKuisSchema` - Quiz creation
- `updateKuisSchema` - Quiz update with date validation
- `createSoalPilihanGandaSchema` - Multiple choice with correct answer validation
- `createSoalBenarSalahSchema` - True/false questions
- `createSoalEssaySchema` - Essay questions
- `createSoalJawabanSingkatSchema` - Short answer questions
- `updateSoalSchema` - Discriminated union for all question types
- `startAttemptSchema` - Start quiz attempt
- `submitAnswerSchema` - Submit answer
- `submitQuizSchema` - Submit quiz
- `kuisFilterSchema` - Filter options
- `bulkDeleteKuisSchema` - Bulk operations
- `bulkDeleteSoalSchema` - Bulk operations

**Estimated Tests**: 80-100 tests
**Complexity**: Very High

### 3. nilai.schema.ts
**Estimated Tests**: 20-25 tests
**Complexity**: Medium

### 4. user.schema.ts
**Estimated Tests**: 15-20 tests
**Complexity**: Low-Medium

### 5. mata-kuliah.schema.ts
**Estimated Tests**: 15-20 tests
**Complexity**: Low

### 6. offline-data.schema.ts
**Estimated Tests**: 20-25 tests
**Complexity**: Medium

### 7. Jadwal.schema .ts
**Estimated Tests**: 15-20 tests
**Complexity**: Low-Medium

---

## 📈 TOTAL EFFORT ESTIMATE

| File | Tests | Time (est) | Priority |
|------|-------|------------|----------|
| auth.schema.ts | 25-30 | 45 min | HIGH |
| user.schema.ts | 15-20 | 30 min | HIGH |
| kuis.schema.ts | 80-100 | 2-3 hours | MEDIUM |
| nilai.schema.ts | 20-25 | 45 min | MEDIUM |
| mata-kuliah.schema.ts | 15-20 | 30 min | LOW |
| offline-data.schema.ts | 20-25 | 45 min | LOW |
| Jadwal.schema.ts | 15-20 | 30 min | LOW |
| **TOTAL** | **190-240 tests** | **5-7 hours** | - |

---

## 🎯 RECOMMENDATION

### Option 1: Full Coverage (5-7 hours)
Create comprehensive tests for all 7 schema files

**Pros**:
- Complete validation layer coverage
- All edge cases tested
- Maximum confidence in validation

**Cons**:
- Very time-consuming
- Lower ROI (validation is less critical than API/business logic)
- May be overkill for current needs

### Option 2: Critical Schemas Only (1.5-2 hours) ⭐ **RECOMMENDED**
Test only the most critical schemas:
1. **auth.schema.ts** - Authentication is critical for security
2. **user.schema.ts** - User data validation
3. **nilai.schema.ts** - Grading data (business critical)

**Pros**:
- Covers most critical validation paths
- Reasonable time investment
- Good ROI

**Cons**:
- Incomplete coverage
- Some edge cases not tested

### Option 3: Focus on API Layer (Current Priority)
Skip validation schema tests for now, focus on:
1. **nilai.api.ts** - Grading API (CRITICAL business logic)
2. **Role-specific APIs** - dosen, mahasiswa, laboran, admin
3. **Offline system** - storage-manager, api-cache

**Pros**:
- Tests more critical business logic
- Higher ROI
- Better use of limited time

**Cons**:
- Validation layer not tested
- May miss validation bugs

---

## 💡 CURRENT STATUS

### Already Completed ✅
- ✅ Permission tests (59 tests, 100% passing)
- ✅ Quiz scoring tests (44 tests, 100% passing)
- ✅ Permission middleware (33 tests, 100% passing)
- ✅ Base API tests (32 tests, 100% passing)

**Total**: 603 tests passing, 100% pass rate

### Still Critical to Test
1. **nilai.api.ts** - Grading operations API
2. **Role-specific APIs** - CRUD operations per role
3. **Offline system** - Storage and sync

### Less Critical
- Validation schemas (Zod handles most edge cases)
- PWA components (push notifications, update manager)
- Utility functions (cache-manager, logger)

---

## 🚀 SUGGESTED NEXT STEP

**Recommendation**: Skip full validation schema testing for now, move to higher-value targets:

1. **nilai.api.ts** (~1 hour, CRITICAL)
   - Tests grading operations
   - Business-critical for academic system

2. **dosen.api.ts** (~1.5 hours, HIGH)
   - Tests instructor operations
   - Most complex role-specific API

3. **mahasiswa.api.ts** (~1 hour, HIGH)
   - Tests student operations
   - Most frequently used API

This approach gives better ROI and tests more critical business logic.

---

## ❓ DECISION NEEDED

What would you like me to do next?

**A. Full Validation Testing** (5-7 hours)
- Create comprehensive tests for all 7 validation schemas
- 190-240 new tests

**B. Critical Validation Only** (1.5-2 hours)
- Test auth, user, and nilai schemas only
- 60-80 new tests

**C. Move to API Testing** ⭐ **RECOMMENDED**
- Test nilai.api.ts and role-specific APIs
- Higher business value
- 60-80 new tests

Please let me know which approach you prefer!
