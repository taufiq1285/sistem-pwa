# Optimistic Locking Integration Guide

**FASE 3 - Week 4**: How to integrate version checking in your API calls

---

## 📚 Available Functions

**File**: `src/lib/api/versioned-update.api.ts`

### 1. `safeUpdateWithVersion()` - Basic Version Check

```typescript
const result = await safeUpdateWithVersion(
  "attempt_kuis",
  id,
  expectedVersion,
  updates,
);

if (!result.success) {
  if (result.conflict) {
    // Handle conflict manually
    console.log("Conflict:", result.conflict);
  }
}
```

**Use when**: You want full control over conflict handling

---

### 2. `updateWithAutoResolve()` - Automatic Resolution

```typescript
const result = await updateWithAutoResolve(
  "attempt_kuis",
  id,
  expectedVersion,
  updates,
  localTimestamp,
);

// Conflicts are automatically resolved using smart conflict resolver
```

**Use when**: You trust the business rules to handle conflicts

---

### 3. `updateWithConflictLog()` - Manual Resolution

```typescript
const result = await updateWithConflictLog(
  "attempt_kuis",
  id,
  expectedVersion,
  updates,
);

if (!result.success && result.conflict) {
  // Conflict logged to conflict_log table
  // User will resolve via ConflictResolver UI
  showNotification("Conflict detected. Please review in Conflicts page.");
}
```

**Use when**: You want user to manually resolve conflicts

---

### 4. `checkVersionConflict()` - Pre-check

```typescript
const check = await checkVersionConflict("attempt_kuis", id, expectedVersion);

if (check.hasConflict) {
  // Show warning before attempting update
  const confirmed = await confirmDialog(
    `Data has changed (v${check.currentVersion}). Continue anyway?`,
  );
}
```

**Use when**: You want to warn user before update

---

## 🔧 Integration Examples

### Example 1: Quiz Attempt Submission

**Before (No Version Check)**:

```typescript
// OLD CODE - No conflict detection
export async function submitQuizAnswer(attemptId: string, answers: any) {
  const { data, error } = await supabase
    .from("attempt_kuis")
    .update({
      status: "selesai",
      jawaban: answers,
      waktu_selesai: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .select()
    .single();

  return { data, error };
}
```

**After (With Optimistic Locking)**:

```typescript
import { updateWithAutoResolve, getVersion } from "./versioned-update.api";

export async function submitQuizAnswer(
  attemptId: string,
  answers: any,
  currentAttempt: any, // Pass current data with _version
) {
  const currentVersion = getVersion(currentAttempt);

  const result = await updateWithAutoResolve(
    "attempt_kuis",
    attemptId,
    currentVersion,
    {
      status: "selesai",
      jawaban: answers,
      waktu_selesai: new Date().toISOString(),
    },
    Date.now(), // Local timestamp
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to submit quiz");
  }

  return { data: result.data, error: null };
}
```

---

### Example 2: Grade Update (Manual Resolution Required)

```typescript
import { updateWithConflictLog, getVersion } from "./versioned-update.api";

export async function updateGrade(
  nilaiId: string,
  newGrade: number,
  currentNilai: any,
) {
  const currentVersion = getVersion(currentNilai);

  const result = await updateWithConflictLog("nilai", nilaiId, currentVersion, {
    nilai: newGrade,
    updated_at: new Date().toISOString(),
  });

  if (!result.success) {
    if (result.conflict) {
      // Conflict logged - user must resolve
      return {
        data: null,
        error: "Conflict detected",
        requiresManualResolution: true,
      };
    }

    return {
      data: null,
      error: result.error,
    };
  }

  return {
    data: result.data,
    error: null,
  };
}
```

---

### Example 3: Attendance Check-in

```typescript
import { updateWithAutoResolve, getVersion } from "./versioned-update.api";

export async function checkIn(
  kehadiranId: string,
  location: string,
  currentKehadiran: any,
) {
  const currentVersion = getVersion(currentKehadiran);

  const result = await updateWithAutoResolve(
    "kehadiran",
    kehadiranId,
    currentVersion,
    {
      status: "hadir",
      waktu_check_in: new Date().toISOString(),
      lokasi: location,
    },
    Date.now(),
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to check in");
  }

  return { data: result.data, error: null };
}
```

---

### Example 4: Quiz Builder (Save Draft)

```typescript
import { safeUpdateWithVersion, getVersion } from "./versioned-update.api";

export async function saveQuizDraft(
  kuisId: string,
  draftData: any,
  currentKuis: any,
) {
  const currentVersion = getVersion(currentKuis);

  const result = await safeUpdateWithVersion(
    "kuis",
    kuisId,
    currentVersion,
    draftData,
  );

  if (!result.success) {
    if (result.conflict) {
      // Show conflict dialog immediately
      const resolution = await showConflictDialog(result.conflict);
      if (resolution) {
        // User chose resolution, apply it
        return applyResolution(kuisId, resolution);
      }
    }

    throw new Error(result.error || "Failed to save draft");
  }

  return { data: result.data, newVersion: result.newVersion };
}
```

---

## 🎯 When to Use Which Function?

| Scenario            | Recommended Function      | Reason                           |
| ------------------- | ------------------------- | -------------------------------- |
| **Quiz submission** | `updateWithAutoResolve()` | Auto-resolve with business rules |
| **Grade entry**     | `updateWithConflictLog()` | Teacher must review conflicts    |
| **Attendance**      | `updateWithAutoResolve()` | Auto-resolve based on rules      |
| **Quiz builder**    | `safeUpdateWithVersion()` | Show conflict immediately        |
| **Material update** | `updateWithAutoResolve()` | Published status rules apply     |
| **Profile update**  | `safeUpdateWithVersion()` | User should see conflict         |

---

## ⚠️ Important Notes

### 1. Always Pass Current Data with Version

```typescript
// ❌ BAD - No version
const result = await updateWithAutoResolve("table", id, 1, updates);

// ✅ GOOD - Get version from current data
const currentData = await fetchCurrentData(id);
const version = getVersion(currentData);
const result = await updateWithAutoResolve("table", id, version, updates);
```

### 2. Handle Conflict Results

```typescript
const result = await updateWithConflictLog("table", id, version, updates);

if (!result.success) {
  if (result.conflict) {
    // Conflict logged - notify user
    showNotification({
      type: "warning",
      message: "Data conflict detected. Please review in Conflicts page.",
      action: {
        label: "Review Now",
        onClick: () => openConflictsDialog(),
      },
    });
  } else {
    // Other error
    showErrorNotification(result.error);
  }
}
```

### 3. Update Local State with New Version

```typescript
const result = await updateWithAutoResolve("table", id, version, updates);

if (result.success && result.newVersion) {
  // Update local state with new version
  setLocalData({
    ...localData,
    ...updates,
    _version: result.newVersion,
  });
}
```

---

## 🔄 Migration Strategy

### Phase 1: Critical Operations (Week 4 Day 2)

- ✅ Quiz submission (`attempt_kuis`)
- ✅ Answer updates (`jawaban`)

### Phase 2: High-Impact Operations (Week 4 Day 3)

- Grade entry (`nilai`)
- Attendance check-in (`kehadiran`)

### Phase 3: All Operations (Week 4 Day 4-5)

- Material updates (`materi`)
- Quiz builder (`kuis`)
- Quiz questions (`soal`)

---

## 📊 Testing Checklist

### Unit Tests

- [ ] Version conflict detection works
- [ ] Auto-resolve applies correct business rules
- [ ] Conflict logging saves to database
- [ ] Version numbers increment correctly

### Integration Tests

- [ ] Concurrent updates trigger conflict
- [ ] Resolved data is applied correctly
- [ ] UI shows conflict notification
- [ ] Manual resolution flow works end-to-end

### User Acceptance Tests

- [ ] User can submit quiz with conflict
- [ ] User can resolve conflict via UI
- [ ] Resolved data syncs to server
- [ ] No data loss in any scenario

---

## 🐛 Troubleshooting

### Issue: "Record not found"

**Cause**: Record was deleted or ID is wrong
**Solution**: Check if record exists before update

### Issue: "Version conflict" on first save

**Cause**: `_version` column missing or not initialized
**Solution**: Ensure migration ran successfully, check `_version = 1` on existing records

### Issue: Auto-resolve not working

**Cause**: No business rule matches entity type
**Solution**: Check `smart-conflict-resolver.ts` for registered rules, add if needed

### Issue: Conflict not logged

**Cause**: `log_conflict()` function error
**Solution**: Check database logs, verify conflict_log table exists

---

## 📈 Performance Considerations

1. **Version Check Overhead**: ~10-20ms per update (acceptable)
2. **Conflict Detection**: Only when versions mismatch (rare)
3. **Auto-Resolve**: Adds ~50-100ms when conflict occurs
4. **Manual Log**: Adds ~100-200ms when logging conflict

**Recommendation**: Use auto-resolve for most cases, manual only for critical data

---

## ✅ Best Practices

1. ✅ **Always** get version from current data before update
2. ✅ **Always** handle conflict result (don't ignore)
3. ✅ **Always** update local state with new version
4. ✅ **Prefer** auto-resolve for non-critical data
5. ✅ **Use** manual resolution for grades/critical data
6. ✅ **Show** user notification when conflict occurs
7. ✅ **Log** all conflicts for audit trail
8. ✅ **Test** with concurrent updates in dev environment

---

## 🎓 Learning Resources

- **Smart Conflict Resolver**: `src/lib/offline/smart-conflict-resolver.ts`
- **Business Rules**: Lines 180-315 in above file
- **Database Functions**: `supabase/migrations/fase3_SIMPLE.sql`
- **UI Components**: `src/components/features/sync/ConflictResolver.tsx`

---

**Last Updated**: 2025-12-12
**Version**: Week 4 Day 1
**Status**: Ready for Integration
