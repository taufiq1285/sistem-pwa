# 📖 API DOCUMENTATION - Semester Progression System

## 📍 File Location

```
src/lib/api/mahasiswa-semester.api.ts
```

---

## 🔑 Function Reference

### 1️⃣ getMahasiswaSemester()

**Purpose:** Get current semester for a mahasiswa

**Signature:**

```typescript
async function getMahasiswaSemester(mahasiswaId: string): Promise<number>;
```

**Parameters:**

- `mahasiswaId` (string) - UUID of mahasiswa

**Returns:**

- `number` - Current semester (1-8)

**Example:**

```typescript
const currentSem = await getMahasiswaSemester("abc-123-def");
console.log(`Mahasiswa sedang semester: ${currentSem}`);
// Output: Mahasiswa sedang semester: 1
```

**Error Handling:**

```typescript
try {
  const sem = await getMahasiswaSemester(mahasiswaId);
} catch (error) {
  // Handle error
  console.error("Failed to get semester:", error);
}
```

---

### 2️⃣ getSemesterRecommendations()

**Purpose:** Get list of recommended classes for new semester

**Signature:**

```typescript
async function getSemesterRecommendations(
  mahasiswaId: string,
  semesterBaru: number
): Promise<KelasRecommendation[]>;
```

**Parameters:**

- `mahasiswaId` (string) - UUID of mahasiswa
- `semesterBaru` (number) - Target semester (1-8)

**Returns:**

```typescript
interface KelasRecommendation {
  kelas_id: string;
  nama_kelas: string;
  semester_ajaran: number;
  tahun_ajaran: string;
  dosen_name: string | null;
  reason: string; // "Semester cocok", "Semester lebih tinggi", etc
}
```

**Example:**

```typescript
const recommendations = await getSemesterRecommendations(
  "mahasiswa-123",
  2 // Move to semester 2
);

console.log(recommendations);
// [
//   {
//     kelas_id: 'k1',
//     nama_kelas: 'Kelas B S2 2022',
//     semester_ajaran: 2,
//     tahun_ajaran: '2024/2025',
//     dosen_name: 'Dr. Budi',
//     reason: 'Semester cocok'
//   },
//   {
//     kelas_id: 'k2',
//     nama_kelas: 'Kelas C S3 2022',
//     semester_ajaran: 3,
//     tahun_ajaran: '2024/2025',
//     dosen_name: 'Dr. Siti',
//     reason: 'Semester lebih tinggi'
//   }
// ]
```

**Error Handling:**

```typescript
try {
  const recs = await getSemesterRecommendations(mahasiswaId, 2);
  if (recs.length === 0) {
    console.log("No recommendations available");
  }
} catch (error) {
  console.error("Failed to get recommendations:", error);
}
```

---

### 3️⃣ updateMahasiswaSemester() ⚠️ PROTECTED

**Purpose:** Update mahasiswa's semester and create audit log

**Permission Required:** `manage:mahasiswa`

**Signature:**

```typescript
async function updateMahasiswaSemester(data: {
  mahasiswa_id: string;
  semester_baru: number;
  notes?: string;
}): Promise<{
  success: boolean;
  mahasiswa_id: string;
  semester_lama: number;
  semester_baru: number;
  recommendations: KelasRecommendation[];
  message: string;
}>;
```

**Parameters:**

- `mahasiswa_id` (string) - UUID of mahasiswa
- `semester_baru` (number) - New semester (1-8)
- `notes` (string, optional) - Reason/notes for audit trail

**Returns:**

```typescript
{
  success: boolean,
  mahasiswa_id: string,
  semester_lama: number,
  semester_baru: number,
  recommendations: KelasRecommendation[],
  message: string
}
```

**Example:**

```typescript
const result = await updateMahasiswaSemester({
  mahasiswa_id: "mhs-123",
  semester_baru: 2,
  notes: "Successfully completed semester 1 courses",
});

console.log(result);
// {
//   success: true,
//   mahasiswa_id: 'mhs-123',
//   semester_lama: 1,
//   semester_baru: 2,
//   recommendations: [...],
//   message: 'Semester updated successfully'
// }
```

**Error Handling:**

```typescript
try {
  const result = await updateMahasiswaSemester({
    mahasiswa_id: mahasiswaId,
    semester_baru: 2,
    notes: "Promotion from S1 to S2",
  });

  if (!result.success) {
    console.error("Update failed:", result.message);
  }
} catch (error) {
  if (error.code === "PERMISSION_DENIED") {
    console.error("You do not have permission to update semester");
  } else {
    console.error("Error:", error.message);
  }
}
```

---

### 4️⃣ enrollToRecommendedClass()

**Purpose:** Enroll mahasiswa to a recommended class

**Signature:**

```typescript
async function enrollToRecommendedClass(
  mahasiswaId: string,
  kelasId: string
): Promise<{
  success: boolean;
  enrollment_id: string;
  message: string;
}>;
```

**Parameters:**

- `mahasiswaId` (string) - UUID of mahasiswa
- `kelasId` (string) - UUID of kelas

**Returns:**

```typescript
{
  success: boolean,
  enrollment_id: string,
  message: string
}
```

**Example:**

```typescript
const enrollment = await enrollToRecommendedClass("mhs-123", "kelas-B-S2");

console.log(enrollment);
// {
//   success: true,
//   enrollment_id: 'enroll-xyz',
//   message: 'Successfully enrolled to Kelas B S2'
// }
```

**Error Handling:**

```typescript
try {
  const enrollment = await enrollToRecommendedClass(mahasiswaId, kelasId);
} catch (error) {
  if (error.message.includes("already enrolled")) {
    console.error("Student already enrolled to this class");
  } else if (error.message.includes("invalid semester")) {
    console.error("Student semester not appropriate for this class");
  } else {
    console.error("Enrollment failed:", error.message);
  }
}
```

---

### 5️⃣ getMahasiswaSemesterHistory()

**Purpose:** Get audit trail of semester changes

**Signature:**

```typescript
async function getMahasiswaSemesterHistory(
  mahasiswaId: string
): Promise<SemesterAuditEntry[]>;
```

**Parameters:**

- `mahasiswaId` (string) - UUID of mahasiswa

**Returns:**

```typescript
interface SemesterAuditEntry {
  id: string;
  mahasiswa_id: string;
  semester_lama: number;
  semester_baru: number;
  updated_by_admin_id: string;
  updated_at: string; // ISO datetime
  notes: string | null;
}
```

**Example:**

```typescript
const history = await getMahasiswaSemesterHistory("mhs-123");

console.log(history);
// [
//   {
//     id: 'audit-1',
//     mahasiswa_id: 'mhs-123',
//     semester_lama: 1,
//     semester_baru: 2,
//     updated_by_admin_id: 'admin-xyz',
//     updated_at: '2024-12-08T14:30:00Z',
//     notes: 'Promotion from S1 to S2'
//   },
//   {
//     id: 'audit-2',
//     mahasiswa_id: 'mhs-123',
//     semester_lama: 2,
//     semester_baru: 3,
//     updated_by_admin_id: 'admin-xyz',
//     updated_at: '2024-12-15T10:15:00Z',
//     notes: 'Promotion from S2 to S3'
//   }
// ]
```

**Error Handling:**

```typescript
try {
  const history = await getMahasiswaSemesterHistory(mahasiswaId);
  if (history.length === 0) {
    console.log("No semester changes recorded");
  }
} catch (error) {
  console.error("Failed to retrieve history:", error);
}
```

---

## 🔐 Permission Requirements

| Function                    | Permission           | Role              |
| --------------------------- | -------------------- | ----------------- |
| getMahasiswaSemester        | `read:mahasiswa`     | admin, dosen      |
| getSemesterRecommendations  | `read:mahasiswa`     | admin, dosen      |
| **updateMahasiswaSemester** | **manage:mahasiswa** | **admin only**    |
| enrollToRecommendedClass    | `manage:mahasiswa`   | admin only        |
| getMahasiswaSemesterHistory | `audit:read`         | admin, supervisor |

---

## 🚨 Error Codes

```typescript
// Permission errors
'PERMISSION_DENIED' - User doesn't have required permission
'UNAUTHORIZED' - User not authenticated
'INVALID_ROLE' - User role not allowed

// Validation errors
'INVALID_SEMESTER' - Semester not in range 1-8
'INVALID_MAHASISWA_ID' - Mahasiswa ID not found
'INVALID_KELAS_ID' - Kelas ID not found

// Business logic errors
'ALREADY_ENROLLED' - Student already in this class
'SEMESTER_MISMATCH' - Student semester doesn't match class
'NO_RECOMMENDATIONS' - No suitable classes available

// Database errors
'DATABASE_ERROR' - Unexpected database error
'TRANSACTION_FAILED' - Transaction rollback occurred
```

---

## 💡 Usage Examples

### Example 1: Simple Semester Update

```typescript
// Update student to next semester
const result = await updateMahasiswaSemester({
  mahasiswa_id: student.id,
  semester_baru: student.current_semester + 1,
});

if (result.success) {
  console.log(`✅ ${student.name} promoted to S${result.semester_baru}`);
}
```

### Example 2: Update with Auto-Enroll

```typescript
// Update semester AND auto-enroll to first recommended class
const result = await updateMahasiswaSemester({
  mahasiswa_id: student.id,
  semester_baru: 2,
  notes: "Auto-promotion system",
});

if (result.recommendations.length > 0) {
  const bestMatch = result.recommendations[0];
  await enrollToRecommendedClass(student.id, bestMatch.kelas_id);
  console.log(`✅ Enrolled to ${bestMatch.nama_kelas}`);
}
```

### Example 3: Audit Trail Report

```typescript
// Generate audit trail for specific student
const history = await getMahasiswaSemesterHistory(mahasiswa_id);

console.log(`=== Semester Progress for ${student.name} ===`);
history.forEach((entry, index) => {
  const date = new Date(entry.updated_at).toLocaleDateString();
  console.log(
    `${index + 1}. S${entry.semester_lama} → S${entry.semester_baru} (${date})`
  );
  if (entry.notes) console.log(`   Note: ${entry.notes}`);
});
```

### Example 4: Bulk Semester Update

```typescript
// Update multiple students (for same year/program)
for (const student of studentList) {
  try {
    const result = await updateMahasiswaSemester({
      mahasiswa_id: student.id,
      semester_baru: student.current_semester + 1,
      notes: "Batch promotion - Year 2024",
    });
    console.log(`✅ ${student.name}: ${result.message}`);
  } catch (error) {
    console.error(`❌ ${student.name}: ${error.message}`);
  }
}
```

---

## 📊 Response Format Standards

All API functions return consistent response format:

```typescript
// Success response
{
  success: true,
  data: { /* specific data */ },
  message: "Operation successful"
}

// Error response
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human readable message"
  }
}
```

---

## 🔄 Related Database Queries

```sql
-- Check mahasiswa current semester
SELECT m.mahasiswa_id, u.full_name, m.semester_saat_enroll
FROM mahasiswa m
JOIN users u ON m.user_id = u.user_id
WHERE m.mahasiswa_id = 'mhs-123';

-- Get recommendations for specific mahasiswa
SELECT * FROM suggest_kelas_for_semester(
  p_angkatan := 2022,
  p_new_semester := 2,
  p_tahun_ajaran := '2024/2025'
);

-- View semester update history
SELECT * FROM mahasiswa_semester_audit
WHERE mahasiswa_id = 'mhs-123'
ORDER BY updated_at DESC;
```

---

**API Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Status:** ✅ Production Ready
