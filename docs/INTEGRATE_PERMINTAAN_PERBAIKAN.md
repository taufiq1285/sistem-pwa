# 🔧 CARA INTEGRATE TAB PERMINTAAN PERBAIKAN KE PENILAIAN PAGE

## Option 1: Import & Tambahkan Tab (RECOMMENDED)

Buka file `src/pages/dosen/PenilaianPage.tsx` dan lakukan perubahan berikut:

### Step 1: Import Dependencies Baru

Tambahkan import di bagian atas file (sekitar baris 14-86):

```tsx
// ... existing imports ...
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermintaanPerbaikanTab } from "@/components/features/penilaian/PermintaanPerbaikanTab";
import { FileText, Edit } from "lucide-react"; // Untuk icons tab
```

### Step 2: Wrap Existing Content dengan Tabs

Cari bagian `return (...)` dari component utama (sekitar baris 400-an atau lebih), lalu wrap semua content dengan Tabs:

**BEFORE:**
```tsx
export default function DosenPenilaianPage() {
  // ... state dan functions ...

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Penilaian Mahasiswa</h1>
        ...
      </div>

      {/* Existing content: filters, table, dialogs, etc */}
      ...
    </div>
  );
}
```

**AFTER:**
```tsx
export default function DosenPenilaianPage() {
  // ... state dan functions ...

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Penilaian Mahasiswa</h1>
        <p className="text-gray-600">
          Input nilai dan review permintaan perbaikan nilai
        </p>
      </div>

      {/* WRAP WITH TABS */}
      <Tabs defaultValue="penilaian" className="space-y-4">
        <TabsList>
          <TabsTrigger value="penilaian" className="gap-2">
            <FileText className="h-4 w-4" />
            Penilaian Mahasiswa
          </TabsTrigger>
          <TabsTrigger value="permintaan" className="gap-2">
            <Edit className="h-4 w-4" />
            Permintaan Perbaikan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Existing Penilaian Content */}
        <TabsContent value="penilaian">
          {/* PINDAHKAN SEMUA EXISTING CONTENT KE SINI */}
          {/* Filters, Table, Dialogs, etc */}
          ...
        </TabsContent>

        {/* Tab 2: NEW Permintaan Perbaikan */}
        <TabsContent value="permintaan">
          {user?.dosen?.id && (
            <PermintaanPerbaikanTab dosenId={user.dosen.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 3: Struktur Lengkap

Untuk lebih jelas, berikut struktur lengkapnya:

```tsx
export default function DosenPenilaianPage() {
  const { user } = useAuth();
  // ... all existing state ...

  // ... all existing functions ...

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header - tetap di luar tabs */}
      <div>
        <h1 className="text-3xl font-bold">Penilaian Mahasiswa</h1>
        <p className="text-gray-600">
          Input nilai dan review permintaan perbaikan nilai
        </p>
      </div>

      {/* Tabs Container */}
      <Tabs defaultValue="penilaian" className="space-y-4">
        {/* Tab Navigation */}
        <TabsList>
          <TabsTrigger value="penilaian" className="gap-2">
            <FileText className="h-4 w-4" />
            Penilaian Mahasiswa
          </TabsTrigger>
          <TabsTrigger value="permintaan" className="gap-2">
            <Edit className="h-4 w-4" />
            Permintaan Perbaikan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Penilaian (Existing) */}
        <TabsContent value="penilaian" className="space-y-6">
          {/* Step Selection */}
          <Card>
            {/* ... existing step 1 & 2 content ... */}
          </Card>

          {/* Mahasiswa Table */}
          {selectedKelas && (
            <Card>
              {/* ... existing table content ... */}
            </Card>
          )}

          {/* All existing dialogs */}
          {/* EditDialog, ConfirmDialog, etc */}
        </TabsContent>

        {/* Tab 2: Permintaan Perbaikan (NEW) */}
        <TabsContent value="permintaan">
          {user?.dosen?.id ? (
            <PermintaanPerbaikanTab dosenId={user.dosen.id} />
          ) : (
            <Alert>
              <AlertDescription>
                Anda harus login sebagai dosen untuk mengakses fitur ini
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Option 2: Copy-Paste Full Integration (QUICK)

Jika Option 1 terlalu ribet, bisa download file integration lengkap:

**File**: `PenilaianPageIntegrated.tsx` (akan saya buatkan)

Lalu:
1. Backup file lama: `mv PenilaianPage.tsx PenilaianPage.backup.tsx`
2. Copy file baru: `mv PenilaianPageIntegrated.tsx PenilaianPage.tsx`
3. Restart dev server

---

## Verification

Setelah integrate, verifikasi:

### ✅ Visual Check
1. Login sebagai Dosen
2. Akses `/dosen/penilaian`
3. Harus ada 2 tabs:
   - **Tab 1**: "Penilaian Mahasiswa" (existing functionality)
   - **Tab 2**: "Permintaan Perbaikan" (new)

### ✅ Functionality Check
1. Tab "Permintaan Perbaikan" menampilkan:
   - Stats cards (Pending, Reviewed, Approval Rate)
   - Table dengan pending requests
   - Button "Review" di setiap row
2. Klik "Review":
   - Dialog muncul dengan detail permintaan
   - 2 tabs: "Setujui" dan "Tolak"
   - Form sesuai action
3. Submit Approve/Reject:
   - Toast success muncul
   - Request hilang dari table
   - Mahasiswa dapat notifikasi

---

## Common Issues

### Issue: "Module not found: PermintaanPerbaikanTab"

**Fix**:
```bash
# Pastikan file ada di lokasi yang benar:
ls src/components/features/penilaian/PermintaanPerbaikanTab.tsx

# Jika tidak ada folder, buat dulu:
mkdir -p src/components/features/penilaian
```

### Issue: "user.dosen is undefined"

**Fix**: Pastikan user login sebagai **Dosen**, bukan Mahasiswa/Admin/Laboran.

### Issue: "getPermintaanPendingForDosen is not a function"

**Fix**: Pastikan API sudah di-import:
```tsx
import {
  getPermintaanPendingForDosen,
  approvePermintaan,
  rejectPermintaan,
  getPermintaanStatsForDosen,
} from "@/lib/api/permintaan-perbaikan.api";
```

---

## Testing Scenario

### Scenario 1: Dosen Approve Permintaan

1. **Mahasiswa** ajukan permintaan perbaikan nilai Praktikum (75 → 85)
2. **Dosen** login → menu Penilaian → tab "Permintaan Perbaikan"
3. **Dosen** klik "Review" pada request
4. **Dosen** pilih tab "Setujui", isi nilai baru: 85
5. **Dosen** klik "Setujui & Update Nilai"
6. **Expected**:
   - Toast success: "Permintaan disetujui. Nilai Praktikum diupdate ke 85"
   - Request hilang dari table pending
   - Tabel `nilai` terupdate: `nilai_praktikum = 85`
   - Mahasiswa dapat notifikasi ✍️

### Scenario 2: Dosen Reject Permintaan

1. **Mahasiswa** ajukan permintaan perbaikan nilai UTS (60 → 75)
2. **Dosen** login → menu Penilaian → tab "Permintaan Perbaikan"
3. **Dosen** klik "Review" pada request
4. **Dosen** pilih tab "Tolak", isi alasan: "Nilai sudah sesuai dengan jawaban"
5. **Dosen** klik "Tolak Permintaan"
6. **Expected**:
   - Toast success: "Permintaan ditolak"
   - Request hilang dari table pending
   - Tabel `nilai` **TIDAK berubah** (tetap 60)
   - Mahasiswa dapat notifikasi ✍️ dengan alasan penolakan

---

## Next Steps

Setelah integrate:

1. ✅ Test dengan scenario di atas
2. ✅ Pastikan notifikasi terkirim (check `NotificationDropdown`)
3. ✅ Verify nilai auto-update di database
4. ✅ Test approval rate calculation di stats card

---

Sudah siap? Pilih Option 1 untuk manual integrate atau Option 2 untuk copy-paste full file! 🚀
