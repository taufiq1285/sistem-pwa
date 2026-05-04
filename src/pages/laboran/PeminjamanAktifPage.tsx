/**
 * Peminjaman Aktif Page for Laboran
 *
 * Manage active borrowings and returns
 * Features:
 * - View active borrowings (approved but not returned)
 * - Mark borrowings as returned
 * - Track overdue borrowings
 * - View return history
 * - Input return condition and fines
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  History,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPendingApprovals,
  approvePeminjaman,
  rejectPeminjaman,
  getActiveBorrowings,
  getReturnRequestedBorrowings,
  getReturnedBorrowings,
  markBorrowingReturned,
  type PendingApproval,
  type ActiveBorrowing,
  type ReturnRequestedBorrowing,
  type ReturnedBorrowing,
} from "@/lib/api/laboran.api";
import { getRBACErrorMessage } from "@/lib/errors/permission.errors";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { supabase } from "@/lib/supabase/client";

const invalidatePeminjamanCaches = async () => {
  await Promise.all([
    invalidateCache("laboran_pending_approvals"),
    invalidateCache("laboran_active_borrowings"),
    invalidateCache("laboran_return_requested_borrowings"),
    invalidateCache("laboran_returned_borrowings"),
    invalidateCache("dosen_my_borrowings"),
    invalidateCache("dosen_available_equipment"),
  ]);
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PeminjamanAktifPage() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin/");
  const activeTabRef = useRef("active");
  const returnedBorrowingsCountRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    [],
  );
  const [activeBorrowings, setActiveBorrowings] = useState<ActiveBorrowing[]>(
    [],
  );
  const [returnRequestedBorrowings, setReturnRequestedBorrowings] = useState<
    ReturnRequestedBorrowing[]
  >([]);
  const [returnedBorrowings, setReturnedBorrowings] = useState<
    ReturnedBorrowing[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [returnRequestedLoading, setReturnRequestedLoading] = useState(true);
  const [returnedLoading, setReturnedLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
    request?: PendingApproval;
  }>({
    open: false,
    id: "",
    name: "",
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: string;
    name: string;
    request?: PendingApproval;
  }>({
    open: false,
    id: "",
    name: "",
  });

  // Return dialog state
  const [returnDialog, setReturnDialog] = useState<{
    open: boolean;
    borrowing: ReturnRequestedBorrowing | null;
  }>({
    open: false,
    borrowing: null,
  });

  const [returnForm, setReturnForm] = useState({
    kondisi: "baik" as "baik" | "rusak_ringan" | "rusak_berat" | "maintenance",
    keterangan: "",
  });

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    returnedBorrowingsCountRef.current = returnedBorrowings.length;
  }, [returnedBorrowings.length]);

  useEffect(() => {
    loadPendingApprovals(false);
    loadActiveBorrowings(false);
    loadReturnRequestedBorrowings(false);
  }, []);

  useEffect(() => {
    const refreshBorrowingData = async () => {
      const now = Date.now();
      if (refreshInFlightRef.current) {
        return;
      }

      // focus + visibilitychange + realtime can arrive almost together.
      // Ignore bursts so one state change only triggers one refresh cycle.
      if (now - lastRefreshAtRef.current < 750) {
        return;
      }

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = now;

      await invalidatePeminjamanCaches();
      try {
        await Promise.all([
          loadPendingApprovals(true),
          loadActiveBorrowings(true),
          loadReturnRequestedBorrowings(true),
        ]);

        if (
          activeTabRef.current === "returned" ||
          returnedBorrowingsCountRef.current > 0
        ) {
          await loadReturnedBorrowings(true);
        }
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const handleExternalRefresh = () => {
      void refreshBorrowingData();
    };

    const subscription = supabase
      .channel("laboran-peminjaman-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peminjaman",
        },
        () => {
          void refreshBorrowingData();
        },
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshBorrowingData();
      }
    };

    window.addEventListener("peminjaman:changed", handleExternalRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("peminjaman:changed", handleExternalRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadPendingApprovals = async (forceRefresh = false) => {
    try {
      setPendingLoading(true);
      const data = await cacheAPI(
        "laboran_pending_approvals",
        () => getPendingApprovals(100),
        {
          ttl: 3 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setPendingApprovals(data);
      if (data.length > 0) {
        setActiveTab("pending");
      }
    } catch (error) {
      toast.error("Gagal memuat permintaan peminjaman alat");
      console.error("Error loading pending approvals:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  const loadActiveBorrowings = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await cacheAPI(
        "laboran_active_borrowings",
        () => getActiveBorrowings(100),
        {
          ttl: 3 * 60 * 1000, // 3 minutes - active borrowings change frequently
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setActiveBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat peminjaman aktif");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadReturnRequestedBorrowings = async (forceRefresh = false) => {
    try {
      setReturnRequestedLoading(true);
      const data = await cacheAPI(
        "laboran_return_requested_borrowings",
        () => getReturnRequestedBorrowings(100),
        {
          ttl: 3 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setReturnRequestedBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat pengajuan pengembalian");
      console.error(error);
    } finally {
      setReturnRequestedLoading(false);
    }
  };

  const loadReturnedBorrowings = async (forceRefresh = false) => {
    try {
      setReturnedLoading(true);
      const data = await cacheAPI(
        "laboran_returned_borrowings",
        () => getReturnedBorrowings(50),
        {
          ttl: 10 * 60 * 1000, // 10 minutes - history is more stable
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setReturnedBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat riwayat pengembalian");
      console.error(error);
    } finally {
      setReturnedLoading(false);
    }
  };

  const handleOpenReturnDialog = (borrowing: ReturnRequestedBorrowing) => {
    setReturnDialog({ open: true, borrowing });
    setReturnForm({
      kondisi: "baik",
      keterangan: "",
    });
  };

  const openApproveDialog = (request: PendingApproval) => {
    setApproveDialog({
      open: true,
      id: request.id,
      name: request.inventaris_nama,
      request,
    });
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await approvePeminjaman(approveDialog.id);
      toast.success("Peminjaman alat berhasil disetujui");

      await invalidatePeminjamanCaches();
      await Promise.all([
        loadPendingApprovals(true),
        loadActiveBorrowings(true),
        loadReturnRequestedBorrowings(true),
      ]);
      setApproveDialog({ open: false, id: "", name: "" });
    } catch (error) {
      toast.error("Gagal menyetujui permintaan");
      console.error("Error approving request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const openRejectDialog = (request: PendingApproval) => {
    setRejectDialog({
      open: true,
      id: request.id,
      name: request.inventaris_nama,
      request,
    });
    setRejectionReason("");
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    try {
      setProcessing(true);
      await rejectPeminjaman(rejectDialog.id, rejectionReason);
      toast.success("Peminjaman alat berhasil ditolak");

      await invalidatePeminjamanCaches();
      await loadPendingApprovals(true);
      setRejectDialog({ open: false, id: "", name: "" });
      setRejectionReason("");
    } catch (error) {
      toast.error("Gagal menolak permintaan");
      console.error("Error rejecting request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsReturned = async () => {
    if (!returnDialog.borrowing) return;

    try {
      setProcessing(true);
      await markBorrowingReturned(
        returnDialog.borrowing.id,
        returnForm.kondisi,
        returnForm.keterangan,
        0,
      );

      toast.success("Pengembalian alat berhasil diverifikasi");
      setReturnDialog({ open: false, borrowing: null });
      setReturnForm({ kondisi: "baik", keterangan: "" });

      await invalidatePeminjamanCaches();
      await Promise.all([
        loadActiveBorrowings(true),
        loadReturnRequestedBorrowings(true),
      ]);
      await loadReturnedBorrowings(true);
    } catch (error) {
      console.error("Error marking borrowing as returned:", error);
      const errorMessage = getRBACErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatBorrowingContext = ({
    keperluan,
    laboratorium_nama,
    tanggal_pinjam,
  }: {
    keperluan?: string | null;
    laboratorium_nama?: string | null;
    tanggal_pinjam?: string | null;
  }) => {
    if (keperluan?.trim()) {
      return keperluan.replace(/\s-\s/g, " • ");
    }

    const parts = [
      laboratorium_nama || "Lab belum ditentukan",
      tanggal_pinjam ? formatDate(tanggal_pinjam) : null,
    ].filter(Boolean);

    return parts.join(" • ");
  };

  const getKondisiBadge = (kondisi: string) => {
    const kondisiMap: Record<string, "success" | "warning" | "error" | "info"> =
      {
        baik: "success",
        rusak_ringan: "warning",
        rusak_berat: "error",
        maintenance: "info",
      };
    const labels: Record<string, string> = {
      baik: "Baik",
      rusak_ringan: "Rusak Ringan",
      rusak_berat: "Rusak Berat",
      maintenance: "Maintenance",
    };
    return (
      <StatusBadge status={kondisiMap[kondisi] || "info"} pulse={false}>
        {labels[kondisi] || kondisi}
      </StatusBadge>
    );
  };

  const returnedTodayCount = returnedBorrowings.filter((r) => {
    const today = new Date().toDateString();
    const returnDate = new Date(r.tanggal_kembali_aktual).toDateString();
    return today === returnDate;
  }).length;

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="overflow-hidden border-border/60 bg-background/80 shadow-xl"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Package className="h-3.5 w-3.5 text-primary" />
                {isAdminView
                  ? "Backup Operasional Peminjaman"
                  : "Pusat Operasional Peminjaman"}
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20 shadow-sm">
                  <Package className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Peminjaman Alat
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {isAdminView
                      ? "Admin memakai halaman ini sebagai backup operasional saat laboran tidak hadir. Setujui permintaan, pantau alat yang dipinjam, dan proses pengembalian tanpa mengubah alur data utama."
                      : "Kelola tindak lanjut peminjaman alat dari satu tempat: permintaan baru, alat yang sedang dipinjam, verifikasi pengembalian, dan riwayat operasional."}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning lg:max-w-sm">
              {isAdminView
                ? "Gunakan fitur ini hanya saat backup laboran. Pastikan permintaan dan kondisi barang diperiksa agar stok inventaris tetap akurat."
                : "Alur kerja dipisah per tahap agar mudah ditinjau: permintaan baru diproses lebih dulu, lalu berlanjut ke peminjaman aktif, verifikasi pengembalian, dan arsip riwayat."}
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Menunggu Persetujuan"
            value={pendingApprovals.length}
            icon={Clock}
            color="amber"
          />
          <DashboardCard
            title="Sedang Dipinjam"
            value={activeBorrowings.length}
            icon={Package}
            color="blue"
          />
          <DashboardCard
            title="Pengembalian Diajukan"
            value={returnRequestedBorrowings.length}
            icon={CheckCircle}
            color="amber"
          />
          <DashboardCard
            title="Dikembalikan Hari Ini"
            value={returnedTodayCount}
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1.5 rounded-3xl border border-slate-200/70 bg-white/85 p-1.5 shadow-sm backdrop-blur md:grid-cols-4">
            <TabsTrigger
              value="pending"
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5" />
                Menunggu Persetujuan
                <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                  {pendingApprovals.length}
                </span>
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Tinjau permintaan tahap awal
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Package className="h-3.5 w-3.5" />
                Sedang Dipinjam
                <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                  {activeBorrowings.length}
                </span>
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Pantau alat yang masih dipakai
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="return_requested"
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white sm:text-sm"
              onClick={() => {
                if (returnRequestedBorrowings.length === 0) {
                  loadReturnRequestedBorrowings(false);
                }
              }}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pengembalian Diajukan
                <span className="rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                  {returnRequestedBorrowings.length}
                </span>
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Verifikasi pengembalian akhir
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="returned"
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white sm:text-sm"
              onClick={() => {
                if (returnedBorrowings.length === 0) {
                  loadReturnedBorrowings(false);
                }
              }}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <History className="h-3.5 w-3.5" />
                Riwayat
              </span>
              <span className="hidden text-[11px] font-normal opacity-80 sm:block">
                Arsip transaksi selesai
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending">
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Permintaan Menunggu Persetujuan
                </CardTitle>
                <CardDescription>
                  Tinjau pengajuan baru dari dosen. Permintaan yang disetujui
                  akan berpindah ke tahap peminjaman aktif.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {pendingLoading ? (
                  <DashboardSkeleton />
                ) : pendingApprovals.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Tidak ada permintaan baru. Semua pengajuan peminjaman alat
                      sudah diproses.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peminjam</TableHead>
                          <TableHead>Alat</TableHead>
                          <TableHead>Lab Tujuan</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Tanggal Pinjam</TableHead>
                          <TableHead>Tanggal Kembali</TableHead>
                          <TableHead>Konteks Praktikum</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApprovals.map((request) => (
                          <TableRow key={request.id} className="align-top">
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {request.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {request.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {request.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {request.inventaris_kode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {request.laboratorium_nama || (
                                <span className="text-muted-foreground">
                                  Belum ditentukan
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {request.jumlah_pinjam}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(request.tanggal_pinjam)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(request.tanggal_kembali_rencana)}
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate text-sm text-muted-foreground"
                              title={formatBorrowingContext(request)}
                            >
                              {formatBorrowingContext(request)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-success/50 text-success hover:bg-success/10"
                                  onClick={() => openApproveDialog(request)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive text-destructive hover:bg-destructive/10"
                                  onClick={() => openRejectDialog(request)}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Tolak
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          {/* Active Borrowings Tab */}
          <TabsContent value="active">
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Daftar Alat Masih Dipinjam
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Data pada tabel ini adalah peminjaman yang sudah disetujui dan
                  masih digunakan. Pengembalian final baru diproses setelah
                  dosen mengajukan pengembalian.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {loading ? (
                  <DashboardSkeleton />
                ) : activeBorrowings.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <Package className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Tidak ada peminjaman aktif. Semua alat yang dipinjam saat
                      ini sudah dikembalikan.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peminjam</TableHead>
                          <TableHead>Alat</TableHead>
                          <TableHead>Lab Tujuan</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Tgl Pinjam</TableHead>
                          <TableHead>Harus Kembali</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Kondisi</TableHead>
                          <TableHead>Status Proses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeBorrowings.map((borrowing) => (
                          <TableRow key={borrowing.id} className="align-top">
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.inventaris_kode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {borrowing.laboratorium_nama || (
                                <span className="text-muted-foreground">
                                  Belum ditentukan
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {borrowing.jumlah_pinjam}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_pinjam)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_kembali_rencana)}
                            </TableCell>
                            <TableCell>
                              {borrowing.is_overdue ? (
                                <StatusBadge status="error" pulse>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Terlambat {borrowing.days_overdue} hari
                                </StatusBadge>
                              ) : (
                                <StatusBadge status="success" pulse={false}>
                                  Masih Dipinjam
                                </StatusBadge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getKondisiBadge(borrowing.kondisi_pinjam)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              Menunggu dosen ajukan pengembalian
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="return_requested">
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Pengembalian Diajukan
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Dosen sudah mengajukan pengembalian. Verifikasi kondisi akhir
                  alat di sini sebelum transaksi ditutup ke riwayat.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {returnRequestedLoading ? (
                  <DashboardSkeleton />
                ) : returnRequestedBorrowings.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Belum ada pengembalian yang diajukan dosen.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peminjam</TableHead>
                          <TableHead>Alat</TableHead>
                          <TableHead>Lab Tujuan</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Target Kembali</TableHead>
                          <TableHead>Kondisi Awal</TableHead>
                          <TableHead>Catatan Dosen</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnRequestedBorrowings.map((borrowing) => (
                          <TableRow key={borrowing.id} className="align-top">
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.inventaris_kode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {borrowing.laboratorium_nama || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {borrowing.jumlah_pinjam}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm text-foreground">
                                  {formatDate(
                                    borrowing.tanggal_kembali_rencana,
                                  )}
                                </div>
                                {borrowing.is_overdue && (
                                  <StatusBadge
                                    status="error"
                                    pulse={false}
                                    className="text-xs"
                                  >
                                    Terlambat {borrowing.days_overdue} hari
                                  </StatusBadge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getKondisiBadge(
                                borrowing.kondisi_kembali ||
                                  borrowing.kondisi_pinjam,
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <span
                                className="block truncate text-sm text-muted-foreground"
                                title={borrowing.keterangan_kembali || "-"}
                              >
                                {borrowing.keterangan_kembali || "-"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="whitespace-nowrap border-success/40 text-success hover:bg-success/10"
                                onClick={() =>
                                  handleOpenReturnDialog(borrowing)
                                }
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Verifikasi Pengembalian
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          {/* Returned Borrowings Tab */}
          <TabsContent value="returned">
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Riwayat Pengembalian
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rekap alat yang sudah dikembalikan lengkap dengan kondisi
                  akhir dan catatan dari laboran.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {returnedLoading ? (
                  <DashboardSkeleton />
                ) : returnedBorrowings.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <History className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Belum ada riwayat pengembalian. Data akan muncul setelah
                      proses pengembalian pertama selesai dicatat.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peminjam</TableHead>
                          <TableHead>Alat</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Tgl Pinjam</TableHead>
                          <TableHead>Tgl Dikembalikan</TableHead>
                          <TableHead>Kondisi Pinjam</TableHead>
                          <TableHead>Kondisi Kembali</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnedBorrowings.map((borrowing) => (
                          <TableRow key={borrowing.id} className="align-top">
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.inventaris_kode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {borrowing.jumlah_pinjam}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_pinjam)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm text-foreground">
                                  {formatDate(borrowing.tanggal_kembali_aktual)}
                                </div>
                                {borrowing.was_overdue && (
                                  <StatusBadge
                                    status="error"
                                    pulse={false}
                                    className="mt-1 text-xs"
                                  >
                                    Terlambat
                                  </StatusBadge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getKondisiBadge(borrowing.kondisi_pinjam)}
                            </TableCell>
                            <TableCell>
                              {getKondisiBadge(borrowing.kondisi_kembali)}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <span
                                className="block truncate text-sm text-muted-foreground"
                                title={borrowing.keterangan_kembali || "-"}
                              >
                                {borrowing.keterangan_kembali || "-"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Approve Confirmation Dialog */}
        <Dialog
          open={approveDialog.open}
          onOpenChange={(open) => {
            if (!processing) {
              setApproveDialog({ ...approveDialog, open });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
              <DialogDescription>
                Permintaan yang disetujui akan masuk ke tab peminjaman aktif.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm">
              <span className="font-medium">Peminjaman Alat:</span>{" "}
              {approveDialog.name}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setApproveDialog({ ...approveDialog, open: false })
                }
                disabled={processing}
              >
                Batal
              </Button>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-success hover:bg-success/90"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Ya, Setujui
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onOpenChange={(open) => {
            if (!processing) {
              setRejectDialog({ ...rejectDialog, open });
              if (!open) setRejectionReason("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Permintaan</DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan agar peminjam mengetahui penyebabnya.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm">
                <span className="font-medium">Peminjaman Alat:</span>{" "}
                {rejectDialog.name}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Masukkan alasan penolakan..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={processing}
                  rows={4}
                  className="resize-none"
                />
                {!rejectionReason.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Alasan penolakan wajib diisi.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialog({ ...rejectDialog, open: false });
                  setRejectionReason("");
                }}
                disabled={processing}
              >
                Batal
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                variant="destructive"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak Permintaan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Dialog */}
        <Dialog
          open={returnDialog.open}
          onOpenChange={(open) => {
            if (!processing) {
              setReturnDialog({ ...returnDialog, open });
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Verifikasi Pengembalian Alat</DialogTitle>
              <DialogDescription>
                Gunakan form ini setelah alat benar-benar diterima kembali oleh
                laboran. Stok inventaris akan kembali bertambah hanya setelah
                verifikasi final ini disimpan.
              </DialogDescription>
            </DialogHeader>

            {returnDialog.borrowing && (
              <div className="space-y-5 py-4">
                {/* Borrowing Info */}
                <GlassCard
                  intensity="low"
                  className="border-border/60 bg-muted/30 p-4 shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Ringkasan peminjaman
                      </h3>
                      {returnDialog.borrowing.is_overdue && (
                        <StatusBadge status="error" pulse className="text-xs">
                          Terlambat {returnDialog.borrowing.days_overdue} hari
                        </StatusBadge>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Peminjam
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.peminjam_nama}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Alat
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.inventaris_nama}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Jumlah
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.jumlah_pinjam}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Jadwal kembali
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(
                            returnDialog.borrowing.tanggal_kembali_rencana,
                          )}
                        </p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Catatan awal dosen
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.keterangan_kembali || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Kondisi Kembali */}
                <div className="space-y-2">
                  <Label htmlFor="kondisi">
                    Kondisi Barang Saat Diterima{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={returnForm.kondisi}
                    onValueChange={(value: any) =>
                      setReturnForm({ ...returnForm, kondisi: value })
                    }
                  >
                    <SelectTrigger id="kondisi">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Baik</SelectItem>
                      <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                      <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Keterangan */}
                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Textarea
                    id="keterangan"
                    placeholder="Catatan tambahan tentang kondisi barang..."
                    value={returnForm.keterangan}
                    onChange={(e) =>
                      setReturnForm({
                        ...returnForm,
                        keterangan: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setReturnDialog({ ...returnDialog, open: false })
                }
                disabled={processing}
              >
                Batal
              </Button>
              <Button
                onClick={handleMarkAsReturned}
                disabled={processing}
                className="bg-success hover:bg-success/90"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Simpan Verifikasi
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
