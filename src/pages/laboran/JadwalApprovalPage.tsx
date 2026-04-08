/**
 * Kelola Jadwal Praktikum - Laboran
 * SIMPLIFIED: Hanya manage jadwal praktikum (booking lab otomatis di dalamnya)
 *
 * Workflow:
 * 1. Dosen buat jadwal praktikum → otomatis booking lab
 * 2. Laboran approve jadwal → lab fixed untuk jadwal tsb
 * 3. Tidak ada 2 sistem terpisah
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Clock,
  History,
} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// API & Types
import {
  getAllJadwalForLaboran,
  approveJadwal,
  rejectJadwal,
  cancelJadwal,
  reactivateJadwal,
} from "@/lib/api/jadwal.api";
import { getLaboratoriumList } from "@/lib/api/laboran.api";
import type { Jadwal, Laboratorium } from "@/types/jadwal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function JadwalApprovalPage() {
  const [loading, setLoading] = useState(true);

  // Data states
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [labList, setLabList] = useState<Laboratorium[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "cancelled"
  >("all");
  const [labFilter, setLabFilter] = useState<string>("all");

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadJadwalData();
  }, [statusFilter, labFilter]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadJadwalData = async () => {
    try {
      setLoading(true);

      const [jadwalData, labData] = await Promise.all([
        getAllJadwalForLaboran({
          status: statusFilter === "all" ? undefined : statusFilter,
          laboratorium_id: labFilter === "all" ? undefined : labFilter,
        }),
        getLaboratoriumList({ is_active: true }),
      ]);

      setJadwalList(jadwalData);
      setLabList(labData as any);
    } catch (error: any) {
      console.error("Error loading jadwal data:", error);
      toast.error(error.message || "Gagal memuat data jadwal");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    loadJadwalData();
  };

  // ============================================================================
  // JADWAL APPROVAL HANDLERS
  // ============================================================================

  const handleApproveJadwalClick = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setShowApproveDialog(true);
  };

  const handleApproveJadwalConfirm = async () => {
    if (!selectedJadwal) return;

    try {
      setSubmitting(true);
      await approveJadwal(selectedJadwal.id);
      toast.success("Jadwal praktikum berhasil disetujui", {
        description: `Lab ${selectedJadwal.laboratorium?.nama_lab} telah di-booking untuk jadwal ini.`,
      });
      setShowApproveDialog(false);
      setSelectedJadwal(null);
      loadJadwalData();
    } catch (error: any) {
      console.error("Error approving jadwal:", error);
      toast.error(error.message || "Gagal menyetujui jadwal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectJadwalClick = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleRejectJadwalConfirm = async () => {
    if (!selectedJadwal) return;

    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      await rejectJadwal(selectedJadwal.id, rejectionReason.trim());
      toast.success("Jadwal praktikum berhasil ditolak", {
        description: "Booking lab dibatalkan.",
      });
      setShowRejectDialog(false);
      setSelectedJadwal(null);
      setRejectionReason("");
      loadJadwalData();
    } catch (error: any) {
      console.error("Error rejecting jadwal:", error);
      toast.error(error.message || "Gagal menolak jadwal");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // CANCELLATION HANDLERS
  // ============================================================================

  const handleCancelClick = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setCancellationReason("");
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedJadwal) return;

    if (!cancellationReason.trim()) {
      toast.error("Alasan pembatalan harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      await cancelJadwal(selectedJadwal.id, cancellationReason.trim());
      toast.success("Jadwal praktikum berhasil dibatalkan");
      setShowCancelDialog(false);
      setSelectedJadwal(null);
      setCancellationReason("");
      loadJadwalData();
    } catch (error: any) {
      console.error("Error cancelling jadwal:", error);
      toast.error(error.message || "Gagal membatalkan jadwal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateClick = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setShowReactivateDialog(true);
  };

  const handleReactivateConfirm = async () => {
    if (!selectedJadwal) return;

    try {
      setSubmitting(true);
      await reactivateJadwal(selectedJadwal.id);
      toast.success("Jadwal praktikum berhasil diaktifkan kembali");
      setShowReactivateDialog(false);
      setSelectedJadwal(null);
      loadJadwalData();
    } catch (error: any) {
      console.error("Error reactivating jadwal:", error);
      toast.error(error.message || "Gagal mengaktifkan kembali jadwal");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = {
    pending: jadwalList.filter((j) => j.status === "pending").length,
    approved: jadwalList.filter((j) => j.status === "approved").length,
    cancelled: jadwalList.filter((j) => j.status === "cancelled").length,
    rejected: jadwalList.filter((j) => j.status === "rejected").length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Kelola Jadwal Praktikum
                  </h1>
                  <p className="text-muted-foreground">
                    Approve jadwal praktikum dosen termasuk booking laboratorium
                    otomatis.
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={refreshAll} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Menunggu Persetujuan"
            value={stats.pending}
            icon={Clock}
            color="amber"
          />
          <DashboardCard
            title="Jadwal Aktif"
            value={stats.approved}
            icon={CheckCircle2}
            color="green"
          />
          <DashboardCard
            title="Riwayat"
            value={stats.cancelled + stats.rejected}
            icon={History}
            color="purple"
          />
        </div>

        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={labFilter} onValueChange={setLabFilter}>
                <SelectTrigger className="w-full md:w-75">
                  <SelectValue placeholder="Semua Laboratorium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Laboratorium</SelectItem>
                  {labList.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.nama_lab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={refreshAll} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Menunggu Persetujuan ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Calendar className="h-4 w-4" />
              Jadwal Aktif ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Riwayat ({stats.cancelled + stats.rejected})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <DashboardSkeleton />
            ) : jadwalList.filter((j) => j.status === "pending").length ===
              0 ? (
              <GlassCard className="border-white/40 bg-white/85 dark:border-white/10 dark:bg-card">
                <div className="py-12 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    Tidak ada jadwal menunggu
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Belum ada jadwal praktikum yang menunggu persetujuan
                  </p>
                </div>
              </GlassCard>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Mata Kuliah / Kelas</TableHead>
                          <TableHead>Laboratorium</TableHead>
                          <TableHead>Dosen</TableHead>
                          <TableHead>Topik</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jadwalList
                          .filter((j) => j.status === "pending")
                          .map((jadwal) => {
                            const kelas = jadwal.kelas as any;
                            const lab = jadwal.laboratorium as any;
                            const dosen = jadwal.dosen_user as any;

                            return (
                              <TableRow key={jadwal.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {jadwal.tanggal_praktikum
                                      ? format(
                                          new Date(jadwal.tanggal_praktikum),
                                          "dd MMM yyyy",
                                          { locale: localeId },
                                        )
                                      : "-"}
                                  </div>
                                </TableCell>
                                <TableCell>{jadwal.hari || "-"}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {kelas?.mata_kuliah?.nama_mk || "-"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {kelas?.nama_kelas || "-"}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-warning">
                                    {lab?.nama_lab || "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {dosen?.user_id?.full_name || "-"}
                                </TableCell>
                                <TableCell
                                  className="max-w-xs truncate"
                                  title={jadwal.topik || "-"}
                                >
                                  {jadwal.topik || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleApproveJadwalClick(jadwal)
                                      }
                                      className="bg-success hover:bg-success/90"
                                    >
                                      Setujui
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleRejectJadwalClick(jadwal)
                                      }
                                    >
                                      Tolak
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-4">
            {loading ? (
              <DashboardSkeleton />
            ) : jadwalList.filter((j) => j.status === "approved").length ===
              0 ? (
              <GlassCard className="border-white/40 bg-white/85 dark:border-white/10 dark:bg-card">
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    Tidak ada jadwal aktif
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Belum ada jadwal praktikum yang disetujui
                  </p>
                </div>
              </GlassCard>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Mata Kuliah / Kelas</TableHead>
                          <TableHead>Laboratorium</TableHead>
                          <TableHead>Dosen</TableHead>
                          <TableHead>Topik</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jadwalList
                          .filter((j) => j.status === "approved")
                          .map((jadwal) => {
                            const kelas = jadwal.kelas as any;
                            const lab = jadwal.laboratorium as any;
                            const dosen = jadwal.dosen_user as any;

                            return (
                              <TableRow key={jadwal.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {jadwal.tanggal_praktikum
                                      ? format(
                                          new Date(jadwal.tanggal_praktikum),
                                          "dd MMM yyyy",
                                          { locale: localeId },
                                        )
                                      : "-"}
                                  </div>
                                </TableCell>
                                <TableCell>{jadwal.hari || "-"}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {kelas?.mata_kuliah?.nama_mk || "-"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {kelas?.nama_kelas || "-"}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-success">
                                    {lab?.nama_lab || "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {dosen?.user_id?.full_name || "-"}
                                </TableCell>
                                <TableCell
                                  className="max-w-xs truncate"
                                  title={jadwal.topik || "-"}
                                >
                                  {jadwal.topik || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancelClick(jadwal)}
                                  >
                                    Batalkan
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <DashboardSkeleton />
            ) : jadwalList.filter(
                (j) => j.status === "cancelled" || j.status === "rejected",
              ).length === 0 ? (
              <GlassCard className="border-white/40 bg-white/85 dark:border-white/10 dark:bg-card">
                <div className="py-12 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Tidak ada riwayat</h3>
                  <p className="text-sm text-muted-foreground">
                    Belum ada jadwal yang dibatalkan atau ditolak
                  </p>
                </div>
              </GlassCard>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Mata Kuliah / Kelas</TableHead>
                          <TableHead>Laboratorium</TableHead>
                          <TableHead>Dosen</TableHead>
                          <TableHead>Topik</TableHead>
                          <TableHead>Alasan</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jadwalList
                          .filter(
                            (j) =>
                              j.status === "cancelled" ||
                              j.status === "rejected",
                          )
                          .map((jadwal) => {
                            const kelas = jadwal.kelas as any;
                            const lab = jadwal.laboratorium as any;
                            const dosen = jadwal.dosen_user as any;

                            return (
                              <TableRow key={jadwal.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {jadwal.tanggal_praktikum
                                      ? format(
                                          new Date(jadwal.tanggal_praktikum),
                                          "dd MMM yyyy",
                                          { locale: localeId },
                                        )
                                      : "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={
                                      jadwal.status === "rejected"
                                        ? "error"
                                        : "offline"
                                    }
                                    pulse={false}
                                  >
                                    {jadwal.status === "rejected"
                                      ? "Ditolak"
                                      : "Dibatalkan"}
                                  </StatusBadge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {kelas?.mata_kuliah?.nama_mk || "-"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {kelas?.nama_kelas || "-"}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-muted-foreground">
                                    {lab?.nama_lab || "-"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {dosen?.user_id?.full_name || "-"}
                                </TableCell>
                                <TableCell
                                  className="max-w-xs truncate"
                                  title={jadwal.topik || "-"}
                                >
                                  {jadwal.topik || "-"}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {jadwal.cancellation_reason ||
                                    jadwal.rejection_reason ||
                                    "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {jadwal.status === "cancelled" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleReactivateClick(jadwal)
                                      }
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Aktifkan
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setujui Jadwal Praktikum</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menyetujui jadwal praktikum ini? Lab
                akan otomatis ter-booking untuk jadwal ini.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleApproveJadwalConfirm}
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Setujui"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Jadwal Praktikum</DialogTitle>
              <DialogDescription>
                Masukkan alasan penolakan jadwal praktikum ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Contoh: Lab sedang perbaikan..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectJadwalConfirm}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? "Memproses..." : "Tolak"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batalkan Jadwal Praktikum</DialogTitle>
              <DialogDescription>
                Masukkan alasan pembatalan jadwal praktikum ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="cancellation-reason">Alasan Pembatalan</Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Contoh: Mahasiswa tidak bisa hadir..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelConfirm}
                disabled={submitting || !cancellationReason.trim()}
              >
                {submitting ? "Memproses..." : "Batalkan Jadwal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reactivate Dialog */}
        <Dialog
          open={showReactivateDialog}
          onOpenChange={setShowReactivateDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aktifkan Kembali Jadwal</DialogTitle>
              <DialogDescription>
                Jadwal yang dibatalkan akan diaktifkan kembali
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReactivateDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button onClick={handleReactivateConfirm} disabled={submitting}>
                {submitting ? "Memproses..." : "Aktifkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
