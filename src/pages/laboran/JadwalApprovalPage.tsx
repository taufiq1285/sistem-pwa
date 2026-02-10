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
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  RotateCcw,
  Clock,
  History,
} from "lucide-react";

// Components
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  }, []);

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
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jadwal Praktikum"
        description="Approve jadwal praktikum dosen (termasuk booking lab otomatis)"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menunggu Persetujuan
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              Jadwal praktikum menunggu approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jadwal Aktif
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">
              Jadwal disetujui (lab ter-booking)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Riwayat
            </CardTitle>
            <History className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-gray-600">
              {stats.cancelled + stats.rejected}
            </div>
            <p className="text-xs text-muted-foreground">
              Jadwal dibatalkan/ditolak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={labFilter} onValueChange={setLabFilter}>
            <SelectTrigger className="w-full md:w-[300px]">
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
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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
            <LoadingSpinner />
          ) : jadwalList.filter((j) => j.status === "pending").length === 0 ? (
            <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
              <CardContent className="p-12">
                <EmptyState
                  title="Tidak ada jadwal menunggu"
                  description="Belum ada jadwal praktikum yang menunggu persetujuan"
                  icon={Clock}
                />
              </CardContent>
            </Card>
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
                          const kelas = j.kelas as any;
                          const lab = j.laboratorium as any;
                          const dosen = j.dosen_user as any;

                          return (
                            <TableRow key={jadwal.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {jadwal.tanggal_praktikum
                                    ? format(
                                        new Date(jadwal.tanggal_praktikum),
                                        "dd MMM yyyy",
                                        { locale: localeId }
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
                                  <div className="text-sm text-gray-500">
                                    {kelas?.nama_kelas || "-"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-orange-700">
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
                                    onClick={() => handleApproveJadwalClick(jadwal)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectJadwalClick(jadwal)}
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
            <LoadingSpinner />
          ) : jadwalList.filter((j) => j.status === "approved").length === 0 ? (
            <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-green-50/30 dark:from-slate-900 dark:to-green-950/20">
              <CardContent className="p-12">
                <EmptyState
                  title="Tidak ada jadwal aktif"
                  description="Belum ada jadwal praktikum yang disetujui"
                  icon={CheckCircle2}
                />
              </CardContent>
            </Card>
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
                          const kelas = j.kelas as any;
                          const lab = j.laboratorium as any;
                          const dosen = j.dosen_user as any;

                          return (
                            <TableRow key={jadwal.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {jadwal.tanggal_praktikum
                                    ? format(
                                        new Date(jadwal.tanggal_praktikum),
                                        "dd MMM yyyy",
                                        { locale: localeId }
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
                                  <div className="text-sm text-gray-500">
                                    {kelas?.nama_kelas || "-"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-700">
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
            <LoadingSpinner />
          ) : jadwalList.filter(
              (j) => j.status === "cancelled" || j.status === "rejected"
            ).length === 0 ? (
            <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-red-50/30 dark:from-slate-900 dark:to-red-950/20">
              <CardContent className="p-12">
                <EmptyState
                  title="Tidak ada riwayat"
                  description="Belum ada jadwal yang dibatalkan atau ditolak"
                  icon={History}
                />
              </CardContent>
            </Card>
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
                            j.status === "cancelled" || j.status === "rejected"
                        )
                        .map((jadwal) => {
                          const kelas = j.kelas as any;
                          const lab = j.laboratorium as any;
                          const dosen = j.dosen_user as any;

                          return (
                            <TableRow key={jadwal.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {jadwal.tanggal_praktikum
                                    ? format(
                                        new Date(jadwal.tanggal_praktikum),
                                        "dd MMM yyyy",
                                        { locale: localeId }
                                      )
                                    : "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    j.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {j.status === "rejected"
                                    ? "Ditolak"
                                    : "Dibatalkan"}
                                </Badge>
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
                                  <div className="text-sm text-gray-500">
                                    {kelas?.nama_kelas || "-"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-gray-700">
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
                                    onClick={() => handleReactivateClick(jadwal)}
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
              Apakah Anda yakin ingin menyetujui jadwal praktikum ini? Lab akan
              otomatis ter-booking untuk jadwal ini.
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
            <Button onClick={handleApproveJadwalConfirm} disabled={submitting}>
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
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
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
  );
}
