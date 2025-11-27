# 📐 Data Normalization Standard - Solusi Konsistensi

## 🎯 Masalah yang Dipecahkan

### Problem 1: Admin Input Kelas Tidak Konsisten
```
Admin input: "kelas a"        → Simpan: "kelas a" ❌
Admin input: "KELAS A"        → Simpan: "KELAS A" ❌
Admin input: "Kelas A"        → Simpan: "Kelas A" ✓
Admin input: "kELAS a"        → Simpan: "kELAS a" ❌

Result: 4 record berbeda, seharusnya 1 saja!
```

### Problem 2: Mahasiswa Input Nama Tidak Konsisten
```
Mahasiswa input: "siti nurhaliza"    → "siti nurhaliza" ❌
Mahasiswa input: "SITI NURHALIZA"    → "SITI NURHALIZA" ❌
Mahasiswa input: "Siti Nurhaliza"    → "Siti Nurhaliza" ✓
Mahasiswa input: "siti Nurhaliza"    → "siti Nurhaliza" ❌

Result: Beda nama di database untuk orang yang sama!
```

---

## ✅ SOLUSI: Normalisasi Otomatis

### Standard yang Diusulkan:

#### 1️⃣ **KELAS NAMA**
```
INPUT: Apapun (besar, kecil, campur)
       ↓
PROCESS: Capitalize Each Word (Title Case)
       ↓
OUTPUT: "Kelas A"
        "Kelas B"
        "Kelas C (Pin Merah - 2022)"
```

**Contoh:**
```
"kelas a"              → "Kelas A"
"KELAS A"             → "Kelas A"
"keLas a"             → "Kelas A"
"kelas a (pin merah)" → "Kelas A (Pin Merah)"
```

---

#### 2️⃣ **MAHASISWA NAMA (Full Name)**
```
INPUT: Apapun
       ↓
PROCESS:
  1. Trim spasi depan/belakang
  2. Normalize spasi ganda → spasi tunggal
  3. Capitalize Each Word (Title Case)
       ↓
OUTPUT: "Siti Nurhaliza"
        "Muhammad Ali"
        "Dr. Budi Santoso"
```

**Contoh:**
```
"siti nurhaliza"        → "Siti Nurhaliza"
"SITI NURHALIZA"       → "Siti Nurhaliza"
"siti  nurhaliza"      → "Siti Nurhaliza" (normalize spasi)
"siti   nurhaliza"     → "Siti Nurhaliza"
"  siti nurhaliza  "   → "Siti Nurhaliza" (trim)
"siti nurhaliza jr."   → "Siti Nurhaliza Jr."
```

---

#### 3️⃣ **NIM (Student ID)**
```
INPUT: Apapun
       ↓
PROCESS:
  1. Trim spasi
  2. Convert to UPPERCASE
  3. Remove special chars (keep hyphens)
       ↓
OUTPUT: "BD2321001"
        "BD-2321-001"
```

**Contoh:**
```
"bd2321001"     → "BD2321001"
"BD2321001"     → "BD2321001"
"bd 2321001"    → "BD2321001" (remove spasi)
"BD-2321-001"   → "BD-2321-001"
```

---

#### 4️⃣ **EMAIL**
```
INPUT: Apapun
       ↓
PROCESS:
  1. Trim spasi
  2. Lowercase
       ↓
OUTPUT: "siti@mahasiswa.ac.id"
```

**Contoh:**
```
"Siti@Mahasiswa.ac.id"  → "siti@mahasiswa.ac.id"
"SITI@MAHASISWA.AC.ID"  → "siti@mahasiswa.ac.id"
"siti@mahasiswa.ac.id"  → "siti@mahasiswa.ac.id"
```

---

## 🔧 IMPLEMENTATION - 2 CARA

### Cara 1: Frontend Normalization (Quick Fix)

**File:** Untuk setiap form input

```typescript
// Utility function
const normalizeFullName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/\s+/g, ' '); // normalize multiple spaces
};

const normalizeKelasNama = (nama: string): string => {
  return nama
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
};

const normalizeNIM = (nim: string): string => {
  return nim.trim().toUpperCase().replace(/\s+/g, '');
};

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Usage di form:
const onSubmit = (data) => {
  const normalizedData = {
    ...data,
    full_name: normalizeFullName(data.full_name),
    nim: normalizeNIM(data.nim),
    email: normalizeEmail(data.email),
  };

  await register(normalizedData);
};
```

**Effort:** LOW (2-3 minutes per form)
**Pro:** Immediate, works for new data
**Con:** Old data masih tidak konsisten

---

### Cara 2: Backend Normalization (Proper Way)

**File:** `src/lib/api/auth.api.ts` atau `src/lib/api/base.api.ts`

```typescript
// Middleware function untuk normalize sebelum insert
export const normalizeUserData = (data: any) => {
  return {
    ...data,
    full_name: normalizeFullName(data.full_name),
    email: normalizeEmail(data.email),
  };
};

export const normalizeMahasiswaData = (data: any) => {
  return {
    ...data,
    nim: normalizeNIM(data.nim),
    // ... others
  };
};

// Dalam registerUser function:
export const registerUser = async (formData: RegisterFormData) => {
  const normalizedData = normalizeUserData(formData);
  const mahasiswaData = normalizeMahasiswaData(formData);

  // Insert dengan data yang sudah normalized
  const user = await createUser(normalizedData);
  const mahasiswa = await createMahasiswa(mahasiswaData);

  return { user, mahasiswa };
};
```

**Effort:** MEDIUM (implement in auth layer)
**Pro:** Centralized, consistent for all
**Con:** Need to update existing data

---

### Cara 3: Database Normalization (Best Practice)

**PostgreSQL Trigger untuk auto-normalize:**

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION normalize_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize full_name
  NEW.full_name := INITCAP(TRIM(NEW.full_name));
  NEW.full_name := REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
CREATE TRIGGER normalize_users_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_full_name();

-- Similar untuk mahasiswa
CREATE OR REPLACE FUNCTION normalize_mahasiswa()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nim := TRIM(UPPER(NEW.nim));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_mahasiswa_trigger
BEFORE INSERT OR UPDATE ON mahasiswa
FOR EACH ROW
EXECUTE FUNCTION normalize_mahasiswa();

-- Similar untuk kelas
CREATE OR REPLACE FUNCTION normalize_kelas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nama_kelas := INITCAP(TRIM(NEW.nama_kelas));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_kelas_trigger
BEFORE INSERT OR UPDATE ON kelas
FOR EACH ROW
EXECUTE FUNCTION normalize_kelas();
```

**Effort:** MEDIUM (setup trigger)
**Pro:** Automatic, works for all inserts, can fix old data
**Con:** Need Supabase permission to create trigger

---

## 🎯 RECOMMENDED APPROACH

**Combine Cara 1 + Cara 3:**

1. **Frontend (Cara 1):** Show preview ke user
   - User lihat: "Siti Nurhaliza" (normalized) sebelum submit
   - Better UX

2. **Database (Cara 3):** Safety net
   - If somehow tidak normalized di frontend → trigger catch
   - Backup layer

---

## 📋 IMPLEMENTATION CHECKLIST

### Step 1: Create Utility Functions

**File:** `src/lib/utils/normalize.ts`

```typescript
export const normalizeFullName = (name: string): string => {
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
};

export const normalizeNIM = (nim: string): string => {
  return nim.trim().toUpperCase().replace(/\s+/g, '');
};

export const normalizeKelasNama = (nama: string): string => {
  return nama
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ');
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Export all
export const normalizeData = {
  fullName: normalizeFullName,
  nim: normalizeNIM,
  kelasNama: normalizeKelasNama,
  email: normalizeEmail,
};
```

---

### Step 2: Update RegisterForm

**File:** `src/components/forms/RegisterForm.tsx`

```typescript
import { normalizeData } from '@/lib/utils/normalize';

const onSubmit = async (data: RegisterFormData) => {
  try {
    // Normalize data before submit
    const normalizedData = {
      ...data,
      full_name: normalizeData.fullName(data.full_name),
      email: normalizeData.email(data.email),
      nim: data.nim ? normalizeData.nim(data.nim) : undefined,
    };

    // Show preview
    console.log('Normalized data will be saved:', normalizedData);

    await registerUser(normalizedData);
    setSuccess('Registration successful!');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Registration failed');
  }
};
```

---

### Step 3: Create Database Triggers (Optional)

**Via Supabase SQL Editor:**

```sql
-- Run these in Supabase SQL Editor
-- (Or ask user to run if no permission)

-- Users table trigger
CREATE OR REPLACE FUNCTION normalize_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := INITCAP(TRIM(REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g')));
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_users_trigger ON users;
CREATE TRIGGER normalize_users_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_users();

-- Mahasiswa table trigger
CREATE OR REPLACE FUNCTION normalize_mahasiswa_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nim := UPPER(TRIM(NEW.nim));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_mahasiswa_trigger ON mahasiswa;
CREATE TRIGGER normalize_mahasiswa_trigger
BEFORE INSERT OR UPDATE ON mahasiswa
FOR EACH ROW
EXECUTE FUNCTION normalize_mahasiswa_data();

-- Kelas table trigger
CREATE OR REPLACE FUNCTION normalize_kelas_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nama_kelas := INITCAP(TRIM(REGEXP_REPLACE(NEW.nama_kelas, '\s+', ' ', 'g')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_kelas_trigger ON kelas;
CREATE TRIGGER normalize_kelas_trigger
BEFORE INSERT OR UPDATE ON kelas
FOR EACH ROW
EXECUTE FUNCTION normalize_kelas_data();
```

---

### Step 4: Add Preview Display (UX)

**Optional - di RegisterForm:**

```typescript
// Show normalized preview
{selectedRole === 'mahasiswa' && (
  <div className="bg-blue-50 p-3 rounded border border-blue-200">
    <p className="text-sm font-semibold text-blue-900">Preview (as will be saved):</p>
    <p className="text-sm text-blue-700">
      Name: {normalizeData.fullName(watch('full_name') || 'Your Name')}
    </p>
    <p className="text-sm text-blue-700">
      NIM: {normalizeData.nim(watch('nim') || 'BD0000000')}
    </p>
  </div>
)}
```

---

## 🧪 TEST CASES

### Test 1: Frontend Normalization
```
Input:
  Full Name: "  siti  nurhaliza  "
  NIM: "bd 2321001"
  Email: "SITI@MAHASISWA.AC.ID"

Expected Output:
  Full Name: "Siti Nurhaliza"
  NIM: "BD2321001"
  Email: "siti@mahasiswa.ac.id"

Verify: All normalized ✓
```

---

### Test 2: Kelas Normalization (Admin)
```
Input (Admin input): "kelas a (pin merah)"

Processing:
  1. INITCAP → "Kelas A (Pin Merah)"
  2. Normalize spasi
  3. Save to database

Verify: Saved as "Kelas A (Pin Merah)" ✓
```

---

### Test 3: Duplicate Prevention
```
Scenario:
  1. Admin input: "kelas a"     → Normalized to "Kelas A"
  2. Admin input: "KELAS A"     → Normalized to "Kelas A"
  3. Check DB: Only 1 record "Kelas A"

Verify: No duplicates ✓
```

---

## 📊 NORMALIZATION RULES SUMMARY

| Field | Rule | Example |
|-------|------|---------|
| **full_name** | Title Case + trim + normalize spaces | "siti nurhaliza" → "Siti Nurhaliza" |
| **nim** | UPPERCASE + trim | "bd2321001" → "BD2321001" |
| **email** | lowercase + trim | "SITI@MAIL.COM" → "siti@mail.com" |
| **nama_kelas** | Title Case + normalize spaces | "kelas a" → "Kelas A" |
| **kode_kelas** | UPPERCASE + trim | "kl-a" → "KL-A" |

---

## ⚡ QUICK WINS (Implement First)

1. ✅ Create `normalize.ts` utility file (5 min)
2. ✅ Update RegisterForm to use normalize (5 min)
3. ✅ Update Admin Kelas form to use normalize (5 min)
4. ✅ Total effort: **15 minutes**

Then optional:
5. Create database triggers (10 min)
6. Add preview display (10 min)

---

## 🎯 BENEFITS

| Hal | Sebelum | Sesudah |
|-----|---------|---------|
| **Konsistensi** | "siti", "Siti", "SITI" | "Siti" |
| **Duplikasi** | Multiple records same person | Single record |
| **Search** | Case-sensitive | Reliable |
| **Report** | Berantakan | Clean |
| **User Experience** | Confusing | Professional |

---

**Approach mana yang diinginkan?**
- Quick (Cara 1 only) - 15 menit
- Better (Cara 1 + 3) - 30 menit
- Best (Cara 1 + 3 + preview) - 45 menit

Mau langsung implement? 🚀
