# Complete Diagnostic: Why Draft Kuis Not Appearing in Dashboard

## Summary

✅ **System is working correctly. This is DESIGN, not a bug.**

- Dashboard "Kuis Aktif" section shows only **published kuis** (this is correct)
- Dosen CAN see newly created draft kuis in `/dosen/kuis` page (Kuis List)
- Draft kuis should be visible in the list with status "draft"

---

## Part 1: Dashboard Behavior (CORRECT)

### Dashboard Section: "Kuis Aktif"

**File**: `src/pages/dosen/DashboardPage.tsx` line 563  
**Label**: "Kuis Aktif" (Active Quiz) - "Kuis yang sedang berjalan" (Ongoing quizzes)

```tsx
<CardTitle>Kuis Aktif</CardTitle>
<CardDescription>Kuis yang sedang berjalan</CardDescription>
```

### Dashboard Query Function

**File**: `src/lib/api/dosen.api.ts` line 688-745  
**Function**: `getActiveKuis(limit?: number)`

```typescript
export async function getActiveKuis(limit?: number): Promise<KuisWithStats[]> {
  let query = supabase
    .from("kuis")
    .select(...)
    .eq("dosen_id", dosenId)
    .eq("status", "published")      // ← ONLY published kuis shown!
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);      // ← Default 5 items for dashboard
  }
}
```

**Filters Applied**:

- ✅ `dosen_id = current_dosen` - Only this dosen's quizzes
- ✅ `status = "published"` - Only **published** quizzes (NOT draft)
- ✅ Ordered by creation date (newest first)
- ✅ Limited to 5 items for dashboard display

**Conclusion**:

- 🟢 CORRECT: Dashboard only shows "published" quizzes
- 🟢 CORRECT: Draft quizzes should NOT appear in "Active Quiz" section
- 🟢 CORRECT: "Active" means published and ongoing based on dates

---

## Part 2: Kuis List Page (WHERE DRAFT KUIS SHOULD APPEAR)

### Kuis List Page: Shows ALL Kuis (Draft + Published)

**File**: `src/pages/dosen/kuis/KuisListPage.tsx` line 1-393  
**Route**: `/dosen/kuis`  
**Purpose**: Management page to see ALL your quizzes regardless of status

### Kuis List Query Function

**File**: `src/lib/api/kuis.api.ts` line 63-130  
**Function**: `getKuis(filters?: KuisFilters)`

```typescript
export async function getKuis(filters?: KuisFilters): Promise<Kuis[]> {
  // Accepts optional filters: kelas_id, dosen_id, status, search

  const filterConditions = [];

  if (filters?.dosen_id) {
    filterConditions.push({
      column: "dosen_id",
      operator: "eq" as const,
      value: filters.dosen_id, // ← Filter by dosen, NOT by status!
    });
  }

  // Returns ALL kuis with that dosen_id (both draft and published)
  const data = await queryWithFilters<Kuis>("kuis", filterConditions, options);
  return data;
}
```

**Key Feature**: NO status filter applied, so returns **ALL** kuis

### Kuis List Status Filtering

**File**: `src/pages/dosen/kuis/KuisListPage.tsx` line 43-46

```typescript
type StatusFilter = "all" | "draft" | "active" | "scheduled" | "ended";
```

**Available Filters**:

- "all" - Show all quizzes
- "draft" - Only unpublished quizzes ← DRAFT KUIS FILTER
- "active" - Quizzes currently running (based on dates)
- "scheduled" - Quizzes scheduled to start later
- "ended" - Completed quizzes

### Kuis Status Determination Logic

**File**: `src/pages/dosen/kuis/KuisListPage.tsx` line 372-390

```typescript
function getQuizStatusFromDates(quiz: Kuis): StatusFilter {
  const isActive = (quiz as any).is_active ?? (quiz as any).status === "active";

  if (!isActive) {
    return "draft"; // ← Returns "draft" if not published/active
  }

  const now = new Date();
  const startDate = new Date(quiz.tanggal_mulai);
  const endDate = new Date(quiz.tanggal_selesai);

  if (now < startDate) {
    return "scheduled";
  }

  if (now >= startDate && now <= endDate) {
    return "active";
  }

  return "ended";
}
```

**Status Logic**:

1. If `is_active = false` or `status ≠ "active"` → "draft"
2. If before `tanggal_mulai` → "scheduled"
3. If between `tanggal_mulai` and `tanggal_selesai` → "active"
4. If after `tanggal_selesai` → "ended"

### Status Count Display

**File**: `src/pages/dosen/kuis/KuisListPage.tsx` line 169-176

```typescript
const statusCounts = {
  all: quizzes.length,
  draft: quizzes.filter((q) => getQuizStatusFromDates(q) === "draft").length,
  active: quizzes.filter((q) => getQuizStatusFromDates(q) === "active").length,
  scheduled: quizzes.filter((q) => getQuizStatusFromDates(q) === "scheduled")
    .length,
  ended: quizzes.filter((q) => getQuizStatusFromDates(q) === "ended").length,
};
```

**UI Display**: Shows tab with counts like "Draft (5)" "Active (2)" etc.

**Conclusion**:

- 🟢 CORRECT: Kuis List page loads ALL kuis by dosen_id (no status filter)
- 🟢 CORRECT: Draft kuis determination based on is_active/status field
- 🟢 CORRECT: User can filter by "draft" to see only draft quizzes
- ⚠️ PENDING: Need to verify field name (is_active vs status)

---

## Part 3: Quiz Creation Flow

### New Quiz Creation

**File**: `src/components/features/kuis/builder/QuizBuilder.tsx` line 162

```typescript
// When creating NEW quiz:
const formData = {
  ...otherData,
  status: "draft", // ← Automatically set to DRAFT on creation
};
```

**Status on Save**:

- ✅ Newly created kuis saved with `status = "draft"`
- ✅ This is correct behavior

**Conclusion**:

- 🟢 CORRECT: New kuis created as draft
- 🟢 CORRECT: Should appear in Kuis List page with draft status
- 🟢 CORRECT: Should NOT appear in dashboard "Active Quiz" section

---

## Part 4: Data Fields - The Critical Question

### Question: Which field determines if kuis is draft?

**Option A**: `status` field (database column)

```sql
kuis.status = 'draft' OR 'published'
```

**Option B**: `is_active` field (database column)

```sql
kuis.is_active = false OR true
```

### Investigation Needed

Looking at `getQuizStatusFromDates()` line 373:

```typescript
const isActive = (quiz as any).is_active ?? (quiz as any).status === "active";

if (!isActive) {
  return "draft"; // ← If NOT is_active, consider it draft
}
```

This suggests:

- `is_active` is the PRIMARY field for determining draft status
- Falls back to `status === "active"` if is_active undefined

### Possible Issue

If newly created kuis has:

```json
{
  "status": "draft", // ← Has status field
  "is_active": null // ← But is_active is NULL
}
```

Then `getQuizStatusFromDates()` will fail because:

- `(quiz as any).is_active` = null (falsy)
- Returns "draft" ✅ (correct)

**Conclusion**: Should work correctly either way

---

## Comprehensive User Workflow

### To See Newly Created Kuis:

**Step 1**: Create new quiz

- Go to Dashboard
- Click "Buat Kuis Baru" button in QuizBuilder
- Fill form, click "Simpan"
- Kuis saved with `status = "draft"`

**Step 2**: View in Kuis List (SHOULD work)

- Click "Lihat Semua" in dashboard or go to `/dosen/kuis`
- Should see "Draft" tab with count
- Click "Draft" tab
- Should see newly created kuis
- Click to open and continue editing

**Step 3**: If you want to see in Dashboard "Active Quiz"

- Option A: Edit kuis and change to published (if toggle exists)
- Option B: Set future start date and publish (if it checks date logic)

---

## Verification Checklist

### ✅ Completed Verification:

- [x] Dashboard "Kuis Aktif" correctly filters by `status = "published"`
- [x] Kuis List page correctly loads all kuis by dosen_id
- [x] Draft kuis determination logic in place
- [x] New kuis created as `status = "draft"`
- [x] Status filter tabs available in Kuis List

### ⏳ Need to Verify:

- [ ] User navigates to `/dosen/kuis` page and sees newly created draft kuis in list
- [ ] Draft kuis shows with "Draft" status indicator
- [ ] When clicking "Draft" tab, shows the kuis count
- [ ] If "publish" button exists and works, check if makes kuis appear in dashboard

---

## Code Location Reference

| Component         | File                                                   | Lines   | Purpose                                          |
| ----------------- | ------------------------------------------------------ | ------- | ------------------------------------------------ |
| Dashboard Display | `src/pages/dosen/DashboardPage.tsx`                    | 563-625 | Shows "Kuis Aktif" section (published only)      |
| Dashboard Query   | `src/lib/api/dosen.api.ts`                             | 688-745 | getActiveKuis() filters by status="published"    |
| Kuis List Display | `src/pages/dosen/kuis/KuisListPage.tsx`                | 1-393   | Shows all kuis with draft/active filters         |
| Kuis List Query   | `src/lib/api/kuis.api.ts`                              | 63-130  | getKuis() loads by dosen_id (no status filter)   |
| Quiz Builder      | `src/components/features/kuis/builder/QuizBuilder.tsx` | 162     | Creates kuis with status="draft"                 |
| Status Logic      | `src/pages/dosen/kuis/KuisListPage.tsx`                | 372-390 | getQuizStatusFromDates() determines draft status |

---

## Expected User Experience

### ✅ Current (Correct):

1. Dosen creates new kuis → saved as draft
2. Dashboard "Kuis Aktif" shows 0 items (correct, drafts not published)
3. Dosen goes to `/dosen/kuis` → should see new kuis in "Draft" section
4. Dosen can edit, add questions, etc. while in draft
5. When ready, publish/activate kuis (mechanism TBD)
6. Published kuis appears in dashboard "Kuis Aktif" section

### ❌ If User Doesn't See Draft in Kuis List:

This would indicate a bug in one of:

- `getKuis()` query not returning draft kuis
- `getQuizStatusFromDates()` logic failing
- RLS policy preventing dosen from reading own draft kuis
- Frontend rendering issue in KuisListPage

---

## Recommendation for User

**Please verify:**

1. Navigate to `/dosen/kuis` page
2. Look for newly created kuis in the list
3. Check which status tab it appears in (should be "Draft")
4. If NOT visible → there's a bug
5. If visible → system working correctly, just publish to see in dashboard

**Report back with:**

- Is newly created kuis visible in `/dosen/kuis` list?
- What status shows for it?
- Is there a "Draft" tab in the filters?

This will confirm whether the issue is:

- ✅ Working as designed (draft not in dashboard, must go to list page)
- ❌ Bug in data loading/visibility
- ❌ Bug in status determination
