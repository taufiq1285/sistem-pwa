# 🔗 COMPONENT INTEGRATION GUIDE

## 📍 Component Locations

```
src/components/admin/UpdateSemesterDialog.tsx    (400 lines)
src/pages/admin/MahasiswaManagementPage.tsx       (300 lines)
src/lib/api/mahasiswa-semester.api.ts            (200 lines)
```

---

## 1️⃣ UpdateSemesterDialog Component

### 📋 Purpose

Multi-step dialog for updating mahasiswa's semester with smart recommendations and batch enrollment.

### 📦 Import

```typescript
import { UpdateSemesterDialog } from "@/components/admin/UpdateSemesterDialog";
```

### 📝 Props

```typescript
interface UpdateSemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mahasiswa: {
    id: string;
    nim: string;
    nama: string;
    email: string;
    program_studi: string;
    angkatan: number;
    current_semester: number;
  };
  onSuccess?: (result: UpdateResult) => void;
}

interface UpdateResult {
  mahasiswa_id: string;
  semester_lama: number;
  semester_baru: number;
  enrolled_kelas_count: number;
}
```

### 🎨 Usage Example

**In a page component:**

```typescript
import { useState } from 'react';
import { UpdateSemesterDialog } from '@/components/admin/UpdateSemesterDialog';

export function MahasiswaTableRow({ mahasiswa }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <tr>
        <td>{mahasiswa.nim}</td>
        <td>{mahasiswa.nama}</td>
        <td>
          <button onClick={() => setIsDialogOpen(true)}>
            ✎ Edit Semester
          </button>
        </td>
      </tr>

      <UpdateSemesterDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        mahasiswa={{
          id: mahasiswa.id,
          nim: mahasiswa.nim,
          nama: mahasiswa.nama,
          email: mahasiswa.email,
          program_studi: mahasiswa.program_studi,
          angkatan: mahasiswa.angkatan,
          current_semester: mahasiswa.current_semester
        }}
        onSuccess={(result) => {
          console.log(`Updated ${result.mahasiswa_id} to S${result.semester_baru}`);
          // Refresh table
        }}
      />
    </>
  );
}
```

### 🔄 Internal Flow

```
Dialog Open
    ↓
Step 1: Show Form
  - Display mahasiswa info (NIM, Angkatan, Program, Current Semester)
  - Semester selector (1-8)
  - Notes textarea
  - "Update Semester" button
    ↓ Click Update
    ↓ Validate input
    ↓ Call: updateMahasiswaSemester()
Step 2: Show Recommendations
  - Display suggestions from RPC
  - Checkboxes for multiple selection
  - Color badges (Sesuai/Semester lebih tinggi)
  - "Enroll ke Kelas Terpilih" button
    ↓ Click Enroll
    ↓ Call: enrollToRecommendedClass() for each selected
Step 3: Show Success
  - Summary of changes
  - Count of classes enrolled
  - "Selesai" button
    ↓ Click Selesai
    ↓ Call onSuccess()
    ↓ Close dialog
```

### ⚙️ State Management

```typescript
// Internal state (managed by dialog):
const [step, setStep] = useState<1 | 2 | 3>(1);
const [semesterBaru, setSemesterBaru] = useState(0);
const [notes, setNotes] = useState("");
const [recommendations, setRecommendations] = useState<KelasRecommendation[]>(
  []
);
const [selectedKelas, setSelectedKelas] = useState<Set<string>>(new Set());
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## 2️⃣ MahasiswaManagementPage Component

### 📋 Purpose

Admin page to view, filter, and manage mahasiswa with semester update capability.

### 📦 Import

```typescript
import MahasiswaManagementPage from "@/pages/admin/MahasiswaManagementPage";
```

### 🎨 Usage in Router

**React Router v6:**

```typescript
import MahasiswaManagementPage from '@/pages/admin/MahasiswaManagementPage';

const router = createBrowserRouter([
  {
    path: '/admin/mahasiswa-management',
    element: <MahasiswaManagementPage />,
    errorElement: <ErrorPage />
  }
]);
```

**Custom Router:**

```typescript
const adminRoutes = [
  {
    path: 'mahasiswa-management',
    element: <MahasiswaManagementPage />,
    requireAuth: true,
    roles: ['admin']
  }
];
```

### 🎨 Page Structure

```
┌─────────────────────────────────────┐
│  MANAJEMEN MAHASISWA                │
├─────────────────────────────────────┤
│  [Search box]                       │
│  [Filter: Angkatan] [Filter: Sem]   │
│  [Filter: Program] [Clear]          │
├─────────────────────────────────────┤
│  ☑ │ NIM  │ Nama │ Sem │ Ang │ ... │
│  ──────────────────────────────────  │
│  ☐ │ BD1  │ Siti │ 1   │ 22  │ ✎   │
│  ☐ │ BD2  │ Ahm  │ 2   │ 22  │ ✎   │
│  ☐ │ BD3  │ Budi │ 1   │ 23  │ ✎   │
│  ...                                │
├─────────────────────────────────────┤
│  [Update Semester Bulk]             │
│  Selected: 0 mahasiswa              │
└─────────────────────────────────────┘
```

### ⚙️ Component Features

**1. Search**

```typescript
// Search by: nama, NIM, email
const handleSearch = (value: string) => {
  setSearchTerm(value);
  // Filters table automatically
};
```

**2. Filters**

```typescript
// Available filters:
- Angkatan: Auto-detect from data, sort descending
- Semester: 1-8 selector
- Program Studi: Auto-detect from data

// Clear all filters:
<button onClick={handleClearFilters}>Clear Filters</button>
```

**3. Row Selection**

```typescript
// Checkbox for each row
// Master checkbox to select all filtered

const handleToggleRow = (mahasiswaId: string) => {
  // Add/remove from selectedRows set
};

const handleSelectAll = () => {
  // Select all filtered rows
};
```

**4. Update Semester**

```typescript
// Per-row update:
<button onClick={() => openDialog(mahasiswa)}>
  ✎ Edit
</button>

// Bulk update (if rows selected):
<button onClick={handleBulkUpdate} disabled={selected.size === 0}>
  Update Semester Bulk ({selected.size})
</button>
```

### 🔄 Internal Flow

```
Page Load
    ↓
Fetch mahasiswa list
    ↓
Populate filters from data
    ↓
Display table
    ↓
User interacts:
  ├─ Search → Filter table
  ├─ Select filters → Apply filters
  ├─ Click Clear → Reset filters
  ├─ Click ✎ → Open UpdateSemesterDialog
  │              ↓ On Success
  │              ↓ Refresh mahasiswa data
  │              ↓ Update table
  └─ Select rows + bulk update → (Future feature)
```

### 📊 State Management

```typescript
const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [filters, setFilters] = useState({
  angkatan: "",
  semester: "",
  program_studi: "",
});
const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
const [selectedMahasiswa, setSelectedMahasiswa] = useState<Mahasiswa | null>(
  null
);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [isLoading, setIsLoading] = useState(true);
```

---

## 3️⃣ API Integration

### 📍 Location

```
src/lib/api/mahasiswa-semester.api.ts
```

### 🔗 Usage in Components

**In UpdateSemesterDialog:**

```typescript
import {
  updateMahasiswaSemester,
  getSemesterRecommendations,
  enrollToRecommendedClass,
} from "@/lib/api/mahasiswa-semester.api";

// Step 1: Update semester
const result = await updateMahasiswaSemester({
  mahasiswa_id: mahasiswa.id,
  semester_baru: semesterBaru,
  notes: notes || undefined,
});

// Step 2: Get recommendations (if needed)
const recommendations = await getSemesterRecommendations(
  mahasiswa.id,
  semesterBaru
);

// Step 3: Enroll to selected classes
for (const kelasId of selectedKelas) {
  await enrollToRecommendedClass(mahasiswa.id, kelasId);
}
```

**In MahasiswaManagementPage:**

```typescript
import { getMahasiswaSemesterHistory } from "@/lib/api/mahasiswa-semester.api";

// Fetch history (optional):
const history = await getMahasiswaSemesterHistory(mahasiswa.id);
console.log("Semester updates:", history);
```

---

## 🎯 Integration Workflow

### Step 1: Add Components to Project

```bash
# Verify files exist:
ls src/components/admin/UpdateSemesterDialog.tsx
ls src/pages/admin/MahasiswaManagementPage.tsx
ls src/lib/api/mahasiswa-semester.api.ts
```

### Step 2: Add Route

```typescript
// src/App.tsx or router config
{
  path: "/admin/mahasiswa-management",
  element: <MahasiswaManagementPage />,
  requireAuth: true,
  roles: ["admin"]
}
```

### Step 3: Add Navigation

```typescript
// src/components/layout/Sidebar.tsx
{
  label: "Manajemen Mahasiswa",
  href: "/admin/mahasiswa-management",
  icon: "Users",
  description: "Kelola semester mahasiswa"
}
```

### Step 4: Verify Imports

```typescript
// Test imports in components:
import { UpdateSemesterDialog } from "@/components/admin/UpdateSemesterDialog";
import MahasiswaManagementPage from "@/pages/admin/MahasiswaManagementPage";
import { updateMahasiswaSemester } from "@/lib/api/mahasiswa-semester.api";
```

### Step 5: Test

```bash
# Navigate to page:
http://localhost:5173/admin/mahasiswa-management

# Test features:
1. ✅ Page loads
2. ✅ Filters work
3. ✅ Click ✎ opens dialog
4. ✅ Update semester works
5. ✅ Recommendations show
6. ✅ Enroll to classes works
7. ✅ Success message shows
```

---

## 🧩 Component Dependencies

```
MahasiswaManagementPage
    ├─ UpdateSemesterDialog
    │   ├─ mahasiswa-semester.api.ts
    │   │   ├─ updateMahasiswaSemester()
    │   │   ├─ getSemesterRecommendations()
    │   │   ├─ enrollToRecommendedClass()
    │   │   └─ Supabase RPC
    │   ├─ Shadcn/ui components
    │   │   ├─ Dialog
    │   │   ├─ Button
    │   │   ├─ Select
    │   │   ├─ Textarea
    │   │   ├─ Checkbox
    │   │   └─ Alert
    │   └─ lucide-react icons
    │
    ├─ mahasiswa-semester.api.ts
    │   ├─ getMahasiswaSemesterHistory() (optional)
    │   └─ Supabase client
    │
    ├─ Shadcn/ui components
    │   ├─ Input
    │   ├─ Select
    │   ├─ Button
    │   ├─ Table
    │   └─ Checkbox
    │
    └─ lucide-react icons
        ├─ Users
        ├─ Search
        ├─ Filter
        ├─ Edit
        └─ X
```

---

## 🐛 Common Integration Issues

### Issue 1: Import Errors

```
Error: Cannot find module '@/components/admin/UpdateSemesterDialog'
```

**Solution:**

- Verify files exist in correct location
- Check path aliases in `tsconfig.json`
- Rebuild IDE (Ctrl+Shift+P → TypeScript: Restart TS Server)

### Issue 2: Type Errors

```
Error: Property 'mahasiswa' does not exist on type '{}'
```

**Solution:**

- Ensure all Props interfaces are defined
- Check import paths for types
- Run: `npm run type-check`

### Issue 3: API not found

```
Error: Cannot find function 'updateMahasiswaSemester'
```

**Solution:**

- Verify file exists: `src/lib/api/mahasiswa-semester.api.ts`
- Check export statements in API file
- Verify Supabase client initialized

### Issue 4: Dialog not opening

```
Dialog doesn't appear when clicking button
```

**Solution:**

- Check `isOpen` prop value
- Verify `onClose` handler is set
- Check `z-index` CSS if using custom styling

---

## ✅ Integration Checklist

- [ ] Files exist in correct locations
- [ ] Route added to router config
- [ ] Navigation menu updated
- [ ] Components compile without errors
- [ ] API functions accessible
- [ ] Database migration applied
- [ ] Test page loads
- [ ] Test filters work
- [ ] Test dialog opens
- [ ] Test semester update works
- [ ] Test recommendations appear
- [ ] Test enroll to classes
- [ ] Test success message
- [ ] Test audit trail

---

## 🎓 Next Steps

1. **Apply migration** - Run SQL in Supabase
2. **Add route** - Update router config
3. **Add navigation** - Update sidebar
4. **Test workflow** - Manual testing
5. **Deploy** - Push to production

---

**Created:** December 8, 2025  
**Version:** 1.0.0  
**Status:** ✅ Integration Ready
