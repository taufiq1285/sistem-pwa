import { useState, useEffect } from "react";
import type { ElementType } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
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
} from "@/lib/api/dosen.api";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { notifyLaboranPeminjamanBaru } from "@/lib/api/notification.api";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";

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

const BORROWING_STATUS_MAP: Record<
  string,
  "warning" | "success" | "info" | "error" | "offline"
> = {
  pending: "warning",
  menunggu: "warning",
  approved: "success",
  disetujui: "success",
  in_use: "success",
  dipinjam: "success",
  returned: "info",
  dikembalikan: "info",
  rejected: "error",
  ditolak: "error",
  overdue: "error",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "secondary" | "default" | "destructive" | "outline";
    icon: ElementType;
  }
> = {
  pending: { label: "Menunggu", variant: "secondary", icon: Clock },
  menunggu: { label: "Menunggu", variant: "secondary", icon: Clock },
  approved: { label: "Disetujui", variant: "default", icon: CheckCircle },
  disetujui: { label: "Disetujui", variant: "default", icon: CheckCircle },
  in_use: { label: "Sedang Dipinjam", variant: "default", icon: Package },
  dipinjam: { label: "Dipinjam", variant: "default", icon: Package },
  returned: { label: "Dikembalikan", variant: "outline", icon: RotateCcw },
  dikembalikan: { label: "Dikembalikan", variant: "outline", icon: RotateCcw },
  rejected: { label: "Ditolak", variant: "destructive", icon: XCircle },
  ditolak: { label: "Ditolak", variant: "destructive", icon: XCircle },
  overdue: { label: "Terlambat", variant: "destructive", icon: Clock },
};

const normalizeBorrowingStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    menunggu: "pending",
    disetujui: "approved",
    dipinjam: "approved",
    in_use: "approved",
    dikembalikan: "returned",
    ditolak: "rejected",
  };

  return statusMap[status] || status;
};

const invalidateBorrowingCaches = async () => {
  await Promise.all([
    invalidateCache("dosen_my_borrowings"),
    invalidateCache("dosen_available_equipment"),
    invalidateCache("laboran_pending_approvals"),
    invalidateCache("laboran_active_borrowings"),
    invalidateCache("laboran_returned_borrowings"),
  ]);
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

    return data?.map((u: { id: string }) => u.id) || [];
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

  useEffect(() => {
    const refreshBorrowingData = () => {
      void refreshBorrowings(true);
    };

    const subscription = supabase
      .channel("dosen-peminjaman-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peminjaman",
        },
        refreshBorrowingData,
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshBorrowingData();
      }
    };

    window.addEventListener("focus", refreshBorrowingData);
    window.addEventListener("peminjaman:changed", refreshBorrowingData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", refreshBorrowingData);
      window.removeEventListener("peminjaman:changed", refreshBorrowingData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  const refreshBorrowings = async (includeEquipment = false) => {
    await Promise.all([
      invalidateCache("dosen_my_borrowings"),
      includeEquipment
        ? invalidateCache("dosen_available_equipment")
        : Promise.resolve(),
    ]);

    await Promise.all([
      loadBorrowings(true),
      includeEquipment ? loadEquipment(true) : Promise.resolve(),
    ]);
  };

  // Filtered data
  const filteredBorrowings = borrowings.filter((b) => {
    const match =
      b.inventaris_nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.inventaris_kode.toLowerCase().includes(searchQuery.toLowerCase());
    const status =
      statusFilter === "all" ||
      normalizeBorrowingStatus(b.status) === statusFilter;
    return match && status;
  });

  // Stats
  const stats = {
    total: borrowings.length,
    menunggu: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "pending",
    ).length,
    disetujui: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "approved",
    ).length,
    dikembalikan: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "returned",
    ).length,
    ditolak: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "rejected",
    ).length,
  };

  const statCards = [
    {
      title: "Total",
      value: stats.total,
      helper: "Semua riwayat pengajuan",
      icon: Package,
      className:
        "border-primary/10 bg-linear-to-br from-primary/5 to-accent/10 text-primary",
    },
    {
      title: "Menunggu",
      value: stats.menunggu,
      helper: "Belum diproses laboran",
      icon: Clock,
      className:
        "border-warning/20 bg-linear-to-br from-warning/5 to-warning/10 text-warning",
    },
    {
      title: "Disetujui",
      value: stats.disetujui,
      helper: "Siap diambil/dikembalikan",
      icon: CheckCircle,
      className:
        "border-emerald-100/80 bg-linear-to-br from-emerald-50 to-green-50 text-success",
    },
    {
      title: "Dikembalikan",
      value: stats.dikembalikan,
      helper: "Selesai diproses",
      icon: RotateCcw,
      className:
        "border-sky-100/80 bg-linear-to-br from-sky-50 to-blue-50 text-sky-700",
    },
    {
      title: "Ditolak",
      value: stats.ditolak,
      helper: "Tidak disetujui",
      icon: XCircle,
      className:
        "border-rose-100/80 bg-linear-to-br from-rose-50 to-red-50 text-rose-700",
    },
  ];

  const onEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEquipment(selected || null);
    form.setValue("inventaris_id", equipmentId);
  };

  const onSubmit = async (data: BorrowingFormData) => {
    if (!navigator.onLine) {
      toast.error(
        "Pengajuan peminjaman belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

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

      await invalidateBorrowingCaches();
      await loadBorrowings(true);
      await loadEquipment(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat pengajuan peminjaman");
    } finally {
      setSubmitting(false);
    }
  };

  const onReturnSubmit = async (data: ReturnFormData) => {
    if (!navigator.onLine) {
      toast.error(
        "Pengembalian alat belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

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

      await invalidateBorrowingCaches();
      await loadBorrowings(true);
      await loadEquipment(true);
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

    if (!navigator.onLine) {
      toast.error(
        "Perubahan peminjaman belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

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

      await invalidateBorrowingCaches();
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

    if (!navigator.onLine) {
      toast.error(
        "Pembatalan peminjaman belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    try {
      setCancelingLoading(true);
      await cancelBorrowingRequest(cancelingId);

      toast.success("Peminjaman berhasil dibatalkan");
      setCancelDialogOpen(false);
      setCancelingId(null);
      setCancelingData(null);

      await invalidateBorrowingCaches();
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
    <div className="role-page-shell">
      <div className="role-page-content app-container space-y-6 py-4 sm:space-y-8 sm:py-6 lg:py-8">
        <PageHeader
          title="Peminjaman Alat"
          description="Kelola pengajuan, status, dan pengembalian peralatan laboratorium dengan cepat dan rapi."
          className="section-shell"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className={`interactive-card overflow-hidden rounded-3xl border shadow-lg shadow-slate-200/50 ${item.className}`}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {item.title}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.helper}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-2 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="request" className="w-full space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 rounded-3xl border border-slate-200/70 bg-white/85 p-1.5 shadow-sm backdrop-blur">
            <TabsTrigger
              value="request"
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Ajukan Peminjaman
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Buat permintaan alat baru
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Package className="h-3.5 w-3.5" />
                Riwayat Peminjaman
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Pantau {stats.total} pengajuan
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Ajukan Peminjaman */}
          <TabsContent value="request" className="space-y-4">
            <Card className="interactive-card overflow-hidden rounded-3xl border-2 border-dashed border-primary/20 bg-linear-to-br from-primary/5 via-white to-warning/5 shadow-lg shadow-primary/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Buat Pengajuan Baru
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Mulai dari sini untuk membuat permintaan peminjaman alat.
                  Setelah laboran menyetujui, statusnya bisa dipantau di tab
                  riwayat.
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

          {/* Tab 2: Riwayat Peminjaman */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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
                <SelectTrigger className="w-full sm:w-47.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="returned">Dikembalikan</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="interactive-card overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60">
              <CardHeader className="space-y-1">
                <CardTitle>Daftar Peminjaman</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Status akan ikut berubah setelah laboran/admin memproses
                  permintaan.
                </p>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="rounded-2xl border border-dashed border-warning/30 bg-warning/5 py-10 text-center">
                    <p className="text-sm font-medium text-warning">
                      Memuat data peminjaman...
                    </p>
                  </div>
                ) : filteredBorrowings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" />
                    <p className="text-sm font-medium text-foreground">
                      Belum ada data peminjaman
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ajukan peminjaman alat melalui tab di sebelahnya.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
                    <Table className="min-w-210">
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
                          const normalizedStatus = normalizeBorrowingStatus(
                            b.status,
                          );
                          const isPending = normalizedStatus === "pending";
                          const isApproved =
                            normalizedStatus === "approved";
                          const isInUse = b.status === "in_use";

                          return (
                            <TableRow key={b.id}>
                              <TableCell className="font-mono">
                                {b.inventaris_kode}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  {b.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {b.tanggal_pinjam} -{" "}
                                  {b.tanggal_kembali_rencana}
                                </div>
                              </TableCell>
                              <TableCell>
                                {b.laboratorium_nama || (
                                  <span className="text-muted-foreground">
                                    Belum ditentukan
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {b.jumlah_pinjam}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={
                                    BORROWING_STATUS_MAP[b.status as string] ||
                                    "warning"
                                  }
                                  pulse={false}
                                >
                                  <Icon className="h-3 w-3 mr-1" />
                                  {cfg.label}
                                </StatusBadge>
                              </TableCell>
                              <TableCell className="min-w-52">
                                <div className="flex flex-wrap items-center gap-2">
                                {isPending && (
                                  <>
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
                                  </>
                                )}
                                {(isApproved || isInUse) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      returnForm.setValue(
                                        "peminjaman_id",
                                        b.id,
                                      );
                                      setReturnDialogOpen(true);
                                    }}
                                    className="h-8 gap-1"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    Kembalikan
                                  </Button>
                                )}
                                {!isPending && !isApproved && !isInUse && (
                                  <span className="text-xs text-muted-foreground">
                                    Tidak ada aksi
                                  </span>
                                )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Request Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] max-w-125 sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Ajukan Peminjaman Alat</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk mengajukan peminjaman alat laboratorium
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                  <Button
                    type="submit"
                    disabled={submitting || !navigator.onLine}
                    className="gap-2"
                  >
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
          <DialogContent className="w-[95vw] max-w-125 sm:max-w-125">
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                    disabled={returningLoading || !navigator.onLine}
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-125 sm:max-w-125">
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
                  <Button
                    type="submit"
                    disabled={submitting || !navigator.onLine}
                    className="gap-2"
                  >
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
                disabled={cancelingLoading || !navigator.onLine}
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
    </div>
  );
}
