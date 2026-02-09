# TROUBLESHOOTING: List Kelas Tidak Muncul Saat Dosen Buat Tugas

## 🔍 Masalah

Saat dosen membuat tugas praktikum:

- ✅ Mata kuliah muncul (bisa dipilih)
- ❌ **List kelas TIDAK MUNCUL** (kosong)

## 📋 Root Cause Analysis

### Alur Kerja Normal:

```
1. Dosen pilih Mata Kuliah → mata_kuliah_id dipilih
2. System load kelas → getKelas({ mata_kuliah_id })
3. Kelas ditampilkan → Dosen pilih kelas
4. Tugas dibuat dengan kelas_id
```

### Kemungkinan Penyebab:

#### 1. **Kelas Belum Dibuat oleh Admin** ⚠️ MOST LIKELY

```
Problem: Tidak ada kelas untuk mata kuliah tersebut
Solution: Admin harus buat kelas dulu di menu Manajemen Kelas
```

#### 2. **Kelas Tidak Di-assign ke Mata Kuliah**

```sql
-- Cek apakah kelas punya mata_kuliah_id
SELECT id, nama_kelas, kode_kelas, mata_kuliah_id, is_active
FROM kelas
WHERE mata_kuliah_id IS NULL;
-- Jika ada hasil, kelas belum di-assign ke mata kuliah
```

#### 3. **Kelas Tidak Aktif**

```sql
-- Cek kelas yang tidak aktif
SELECT id, nama_kelas, kode_kelas, mata_kuliah_id, is_active
FROM kelas
WHERE is_active = false;
```

#### 4. **RLS Policy Blocking**

```sql
-- Cek RLS policies untuk table kelas
SELECT * FROM pg_policies WHERE tablename = 'kelas';
-- Pastikan dosen bisa SELECT kelas
```

## ✅ Solution Implemented

### 1. **UI Improvement**: Pesan Error yang Jelas

```tsx
{
  selectedMataKuliah && !isLoadingKelas && kelasList.length === 0 && (
    <Alert className="bg-orange-50 border-orange-200">
      <AlertDescription>
        <p>Belum ada kelas untuk mata kuliah ini</p>
        <p>Kelas harus dibuat oleh Admin terlebih dahulu</p>
        <p>📞 Hubungi admin untuk membuat kelas baru</p>
      </AlertDescription>
    </Alert>
  );
}
```

### 2. **Debug Logging**: Console Logs

```typescript
console.log("🔍 Loading kelas for mata_kuliah_id:", mataKuliahId);
console.log("✅ Kelas loaded:", data.length, "kelas found");
console.log("📋 Kelas list:", data);
console.warn("⚠️ No kelas found for mata_kuliah_id:", mataKuliahId);
```

### 3. **Toast Notification**: Warning untuk User

```typescript
if (data.length === 0 && mataKuliahId) {
  toast.warning("Belum ada kelas untuk mata kuliah ini", {
    description: "Hubungi admin untuk membuat kelas baru",
  });
}
```

### 4. **Auto-select**: Jika Hanya 1 Kelas

```typescript
if (data.length === 1 && !isEditing && mataKuliahId) {
  setValue("kelas_id", data[0].id);
  console.log("🎯 Auto-selected kelas:", data[0].nama_kelas);
}
```

## 🔧 Manual Debugging Steps

### Step 1: Check Browser Console

```
1. Buka Chrome DevTools (F12)
2. Pilih tab "Console"
3. Pilih mata kuliah di form
4. Lihat logs:
   - "🔍 Loading kelas for mata_kuliah_id: xxx"
   - "✅ Kelas loaded: N kelas found"
   - "📋 Kelas list: [...]"
```

### Step 2: Check Database

```sql
-- 1. Cek mata kuliah yang dipilih
SELECT id, kode_mk, nama_mk FROM mata_kuliah WHERE id = 'xxx';

-- 2. Cek kelas untuk mata kuliah tersebut
SELECT
  id,
  nama_kelas,
  kode_kelas,
  mata_kuliah_id,
  dosen_id,
  is_active,
  created_at
FROM kelas
WHERE mata_kuliah_id = 'xxx' -- ID dari step 1
  AND is_active = true
ORDER BY created_at DESC;

-- Expected result: 1+ rows
-- If 0 rows: Kelas belum dibuat ❌
```

### Step 3: Check RLS Policies

```sql
-- Cek apakah dosen bisa SELECT kelas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'kelas'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Should see policies allowing dosen to SELECT
```

### Step 4: Test API Manually

```typescript
// Di browser console
const { data, error } = await supabase
  .from("kelas")
  .select("*")
  .eq("mata_kuliah_id", "xxx") // ID mata kuliah
  .eq("is_active", true);

console.log("Kelas data:", data);
console.log("Error:", error);

// Expected: data array dengan 1+ kelas
// If empty: Problem di database/RLS
```

## 📊 Verification Checklist

### Admin Side:

- [ ] Kelas sudah dibuat via menu **Manajemen Kelas**
- [ ] Kelas di-assign ke **mata_kuliah_id** yang benar
- [ ] Kelas di-assign ke **dosen_id** (opsional tapi recommended)
- [ ] Kelas status `is_active = true`
- [ ] Kelas terlihat di table list admin

### Dosen Side:

- [ ] Pilih mata kuliah dari dropdown
- [ ] Tunggu loading (spinner muncul)
- [ ] List kelas muncul setelah loading selesai
- [ ] Bisa pilih kelas dari dropdown
- [ ] Info kelas muncul di bawah dropdown

### Database:

```sql
-- Quick check
SELECT
  mk.kode_mk,
  mk.nama_mk,
  COUNT(k.id) as jumlah_kelas
FROM mata_kuliah mk
LEFT JOIN kelas k ON k.mata_kuliah_id = mk.id AND k.is_active = true
GROUP BY mk.id, mk.kode_mk, mk.nama_mk
ORDER BY mk.kode_mk;

-- Expected: Semua mata kuliah punya minimal 1 kelas
-- If 0: Admin harus buat kelas untuk mata kuliah tersebut
```

## 🎯 Admin Action Required

Jika kelas tidak muncul, **ADMIN HARUS**:

### 1. Buat Kelas Baru

```
Menu: Admin > Manajemen Kelas > Buat Kelas Baru

Form:
- Nama Kelas: "Kelas A - Reguler Pagi"
- Kode Kelas: "REG-A-2024"
- Mata Kuliah: [Pilih dari dropdown] ← WAJIB
- Dosen: [Pilih dari dropdown] ← OPSIONAL
- Semester: 1 / 2
- Tahun Ajaran: 2024/2025
- Status: Aktif ✅

Simpan → Kelas akan tersedia untuk dosen
```

### 2. Assign Kelas ke Mata Kuliah

```sql
-- Jika kelas sudah ada tapi belum di-assign
UPDATE kelas
SET mata_kuliah_id = 'xxx' -- ID mata kuliah
WHERE id = 'yyy'; -- ID kelas
```

### 3. Aktivasi Kelas

```sql
-- Jika kelas inactive
UPDATE kelas
SET is_active = true
WHERE id = 'yyy';
```

## 📝 User Guide untuk Dosen

**Jika List Kelas Kosong**:

1. ✅ **Sudah pilih mata kuliah** di dropdown atas?
   - Jika belum → Pilih mata kuliah dulu

2. ⏳ **Tunggu loading** selesai
   - Lihat spinner "Memuat kelas..."
   - Tunggu beberapa detik

3. 📞 **Hubungi Admin** jika tetap kosong
   - Katakan: "List kelas kosong untuk [Nama Mata Kuliah]"
   - Admin akan buat kelas untuk mata kuliah tersebut
   - Setelah admin buat → Refresh page → Kelas muncul ✅

4. 🔄 **Refresh Page** setelah admin konfirmasi
   - Ctrl+R atau F5
   - Pilih mata kuliah lagi
   - Kelas seharusnya sudah muncul

## 🚀 Testing Scenario

### Test Case 1: Normal Flow (Kelas Sudah Ada)

```
1. Admin buat kelas "Kelas A" untuk "Anatomi"
2. Dosen login
3. Buat tugas baru
4. Pilih mata kuliah "Anatomi"
5. ✅ List kelas muncul: "Kelas A (REG-A-2024)"
6. Pilih "Kelas A"
7. Simpan tugas
```

### Test Case 2: Kelas Belum Ada

```
1. Dosen login
2. Buat tugas baru
3. Pilih mata kuliah "Biokimia"
4. ⚠️ Pesan muncul: "Belum ada kelas untuk mata kuliah ini"
5. ⚠️ Badge: "📞 Hubungi Admin"
6. Dosen hubungi admin
7. Admin buat kelas untuk "Biokimia"
8. Dosen refresh page
9. ✅ List kelas muncul
```

### Test Case 3: Auto-select Single Kelas

```
1. Admin buat 1 kelas "Kelas A" untuk "Farmakologi"
2. Dosen pilih mata kuliah "Farmakologi"
3. ✅ Kelas "Kelas A" otomatis terpilih (auto-select)
4. Info kelas muncul di bawah dropdown
5. Lanjut isi form
```

## 📈 Expected Behavior

### Dropdown States:

| State              | Placeholder                             | Disabled | Notes                        |
| ------------------ | --------------------------------------- | -------- | ---------------------------- |
| **No MK Selected** | "Pilih mata kuliah terlebih dahulu"     | ✅ Yes   | User must select MK first    |
| **Loading**        | "Memuat kelas..."                       | ✅ Yes   | Fetching from DB             |
| **Empty Result**   | "Tidak ada kelas untuk mata kuliah ini" | ✅ Yes   | Show alert with instructions |
| **Has Results**    | "Pilih kelas..."                        | ❌ No    | User can select              |
| **Editing Mode**   | Current kelas name                      | ✅ Yes   | Cannot change when editing   |

### Alert Shown When:

- ✅ Mata kuliah sudah dipilih
- ✅ Loading selesai
- ✅ List kelas kosong (0 results)

### Console Logs Expected:

```
🔍 Loading kelas for mata_kuliah_id: abc123
✅ Kelas loaded: 2 kelas found
📋 Kelas list: [
  { id: 'xxx', nama: 'Kelas A', kode: 'REG-A', mata_kuliah_id: 'abc123' },
  { id: 'yyy', nama: 'Kelas B', kode: 'REG-B', mata_kuliah_id: 'abc123' }
]
🎯 Auto-selected kelas: Kelas A
```

Or if empty:

```
🔍 Loading kelas for mata_kuliah_id: abc123
✅ Kelas loaded: 0 kelas found
⚠️ No kelas found for mata_kuliah_id: abc123
```

---

**Status**: ✅ Debugging Added
**Next Step**: Check console logs saat pilih mata kuliah
**Admin Action**: Buat kelas jika belum ada
