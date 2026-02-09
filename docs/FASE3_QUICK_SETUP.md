# FASE 3: Quick Setup Guide

**Optimistic Locking & Smart Conflict Resolution**

---

## 🎯 QUICK START (5 Steps)

### Step 1: Check Database (5 menit)

```bash
# 1. Buka Supabase Dashboard
# 2. Klik SQL Editor
# 3. Copy isi file: supabase/check-database-structure.sql
# 4. Paste dan Run
# 5. Screenshot hasilnya
```

**Yang perlu dicatat:**
- [ ] Apakah `attempt_kuis` table exists?
- [ ] Apakah `jawaban` table exists?
- [ ] Apakah ada kolom `_version` yang sudah ada?
- [ ] Apakah `kuis` table punya kolom `version`?

---

### Step 2: Edit Migration Script (2 menit)

File: `supabase/migrations/fase3_optimistic_locking_ADJUSTED.sql`

**Cari baris 23:**
```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban']; -- 👈 EDIT THIS LINE
```

**Pilih konfigurasi:**

**Option A: MINIMAL (Recommended untuk test pertama)**
```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban'];
```
✅ Paling aman
✅ Fokus pada fitur kuis offline
✅ Mudah rollback

**Option B: STANDARD (Recommended untuk production)**
```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'nilai', 'kehadiran'];
```
✅ Cover semua use case penting
✅ Balance antara safety & coverage

**Option C: COMPREHENSIVE**
```sql
v_tables TEXT[] := ARRAY['attempt_kuis', 'jawaban', 'nilai', 'kehadiran', 'materi', 'soal'];
```
⚠️ Paling kompleks
⚠️ Testing lebih lama

---

### Step 3: Run Migration (3 menit)

```bash
# Option A: Via Supabase Dashboard
# 1. Buka SQL Editor
# 2. Copy isi file: supabase/migrations/fase3_optimistic_locking_ADJUSTED.sql
# 3. Paste dan Run
# 4. Lihat output di NOTICES

# Option B: Via Supabase CLI (jika sudah install)
supabase db push
```

**Expected Output:**
```
========================================
FASE 3: Optimistic Locking Migration
========================================

Processing table: attempt_kuis
  ✅ Added _version column
  ✅ Created version increment trigger

Processing table: jawaban
  ✅ Added _version column
  ✅ Created version increment trigger

========================================
MIGRATION SUMMARY
========================================
Tables processed: 2
Columns added: 2
Triggers created: 2
Functions created: 4

Status: ✅ COMPLETE
========================================
```

---

### Step 4: Verify Migration (2 menit)

Run query ini di SQL Editor untuk verify:

```sql
-- Check version columns
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = '_version'
ORDER BY table_name;
```

**Expected result:**
```
table_name     | column_name | data_type
---------------|-------------|----------
attempt_kuis   | _version    | integer
jawaban        | _version    | integer
```

```sql
-- Test version increment
-- Ambil 1 record attempt_kuis
SELECT id, status, _version
FROM attempt_kuis
LIMIT 1;

-- Update record tersebut
UPDATE attempt_kuis
SET status = 'in_progress'
WHERE id = 'paste-id-dari-query-atas';

-- Cek version bertambah
SELECT id, status, _version
FROM attempt_kuis
WHERE id = 'paste-id-dari-query-atas';
-- _version should be +1
```

---

### Step 5: Update Frontend Code (5 menit)

**File 1: Register Conflict Rules**

Create file: `src/lib/offline/conflict-resolver.init.ts`

```typescript
import { conflictRules } from './conflict-rules.config';
import { registerConflictRule } from './smart-conflict-resolver';

/**
 * Initialize conflict resolution rules
 * Call this once at app startup
 */
export function initializeConflictRules() {
  conflictRules.forEach(rule => {
    registerConflictRule(rule);
  });

  console.log(`[Conflict Resolver] Registered ${conflictRules.length} rules`);
}
```

**File 2: Call at App Startup**

Edit: `src/main.tsx` or `src/App.tsx`

```typescript
import { initializeConflictRules } from '@/lib/offline/conflict-resolver.init';

// Add this before rendering
initializeConflictRules();
```

**File 3: Use in Sync Manager**

Edit: `src/lib/offline/sync-manager.ts`

Find the sync function dan tambahkan version check:

```typescript
import { resolveConflict } from './smart-conflict-resolver';

async function syncItem(item: SyncQueueItem) {
  try {
    // Get current version from local data
    const localVersion = item.data._version || 1;

    // Try to sync with version check
    const { data, error } = await supabase
      .from(item.entity)
      .update({ ...item.data, _expected_version: localVersion })
      .eq('id', item.data.id)
      .select()
      .single();

    if (error) {
      // Check if it's a version conflict
      if (error.message.includes('version conflict')) {
        // Get remote data
        const { data: remoteData } = await supabase
          .from(item.entity)
          .select('*')
          .eq('id', item.data.id)
          .single();

        if (remoteData) {
          // Use smart conflict resolver
          const resolved = await resolveConflict(
            item.entity,
            item.data.id,
            item.data,        // local
            remoteData,       // remote
            Date.now(),       // local timestamp
            new Date(remoteData.updated_at).getTime() // remote timestamp
          );

          // Handle resolution
          if (resolved.resolution === 'auto') {
            // Auto-resolved, sync the merged data
            return supabase
              .from(item.entity)
              .update(resolved.mergedData)
              .eq('id', item.data.id);
          } else {
            // Manual resolution needed
            // Show ConflictResolutionDialog
            showConflictDialog(resolved);
          }
        }
      }

      throw error;
    }

    return data;
  } catch (err) {
    console.error('Sync error:', err);
    throw err;
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

Setelah semua selesai, verify dengan checklist ini:

### Database
- [ ] Kolom `_version` ada di table `attempt_kuis`
- [ ] Kolom `_version` ada di table `jawaban`
- [ ] Trigger `trigger_increment_attempt_kuis_version` exists
- [ ] Trigger `trigger_increment_jawaban_version` exists
- [ ] Function `increment_version()` exists
- [ ] Function `check_version_conflict()` exists
- [ ] Table `conflict_log` exists

### Frontend
- [ ] File `conflict-rules.config.ts` created
- [ ] File `conflict-resolver.init.ts` created
- [ ] Rules di-register di app startup
- [ ] Sync manager updated dengan version check
- [ ] ConflictResolutionDialog ready

### Testing
- [ ] Version increment test berhasil (Step 4 di atas)
- [ ] Buat quiz attempt offline
- [ ] Update offline beberapa kali
- [ ] Sync ke server
- [ ] Cek `_version` bertambah di database

---

## 🚀 MANUAL TEST SCENARIO

### Test 1: Simple Version Increment

```typescript
// 1. Offline - buat attempt baru
const attempt = await createQuizAttempt({
  kuis_id: 'quiz-id',
  mahasiswa_id: 'student-id',
  status: 'in_progress'
});
// Local: _version = 1

// 2. Update beberapa kali
await updateAttempt(attempt.id, { auto_save_data: { q1: 'A' } });
// Local: _version = 2

await updateAttempt(attempt.id, { auto_save_data: { q1: 'A', q2: 'B' } });
// Local: _version = 3

// 3. Sync to server
await syncQueue();

// 4. Check di Supabase
// SELECT * FROM attempt_kuis WHERE id = 'attempt-id'
// _version should be 3
```

### Test 2: Conflict Resolution

```typescript
// SETUP:
// 1. Device A: Buat attempt, _version = 1
// 2. Sync ke server
// 3. Offline mode di Device A dan Device B

// SCENARIO:
// Device A (offline):
await updateAttempt(id, { auto_save_data: { q1: 'A', q2: 'B' } });
// Local A: _version = 2

// Device B (offline):
await updateAttempt(id, { auto_save_data: { q1: 'C', q2: 'D' } });
// Local B: _version = 2 (same!)

// Device A goes online first:
await syncQueue(); // Success, server now version 2

// Device B goes online:
await syncQueue();
// ⚠️ CONFLICT DETECTED!
// Expected version: 2
// Server version: 2 (from Device A)
// Smart resolver will:
// 1. Compare field by field
// 2. Auto-resolve jika bisa
// 3. Atau show dialog untuk manual review
```

---

## 🔥 TROUBLESHOOTING

### Error: "column _version does not exist"

**Cause:** Migration belum dijalankan atau gagal

**Fix:**
```sql
-- Check apakah column ada
SELECT column_name FROM information_schema.columns
WHERE table_name = 'attempt_kuis';

-- Jika tidak ada, tambahkan manual
ALTER TABLE attempt_kuis ADD COLUMN _version INTEGER DEFAULT 1 NOT NULL;
```

### Error: "trigger already exists"

**Cause:** Migration dijalankan 2x

**Fix:**
```sql
-- Drop dulu, baru create lagi
DROP TRIGGER IF EXISTS trigger_increment_attempt_kuis_version ON attempt_kuis;

-- Re-run migration
```

### Version tidak auto-increment

**Cause:** Trigger tidak jalan

**Fix:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%version%';

-- Test trigger manually
UPDATE attempt_kuis SET status = 'in_progress' WHERE id = 'test-id';
SELECT id, _version FROM attempt_kuis WHERE id = 'test-id';
```

### Conflict tidak terdeteksi

**Cause:** Frontend code belum updated

**Fix:**
- Pastikan `initializeConflictRules()` dipanggil
- Pastikan sync-manager.ts updated
- Check browser console untuk error

---

## 📊 MONITORING

Setelah deploy, monitor metrics ini:

### Database Metrics

```sql
-- Total conflicts per day
SELECT
  DATE(created_at) as date,
  COUNT(*) as conflict_count
FROM conflict_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Conflicts by entity
SELECT
  entity,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_time_seconds
FROM conflict_log
WHERE resolved_at IS NOT NULL
GROUP BY entity
ORDER BY count DESC;

-- Pending manual reviews
SELECT
  entity,
  entity_id,
  created_at,
  local_version,
  remote_version
FROM conflict_log
WHERE status = 'pending'
ORDER BY created_at ASC;
```

### Expected Results (Normal Operation)

- **Conflict rate:** < 5% of total syncs
- **Auto-resolution rate:** > 80%
- **Manual review rate:** < 20%
- **Average resolution time:** < 30 seconds

### Red Flags 🚨

- Conflict rate > 20%
- Manual review rate > 50%
- Same conflict repeating
- Version stuck at 1

---

## 🎓 WHAT'S NEXT?

After Fase 3 stable:

1. **Fase 4: Advanced Conflict Resolution**
   - Field-level merging
   - Three-way merge algorithm
   - Automatic conflict prediction

2. **Fase 5: Performance Optimization**
   - Batch version checks
   - Optimistic UI updates
   - Reduced server round-trips

3. **Fase 6: Analytics & Insights**
   - Conflict heatmap
   - User behavior analysis
   - Sync performance dashboard

---

## 📞 SUPPORT

Jika ada masalah:

1. Check `FASE3_DATABASE_ANALYSIS.md` untuk detail
2. Review migration output di SQL Editor
3. Check browser console untuk frontend errors
4. Check `conflict_log` table untuk manual reviews

---

**Ready? Let's go! 🚀**

Start dengan **Step 1: Check Database**
