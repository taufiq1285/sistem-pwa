# API Caching Implementation Guide

## Overview

Semua API calls sekarang sudah di-wrap dengan caching layer untuk mendukung offline functionality.

## Pattern yang Digunakan

```typescript
import { cacheAPI } from "@/lib/offline/api-cache";

// Before (tidak ada caching)
export async function getData() {
  const { data } = await supabase.from("table").select();
  return data;
}

// After (dengan caching)
export async function getData() {
  return cacheAPI(
    "unique_cache_key", // Unique key untuk cache entry
    async () => {
      const { data } = await supabase.from("table").select();
      return data;
    },
    {
      ttl: 5 * 60 * 1000, // Cache selama 5 menit
      staleWhileRevalidate: true, // Return stale data saat offline
    },
  );
}
```

## How It Works

1. **Online Mode** (Navigator.onLine = true):
   - Cek cache dulu
   - Jika cache fresh (< TTL): return dari cache (instant)
   - Jika cache stale/tidak ada: fetch dari API, simpan ke cache, return data

2. **Offline Mode** (Navigator.onLine = false):
   - Cek cache
   - Return data dari cache (even if stale)
   - Jika tidak ada cache: throw error

3. **Stale While Revalidate**:
   - Return stale data immediately
   - Fetch fresh data di background
   - Update cache untuk next request

## Examples

### Example 1: Dashboard Stats (Simple)

```typescript
export async function getDashboardStats() {
  return cacheAPI(
    "dashboard_stats",
    async () => {
      const { data } = await supabase.from("stats").select("*").single();
      return data;
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: true,
    },
  );
}
```

### Example 2: User-Specific Data

```typescript
export async function getMyKelas(userId: string) {
  return cacheAPI(
    `kelas_${userId}`, // Include userId di cache key
    async () => {
      const { data } = await supabase
        .from("kelas")
        .select("*")
        .eq("user_id", userId);
      return data || [];
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes untuk data yang jarang berubah
    },
  );
}
```

### Example 3: List dengan Pagination

```typescript
export async function getItems(page: number, limit: number) {
  return cacheAPI(
    `items_page${page}_limit${limit}`, // Include params di key
    async () => {
      const { data } = await supabase
        .from("items")
        .select("*")
        .range((page - 1) * limit, page * limit - 1);
      return data || [];
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes untuk list data
    },
  );
}
```

### Example 4: Force Refresh

```typescript
// User explicitly clicks "Refresh"
const freshData = await getData({
  forceRefresh: true, // Skip cache, fetch dari API
});
```

## Cache Invalidation

### Invalidate Specific Cache

```typescript
import { invalidateCache } from "@/lib/offline/api-cache";

// After creating/updating data
async function createKelas(data) {
  const result = await supabase.from("kelas").insert(data);

  // Invalidate related caches
  await invalidateCache("kelas_list");
  await invalidateCache(`kelas_${userId}`);

  return result;
}
```

### Pattern-Based Invalidation

```typescript
import { invalidateCachePattern } from "@/lib/offline/api-cache";

// Invalidate all kelas-related caches
await invalidateCachePattern("kelas_");
```

## Best Practices

### 1. **Cache Keys Should Be Unique and Descriptive**

```typescript
// ❌ Bad
cacheAPI('data', ...)

// ✅ Good
cacheAPI('dosen_kelas_list', ...)
cacheAPI(`mahasiswa_nilai_${mahasiswaId}`, ...)
```

### 2. **Include Dynamic Parameters in Cache Key**

```typescript
// ❌ Bad - akan conflict antara different filters
cacheAPI('items', () => getItems(filter), ...)

// ✅ Good
cacheAPI(`items_${filter}_${sort}`, () => getItems(filter, sort), ...)
```

### 3. **Set Appropriate TTL**

```typescript
// Static/rarely changing data: longer TTL
cacheAPI('config', ..., { ttl: 60 * 60 * 1000 })  // 1 hour

// Frequently changing data: shorter TTL
cacheAPI('live_data', ..., { ttl: 30 * 1000 })    // 30 seconds

// User-specific data: medium TTL
cacheAPI('user_data', ..., { ttl: 5 * 60 * 1000 }) // 5 minutes
```

### 4. **Use Stale While Revalidate for Better UX**

```typescript
// For dashboard/overview pages
cacheAPI('dashboard', ..., {
  staleWhileRevalidate: true  // Show stale data immediately, update in background
})

// For critical/transactional data
cacheAPI('payment_status', ..., {
  staleWhileRevalidate: false  // Always fetch fresh
})
```

### 5. **Handle Errors Gracefully**

```typescript
export async function getData() {
  try {
    return await cacheAPI("key", fetcher, options);
  } catch (error) {
    console.error("Failed to get data:", error);
    // Return empty/default data instead of crashing
    return [];
  }
}
```

## Migration Checklist

API files yang perlu di-update dengan caching:

- [x] `dosen.api.ts` - getDosenStats() ✅
- [ ] `dosen.api.ts` - getMyKelas()
- [ ] `dosen.api.ts` - getUpcomingPracticum()
- [ ] `dosen.api.ts` - getPendingGrading()
- [ ] `dosen.api.ts` - getActiveKuis()
- [ ] `dosen.api.ts` - getMyBorrowingRequests()
- [ ] `mahasiswa.api.ts` - all GET functions
- [ ] `laboran.api.ts` - all GET functions
- [ ] `admin.api.ts` - all GET functions
- [ ] `kuis.api.ts` - all GET functions
- [ ] `jadwal.api.ts` - all GET functions
- [ ] `nilai.api.ts` - all GET functions
- [ ] `kehadiran.api.ts` - all GET functions
- [ ] `materi.api.ts` - all GET functions
- [ ] `inventaris.api.ts` - all GET functions

## Testing

### Test Offline Functionality

1. **Online → Offline → Online Flow**:

   ```
   1. Load page online (data di-fetch dan di-cache)
   2. Go offline (DevTools → Network → Offline)
   3. Refresh page (data di-load dari cache)
   4. Go online
   5. Refresh page (data di-update dari API)
   ```

2. **Check Cache Status**:

   ```javascript
   // In browser console
   const db = await window.indexedDB.open("praktikum_offline_db", 1);
   // Check metadata store for cache entries
   ```

3. **Test Stale Data**:
   ```
   1. Load data (fresh cache)
   2. Wait for TTL to expire
   3. Go offline
   4. Load data again (should get stale cache)
   ```

## Performance Tips

1. **Batch Related Requests**:

   ```typescript
   // Instead of multiple cached calls
   const [stats, kelas, jadwal] = await Promise.all([
     getStats(),
     getKelas(),
     getJadwal(),
   ]);
   ```

2. **Preload Critical Data**:

   ```typescript
   // On login, preload frequently needed data
   await Promise.all([
     cacheAPI('user_profile', ...),
     cacheAPI('user_permissions', ...),
     cacheAPI('app_config', ...),
   ]);
   ```

3. **Monitor Cache Size**:
   - IndexedDB has browser limits (usually 50MB-unlimited depending on browser)
   - Implement cache cleanup for old entries
   - Use shorter TTL for large datasets

## Troubleshooting

### Cache Not Working?

1. Check if IndexedDB is initialized
2. Check browser console for errors
3. Verify cache key is unique
4. Check if data is actually being returned from fetcher

### Stale Data Shown?

1. Check TTL settings
2. Use `forceRefresh: true` to bypass cache
3. Invalidate cache after mutations
4. Check if clock is synced correctly

### Offline Mode Not Working?

1. Verify `navigator.onLine` status
2. Check if data was cached when online
3. Check Service Worker status
4. Clear cache and try again
