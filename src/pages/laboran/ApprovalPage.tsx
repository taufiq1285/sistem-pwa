import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  getPendingApprovals,
  approvePeminjaman,
  rejectPeminjaman,
} from "@/lib/api/laboran.api";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

// ============================================================================
// TYPES
// ============================================================================

interface PendingApproval {
  id: string;
  peminjam_nama: string;
  peminjam_nim: string;
  inventaris_nama: string;
  inventaris_kode: string;
  laboratorium_nama: string;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  created_at: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ApprovalPage() {
  const [requests, setRequests] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadRequests(false);
  }, []);

  const loadRequests = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await cacheAPI(
        "laboran_pending_approvals",
        () => getPendingApprovals(100),
        {
          ttl: 2 * 60 * 1000, // 2 minutes - approvals need fresh data
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setRequests(data);
    } catch (error) {
      toast.error("Gagal memuat requests peminjaman");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(requestId);
      await approvePeminjaman(requestId);
      toast.success("Peminjaman disetujui dan stok otomatis berkurang");
      setRequests(requests.filter((r) => r.id !== requestId));
      // Invalidate cache and reload
      await invalidateCache("laboran_pending_approvals");
      await loadRequests(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyetujui peminjaman");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequestId) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setProcessing(selectedRequestId);
      await rejectPeminjaman(selectedRequestId, rejectReason);
      toast.success("Peminjaman ditolak");
      setRequests(requests.filter((r) => r.id !== selectedRequestId));
      setRejectDialogOpen(false);
      setRejectReason("");
      // Invalidate cache and reload
      await invalidateCache("laboran_pending_approvals");
      await loadRequests(true);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menolak peminjaman");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Persetujuan Peminjaman</h1>
        <p className="text-muted-foreground">
          Kelola dan setujui permintaan peminjaman alat dari dosen
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Menunggu Persetujuan
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">
              Requests yang belum diproses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Catatan Penting
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Saat approve: stok <strong>otomatis berkurang</strong>
              <br />
              Saat reject: stok tetap normal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permintaan Peminjaman</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Memuat requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Tidak ada permintaan peminjaman menunggu
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peminjam</TableHead>
                    <TableHead>Alat</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal Pinjam</TableHead>
                    <TableHead>Tanggal Kembali</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {request.peminjam_nama}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.peminjam_nim}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {request.inventaris_nama}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.inventaris_kode}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {request.laboratorium_nama}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {request.jumlah_pinjam}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(request.tanggal_pinjam)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(request.tanggal_kembali_rencana)}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {request.keperluan}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                            className="gap-1"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(request.id)}
                            disabled={processing === request.id}
                            className="gap-1"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Reject
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tolak Permintaan Peminjaman</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa permintaan ini ditolak
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={processing === selectedRequestId}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processing === selectedRequestId}
              className="gap-2"
            >
              {processing === selectedRequestId && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
