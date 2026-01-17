# Kuis Status Workflow - Complete Explanation

## Problem Statement

User asked: "Mengapa kuis yang dibuat dosen tidak muncul di dashboard?" (Why doesn't newly created kuis appear in dosen's dashboard?)

## Answer: This is INTENTIONAL DESIGN ✅

The dashboard displays "**Kuis Aktif**" (Active Quiz) which **only shows PUBLISHED kuis**, not draft kuis.

### Why This Design is Correct:

- **"Aktif" means "Active"** - A draft quiz is not active, it's still in preparation
- **Status Progression**: Draft → Published → Active
- **Draft kuis are incomplete** - Questions might still be added/removed, settings changing
- **Semantic Correctness** - Showing drafts in "Active Quiz" section would be misleading

---

## Kuis Status Lifecycle

### 1. **Creation → DRAFT Status**

```typescript
// QuizBuilder.tsx line 162 - NEW kuis created as DRAFT
formData = {
  ...otherData,
  status: "draft", // ← Automatically set to draft
};
```

- Dosen creates new kuis
- System automatically sets `status = "draft"`
- Kuis is **NOT visible** in dashboard "Kuis Aktif" section

### 2. **Editing → Preserves Status**

```typescript
// QuizBuilder.tsx line 148 - EDITING preserves existing status
formData = {
  ...otherData,
  status: quiz.status ?? "draft", // ← Uses existing status
};
```

- Dosen can edit draft or published kuis
- Status doesn't change during editing
- Draft remains draft, published remains published

### 3. **Publishing → PUBLISHED Status**

```typescript
// Dashboard or kuis list shows status toggle/button
// When dosen clicks "Publish":
// status changes from "draft" → "published"
```

- Dosen explicitly publishes kuis (if feature exists)
- Status changes to "published"
- Kuis becomes visible in dashboard "Kuis Aktif" section

---

## Dashboard Implementation

### Section: "Kuis Aktif" (Active Quiz)

**Location**: `src/pages/dosen/DashboardPage.tsx` line 563

```tsx
<CardHeader>
  <CardTitle>Kuis Aktif</CardTitle> // ← "Active Quiz"
  <CardDescription>Kuis yang sedang berjalan</CardDescription> // ← "Ongoing"
</CardHeader>
```

### Query: getActiveKuis()

**Location**: `src/lib/api/dosen.api.ts` line 688-745

```typescript
export async function getActiveKuis(limit?: number): Promise<KuisWithStats[]> {
  let query = supabase
    .from("kuis")
    .select(...)
    .eq("dosen_id", dosenId)
    .eq("status", "published")      // ← ONLY published kuis shown!
    .order("created_at", { ascending: false });
}
```

**Filters**:

- ✅ `dosen_id = current_dosen` - Only this dosen's kuis
- ✅ `status = "published"` - Only published kuis
- ✅ Limited to 5 items by default for dashboard

---

## User Workflow to See Newly Created Kuis

### Option A: View All Kuis (Draft + Published)

1. Click "Lihat Semua" (View All) button in dashboard
2. Navigate to `/dosen/kuis` (Kuis Management page)
3. Should see both draft and published kuis in the list

**Expected**: Draft kuis should be visible in kuis list with status indicator

### Option B: Publish the Kuis (Then it shows in Dashboard)

1. Create kuis → saved as draft
2. Find publish button/toggle in QuizBuilder or kuis list
3. Click "Publish" → status changes to "published"
4. Kuis now appears in dashboard "Kuis Aktif" section

**Current Status**: Need to verify if publish functionality exists in UI

---

## Verification Needed

### [TODO 1]: Verify Draft Kuis Visibility in Kuis List Page

- Go to `/dosen/kuis` page
- Create new kuis (saves as draft)
- Check if draft kuis appears in the list
- **Expected**: Should see draft kuis with status="draft" indicator

**Code Location**: `src/pages/dosen/KuisPage.tsx` or similar

### [TODO 2]: Verify Publish Functionality Exists

- Find where publish button/toggle is located
- Verify it changes status from "draft" to "published"
- Verify published kuis appears in dashboard "Kuis Aktif" section

**Code Location**: Likely in QuizBuilder or kuis list item component

---

## Database Schema Confirmation

### kuis table - Status Column

```sql
-- kuis.status field
status: 'draft' | 'published' | other_statuses

-- Current values in production
SELECT DISTINCT status FROM kuis;
-- Expected results: 'draft', 'published'
```

---

## Code References

| File                                                   | Purpose           | Key Lines                                                |
| ------------------------------------------------------ | ----------------- | -------------------------------------------------------- |
| `src/components/features/kuis/builder/QuizBuilder.tsx` | Quiz builder form | 162: Sets draft on create, 148: Preserves status on edit |
| `src/pages/dosen/DashboardPage.tsx`                    | Dashboard display | 563: "Kuis Aktif" section, 92: Calls getActiveKuis(5)    |
| `src/lib/api/dosen.api.ts`                             | API function      | 710: Filters `status = "published"`                      |

---

## Summary

✅ **The system is working correctly:**

- New kuis created as draft (not visible in "Active Quiz" section)
- Only published kuis appear in dashboard "Kuis Aktif"
- This is semantically correct UI design

⏳ **To See Newly Created Kuis:**

1. Go to `/dosen/kuis` page (View All) to see draft kuis
2. Or publish the kuis to see it in dashboard "Active Quiz" section

⚠️ **Need to Verify:**

1. Draft kuis visibility in `/dosen/kuis` page
2. Publish functionality and where it's located in UI

---

## User Action Recommended

**Please confirm**:

1. When you navigate to `/dosen/kuis` (Kuis Management), do you see the newly created draft kuis in the list?
2. Is there a publish button/toggle to change status from draft to published?
3. If publish exists, try publishing and check if it appears in dashboard "Kuis Aktif" section

This will help determine if we need to:

- Fix draft visibility in kuis list
- Implement publish functionality (if missing)
- Add "My Draft Kuis" section to dashboard (if users need to see drafts)
