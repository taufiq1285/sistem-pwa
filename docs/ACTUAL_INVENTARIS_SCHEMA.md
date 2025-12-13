# ACTUAL INVENTARIS TABLE SCHEMA (FROM SUPABASE)

## ✅ Verified Database Columns

Based on actual Supabase query results:

| Column | Type | Nullable | Default | Max Length |
|--------|------|----------|---------|------------|
| `id` | uuid | NO | uuid_generate_v4() | - |
| `laboratorium_id` | uuid | **YES** | null | - |
| `kode_barang` | varchar | NO | null | 50 |
| `nama_barang` | varchar | NO | null | 255 |
| `kategori` | varchar | YES | null | 100 |
| `merk` | varchar | YES | null | 100 |
| `spesifikasi` | text | YES | null | - |
| `jumlah` | integer | NO | 1 | - |
| `jumlah_tersedia` | integer | NO | 1 | - |
| `kondisi` | enum | YES | 'baik' | - |
| `tahun_pengadaan` | integer | YES | null | - |
| `harga_satuan` | numeric | YES | null | - |
| `keterangan` | text | YES | null | - |

## 🔑 Foreign Keys

- `laboratorium_id` → `laboratorium.id`

## ⚠️ IMPORTANT NOTES

### Fields that DO NOT exist in database:
- ❌ `satuan` - Unit of measurement
- ❌ `lokasi_penyimpanan` - Storage location
- ❌ `is_available_for_borrowing` - Borrowing flag
- ❌ `foto_url` - Photo URL

### Correct Interface Should Be:

```typescript
export interface CreateInventarisData {
  // REQUIRED fields
  kode_barang: string;              // varchar(50) - Equipment code
  nama_barang: string;              // varchar(255) - Equipment name
  jumlah: number;                   // integer - Total quantity
  jumlah_tersedia: number;          // integer - Available quantity

  // OPTIONAL fields
  laboratorium_id?: string | null;  // uuid - Laboratory (nullable!)
  kategori?: string | null;         // varchar(100) - Category
  merk?: string | null;             // varchar(100) - Brand
  spesifikasi?: string | null;      // text - Specifications
  kondisi?: 'baik' | 'rusak_ringan' | 'rusak_berat'; // enum - Condition
  tahun_pengadaan?: number | null;  // integer - Acquisition year
  harga_satuan?: number | null;     // numeric - Price per unit
  keterangan?: string | null;       // text - Notes/description
}
```

## ✅ Valid Form Fields for EquipmentsPage

### Required:
1. `kode_barang` - Equipment Code
2. `nama_barang` - Equipment Name
3. `jumlah` - Total Quantity
4. `jumlah_tersedia` - Available Quantity

### Optional:
5. `laboratorium_id` - Laboratory (nullable - can be empty!)
6. `kategori` - Category
7. `merk` - Brand
8. `spesifikasi` - Specifications
9. `kondisi` - Condition (dropdown: baik, rusak_ringan, rusak_berat)
10. `tahun_pengadaan` - Acquisition Year
11. `harga_satuan` - Price per Unit
12. `keterangan` - Notes/Description

## 🔧 What Changed

### Previous Interface (WRONG):
```typescript
export interface CreateInventarisData {
  // ... other fields ...
  laboratorium_id: string;  // ❌ Was required
  is_available_for_borrowing?: boolean; // ❌ Doesn't exist in DB
  foto_url?: string;  // ❌ Doesn't exist in DB
}
```

### Corrected Interface:
```typescript
export interface CreateInventarisData {
  // ... other fields ...
  laboratorium_id?: string | null;  // ✅ Now optional/nullable
  // ✅ Removed is_available_for_borrowing
  // ✅ Removed foto_url
}
```

## 📝 Validation Rules

1. `kode_barang` - Max 50 characters
2. `nama_barang` - Max 255 characters
3. `kategori` - Max 100 characters
4. `merk` - Max 100 characters
5. `jumlah_tersedia` ≤ `jumlah`
6. `kondisi` - One of: 'baik', 'rusak_ringan', 'rusak_berat'
7. `laboratorium_id` - Must exist in laboratorium table OR be null

## 🎯 Key Insight

**IMPORTANT**: `laboratorium_id` is **NULLABLE** in database!
This means equipment can exist WITHOUT being assigned to a specific laboratory.

Form should allow:
- Select "No Laboratory" or "Unassigned"
- Or select from existing laboratories
