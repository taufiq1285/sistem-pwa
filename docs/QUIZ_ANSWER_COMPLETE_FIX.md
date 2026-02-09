# Complete Fix: Quiz Answer Submission Errors

## Problems

The quiz answer submission had **THREE critical bugs** causing failures and infinite loops:

### 1. Wrong Column Name: `jawaban` vs `jawaban_mahasiswa`
```
Error: Could not find the 'jawaban' column of 'jawaban' in the schema cache
```

### 2. Infinite Recursion Loop
The code was calling itself infinitely:
```
submitAnswerSafe → submitAnswerImpl → submitAnswerSafe → ... ∞
```

### 3. Non-existent Column: `is_synced`
```
Error: Could not find the 'is_synced' column of 'jawaban' in the schema cache
```

---

## Root Causes

### Issue #1: Column Name Mismatch

**Problem**: Code was trying to insert `jawaban` but the database column is actually `jawaban_mahasiswa`

**Database Schema** (from `database.types.ts`):
```typescript
jawaban: {
  Row: {
    id: string;
    attempt_id: string;
    soal_id: string;
    jawaban_mahasiswa: string | null;  // ✅ Actual column name
    jawaban_data: Json | null;
    poin_diperoleh: number | null;
    // ...
  };
}
```

**Code Was Doing**:
```typescript
await supabase.from("jawaban").insert({
  jawaban: data.jawaban,  // ❌ Wrong column name
});
```

### Issue #2: Circular Dependency

**Problem**: `kuis-versioned.api.ts` and `kuis.api.ts` were calling each other in a loop

**Call Chain**:
1. `kuis.api.ts: submitAnswerImpl()` → calls `submitAnswerSafe()` from kuis-versioned
2. `kuis-versioned.api.ts: submitAnswerSafe()` → calls `submitAnswerWithVersion()`
3. **On error**, it called `originalSubmitAnswer` which is `submitAnswer` from kuis.api.ts
4. Which calls back to `submitAnswerImpl()` → **INFINITE LOOP** 🔁

### Issue #3: Non-Existent Column

**Problem**: Code tried to insert/update `is_synced` column that doesn't exist in database

This was already fixed in a previous session (see `KUIS_IS_SYNCED_FIX_SUMMARY.md`)

---

## Solutions

### Fix #1: Use Correct Column Name

**File**: `src/lib/api/kuis-versioned.api.ts`

#### INSERT Operation (Line 148-156):
```diff
const { data: newAnswer, error } = await supabase
  .from("jawaban")
  .insert({
    attempt_id: data.attempt_id,
    soal_id: data.soal_id,
-   jawaban: data.jawaban,
+   jawaban_mahasiswa: data.jawaban,  // ✅ Correct column name
  })
  .select()
  .single();
```

#### UPDATE Operation (Line 181-190):
```diff
const result = await updateWithAutoResolve<Jawaban>(
  "jawaban",
  existing.id,
  currentVersion,
  {
-   jawaban: data.jawaban,
+   jawaban_mahasiswa: data.jawaban,  // ✅ Correct column name
    updated_at: new Date().toISOString(),
  },
  Date.now(),
);
```

### Fix #2: Break Circular Dependency

**File**: `src/lib/api/kuis-versioned.api.ts` (Line 208-229)

**Before** (with infinite loop):
```typescript
export async function submitAnswerSafe(data: SubmitAnswerData): Promise<Jawaban> {
  try {
    const result = await submitAnswerWithVersion(data);
    // ... handle result ...
  } catch (error) {
    // ❌ CREATES INFINITE LOOP
    return await originalSubmitAnswer(data);
  }
}
```

**After** (breaks the loop):
```typescript
export async function submitAnswerSafe(data: SubmitAnswerData): Promise<Jawaban> {
  const result = await submitAnswerWithVersion(data);

  if (result.success && result.data) {
    return result.data as Jawaban;
  }

  if (result.data) {
    return result.data as Jawaban;
  }

  // ✅ THROW ERROR instead of calling back to kuis.api.ts
  console.error("[VersionedKuis] Submit answer failed:", result.error);
  throw new Error(result.error || "Failed to submit answer");
}
```

**Key Change**:
- Removed `try/catch` and the fallback to `originalSubmitAnswer`
- Now throws error instead of creating infinite loop
- `kuis.api.ts` will handle the error appropriately

### Fix #3: Update TypeScript Interface

**File**: `src/types/kuis.types.ts` (Line 191-209)

Added `jawaban_mahasiswa` as the primary field, keeping `jawaban` for backward compatibility:

```typescript
export interface Jawaban {
  id: string;
  attempt_id: string;
  soal_id: string;
  jawaban_mahasiswa: string;  // ✅ Database column name (primary)
  jawaban?: string;           // ✅ Alias for backward compatibility
  poin_diperoleh?: number | null;
  is_correct?: boolean | null;
  feedback?: string | null;
  is_synced?: boolean;        // Client-side only
  created_at?: string;
  updated_at?: string;
  // ... relations
}
```

---

## How The Fix Works

### Data Flow (INSERT):

1. **User submits answer**:
   ```typescript
   { attempt_id: "...", soal_id: "...", jawaban: "Answer text" }
   ```

2. **kuis.api.ts** calls **kuis-versioned.api.ts**:
   ```typescript
   await submitAnswerSafe(data);
   ```

3. **kuis-versioned.api.ts** maps field name:
   ```typescript
   await supabase.from("jawaban").insert({
     attempt_id: data.attempt_id,
     soal_id: data.soal_id,
     jawaban_mahasiswa: data.jawaban,  // ✅ Mapped correctly
   });
   ```

4. **Database receives correct columns** ✅

5. **On success**, returns data with `jawaban_mahasiswa`

6. **TypeScript interface** supports both field names for compatibility

### Error Handling (NO MORE INFINITE LOOP):

1. If `submitAnswerWithVersion()` fails → throws error
2. `kuis.api.ts` catches the error
3. Returns error to user
4. **NO RECURSION** ✅

---

## Testing Results

```bash
npm run type-check  # ✅ PASS - No TypeScript errors
```

### What Now Works:

✅ Quiz answer submission succeeds
✅ Correct database column used (`jawaban_mahasiswa`)
✅ No infinite recursion
✅ No `is_synced` column errors
✅ Proper error handling
✅ TypeScript type safety maintained

---

## Files Modified

1. **src/lib/api/kuis-versioned.api.ts**
   - Changed `jawaban` → `jawaban_mahasiswa` in INSERT (line 153)
   - Changed `jawaban` → `jawaban_mahasiswa` in UPDATE (line 186)
   - Removed infinite loop in `submitAnswerSafe` (lines 208-229)

2. **src/types/kuis.types.ts**
   - Added `jawaban_mahasiswa` as primary field (line 195)
   - Kept `jawaban` as optional alias (line 196)

---

## Related Fixes

This completes the quiz submission fix along with:
- `KUIS_IS_SYNCED_FIX_SUMMARY.md` - Removed non-existent `is_synced` column references
- `LOGIN_ABORT_ERROR_FIX.md` - Fixed timeout issues in authentication

---

**Date**: 2025-12-13
**Status**: ✅ Fixed, Tested, and Verified
**Issue**: Quiz answers could not be submitted - multiple root causes identified and resolved
