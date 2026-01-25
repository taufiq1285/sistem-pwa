/**
 * Peminjaman Aktif Page for Laboran
 *
 * Manage active borrowings and returns
 * Features:
 * - View active borrowings (approved but not returned)
 * - Mark borrowings as returned
 * - Track overdue borrowings
 * - View return history
 * - Input return condition and fines
 */

import { useState, useEffect } from "react";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  FileText,
  DollarSign,
  History,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getActiveBorrowings,
  getReturnedBorrowings,
  markBorrowingReturned,
  type ActiveBorrowing,
  type ReturnedBorrowing,
} from "@/lib/api/laboran.api";
import { getRBACErrorMessage } from "@/lib/errors/permission.errors";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

// ============================================================================
// COMPONENT
// ============================================================================

export default function PeminjamanAktifPage() {
  const [activeBorrowings, setActiveBorrowings] = useState<ActiveBorrowing[]>(
    [],
  );
  const [returnedBorrowings, setReturnedBorrowings] = useState<
    ReturnedBorrowing[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [returnedLoading, setReturnedLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Return dialog state
  const [returnDialog, setReturnDialog] = useState<{
    open: boolean;
    borrowing: ActiveBorrowing | null;
  }>({
    open: false,
    borrowing: null,
  });

  const [returnForm, setReturnForm] = useState({
    kondisi: "baik" as "baik" | "rusak_ringan" | "rusak_berat" | "maintenance",
    keterangan: "",
    denda: 0,
  });

  useEffect(() => {
    loadActiveBorrowings(false);
  }, []);

  const loadActiveBorrowings = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await cacheAPI(
        "laboran_active_borrowings",
        () => getActiveBorrowings(100),
        {
          ttl: 3 * 60 * 1000, // 3 minutes - active borrowings change frequently
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setActiveBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat peminjaman aktif");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadReturnedBorrowings = async (forceRefresh = false) => {
    try {
      setReturnedLoading(true);
      const data = await cacheAPI(
        "laboran_returned_borrowings",
        () => getReturnedBorrowings(50),
        {
          ttl: 10 * 60 * 1000, // 10 minutes - history is more stable
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setReturnedBorrowings(data);
    } catch (error) {
      toast.error("Gagal memuat riwayat pengembalian");
      console.error(error);
    } finally {
      setReturnedLoading(false);
    }
  };

  const handleOpenReturnDialog = (borrowing: ActiveBorrowing) => {
    setReturnDialog({ open: true, borrowing });
    // Auto calculate denda if overdue
    const suggestedDenda = borrowing.is_overdue
      ? borrowing.days_overdue * 5000 // Rp 5.000 per hari
      : 0;
    setReturnForm({
      kondisi: "baik",
      keterangan: "",
      denda: suggestedDenda,
    });
  };

  const handleMarkAsReturned = async () => {
    if (!returnDialog.borrowing) return;

    try {
      setProcessing(true);
      await markBorrowingReturned(
        returnDialog.borrowing.id,
        returnForm.kondisi,
        returnForm.keterangan,
        returnForm.denda,
      );

      toast.success("Peminjaman berhasil ditandai sebagai dikembalikan");
      setReturnDialog({ open: false, borrowing: null });
      setReturnForm({ kondisi: "baik", keterangan: "", denda: 0 });

      // Invalidate cache and reload data
      await invalidateCache("laboran_active_borrowings");
      await invalidateCache("laboran_returned_borrowings");
      await loadActiveBorrowings(true);
      if (returnedBorrowings.length > 0) {
        await loadReturnedBorrowings(true);
      }
    } catch (error) {
      console.error("Error marking borrowing as returned:", error);
      const errorMessage = getRBACErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case "baik":
        return (
          <Badge variant="default" className="bg-green-600">
            Baik
          </Badge>
        );
      case "rusak_ringan":
        return (
          <Badge variant="default" className="bg-yellow-600">
            Rusak Ringan
          </Badge>
        );
      case "rusak_berat":
        return <Badge variant="destructive">Rusak Berat</Badge>;
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{kondisi}</Badge>;
    }
  };

  const overdueCount = activeBorrowings.filter((b) => b.is_overdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Kelola Peminjaman Alat</h1>
        <p className="text-muted-foreground">
          Pantau peminjaman aktif dan tandai barang yang sudah dikembalikan
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sedang Dipinjam
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBorrowings.length}</div>
            <p className="text-xs text-muted-foreground">
              Alat yang belum dikembalikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Melebihi tanggal kembali
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dikembalikan Hari Ini
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                returnedBorrowings.filter((r) => {
                  const today = new Date().toDateString();
                  const returnDate = new Date(
                    r.tanggal_kembali_aktual,
                  ).toDateString();
                  return today === returnDate;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Pengembalian hari ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Package className="h-4 w-4" />
            Sedang Dipinjam ({activeBorrowings.length})
          </TabsTrigger>
          <TabsTrigger
            value="returned"
            className="gap-2"
            onClick={() => {
              if (returnedBorrowings.length === 0) {
                loadReturnedBorrowings(false);
              }
            }}
          >
            <History className="h-4 w-4" />
            Riwayat Pengembalian
          </TabsTrigger>
        </TabsList>

        {/* Active Borrowings Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Peminjaman Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : activeBorrowings.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    Tidak Ada Peminjaman Aktif
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Semua alat sudah dikembalikan
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
                        <TableHead>Tgl Pinjam</TableHead>
                        <TableHead>Harus Kembali</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Kondisi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeBorrowings.map((borrowing) => (
                        <TableRow key={borrowing.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {borrowing.peminjam_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {borrowing.peminjam_nim}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {borrowing.inventaris_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {borrowing.inventaris_kode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {borrowing.laboratorium_nama}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {borrowing.jumlah_pinjam}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(borrowing.tanggal_pinjam)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(borrowing.tanggal_kembali_rencana)}
                          </TableCell>
                          <TableCell>
                            {borrowing.is_overdue ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Terlambat {borrowing.days_overdue} hari
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-blue-600">
                                Sedang Dipinjam
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {getKondisiBadge(borrowing.kondisi_pinjam)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleOpenReturnDialog(borrowing)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Sudah Kembali
                            </Button>
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

        {/* Returned Borrowings Tab */}
        <TabsContent value="returned">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pengembalian</CardTitle>
            </CardHeader>
            <CardContent>
              {returnedLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Memuat riwayat...</p>
                </div>
              ) : returnedBorrowings.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-1">
                    Belum Ada Riwayat Pengembalian
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Riwayat akan muncul setelah ada peminjaman yang dikembalikan
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
                        <TableHead>Tgl Pinjam</TableHead>
                        <TableHead>Tgl Dikembalikan</TableHead>
                        <TableHead>Kondisi Pinjam</TableHead>
                        <TableHead>Kondisi Kembali</TableHead>
                        <TableHead>Denda</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnedBorrowings.map((borrowing) => (
                        <TableRow key={borrowing.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {borrowing.peminjam_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {borrowing.peminjam_nim}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {borrowing.inventaris_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {borrowing.inventaris_kode}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {borrowing.jumlah_pinjam}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(borrowing.tanggal_pinjam)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">
                                {formatDate(borrowing.tanggal_kembali_aktual)}
                              </div>
                              {borrowing.was_overdue && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs mt-1"
                                >
                                  Terlambat
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getKondisiBadge(borrowing.kondisi_pinjam)}
                          </TableCell>
                          <TableCell>
                            {getKondisiBadge(borrowing.kondisi_kembali)}
                          </TableCell>
                          <TableCell>
                            {borrowing.denda > 0 ? (
                              <span className="text-sm font-semibold text-red-600">
                                {formatCurrency(borrowing.denda)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span
                              className="text-sm truncate"
                              title={borrowing.keterangan_kembali || "-"}
                            >
                              {borrowing.keterangan_kembali || "-"}
                            </span>
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

      {/* Return Dialog */}
      <Dialog
        open={returnDialog.open}
        onOpenChange={(open) => {
          if (!processing) {
            setReturnDialog({ ...returnDialog, open });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tandai Sebagai Dikembalikan</DialogTitle>
            <DialogDescription>
              Isi detail pengembalian alat dan stok akan otomatis dikembalikan
            </DialogDescription>
          </DialogHeader>

          {returnDialog.borrowing && (
            <div className="space-y-4 py-4">
              {/* Borrowing Info */}
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peminjam:</span>
                  <span className="font-medium">
                    {returnDialog.borrowing.peminjam_nama}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alat:</span>
                  <span className="font-medium">
                    {returnDialog.borrowing.inventaris_nama}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="font-medium">
                    {returnDialog.borrowing.jumlah_pinjam}
                  </span>
                </div>
                {returnDialog.borrowing.is_overdue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="destructive" className="text-xs">
                      Terlambat {returnDialog.borrowing.days_overdue} hari
                    </Badge>
                  </div>
                )}
              </div>

              {/* Kondisi Kembali */}
              <div className="space-y-2">
                <Label htmlFor="kondisi">
                  Kondisi Barang Saat Dikembalikan{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={returnForm.kondisi}
                  onValueChange={(value: any) =>
                    setReturnForm({ ...returnForm, kondisi: value })
                  }
                >
                  <SelectTrigger id="kondisi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                <Textarea
                  id="keterangan"
                  placeholder="Catatan tambahan tentang kondisi barang..."
                  value={returnForm.keterangan}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, keterangan: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Denda */}
              <div className="space-y-2">
                <Label htmlFor="denda">Denda (Rp)</Label>
                <Input
                  id="denda"
                  type="text"
                  inputMode="numeric"
                  value={returnForm.denda}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setReturnForm({
                        ...returnForm,
                        denda: value === "" ? 0 : parseInt(value),
                      });
                    }
                  }}
                />
                {returnDialog.borrowing.is_overdue && (
                  <p className="text-xs text-muted-foreground">
                    Saran: Rp 5.000/hari × {returnDialog.borrowing.days_overdue}{" "}
                    hari ={" "}
                    {formatCurrency(returnDialog.borrowing.days_overdue * 5000)}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnDialog({ ...returnDialog, open: false })}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleMarkAsReturned}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tandai Sudah Kembali
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
