/**
 * Persetujuan (Approval) Page for Laboran
 *
 * Quick approval dashboard for pending equipment borrowing and room booking requests.
 * This page focuses exclusively on pending approvals for fast processing.
 *
 * Features:
 * - View pending equipment borrowing requests
 * - View pending room booking requests
 * - Quick approve/reject actions
 * - Alert banner for pending requests
 * - Statistics cards
 * - Validation and error handling
 */

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils/format";
import {
  getPendingApprovals,
  approvePeminjaman,
  rejectPeminjaman,
  type PendingApproval,
} from "@/lib/api/laboran.api";
import {
  getPendingRoomBookings,
  approveRoomBooking,
  rejectRoomBooking,
  type RoomBookingRequest,
} from "@/lib/api/peminjaman-extensions";

export default function PersetujuanPage() {
  // State for equipment borrowing
  const [equipmentRequests, setEquipmentRequests] = useState<PendingApproval[]>(
    [],
  );
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  // State for room booking
  const [roomRequests, setRoomRequests] = useState<RoomBookingRequest[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Dialog states
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    type: "equipment" | "room";
    id: string;
    name: string;
  }>({
    open: false,
    type: "equipment",
    id: "",
    name: "",
  });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    type: "equipment" | "room";
    id: string;
    name: string;
  }>({
    open: false,
    type: "equipment",
    id: "",
    name: "",
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    await Promise.all([loadEquipmentRequests(), loadRoomRequests()]);
  };

  const loadEquipmentRequests = async () => {
    try {
      setLoadingEquipment(true);
      const data = await getPendingApprovals(50);
      setEquipmentRequests(data);
    } catch (error) {
      toast.error("Gagal memuat permintaan peminjaman alat");
      console.error("Error loading equipment requests:", error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const loadRoomRequests = async () => {
    try {
      setLoadingRoom(true);
      const data = await getPendingRoomBookings(50);
      setRoomRequests(data);
    } catch (error) {
      toast.error("Gagal memuat permintaan booking ruangan");
      console.error("Error loading room requests:", error);
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleRefresh = () => {
    loadPendingRequests();
    toast.success("Data diperbarui");
  };

  // Approve handlers
  const openApproveDialog = (
    type: "equipment" | "room",
    id: string,
    name: string,
  ) => {
    setApproveDialog({ open: true, type, id, name });
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);

      if (approveDialog.type === "equipment") {
        await approvePeminjaman(approveDialog.id);
        toast.success("Peminjaman alat berhasil disetujui");
        await loadEquipmentRequests();
      } else {
        await approveRoomBooking(approveDialog.id);
        toast.success("Booking ruangan berhasil disetujui");
        await loadRoomRequests();
      }

      setApproveDialog({ open: false, type: "equipment", id: "", name: "" });
    } catch (error) {
      toast.error("Gagal menyetujui permintaan");
      console.error("Error approving request:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Reject handlers
  const openRejectDialog = (
    type: "equipment" | "room",
    id: string,
    name: string,
  ) => {
    setRejectDialog({ open: true, type, id, name });
    setRejectionReason("");
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    try {
      setProcessing(true);

      if (rejectDialog.type === "equipment") {
        await rejectPeminjaman(rejectDialog.id, rejectionReason);
        toast.success("Peminjaman alat berhasil ditolak");
        await loadEquipmentRequests();
      } else {
        await rejectRoomBooking(rejectDialog.id, rejectionReason);
        toast.success("Booking ruangan berhasil ditolak");
        await loadRoomRequests();
      }

      setRejectDialog({ open: false, type: "equipment", id: "", name: "" });
      setRejectionReason("");
    } catch (error) {
      toast.error("Gagal menolak permintaan");
      console.error("Error rejecting request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = equipmentRequests.length + roomRequests.length;
  const isLoading = loadingEquipment || loadingRoom;

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Persetujuan</h1>
          <p className="text-muted-foreground">
            Kelola persetujuan peminjaman alat dan booking ruangan
          </p>
        </div>
        {/* Alert Banner */}
        {totalPending > 0 && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              Ada permintaan yang menunggu persetujuan
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Terdapat {totalPending} permintaan yang perlu ditinjau dan
              disetujui.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Peminjaman Alat
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {equipmentRequests.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Permintaan peminjaman yang perlu disetujui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Booking Ruangan
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Permintaan booking ruangan yang perlu disetujui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Equipment Borrowing Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Permintaan Peminjaman Alat</CardTitle>
            <CardDescription>
              Daftar permintaan peminjaman alat yang menunggu persetujuan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEquipment ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Memuat data...
                  </p>
                </div>
              </div>
            ) : equipmentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  Tidak Ada Permintaan Pending
                </h3>
                <p className="text-sm text-muted-foreground">
                  Semua permintaan peminjaman alat sudah diproses
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peminjam</TableHead>
                      <TableHead>Alat</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tanggal Pinjam</TableHead>
                      <TableHead>Tanggal Kembali</TableHead>
                      <TableHead>Keperluan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.peminjam_nama}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.peminjam_nim}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.inventaris_nama}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.inventaris_kode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{request.laboratorium_nama}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {request.jumlah_pinjam}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(request.tanggal_pinjam)}
                        </TableCell>
                        <TableCell>
                          {formatDate(request.tanggal_kembali_rencana)}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={request.keperluan}
                        >
                          {request.keperluan}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() =>
                                openApproveDialog(
                                  "equipment",
                                  request.id,
                                  request.inventaris_nama,
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() =>
                                openRejectDialog(
                                  "equipment",
                                  request.id,
                                  request.inventaris_nama,
                                )
                              }
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Room Booking Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Permintaan Booking Ruangan</CardTitle>
            <CardDescription>
              Daftar permintaan booking ruangan laboratorium yang menunggu
              persetujuan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRoom ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Memuat data...
                  </p>
                </div>
              </div>
            ) : roomRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  Tidak Ada Permintaan Pending
                </h3>
                <p className="text-sm text-muted-foreground">
                  Semua permintaan booking ruangan sudah diproses
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Topik</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.kelas_nama}
                        </TableCell>
                        <TableCell>{request.mata_kuliah_nama}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.dosen_nama}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.dosen_nip}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.laboratorium_nama}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.laboratorium_kode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {request.laboratorium_kapasitas}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {request.hari}
                        </TableCell>
                        <TableCell>
                          {request.jam_mulai} - {request.jam_selesai}
                        </TableCell>
                        <TableCell>
                          {request.tanggal_praktikum
                            ? formatDate(request.tanggal_praktikum)
                            : "-"}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={request.topik || "-"}
                        >
                          {request.topik || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() =>
                                openApproveDialog(
                                  "room",
                                  request.id,
                                  `${request.kelas_nama} - ${request.laboratorium_nama}`,
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() =>
                                openRejectDialog(
                                  "room",
                                  request.id,
                                  `${request.kelas_nama} - ${request.laboratorium_nama}`,
                                )
                              }
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
              Apakah Anda yakin ingin menyetujui permintaan ini?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <span className="font-medium">
                {approveDialog.type === "equipment"
                  ? "Peminjaman Alat"
                  : "Booking Ruangan"}
                :
              </span>{" "}
              {approveDialog.name}
            </p>
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
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
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
              Berikan alasan penolakan untuk permintaan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm mb-2">
                <span className="font-medium">
                  {rejectDialog.type === "equipment"
                    ? "Peminjaman Alat"
                    : "Booking Ruangan"}
                  :
                </span>{" "}
                {rejectDialog.name}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Alasan Penolakan <span className="text-red-500">*</span>
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
                  Alasan penolakan wajib diisi
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
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak Permintaan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
