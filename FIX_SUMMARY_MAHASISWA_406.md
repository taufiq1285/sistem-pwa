# Fix Summary: Mahasiswa 406 Error

## Problem ❌
When a newly registered mahasiswa logs in, they see **406 errors** in the console:
```
GET /rest/v1/mahasiswa?select=id&user_id=eq.{userId} 406 (Not Acceptable)
```

This error occurred repeatedly (6+ times per page load) even though the mahasiswa could successfully:
- ✅ Complete registration
- ✅ Log in to dashboard
- ✅ See dashboard without crashing

## Root Cause 🔍
The `getMahasiswaId()` function in `src/lib/api/mahasiswa.api.ts:83` was using `.single()` which:
1. Expects exactly ONE row to exist
2. When RLS policies deny access, returns 406 instead of an empty result
3. The function had try-catch to ignore errors, but the repeated errors cluttered the console

## Solution ✅
Changed line 83 in `src/lib/api/mahasiswa.api.ts`:
```typescript
// BEFORE (line 83)
.single();

// AFTER (line 83)
.maybeSingle();
```

### Why This Works
- `.maybeSingle()` returns `null` if zero rows found (no error thrown)
- `.single()` throws error if zero or 2+ rows found
- `maybeSingle()` gracefully handles RLS denying access
- The catch block still handles any real errors
- Returns `null` which the calling functions handle correctly

## What Changed
**File:** `src/lib/api/mahasiswa.api.ts`
**Function:** `getMahasiswaId()`
**Line:** 83
**Change:** `.single()` → `.maybeSingle()`

## Testing ✅
Build completed successfully:
```
✓ 3812 modules transformed
✓ built in 32.74s
```

### How to Verify
1. **Clear cache** (Ctrl+Shift+Delete in browser)
2. **Log out** completely
3. **Register a NEW mahasiswa**
4. **Log in** with the new account
5. **Open DevTools** (F12 → Console)
6. **Verify:**
   - ✅ NO 406 errors
   - ✅ Dashboard loads clean
   - ✅ No console errors about mahasiswa queries
   - ✅ Admin can see the new mahasiswa in system

## Additional Notes
- This is the most common cause of 406 errors with Supabase RLS
- The error is silent because the function returns `null` on error
- All dependent functions (`getMahasiswaStats()`, `getAvailableKelas()`, etc.) handle `null` gracefully
- No breaking changes - just better error handling

## Files Modified
- `src/lib/api/mahasiswa.api.ts` (1 line changed)

---

**Status:** ✅ COMPLETE - Ready for testing
**Build:** ✅ PASSING
**Next Step:** Hard refresh browser and test new mahasiswa registration
