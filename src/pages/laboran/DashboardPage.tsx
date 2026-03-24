/**
 * Laboran Dashboard Page
 * Main dashboard for Laboran role showing:
 * - Stats (Total Lab, Total Alat, Pending Approvals, Low Stock)
 * - Pending Approvals (dengan tombol approve/reject)
 * - Inventory Alerts (stok rendah)
 * - Lab Schedule Today
 */

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  User,
  FlaskConical,
  Sparkles,
  Shield,
} from "lucide-react";
import { networkDetector } from "@/lib/offline/network-detector";
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
} from "@/lib/offline/api-cache";
import {
  getLaboranStats,
  getPendingApprovals,
  getInventoryAlerts,
  getLabScheduleToday,
  processApproval,
  type LaboranStats,
  type PendingApproval,
  type InventoryAlert,
  type LabScheduleToday,
} from "@/lib/api/laboran.api";
import { toast } from "sonner";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LaboranStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    [],
  );
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [labSchedule, setLabSchedule] = useState<LabScheduleToday[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // Dialog state for rejection
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  // Fetch all dashboard data
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    } else {
      // Clear data if no user
      setStats(null);
      setPendingApprovals([]);
      setInventoryAlerts([]);
      setLabSchedule([]);
      setIsOfflineData(false);
      setLastUpdatedAt(null);
    }
  }, [user?.id]);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const statsCacheKey = `laboran_stats_${user?.id}`;
      const approvalsCacheKey = `laboran_approvals_${user?.id}`;
      const alertsCacheKey = `laboran_alerts_${user?.id}`;
      const scheduleCacheKey = `laboran_schedule_${user?.id}`;

      const [
        cachedStatsEntry,
        cachedApprovalsEntry,
        cachedAlertsEntry,
        cachedScheduleEntry,
      ] = await Promise.all([
        getCachedData<LaboranStats>(statsCacheKey),
        getCachedData<PendingApproval[]>(approvalsCacheKey),
        getCachedData<InventoryAlert[]>(alertsCacheKey),
        getCachedData<LabScheduleToday[]>(scheduleCacheKey),
      ]);

      const hasCachedData =
        !!cachedStatsEntry?.data ||
        Array.isArray(cachedApprovalsEntry?.data) ||
        Array.isArray(cachedAlertsEntry?.data) ||
        Array.isArray(cachedScheduleEntry?.data);

      if (hasCachedData) {
        setStats(cachedStatsEntry?.data ?? null);
        setPendingApprovals(
          Array.isArray(cachedApprovalsEntry?.data)
            ? cachedApprovalsEntry.data
            : [],
        );
        setInventoryAlerts(
          Array.isArray(cachedAlertsEntry?.data) ? cachedAlertsEntry.data : [],
        );
        setLabSchedule(
          Array.isArray(cachedScheduleEntry?.data)
            ? cachedScheduleEntry.data
            : [],
        );
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedStatsEntry?.timestamp || 0,
            cachedApprovalsEntry?.timestamp || 0,
            cachedAlertsEntry?.timestamp || 0,
            cachedScheduleEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan snapshot dashboard laboran terakhir."
            : "Perangkat sedang offline dan belum ada snapshot dashboard laboran tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const [statsData, approvalsData, alertsData, scheduleData] =
        await Promise.all([
          cacheAPI(statsCacheKey, () => getLaboranStats(), {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            approvalsCacheKey,
            () => getPendingApprovals(10),
            {
              ttl: 2 * 60 * 1000, // 2 minutes (approvals need fresh data)
              forceRefresh,
              staleWhileRevalidate: true,
            },
          ),
          cacheAPI(alertsCacheKey, () => getInventoryAlerts(10), {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            scheduleCacheKey,
            () => getLabScheduleToday(10),
            {
              ttl: 5 * 60 * 1000, // 5 minutes
              forceRefresh,
              staleWhileRevalidate: true,
            },
          ),
        ]);

      setStats(statsData);
      setPendingApprovals(approvalsData);
      setInventoryAlerts(alertsData);
      setLabSchedule(scheduleData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
        setError(null); // Don't show error in offline mode
        setIsOfflineData(true);
      } else {
        console.error("Error fetching dashboard data:", err);
        setError("Gagal memuat data dashboard. Silakan refresh halaman.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async (peminjamanId: string) => {
    try {
      setActionLoading(true);
      await processApproval({
        peminjaman_id: peminjamanId,
        status: "approved",
      });

      toast.success("Peminjaman telah disetujui");

      // Invalidate cache and refresh data
      await invalidateCache(`laboran_approvals_${user?.id}`);
      await invalidateCache(`laboran_stats_${user?.id}`);
      await fetchDashboardData(true);
    } catch (err) {
      console.error("Error approving peminjaman:", err);
      toast.error("Gagal menyetujui peminjaman");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject - open dialog
  const handleRejectClick = (peminjamanId: string) => {
    setSelectedPeminjaman(peminjamanId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  // Handle reject - submit
  const handleRejectSubmit = async () => {
    if (!selectedPeminjaman) return;
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setActionLoading(true);
      await processApproval({
        peminjaman_id: selectedPeminjaman,
        status: "rejected",
        rejection_reason: rejectionReason,
      });

      toast.success("Peminjaman telah ditolak");

      // Close dialog and refresh data
      setRejectDialogOpen(false);
      setSelectedPeminjaman(null);
      setRejectionReason("");

      // Invalidate cache and refresh data
      await invalidateCache(`laboran_approvals_${user?.id}`);
      await invalidateCache(`laboran_stats_${user?.id}`);
      await fetchDashboardData(true);
    } catch (err) {
      console.error("Error rejecting peminjaman:", err);
      toast.error("Gagal menolak peminjaman");
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Format time
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Get condition status for StatusBadge
  const getConditionStatus = (
    condition: string,
  ): "success" | "warning" | "error" | "info" => {
    switch (condition) {
      case "baik":
        return "success";
      case "rusak_ringan":
        return "warning";
      case "rusak_berat":
        return "error";
      case "maintenance":
        return "info";
      default:
        return "info";
    }
  };

  // Get condition label
  const getConditionLabel = (condition: string): string => {
    switch (condition) {
      case "baik":
        return "Baik";
      case "rusak_ringan":
        return "Rusak Ringan";
      case "rusak_berat":
        return "Rusak Berat";
      case "maintenance":
        return "Maintenance";
      default:
        return condition;
    }
  };

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="surface-grid min-h-screen bg-background">
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          <GlassCard
            intensity="high"
            glow
            className="overflow-hidden rounded-4xl border border-border/50 bg-background/80 shadow-xl"
          >
            <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-linear-to-br from-primary via-primary/90 to-info p-3 text-primary-foreground shadow-lg shadow-primary/20">
                  <FlaskConical className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Laboran workspace
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      Dashboard Laboran
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      Ringkasan operasional laboratorium, approval, inventaris,
                      dan jadwal praktikum aktif.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Akun aktif
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {user?.full_name || user?.email}
                </p>
              </div>
            </CardContent>
          </GlassCard>

          {/* Error Alert */}
          {error && (
            <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium text-destructive/90">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {(isOfflineData || !navigator.onLine) && (
            <Alert className="border-warning/40 bg-warning/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Dashboard laboran sedang memakai snapshot lokal dari perangkat.
                {lastUpdatedLabel
                  ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
                  : ""}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Lab"
              value={stats?.totalLab || 0}
              icon={FlaskConical}
              color="blue"
              description="Laboratorium aktif"
            />
            <DashboardCard
              title="Total Alat"
              value={stats?.totalInventaris || 0}
              icon={Package}
              color="green"
              description="Inventaris terpantau"
            />
            <DashboardCard
              title="Pending Approval"
              value={stats?.pendingApprovals || 0}
              icon={ClipboardCheck}
              color="amber"
              description="Menunggu tindakan"
            />
            <DashboardCard
              title="Stok Rendah"
              value={stats?.lowStockAlerts || 0}
              icon={AlertTriangle}
              color="red"
              description="Perlu perhatian segera"
            />
          </div>

          {/* Welcome Banner */}
          {(pendingApprovals.length > 0 || inventoryAlerts.length > 0) && (
            <GlassCard
              intensity="high"
              glow
              className="overflow-hidden border-white/20 bg-linear-to-r from-primary/95 via-primary/90 to-accent/90 text-primary-foreground shadow-2xl"
            >
              <div className="absolute inset-0 bg-grid-white/10" />
              <CardContent className="relative p-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
                    <Shield className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-2 text-3xl font-extrabold">
                      Tetap Siap! 🛡️
                    </h2>
                    <p className="text-lg font-semibold text-primary-foreground/80">
                      {pendingApprovals.length > 0 && (
                        <>
                          Ada{" "}
                          <span className="font-extrabold text-primary-foreground">
                            {pendingApprovals.length} peminjaman
                          </span>{" "}
                          yang menunggu approval.
                        </>
                      )}
                      {inventoryAlerts.length > 0 && (
                        <>
                          <span className="font-extrabold text-primary-foreground">
                            {inventoryAlerts.length} alat
                          </span>{" "}
                          dengan stok rendah perlu diperhatikan.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <FlaskConical className="h-24 w-24 text-primary-foreground/20" />
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Approvals */}
            <GlassCard className="relative overflow-hidden border-border/60 bg-background/80 lg:col-span-2">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-3xl" />
              <CardHeader className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Persetujuan Peminjaman
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm font-medium text-muted-foreground sm:text-base">
                    {stats?.pendingApprovals || 0} peminjaman yang menunggu
                    approval
                  </CardDescription>
                </div>
                {pendingApprovals.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/laboran/persetujuan")}
                    className="font-semibold"
                  >
                    Lihat Semua
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="relative">
                {pendingApprovals.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Tidak ada peminjaman yang menunggu approval. Semua
                      peminjaman telah diproses.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map((approval) => (
                      <div
                        key={approval.id}
                        className="flex gap-3 p-4 border-2 border-primary/20 rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md group"
                      >
                        <div className="shrink-0">
                          <div className="w-12 h-12 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground">
                              {approval.inventaris_nama}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-primary/10 text-primary font-semibold"
                            >
                              {approval.inventaris_kode}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {approval.peminjam_nama} ({approval.peminjam_nim})
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">
                            📍 {approval.laboratorium_nama} • Jumlah:{" "}
                            {approval.jumlah_pinjam}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">
                            🗓️ {formatDate(approval.tanggal_pinjam)} -{" "}
                            {formatDate(approval.tanggal_kembali_rencana)}
                          </p>
                          {approval.keperluan && (
                            <p className="text-xs font-semibold text-muted-foreground mt-1 italic">
                              "{approval.keperluan}"
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            disabled={actionLoading}
                            className="bg-linear-to-r from-success/80 to-success hover:from-success hover:to-success/90 shadow-lg hover:shadow-xl font-semibold"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectClick(approval.id)}
                            disabled={actionLoading}
                            className="text-danger border-danger border-2 hover:bg-danger/5 font-semibold"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>

            {/* Inventory Alerts */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-danger/5 to-danger/10 dark:from-danger/10 dark:to-danger/5 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-danger/10 to-danger/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2.5 bg-linear-to-br from-danger/80 to-danger rounded-xl shadow-lg shadow-danger/20">
                      <AlertTriangle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      Peringatan Stok
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base font-semibold text-muted-foreground">
                    {stats?.lowStockAlerts || 0} alat dengan stok rendah (&lt;
                    5)
                  </CardDescription>
                </div>
                {inventoryAlerts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/laboran/inventaris")}
                    className="hover:bg-danger/10 font-semibold"
                  >
                    Lihat Semua
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="relative">
                {inventoryAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 bg-success/10 rounded-full mb-4">
                      <Package className="h-12 w-12 text-success" />
                    </div>
                    <p className="text-lg font-bold text-foreground mb-2">
                      Semua stok alat mencukupi
                    </p>
                    <p className="text-base font-medium text-muted-foreground">
                      Tidak ada peringatan stok
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventoryAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex gap-3 p-4 border-2 border-danger/20 rounded-xl hover:bg-danger/5 hover:border-danger/40 transition-all duration-300 shadow-sm hover:shadow-md group"
                      >
                        <div className="shrink-0">
                          <div className="w-12 h-12 bg-linear-to-br from-danger/80 to-danger rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm truncate text-foreground">
                              {alert.nama_barang}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-danger/10 text-danger font-semibold"
                            >
                              {alert.kode_barang}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {alert.kategori}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">
                            📍 {alert.laboratorium_nama}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge
                              status={getConditionStatus(alert.kondisi)}
                              pulse={false}
                              className="text-xs font-semibold"
                            >
                              {getConditionLabel(alert.kondisi)}
                            </StatusBadge>
                            <span className="text-xs font-bold text-danger">
                              Tersedia: {alert.jumlah_tersedia}/{alert.jumlah}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lab Schedule Today */}
            <GlassCard className="relative overflow-hidden border-border/60 bg-background/80">
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-cyan-500/10 blur-3xl" />
              <CardHeader className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Jadwal Lab Hari Ini
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm font-medium text-muted-foreground sm:text-base">
                    Praktikum yang berlangsung hari ini
                  </CardDescription>
                </div>
                {labSchedule.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/laboran/laboratorium")}
                    className="font-semibold"
                  >
                    Lihat Semua
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="relative">
                {labSchedule.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <FlaskConical className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Tidak ada praktikum yang dijadwalkan untuk hari ini.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {labSchedule.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex gap-3 p-4 border-2 border-teal-100 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-md group"
                      >
                        <div className="shrink-0">
                          <div className="w-12 h-12 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FlaskConical className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate text-foreground">
                            {schedule.mata_kuliah_nama}
                          </h4>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {schedule.kelas_nama} • {schedule.dosen_nama}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(schedule.jam_mulai)} -{" "}
                            {formatTime(schedule.jam_selesai)}
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">
                            📍 {schedule.laboratorium_nama}
                          </p>
                          {schedule.topik && (
                            <p className="text-xs font-semibold text-muted-foreground mt-1 italic">
                              "{schedule.topik}"
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Peminjaman</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk peminjaman ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Contoh: Alat sedang rusak / Alat sudah dipinjam mahasiswa lain / Jadwal bentrok"
                value={rejectionReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRejectionReason(e.target.value)
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-danger hover:bg-danger/90"
            >
              {actionLoading ? "Memproses..." : "Tolak Peminjaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
