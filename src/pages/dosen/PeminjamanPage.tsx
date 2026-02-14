import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  getMyBorrowing,
  type MyBorrowingRequest,
  type BorrowingStatus,
  createBorrowingRequest,
  updateBorrowingRequest,
  cancelBorrowingRequest,
  getAvailableEquipment,
  returnBorrowingRequest,
  markBorrowingAsTaken,
} from "@/lib/api/dosen.api";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { notifyLaboranPeminjamanBaru } from "@/lib/api/notification.api";
import { supabase } from "@/lib/supabase/client";

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
  inventaris_id: z.string().min(1, "Pilih alat terlebih dahulu"),
  jumlah_pinjam: z
    .number()
    .min(1, "Jumlah minimal 1")
    .int("Jumlah harus angka bulat"),
  tanggal_pinjam: z.string().min(1, "Tanggal pinjam harus diisi"),
  tanggal_kembali_rencana: z.string().min(1, "Tanggal kembali harus diisi"),
  keperluan: z
    .string()
    .min(10, "Keperluan minimal 10 karakter")
    .max(500, "Keperluan maksimal 500 karakter"),
});

type BorrowingFormData = z.infer<typeof borrowingFormSchema>;

const returnFormSchema = z.object({
  peminjaman_id: z.string().min(1, "Pilih peminjaman yang akan dikembalikan"),
  kondisi_kembali: z.enum([
    "baik",
    "rusak_ringan",
    "rusak_berat",
    "maintenance",
    "hilang",
  ]),
  keterangan_kembali: z
    .string()
    .max(500, "Keterangan maksimal 500 karakter")
    .optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "secondary" | "default" | "destructive" | "outline";
    icon: any;
  }
> = {
  pending: { label: "Menunggu", variant: "secondary", icon: Clock },
  menunggu: { label: "Menunggu", variant: "secondary", icon: Clock },
  approved: { label: "Disetujui", variant: "default", icon: CheckCircle },
  disetujui: { label: "Disetujui", variant: "default", icon: CheckCircle },
  in_use: { label: "Sedang Dipinjam", variant: "default", icon: Download },
  dipinjam: { label: "Dipinjam", variant: "default", icon: Package },
  returned: { label: "Dikembalikan", variant: "outline", icon: RotateCcw },
  dikembalikan: { label: "Dikembalikan", variant: "outline", icon: RotateCcw },
  rejected: { label: "Ditolak", variant: "destructive", icon: XCircle },
  ditolak: { label: "Ditolak", variant: "destructive", icon: XCircle },
  overdue: { label: "Terlambat", variant: "destructive", icon: Clock },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch all laboran user IDs for notifications
 * Returns empty array on error (best-effort)
 */
async function getLaboranUserIds(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("role", "laboran");

    return data?.map((u: any) => u.id) || [];
  } catch (error) {
    console.error("Failed to fetch laboran IDs:", error);
    return []; // Return empty array instead of throwing
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PeminjamanPage() {
  // Riwayat Peminjaman State
  const [borrowings, setBorrowings] = useState<MyBorrowingRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Ajukan Peminjaman State
  const [equipment, setEquipment] = useState<AvailableEquipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<AvailableEquipment | null>(null);

  // Return Form State
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningLoading, setReturningLoading] = useState(false);

  // Mark as Taken State
  const [takenDialogOpen, setTakenDialogOpen] = useState(false);
  const [takenLoading, setTakenLoading] = useState(false);
  const [selectedTakenId, setSelectedTakenId] = useState<string | null>(null);

  // Edit Peminjaman State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEditEquipment, setSelectedEditEquipment] =
    useState<AvailableEquipment | null>(null);

  // Cancel Peminjaman State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelingData, setCancelingData] = useState<MyBorrowingRequest | null>(
    null,
  );
  const [cancelingLoading, setCancelingLoading] = useState(false);

  const form = useForm<BorrowingFormData>({
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

  const returnForm = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      peminjaman_id: "",
      kondisi_kembali: "baik",
      keterangan_kembali: "",
    },
  });

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

  // Load data on mount
  useEffect(() => {
    loadBorrowings(false);
    loadEquipment(false);
  }, []);

  const loadBorrowings = async (forceRefresh = false) => {
    try {
      setLoadingHistory(true);
      const data = await cacheAPI(
        "dosen_my_borrowings",
        () => getMyBorrowing(),
        {
          ttl: 3 * 60 * 1000, // 3 minutes - borrowing status changes frequently
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat data peminjaman");
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadEquipment = async (forceRefresh = false) => {
    try {
      setLoadingEquipment(true);
      const data = await cacheAPI(
        "dosen_available_equipment",
        () => getAvailableEquipment(),
        {
          ttl: 5 * 60 * 1000, // 5 minutes - equipment availability changes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setEquipment(data as AvailableEquipment[]);
    } catch (error) {
      toast.error("Gagal memuat daftar alat");
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
    const status = statusFilter === "all" || b.status === statusFilter;
    return match && status;
  });

  // Stats
  const stats = {
    total: borrowings.length,
    menunggu: borrowings.filter((b) => b.status === "menunggu").length,
    disetujui: borrowings.filter(
      (b) => b.status === "disetujui" || b.status === "dipinjam",
    ).length,
    dikembalikan: borrowings.filter((b) => b.status === "dikembalikan").length,
    ditolak: borrowings.filter((b) => b.status === "ditolak").length,
  };

  const onEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEquipment(selected || null);
    form.setValue("inventaris_id", equipmentId);
  };

  const onSubmit = async (data: BorrowingFormData) => {
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
          `Stok tidak cukup. Tersedia: ${selectedEquipment.jumlah_tersedia}`,
        );
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

      toast.success("Pengajuan peminjaman berhasil dibuat!");

      // Notify all laboran (best-effort, non-blocking)
      const laboranIds = await getLaboranUserIds();
      if (laboranIds.length > 0 && selectedEquipment) {
        notifyLaboranPeminjamanBaru(
          laboranIds,
          "Dosen", // Fallback sender name
          selectedEquipment.nama_barang,
          data.jumlah_pinjam,
          data.tanggal_pinjam,
          data.keperluan,
        ).catch((err) => {
          // Non-blocking: notification failure shouldn't affect the process
          console.error("Failed to notify laboran:", err);
        });
      }

      setDialogOpen(false);
      form.reset();
      setSelectedEquipment(null);

      // Invalidate cache and reload both data
      await invalidateCache("dosen_my_borrowings");
      await invalidateCache("dosen_available_equipment");
      await loadBorrowings(true);
      await loadEquipment(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat pengajuan peminjaman");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsTaken = async (borrowingId: string) => {
    try {
      setTakenLoading(true);
      setSelectedTakenId(borrowingId);
      await markBorrowingAsTaken(borrowingId);
      toast.success(
        "Alat sudah diambil dan status berubah menjadi sedang dipinjam",
      );
      setTakenDialogOpen(false);
      // Invalidate cache and reload
      await invalidateCache("dosen_my_borrowings");
      await loadBorrowings(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menandai alat sebagai diambil");
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

      toast.success("Alat berhasil dikembalikan dan stok otomatis bertambah!");
      setReturnDialogOpen(false);
      returnForm.reset();

      // Invalidate cache and reload data
      await invalidateCache("dosen_my_borrowings");
      await invalidateCache("dosen_available_equipment");
      await loadBorrowings(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengembalikan alat");
    } finally {
      setReturningLoading(false);
    }
  };

  /**
   * Handle Edit - buka dialog edit
   */
  const handleEdit = (borrowing: MyBorrowingRequest) => {
    const selectedEquip = equipment.find(
      (e) => e.nama_barang === borrowing.inventaris_nama,
    );

    setEditingId(borrowing.id);
    setSelectedEditEquipment(selectedEquip || null);

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
   * Handle equipment change untuk edit form
   */
  const onEditEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEditEquipment(selected || null);
    editForm.setValue("inventaris_id", equipmentId);
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
        selectedEditEquipment &&
        data.jumlah_pinjam > selectedEditEquipment.jumlah_tersedia
      ) {
        toast.error(
          `Stok tidak cukup. Tersedia: ${selectedEditEquipment.jumlah_tersedia}`,
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
      setSelectedEditEquipment(null);
      editForm.reset();

      // Invalidate cache and reload data
      await invalidateCache("dosen_my_borrowings");
      await invalidateCache("dosen_available_equipment");
      await loadBorrowings(true);
      await loadEquipment(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memperbarui peminjaman");
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

      toast.success("Peminjaman berhasil dibatalkan");
      setCancelDialogOpen(false);
      setCancelingId(null);
      setCancelingData(null);

      // Invalidate cache and reload data
      await invalidateCache("dosen_my_borrowings");
      await invalidateCache("dosen_available_equipment");
      await loadBorrowings(true);
      await loadEquipment(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal membatalkan peminjaman");
    } finally {
      setCancelingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold">Peminjaman Alat</h1>
        <p className="text-lg font-semibold">
          Kelola peminjaman peralatan laboratorium
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Total</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-blue-900">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.menunggu}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.disetujui}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Dikembalikan</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.dikembalikan}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.ditolak}</div>
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
                  <p className="text-orange-600">Memuat data...</p>
                </div>
              ) : filteredBorrowings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-orange-600">Tidak ada data</p>
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
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBorrowings.map((b) => {
                      const cfg =
                        STATUS_CONFIG[b.status as BorrowingStatus] ||
                        STATUS_CONFIG.menunggu;
                      const Icon = cfg.icon;
                      const isPending =
                        b.status === "menunggu" || b.status === "pending";
                      const isApproved =
                        b.status === "disetujui" || b.status === "approved";
                      const isInUse =
                        b.status === "dipinjam" || b.status === "in_use";

                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono">
                            {b.inventaris_kode}
                          </TableCell>
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
                            {isApproved && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setSelectedTakenId(b.id);
                                  setTakenDialogOpen(true);
                                }}
                                className="h-8 gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Ambil Alat
                              </Button>
                            )}
                            {isInUse && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  returnForm.setValue("peminjaman_id", b.id);
                                  setReturnDialogOpen(true);
                                }}
                                className="h-8 gap-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Kembalikan
                              </Button>
                            )}
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
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Ajukan Peminjaman Alat
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Klik tombol di bawah untuk mengajukan peminjaman alat
                laboratorium. Pilih alat dan isi detail peminjaman pada form
                yang muncul.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Buat Pengajuan Peminjaman
              </Button>
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
                    <Select
                      value={field.value}
                      onValueChange={onEquipmentChange}
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
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
                      {(field.value || "").length}/500 karakter
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
            <form
              onSubmit={returnForm.handleSubmit(onReturnSubmit)}
              className="space-y-4"
            >
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
                        <SelectItem value="baik">
                          Baik - Tidak ada kerusakan
                        </SelectItem>
                        <SelectItem value="rusak_ringan">
                          Rusak Ringan - Masih bisa dipakai
                        </SelectItem>
                        <SelectItem value="rusak_berat">
                          Rusak Berat - Tidak bisa dipakai
                        </SelectItem>
                        <SelectItem value="hilang">
                          Hilang - Alat tidak ditemukan
                        </SelectItem>
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
                      {(field.value || "").length}/500 karakter
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
                <Button
                  type="submit"
                  disabled={returningLoading}
                  className="gap-2"
                >
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
                Dengan mengklik "Ambil", status peminjaman akan berubah dari
                "Disetujui" menjadi "Sedang Dipinjam".
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
              onClick={() => handleMarkAsTaken(selectedTakenId || "")}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Peminjaman Alat</DialogTitle>
            <DialogDescription>
              Ubah detail peminjaman. Hanya bisa diubah jika statusnya masih
              menunggu.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="inventaris_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilih Alat</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={onEditEquipmentChange}
                    >
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
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
                      {(field.value || "").length}/500 karakter
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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Peminjaman?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Anda akan membatalkan peminjaman alat berikut:</p>
                <div className="mt-3 p-3 bg-muted rounded-lg space-y-1">
                  <p className="font-semibold">
                    {cancelingData?.inventaris_nama}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
              </div>
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
      </AlertDialog>
    </div>
  );
}
