/**
 * PermintaanPerbaikanTab Component
 *
 * Tab untuk dosen review dan approve/reject permintaan perbaikan nilai
 */

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getPermintaanPendingForDosen,
  approvePermintaan,
  rejectPermintaan,
  getPermintaanStatsForDosen,
} from "@/lib/api/permintaan-perbaikan.api";
import type {
  BentukPerbaikanNilai,
  PermintaanPerbaikanWithRelations,
  PermintaanStatsForDosen,
} from "@/types/permintaan-perbaikan.types";
import { BENTUK_PERBAIKAN_LABELS } from "@/types/permintaan-perbaikan.types";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface PermintaanPerbaikanTabProps {
  dosenId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PermintaanPerbaikanTab({
  dosenId,
}: PermintaanPerbaikanTabProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [permintaanList, setPermintaanList] = useState<
    PermintaanPerbaikanWithRelations[]
  >([]);
  const [stats, setStats] = useState<PermintaanStatsForDosen | null>(null);

  // Review Dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPermintaan, setSelectedPermintaan] =
    useState<PermintaanPerbaikanWithRelations | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [responseDosen, setResponseDosen] = useState("");
  const [bentukPerbaikan, setBentukPerbaikan] = useState<
    BentukPerbaikanNilai | ""
  >("");
  const [instruksiPerbaikan, setInstruksiPerbaikan] = useState("");
  const [processing, setProcessing] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [dosenId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, statsData] = await Promise.all([
        getPermintaanPendingForDosen(dosenId),
        getPermintaanStatsForDosen(dosenId),
      ]);

      setPermintaanList(pendingData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading permintaan:", error);
      toast.error("Gagal memuat data permintaan");
    } finally {
      setLoading(false);
    }
  };

  // Open review dialog
  const handleReview = (
    permintaan: PermintaanPerbaikanWithRelations,
    action: "approve" | "reject",
  ) => {
    setSelectedPermintaan(permintaan);
    setReviewAction(action);
    setResponseDosen("");
    setBentukPerbaikan("");
    setInstruksiPerbaikan("");
    setReviewDialogOpen(true);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedPermintaan) return;

    if (reviewAction === "approve") {
      if (!bentukPerbaikan) {
        toast.error("Pilih bentuk perbaikan nilai");
        return;
      }

      if (!instruksiPerbaikan.trim()) {
        toast.error("Instruksi perbaikan untuk mahasiswa harus diisi");
        return;
      }
    }

    if (reviewAction === "reject") {
      if (!responseDosen.trim()) {
        toast.error("Alasan penolakan harus diisi");
        return;
      }
    }

    try {
      setProcessing(true);

      if (reviewAction === "approve") {
        const approvedBentukPerbaikan = bentukPerbaikan as BentukPerbaikanNilai;

        await approvePermintaan({
          permintaan_id: selectedPermintaan.id,
          nilai_baru: null,
          bentuk_perbaikan: approvedBentukPerbaikan,
          instruksi_perbaikan: instruksiPerbaikan.trim(),
          response_dosen: instruksiPerbaikan.trim(),
          reviewed_by: dosenId,
        });
        toast.success(
          "Permintaan disetujui. Silakan perbarui nilai melalui tab Penilaian Mahasiswa.",
        );
      } else {
        await rejectPermintaan({
          permintaan_id: selectedPermintaan.id,
          response_dosen: responseDosen,
          reviewed_by: dosenId,
        });
        toast.success("Permintaan ditolak");
      }

      setReviewDialogOpen(false);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Gagal memproses permintaan");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menunggu Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="text-3xl font-bold">{stats?.total_pending || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sudah Direview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-3xl font-bold">{stats?.total_reviewed || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <p className="text-3xl font-bold">
                {stats?.approval_rate?.toFixed(0) || 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Konteks Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats?.by_komponen ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Nilai mata kuliah</span>
                  <span className="font-semibold">
                    {Object.values(stats.by_komponen).reduce(
                      (total, count) => total + count,
                      0,
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">Tidak ada data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Catatan:</strong> Persetujuan hanya menandai pengajuan sebagai
          diterima. Nilai akhir tetap diperbarui manual melalui tab{" "}
          <strong>Penilaian Mahasiswa</strong> agar kalkulasi bobot tetap aman.
        </AlertDescription>
      </Alert>

      {/* Pending Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permintaan Perbaikan Nilai Pending</CardTitle>
          <CardDescription>
            Permintaan dari mahasiswa yang menunggu review Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permintaanList.length === 0 ? (
            <Alert>
              <AlertDescription>
                Tidak ada permintaan perbaikan nilai yang menunggu review
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Konteks</TableHead>
                    <TableHead className="text-center">Nilai Lama</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permintaanList.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">
                          {req.mahasiswa?.user.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {req.mahasiswa?.nim}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {req.mata_kuliah?.nama_mk ||
                            req.kelas?.mata_kuliah?.nama_mk}
                        </div>
                        <div className="text-xs text-gray-500">
                          {req.mata_kuliah?.kode_mk ||
                            req.kelas?.mata_kuliah?.kode_mk}
                          {req.target_dosen?.user?.full_name && (
                            <span className="ml-2">
                              Tujuan: {req.target_dosen.user.full_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{req.kelas?.nama_kelas}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          Nilai Mata Kuliah
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {req.nilai_lama}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(req.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(req, "approve")}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Review
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto p-5 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Review Permintaan Perbaikan
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedPermintaan?.mahasiswa?.user.full_name} (
              {selectedPermintaan?.mahasiswa?.nim})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Permintaan Details */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="grid gap-2 p-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mata Kuliah
                  </span>
                  <p className="font-medium">
                    {selectedPermintaan?.mata_kuliah?.nama_mk ||
                      selectedPermintaan?.kelas?.mata_kuliah?.nama_mk}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Dosen Tujuan
                  </span>
                  <p className="font-medium">
                    {selectedPermintaan?.target_dosen?.user?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Kelas
                  </span>
                  <p className="font-medium">
                    {selectedPermintaan?.kelas?.nama_kelas}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Konteks
                  </span>
                  <Badge variant="outline" className="mt-1 rounded-full">
                    Nilai Mata Kuliah
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nilai Saat Ini
                  </span>
                  <p className="text-lg font-bold">
                    {selectedPermintaan?.nilai_lama}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alasan Mahasiswa */}
            <div>
              <Label>Alasan dari Mahasiswa</Label>
              <Textarea
                value={selectedPermintaan?.alasan_permintaan || ""}
                readOnly
                className="mt-1 bg-gray-50"
                rows={2}
              />
            </div>

            {/* Action Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setReviewAction("approve")}
                className={`px-4 py-2 font-medium transition-colors ${
                  reviewAction === "approve"
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Setujui
              </button>
              <button
                onClick={() => setReviewAction("reject")}
                className={`px-4 py-2 font-medium transition-colors ${
                  reviewAction === "reject"
                    ? "border-b-2 border-red-600 text-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <XCircle className="inline h-4 w-4 mr-1" />
                Tolak
              </button>
            </div>

            {/* Approve Form */}
            {reviewAction === "approve" && (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Persetujuan ini tidak mengubah nilai otomatis. Setelah
                    disetujui, perbarui nilai final mahasiswa dari tab Penilaian
                    Mahasiswa.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>
                    Bentuk Perbaikan <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={bentukPerbaikan}
                    onValueChange={(value) =>
                      setBentukPerbaikan(value as BentukPerbaikanNilai)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih bentuk perbaikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BENTUK_PERBAIKAN_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Instruksi untuk Mahasiswa{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={instruksiPerbaikan}
                    onChange={(e) => setInstruksiPerbaikan(e.target.value)}
                    placeholder="Contoh: Ikuti remedial pada Jumat pukul 10.00, pelajari kembali materi bab 2 dan 3."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Reject Form */}
            {reviewAction === "reject" && (
              <div>
                <Label>
                  Alasan Penolakan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={responseDosen}
                  onChange={(e) => setResponseDosen(e.target.value)}
                  placeholder="Jelaskan mengapa permintaan ditolak..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={
                processing ||
                (reviewAction === "approve" &&
                  (!bentukPerbaikan || !instruksiPerbaikan.trim()))
              }
              variant={reviewAction === "approve" ? "default" : "destructive"}
              className="gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {reviewAction === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Tandai Disetujui
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
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
