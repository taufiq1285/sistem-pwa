/**
 * Jadwal Approval Page - Laboran
 * Hybrid Approval Workflow: Monitor and manage all jadwal
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
} from "lucide-react";

// Components
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  cancelJadwal,
  reactivateJadwal,
} from "@/lib/api/jadwal.api";
import { getLaboratoriumList } from "@/lib/api/laboran.api";
import type { Jadwal, Laboratorium } from "@/types/jadwal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function JadwalApprovalPage() {
  const [loading, setLoading] = useState(true);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [labList, setLabList] = useState<Laboratorium[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "cancelled"
  >("all");
  const [labFilter, setLabFilter] = useState<string>("all");

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reactivate dialog
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadData();
  }, [statusFilter, labFilter]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
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
      console.error("Error loading data:", error);
      toast.error(error.message || "Gagal memuat data jadwal");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
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

      toast.success("Jadwal berhasil dibatalkan");
      setShowCancelDialog(false);
      setSelectedJadwal(null);
      setCancellationReason("");
      loadData();
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

      toast.success("Jadwal berhasil diaktifkan kembali");
      setShowReactivateDialog(false);
      setSelectedJadwal(null);
      loadData();
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
    total: jadwalList.length,
    approved: jadwalList.filter((j) => j.status === "approved").length,
    cancelled: jadwalList.filter((j) => j.status === "cancelled").length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jadwal Praktikum"
        description="Monitor dan kelola semua jadwal praktikum (Hybrid Approval Workflow)"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Jadwal
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aktif (Approved)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dibatalkan
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <CardTitle>Filter Jadwal</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="approved">Aktif (Approved)</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Laboratorium</Label>
              <Select
                value={labFilter}
                onValueChange={(value) => setLabFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lab</SelectItem>
                  {labList.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.nama_lab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jadwal Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          {jadwalList.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Tidak ada jadwal"
              description="Belum ada jadwal yang sesuai dengan filter"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Mata Kuliah / Kelas</TableHead>
                  <TableHead>Laboratorium</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jadwalList.map((jadwal) => (
                  <TableRow key={jadwal.id}>
                    <TableCell>
                      {jadwal.tanggal_praktikum
                        ? format(
                            new Date(jadwal.tanggal_praktikum),
                            "dd MMM yyyy",
                            { locale: localeId },
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {jadwal.jam_mulai} - {jadwal.jam_selesai}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {(jadwal.kelas as any)?.mata_kuliah?.nama_mk ||
                            "Praktikum"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(jadwal.kelas as any)?.nama_kelas || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(jadwal.laboratorium as any)?.nama_lab || "-"}
                    </TableCell>
                    <TableCell>
                      {jadwal.status === "approved" ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Dibatalkan
                          </Badge>
                          {jadwal.cancelled_by && (
                            <div className="text-xs text-gray-500">
                              <div>
                                Oleh:{" "}
                                {(jadwal as any).cancelled_by_user?.full_name}
                              </div>
                              {jadwal.cancelled_at && (
                                <div>
                                  {format(
                                    new Date(jadwal.cancelled_at),
                                    "dd MMM HH:mm",
                                    { locale: localeId },
                                  )}
                                </div>
                              )}
                              {jadwal.cancellation_reason && (
                                <div className="italic">
                                  "{jadwal.cancellation_reason}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {jadwal.status === "approved" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(jadwal)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivateClick(jadwal)}
                          className="gap-2 text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Aktifkan
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Batalkan Jadwal Praktikum
            </DialogTitle>
            <DialogDescription>
              Jadwal akan dihilangkan dari calendar dosen dan mahasiswa. Anda
              dapat mengaktifkan kembali jadwal ini nanti.
            </DialogDescription>
          </DialogHeader>

          {selectedJadwal && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Mata Kuliah:</span>{" "}
                  {(selectedJadwal.kelas as any)?.mata_kuliah?.nama_mk ||
                    "Praktikum"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Kelas:</span>{" "}
                  {(selectedJadwal.kelas as any)?.nama_kelas || "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lab:</span>{" "}
                  {(selectedJadwal.laboratorium as any)?.nama_lab || "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tanggal:</span>{" "}
                  {selectedJadwal.tanggal_praktikum
                    ? format(
                        new Date(selectedJadwal.tanggal_praktikum),
                        "dd MMMM yyyy",
                        { locale: localeId },
                      )
                    : "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Waktu:</span>{" "}
                  {selectedJadwal.jam_mulai} - {selectedJadwal.jam_selesai}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Contoh: Lab sedang maintenance, peralatan rusak, dll"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

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
              {submitting ? "Membatalkan..." : "Batalkan Jadwal"}
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
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-500" />
              Aktifkan Kembali Jadwal
            </DialogTitle>
            <DialogDescription>
              Jadwal akan muncul kembali di calendar dosen dan mahasiswa.
            </DialogDescription>
          </DialogHeader>

          {selectedJadwal && (
            <div className="py-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Mata Kuliah:</span>{" "}
                  {(selectedJadwal.kelas as any)?.mata_kuliah?.nama_mk ||
                    "Praktikum"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Kelas:</span>{" "}
                  {(selectedJadwal.kelas as any)?.nama_kelas || "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lab:</span>{" "}
                  {(selectedJadwal.laboratorium as any)?.nama_lab || "-"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Tanggal:</span>{" "}
                  {selectedJadwal.tanggal_praktikum
                    ? format(
                        new Date(selectedJadwal.tanggal_praktikum),
                        "dd MMMM yyyy",
                        { locale: localeId },
                      )
                    : "-"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleReactivateConfirm}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Mengaktifkan..." : "Aktifkan Kembali"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JadwalApprovalPage;
