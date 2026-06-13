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
  type BorrowingScheduleOption,
  type BorrowingStatus,
  createBorrowingRequest,
  updateBorrowingRequest,
  cancelBorrowingRequest,
  getAvailableEquipment,
  getBorrowingScheduleOptions,
  returnBorrowingRequest,
} from "@/lib/api/dosen.api";
import { buildNotificationItemLabel } from "@/lib/api/peminjaman-items";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { notifyLaboranPeminjamanBaru } from "@/lib/api/notification.api";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, TableSkeleton } from "@/components/common";

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

interface SelectedBorrowingItem {
  inventaris_id: string;
  jumlah_pinjam: number;
  nama_barang: string;
  kode_barang: string;
  jumlah_tersedia: number;
  laboratorium_nama: string;
}

const borrowingFormSchema = z.object({
  jadwal_praktikum_id: z
    .string()
    .min(1, "Pilih jadwal praktikum terlebih dahulu"),
  tanggal_pinjam: z.string().min(1, "Tanggal pinjam harus diisi"),
  tanggal_kembali_rencana: z.string().min(1, "Tanggal kembali harus diisi"),
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
  return_requested: "warning",
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
  approved: { label: "Masih Dipinjam", variant: "default", icon: CheckCircle },
  disetujui: { label: "Disetujui", variant: "default", icon: CheckCircle },
  in_use: { label: "Sedang Dipinjam", variant: "default", icon: Package },
  dipinjam: { label: "Dipinjam", variant: "default", icon: Package },
  return_requested: {
    label: "Pengembalian Diajukan",
    variant: "secondary",
    icon: RotateCcw,
  },
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
    return_requested: "return_requested",
    dikembalikan: "returned",
    ditolak: "rejected",
  };

  return statusMap[status] || status;
};

const formatScheduleDate = (value: string | null) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const formatBorrowingDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  const startLabel = formatScheduleDate(startDate ?? null);
  const endLabel = formatScheduleDate(endDate ?? null);

  if (!startDate && !endDate) {
    return "-";
  }

  if (!startDate) {
    return `Sampai ${endLabel}`;
  }

  if (!endDate) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
};

const formatDateInputValue = (value: string | null | undefined) => {
  if (!value) return "";
  return value.split("T")[0];
};

const getNextDateValue = (value: string) => {
  const date = new Date(value);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const buildBorrowingPurposeLabel = (
  schedule: BorrowingScheduleOption | null,
) => {
  if (!schedule) {
    return "Peminjaman alat untuk kegiatan praktikum";
  }

  return [
    "Praktikum",
    schedule.mata_kuliah_nama,
    schedule.kelas_nama,
    schedule.laboratorium_nama,
    formatScheduleDate(schedule.tanggal_praktikum),
  ].join(" - ");
};

const buildBorrowingHistoryContext = (borrowing: MyBorrowingRequest) => {
  const contextParts = [
    borrowing.keperluan || null,
    borrowing.laboratorium_nama || null,
  ].filter(Boolean);

  return contextParts.length > 0
    ? contextParts.join(" • ")
    : "Konteks praktikum belum tersedia";
};

const invalidateBorrowingCaches = async () => {
  await Promise.all([
    invalidateCache("dosen_my_borrowings"),
    invalidateCache("dosen_available_equipment"),
    invalidateCache("laboran_pending_approvals"),
    invalidateCache("laboran_active_borrowings"),
    invalidateCache("laboran_return_requested_borrowings"),
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
  const [scheduleOptions, setScheduleOptions] = useState<
    BorrowingScheduleOption[]
  >([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<AvailableEquipment | null>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<BorrowingScheduleOption | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [requestItems, setRequestItems] = useState<SelectedBorrowingItem[]>([]);

  // Return Form State
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningLoading, setReturningLoading] = useState(false);

  // Edit Peminjaman State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEditEquipment, setSelectedEditEquipment] =
    useState<AvailableEquipment | null>(null);
  const [selectedEditSchedule, setSelectedEditSchedule] =
    useState<BorrowingScheduleOption | null>(null);
  const [selectedEditQuantity, setSelectedEditQuantity] = useState(1);
  const [editItems, setEditItems] = useState<SelectedBorrowingItem[]>([]);

  // Cancel Peminjaman State
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelingData, setCancelingData] = useState<MyBorrowingRequest | null>(
    null,
  );
  const [cancelingLoading, setCancelingLoading] = useState(false);

  const form = useForm<BorrowingFormData>({
    resolver: zodResolver(borrowingFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      jadwal_praktikum_id: "",
      tanggal_pinjam: "",
      tanggal_kembali_rencana: "",
    },
  });

  const returnForm = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      peminjaman_id: "",
      kondisi_kembali: "baik",
      keterangan_kembali: "",
    },
  });

  const editForm = useForm<BorrowingFormData>({
    resolver: zodResolver(borrowingFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      jadwal_praktikum_id: "",
      tanggal_pinjam: "",
      tanggal_kembali_rencana: "",
    },
  });

  // Load data on mount
  useEffect(() => {
    loadBorrowings(false);
    loadEquipment(false);
    loadScheduleOptions(navigator.onLine);
  }, []);

  useEffect(() => {
    const refreshBorrowingData = () => {
      void refreshBorrowings(true);
    };

    const refreshScheduleOptions = async () => {
      await invalidateCache("dosen_borrowing_schedule_options");
      await loadScheduleOptions(true);
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

    const handleJadwalChanged = () => {
      void refreshScheduleOptions();
    };

    window.addEventListener("focus", refreshBorrowingData);
    window.addEventListener("peminjaman:changed", refreshBorrowingData);
    window.addEventListener("jadwal:changed", handleJadwalChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", refreshBorrowingData);
      window.removeEventListener("peminjaman:changed", refreshBorrowingData);
      window.removeEventListener("jadwal:changed", handleJadwalChanged);
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

  const loadScheduleOptions = async (forceRefresh = false) => {
    try {
      setLoadingSchedules(true);
      const data = await cacheAPI(
        "dosen_borrowing_schedule_options",
        () => getBorrowingScheduleOptions(),
        {
          ttl: 5 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setScheduleOptions(data);
    } catch (error) {
      toast.error("Gagal memuat jadwal praktikum");
      console.error(error);
    } finally {
      setLoadingSchedules(false);
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
      b.inventaris_kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.item_summary.toLowerCase().includes(searchQuery.toLowerCase());
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
    dipinjam: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "approved",
    ).length,
    pengembalianDiajukan: borrowings.filter(
      (b) => normalizeBorrowingStatus(b.status) === "return_requested",
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
      title: "Masih Dipinjam",
      value: stats.dipinjam,
      helper: "Belum diajukan kembali",
      icon: CheckCircle,
      className:
        "border-emerald-100/80 bg-linear-to-br from-emerald-50 to-green-50 text-success",
    },
    {
      title: "Pengembalian",
      value: stats.pengembalianDiajukan,
      helper: "Menunggu verifikasi laboran",
      icon: RotateCcw,
      className:
        "border-amber-100/80 bg-linear-to-br from-amber-50 to-orange-50 text-amber-700",
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
  };

  const onScheduleChange = (jadwalId: string) => {
    const selected = scheduleOptions.find((item) => item.id === jadwalId);
    setSelectedSchedule(selected || null);
    form.setValue("jadwal_praktikum_id", jadwalId);

    const tanggalPraktikum = formatDateInputValue(selected?.tanggal_praktikum);
    if (!tanggalPraktikum) return;

    form.setValue("tanggal_pinjam", tanggalPraktikum, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const currentReturnDate = form.getValues("tanggal_kembali_rencana");
    if (!currentReturnDate || currentReturnDate <= tanggalPraktikum) {
      form.setValue(
        "tanggal_kembali_rencana",
        getNextDateValue(tanggalPraktikum),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const upsertBorrowingItem = (
    current: SelectedBorrowingItem[],
    item: SelectedBorrowingItem,
  ) => {
    const existingIndex = current.findIndex(
      (entry) => entry.inventaris_id === item.inventaris_id,
    );

    if (existingIndex === -1) {
      return [...current, item];
    }

    return current.map((entry, index) =>
      index === existingIndex
        ? { ...entry, jumlah_pinjam: entry.jumlah_pinjam + item.jumlah_pinjam }
        : entry,
    );
  };

  const handleAddRequestItem = () => {
    if (!selectedEquipment) {
      toast.error("Pilih alat terlebih dahulu");
      return;
    }

    if (selectedQuantity < 1) {
      toast.error("Jumlah pinjam minimal 1");
      return;
    }

    const existingQty =
      requestItems.find((item) => item.inventaris_id === selectedEquipment.id)
        ?.jumlah_pinjam || 0;
    if (existingQty + selectedQuantity > selectedEquipment.jumlah_tersedia) {
      toast.error(
        `Stok tidak cukup. Total maksimal untuk ${selectedEquipment.nama_barang}: ${selectedEquipment.jumlah_tersedia}`,
      );
      return;
    }

    setRequestItems((current) =>
      upsertBorrowingItem(current, {
        inventaris_id: selectedEquipment.id,
        jumlah_pinjam: selectedQuantity,
        nama_barang: selectedEquipment.nama_barang,
        kode_barang: selectedEquipment.kode_barang,
        jumlah_tersedia: selectedEquipment.jumlah_tersedia,
        laboratorium_nama: selectedEquipment.laboratorium?.nama_lab || "-",
      }),
    );
    setSelectedQuantity(1);
  };

  const handleRemoveRequestItem = (inventarisId: string) => {
    setRequestItems((current) =>
      current.filter((item) => item.inventaris_id !== inventarisId),
    );
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

      if (requestItems.length === 0) {
        toast.error("Tambahkan minimal satu alat ke pengajuan");
        return;
      }

      await createBorrowingRequest({
        jadwal_praktikum_id: data.jadwal_praktikum_id,
        items: requestItems.map((item) => ({
          inventaris_id: item.inventaris_id,
          jumlah_pinjam: item.jumlah_pinjam,
        })),
        tanggal_pinjam: data.tanggal_pinjam,
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
      });

      toast.success("Pengajuan peminjaman berhasil dibuat!");

      // Notify all laboran (best-effort, non-blocking)
      const laboranIds = await getLaboranUserIds();
      if (laboranIds.length > 0 && requestItems.length > 0) {
        const purposeLabel = buildBorrowingPurposeLabel(selectedSchedule);
        notifyLaboranPeminjamanBaru(
          laboranIds,
          "Dosen", // Fallback sender name
          buildNotificationItemLabel(
            requestItems.map((item) => ({
              inventaris_id: item.inventaris_id,
              inventaris_nama: item.nama_barang,
              inventaris_kode: item.kode_barang,
              jumlah_pinjam: item.jumlah_pinjam,
            })),
          ),
          requestItems.reduce((sum, item) => sum + item.jumlah_pinjam, 0),
          data.tanggal_pinjam,
          purposeLabel,
        ).catch((err) => {
          // Non-blocking: notification failure shouldn't affect the process
          console.error("Failed to notify laboran:", err);
        });
      }

      setDialogOpen(false);
      form.reset();
      setSelectedEquipment(null);
      setSelectedSchedule(null);
      setSelectedQuantity(1);
      setRequestItems([]);

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

      toast.success("Pengajuan pengembalian berhasil dikirim ke laboran.");
      setReturnDialogOpen(false);
      returnForm.reset();

      await invalidateBorrowingCaches();
      await loadBorrowings(true);
      await loadEquipment(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengajukan pengembalian alat");
    } finally {
      setReturningLoading(false);
    }
  };

  /**
   * Handle Edit - buka dialog edit
   */
  const handleEdit = (borrowing: MyBorrowingRequest) => {
    const schedule =
      scheduleOptions.find(
        (item) => item.id === borrowing.jadwal_praktikum_id,
      ) || null;
    const borrowingItems = borrowing.items.map((item) => {
      const inventory = equipment.find(
        (entry) => entry.id === item.inventaris_id,
      );
      return {
        inventaris_id: item.inventaris_id,
        jumlah_pinjam: item.jumlah_pinjam,
        nama_barang: item.inventaris_nama,
        kode_barang: item.inventaris_kode,
        jumlah_tersedia: inventory?.jumlah_tersedia || item.jumlah_pinjam,
        laboratorium_nama:
          item.laboratorium_nama || inventory?.laboratorium?.nama_lab || "-",
      };
    });

    setEditingId(borrowing.id);
    setSelectedEditEquipment(null);
    setSelectedEditSchedule(schedule);
    setEditItems(borrowingItems);
    setSelectedEditQuantity(1);

    editForm.reset({
      jadwal_praktikum_id: borrowing.jadwal_praktikum_id || "",
      tanggal_pinjam: borrowing.tanggal_pinjam,
      tanggal_kembali_rencana: borrowing.tanggal_kembali_rencana,
    });

    setEditDialogOpen(true);
  };

  /**
   * Handle equipment change untuk edit form
   */
  const onEditEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEditEquipment(selected || null);
  };

  const onEditScheduleChange = (jadwalId: string) => {
    const selected = scheduleOptions.find((item) => item.id === jadwalId);
    setSelectedEditSchedule(selected || null);
    editForm.setValue("jadwal_praktikum_id", jadwalId);

    const tanggalPraktikum = formatDateInputValue(selected?.tanggal_praktikum);
    if (!tanggalPraktikum) return;

    editForm.setValue("tanggal_pinjam", tanggalPraktikum, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const currentReturnDate = editForm.getValues("tanggal_kembali_rencana");
    if (!currentReturnDate || currentReturnDate <= tanggalPraktikum) {
      editForm.setValue(
        "tanggal_kembali_rencana",
        getNextDateValue(tanggalPraktikum),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  const handleAddEditItem = () => {
    if (!selectedEditEquipment) {
      toast.error("Pilih alat terlebih dahulu");
      return;
    }

    const existingQty =
      editItems.find((item) => item.inventaris_id === selectedEditEquipment.id)
        ?.jumlah_pinjam || 0;
    if (
      existingQty + selectedEditQuantity >
      selectedEditEquipment.jumlah_tersedia
    ) {
      toast.error(
        `Stok tidak cukup. Total maksimal untuk ${selectedEditEquipment.nama_barang}: ${selectedEditEquipment.jumlah_tersedia}`,
      );
      return;
    }

    setEditItems((current) =>
      upsertBorrowingItem(current, {
        inventaris_id: selectedEditEquipment.id,
        jumlah_pinjam: selectedEditQuantity,
        nama_barang: selectedEditEquipment.nama_barang,
        kode_barang: selectedEditEquipment.kode_barang,
        jumlah_tersedia: selectedEditEquipment.jumlah_tersedia,
        laboratorium_nama: selectedEditEquipment.laboratorium?.nama_lab || "-",
      }),
    );
    setSelectedEditQuantity(1);
  };

  const handleRemoveEditItem = (inventarisId: string) => {
    setEditItems((current) =>
      current.filter((item) => item.inventaris_id !== inventarisId),
    );
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

      if (editItems.length === 0) {
        toast.error("Tambahkan minimal satu alat ke pengajuan");
        return;
      }

      await updateBorrowingRequest(editingId, {
        jadwal_praktikum_id: data.jadwal_praktikum_id,
        items: editItems.map((item) => ({
          inventaris_id: item.inventaris_id,
          jumlah_pinjam: item.jumlah_pinjam,
        })),
        tanggal_pinjam: data.tanggal_pinjam,
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
      });

      toast.success("Peminjaman berhasil diperbarui!");
      setEditDialogOpen(false);
      setEditingId(null);
      setSelectedEditEquipment(null);
      setSelectedEditSchedule(null);
      setSelectedEditQuantity(1);
      setEditItems([]);
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

  const renderScheduleSummary = (schedule: BorrowingScheduleOption | null) => {
    if (!schedule) return null;

    return (
      <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
        <p className="text-sm font-semibold text-foreground">
          Ringkasan Praktikum
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Mata Kuliah
            </p>
            <p className="text-sm font-medium text-foreground">
              {schedule.mata_kuliah_nama}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Kelas
            </p>
            <p className="text-sm font-medium text-foreground">
              {schedule.kelas_nama}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Tanggal
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatScheduleDate(schedule.tanggal_praktikum)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Jam
            </p>
            <p className="text-sm font-medium text-foreground">
              {schedule.jam_mulai} - {schedule.jam_selesai}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Lab Tujuan
            </p>
            <p className="text-sm font-medium text-foreground">
              {schedule.laboratorium_nama}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Peminjaman Alat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola pengajuan, status, dan pengembalian peralatan laboratorium
            dengan cepat dan rapi.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
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
                <SelectItem value="approved">Masih Dipinjam</SelectItem>
                <SelectItem value="return_requested">
                  Pengembalian Diajukan
                </SelectItem>
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
                <TableSkeleton rows={5} columns={6} />
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
                        <TableHead>Lab Tujuan</TableHead>
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
                        const isApproved = normalizedStatus === "approved";
                        const isReturnRequested =
                          normalizedStatus === "return_requested";
                        const isInUse = b.status === "in_use";

                        return (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono">
                              {b.inventaris_kode}
                            </TableCell>
                            <TableCell className="min-w-80">
                              <div className="font-medium text-foreground">
                                {b.item_summary || b.inventaris_nama}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {b.item_count > 1
                                  ? `${b.item_count} item - total ${b.total_quantity} alat`
                                  : `${b.jumlah_pinjam} alat`}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {formatBorrowingDateRange(
                                  b.tanggal_pinjam,
                                  b.tanggal_kembali_rencana,
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-96">
                              <div className="text-sm text-foreground">
                                {buildBorrowingHistoryContext(b)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {b.total_quantity || b.jumlah_pinjam}
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
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(b)}
                                      className="table-action-btn table-action-btn-edit"
                                      title="Edit"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelRequest(b)}
                                      className="table-action-btn table-action-btn-delete"
                                      title="Batal"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {(isApproved || isInUse) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      returnForm.setValue(
                                        "peminjaman_id",
                                        b.id,
                                      );
                                      setReturnDialogOpen(true);
                                    }}
                                    className="table-action-btn table-action-btn-view"
                                    title="Ajukan Pengembalian"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                                {isReturnRequested && (
                                  <span className="text-xs text-muted-foreground">
                                    Menunggu verifikasi laboran
                                  </span>
                                )}
                                {!isPending &&
                                  !isApproved &&
                                  !isInUse &&
                                  !isReturnRequested && (
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
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[88vh]">
          <DialogHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
            <DialogTitle>Ajukan Peminjaman Alat</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk mengajukan peminjaman alat laboratorium
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Konteks Praktikum
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pilih jadwal approved agar tujuan lab mengikuti jadwal
                      praktikum.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="jadwal_praktikum_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jadwal Praktikum</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={onScheduleChange}
                          disabled={
                            loadingSchedules || scheduleOptions.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jadwal praktikum aktif" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {scheduleOptions.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {loadingSchedules ? (
                          <p className="text-xs text-muted-foreground">
                            Memuat daftar jadwal praktikum...
                          </p>
                        ) : scheduleOptions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Belum ada jadwal praktikum aktif yang bisa dipakai
                            sebagai konteks peminjaman.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Pilih jadwal agar `Lab Tujuan` mengikuti lab pada
                            praktikum tersebut.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderScheduleSummary(selectedSchedule)}
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Daftar Alat
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Satu pengajuan bisa berisi banyak alat untuk satu
                        praktikum.
                      </p>
                    </div>
                    <Badge variant="outline">{requestItems.length} item</Badge>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <Select
                      value={selectedEquipment?.id || ""}
                      onValueChange={onEquipmentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih alat yang ingin dipinjam" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nama_barang} (Stok: {item.jumlah_tersedia})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) =>
                        setSelectedQuantity(Number(e.target.value) || 1)
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddRequestItem}
                      className="w-full lg:w-auto"
                    >
                      Tambah
                    </Button>
                  </div>
                  {selectedEquipment && (
                    <p className="text-xs text-muted-foreground">
                      Stok tersedia: {selectedEquipment.jumlah_tersedia}
                    </p>
                  )}
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {requestItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                        Belum ada alat di pengajuan ini.
                      </div>
                    ) : (
                      requestItems.map((item) => (
                        <div
                          key={item.inventaris_id}
                          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {item.nama_barang}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.kode_barang} • {item.laboratorium_nama}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Badge variant="secondary">
                              {item.jumlah_pinjam}
                            </Badge>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleRemoveRequestItem(item.inventaris_id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tanggal_pinjam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Pinjam</FormLabel>
                        <FormControl>
                          <Input type="date" readOnly disabled {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Tanggal pinjam otomatis mengikuti tanggal praktikum.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tanggal_kembali_rencana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Rencana Kembali</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Pilih tanggal setelah praktikum selesai.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-border/70 px-5 py-4 sm:px-6">
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
                  disabled={
                    submitting ||
                    !navigator.onLine ||
                    loadingSchedules ||
                    scheduleOptions.length === 0 ||
                    !selectedSchedule
                  }
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
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[88vh]">
          <DialogHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
            <DialogTitle>Ajukan Pengembalian Alat</DialogTitle>
            <DialogDescription>
              Isi kondisi awal dan catatan pengembalian. Laboran akan
              memverifikasi pengembalian final sebelum transaksi ditutup.
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
                      Ajukan Pengembalian
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
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[88vh]">
          <DialogHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
            <DialogTitle>Edit Peminjaman Alat</DialogTitle>
            <DialogDescription>
              Ubah detail peminjaman. Hanya bisa diubah jika statusnya masih
              menunggu.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Konteks Praktikum
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Perubahan jadwal akan ikut mengganti lab tujuan pada
                      pengajuan ini.
                    </p>
                  </div>

                  <FormField
                    control={editForm.control}
                    name="jadwal_praktikum_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jadwal Praktikum</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={onEditScheduleChange}
                          disabled={
                            loadingSchedules || scheduleOptions.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jadwal praktikum aktif" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {scheduleOptions.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {loadingSchedules ? (
                          <p className="text-xs text-muted-foreground">
                            Memuat daftar jadwal praktikum...
                          </p>
                        ) : scheduleOptions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Belum ada jadwal praktikum aktif yang tersedia untuk
                            sinkronisasi lab tujuan.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Perubahan jadwal akan ikut mengganti konteks `Lab
                            Tujuan` pada peminjaman ini.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderScheduleSummary(selectedEditSchedule)}
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Daftar Alat
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tambah atau kurangi item alat selama status masih
                        menunggu.
                      </p>
                    </div>
                    <Badge variant="outline">{editItems.length} item</Badge>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <Select
                      value={selectedEditEquipment?.id || ""}
                      onValueChange={onEditEquipmentChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih alat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nama_barang} (Stok: {item.jumlah_tersedia})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={selectedEditQuantity}
                      onChange={(e) =>
                        setSelectedEditQuantity(Number(e.target.value) || 1)
                      }
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddEditItem}
                      className="w-full lg:w-auto"
                    >
                      Tambah
                    </Button>
                  </div>
                  {selectedEditEquipment && (
                    <p className="text-xs text-muted-foreground">
                      Stok tersedia: {selectedEditEquipment.jumlah_tersedia}
                    </p>
                  )}
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {editItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                        Belum ada alat di pengajuan ini.
                      </div>
                    ) : (
                      editItems.map((item) => (
                        <div
                          key={item.inventaris_id}
                          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {item.nama_barang}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.kode_barang} • {item.laboratorium_nama}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Badge variant="secondary">
                              {item.jumlah_pinjam}
                            </Badge>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleRemoveEditItem(item.inventaris_id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="tanggal_pinjam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Pinjam</FormLabel>
                        <FormControl>
                          <Input type="date" readOnly disabled {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Tanggal pinjam otomatis mengikuti tanggal praktikum.
                        </p>
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
                        <p className="text-xs text-muted-foreground">
                          Pilih tanggal setelah praktikum selesai.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-border/70 px-5 py-4 sm:px-6">
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
                  disabled={
                    submitting ||
                    !navigator.onLine ||
                    loadingSchedules ||
                    scheduleOptions.length === 0 ||
                    !selectedEditSchedule
                  }
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
                    Ringkasan: {cancelingData?.item_summary}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Jumlah: {cancelingData?.jumlah_pinjam}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tanggal:{" "}
                    {formatBorrowingDateRange(
                      cancelingData?.tanggal_pinjam,
                      cancelingData?.tanggal_kembali_rencana,
                    )}
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
  );
}
