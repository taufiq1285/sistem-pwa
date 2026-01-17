/**
 * Kelola Jadwal Praktikum - Laboran
 * UNIFIED: Approval + Management dalam satu halaman dengan tabs
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
  cancelJadwal,
  reactivateJadwal,
} from "@/lib/api/jadwal.api";
import { getLaboratoriumList } from "@/lib/api/laboran.api";
import {
  getPendingRoomBookings,
  approveRoomBooking,
  rejectRoomBooking,
  type RoomBookingRequest,
} from "@/lib/api/peminjaman-extensions";
import type { Jadwal, Laboratorium } from "@/types/jadwal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function JadwalApprovalPage() {
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Data states
  const [pendingBookings, setPendingBookings] = useState<RoomBookingRequest[]>(
    [],
  );
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [labList, setLabList] = useState<Laboratorium[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "cancelled"
  >("all");
  const [labFilter, setLabFilter] = useState<string>("all");

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<RoomBookingRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadPendingBookings();
    loadJadwalData();
  }, []);

  useEffect(() => {
    loadJadwalData();
  }, [statusFilter, labFilter]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadPendingBookings = async () => {
    try {
      setPendingLoading(true);
      const data = await getPendingRoomBookings(50);
      setPendingBookings(data);
    } catch (error: any) {
      console.error("Error loading pending bookings:", error);
      toast.error(error.message || "Gagal memuat permintaan booking");
    } finally {
      setPendingLoading(false);
    }
  };

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
    loadPendingBookings();
    loadJadwalData();
  };

  // ============================================================================
  // APPROVAL HANDLERS
  // ============================================================================

  const handleApproveClick = (booking: RoomBookingRequest) => {
    setSelectedBooking(booking);
    setShowApproveDialog(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedBooking) return;

    try {
      setSubmitting(true);
      await approveRoomBooking(selectedBooking.id);
      toast.success("Booking ruangan berhasil disetujui");
      setShowApproveDialog(false);
      setSelectedBooking(null);
      refreshAll();
    } catch (error: any) {
      console.error("Error approving booking:", error);
      toast.error(error.message || "Gagal menyetujui booking");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (booking: RoomBookingRequest) => {
    setSelectedBooking(booking);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedBooking) return;

    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      await rejectRoomBooking(selectedBooking.id, rejectionReason.trim());
      toast.success("Booking ruangan berhasil ditolak");
      setShowRejectDialog(false);
      setSelectedBooking(null);
      setRejectionReason("");
      refreshAll();
    } catch (error: any) {
      console.error("Error rejecting booking:", error);
      toast.error(error.message || "Gagal menolak booking");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // CANCEL/REACTIVATE HANDLERS
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
      toast.success("Jadwal berhasil diaktifkan kembali");
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
    pending: pendingBookings.length,
    approved: jadwalList.filter((j) => j.status === "approved").length,
    cancelled: jadwalList.filter((j) => j.status === "cancelled").length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jadwal Praktikum"
        description="Kelola persetujuan booking ruangan dan monitor jadwal praktikum"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menunggu Persetujuan
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              Permintaan booking ruangan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jadwal Aktif
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <p className="text-xs text-muted-foreground">
              Jadwal yang sudah disetujui
            </p>
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
            <p className="text-xs text-muted-foreground">
              Jadwal yang dibatalkan
            </p>
          </CardContent>
        </Card>
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
          <TabsTrigger value="cancelled" className="gap-2">
            <History className="h-4 w-4" />
            Riwayat ({stats.cancelled})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Menunggu Persetujuan */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permintaan Booking Ruangan Lab</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPendingBookings}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <LoadingSpinner />
              ) : pendingBookings.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="Tidak ada permintaan pending"
                  description="Semua permintaan booking ruangan sudah diproses"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Topik</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.kelas_nama}
                        </TableCell>
                        <TableCell>{booking.mata_kuliah_nama}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {booking.dosen_nama}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.dosen_nip}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {booking.laboratorium_nama}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.laboratorium_kode} • Kapasitas:{" "}
                              {booking.laboratorium_kapasitas}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {booking.hari}
                        </TableCell>
                        <TableCell>
                          {booking.jam_mulai} - {booking.jam_selesai}
                        </TableCell>
                        <TableCell>
                          {booking.tanggal_praktikum
                            ? format(
                                new Date(booking.tanggal_praktikum),
                                "dd MMM yyyy",
                                {
                                  locale: localeId,
                                },
                              )
                            : "-"}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={booking.topik || "-"}
                        >
                          {booking.topik || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApproveClick(booking)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectClick(booking)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Jadwal Aktif */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <CardTitle>Filter Jadwal Aktif</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadJadwalData}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 mb-4">
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

              {loading ? (
                <LoadingSpinner />
              ) : jadwalList.filter((j) => j.status === "approved").length ===
                0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Tidak ada jadwal aktif"
                  description="Belum ada jadwal yang disetujui"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Mata Kuliah / Kelas</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Topik</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jadwalList
                      .filter((j) => j.status === "approved")
                      .map((jadwal) => (
                        <TableRow key={jadwal.id}>
                          <TableCell>
                            {jadwal.tanggal_praktikum
                              ? format(
                                  new Date(jadwal.tanggal_praktikum),
                                  "dd MMM yyyy",
                                  {
                                    locale: localeId,
                                  },
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
                          <TableCell className="max-w-xs truncate">
                            {jadwal.topik || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(jadwal)}
                              className="gap-2 text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Riwayat (Cancelled) */}
        <TabsContent value="cancelled">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal yang Dibatalkan</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSpinner />
              ) : jadwalList.filter((j) => j.status === "cancelled").length ===
                0 ? (
                <EmptyState
                  icon={History}
                  title="Tidak ada jadwal dibatalkan"
                  description="Belum ada jadwal yang dibatalkan"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Mata Kuliah / Kelas</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jadwalList
                      .filter((j) => j.status === "cancelled")
                      .map((jadwal) => (
                        <TableRow key={jadwal.id}>
                          <TableCell>
                            {jadwal.tanggal_praktikum
                              ? format(
                                  new Date(jadwal.tanggal_praktikum),
                                  "dd MMM yyyy",
                                  {
                                    locale: localeId,
                                  },
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
                            <div className="text-sm">
                              {jadwal.cancellation_reason && (
                                <div className="italic">
                                  "{jadwal.cancellation_reason}"
                                </div>
                              )}
                              {jadwal.cancelled_by && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Oleh:{" "}
                                  {(jadwal as any).cancelled_by_user?.full_name}
                                  {jadwal.cancelled_at && (
                                    <>
                                      {" "}
                                      •{" "}
                                      {format(
                                        new Date(jadwal.cancelled_at),
                                        "dd MMM HH:mm",
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateClick(jadwal)}
                              className="gap-2 text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Aktifkan
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Setujui Booking Ruangan
            </DialogTitle>
            <DialogDescription>
              Jadwal akan aktif dan muncul di calendar dosen dan mahasiswa
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="py-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Kelas:</span>{" "}
                  {selectedBooking.kelas_nama}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Mata Kuliah:</span>{" "}
                  {selectedBooking.mata_kuliah_nama}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Dosen:</span>{" "}
                  {selectedBooking.dosen_nama}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lab:</span>{" "}
                  {selectedBooking.laboratorium_nama}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Waktu:</span>{" "}
                  {selectedBooking.hari}, {selectedBooking.jam_mulai} -{" "}
                  {selectedBooking.jam_selesai}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Memproses..." : "Setujui Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Tolak Booking Ruangan
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk booking ini
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Kelas:</span>{" "}
                  {selectedBooking.kelas_nama}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lab:</span>{" "}
                  {selectedBooking.laboratorium_nama}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reject-reason">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Contoh: Lab sudah dibooking untuk waktu tersebut, bentrok dengan jadwal lain, dll"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

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
              onClick={handleRejectConfirm}
              disabled={submitting || !rejectionReason.trim()}
            >
              {submitting ? "Memproses..." : "Tolak Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Batalkan Jadwal Praktikum
            </DialogTitle>
            <DialogDescription>
              Jadwal akan dihilangkan dari calendar. Anda dapat mengaktifkan
              kembali nanti.
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
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
              Jadwal akan muncul kembali di calendar
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
                  <span className="font-medium">Lab:</span>{" "}
                  {(selectedJadwal.laboratorium as any)?.nama_lab || "-"}
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
