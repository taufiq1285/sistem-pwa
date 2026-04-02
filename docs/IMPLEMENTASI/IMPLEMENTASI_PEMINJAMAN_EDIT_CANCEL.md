# Implementasi Fitur Edit & Cancel Peminjaman

## ✅ SUDAH SELESAI

### 1. API Functions (dosen.api.ts) ✅
- [x] `updateBorrowingRequest` - Sudah ditambahkan ke `src/lib/api/dosen.api.ts:1145`
- [x] `cancelBorrowingRequest` - Sudah ditambahkan ke `src/lib/api/dosen.api.ts:1269`
- [x] Export sudah ditambahkan ke `dosenApi` object di line 1351-1352

## 🔄 PERLU DILAKUKAN MANUAL

### 2. Update PeminjamanPage.tsx

Karena file terus dimodifikasi oleh linter, berikut panduan lengkap untuk update manual:

---

#### STEP 1: Update Imports (Line 2 & 21-37)

**BEFORE:**
```typescript
import { Package, Clock, CheckCircle, XCircle, RotateCcw, Search, Plus, Download } from 'lucide-react';
```

**AFTER:**
```typescript
import { Package, Clock, CheckCircle, XCircle, RotateCcw, Search, Plus, Download, Edit, Trash2 } from 'lucide-react';
```

**TAMBAHKAN SETELAH Dialog import:**
```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

**Update API import (line 37):**
```typescript
// BEFORE:
import { getMyBorrowing, type MyBorrowingRequest, type BorrowingStatus, createBorrowingRequest, getAvailableEquipment, returnBorrowingRequest, markBorrowingAsTaken } from '@/lib/api/dosen.api';

// AFTER:
import { getMyBorrowing, type MyBorrowingRequest, type BorrowingStatus, createBorrowingRequest, updateBorrowingRequest, cancelBorrowingRequest, getAvailableEquipment, returnBorrowingRequest, markBorrowingAsTaken } from '@/lib/api/dosen.api';
```

---

#### STEP 2: Tambah State (setelah state yang sudah ada, sekitar line 118)

```typescript
// Edit Peminjaman State
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [selectedEditEquipment, setSelectedEditEquipment] = useState<AvailableEquipment | null>(null);

// Cancel Peminjaman State
const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
const [cancelingId, setCancelingId] = useState<string | null>(null);
const [cancelingData, setCancelingData] = useState<MyBorrowingRequest | null>(null);
const [cancelingLoading, setCancelingLoading] = useState(false);

// Edit form
const editForm = useForm<BorrowingFormData>({
  resolver: zodResolver(borrowingFormSchema),
  defaultValues: {
    inventaris_id: '',
    jumlah_pinjam: 1,
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_kembali_rencana: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    keperluan: '',
  },
});
```

---

#### STEP 3: Tambah Handlers (setelah onSubmit, sekitar line 243)

```typescript
/**
 * Handle Edit - buka dialog edit
 */
const handleEdit = (borrowing: MyBorrowingRequest) => {
  const selectedEquip = equipment.find(e => e.nama_barang === borrowing.inventaris_nama);

  setEditingId(borrowing.id);
  setSelectedEditEquipment(selectedEquip || null);

  editForm.reset({
    inventaris_id: selectedEquip?.id || '',
    jumlah_pinjam: borrowing.jumlah_pinjam,
    tanggal_pinjam: borrowing.tanggal_pinjam,
    tanggal_kembali_rencana: borrowing.tanggal_kembali_rencana,
    keperluan: borrowing.keperluan || '',
  });

  setEditDialogOpen(true);
};

/**
 * Handle equipment change untuk edit form
 */
const onEditEquipmentChange = (equipmentId: string) => {
  const selected = equipment.find((e) => e.id === equipmentId);
  setSelectedEditEquipment(selected || null);
  editForm.setValue('inventaris_id', equipmentId);
};

/**
 * Submit Edit Peminjaman
 */
const onEditSubmit = async (data: BorrowingFormData) => {
  if (!editingId) return;

  try {
    setSubmitting(true);

    // Validate dates
    const pinjamDate = new Date(data.tanggal_pinjam);
    const kembaliDate = new Date(data.tanggal_kembali_rencana);

    if (kembaliDate <= pinjamDate) {
      toast.error('Tanggal kembali harus setelah tanggal pinjam');
      return;
    }

    // Check stock
    if (selectedEditEquipment && data.jumlah_pinjam > selectedEditEquipment.jumlah_tersedia) {
      toast.error(`Stok tidak cukup. Tersedia: ${selectedEditEquipment.jumlah_tersedia}`);
      return;
    }

    // Submit update
    await updateBorrowingRequest(editingId, {
      inventaris_id: data.inventaris_id,
      jumlah_pinjam: data.jumlah_pinjam,
      tanggal_pinjam: data.tanggal_pinjam,
      tanggal_kembali_rencana: data.tanggal_kembali_rencana,
      keperluan: data.keperluan,
    });

    toast.success('Peminjaman berhasil diperbarui!');
    setEditDialogOpen(false);
    setEditingId(null);
    setSelectedEditEquipment(null);
    editForm.reset();

    // Reload data
    await loadBorrowings();
    await loadEquipment();
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || 'Gagal memperbarui peminjaman');
  } finally {
    setSubmitting(false);
  }
};

/**
 * Handle Cancel - buka dialog konfirmasi
 */
const handleCancelRequest = (borrowing: MyBorrowingRequest) => {
  setCancelingId(borrowing.id);
  setCancelingData(borrowing);
  setCancelDialogOpen(true);
};

/**
 * Confirm Cancel Peminjaman
 */
const confirmCancelRequest = async () => {
  if (!cancelingId) return;

  try {
    setCancelingLoading(true);
    await cancelBorrowingRequest(cancelingId);

    toast.success('Peminjaman berhasil dibatalkan');
    setCancelDialogOpen(false);
    setCancelingId(null);
    setCancelingData(null);

    // Reload data
    await loadBorrowings();
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || 'Gagal membatalkan peminjaman');
  } finally {
    setCancelingLoading(false);
  }
};
```

---

#### STEP 4: Update Table - Tambah Kolom Actions

**Di TableHeader (sekitar line 396):**
```typescript
<TableHeader>
  <TableRow>
    <TableHead>Kode</TableHead>
    <TableHead>Nama</TableHead>
    <TableHead>Lab</TableHead>
    <TableHead>Jumlah</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Aksi</TableHead> {/* TAMBAH INI */}
  </TableRow>
</TableHeader>
```

**Di TableBody - REPLACE existing map (sekitar line 405-422):**
```typescript
{filteredBorrowings.map((b) => {
  const cfg = STATUS_CONFIG[b.status as BorrowingStatus] || STATUS_CONFIG.menunggu;
  const Icon = cfg.icon;
  const isPending = b.status === 'menunggu' || b.status === 'pending';

  return (
    <TableRow key={b.id}>
      <TableCell className="font-mono">{b.inventaris_kode}</TableCell>
      <TableCell>{b.inventaris_nama}</TableCell>
      <TableCell>{b.laboratorium_nama}</TableCell>
      <TableCell>{b.jumlah_pinjam}</TableCell>
      <TableCell>
        <Badge variant={cfg.variant}>
          <Icon className="h-3 w-3 mr-1" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell>
        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(b)}
              className="h-8 gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleCancelRequest(b)}
              className="h-8 gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Batal
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
})}
```

---

#### STEP 5: Tambah Edit Dialog (sebelum closing </div>, sekitar line 656)

```typescript
{/* Edit Dialog */}
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Edit Peminjaman Alat</DialogTitle>
      <DialogDescription>
        Ubah detail peminjaman. Hanya bisa diubah jika statusnya masih menunggu.
      </DialogDescription>
    </DialogHeader>

    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
        <FormField
          control={editForm.control}
          name="inventaris_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Alat</FormLabel>
              <Select value={field.value} onValueChange={onEditEquipmentChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alat" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama_barang} (Stok: {item.jumlah_tersedia})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="jumlah_pinjam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max={selectedEditEquipment?.jumlah_tersedia || 1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              {selectedEditEquipment && (
                <p className="text-xs text-muted-foreground">
                  Stok tersedia: {selectedEditEquipment.jumlah_tersedia}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="tanggal_pinjam"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Pinjam</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="tanggal_kembali_rencana"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tanggal Rencana Kembali</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="keperluan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keperluan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan keperluan..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {field.value.length}/500 karakter
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <span className="animate-spin">⌛</span>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

---

#### STEP 6: Tambah Cancel Dialog (setelah Edit Dialog)

```typescript
{/* Cancel Confirmation Dialog */}
<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Batalkan Peminjaman?</AlertDialogTitle>
      <AlertDialogDescription>
        Anda akan membatalkan peminjaman alat berikut:
        <div className="mt-3 p-3 bg-muted rounded-lg space-y-1">
          <p className="font-semibold">{cancelingData?.inventaris_nama}</p>
          <p className="text-sm text-muted-foreground">
            Kode: {cancelingData?.inventaris_kode}
          </p>
          <p className="text-sm text-muted-foreground">
            Jumlah: {cancelingData?.jumlah_pinjam}
          </p>
          <p className="text-sm text-muted-foreground">
            Tanggal: {cancelingData?.tanggal_pinjam} s/d {cancelingData?.tanggal_kembali_rencana}
          </p>
        </div>
        <p className="mt-3 text-destructive font-semibold">
          Tindakan ini tidak dapat dibatalkan!
        </p>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={cancelingLoading}>
        Tidak, Kembali
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={confirmCancelRequest}
        disabled={cancelingLoading}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {cancelingLoading ? (
          <>
            <span className="animate-spin mr-2">⌛</span>
            Membatalkan...
          </>
        ) : (
          'Ya, Batalkan Peminjaman'
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📝 CHECKLIST IMPLEMENTASI

- [ ] Step 1: Update imports (icons, AlertDialog, API functions)
- [ ] Step 2: Tambah state (edit & cancel state, editForm)
- [ ] Step 3: Tambah handlers (handleEdit, onEditSubmit, handleCancelRequest, confirmCancelRequest, onEditEquipmentChange)
- [ ] Step 4: Update table (tambah kolom "Aksi", tombol Edit & Batal)
- [ ] Step 5: Tambah Edit Dialog (form lengkap)
- [ ] Step 6: Tambah Cancel Dialog (konfirmasi)
- [ ] Test: Edit peminjaman pending
- [ ] Test: Cancel peminjaman pending
- [ ] Test: Tombol tidak muncul jika status bukan pending

---

## 🎯 HASIL AKHIR

Setelah implementasi selesai:

1. ✅ Tombol **Edit** dan **Batal** muncul di kolom "Aksi" untuk peminjaman status PENDING
2. ✅ Klik **Edit** → buka dialog edit dengan data pre-filled
3. ✅ Ubah alat/jumlah/tanggal/keperluan → validasi stok → simpan
4. ✅ Klik **Batal** → konfirmasi → hapus peminjaman
5. ✅ Tombol hilang jika status sudah APPROVED/IN_USE/RETURNED

---

## 🔧 TROUBLESHOOTING

**Error: updateBorrowingRequest is not a function**
- Pastikan import sudah benar di line 37
- Pastikan API sudah di-export di `dosen.api.ts:1351`

**Error: AlertDialog components not found**
- Pastikan import AlertDialog sudah ditambahkan
- Install jika belum: `npx shadcn-ui@latest add alert-dialog`

**Tombol tidak muncul**
- Cek kondisi `isPending` di table mapping
- Cek value `b.status` apakah 'pending' atau 'menunggu'

---

Semua kode sudah siap! Tinggal copy-paste sesuai step di atas. 🚀
