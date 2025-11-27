import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, RotateCcw, Search, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getMyBorrowing, type MyBorrowingRequest, type BorrowingStatus, createBorrowingRequest, getAvailableEquipment, returnBorrowingRequest, markBorrowingAsTaken } from '@/lib/api/dosen.api';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

interface AvailableEquipment {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah_tersedia: number;
  kondisi: string;
  laboratorium?: {
    id: string;
    nama_lab: string;
    kode_lab: string;
  };
}

const borrowingFormSchema = z.object({
  inventaris_id: z.string().min(1, 'Pilih alat terlebih dahulu'),
  jumlah_pinjam: z.number().min(1, 'Jumlah minimal 1').int('Jumlah harus angka bulat'),
  tanggal_pinjam: z.string().min(1, 'Tanggal pinjam harus diisi'),
  tanggal_kembali_rencana: z.string().min(1, 'Tanggal kembali harus diisi'),
  keperluan: z.string().min(10, 'Keperluan minimal 10 karakter').max(500, 'Keperluan maksimal 500 karakter'),
});

type BorrowingFormData = z.infer<typeof borrowingFormSchema>;

const returnFormSchema = z.object({
  peminjaman_id: z.string().min(1, 'Pilih peminjaman yang akan dikembalikan'),
  kondisi_kembali: z.enum(['baik', 'rusak_ringan', 'rusak_berat', 'maintenance']),
  keterangan_kembali: z.string().max(500, 'Keterangan maksimal 500 karakter').optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'Menunggu', variant: 'secondary', icon: Clock },
  menunggu: { label: 'Menunggu', variant: 'secondary', icon: Clock },
  approved: { label: 'Disetujui', variant: 'default', icon: CheckCircle },
  disetujui: { label: 'Disetujui', variant: 'default', icon: CheckCircle },
  in_use: { label: 'Sedang Dipinjam', variant: 'default', icon: Download },
  dipinjam: { label: 'Dipinjam', variant: 'default', icon: Package },
  returned: { label: 'Dikembalikan', variant: 'outline', icon: RotateCcw },
  dikembalikan: { label: 'Dikembalikan', variant: 'outline', icon: RotateCcw },
  rejected: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
  ditolak: { label: 'Ditolak', variant: 'destructive', icon: XCircle },
  overdue: { label: 'Terlambat', variant: 'destructive', icon: Clock },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PeminjamanPage() {
  // Riwayat Peminjaman State
  const [borrowings, setBorrowings] = useState<MyBorrowingRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Ajukan Peminjaman State
  const [equipment, setEquipment] = useState<AvailableEquipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<AvailableEquipment | null>(null);

  // Return Form State
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningLoading, setReturningLoading] = useState(false);

  // Mark as Taken State
  const [takenDialogOpen, setTakenDialogOpen] = useState(false);
  const [takenLoading, setTakenLoading] = useState(false);
  const [selectedTakenId, setSelectedTakenId] = useState<string | null>(null);

  const form = useForm<BorrowingFormData>({
    resolver: zodResolver(borrowingFormSchema),
    defaultValues: {
      inventaris_id: '',
      jumlah_pinjam: 1,
      tanggal_pinjam: new Date().toISOString().split('T')[0],
      tanggal_kembali_rencana: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      keperluan: '',
    },
  });

  const returnForm = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      peminjaman_id: '',
      kondisi_kembali: 'baik',
      keterangan_kembali: '',
    },
  });

  // Load data on mount
  useEffect(() => {
    loadBorrowings();
    loadEquipment();
  }, []);

  const loadBorrowings = async () => {
    try {
      setLoadingHistory(true);
      const data = await getMyBorrowing();
      setBorrowings(data);
    } catch (error) {
      toast.error('Gagal memuat data peminjaman');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadEquipment = async () => {
    try {
      setLoadingEquipment(true);
      const data = await getAvailableEquipment();
      setEquipment(data as AvailableEquipment[]);
    } catch (error) {
      toast.error('Gagal memuat daftar alat');
      console.error(error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  // Filtered data
  const filteredBorrowings = borrowings.filter((b) => {
    const match =
      b.inventaris_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.inventaris_kode.toLowerCase().includes(searchQuery.toLowerCase());
    const status = statusFilter === 'all' || b.status === statusFilter;
    return match && status;
  });

  const filteredEquipment = equipment.filter((item) =>
    item.nama_barang.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    item.kode_barang.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  // Stats
  const stats = {
    total: borrowings.length,
    menunggu: borrowings.filter((b) => b.status === 'menunggu').length,
    disetujui: borrowings.filter((b) => b.status === 'disetujui' || b.status === 'dipinjam').length,
    dikembalikan: borrowings.filter((b) => b.status === 'dikembalikan').length,
    ditolak: borrowings.filter((b) => b.status === 'ditolak').length,
  };

  const onEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEquipment(selected || null);
    form.setValue('inventaris_id', equipmentId);
  };

  const onSubmit = async (data: BorrowingFormData) => {
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
      if (selectedEquipment && data.jumlah_pinjam > selectedEquipment.jumlah_tersedia) {
        toast.error(`Stok tidak cukup. Tersedia: ${selectedEquipment.jumlah_tersedia}`);
        return;
      }

      // Submit request
      await createBorrowingRequest({
        inventaris_id: data.inventaris_id,
        jumlah_pinjam: data.jumlah_pinjam,
        tanggal_pinjam: data.tanggal_pinjam,
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
        keperluan: data.keperluan,
      });

      toast.success('Pengajuan peminjaman berhasil dibuat!');
      setDialogOpen(false);
      form.reset();
      setSelectedEquipment(null);

      // Reload both data
      await loadBorrowings();
      await loadEquipment();
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat pengajuan peminjaman');
    } finally {
      setSubmitting(false);
    }
  };

    const handleMarkAsTaken = async (borrowingId: string) => {
    try {
      setTakenLoading(true);
      setSelectedTakenId(borrowingId);
      await markBorrowingAsTaken(borrowingId);
      toast.success('Alat sudah diambil dan status berubah menjadi sedang dipinjam');
      setTakenDialogOpen(false);
      await loadBorrowings();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menandai alat sebagai diambil');
    } finally {
      setTakenLoading(false);
      setSelectedTakenId(null);
    }
  };

  const onReturnSubmit = async (data: ReturnFormData) => {
    try {
      setReturningLoading(true);
      await returnBorrowingRequest({
        peminjaman_id: data.peminjaman_id,
        kondisi_kembali: data.kondisi_kembali,
        keterangan_kembali: data.keterangan_kembali,
      });

      toast.success('Alat berhasil dikembalikan dan stok otomatis bertambah!');
      setReturnDialogOpen(false);
      returnForm.reset();

      // Reload data
      await loadBorrowings();
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengembalikan alat');
    } finally {
      setReturningLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Peminjaman Alat</h1>
        <p className="text-muted-foreground">Kelola peminjaman peralatan laboratorium</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.menunggu}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disetujui}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dikembalikan</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dikembalikan}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ditolak}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Riwayat Peminjaman</TabsTrigger>
          <TabsTrigger value="request">Ajukan Peminjaman</TabsTrigger>
        </TabsList>

        {/* Tab 1: Riwayat Peminjaman */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari alat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="disetujui">Disetujui</SelectItem>
                <SelectItem value="dipinjam">Dipinjam</SelectItem>
                <SelectItem value="dikembalikan">Dikembalikan</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : filteredBorrowings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Tidak ada data</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBorrowings.map((b) => {
                      const cfg = STATUS_CONFIG[b.status as BorrowingStatus] || STATUS_CONFIG.menunggu;
                      const Icon = cfg.icon;
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Ajukan Peminjaman */}
        <TabsContent value="request" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Alat Tersedia</h3>
              <p className="text-sm text-muted-foreground">
                {equipment.length} alat dapat dipinjam
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajukan Peminjaman
            </Button>
          </div>

          {/* Equipment Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari alat berdasarkan nama atau kode..."
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Equipment List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Alat Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEquipment ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Memuat daftar alat...</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {equipmentSearch ? 'Alat tidak ditemukan' : 'Tidak ada alat tersedia'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEquipment(item);
                        form.setValue('inventaris_id', item.id);
                        setDialogOpen(true);
                      }}
                    >
                      <div className="font-medium text-sm">{item.nama_barang}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Kode: {item.kode_barang}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lab: {item.laboratorium?.nama_lab || 'N/A'}
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <div className="text-xs">
                          <span className="text-green-600 font-semibold">
                            {item.jumlah_tersedia}
                          </span>
                          <span className="text-muted-foreground"> tersedia</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.kondisi}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajukan Peminjaman Alat</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk mengajukan peminjaman alat laboratorium
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Equipment Selection */}
              <FormField
                control={form.control}
                name="inventaris_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Alat</FormLabel>
                    <Select value={field.value} onValueChange={onEquipmentChange}>
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
                control={form.control}
                name="jumlah_pinjam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={selectedEquipment?.jumlah_tersedia || 1}
                        placeholder="1"
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Ajukan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Kembalikan Alat</DialogTitle>
            <DialogDescription>
              Berikan informasi tentang kondisi alat saat dikembalikan
            </DialogDescription>
          </DialogHeader>

          <Form {...returnForm}>
            <form onSubmit={returnForm.handleSubmit(onReturnSubmit)} className="space-y-4">
              {/* Kondisi Kembali */}
              <FormField
                control={returnForm.control}
                name="kondisi_kembali"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi Alat</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baik">Baik - Tidak ada kerusakan</SelectItem>
                        <SelectItem value="rusak_ringan">Rusak Ringan - Masih bisa dipakai</SelectItem>
                        <SelectItem value="rusak_berat">Rusak Berat - Tidak bisa dipakai</SelectItem>
                        <SelectItem value="hilang">Hilang - Alat tidak ditemukan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keterangan */}
              <FormField
                control={returnForm.control}
                name="keterangan_kembali"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan kondisi atau masalah yang terjadi..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {(field.value || '').length}/500 karakter
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
                  onClick={() => setReturnDialogOpen(false)}
                  disabled={returningLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={returningLoading} className="gap-2">
                  {returningLoading ? (
                    <>
                      <span className="animate-spin">⌛</span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Kembalikan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      {/* Mark as Taken Dialog */}
      <Dialog open={takenDialogOpen} onOpenChange={setTakenDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengambilan Alat</DialogTitle>
            <DialogDescription>
              Anda akan menandai alat ini sebagai sedang dipinjam (in_use)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Dengan mengklik "Ambil", status peminjaman akan berubah dari "Disetujui" menjadi "Sedang Dipinjam".
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTakenDialogOpen(false)}
              disabled={takenLoading}
            >
              Batal
            </Button>
            <Button
              onClick={() => handleMarkAsTaken(selectedTakenId || '')}
              disabled={takenLoading}
              className="gap-2"
            >
              {takenLoading ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Memproses...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Ambil Alat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
