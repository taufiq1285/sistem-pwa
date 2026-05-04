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
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
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
import { invalidateCache } from "@/lib/offline/api-cache";

const invalidatePeminjamanCaches = async () => {
  await Promise.all([
    invalidateCache("laboran_pending_approvals"),
    invalidateCache("laboran_active_borrowings"),
    invalidateCache("laboran_return_requested_borrowings"),
    invalidateCache("laboran_returned_borrowings"),
    invalidateCache("dosen_my_borrowings"),
    invalidateCache("dosen_available_equipment"),
  ]);
  window.dispatchEvent(new CustomEvent("peminjaman:changed"));
};

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

      await invalidatePeminjamanCaches();
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

      await invalidatePeminjamanCaches();
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
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <GlassCard
          intensity="medium"
          className="border-border/60 bg-background/80 shadow-xl"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                <Package className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Persetujuan aktif
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Persetujuan Peminjaman Alat
                  </h1>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Tahap awal alur peminjaman alat untuk meninjau permintaan
                    baru yang masih menunggu keputusan laboran.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Setelah disetujui, data pindah ke menu
                    <strong> "Peminjaman Alat"</strong> untuk proses
                    pengembalian alat.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Muat Ulang
            </Button>
          </div>
        </GlassCard>

        {totalPending > 0 && (
          <GlassCard
            intensity="low"
            className="border-warning/30 bg-warning/10 shadow-sm dark:border-warning/30 dark:bg-warning/10"
          >
            <Alert
              variant="default"
              className="border-0 bg-transparent p-0 shadow-none"
            >
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning dark:text-warning">
                Ada permintaan yang menunggu persetujuan
              </AlertTitle>
              <AlertDescription className="text-warning/80 dark:text-warning/80">
                Terdapat {totalPending} permintaan peminjaman alat yang perlu
                ditinjau dan diproses.
              </AlertDescription>
            </Alert>
          </GlassCard>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl border-warning/20 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-warning" />
                Tahap 1: Persetujuan
              </CardTitle>
              <CardDescription>
                Laboran memutuskan permintaan dosen: disetujui atau ditolak
                dengan alasan yang tercatat.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="rounded-3xl border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                Tahap 2: Peminjaman Alat
              </CardTitle>
              <CardDescription>
                Permintaan yang sudah disetujui dikelola di halaman peminjaman
                alat sampai pengembalian selesai dan stok tercatat kembali.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Menunggu Persetujuan"
            value={equipmentRequests.length}
            icon={Package}
            color="amber"
          />
          <DashboardCard
            title="Siap Diproses"
            value={
              equipmentRequests.filter((request) => Boolean(request.id)).length
            }
            icon={CheckCircle}
            color="green"
          />
          <DashboardCard
            title="Perlu Tinjauan"
            value={totalPending}
            icon={Clock}
            color="blue"
          />
        </div>

        <GlassCard
          intensity="low"
          className="border-border/60 bg-background/85 shadow-lg"
        >
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-foreground">
              Permintaan Peminjaman Alat
            </CardTitle>
            <CardDescription>
              Hanya menampilkan permintaan dengan status menunggu persetujuan.
              Peminjaman yang sudah disetujui tidak tampil di tabel ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loadingEquipment ? (
              <DashboardSkeleton />
            ) : equipmentRequests.length === 0 ? (
              <Alert className="border-border/60 bg-muted/40">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-sm text-muted-foreground">
                  Tidak ada permintaan yang menunggu persetujuan. Semua
                  permintaan peminjaman alat sudah diproses.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
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
                    {equipmentRequests.map((request) => (
                      <TableRow key={request.id} className="align-top">
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
                        <TableCell>
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
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success/50 text-success hover:bg-success/10 dark:hover:bg-success/10"
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
              className="bg-success hover:bg-success/90"
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
                Alasan Penolakan <span className="text-danger">*</span>
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
