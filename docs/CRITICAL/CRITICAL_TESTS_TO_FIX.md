# Critical Tests yang Harus Diperbaiki

## 🎯 Priority List

### 🔴 PRIORITY 1: useLocalData Tests (30 tests)

**File:** `src/__tests__/unit/hooks/useLocalData.test.ts`
**Status:** ❌ All tests skipped
**Coverage Impact:** ~40% hooks coverage loss
**Risk Level:** 🔴 CRITICAL

#### Kenapa Critical?
```typescript
// Hook ini digunakan EVERYWHERE di aplikasi:
- ✅ useLocalData('kuis') → KuisPage
- ✅ useLocalData('jadwal') → JadwalPage
- ✅ useLocalData('kehadiran') → KehadiranPage
- ✅ useLocalData('nilai') → NilaiPage
- ✅ useLocalData('materi') → MateriPage

// Kalau ada bug → SEMUA fitur broken! 💥
```

#### Tests yang Harus Difix:

1. **Initialization Tests (4 tests)**
   ```typescript
   ✅ should initialize with default state
   ✅ should auto-load data by default
   ✅ should not auto-load when autoLoad is false
   ✅ should expose all required methods
   ```

2. **Loading Tests (6 tests)**
   ```typescript
   ✅ should set loading state during load
   ✅ should load data manually
   ✅ should handle load errors
   ✅ should apply filter function
   ✅ should apply sort function
   ✅ should apply transform function
   ```

3. **CRUD Tests (10 tests)**
   ```typescript
   // Add operations
   ✅ should add item with optimistic update
   ✅ should add item without optimistic update
   ✅ should revert optimistic update on error

   // Update operations
   ✅ should update item with optimistic update
   ✅ should revert optimistic update on error

   // Delete operations
   ✅ should remove item with optimistic update
   ✅ should revert optimistic update on error

   // Clear operations
   ✅ should clear all items
   ```

4. **Query Tests (5 tests)**
   ```typescript
   ✅ should get item by id
   ✅ should return undefined for non-existent id
   ✅ should find items matching predicate
   ✅ should check if item exists
   ✅ should return correct count
   ```

5. **Refresh Tests (4 tests)**
   ```typescript
   ✅ should refresh at specified interval
   ✅ should not refresh when interval is 0
   ✅ should clear interval on unmount
   ✅ should refresh data manually
   ```

6. **Integration Tests (2 tests)**
   ```typescript
   ✅ should handle complete CRUD workflow
   ✅ should maintain consistent state across re-renders
   ```

#### Cara Fix:

```typescript
// Problem: Tests timeout karena mock tidak sesuai implementation
// Solution: Sesuaikan mock dengan signature actual

// BEFORE (WRONG):
expect(indexedDBManager.update).toHaveBeenCalledWith(
  'kuis',
  'kuis-1',          // ❌ Wrong! Update tidak terima ID terpisah
  { judul: 'Updated' }
);

// AFTER (CORRECT):
expect(indexedDBManager.update).toHaveBeenCalledWith(
  'kuis',
  { id: 'kuis-1', judul: 'Updated' } // ✅ Correct! Full object
);

// Problem: Timer tests fail
// Solution: Add vi.useFakeTimers()

describe('Loading', () => {
  it('should set loading state during load', async () => {
    vi.useFakeTimers(); // ✅ Add this!
    // ... test code ...
    vi.useRealTimers(); // ✅ Cleanup
  });
});
```

---

### 🔴 PRIORITY 2: SyncProvider Tests (20 tests)

**File:** `src/__tests__/unit/providers/SyncProvider.test.tsx`
**Status:** ❌ Most tests skipped
**Coverage Impact:** ~30% provider coverage loss
**Risk Level:** 🔴 CRITICAL

#### Kenapa Critical?
```typescript
// SyncProvider adalah CORE dari offline functionality:
- Auto-sync saat online/offline transition
- Queue management untuk pending operations
- Conflict resolution
- Data consistency guarantee

// Kalau ada bug → Data corruption! 💀
```

#### Tests yang Harus Difix:

1. **Auto-sync Tests (2 tests)**
   ```typescript
   ✅ should handle auto-sync errors gracefully
   ✅ should trigger auto-sync when coming back online
   ```

2. **Context Tests (1 test)**
   ```typescript
   ✅ should share context across multiple children
   ```

3. **Props Tests (2 tests)**
   ```typescript
   ✅ should respect autoSync prop
   ✅ should default autoSync to true
   ```

4. **Integration Tests (1 test)**
   ```typescript
   ✅ should handle stats updates
   ```

#### Cara Fix:

```typescript
// Problem: Mock processQueue tidak dipanggil
// Solution: Trigger actual sync conditions

// BEFORE (WRONG):
it('should trigger auto-sync when coming back online', async () => {
  // ❌ Just rendering doesn't trigger sync
  renderHook(() => useSyncProvider());
});

// AFTER (CORRECT):
it('should trigger auto-sync when coming back online', async () => {
  // ✅ Simulate network state change
  const { result } = renderHook(() => useSyncProvider());

  // Add pending items
  await act(async () => {
    await queueManager.add({...});
  });

  // Simulate going online
  await act(async () => {
    networkDetector.emit('change', { online: true });
  });

  // Now processQueue should be called
  await waitFor(() => {
    expect(mockProcessQueue).toHaveBeenCalled();
  });
});
```

---

### 🔴 PRIORITY 3: API Tests (ALL)

**Files:**
- `src/__tests__/unit/api/*.api.test.ts`
- Currently: 8/9 tests skipped per file

**Coverage Impact:** API layer 0.74% → should be 90%+
**Risk Level:** 🔴 CRITICAL

#### Kenapa Critical?
```typescript
// ALL data flows melalui API layer:
- Authentication
- CRUD operations
- Offline queueing
- Error handling
- Retry logic

// Kalau ada bug → App tidak bisa communicate dengan server! 📡
```

#### Tests yang Harus Ditambahkan:

```typescript
describe('API Error Handling', () => {
  it('should handle 401 Unauthorized', async () => {
    // Mock 401 response
    // Verify redirect to login
    // Verify token cleared
  });

  it('should handle 403 Forbidden', async () => {
    // Mock 403 response
    // Verify error message
    // Verify user notified
  });

  it('should handle 500 Server Error', async () => {
    // Mock 500 response
    // Verify retry logic
    // Verify user notified
  });

  it('should handle network timeout', async () => {
    // Mock timeout
    // Verify timeout handling
    // Verify queued for later
  });

  it('should handle offline mode', async () => {
    // Mock offline
    // Verify queued immediately
    // Verify no API call made
  });
});

describe('API Retry Logic', () => {
  it('should retry failed requests', async () => {
    // Mock failure then success
    // Verify retried
    // Verify eventual success
  });

  it('should give up after max retries', async () => {
    // Mock persistent failure
    // Verify max retries hit
    // Verify error thrown
  });
});

describe('API Response Validation', () => {
  it('should validate response schema', async () => {
    // Mock invalid response
    // Verify validation error
    // Verify not stored in cache
  });

  it('should transform response data', async () => {
    // Mock API response
    // Verify transformed correctly
    // Verify types match
  });
});
```

---

### 🟡 PRIORITY 4: Integration Tests

**Files:**
- `src/__tests__/integration/kuis-attempt-offline.test.tsx`
- Currently: 2 tests failing, 2 skipped

**Risk Level:** 🟡 HIGH

#### Tests yang Harus Difix:

```typescript
describe('Kuis Offline Flow', () => {
  it('should save answers to IndexedDB when offline', async () => {
    // ❌ Currently failing
    // Problem: Mock expectations don't match actual calls

    // Fix: Update mock to match actual usage
    expect(offlineManager.saveOffline).toHaveBeenCalledWith(
      'kuis_jawaban',  // ✅ Correct store name
      'create',        // ✅ Correct action
      expectedData     // ✅ Match actual data structure
    );
  });

  it('should handle complete offline-online flow', async () => {
    // ❌ Currently failing
    // Problem: Sync not triggered properly

    // Fix: Properly simulate network state change
    await act(async () => {
      // Go offline
      setOnline(false);
      await saveAnswer();

      // Come back online
      setOnline(true);
      await triggerSync();
    });
  });
});
```

---

## 🛠️ Implementation Guide

### Step 1: Setup Test Environment

```bash
# Install dependencies if needed
npm install -D @testing-library/react-hooks
npm install -D fake-indexeddb

# Run tests in watch mode
npm run test -- --watch
```

### Step 2: Fix One Test File at a Time

```bash
# Start with useLocalData
npm run test src/__tests__/unit/hooks/useLocalData.test.ts -- --watch

# Fix failing tests one by one
# Uncomment tests gradually
# Ensure each passes before moving to next
```

### Step 3: Update Mocks

```typescript
// Common mock patterns:

// 1. IndexedDB Manager
vi.mock('@/lib/offline/indexeddb', () => ({
  indexedDBManager: {
    getAll: vi.fn(() => Promise.resolve([])),
    read: vi.fn((store, id) => Promise.resolve(mockData[id])),
    create: vi.fn((store, item) => Promise.resolve(item)),
    update: vi.fn((store, item) => Promise.resolve(item)), // ✅ Takes full object
    delete: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
  }
}));

// 2. Network Status
vi.mock('@/lib/hooks/useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    status: 'online',
  }))
}));

// 3. Queue Manager
vi.mock('@/lib/offline/queue-manager', () => ({
  queueManager: {
    add: vi.fn(),
    process: vi.fn(),
    getPending: vi.fn(() => Promise.resolve([])),
  }
}));
```

### Step 4: Add Fake Timers Where Needed

```typescript
describe('Tests with timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle intervals', async () => {
    // Test code using setTimeout/setInterval
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
  });
});
```

---

## 📊 Expected Results

### After Fixing All Critical Tests:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Test Coverage | 2.63% | 60%+ | +2200% |
| Hooks Coverage | 18.28% | 85%+ | +365% |
| API Coverage | 0.74% | 90%+ | +12000% |
| Provider Coverage | ~50% | 90%+ | +80% |
| Tests Passing | 430/584 | 550+/584 | +120 tests |
| Risk Level | 🔴 CRITICAL | 🟢 LOW | ✅ Safe |

### Timeline:

```
Day 1-2: Fix useLocalData (30 tests)
Day 3-4: Fix SyncProvider (20 tests)
Day 5-6: Fix API tests (50+ tests)
Day 7: Fix integration tests (10 tests)

Total: 1 week to get from CRITICAL to SAFE
```

---

## ✅ Success Criteria

Tests are considered "fixed" when:

- [ ] All tests pass without `.skip`
- [ ] No timeouts or hanging tests
- [ ] Coverage > 80% for tested modules
- [ ] Mocks match actual implementation
- [ ] Tests are maintainable and readable
- [ ] CI/CD passes

---

## 🚀 Next Steps

1. **Review this document** with team
2. **Assign tasks** to developers
3. **Set deadline** (recommend: 1 week)
4. **Track progress** daily
5. **Review coverage** after fixes
6. **Deploy to staging** for blackbox testing
7. **Sign off** before production

**Remember:** These tests are CRITICAL. Don't skip them! 🎯
