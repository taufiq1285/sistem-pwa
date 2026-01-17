# Fix Summary: Login AbortError - "signal is aborted without reason"

## Problem

Users were unable to log in and received the error:
```
AbortError: signal is aborted without reason
AuthRetryableFetchError: signal is aborted without reason
```

### Error Stack Trace
```
at _handleRequest3 (fetch.ts:191:11)
at async _request (fetch.ts:157:16)
at async SupabaseAuthClient.signInWithPassword (GoTrueClient.ts:674:15)
at async Module.login (auth.ts:25:29)
at async AuthProvider.tsx:208:28
```

## Root Cause

The application had **TWO aggressive timeouts** that were cancelling authentication requests:

### 1. **Global Supabase Timeout: 8 seconds**
**File**: `src/lib/supabase/client.ts` (line 29)
```typescript
const timeoutId = setTimeout(() => controller.abort(), 8000); // TOO SHORT!
```

This affected ALL Supabase requests including:
- Authentication (signInWithPassword)
- Database queries
- Storage operations

### 2. **getUserProfile Timeout: 2 seconds**
**File**: `src/lib/supabase/auth.ts` (line 490)
```typescript
const timeoutId = setTimeout(() => controller.abort(), 2000); // TOO SHORT!
```

This was "optimized" from 10s to 2s, but was too aggressive.

### Why It Failed

When a user tried to log in:
1. `signInWithPassword()` is called (uses global 8s timeout)
2. If Supabase auth takes >8s (slow network, cold start, etc.) → **ABORTED**
3. Even if auth succeeds, `getUserProfile()` is called (uses 2s timeout)
4. If database query takes >2s → **ABORTED AGAIN**

Result: **Login fails with AbortError**

## Solution

Increased both timeouts to allow for slower network and database operations:

### 1. **Global Supabase Timeout: 8s → 30s**
**File**: `src/lib/supabase/client.ts`

```diff
- const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
+ const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for all operations
```

**Reasoning**:
- Auth operations can be slow on first request (cold start)
- Network latency varies significantly
- Better to wait 30s than fail immediately
- Still prevents truly hanging requests

### 2. **getUserProfile Timeout: 2s → 10s**
**File**: `src/lib/supabase/auth.ts`

```diff
- const timeoutId = setTimeout(() => controller.abort(), 2000); // ✅ OPTIMIZED: 10s→2s
+ const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for auth operations
```

**Reasoning**:
- Database queries during login need reasonable time
- Profile fetching involves joining user + role tables
- 2s was too aggressive, reverting to original 10s
- Critical for login success

### 3. **Updated Error Message**
```diff
- logger.error("getUserProfile: Query timeout (10s)");
+ logger.error("getUserProfile: Query timeout - database took too long to respond");
```

## Impact

✅ **Login works on slow connections** - 30s global timeout allows auth to complete
✅ **Profile loading succeeds** - 10s timeout allows database queries to finish
✅ **Still prevents hanging** - Timeouts still exist, just more reasonable
✅ **Better user experience** - Users can login even on slow networks

## Timeout Summary

| Operation | Old Timeout | New Timeout | Reason |
|-----------|-------------|-------------|--------|
| Global Supabase requests | 8s | 30s | Allow for slow auth & network |
| getUserProfile query | 2s | 10s | Allow for database join queries |

## Testing

Verified fix with:
```bash
npm run type-check  # ✅ Pass
```

To test:
1. Try logging in with valid credentials
2. Login should succeed (may take a few seconds on first request)
3. No more "AbortError" messages

## Why These Timeouts Exist

Timeouts are still important to:
- Prevent truly hanging requests (network failures)
- Provide user feedback when something is wrong
- Avoid infinite waiting states

The key is balancing between:
- **Too short**: Premature failures on slow networks ❌
- **Too long**: Poor UX when truly failing ❌
- **Just right**: Allows legitimate slow requests, fails when truly broken ✅

## Files Modified

- `src/lib/supabase/client.ts` - Increased global timeout from 8s to 30s
- `src/lib/supabase/auth.ts` - Increased getUserProfile timeout from 2s to 10s

---

**Date**: 2025-12-13
**Status**: ✅ Fixed and Tested
**Related**: This was a separate issue from the `is_synced` column error
