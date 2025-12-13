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
  Building2,
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, approvalsData, alertsData, scheduleData] =
        await Promise.all([
          getLaboranStats(),
          getPendingApprovals(10),
          getInventoryAlerts(10),
          getLabScheduleToday(10),
        ]);

      setStats(statsData);
      setPendingApprovals(approvalsData);
      setInventoryAlerts(alertsData);
      setLabSchedule(scheduleData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Gagal memuat data dashboard. Silakan refresh halaman.");
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

      // Refresh data
      await fetchDashboardData();
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
      await fetchDashboardData();
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
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Laboran
          </h1>
          <p className="text-gray-600 mt-1">
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

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Laboratorium
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLab || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Ruangan lab aktif</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Alat
              </CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalInventaris || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Item inventaris</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/laboran/persetujuan")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Perlu Persetujuan
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pendingApprovals || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Menunggu approval</p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/laboran/inventaris")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Stok Rendah
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.lowStockAlerts || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Perlu restocking</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Persetujuan Peminjaman</CardTitle>
                <CardDescription>
                  Peminjaman yang menunggu approval
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/laboran/persetujuan")}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada peminjaman yang menunggu approval
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
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
                      <div className="flex flex-col gap-2 flex-shrink-0">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Peringatan Stok</CardTitle>
                <CardDescription>
                  Alat dengan stok rendah (&lt; 5)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/laboran/inventaris")}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {inventoryAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Semua stok alat mencukupi
                </p>
              ) : (
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Jadwal Lab Hari Ini</CardTitle>
                <CardDescription>
                  Praktikum yang berlangsung hari ini
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/laboran/laboratorium")}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {labSchedule.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada jadwal lab hari ini
                </p>
              ) : (
                <div className="space-y-3">
                  {labSchedule.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
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
