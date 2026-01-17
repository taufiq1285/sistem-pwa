/* eslint-disable react-hooks/rules-of-hooks */
/**
 * UI UPDATES untuk PeminjamanPage.tsx
 * Tambahkan kode-kode berikut ke file yang sudah ada
 */

// ============================================================================
// 1. IMPORT TAMBAHAN (di bagian atas file)
// ============================================================================
import {
  updateBorrowingRequest,
  cancelBorrowingRequest,
} from "@/lib/api/dosen.api";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// 2. TAMBAHKAN STATE (di dalam component, setelah state yang sudah ada)
// ============================================================================

// Edit Peminjaman State
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [editingData, setEditingData] = useState<MyBorrowingRequest | null>(null);

// Cancel Peminjaman State
const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
const [cancelingId, setCancelingId] = useState<string | null>(null);
const [cancelingData, setCancelingData] = useState<MyBorrowingRequest | null>(
  null
);
const [cancelingLoading, setCancelingLoading] = useState(false);

// Edit form
const editForm = useForm<BorrowingFormData>({
  resolver: zodResolver(borrowingFormSchema),
  defaultValues: {
    inventaris_id: "",
    jumlah_pinjam: 1,
    tanggal_pinjam: new Date().toISOString().split("T")[0],
    tanggal_kembali_rencana: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    keperluan: "",
  },
});

// ============================================================================
// 3. HANDLERS (tambahkan setelah onSubmit function)
// ============================================================================

/**
 * Handle Edit Peminjaman
 */
const handleEdit = (borrowing: MyBorrowingRequest) => {
  // Find equipment ID from name
  const selectedEquip = equipment.find(
    (e) => e.nama_barang === borrowing.inventaris_nama
  );

  setEditingId(borrowing.id);
  setEditingData(borrowing);

  // Pre-fill form dengan data existing
  editForm.reset({
    inventaris_id: selectedEquip?.id || "",
    jumlah_pinjam: borrowing.jumlah_pinjam,
    tanggal_pinjam: borrowing.tanggal_pinjam,
    tanggal_kembali_rencana: borrowing.tanggal_kembali_rencana,
    keperluan: borrowing.keperluan || "",
  });

  setEditDialogOpen(true);
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
      toast.error("Tanggal kembali harus setelah tanggal pinjam");
      return;
    }

    // Check stock
    if (
      selectedEquipment &&
      data.jumlah_pinjam > selectedEquipment.jumlah_tersedia
    ) {
      toast.error(
        `Stok tidak cukup. Tersedia: ${selectedEquipment.jumlah_tersedia}`
      );
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

    toast.success("Peminjaman berhasil diperbarui!");
    setEditDialogOpen(false);
    setEditingId(null);
    setEditingData(null);
    editForm.reset();
    setSelectedEquipment(null);

    // Reload data
    await loadBorrowings();
    await loadEquipment();
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Gagal memperbarui peminjaman");
  } finally {
    setSubmitting(false);
  }
};

/**
 * Handle Cancel Peminjaman
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

    toast.success("Peminjaman berhasil dibatalkan");
    setCancelDialogOpen(false);
    setCancelingId(null);
    setCancelingData(null);

    // Reload data
    await loadBorrowings();
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Gagal membatalkan peminjaman");
  } finally {
    setCancelingLoading(false);
  }
};

// ============================================================================
// 4. TAMBAHKAN KOLOM ACTIONS DI TABLE (di dalam TableBody map)
// ============================================================================

// REPLACE existing TableRow dengan ini:
{
  filteredBorrowings.map((b) => {
    const cfg =
      STATUS_CONFIG[b.status as BorrowingStatus] || STATUS_CONFIG.menunggu;
    const Icon = cfg.icon;
    const isPending = b.status === "menunggu" || b.status === "pending";

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
        {/* KOLOM BARU: ACTIONS */}
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
  });
}

// JANGAN LUPA TAMBAHKAN HEADER BARU DI TableHeader:
<TableHeader>
  <TableRow>
    <TableHead>Kode</TableHead>
    <TableHead>Nama</TableHead>
    <TableHead>Lab</TableHead>
    <TableHead>Jumlah</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Aksi</TableHead> {/* TAMBAH INI */}
  </TableRow>
</TableHeader>;

// ============================================================================
// 5. EDIT DIALOG (tambahkan sebelum closing </div>)
// ============================================================================

{
  /* Edit Dialog */
}
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Edit Peminjaman Alat</DialogTitle>
      <DialogDescription>
        Ubah detail peminjaman Anda. Hanya bisa diubah jika statusnya masih
        menunggu.
      </DialogDescription>
    </DialogHeader>

    <Form {...editForm}>
      <form
        onSubmit={editForm.handleSubmit(onEditSubmit)}
        className="space-y-4"
      >
        {/* Equipment Selection */}
        <FormField
          control={editForm.control}
          name="inventaris_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pilih Alat</FormLabel>
              <Select
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val);
                  onEquipmentChange(val);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alat yang ingin dipinjam" />
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

        {/* Quantity */}
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
                  max={selectedEquipment?.jumlah_tersedia || 1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              {selectedEquipment && (
                <p className="text-xs text-muted-foreground">
                  Stok tersedia: {selectedEquipment.jumlah_tersedia}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Borrowing Date */}
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

        {/* Return Date */}
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

        {/* Purpose */}
        <FormField
          control={editForm.control}
          name="keperluan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keperluan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan untuk keperluan apa alat ini dipinjam..."
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

        {/* Submit Button */}
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
</Dialog>;

{
  /* Cancel Confirmation Dialog */
}
<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Batalkan Peminjaman?</AlertDialogTitle>
      <AlertDialogDescription>
        Anda akan membatalkan peminjaman alat berikut:
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="font-semibold">{cancelingData?.inventaris_nama}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Kode: {cancelingData?.inventaris_kode}
          </p>
          <p className="text-sm text-muted-foreground">
            Jumlah: {cancelingData?.jumlah_pinjam}
          </p>
          <p className="text-sm text-muted-foreground">
            Tanggal: {cancelingData?.tanggal_pinjam} s/d{" "}
            {cancelingData?.tanggal_kembali_rencana}
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
          "Ya, Batalkan Peminjaman"
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;

// ============================================================================
// 6. SUMMARY PERUBAHAN
// ============================================================================

/**
 * CHECKLIST IMPLEMENTASI:
 *
 * [ ] 1. Import tambahan (updateBorrowingRequest, cancelBorrowingRequest, Edit, Trash2, AlertDialog)
 * [ ] 2. Tambah state (editDialogOpen, editingId, editingData, editForm, dll)
 * [ ] 3. Tambah handlers (handleEdit, onEditSubmit, handleCancelRequest, confirmCancelRequest)
 * [ ] 4. Tambah kolom Actions di table
 * [ ] 5. Tambah header "Aksi" di TableHeader
 * [ ] 6. Tambah Edit Dialog
 * [ ] 7. Tambah Cancel Confirmation Dialog
 * [ ] 8. Test fitur edit (ubah alat, jumlah, tanggal, keperluan)
 * [ ] 9. Test fitur cancel
 * [ ] 10. Test validasi (hanya pending yang bisa edit/cancel)
 */
