import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  Package,
  User,
  History,
  Shield,
  UserCog,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPendingApprovals,
  approvePeminjaman,
  rejectPeminjaman,
  getApprovalHistory,
  type ApprovalHistory,
} from "@/lib/api/laboran.api";

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
// HELPER FUNCTIONS
// ============================================================================

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    case "laboran":
      return (
        <Badge variant="default" className="gap-1">
          <UserCog className="h-3 w-3" />
          Laboran
        </Badge>
      );
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
};

const getStatusBadge = (status: "approved" | "rejected") => {
  if (status === "approved") {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle className="h-3 w-3" />
        Disetujui
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Ditolak
    </Badge>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PeminjamanApprovalPage() {
  const [requests, setRequests] = useState<PendingApproval[]>([]);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadRequests();
    loadHistory();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingApprovals(100);
      setRequests(data);
    } catch (error) {
      toast.error("Gagal memuat requests peminjaman");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getApprovalHistory(20);
      setHistory(data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessing(requestId);
      await approvePeminjaman(requestId);
      toast.success("Peminjaman disetujui dan stok otomatis berkurang");
      setRequests(requests.filter((r) => r.id !== requestId));
      // Reload history to show the new approval
      loadHistory();
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
      // Reload history to show the rejection
      loadHistory();
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Persetujuan Peminjaman Alat</h1>
        <p className="text-muted-foreground">
          Sebagai Admin, Anda dapat menyetujui atau menolak permintaan
          peminjaman alat dari mahasiswa dan dosen
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Admin sebagai Backup Laboran
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Ketika laboran tidak hadir, Admin dapat mengambil alih fungsi
                approval peminjaman alat dan laboratorium. Semua approval akan
                tercatat dengan role yang menyetujui.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Role Anda</CardTitle>
            <User className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-base">
                Administrator
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approval dengan role admin
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

      {/* Tabs for Pending and History */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Menunggu Persetujuan ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Riwayat Persetujuan
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="pending">
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
        </TabsContent>

        {/* Approval History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Persetujuan Peminjaman</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Memuat riwayat...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Belum ada riwayat persetujuan
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peminjam</TableHead>
                        <TableHead>Alat</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Disetujui Oleh</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {item.peminjam_nama}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.peminjam_nim}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {item.inventaris_nama}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.inventaris_kode} • {item.laboratorium_nama}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {item.jumlah_pinjam}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-sm">
                            {item.approved_by_nama}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(item.approved_by_role)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(item.approved_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
