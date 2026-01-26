/**
 * Laboran Dashboard Page
 * Main dashboard for Laboran role showing:
 * - Stats (Total Lab, Total Alat, Pending Approvals, Low Stock)
 * - Pending Approvals (dengan tombol approve/reject)
 * - Inventory Alerts (stok rendah)
 * - Lab Schedule Today
 */

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  XCircle,
  AlertCircle,
  ArrowRight,
  User,
  FlaskConical,
} from "lucide-react";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
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

  // Dialog state for rejection
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
    }
  }, [user?.id]);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Use cacheAPI with stale-while-revalidate for offline support
      const [statsData, approvalsData, alertsData, scheduleData] =
        await Promise.all([
          cacheAPI(`laboran_stats_${user?.id}`, () => getLaboranStats(), {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            `laboran_approvals_${user?.id}`,
            () => getPendingApprovals(10),
            {
              ttl: 2 * 60 * 1000, // 2 minutes (approvals need fresh data)
              forceRefresh,
              staleWhileRevalidate: true,
            },
          ),
          cacheAPI(`laboran_alerts_${user?.id}`, () => getInventoryAlerts(10), {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            `laboran_schedule_${user?.id}`,
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
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
        setError(null); // Don't show error in offline mode
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

  // Get condition badge variant
  const getConditionVariant = (
    condition: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (condition) {
      case "baik":
        return "default";
      case "rusak_ringan":
        return "secondary";
      case "rusak_berat":
        return "destructive";
      case "maintenance":
        return "outline";
      default:
        return "outline";
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
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Dashboard Laboran
          </h1>
          <p className="text-lg font-semibold mt-1">
            Selamat datang, {user?.full_name || user?.email}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2 border-0 shadow-xl p-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <ClipboardCheck className="h-5 w-5" />
                  Persetujuan Peminjaman
                </CardTitle>
                <CardDescription className="text-base font-semibold">
                  {stats?.pendingApprovals || 0} peminjaman yang menunggu
                  approval
                </CardDescription>
              </div>
              {pendingApprovals.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/laboran/persetujuan")}
                >
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Tidak ada peminjaman yang menunggu approval
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {approval.inventaris_nama}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {approval.inventaris_kode}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <User className="h-3 w-3" />
                          {approval.peminjam_nama} ({approval.peminjam_nim})
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {approval.laboratorium_nama} • Jumlah:{" "}
                          {approval.jumlah_pinjam}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          🗓️ {formatDate(approval.tanggal_pinjam)} -{" "}
                          {formatDate(approval.tanggal_kembali_rencana)}
                        </p>
                        {approval.keperluan && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            "{approval.keperluan}"
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval.id)}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectClick(approval.id)}
                          disabled={actionLoading}
                          className="text-red-600 border-red-600 hover:bg-red-50"
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
          </Card>

          {/* Inventory Alerts */}
          <Card className="border-0 shadow-xl p-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Peringatan Stok
                </CardTitle>
                <CardDescription>
                  {stats?.lowStockAlerts || 0} alat dengan stok rendah (&lt; 5)
                </CardDescription>
              </div>
              {inventoryAlerts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/laboran/inventaris")}
                >
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {inventoryAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Semua stok alat mencukupi
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {alert.nama_barang}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {alert.kode_barang}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {alert.kategori}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {alert.laboratorium_nama}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={getConditionVariant(alert.kondisi)}
                            className="text-xs"
                          >
                            {getConditionLabel(alert.kondisi)}
                          </Badge>
                          <span className="text-xs font-medium text-red-600">
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
          <Card className="border-0 shadow-xl p-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Jadwal Lab Hari Ini
                </CardTitle>
                <CardDescription>
                  Praktikum yang berlangsung hari ini
                </CardDescription>
              </div>
              {labSchedule.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/laboran/laboratorium")}
                >
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {labSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Tidak ada jadwal lab hari ini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {labSchedule.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FlaskConical className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {schedule.mata_kuliah_nama}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {schedule.kelas_nama} • {schedule.dosen_nama}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          {formatTime(schedule.jam_mulai)} -{" "}
                          {formatTime(schedule.jam_selesai)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {schedule.laboratorium_nama}
                        </p>
                        {schedule.topik && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            "{schedule.topik}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Memproses..." : "Tolak Peminjaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
