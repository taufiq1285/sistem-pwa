# FASE 2: Idempotency Implementation Guide

## 📋 Overview

**Fase 2** menambahkan **Idempotency** ke sistem PWA untuk mencegah duplikasi data submission.

### **Masalah Yang Dipecahkan:**
- ❌ User submit form 2x karena double-click → Data duplikat di database
- ❌ Sync retry karena network error → Same data di-submit berkali-kali
- ❌ Browser refresh saat submit → Operation dijalankan lagi
- ❌ Concurrent requests dengan data sama → Multiple records created

### **Solusi:**
- ✅ **Request ID unik** untuk setiap operasi
- ✅ **Server-side deduplication** cek sebelum execute
- ✅ **Cached responses** untuk return instant jika duplikat
- ✅ **Backward compatible** - existing code tetap jalan

---

## 🎯 Benefits

| Before Fase 2 | After Fase 2 |
|---------------|--------------|
| ❌ Double-click = 2 records | ✅ Double-click = 1 record (idempotent) |
| ❌ Retry = duplicate submission | ✅ Retry = return cached result |
| ❌ Network flaky = inconsistent data | ✅ Network flaky = guaranteed once |
| ❌ No way to detect duplicates | ✅ Automatic duplicate detection |

---

## 📦 Files Created

### **Client-Side (Frontend):**

1. **`src/lib/utils/idempotency.ts`** (580 lines)
   - Utility functions untuk generate & manage request IDs
   - Client-side deduplication helpers
   - Local storage management

2. **`src/lib/offline/queue-manager-idempotent.ts`** (480 lines)
   - Enhanced queue manager wrapper
   - Auto-adds requestId to queued items
   - Duplicate detection before enqueue

### **Server-Side (Backend):**

3. **`supabase/migrations/fase2_idempotency_request_log.sql`** (450 lines)
   - CREATE `request_log` table
   - Indexes untuk performance
   - Helper functions (RPC)
   - RLS policies

4. **`server/middleware/idempotency.middleware.example.ts`** (520 lines)
   - Express middleware template
   - Memory cache for performance
   - Automatic duplicate checking

5. **`server/api/IDEMPOTENCY_API_EXAMPLE.ts`** (350 lines)
   - Complete usage examples
   - Different framework implementations
   - Testing examples

---

## 🚀 Installation Guide

### **STEP 1: Run Server Migration**

**Option A: Supabase Dashboard**
1. Login ke Supabase Dashboard
2. Buka SQL Editor
3. Copy-paste isi `supabase/migrations/fase2_idempotency_request_log.sql`
4. Run SQL
5. Verify: Check Table Editor → `request_log` table ada

**Option B: Supabase CLI**
```bash
# If using Supabase CLI
supabase db reset # Reset local dev database

# Or apply migration manually
supabase db push
```

**Verification:**
```sql
-- Check table exists
SELECT * FROM pg_tables WHERE tablename = 'request_log';

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'check_request%';

-- Expected:
-- check_request_idempotency
-- log_request_start
-- log_request_complete
-- cleanup_expired_request_logs
```

---

### **STEP 2: Update Client Code (Optional - Backward Compatible)**

**Option A: Replace Queue Manager Globally**

Edit `src/context/SyncProvider.tsx` atau dimana `queueManager` di-import:

```typescript
// BEFORE
import { queueManager } from "@/lib/offline/queue-manager";

// AFTER (menggunakan idempotent version)
import { idempotentQueueManager as queueManager } from "@/lib/offline/queue-manager-idempotent";

// Rest of code unchanged!
```

**Option B: Use Selectively (Safe Approach)**

Hanya untuk operasi specific yang butuh idempotency:

```typescript
import { queueManager } from "@/lib/offline/queue-manager"; // Regular
import { idempotentQueueManager } from "@/lib/offline/queue-manager-idempotent"; // Enhanced

// For critical operations (quiz submit, payment, etc)
await idempotentQueueManager.enqueue('kuis_jawaban', 'create', data);

// For less critical (analytics, logs, etc)
await queueManager.enqueue('analytics', 'create', data);
```

**Option C: Manual Integration**

Add requestId manually tanpa ganti queue manager:

```typescript
import { generateRequestId, addIdempotencyKey } from "@/lib/utils/idempotency";

// When submitting data
const requestId = generateRequestId('kuis', 'create');
const dataWithId = {
  ...quizData,
  _requestId: requestId
};

// Regular queue enqueue
await queueManager.enqueue('kuis', 'create', dataWithId);
```

---

### **STEP 3: Update Server API Handlers**

**Choose ONE of these approaches:**

#### **Approach A: Middleware (Recommended for Express)**

```typescript
// server/api/kuis.ts
import { createIdempotencyMiddleware } from '../middleware/idempotency.middleware.example';

const idempotency = createIdempotencyMiddleware(supabase, {
  enabled: true,
  extractRequestId: (req) => req.body._requestId,
  extractMetadata: (req) => ({
    entity: 'kuis_jawaban',
    operation: 'create'
  })
});

app.post('/api/kuis/submit', idempotency, async (req, res) => {
  // Your handler logic (unchanged!)
  // Middleware handles duplicate checking automatically
});
```

#### **Approach B: Manual Check (Flexible)**

```typescript
// In your API handler
import { handleIdempotency } from '../middleware/idempotency.middleware.example';

export async function POST(req: Request) {
  const body = await req.json();
  const { _requestId, ...data } = body;

  // Check idempotency
  if (_requestId) {
    const existing = await handleIdempotency(supabase, _requestId);
    if (existing) {
      return Response.json(existing.result); // Return cached
    }

    // Log start
    await supabase.rpc('log_request_start', {
      p_request_id: _requestId,
      p_entity: 'kuis_jawaban',
      p_operation: 'create'
    });
  }

  try {
    // Process normally
    const result = await processSubmission(data);

    // Log completion
    if (_requestId) {
      await supabase.rpc('log_request_complete', {
        p_request_id: _requestId,
        p_result: result,
        p_status: 'completed'
      });
    }

    return Response.json(result);
  } catch (error) {
    // Log failure
    if (_requestId) {
      await supabase.rpc('log_request_complete', {
        p_request_id: _requestId,
        p_status: 'failed',
        p_error: error.message
      });
    }

    throw error;
  }
}
```

#### **Approach C: Function Wrapper (Clean)**

```typescript
import { withIdempotency } from '../middleware/idempotency.middleware.example';

// Define business logic
async function submitQuiz(data) {
  const { data: result } = await supabase
    .from('kuis_jawaban')
    .insert(data);
  return result;
}

// Wrap with idempotency
const submitQuizIdempotent = withIdempotency(supabase, submitQuiz);

// Use in handler
app.post('/api/kuis/submit', async (req, res) => {
  const { _requestId, ...data } = req.body;

  if (_requestId) {
    const result = await submitQuizIdempotent(
      _requestId,
      data,
      'kuis_jawaban',
      'create'
    );
    return res.json(result);
  }

  // Fallback for backward compatibility
  const result = await submitQuiz(data);
  return res.json(result);
});
```

---

## 📊 How It Works

### **Flow Diagram:**

```
CLIENT                          SERVER
  │                               │
  ├─ Generate requestId           │
  │  (req_kuis_create_123)        │
  │                               │
  ├─ Add to queue data            │
  │  { ...data, _requestId }      │
  │                               │
  ├─ POST /api/kuis/submit ──────►│
  │                               │
  │                               ├─ Extract requestId
  │                               │
  │                               ├─ Check request_log table
  │                               │  (SELECT WHERE request_id = ...)
  │                               │
  │                               ├─ IF EXISTS:
  │                               │  ├─ Status = completed?
  │                               │  │  └─ Return stored result ✅
  │                               │  ├─ Status = processing?
  │                               │  │  └─ Return 409 (retry later)
  │                               │  └─ Status = failed?
  │                               │     └─ Return 500 (error)
  │                               │
  │                               ├─ IF NOT EXISTS:
  │                               │  ├─ Log start (INSERT request_log)
  │                               │  ├─ Process request normally
  │                               │  ├─ Log completion (UPDATE request_log)
  │                               │  └─ Return result
  │                               │
  │◄────── Response (200/409/500) ─┤
  │                               │
  └─ Mark processed locally       │
     (localStorage)               │
```

---

## 🔑 Key Components

### **1. Request ID Format**

```typescript
// Format: {prefix}_{entity}_{operation}_{timestamp}_{random}
"req_kuis_create_1702736400000_abc123"

// Breakdown:
// - req: prefix (configurable)
// - kuis: entity type
// - create: operation type
// - 1702736400000: timestamp (for ordering/expiry)
// - abc123: random suffix (for uniqueness)
```

### **2. request_log Table Schema**

```sql
CREATE TABLE request_log (
  id UUID PRIMARY KEY,
  request_id TEXT UNIQUE NOT NULL,  -- Idempotency key
  entity TEXT NOT NULL,              -- 'kuis', 'kuis_jawaban'
  operation TEXT NOT NULL,           -- 'create', 'update', 'delete'
  user_id UUID,                      -- Who made the request
  status TEXT NOT NULL,              -- 'processing', 'completed', 'failed'
  result JSONB,                      -- Cached response
  error TEXT,                        -- Error message if failed
  created_at TIMESTAMPTZ,            -- When request started
  updated_at TIMESTAMPTZ,            -- Last update
  completed_at TIMESTAMPTZ,          -- When completed
  expires_at TIMESTAMPTZ             -- Auto-cleanup after 30 days
);
```

### **3. Client-Side Deduplication**

```typescript
// Before enqueue, check if already processed
const requestId = 'req_kuis_create_123';

if (wasRequestProcessed(requestId)) {
  console.log('Already processed, skipping...');
  return; // Don't enqueue again
}

// After successful sync
markRequestProcessed(requestId);
```

---

## 🧪 Testing

### **Test 1: Duplicate Prevention**

```typescript
import { idempotentQueueManager } from '@/lib/offline/queue-manager-idempotent';

async function testDuplicatePrevention() {
  const data = { kuis_id: '123', jawaban: { q1: 'A' } };

  // First enqueue
  const item1 = await idempotentQueueManager.enqueue('kuis_jawaban', 'create', data);
  console.log('First enqueue:', item1.requestId);

  // Second enqueue (same data, different call)
  const item2 = await idempotentQueueManager.enqueue('kuis_jawaban', 'create', data);
  console.log('Second enqueue:', item2.requestId);

  // ✅ Should have different requestIds
  console.assert(item1.requestId !== item2.requestId, 'Should be unique');

  // But with SAME requestId:
  const requestId = item1.requestId;
  const dataWithId = { ...data, _requestId: requestId };

  const item3 = await idempotentQueueManager.enqueue('kuis_jawaban', 'create', dataWithId);

  // ✅ Should detect duplicate
  console.assert(item3.status === 'completed', 'Should return completed virtual item');
}
```

### **Test 2: Server Deduplication**

```bash
# Send same request twice
curl -X POST http://localhost:3000/api/kuis/submit \
  -H "Content-Type: application/json" \
  -d '{"_requestId":"req_test_123","kuis_id":"1","jawaban":{"q1":"A"}}'

# Response 1: { success: true, id: "abc", score: 85 }

# Send again (same requestId)
curl -X POST http://localhost:3000/api/kuis/submit \
  -H "Content-Type: application/json" \
  -d '{"_requestId":"req_test_123","kuis_id":"1","jawaban":{"q1":"A"}}'

# Response 2: { success: true, id: "abc", score: 85 } (same result, instant return)
```

### **Test 3: Check Database**

```sql
-- Check request log
SELECT
  request_id,
  entity,
  operation,
  status,
  created_at,
  completed_at
FROM request_log
ORDER BY created_at DESC
LIMIT 10;

-- Expected:
-- request_id               | entity         | operation | status    | created_at          | completed_at
-- -------------------------|----------------|-----------|-----------|---------------------|---------------------
-- req_kuis_create_123_abc  | kuis_jawaban   | create    | completed | 2024-12-12 10:00:00 | 2024-12-12 10:00:01
```

---

## ⚠️ Important Notes

### **1. Backward Compatibility**

✅ **100% Backward Compatible**
- Old requests without `_requestId` → Process normally
- Existing queue items → Work as before
- No breaking changes to API contracts

### **2. Request ID Lifecycle**

```
┌─ Generate requestId
├─ Add to data { _requestId: "..." }
├─ Store in queue (IndexedDB)
├─ Send to server with data
├─ Server checks request_log
├─ Server stores result if new
├─ Client marks as processed (localStorage)
└─ Auto-cleanup after 30 days (both client & server)
```

### **3. When Idempotency Matters Most**

**High Priority:**
- ✅ Financial transactions
- ✅ Quiz submissions
- ✅ Attendance marking
- ✅ Grade updates
- ✅ Data modification

**Low Priority:**
- ⚪ Analytics events
- ⚪ Log entries
- ⚪ View tracking
- ⚪ Search queries

### **4. Performance Impact**

**Client:**
- Minimal: ~1-2ms to generate requestId
- Storage: ~50 bytes per requestId in localStorage

**Server:**
- First request: +1 query (check request_log)
- Duplicate request: +0 queries (return cached)
- Index makes lookup very fast (~1ms)

### **5. Cleanup & Maintenance**

**Client-Side:**
```typescript
import { cleanupProcessedRequests } from '@/lib/utils/idempotency';

// Manual cleanup (remove entries > 7 days old)
const removed = cleanupProcessedRequests();
console.log(`Cleaned up ${removed} old entries`);

// Or auto-cleanup on app init
idempotentQueueManager.initialize(); // Runs cleanup automatically
```

**Server-Side:**
```sql
-- Manual cleanup
SELECT cleanup_expired_request_logs();

-- Or setup cron job (Supabase pg_cron)
SELECT cron.schedule(
  'cleanup-request-logs',
  '0 2 * * *', -- Every day at 2 AM
  $$SELECT cleanup_expired_request_logs()$$
);
```

---

## 🎯 Migration Strategy

### **Recommended Rollout:**

**Phase 1: Client-Only (Week 1)**
1. Deploy client with idempotent queue manager
2. Monitor: Check localStorage for requestIds
3. Verify: No issues with queue processing

**Phase 2: Server Migration (Week 2)**
1. Run SQL migration (create request_log table)
2. Verify table & functions work
3. Test with sample data

**Phase 3: API Integration (Week 3)**
1. Add middleware to 1-2 critical endpoints first
2. Monitor request_log table
3. Verify duplicate detection works

**Phase 4: Full Rollout (Week 4)**
1. Apply to all relevant endpoints
2. Monitor for 1 week
3. Setup auto-cleanup cron

---

## 📈 Monitoring & Debugging

### **Check Client Stats:**

```typescript
import { getIdempotencyStats } from '@/lib/utils/idempotency';

const stats = getIdempotencyStats();
console.log('Client Idempotency Stats:', {
  total: stats.total,           // Total processed locally
  expired: stats.expired,       // Old entries
  recent: stats.recent,         // Active entries
  oldest: stats.oldestTimestamp,
  newest: stats.newestTimestamp
});
```

### **Check Server Stats:**

```sql
-- Recent requests (last 24h)
SELECT
  entity,
  operation,
  status,
  COUNT(*) as count
FROM request_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY entity, operation, status
ORDER BY count DESC;

-- Duplicate detection rate
SELECT
  COUNT(DISTINCT request_id) as unique_requests,
  COUNT(*) as total_attempts,
  (COUNT(*) - COUNT(DISTINCT request_id)) as duplicates_prevented
FROM request_log
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### **Check Queue Duplicates:**

```typescript
const duplicates = await idempotentQueueManager.findDuplicates();
console.log('Duplicates in queue:', duplicates);
// [
//   {
//     requestId: "req_kuis_create_123",
//     items: [item1, item2] // 2 items with same requestId
//   }
// ]
```

---

## ✅ Success Criteria

**Fase 2 berhasil jika:**
1. ✅ Migration SQL run tanpa error
2. ✅ `request_log` table exists dengan semua indexes
3. ✅ RPC functions bisa dipanggil
4. ✅ Client generate requestId untuk new operations
5. ✅ Server detect & prevent duplicates
6. ✅ Duplicate requests return cached result (not re-executed)
7. ✅ Backward compatible (old code tetap work)
8. ✅ No performance degradation

---

## 🚨 Troubleshooting

### **Issue 1: requestId Not Generated**

**Symptom:** Data tidak ada `_requestId` field

**Solution:**
```typescript
// Check if using idempotent queue manager
import { idempotentQueueManager } from '@/lib/offline/queue-manager-idempotent';

// Make sure it's initialized
await idempotentQueueManager.initialize();

// Check config
console.log(idempotentQueueManager.config);
// Should show: enableIdempotency: true
```

### **Issue 2: Server Not Checking Duplicates**

**Symptom:** Duplicate requests create multiple records

**Solution:**
```typescript
// Check middleware is applied
app.post('/api/kuis/submit',
  idempotency,  // ← Make sure this is here!
  async (req, res) => { ... }
);

// Or check manual implementation
const { _requestId } = req.body;
if (!_requestId) {
  console.warn('No requestId in request!');
}
```

### **Issue 3: request_log Table Missing**

**Symptom:** Error: relation "request_log" does not exist

**Solution:**
```sql
-- Run migration again
-- Copy-paste supabase/migrations/fase2_idempotency_request_log.sql

-- Verify
SELECT * FROM pg_tables WHERE tablename = 'request_log';
```

### **Issue 4: RPC Function Not Found**

**Symptom:** Error: function check_request_idempotency does not exist

**Solution:**
```sql
-- Check functions
SELECT proname FROM pg_proc WHERE proname LIKE '%request%';

-- Re-create if missing (from migration file)
-- Look for sections:
-- CREATE OR REPLACE FUNCTION check_request_idempotency...
-- CREATE OR REPLACE FUNCTION log_request_start...
-- CREATE OR REPLACE FUNCTION log_request_complete...
```

---

## 📚 Additional Resources

**Files to Reference:**
1. `src/lib/utils/idempotency.ts` - Client utils
2. `src/lib/offline/queue-manager-idempotent.ts` - Enhanced queue
3. `supabase/migrations/fase2_idempotency_request_log.sql` - Database
4. `server/middleware/idempotency.middleware.example.ts` - Server middleware
5. `server/api/IDEMPOTENCY_API_EXAMPLE.ts` - Usage examples

**Next Steps:**
- Consider **Fase 3**: Smart Conflict Resolution (business logic aware)
- Add monitoring dashboard for idempotency stats
- Setup automated testing for duplicate prevention

---

**Status:** ✅ Ready to Deploy (Low Risk - Backward Compatible)
**Generated:** 2024-12-12
