# RBAC Middleware Usage Guide
## Sistem Praktikum PWA - Week 1 Deliverable

**Date:** 28 November 2025
**Status:** ✅ Complete & Ready for Use
**Testing:** ✅ Unit Tests & Integration Tests Included

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Middleware Functions](#middleware-functions)
4. [Usage Patterns](#usage-patterns)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Best Practices](#best-practices)
8. [Examples by Role](#examples-by-role)

---

## 🎯 Overview

Middleware RBAC sudah lengkap dan siap digunakan untuk melindungi API functions dengan:

- ✅ **Permission checking** - Validasi permission sebelum eksekusi
- ✅ **Ownership validation** - Pastikan user hanya akses resource milik sendiri
- ✅ **Admin bypass** - Admin otomatis bypass ownership checks
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Error handling** - Custom error classes dengan pesan user-friendly

**Files:**
```
src/lib/middleware/permission.middleware.ts  ← Main middleware
src/lib/errors/permission.errors.ts          ← Error classes
src/lib/utils/permissions.ts                 ← Permission utilities
src/__tests__/unit/middleware/               ← Unit tests
src/__tests__/integration/                   ← Integration tests
```

---

## 🚀 Quick Start

### Basic Permission Check

```typescript
import { requirePermission } from '@/lib/middleware/permission.middleware';

// Original function (without protection)
async function createKuis(data: CreateKuisData) {
  return insert('kuis', data);
}

// Protected function (with permission check)
export const createKuis = requirePermission(
  'manage:kuis',  // ← Required permission
  async (data: CreateKuisData) => {
    return insert('kuis', data);
  }
);
```

**Result:**
- ✅ Dosen can call this (has `manage:kuis` permission)
- ❌ Mahasiswa **cannot** call this (permission denied)
- ✅ Admin can call this (admin bypass)

---

## 🔧 Middleware Functions

### 1. `requirePermission`

Wraps a function with permission check.

**Signature:**
```typescript
function requirePermission<T extends any[], R>(
  permission: Permission,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R>
```

**Example:**
```typescript
// Protect create operation
export const createMateri = requirePermission(
  'create:materi',
  async (data: MateriData) => {
    return insert('materi', data);
  }
);

// Protect delete operation
export const deleteKuis = requirePermission(
  'manage:kuis',
  async (id: string) => {
    return remove('kuis', id);
  }
);
```

**Throws:**
- `PermissionError` - If user lacks the permission
- `AuthenticationError` - If user not authenticated
- `RoleNotFoundError` - If user role not found

---

### 2. `requireOwnership`

Validates that user owns a resource.

**Signature:**
```typescript
function requireOwnership(options: OwnershipOptions): Promise<void>

interface OwnershipOptions {
  table: string;         // Table name (e.g., 'kuis')
  resourceId: string;    // Resource ID to check
  ownerField?: string;   // Owner field (default: 'user_id')
  allowAdmin?: boolean;  // Allow admin bypass (default: true)
}
```

**Example:**
```typescript
// Check if user owns the kuis
await requireOwnership({
  table: 'kuis',
  resourceId: kuisId,
  ownerField: 'dosen_id'  // ← Check dosen_id field
});

// Check if mahasiswa owns jawaban
await requireOwnership({
  table: 'jawaban',
  resourceId: jawabanId,
  ownerField: 'mahasiswa_id'
});
```

**Supported Owner Fields:**
- `user_id` - Direct user ownership
- `dosen_id` - Dosen ownership (checks current dosen ID)
- `mahasiswa_id` - Mahasiswa ownership
- `laboran_id` - Laboran ownership

**Throws:**
- `OwnershipError` - If user is not the owner
- `Error` - If resource not found

---

### 3. `requirePermissionAndOwnership`

Combined permission + ownership check (most common for update/delete).

**Signature:**
```typescript
function requirePermissionAndOwnership<T extends any[], R>(
  permission: Permission,
  ownershipConfig: Omit<OwnershipOptions, 'resourceId'>,
  resourceIdIndex: number,  // ← Which argument is the resourceId?
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R>
```

**Example:**
```typescript
// Update kuis (requires permission + ownership)
export const updateKuis = requirePermissionAndOwnership(
  'manage:kuis',                      // ← Permission needed
  { table: 'kuis', ownerField: 'dosen_id' },  // ← Ownership config
  0,                                  // ← resourceId is 1st arg (index 0)
  async (id: string, data: Partial<Kuis>) => {
    return update('kuis', id, data);
  }
);

// Usage:
await updateKuis('kuis-123', { judul: 'Updated Title' });
//                ↑ This is index 0 (resourceId for ownership check)
```

**Flow:**
1. ✅ Check permission (`manage:kuis`)
2. ✅ Check ownership (is dosen owner of kuis-123?)
3. ✅ Execute function if both pass

---

### 4. `getCurrentUserWithRole`

Get current authenticated user with role.

**Example:**
```typescript
import { getCurrentUserWithRole } from '@/lib/middleware/permission.middleware';

const user = await getCurrentUserWithRole();
// Returns: { id: 'user-123', role: 'dosen', email: 'dosen@example.com' }

if (user.role === 'admin') {
  // Admin-specific logic
}
```

---

### 5. `checkPermission`

Direct permission check (for custom logic).

**Example:**
```typescript
import { checkPermission } from '@/lib/middleware/permission.middleware';

async function myCustomFunction() {
  // Check permission manually
  await checkPermission('manage:kuis');

  // If we reach here, permission granted
  // ... do something ...
}
```

---

## 📚 Usage Patterns

### Pattern 1: CRUD Operations

```typescript
// File: src/lib/api/kuis.api.ts

import {
  requirePermission,
  requirePermissionAndOwnership,
} from '@/lib/middleware/permission.middleware';

// ✅ CREATE - Permission only
export const createKuis = requirePermission(
  'manage:kuis',
  async (data: CreateKuisData): Promise<Kuis> => {
    const dosenId = await getDosenId();
    return insert('kuis', { ...data, dosen_id: dosenId });
  }
);

// ✅ READ - Usually no middleware needed (use RLS)
export async function getMyKuis(): Promise<Kuis[]> {
  // RLS handles access control
  return select('kuis');
}

// ✅ UPDATE - Permission + Ownership
export const updateKuis = requirePermissionAndOwnership(
  'manage:kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  0,  // id is first argument
  async (id: string, data: Partial<Kuis>): Promise<Kuis> => {
    return update('kuis', id, data);
  }
);

// ✅ DELETE - Permission + Ownership
export const deleteKuis = requirePermissionAndOwnership(
  'manage:kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  0,  // id is first argument
  async (id: string): Promise<void> => {
    return remove('kuis', id);
  }
);
```

---

### Pattern 2: Multi-Argument Functions

```typescript
// When resourceId is NOT the first argument

export const gradeKuisAttempt = requirePermissionAndOwnership(
  'grade:attempt_kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  1,  // ← kuisId is SECOND argument (index 1)
  async (attemptId: string, kuisId: string, nilai: number) => {
    return updateAttempt(attemptId, { nilai });
  }
);

// Usage:
await gradeKuisAttempt('attempt-123', 'kuis-456', 85);
//                      ↑ arg[0]       ↑ arg[1] = resourceId for ownership
```

---

### Pattern 3: Conditional Permission Checks

```typescript
// Multiple permissions (user needs ANY of them)
import { checkAnyPermission } from '@/lib/middleware/permission.middleware';

async function viewGrades() {
  // Allow dosen OR admin
  await checkAnyPermission(['manage:nilai', 'view:nilai']);

  // Continue...
}
```

```typescript
// Multiple permissions (user needs ALL of them)
import { checkAllPermissions } from '@/lib/middleware/permission.middleware';

async function publishKuis() {
  // Needs both permissions
  await checkAllPermissions(['manage:kuis', 'view:mahasiswa']);

  // Continue...
}
```

---

### Pattern 4: Custom Ownership Validation

```typescript
// When you need custom logic

async function updateNilai(nilaiId: string, newNilai: number) {
  const user = await getCurrentUserWithRole();

  // Get the nilai record
  const nilai = await getNilaiById(nilaiId);

  if (user.role === 'admin') {
    // Admin can update any nilai
  } else if (user.role === 'dosen') {
    // Check if dosen teaches the mahasiswa
    const dosenId = await getCurrentDosenId();
    const isTeacher = await checkIfDosenTeachesMahasiswa(dosenId, nilai.mahasiswa_id);

    if (!isTeacher) {
      throw new PermissionError('You can only grade your own students');
    }
  } else {
    throw new PermissionError('Only dosen can update nilai');
  }

  // Update nilai
  return update('nilai', nilaiId, { nilai: newNilai });
}
```

---

## 🚨 Error Handling

### Error Types

```typescript
import {
  PermissionError,
  OwnershipError,
  AuthenticationError,
  RoleNotFoundError,
  isRBACError,
  getRBACErrorMessage,
} from '@/lib/errors/permission.errors';
```

### Handling Errors in Components

```typescript
// In React component
import { toast } from '@/components/ui/use-toast';
import { isPermissionError, isOwnershipError } from '@/lib/errors/permission.errors';

async function handleCreateKuis() {
  try {
    await createKuis(formData);
    toast.success('Kuis created!');
  } catch (error) {
    if (isPermissionError(error)) {
      toast.error('Anda tidak memiliki izin untuk membuat kuis');
      console.error('Permission denied:', error.permission);
    } else if (isOwnershipError(error)) {
      toast.error('Anda hanya dapat mengedit kuis milik Anda sendiri');
    } else {
      toast.error('Terjadi kesalahan');
    }
  }
}
```

### Generic Error Handler

```typescript
import { getRBACErrorMessage } from '@/lib/errors/permission.errors';

async function handleAction() {
  try {
    await someProtectedFunction();
  } catch (error) {
    // Get user-friendly message for any RBAC error
    const message = getRBACErrorMessage(error);
    toast.error(message);
  }
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run only middleware tests
npm test middleware

# Run with coverage
npm test -- --coverage
```

### Test Files

```
src/__tests__/unit/middleware/permission.middleware.test.ts
  ✅ getCurrentUserWithRole (5 tests)
  ✅ getCurrentDosenId (3 tests)
  ✅ checkPermission (4 tests)
  ✅ requirePermission (4 tests)
  ✅ requireOwnership (6 tests)
  ✅ requirePermissionAndOwnership (3 tests)
  ✅ Utility functions (6 tests)

src/__tests__/integration/middleware-rbac.test.ts
  ✅ Dosen manages kuis (5 scenarios)
  ✅ Mahasiswa creates peminjaman (3 scenarios)
  ✅ Laboran approves peminjaman (3 scenarios)
  ✅ Admin universal access (4 scenarios)
  ✅ Cross-role violations (3 scenarios)
  ✅ Error messages (2 scenarios)
```

### Writing Tests for Your API

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createKuis } from '@/lib/api/kuis.api';
import { PermissionError } from '@/lib/errors/permission.errors';

describe('Kuis API', () => {
  it('should allow dosen to create kuis', async () => {
    // Mock as dosen
    mockCurrentUser({ role: 'dosen' });

    const result = await createKuis({ judul: 'Test Kuis' });

    expect(result).toBeDefined();
  });

  it('should prevent mahasiswa from creating kuis', async () => {
    // Mock as mahasiswa
    mockCurrentUser({ role: 'mahasiswa' });

    await expect(
      createKuis({ judul: 'Unauthorized' })
    ).rejects.toThrow(PermissionError);
  });
});
```

---

## ✨ Best Practices

### 1. Always Use Middleware for State-Changing Operations

```typescript
// ✅ GOOD - Protected create/update/delete
export const createKuis = requirePermission('manage:kuis', createKuisImpl);
export const updateKuis = requirePermissionAndOwnership(...);
export const deleteKuis = requirePermissionAndOwnership(...);

// ⚠️ ACCEPTABLE - Read operations can use RLS
export async function getMyKuis() {
  // RLS in database handles access control
  return select('kuis');
}
```

### 2. Layer Your Security

```
Frontend          API Middleware        Database RLS
---------        ---------------       -------------
UI Hiding   →    Permission Check  →   Row-Level Security
(useRole)        (middleware)          (Supabase policies)
```

**Example:**
```tsx
// Frontend: Hide button
{canCreate('kuis') && <CreateButton />}

// API: Validate permission
export const createKuis = requirePermission('manage:kuis', ...);

// Database: RLS policy
-- CREATE POLICY "kuis_insert_dosen" ON kuis
--   FOR INSERT WITH CHECK (dosen_id = get_current_dosen_id());
```

### 3. Use Specific Permissions

```typescript
// ✅ GOOD - Specific permission
requirePermission('create:kuis', ...)
requirePermission('update:materi', ...)
requirePermission('approve:peminjaman', ...)

// ❌ BAD - Too generic
requirePermission('manage:all', ...)  // ← Don't do this
```

### 4. Document Permission Requirements

```typescript
/**
 * Create a new kuis
 *
 * @permission manage:kuis (dosen only)
 * @throws {PermissionError} If user is not a dosen
 */
export const createKuis = requirePermission('manage:kuis', async (data) => {
  // ...
});
```

### 5. Handle Ownership Fields Correctly

```typescript
// ✅ GOOD - Use correct owner field
requireOwnership({
  table: 'kuis',
  ownerField: 'dosen_id'  // ← kuis owned by dosen
});

requireOwnership({
  table: 'jawaban',
  ownerField: 'mahasiswa_id'  // ← jawaban owned by mahasiswa
});

// ❌ BAD - Wrong owner field
requireOwnership({
  table: 'kuis',
  ownerField: 'user_id'  // ← WRONG! kuis uses dosen_id
});
```

### 6. Admin Bypass is Automatic

```typescript
// No need to check for admin separately
// Middleware automatically allows admin bypass

export const updateKuis = requirePermissionAndOwnership(
  'manage:kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  0,
  updateKuisImpl
);

// Admin will bypass ownership check automatically ✅
```

### 7. Fail Fast

```typescript
// ✅ GOOD - Check permission first
export const complexOperation = requirePermission('manage:kuis', async (data) => {
  // Permission already checked
  // Now do expensive operations
  const validated = await validateData(data);
  const processed = await processData(validated);
  return processed;
});

// ❌ BAD - Check permission at the end
async function badOperation(data) {
  const validated = await validateData(data);  // Expensive!
  const processed = await processData(validated);  // Expensive!
  await checkPermission('manage:kuis');  // Too late!
  return processed;
}
```

---

## 👥 Examples by Role

### DOSEN Examples

```typescript
// File: src/lib/api/dosen.api.ts

import {
  requirePermission,
  requirePermissionAndOwnership,
  getCurrentDosenId,
} from '@/lib/middleware/permission.middleware';

// ✅ Create kuis (dosen only)
export const createKuis = requirePermission(
  'manage:kuis',
  async (data: CreateKuisData) => {
    const dosenId = await getCurrentDosenId();
    return insert('kuis', { ...data, dosen_id: dosenId });
  }
);

// ✅ Update own kuis
export const updateKuis = requirePermissionAndOwnership(
  'manage:kuis',
  { table: 'kuis', ownerField: 'dosen_id' },
  0,
  async (id: string, data: Partial<Kuis>) => {
    return update('kuis', id, data);
  }
);

// ✅ Grade mahasiswa attempt
export const gradeAttempt = requirePermission(
  'grade:attempt_kuis',
  async (attemptId: string, nilai: number, feedback: string) => {
    // TODO: Add ownership check for kuis
    return update('attempt_kuis', attemptId, { nilai, feedback, graded: true });
  }
);

// ✅ Create materi
export const createMateri = requirePermission(
  'create:materi',
  async (data: MateriData) => {
    const dosenId = await getCurrentDosenId();
    return insert('materi', { ...data, dosen_id: dosenId });
  }
);
```

### MAHASISWA Examples

```typescript
// File: src/lib/api/mahasiswa.api.ts

import {
  requirePermission,
  requirePermissionAndOwnership,
  getCurrentMahasiswaId,
} from '@/lib/middleware/permission.middleware';

// ✅ Create kuis attempt
export const createAttempt = requirePermission(
  'create:attempt_kuis',
  async (kuisId: string) => {
    const mahasiswaId = await getCurrentMahasiswaId();
    return insert('attempt_kuis', {
      kuis_id: kuisId,
      mahasiswa_id: mahasiswaId,
      started_at: new Date(),
    });
  }
);

// ✅ Update own attempt
export const updateAttempt = requirePermissionAndOwnership(
  'update:attempt_kuis',
  { table: 'attempt_kuis', ownerField: 'mahasiswa_id' },
  0,
  async (attemptId: string, jawaban: any) => {
    return update('attempt_kuis', attemptId, { jawaban });
  }
);

// ✅ Create peminjaman
export const createPeminjaman = requirePermission(
  'create:peminjaman',
  async (data: PeminjamanData) => {
    const mahasiswaId = await getCurrentMahasiswaId();
    return insert('peminjaman', {
      ...data,
      mahasiswa_id: mahasiswaId,
      status: 'pending',
    });
  }
);
```

### LABORAN Examples

```typescript
// File: src/lib/api/laboran.api.ts

import {
  requirePermission,
  getCurrentLaboranId,
} from '@/lib/middleware/permission.middleware';

// ✅ Approve peminjaman
export const approvePeminjaman = requirePermission(
  'approve:peminjaman',
  async (peminjamanId: string) => {
    const laboranId = await getCurrentLaboranId();
    return update('peminjaman', peminjamanId, {
      status: 'approved',
      approved_by: laboranId,
      approved_at: new Date(),
    });
  }
);

// ✅ Manage inventaris
export const createInventaris = requirePermission(
  'manage:inventaris',
  async (data: InventarisData) => {
    return insert('inventaris', data);
  }
);

export const updateInventaris = requirePermission(
  'manage:inventaris',
  async (id: string, data: Partial<InventarisData>) => {
    return update('inventaris', id, data);
  }
);
```

### ADMIN Examples

```typescript
// File: src/lib/api/admin.api.ts

import { requirePermission } from '@/lib/middleware/permission.middleware';

// ✅ Manage users
export const createUser = requirePermission(
  'manage:user',
  async (data: CreateUserData) => {
    return insert('users', data);
  }
);

export const updateUser = requirePermission(
  'manage:user',
  async (id: string, data: Partial<User>) => {
    return update('users', id, data);
  }
);

// ✅ Admin can update ANY kuis (ownership bypass automatic)
export const adminUpdateKuis = requirePermission(
  'manage:kuis',
  async (id: string, data: Partial<Kuis>) => {
    // Admin bypass happens automatically in middleware
    return update('kuis', id, data);
  }
);
```

---

## 📊 Summary

### ✅ Week 1 Deliverables Complete

| Item | Status | Files |
|------|--------|-------|
| Permission Middleware | ✅ Complete | `permission.middleware.ts` |
| Ownership Validator | ✅ Complete | Included in middleware |
| Error Classes | ✅ Complete | `permission.errors.ts` |
| Unit Tests | ✅ Complete | `permission.middleware.test.ts` |
| Integration Tests | ✅ Complete | `middleware-rbac.test.ts` |
| Documentation | ✅ Complete | This file |

### 📈 Test Coverage

```
✅ 31 Unit Tests
✅ 20 Integration Test Scenarios
✅ All error cases covered
✅ All role scenarios tested
```

### 🎯 Next Steps (Week 2+)

1. **Apply Middleware to Existing APIs**
   - Update `src/lib/api/dosen.api.ts`
   - Update `src/lib/api/mahasiswa.api.ts`
   - Update `src/lib/api/laboran.api.ts`

2. **Database RLS Policies**
   - Implement enhanced RLS (see `RBAC_SECURITY_AUDIT.md`)

3. **Audit Logging**
   - Add audit trail system

---

## 💡 Quick Reference Card

```typescript
// ✅ Simple permission check
export const fn = requirePermission('permission:resource', async (...) => {...});

// ✅ Permission + ownership check
export const fn = requirePermissionAndOwnership(
  'permission:resource',
  { table: 'table_name', ownerField: 'owner_id' },
  resourceIdArgumentIndex,
  async (...) => {...}
);

// ✅ Manual permission check
await checkPermission('permission:resource');

// ✅ Manual ownership check
await requireOwnership({ table: 'table', resourceId: 'id', ownerField: 'field' });

// ✅ Get current user
const user = await getCurrentUserWithRole();

// ✅ Get role-specific ID
const dosenId = await getCurrentDosenId();
const mahasiswaId = await getCurrentMahasiswaId();
const laboranId = await getCurrentLaboranId();
```

---

**Dokumentasi ini siap digunakan untuk:**
- ✅ Developer onboarding
- ✅ API implementation reference
- ✅ Security audit documentation
- ✅ Research paper technical details

---

**Generated:** 28 November 2025
**System:** Sistem Praktikum PWA
**Week 1:** Middleware Setup - COMPLETE ✅
