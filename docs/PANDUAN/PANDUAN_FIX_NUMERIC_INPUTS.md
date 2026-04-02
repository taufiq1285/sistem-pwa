# Panduan Memperbaiki Field Input Angka

## Masalah
Field input dengan `type="number"` langsung kembali ke default value saat user menghapus semua angka. Ini membuat user tidak bisa menghapus value lama sebelum ketik value baru.

## Solusi
Ubah `type="number"` menjadi `type="text"` dengan `inputMode="numeric"` dan validasi regex.

## Pola Perbaikan

### 1. Untuk Field Integer (jumlah, kapasitas, tahun_pengadaan, denda)

**❌ SEBELUM:**
```tsx
<Input
  type="number"
  min="0"
  value={formData.jumlah}
  onChange={(e) =>
    setFormData({
      ...formData,
      jumlah: parseInt(e.target.value) || 0,
    })
  }
/>
```

**✅ SESUDAH:**
```tsx
<Input
  type="text"
  inputMode="numeric"
  value={formData.jumlah}
  onChange={(e) => {
    const value = e.target.value;
    // Allow empty or numeric values only
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({
        ...formData,
        jumlah: value === "" ? 0 : parseInt(value),
      });
    }
  }}
/>
```

### 2. Untuk Field Decimal (nilai, harga_satuan)

**❌ SEBELUM:**
```tsx
<Input
  type="number"
  min="0"
  max="100"
  step="0.01"
  value={formData.nilai_uts}
  onChange={(e) =>
    handleGradeChange(
      mahasiswa.mahasiswa_id,
      "nilai_uts",
      e.target.value,
    )
  }
/>
```

**✅ SESUDAH:**
```tsx
<Input
  type="text"
  inputMode="numeric"
  value={formData.nilai_uts}
  onChange={(e) => {
    const value = e.target.value;
    // Allow empty or decimal values only
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      handleGradeChange(
        mahasiswa.mahasiswa_id,
        "nilai_uts",
        value === "" ? "0" : value,
      );
    }
  }}
/>
```

## File yang Perlu Diperbaiki

### 1. src/pages/dosen/PenilaianPage.tsx

**Lokasi 1: Tabel Nilai (lines 995-1068)**
- Field: nilai_uts, nilai_uas, nilai_praktikum, nilai_kehadiran
- Pola: Decimal (0-100 dengan 2 desimal)

```tsx
// GANTI 4 input di tabel (nilai_uts, nilai_uas, nilai_praktikum, nilai_kehadiran)
<Input
  type="text"
  inputMode="numeric"
  value={getDisplayValue(mahasiswa, "nilai_uts")}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      handleGradeChange(
        mahasiswa.mahasiswa_id,
        "nilai_uts",
        value === "" ? "0" : value,
      );
    }
  }}
  className="w-20 text-center"
/>
```

**Lokasi 2: Dialog Edit (lines 1407-1487)**
- Field: nilai_uts, nilai_uas, nilai_praktikum, nilai_kehadiran
- Pola: Decimal

**Lokasi 3: Dialog Bobot Nilai (lines 1182-1292)**
- Field: kuis, tugas, uts, uas, praktikum, kehadiran (bobot %)
- Pola: Integer (0-100)

```tsx
<Input
  id="kuis"
  type="text"
  inputMode="numeric"
  value={editingBobot.kuis}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      handleBobotChange("kuis", value === "" ? "0" : value);
    }
  }}
  className="w-24"
/>
```

### 2. src/pages/laboran/InventarisPage.tsx

**Lokasi 1: Form Dialog (lines 561-590)**
- Field: jumlah, jumlah_tersedia
- Pola: Integer

```tsx
<Input
  id="jumlah"
  type="text"
  inputMode="numeric"
  value={formData.jumlah || 0}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({
        ...formData,
        jumlah: value === "" ? 0 : parseInt(value),
      });
    }
  }}
  required
/>
```

**Lokasi 2: Field Harga Satuan (lines 615-626)**
- Field: harga_satuan
- Pola: Decimal

**Lokasi 3: Field Tahun Pengadaan (lines 630-642)**
- Field: tahun_pengadaan
- Pola: Integer (1900-2100)

**Lokasi 4: Stock Adjustment Dialog (lines 745-755)**
- Field: amount
- Pola: Integer

### 3. src/pages/laboran/LaboratoriumPage.tsx

**Lokasi: Form Dialog (lines 688-700)**
- Field: kapasitas
- Pola: Integer

```tsx
<Input
  id="kapasitas"
  type="text"
  inputMode="numeric"
  value={formData.kapasitas}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData({
        ...formData,
        kapasitas: value === "" ? 0 : parseInt(value),
      });
    }
  }}
  placeholder="30"
/>
```

### 4. src/pages/admin/LaboratoriesPage.tsx

**Lokasi 1: Edit Dialog (lines 356-366)**
- Field: kapasitas
- Pola: Integer

**Lokasi 2: Add Dialog (lines 452-464)**
- Field: kapasitas
- Pola: Integer

### 5. src/pages/admin/EquipmentsPage.tsx

**Lokasi 1: Add Dialog (lines 479-506)**
- Field: jumlah, jumlah_tersedia
- Pola: Integer

**Lokasi 2: Add Dialog (lines 587-599)**
- Field: tahun_pengadaan
- Pola: Integer

**Lokasi 3: Edit Dialog (lines 668-692)**
- Field: jumlah, jumlah_tersedia
- Pola: Integer

**Lokasi 4: Edit Dialog (lines 736-746)**
- Field: tahun_pengadaan
- Pola: Integer

### 6. src/pages/laboran/PeminjamanAktifPage.tsx

**Lokasi: Return Dialog (lines 599-611)**
- Field: denda
- Pola: Integer

```tsx
<Input
  id="denda"
  type="text"
  inputMode="numeric"
  value={returnForm.denda}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setReturnForm({
        ...returnForm,
        denda: value === "" ? 0 : parseInt(value),
      });
    }
  }}
/>
```

### 7. src/pages/dosen/PeminjamanPage.tsx

**⚠️ FILE INI MENGGUNAKAN react-hook-form, SKIP!**
File ini sudah menggunakan react-hook-form dengan `{...register()}`, tidak perlu diubah.

### 8. src/pages/mahasiswa/NilaiPage.tsx

**Lokasi: Dialog Permintaan Perbaikan (lines 628-635)**
- Field: nilai_usulan
- Pola: Decimal (0-100)

```tsx
<Input
  type="text"
  inputMode="numeric"
  value={nilaiUsulan}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNilaiUsulan(value);
    }
  }}
  placeholder="Contoh: 85"
/>
```

### 9. src/components/features/penilaian/PermintaanPerbaikanTab.tsx

**Lokasi: Review Dialog (lines 463-471)**
- Field: nilai_baru
- Pola: Decimal (0-100)

```tsx
<Input
  type="text"
  inputMode="numeric"
  value={nilaiBaru}
  onChange={(e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNilaiBaru(value);
    }
  }}
  placeholder="0-100"
  className="mt-1"
/>
```

## Checklist Implementasi

- [ ] PenilaianPage.tsx - 4 field nilai di tabel
- [ ] PenilaianPage.tsx - 4 field nilai di dialog edit
- [ ] PenilaianPage.tsx - 6 field bobot nilai di dialog bobot
- [ ] InventarisPage.tsx - jumlah & jumlah_tersedia (2x di form + edit)
- [ ] InventarisPage.tsx - harga_satuan
- [ ] InventarisPage.tsx - tahun_pengadaan
- [ ] InventarisPage.tsx - amount (stock adjustment)
- [ ] LaboratoriumPage.tsx - kapasitas
- [ ] LaboratoriesPage.tsx - kapasitas (2x di edit + add)
- [ ] EquipmentsPage.tsx - jumlah & jumlah_tersedia (2x di add + edit)
- [ ] EquipmentsPage.tsx - tahun_pengadaan (2x di add + edit)
- [ ] PeminjamanAktifPage.tsx - denda
- [ ] NilaiPage.tsx - nilai_usulan
- [ ] PermintaanPerbaikanTab.tsx - nilai_baru

## Testing

Setelah perubahan, test untuk memastikan:
1. ✅ User bisa menghapus semua angka tanpa langsung kembali ke default
2. ✅ User bisa input angka baru setelah menghapus
3. ✅ Validasi regex mencegah input non-numeric
4. ✅ Nilai tersimpan dengan benar (integer vs float)
5. ✅ inputMode="numeric" menampilkan keyboard angka di mobile

## Notes

- **JANGAN ubah file yang menggunakan react-hook-form** (seperti PeminjamanPage.tsx yang menggunakan `{...register()}`)
- **Hapus attribute min, max, step** dari Input karena tidak berfungsi di type="text"
- **Regex untuk integer:** `/^\d+$/` (hanya angka)
- **Regex untuk decimal:** `/^\d*\.?\d*$/` (angka dengan optional titik desimal)
- **inputMode="numeric"** memunculkan keyboard angka di mobile browser
