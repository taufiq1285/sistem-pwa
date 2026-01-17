# 🔴 CRITICAL BUSINESS LOGIC ISSUES
## Sistem Praktikum Kebidanan - Akademi Kebidanan Mega Buana

**Audit Date**: 2025-12-01
**Auditor**: AI Code Reviewer
**Severity Levels**: 🔴 CRITICAL | 🟡 HIGH | 🟢 MEDIUM | 🔵 LOW

---

## 📋 Executive Summary

Audit komprehensif terhadap business logic aplikasi **Sistem Informasi Praktikum Kebidanan** menemukan **5 critical issues** yang harus diperbaiki sebelum production deployment dan testing blackbox/whitebox.

**Status**:
- 🔴 **CRITICAL Issues**: 5 (MUST FIX)
- 🟡 **HIGH Priority**: 3 (SHOULD FIX)
- 🟢 **MEDIUM Priority**: 2 (GOOD TO HAVE)

---

## 🔴 CRITICAL ISSUES (MUST FIX)

### Issue #1: ❌ Stok Inventaris Validation Missing
**File**: `src/lib/api/laboran.api.ts:352-408`
**Function**: `approvePeminjamanImpl()`
**Severity**: 🔴 **CRITICAL**

#### Problem:
```typescript
// Line 394 - WRONG!
const newStock = Math.max(0, invData.jumlah_tersedia - peminjamanData.jumlah_pinjam);
```

**What's wrong**:
- Menggunakan `Math.max(0, ...)` yang **MEMAKSA** stok menjadi 0 jika hasil negatif
- Tidak ada validasi **SEBELUM** approve peminjaman
- Laboran bisa approve peminjaman **meskipun stok tidak cukup**!

**Example Scenario**:
```
Stok Phantom Bayi: 2 unit tersedia
Dosen A request: 5 unit
Laboran approve → Math.max(0, 2-5) = Math.max(0, -3) = 0
Result: Approved! Stok jadi 0 (SEHARUSNYA DITOLAK!)
```

**Impact**:
- 🚨 Data integrity corruption
- 🚨 Stok bisa negatif (hidden by Math.max)
- 🚨 Alat praktikum tidak tersedia untuk kelas lain
- 🚨 Konflik peminjaman

**Recommended Fix**:
```typescript
async function approvePeminjamanImpl(peminjamanId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Step 1: Get peminjaman details
    const { data: peminjamanData, error: fetchError } = await supabase
      .from('peminjaman')
      .select('inventaris_id, jumlah_pinjam')
      .eq('id', peminjamanId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !peminjamanData) {
      throw new Error('Peminjaman not found or not in pending status');
    }

    // 🔥 CRITICAL FIX: Check stock BEFORE approving
    const { data: invData, error: invFetchError } = await supabase
      .from('inventaris')
      .select('jumlah_tersedia, nama_barang')
      .eq('id', peminjamanData.inventaris_id)
      .single();

    if (invFetchError || !invData) {
      throw new Error('Inventaris not found');
    }

    // ✅ VALIDATE STOCK AVAILABILITY
    if (invData.jumlah_tersedia < peminjamanData.jumlah_pinjam) {
      throw new Error(
        `Stok tidak cukup! Tersedia: ${invData.jumlah_tersedia}, Diminta: ${peminjamanData.jumlah_pinjam}`
      );
    }

    // Step 2: Update peminjaman status to approved
    const { error: updateError } = await supabase
      .from('peminjaman')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', peminjamanId)
      .eq('status', 'pending');

    if (updateError) throw updateError;

    // Step 3: Decrease inventory stock (now safe)
    const newStock = invData.jumlah_tersedia - peminjamanData.jumlah_pinjam;
    const { error: stockError } = await supabase
      .from('inventaris')
      .update({ jumlah_tersedia: newStock })
      .eq('id', peminjamanData.inventaris_id);

    if (stockError) throw stockError;
  } catch (error) {
    console.error('Error approving peminjaman:', error);
    throw error;
  }
}
```

**Test Case**:
```typescript
// Test: Should reject if stock insufficient
const peminjaman = {
  inventaris_id: 'phantom-bayi-id',
  jumlah_pinjam: 5
};
const inventaris = { jumlah_tersedia: 2 };

// Should throw: "Stok tidak cukup! Tersedia: 2, Diminta: 5"
await expect(approvePeminjaman(peminjaman.id)).rejects.toThrow('Stok tidak cukup');
```

---

### Issue #2: ❌ Kapasitas Kelas Validation Missing
**File**: `src/lib/api/kelas.api.ts:249-272`
**Function**: `enrollStudentImpl()`
**Severity**: 🔴 **CRITICAL**

#### Problem:
Tidak ada validasi kapasitas kelas saat enrollment mahasiswa.

**Current Code**:
```typescript
async function enrollStudentImpl(
  kelasId: string,
  mahasiswaId: string
): Promise<KelasMahasiswa> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .insert({
        kelas_id: kelasId,
        mahasiswa_id: mahasiswaId,
        is_active: true,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();
    // NO CAPACITY CHECK!
  }
}
```

**Impact**:
- 🚨 Kelas bisa overload (lebih dari kapasitas lab)
- 🚨 Lab terlalu penuh untuk praktikum kebidanan
- 🚨 Keamanan dan kualitas praktikum menurun
- 🚨 Mahasiswa tidak dapat alat praktikum yang cukup

**Example Scenario**:
```
Lab Kebidanan: Kapasitas 20 mahasiswa
Kelas Asuhan Persalinan: Kuota 20
Current enrollment: 20 mahasiswa
Admin/Dosen enroll mahasiswa ke-21 → SUCCESS! (WRONG!)
Result: Lab overload, alat praktikum tidak cukup
```

**Recommended Fix**:
```typescript
async function enrollStudentImpl(
  kelasId: string,
  mahasiswaId: string
): Promise<KelasMahasiswa> {
  try {
    const { supabase } = await import('@/lib/supabase/client');

    // 🔥 CRITICAL FIX: Check capacity before enrollment
    // Step 1: Get kelas info
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select('kuota, nama_kelas')
      .eq('id', kelasId)
      .single();

    if (kelasError || !kelasData) {
      throw new Error('Kelas not found');
    }

    // Step 2: Count current enrollment
    const { count: currentEnrollment, error: countError } = await supabase
      .from('kelas_mahasiswa')
      .select('*', { count: 'exact', head: true })
      .eq('kelas_id', kelasId)
      .eq('is_active', true);

    if (countError) throw countError;

    // ✅ VALIDATE CAPACITY
    if (currentEnrollment !== null && currentEnrollment >= kelasData.kuota) {
      throw new Error(
        `Kelas ${kelasData.nama_kelas} sudah penuh! (${currentEnrollment}/${kelasData.kuota})`
      );
    }

    // Step 3: Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('kelas_mahasiswa')
      .select('id')
      .eq('kelas_id', kelasId)
      .eq('mahasiswa_id', mahasiswaId)
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error('Mahasiswa sudah terdaftar di kelas ini');
    }

    // Step 4: Enroll (now safe)
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .insert({
        kelas_id: kelasId,
        mahasiswa_id: mahasiswaId,
        is_active: true,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error('Error enrolling student:', error);
    throw new Error(`Failed to enroll student: ${(error as Error).message}`);
  }
}
```

**Test Cases**:
```typescript
// Test 1: Should reject if kelas full
const kelas = { id: 'kelas-1', kuota: 20 };
const currentEnrollment = 20;
await expect(enrollStudent(kelas.id, 'mhs-21')).rejects.toThrow('sudah penuh');

// Test 2: Should reject if already enrolled
await enrollStudent(kelas.id, 'mhs-1'); // First time OK
await expect(enrollStudent(kelas.id, 'mhs-1')).rejects.toThrow('sudah terdaftar');
```

---

### Issue #3: ❌ Jadwal Conflict Detection Missing
**File**: `src/lib/api/jadwal.api.ts`
**Function**: `createJadwal()` / `updateJadwal()`
**Severity**: 🔴 **CRITICAL**

#### Problem:
Tidak ada validasi untuk mencegah double booking laboratorium.

**Current Behavior**:
- Bisa create jadwal praktikum yang overlap di lab yang sama
- Tidak ada check conflict saat create/update jadwal

**Impact**:
- 🚨 Double booking lab (2 kelas di lab sama waktu bersamaan)
- 🚨 Konflik alat praktikum kebidanan
- 🚨 Mahasiswa dan dosen datang ke lab yang sudah terisi
- 🚨 Praktikum tidak bisa dilaksanakan

**Example Scenario**:
```
Lab Kebidanan A:
- Jadwal 1: Senin, 08:00-10:00, Kelas Asuhan Kehamilan
- Jadwal 2: Senin, 09:00-11:00, Kelas Asuhan Persalinan (CONFLICT!)
Result: Overlap 1 jam (09:00-10:00), kedua kelas tidak bisa praktikum
```

**Recommended Fix**:
Add conflict detection function:

```typescript
/**
 * Check if jadwal conflicts with existing schedules in same lab
 * Returns conflicting jadwal if found, null if no conflict
 */
export async function checkJadwalConflict(
  labId: string,
  tanggalPraktikum: string,
  jamMulai: string,
  jamSelesai: string,
  excludeJadwalId?: string // For update operation
): Promise<Jadwal | null> {
  try {
    const { supabase } = await import('@/lib/supabase/client');

    let query = supabase
      .from('jadwal_praktikum')
      .select(`
        *,
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah:mata_kuliah_id (nama_mk)
        )
      `)
      .eq('laboratorium_id', labId)
      .eq('tanggal_praktikum', tanggalPraktikum)
      .eq('is_active', true);

    // Exclude current jadwal when updating
    if (excludeJadwalId) {
      query = query.neq('id', excludeJadwalId);
    }

    const { data: existingJadwal, error } = await query;

    if (error) throw error;
    if (!existingJadwal || existingJadwal.length === 0) return null;

    // Check time overlap
    for (const jadwal of existingJadwal) {
      const hasOverlap =
        (jamMulai >= jadwal.jam_mulai && jamMulai < jadwal.jam_selesai) ||
        (jamSelesai > jadwal.jam_mulai && jamSelesai <= jadwal.jam_selesai) ||
        (jamMulai <= jadwal.jam_mulai && jamSelesai >= jadwal.jam_selesai);

      if (hasOverlap) {
        return jadwal; // Return conflicting schedule
      }
    }

    return null; // No conflict
  } catch (error) {
    console.error('Error checking jadwal conflict:', error);
    throw error;
  }
}

/**
 * Updated createJadwal with conflict detection
 */
async function createJadwalImpl(data: CreateJadwalData): Promise<Jadwal> {
  try {
    // 🔥 CRITICAL FIX: Check conflict before creating
    const conflict = await checkJadwalConflict(
      data.laboratorium_id,
      data.tanggal_praktikum,
      data.jam_mulai,
      data.jam_selesai
    );

    if (conflict) {
      const conflictInfo = conflict.kelas?.mata_kuliah?.nama_mk || 'Unknown';
      const conflictClass = conflict.kelas?.nama_kelas || 'Unknown';
      throw new Error(
        `Lab sudah digunakan pada waktu tersebut!\n` +
        `Konflik dengan: ${conflictInfo} - ${conflictClass}\n` +
        `Waktu: ${conflict.jam_mulai} - ${conflict.jam_selesai}`
      );
    }

    // Create jadwal (now safe)
    const newJadwal = await insert<Jadwal>('jadwal_praktikum', data);
    return await getJadwalById(newJadwal.id);
  } catch (error: unknown) {
    console.error('Error creating jadwal:', error);
    throw new Error(`Failed to create jadwal: ${(error as Error).message}`);
  }
}
```

**Test Cases**:
```typescript
// Test 1: Should detect exact overlap
const jadwal1 = {
  lab_id: 'lab-a',
  tanggal: '2025-01-15',
  jam_mulai: '08:00',
  jam_selesai: '10:00'
};
const jadwal2 = {
  ...jadwal1,
  jam_mulai: '08:00',
  jam_selesai: '10:00'
};
await expect(createJadwal(jadwal2)).rejects.toThrow('Lab sudah digunakan');

// Test 2: Should detect partial overlap
const jadwal3 = {
  ...jadwal1,
  jam_mulai: '09:00',
  jam_selesai: '11:00'
};
await expect(createJadwal(jadwal3)).rejects.toThrow('Lab sudah digunakan');

// Test 3: Should allow non-overlapping
const jadwal4 = {
  ...jadwal1,
  jam_mulai: '10:00',
  jam_selesai: '12:00'
};
await expect(createJadwal(jadwal4)).resolves.toBeDefined(); // OK
```

---

### Issue #4: ❌ Kehadiran Time Window Validation Missing
**File**: `src/lib/api/kehadiran.api.ts:169-183`
**Function**: `createKehadiranImpl()`
**Severity**: 🟡 **HIGH**

#### Problem:
Mahasiswa bisa submit kehadiran kapan saja (tidak ada time window validation).

**Current Code**:
```typescript
async function createKehadiranImpl(data: CreateKehadiranData): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from('kehadiran')
      .insert(data)
      .select('id')
      .single();
    // NO TIME WINDOW CHECK!
  }
}
```

**Impact**:
- 🚨 Mahasiswa bisa submit kehadiran H-1 atau H+1
- 🚨 Kehadiran tidak valid (bukan real-time)
- 🚨 Data kehadiran tidak akurat
- 🚨 Abuse: Submit kehadiran tanpa datang

**Example Scenario**:
```
Jadwal Praktikum: Senin, 15 Jan 2025, 08:00-10:00
Mahasiswa A: Submit kehadiran Minggu malam (sebelum praktikum)
Mahasiswa B: Submit kehadiran Selasa (setelah praktikum)
Result: Both accepted! (WRONG!)
```

**Recommended Fix**:
```typescript
/**
 * Check if current time is within valid attendance window
 * Window: 30 min before - 30 min after jadwal start time
 */
async function validateAttendanceTimeWindow(jadwalId: string): Promise<void> {
  const TOLERANCE_BEFORE = 30; // minutes
  const TOLERANCE_AFTER = 30; // minutes

  // Get jadwal details
  const { data: jadwal, error } = await supabase
    .from('jadwal_praktikum')
    .select('tanggal_praktikum, jam_mulai')
    .eq('id', jadwalId)
    .single();

  if (error || !jadwal) {
    throw new Error('Jadwal not found');
  }

  // Parse jadwal datetime
  const jadwalDateTime = new Date(`${jadwal.tanggal_praktikum}T${jadwal.jam_mulai}`);
  const now = new Date();

  // Calculate time window
  const startWindow = new Date(jadwalDateTime.getTime() - TOLERANCE_BEFORE * 60000);
  const endWindow = new Date(jadwalDateTime.getTime() + TOLERANCE_AFTER * 60000);

  // Validate
  if (now < startWindow) {
    const minutesUntil = Math.round((startWindow.getTime() - now.getTime()) / 60000);
    throw new Error(
      `Terlalu cepat! Kehadiran dapat disubmit ${minutesUntil} menit lagi`
    );
  }

  if (now > endWindow) {
    throw new Error(
      `Terlambat! Batas waktu submit kehadiran sudah lewat (${TOLERANCE_AFTER} menit setelah jam mulai)`
    );
  }
}

/**
 * Updated createKehadiran with time window validation
 */
async function createKehadiranImpl(data: CreateKehadiranData): Promise<string> {
  try {
    // 🔥 FIX: Validate time window
    await validateAttendanceTimeWindow(data.jadwal_id);

    // Check duplicate
    const { data: existing } = await supabase
      .from('kehadiran')
      .select('id')
      .eq('jadwal_id', data.jadwal_id)
      .eq('mahasiswa_id', data.mahasiswa_id)
      .maybeSingle();

    if (existing) {
      throw new Error('Kehadiran sudah pernah disubmit untuk jadwal ini');
    }

    // Create kehadiran (now safe)
    const { data: result, error } = await supabase
      .from('kehadiran')
      .insert({
        ...data,
        waktu_check_in: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    logger.error('Failed to create kehadiran', { data, error });
    throw handleSupabaseError(error);
  }
}
```

**Test Cases**:
```typescript
// Test 1: Too early
mockDate('2025-01-15 07:00'); // Jadwal at 08:00
await expect(createKehadiran({ jadwal_id, mahasiswa_id }))
  .rejects.toThrow('Terlalu cepat');

// Test 2: On time
mockDate('2025-01-15 07:45'); // 15 min before
await expect(createKehadiran({ jadwal_id, mahasiswa_id }))
  .resolves.toBeDefined(); // OK

// Test 3: Too late
mockDate('2025-01-15 09:00'); // 1 hour after
await expect(createKehadiran({ jadwal_id, mahasiswa_id }))
  .rejects.toThrow('Terlambat');
```

---

### Issue #5: ❌ Peminjaman Overdue Tracking Missing
**File**: `src/lib/api/laboran.api.ts` or new file
**Function**: Not implemented
**Severity**: 🟡 **HIGH**

#### Problem:
Tidak ada tracking untuk peminjaman alat praktikum yang terlambat dikembalikan.

**Impact**:
- 🚨 Alat praktikum tidak kembali tepat waktu
- 🚨 Kelas lain tidak bisa pakai alat
- 🚨 Tidak ada notifikasi ke dosen/laboran
- 🚨 Tidak ada sanksi/denda otomatis

**Recommended Fix**:
Add overdue tracking function:

```typescript
/**
 * Get overdue peminjaman (not returned by return date)
 */
export interface OverduePeminjaman {
  id: string;
  inventaris_nama: string;
  peminjam_nama: string;
  dosen_nama: string;
  jumlah_pinjam: number;
  tanggal_kembali_rencana: string;
  days_overdue: number;
  denda_calculated: number;
}

export async function getOverduePeminjaman(): Promise<OverduePeminjaman[]> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('peminjaman')
      .select(`
        id,
        inventaris_id,
        peminjam_id,
        dosen_id,
        jumlah_pinjam,
        tanggal_kembali_rencana,
        denda
      `)
      .eq('status', 'approved') // Or 'dipinjam'
      .is('tanggal_kembali_aktual', null) // Not yet returned
      .lt('tanggal_kembali_rencana', today); // Past due date

    if (error) throw error;

    // Fetch related data
    const inventarisIds = data.map(p => p.inventaris_id);
    const mahasiswaIds = data.map(p => p.peminjam_id);
    const dosenIds = data.map(p => p.dosen_id).filter(Boolean);

    const [inventarisData, mahasiswaData, dosenData] = await Promise.all([
      supabase.from('inventaris').select('id, nama_barang').in('id', inventarisIds),
      supabase.from('mahasiswa').select('id, users(full_name)').in('id', mahasiswaIds),
      dosenIds.length > 0
        ? supabase.from('dosen').select('id, users(full_name)').in('id', dosenIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Map data
    const invMap = new Map(inventarisData.data?.map(i => [i.id, i]) || []);
    const mhsMap = new Map(mahasiswaData.data?.map(m => [m.id, m]) || []);
    const dsnMap = new Map(dosenData.data?.map(d => [d.id, d]) || []);

    return data.map(p => {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(p.tanggal_kembali_rencana).getTime())
        / (1000 * 60 * 60 * 24)
      );

      const DENDA_PER_HARI = 5000; // Rp 5.000/hari
      const dendaCalculated = daysOverdue * DENDA_PER_HARI;

      return {
        id: p.id,
        inventaris_nama: invMap.get(p.inventaris_id)?.nama_barang || 'Unknown',
        peminjam_nama: mhsMap.get(p.peminjam_id)?.users?.full_name || 'Unknown',
        dosen_nama: p.dosen_id ? (dsnMap.get(p.dosen_id)?.users?.full_name || 'Unknown') : '-',
        jumlah_pinjam: p.jumlah_pinjam,
        tanggal_kembali_rencana: p.tanggal_kembali_rencana,
        days_overdue: daysOverdue,
        denda_calculated: dendaCalculated,
      };
    });
  } catch (error) {
    console.error('Error fetching overdue peminjaman:', error);
    throw error;
  }
}

/**
 * Auto-calculate denda for overdue peminjaman (can be run as cron job)
 */
export async function updateOverdueDenda(): Promise<number> {
  try {
    const overdue = await getOverduePeminjaman();

    for (const item of overdue) {
      await supabase
        .from('peminjaman')
        .update({ denda: item.denda_calculated })
        .eq('id', item.id);
    }

    return overdue.length;
  } catch (error) {
    console.error('Error updating overdue denda:', error);
    throw error;
  }
}
```

Add to Laboran Dashboard:
```typescript
// In LaboranPage dashboard
const overdueList = await getOverduePeminjaman();

// Display alert if overdue > 0
{overdueList.length > 0 && (
  <Alert variant="destructive">
    <AlertTitle>Peringatan!</AlertTitle>
    <AlertDescription>
      Ada {overdueList.length} peminjaman terlambat dikembalikan
    </AlertDescription>
  </Alert>
)}
```

---

## 🟡 HIGH PRIORITY ISSUES

### Issue #6: Nilai Calculation - Manual vs Auto
**Status**: ✅ Partially Implemented (Auto-calculation available but not enforced)

**Current**:
- File `src/lib/validations/nilai.schema.ts` memiliki `calculateNilaiAkhir()` dan `getNilaiHuruf()`
- Tapi nilai bisa di-input manual di database

**Recommendation**:
Enforce auto-calculation dengan database trigger atau application-level validation.

```sql
-- Database Trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION calculate_nilai_akhir()
RETURNS TRIGGER AS $$
BEGIN
  -- Get bobot from kelas (if exists)
  DECLARE
    bobot_kuis DECIMAL := 15;
    bobot_tugas DECIMAL := 20;
    bobot_uts DECIMAL := 25;
    bobot_uas DECIMAL := 30;
    bobot_praktikum DECIMAL := 5;
    bobot_kehadiran DECIMAL := 5;
  BEGIN
    -- Calculate nilai_akhir
    NEW.nilai_akhir := (
      COALESCE(NEW.nilai_kuis, 0) * bobot_kuis / 100 +
      COALESCE(NEW.nilai_tugas, 0) * bobot_tugas / 100 +
      COALESCE(NEW.nilai_uts, 0) * bobot_uts / 100 +
      COALESCE(NEW.nilai_uas, 0) * bobot_uas / 100 +
      COALESCE(NEW.nilai_praktikum, 0) * bobot_praktikum / 100 +
      COALESCE(NEW.nilai_kehadiran, 0) * bobot_kehadiran / 100
    );

    -- Calculate nilai_huruf
    NEW.nilai_huruf := CASE
      WHEN NEW.nilai_akhir >= 85 THEN 'A'
      WHEN NEW.nilai_akhir >= 80 THEN 'A-'
      WHEN NEW.nilai_akhir >= 75 THEN 'B+'
      WHEN NEW.nilai_akhir >= 70 THEN 'B'
      WHEN NEW.nilai_akhir >= 65 THEN 'B-'
      WHEN NEW.nilai_akhir >= 60 THEN 'C+'
      WHEN NEW.nilai_akhir >= 55 THEN 'C'
      WHEN NEW.nilai_akhir >= 50 THEN 'C-'
      WHEN NEW.nilai_akhir >= 40 THEN 'D'
      ELSE 'E'
    END;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_nilai
  BEFORE INSERT OR UPDATE ON nilai
  FOR EACH ROW
  EXECUTE FUNCTION calculate_nilai_akhir();
```

---

### Issue #7: Database Constraint - Enforce Business Rules
**Status**: ⚠️ Partial (Some constraints exist, some missing)

**Existing Constraints** (✅ GOOD):
```sql
-- inventaris
CONSTRAINT inventaris_tersedia_check CHECK (jumlah_tersedia >= 0 AND jumlah_tersedia <= jumlah)

-- peminjaman
CONSTRAINT peminjaman_jumlah_check CHECK (jumlah_pinjam > 0)
CONSTRAINT peminjaman_tanggal_check CHECK (tanggal_kembali_rencana >= tanggal_pinjam)

-- jadwal
CONSTRAINT jadwal_jam_check CHECK (jam_selesai > jam_mulai)

-- nilai
CONSTRAINT nilai_range_check CHECK (semua nilai BETWEEN 0 AND 100)
```

**Missing Constraints** (❌ TO ADD):
```sql
-- 1. Prevent negative stock after borrowing (app-level only, Math.max bypasses this)
-- 2. Prevent enrollment beyond capacity (app-level validation needed)
-- 3. Prevent jadwal overlap (app-level validation needed)
-- 4. Prevent kehadiran outside time window (app-level validation needed)
```

**Recommendation**: Keep database constraints + add app-level validations (as described above).

---

### Issue #8: RLS Policies - Verify Enforcement
**File**: `supabase/migrations/21_enhanced_rls_policies.sql`
**Status**: ✅ Implemented (but needs verification)

**Recommendation**:
- Run RLS policy tests (see `RLS_TESTING_GUIDE.md`)
- Verify all critical tables have proper policies
- Check audit logging system (migration 22)

---

## 🟢 MEDIUM PRIORITY (Good to Have)

### Enhancement #1: Semester Auto-Detection
Calculate current semester based on date and academic calendar.

### Enhancement #2: Email Notifications
- Peminjaman approved/rejected
- Kuis deadline reminder
- Peminjaman overdue alert
- Nilai published notification

---

## ✅ WHAT'S ALREADY GOOD

### ✅ Nilai Calculation Logic
- File: `src/lib/validations/nilai.schema.ts`
- Has `calculateNilaiAkhir()` with custom weights support
- Has `getNilaiHuruf()` for letter grade conversion
- Has validation schemas with Zod
- **Good implementation!**

### ✅ Database Constraints
- Foreign key integrity
- Check constraints for value ranges
- Unique constraints to prevent duplicates
- Default values properly set

### ✅ RBAC Implementation
- Permission middleware implemented
- Role-based access control enforced
- RLS policies in database

### ✅ Offline Support
- PWA with service worker
- IndexedDB caching
- Offline login capability
- Sync system for offline data

---

## 📊 Summary Table

| # | Issue | File | Severity | Status | Priority |
|---|-------|------|----------|--------|----------|
| 1 | Stok validation missing | laboran.api.ts:394 | 🔴 CRITICAL | ❌ NOT FIXED | **MUST FIX** |
| 2 | Kapasitas kelas validation | kelas.api.ts:249 | 🔴 CRITICAL | ❌ NOT FIXED | **MUST FIX** |
| 3 | Jadwal conflict detection | jadwal.api.ts | 🔴 CRITICAL | ❌ NOT FIXED | **MUST FIX** |
| 4 | Kehadiran time window | kehadiran.api.ts:169 | 🟡 HIGH | ❌ NOT FIXED | SHOULD FIX |
| 5 | Peminjaman overdue tracking | laboran.api.ts | 🟡 HIGH | ❌ NOT FIXED | SHOULD FIX |
| 6 | Nilai auto-calculation | nilai.api.ts | 🟡 HIGH | ⚠️ PARTIAL | SHOULD FIX |
| 7 | Database constraints | migrations/ | 🟢 MEDIUM | ✅ PARTIAL | Good to have |
| 8 | RLS policies verification | migrations/21 | 🟢 MEDIUM | ✅ DONE | Verify only |

---

## 🎯 Action Plan

### Phase 1: CRITICAL FIXES (Before Testing) - **REQUIRED**
**Timeline**: 1-2 days

1. ✅ **Fix Issue #1**: Add stok validation in `approvePeminjamanImpl()`
2. ✅ **Fix Issue #2**: Add kapasitas validation in `enrollStudentImpl()`
3. ✅ **Fix Issue #3**: Add `checkJadwalConflict()` function

### Phase 2: HIGH PRIORITY - **STRONGLY RECOMMENDED**
**Timeline**: 2-3 days

4. ✅ **Fix Issue #4**: Add time window validation for kehadiran
5. ✅ **Fix Issue #5**: Implement overdue tracking
6. ✅ **Fix Issue #6**: Enforce nilai auto-calculation (trigger or app-level)

### Phase 3: VERIFICATION - **REQUIRED**
**Timeline**: 1 day

7. ✅ Run comprehensive tests (unit + integration)
8. ✅ Verify RLS policies
9. ✅ Test all business logic flows
10. ✅ Create test documentation

### Phase 4: BLACKBOX & WHITEBOX TESTING
**Timeline**: 3-5 days

After all critical fixes are implemented and verified.

---

## 📝 Testing Checklist

Before proceeding to blackbox/whitebox testing, ensure:

### Critical Business Logic:
- [ ] Peminjaman stok validation works
- [ ] Kelas capacity enforcement works
- [ ] Jadwal conflict detection works
- [ ] Kehadiran time window validation works
- [ ] Nilai auto-calculation works

### Data Integrity:
- [ ] Cannot approve peminjaman with insufficient stock
- [ ] Cannot enroll beyond kelas capacity
- [ ] Cannot create overlapping jadwal
- [ ] Cannot submit kehadiran outside time window
- [ ] Nilai_akhir auto-calculated correctly

### Workflow Praktikum:
- [ ] Admin creates mata kuliah ✅
- [ ] Dosen creates kelas ✅
- [ ] Mahasiswa enrolls to kelas ✅ (with capacity check)
- [ ] Dosen creates jadwal ✅ (with conflict detection)
- [ ] Dosen requests peminjaman alat ✅
- [ ] Laboran approves peminjaman ✅ (with stok check)
- [ ] Mahasiswa submits kehadiran ✅ (with time window)
- [ ] Dosen inputs nilai ✅ (auto-calculated)

---

## 🎓 Domain-Specific Considerations

### Praktikum Kebidanan vs IT/Engineering:

**Alat Praktikum Kebidanan**:
- Phantom/Manikin bayi dan ibu (terbatas, mahal)
- Alat persalinan steril (perlu maintenance)
- Instrumen medis (harus tersedia untuk setiap praktikum)

**Impact jika stok tidak divalidasi**:
- Mahasiswa kebidanan tidak dapat praktek skill yang critical
- Standar praktikum medis tidak terpenuhi
- Kualitas pendidikan bidan menurun

**Kehadiran Praktikum**:
- Praktikum kebidanan memerlukan kehadiran fisik (hands-on)
- Tidak bisa digantikan dengan online/video
- Time window validation PENTING untuk memastikan kehadiran real

**Kapasitas Lab**:
- Lab kebidanan memiliki batasan ruang dan alat
- Terlalu banyak mahasiswa = kualitas praktikum menurun
- Setiap mahasiswa harus punya akses ke manikin/phantom

---

## 📞 Questions & Clarifications

Before implementing fixes, please confirm:

1. **Stok threshold**: Apakah perlu minimum stok yang harus tetap ada? (misal: min 2 phantom bayi tidak boleh dipinjam semua)
2. **Peminjaman denda**: Berapa denda per hari keterlambatan?
3. **Time window kehadiran**: 30 menit sebelum dan sesudah cukup? Atau perlu disesuaikan?
4. **Bobot nilai default**: Apakah bobot yang ada sudah sesuai dengan kurikulum kebidanan?

---

**Status**: 🔴 **NOT READY FOR PRODUCTION**
**Recommended Action**: **FIX CRITICAL ISSUES FIRST** before blackbox/whitebox testing
**Estimated Fix Time**: 3-5 days for all critical issues

---

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Next Review**: After critical fixes implementation
