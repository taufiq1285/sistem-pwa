/**
 * Persetujuan (Approval) Page for Laboran
 *
 * Quick approval dashboard for pending equipment borrowing requests ONLY.
 * Room booking approval moved to "Kelola Jadwal Praktikum" page.
 *
 * Features:
 * - View pending equipment borrowing requests
 * - Quick approve/reject actions
 * - Alert banner for pending requests
 * - Statistics cards
 * - Validation and error handling
 */

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Package,
  Clock,
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
  notifyDosenPeminjamanDisetujui,
  notifyDosenPeminjamanDitolak,
} from "@/lib/api/notification.api";

export default function PersetujuanPage() {
  // State for equipment borrowing
  const [equipmentRequests, setEquipmentRequests] = useState<PendingApproval[]>(
    [],
  );
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  // Dialog states - store full request details for notifications
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

  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEquipmentRequests();
  }, []);

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

  const handleRefresh = () => {
    loadEquipmentRequests();
    toast.success("Data diperbarui");
  };

  // Approve handlers
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

      // Notify dosen (best-effort, non-blocking)
      if (approveDialog.request?.dosen_user_id) {
        notifyDosenPeminjamanDisetujui(
          approveDialog.request.dosen_user_id,
          approveDialog.request.inventaris_nama,
          approveDialog.request.jumlah_pinjam,
          approveDialog.request.tanggal_pinjam,
          approveDialog.request.tanggal_kembali_rencana,
        ).catch((err) => {
          console.error("Failed to notify dosen:", err);
        });
      }

      await loadEquipmentRequests();
      setApproveDialog({ open: false, id: "", name: "" });
    } catch (error) {
      toast.error("Gagal menyetujui permintaan");
      console.error("Error approving request:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Reject handlers
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

      // Notify dosen (best-effort, non-blocking)
      if (rejectDialog.request?.dosen_user_id) {
        notifyDosenPeminjamanDitolak(
          rejectDialog.request.dosen_user_id,
          rejectDialog.request.inventaris_nama,
          rejectionReason,
        ).catch((err) => {
          console.error("Failed to notify dosen:", err);
        });
      }

      await loadEquipmentRequests();
      setRejectDialog({ open: false, id: "", name: "" });
      setRejectionReason("");
    } catch (error) {
      toast.error("Gagal menolak permintaan");
      console.error("Error rejecting request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const totalPending = equipmentRequests.length;
  const isLoading = loadingEquipment;

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-extrabold">
            Persetujuan Peminjaman Alat
          </h1>
          <p className="text-muted-foreground">
            Kelola persetujuan peminjaman alat laboratorium
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            💡 Untuk persetujuan booking ruangan, lihat menu{" "}
            <strong>"Kelola Jadwal Praktikum"</strong>
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
              Terdapat {totalPending} permintaan peminjaman alat yang perlu
              ditinjau dan disetujui.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Card */}
        <Card className="border-0 shadow-xl p-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Peminjaman Alat
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">
              {equipmentRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Permintaan peminjaman yang perlu disetujui
            </p>
          </CardContent>
        </Card>

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
        <Card className="border-0 shadow-xl p-6">
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
                              onClick={() => openApproveDialog(request)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => openRejectDialog(request)}
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
              <span className="font-medium">Peminjaman Alat:</span>{" "}
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
                <span className="font-medium">Peminjaman Alat:</span>{" "}
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
