# INVENTARIS TABLE SCHEMA

## Current CreateInventarisData Interface

Berdasarkan `src/lib/api/laboran.api.ts`:

```typescript
export interface CreateInventarisData {
  kode_barang: string;              // REQUIRED
  nama_barang: string;              // REQUIRED
  kategori?: string;                // Optional
  merk?: string;                    // Optional
  spesifikasi?: string;             // Optional
  jumlah: number;                   // REQUIRED - Total quantity
  jumlah_tersedia: number;          // REQUIRED - Available quantity
  kondisi?: EquipmentCondition;     // Optional - 'baik' | 'rusak_ringan' | 'rusak_berat'
  harga_satuan?: number;            // Optional - Price per unit
  tahun_pengadaan?: number;         // Optional - Acquisition year
  laboratorium_id: string;          // REQUIRED - Foreign key to laboratorium
  is_available_for_borrowing?: boolean; // Optional - Can be borrowed?
  keterangan?: string;              // Optional - Notes/description
  foto_url?: string;                // Optional - Photo URL
}
```

## Fields NOT in Interface (Do NOT Use):
- ❌ `satuan` - Unit of measurement
- ❌ `lokasi_penyimpanan` - Storage location

## Recommended Form Fields:

### Required Fields:
1. **kode_barang** - Equipment code (e.g., "EQP-001")
2. **nama_barang** - Equipment name (e.g., "Microscope")
3. **jumlah** - Total quantity (number)
4. **jumlah_tersedia** - Available quantity (number, must be ≤ jumlah)
5. **laboratorium_id** - Laboratory (dropdown from laboratorium table)

### Optional Fields:
6. **kategori** - Category (e.g., "Lab Equipment")
7. **merk** - Brand (e.g., "Olympus")
8. **spesifikasi** - Specifications
9. **kondisi** - Condition (dropdown: baik, rusak_ringan, rusak_berat)
10. **harga_satuan** - Price per unit (number)
11. **tahun_pengadaan** - Acquisition year (number)
12. **is_available_for_borrowing** - Can be borrowed? (checkbox)
13. **keterangan** - Notes/description (textarea)
14. **foto_url** - Photo URL (text input)

## Validation Rules:
- `jumlah_tersedia` must be ≤ `jumlah`
- `kode_barang` should be unique
- `laboratorium_id` must exist in laboratorium table

## Example Form Data:
```typescript
{
  kode_barang: "MIC-001",
  nama_barang: "Digital Microscope",
  kategori: "Lab Equipment",
  merk: "Olympus",
  spesifikasi: "1000x magnification, LED illumination",
  jumlah: 5,
  jumlah_tersedia: 5,
  kondisi: "baik",
  harga_satuan: 15000000,
  tahun_pengadaan: 2024,
  laboratorium_id: "uuid-of-lab",
  is_available_for_borrowing: true,
  keterangan: "New acquisition for biology lab",
  foto_url: "https://example.com/microscope.jpg"
}
```

## SQL Query to Check Actual Schema:
Run the query in `check-inventaris-schema.sql` in Supabase SQL Editor
