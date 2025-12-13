# Ì¥ç ANALISIS LOGIKA FITUR KUIS DOSEN

## ‚ùì PERTANYAAN
**"Mengapa dosen harus buat kelas lagi? Kenapa tidak langsung pilih kelas yang sudah dibuat admin?"**

---

## ÔøΩÔøΩ MASALAH YANG DITEMUKAN

### Current Workflow (SEKARANG)
```
Dosen ingin buat kuis
  ‚Üì
1. Buka QuizBuilder
2. Pilih kelas dari dropdown
3. ‚ùå JIKA TIDAK ADA KELAS ‚Üí Klik "Buat Kelas Baru"
4. ‚ùå Dosen harus input:
   - Nama Kelas
   - Mata Kuliah
   - Semester
   - Tahun Ajaran
5. Setelah kelas dibuat, baru bisa lanjut buat kuis
```

### Expected Workflow (SEHARUSNYA)
```
Admin sudah buat kelas di sistem
  ‚Üì
Dosen ingin buat kuis
  ‚Üì
1. Buka QuizBuilder
2. Pilih kelas yang SUDAH ADA (dibuat admin)
3. ‚úÖ Langsung buat kuis
```

---

## Ì¥é ROOT CAUSE ANALYSIS

### Lokasi Kode: `QuizBuilder.tsx`

#### Problem 1: Kelas List Kosong atau Tidak Ter-load
```tsx
// Line 84-87
const [kelasList, setKelasList] = useState<Kelas[]>([]);
const [isLoadingKelas, setIsLoadingKelas] = useState(false);

// Line 161-174: loadKelas function
const loadKelas = async () => {
  setIsLoadingKelas(true);
  try {
    const data = await getKelas({ dosen_id: dosenId });
    setKelasList(data);
  } catch (_error: unknown) {
    console.error("Failed to load kelas");
    toast.error("Gagal memuat daftar kelas");
  } finally {
    setIsLoadingKelas(false);
  }
};
```

**MASALAH:**
- ‚úÖ Code sudah benar: `getKelas({ dosen_id: dosenId })`
- ‚ùå **TAPI:** Kemungkinan query tidak mengembalikan kelas karena:
  1. Filter `dosen_id` terlalu ketat
  2. Kelas yang dibuat admin tidak ter-link ke dosen
  3. RLS policy memblock query

#### Problem 2: UI Menampilkan "Buat Kelas Baru" Terlalu Prominent
```tsx
// Line 386-395
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => setShowCreateKelasDialog(true)}
  className="text-xs"
>
  <Plus className="h-3 w-3 mr-1" />
  Buat Kelas Baru
</Button>
```

**MASALAH:**
- UI memberikan kesan dosen **harus** buat kelas sendiri
- Tidak ada pesan error jelas jika kelas kosong
- Tidak ada instruksi "Hubungi admin untuk assign kelas"

---

## Ì¥ß KEMUNGKINAN PENYEBAB

### 1. Database/API Issue
```sql
-- Kemungkinan query yang dijalankan:
SELECT * FROM kelas WHERE dosen_id = 'xxx'

-- MASALAH: Kelas yang dibuat admin mungkin tidak punya dosen_id
```

**Verification Needed:**
- Cek apakah kelas yang dibuat admin di `AdminKelasManagement` memiliki `dosen_id`
- Cek apakah ada step "Assign Dosen ke Kelas"

### 2. RLS Policy Terlalu Ketat
```sql
-- Kemungkinan RLS policy:
CREATE POLICY "Dosen can only see their own kelas"
  ON kelas FOR SELECT
  USING (dosen_id = auth.uid());
```

**MASALAH:** Policy ini akan block kelas yang dibuat admin jika belum di-assign

### 3. Missing "Assign Dosen" Feature
- Admin buat kelas di `AdminKelasManagement`
- ‚ùå **TIDAK ADA** step "Assign dosen ke kelas ini"
- Akibat: `dosen_id` di tabel `kelas` = NULL
- Ketika dosen query `getKelas({ dosen_id: dosenId })` ‚Üí result kosong

---

## ‚úÖ SOLUSI YANG DIREKOMENDASIKAN

### Solusi 1: Fix Admin Workflow (RECOMMENDED)
**Admin harus bisa assign dosen ke kelas yang dibuat**

```tsx
// Di AdminKelasManagement.tsx
// Tambahkan field "Dosen" saat create/edit kelas:

<FormField
  control={form.control}
  name="dosen_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Dosen Pengampu *</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih dosen" />
        </SelectTrigger>
        <SelectContent>
          {dosenList.map((dosen) => (
            <SelectItem key={dosen.id} value={dosen.id}>
              {dosen.users.full_name} - {dosen.nip}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

### Solusi 2: Fix Query Logic di QuizBuilder
**Ubah query agar lebih fleksibel:**

```tsx
// BEFORE (Line 161-174):
const data = await getKelas({ dosen_id: dosenId });

// AFTER (Option A - Get all active kelas):
const data = await getKelas({ is_active: true });

// AFTER (Option B - Get kelas where dosen is assigned OR kelas has no dosen):
const data = await getKelas({ 
  or: [
    { dosen_id: dosenId },
    { dosen_id: null }
  ]
});
```

### Solusi 3: Improve UX di QuizBuilder
**Berikan feedback lebih jelas:**

```tsx
<SelectTrigger>
  <SelectValue
    placeholder={
      isLoadingKelas
        ? "Memuat..."
        : kelasList.length === 0
          ? "‚ùå Tidak ada kelas tersedia. Hubungi admin untuk assign kelas."
          : "Pilih kelas..."
    }
  />
</SelectTrigger>

{kelasList.length === 0 && !isLoadingKelas && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Tidak ada kelas tersedia</AlertTitle>
    <AlertDescription>
      Silakan hubungi admin untuk assign kelas ke akun Anda.
      Atau klik "Buat Kelas Baru" jika Anda memiliki izin.
    </AlertDescription>
  </Alert>
)}
```

### Solusi 4: Hide "Buat Kelas Baru" untuk Dosen Biasa
**Hanya admin atau super dosen yang boleh buat kelas:**

```tsx
{!isEditing && user?.role === 'admin' && (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => setShowCreateKelasDialog(true)}
  >
    <Plus className="h-3 w-3 mr-1" />
    Buat Kelas Baru
  </Button>
)}
```

---

## ÌæØ REKOMENDASI IMPLEMENTASI

### Priority 1: Fix Admin Workflow ‚úÖ
1. Tambahkan field "Dosen Pengampu" di Admin Kelas Management
2. Saat admin buat kelas, wajib pilih dosen
3. Update existing kelas yang belum punya dosen

### Priority 2: Improve Query ‚úÖ
1. Ubah `getKelas()` di QuizBuilder agar lebih fleksibel
2. Show all kelas yang dosen boleh akses (assigned atau unassigned)

### Priority 3: Better UX ‚úÖ
1. Tampilkan pesan jelas jika tidak ada kelas
2. Hide "Buat Kelas Baru" untuk dosen biasa
3. Add alert "Hubungi admin" jika kelas list kosong

---

## Ì≥ä VERIFICATION CHECKLIST

- [ ] Cek tabel `kelas`: Apakah ada kolom `dosen_id`?
- [ ] Cek kelas yang dibuat admin: Apakah `dosen_id` = NULL?
- [ ] Cek RLS policy untuk tabel `kelas`
- [ ] Cek permission dosen: Apakah boleh read all kelas?
- [ ] Test: Admin assign dosen ke kelas
- [ ] Test: Dosen buka QuizBuilder, apakah kelas muncul?

---

## Ì∫Ä NEXT STEPS

1. **IMMEDIATE**: Cek database untuk verify root cause
2. **SHORT-TERM**: Implement Solusi 1 + 2 + 3
3. **LONG-TERM**: Add audit log untuk track kelas assignment

---

**Kesimpulan:**
Masalahnya bukan di logika QuizBuilder, tapi di **workflow admin** yang tidak assign dosen ke kelas. 
Atau RLS policy terlalu ketat yang block kelas yang belum ter-assign.

