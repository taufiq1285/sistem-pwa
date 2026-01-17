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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  PermintaanPerbaikanWithRelations,
  PermintaanStatsForDosen,
} from "@/types/permintaan-perbaikan.types";
import {
  KOMPONEN_NILAI_LABELS,
  STATUS_PERMINTAAN_LABELS,
  STATUS_COLORS,
} from "@/types/permintaan-perbaikan.types";
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

export function PermintaanPerbaikanTab({ dosenId }: PermintaanPerbaikanTabProps) {
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
  const [nilaiBaru, setNilaiBaru] = useState("");
  const [responseDosen, setResponseDosen] = useState("");
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
    setNilaiBaru(permintaan.nilai_usulan?.toString() || "");
    setResponseDosen("");
    setReviewDialogOpen(true);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedPermintaan) return;

    // Validation
    if (reviewAction === "approve") {
      if (!nilaiBaru || parseFloat(nilaiBaru) < 0 || parseFloat(nilaiBaru) > 100) {
        toast.error("Nilai baru harus diisi (0-100)");
        return;
      }
    } else {
      if (!responseDosen.trim()) {
        toast.error("Alasan penolakan harus diisi");
        return;
      }
    }

    try {
      setProcessing(true);

      if (reviewAction === "approve") {
        await approvePermintaan({
          permintaan_id: selectedPermintaan.id,
          nilai_baru: parseFloat(nilaiBaru),
          response_dosen: responseDosen || undefined,
          reviewed_by: dosenId,
        });
        toast.success(
          `Permintaan disetujui. Nilai ${KOMPONEN_NILAI_LABELS[selectedPermintaan.komponen_nilai]} diupdate ke ${nilaiBaru}`,
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
              Komponen Terbanyak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats?.by_komponen ? (
                Object.entries(stats.by_komponen)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 2)
                  .map(([key, count]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">
                        {KOMPONEN_NILAI_LABELS[key as keyof typeof KOMPONEN_NILAI_LABELS]}
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))
              ) : (
                <span className="text-gray-400">Tidak ada data</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Catatan:</strong> Saat Anda menyetujui permintaan, nilai mahasiswa akan{" "}
          <strong>otomatis diupdate</strong> dan mahasiswa akan menerima notifikasi.
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
                    <TableHead>Komponen</TableHead>
                    <TableHead className="text-center">Nilai Lama</TableHead>
                    <TableHead className="text-center">Nilai Usulan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permintaanList.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.mahasiswa?.user.full_name}</div>
                        <div className="text-xs text-gray-500">{req.mahasiswa?.nim}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {req.kelas?.mata_kuliah?.nama_mk}
                        </div>
                        <div className="text-xs text-gray-500">
                          {req.kelas?.mata_kuliah?.kode_mk}
                        </div>
                      </TableCell>
                      <TableCell>{req.kelas?.nama_kelas}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {KOMPONEN_NILAI_LABELS[req.komponen_nilai]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {req.nilai_lama}
                      </TableCell>
                      <TableCell className="text-center">
                        {req.nilai_usulan ? (
                          <span className="font-semibold text-blue-600">
                            {req.nilai_usulan}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(req.created_at)}</TableCell>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Permintaan Perbaikan Nilai</DialogTitle>
            <DialogDescription>
              {selectedPermintaan?.mahasiswa?.user.full_name} (
              {selectedPermintaan?.mahasiswa?.nim})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Permintaan Details */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Detail Permintaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mata Kuliah:</span>
                  <span className="font-medium">
                    {selectedPermintaan?.kelas?.mata_kuliah?.nama_mk}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kelas:</span>
                  <span className="font-medium">
                    {selectedPermintaan?.kelas?.nama_kelas}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Komponen:</span>
                  <Badge variant="outline">
                    {selectedPermintaan &&
                      KOMPONEN_NILAI_LABELS[selectedPermintaan.komponen_nilai]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nilai Saat Ini:</span>
                  <span className="font-bold text-lg">
                    {selectedPermintaan?.nilai_lama}
                  </span>
                </div>
                {selectedPermintaan?.nilai_usulan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nilai Usulan:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {selectedPermintaan.nilai_usulan}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alasan Mahasiswa */}
            <div>
              <Label>Alasan dari Mahasiswa</Label>
              <Textarea
                value={selectedPermintaan?.alasan_permintaan || ""}
                readOnly
                className="mt-1 bg-gray-50"
                rows={3}
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
                <div>
                  <Label>
                    Nilai Baru <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={nilaiBaru}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setNilaiBaru(value);
                      }
                    }}
                    placeholder="0-100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Catatan untuk Mahasiswa (Opsional)</Label>
                  <Textarea
                    value={responseDosen}
                    onChange={(e) => setResponseDosen(e.target.value)}
                    placeholder="Contoh: Setelah review ulang jawaban Anda..."
                    rows={2}
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
              disabled={processing}
              variant={reviewAction === "approve" ? "default" : "destructive"}
              className="gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {reviewAction === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Setujui & Update Nilai
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
