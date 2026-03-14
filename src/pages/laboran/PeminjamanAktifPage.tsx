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
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
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
    const kondisiMap: Record<string, "success" | "warning" | "error" | "info"> =
      {
        baik: "success",
        rusak_ringan: "warning",
        rusak_berat: "error",
        maintenance: "info",
      };
    const labels: Record<string, string> = {
      baik: "Baik",
      rusak_ringan: "Rusak Ringan",
      rusak_berat: "Rusak Berat",
      maintenance: "Maintenance",
    };
    return (
      <StatusBadge status={kondisiMap[kondisi] || "info"} pulse={false}>
        {labels[kondisi] || kondisi}
      </StatusBadge>
    );
  };

  const overdueCount = activeBorrowings.filter((b) => b.is_overdue).length;

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="overflow-hidden border-border/60 bg-background/80 shadow-xl"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                <Package className="h-3.5 w-3.5 text-primary" />
                Monitoring pengembalian alat
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20 shadow-sm">
                  <Package className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Kelola Peminjaman Aktif
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Pantau alat yang masih dipinjam, identifikasi keterlambatan,
                    dan proses pengembalian dengan catatan kondisi barang serta
                    denda bila diperlukan.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 lg:max-w-sm">
              Pastikan kondisi barang diperiksa sebelum menandai pengembalian
              agar stok inventaris dan riwayat peminjaman tetap akurat.
            </div>
          </div>
        </GlassCard>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Sedang Dipinjam"
            value={activeBorrowings.length}
            icon={Package}
            color="blue"
          />
          <DashboardCard
            title="Terlambat"
            value={overdueCount}
            icon={AlertTriangle}
            color="red"
          />
          <DashboardCard
            title="Dikembalikan Hari Ini"
            value={
              returnedBorrowings.filter((r) => {
                const today = new Date().toDateString();
                const returnDate = new Date(
                  r.tanggal_kembali_aktual,
                ).toDateString();
                return today === returnDate;
              }).length
            }
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/60 bg-background/80 p-2">
            <TabsTrigger
              value="active"
              className="gap-2 rounded-xl px-4 py-2 text-sm"
            >
              <Package className="h-4 w-4" />
              Sedang Dipinjam ({activeBorrowings.length})
            </TabsTrigger>
            <TabsTrigger
              value="returned"
              className="gap-2 rounded-xl px-4 py-2 text-sm"
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
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Daftar Peminjaman Aktif
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Daftar alat yang belum dikembalikan, termasuk status
                  keterlambatan dan kondisi saat dipinjam.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {loading ? (
                  <DashboardSkeleton />
                ) : activeBorrowings.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <Package className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Tidak ada peminjaman aktif. Semua alat yang dipinjam saat
                      ini sudah dikembalikan.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
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
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.inventaris_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.inventaris_kode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {borrowing.laboratorium_nama}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {borrowing.jumlah_pinjam}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_pinjam)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_kembali_rencana)}
                            </TableCell>
                            <TableCell>
                              {borrowing.is_overdue ? (
                                <StatusBadge status="error" pulse>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Terlambat {borrowing.days_overdue} hari
                                </StatusBadge>
                              ) : (
                                <StatusBadge status="success" pulse={false}>
                                  Sedang Dipinjam
                                </StatusBadge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getKondisiBadge(borrowing.kondisi_pinjam)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                                onClick={() =>
                                  handleOpenReturnDialog(borrowing)
                                }
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
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
            </GlassCard>
          </TabsContent>

          {/* Returned Borrowings Tab */}
          <TabsContent value="returned">
            <GlassCard
              intensity="low"
              className="border-border/60 bg-background/85 shadow-lg"
            >
              <CardHeader className="space-y-2 px-0 pt-0">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Riwayat Pengembalian
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Rekap alat yang sudah dikembalikan lengkap dengan kondisi
                  akhir, catatan, dan nominal denda.
                </p>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {returnedLoading ? (
                  <DashboardSkeleton />
                ) : returnedBorrowings.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/40">
                    <History className="h-4 w-4" />
                    <AlertDescription className="text-sm text-muted-foreground">
                      Belum ada riwayat pengembalian. Data akan muncul setelah
                      proses pengembalian pertama selesai dicatat.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background/70">
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
                                <div className="text-sm font-medium text-foreground">
                                  {borrowing.peminjam_nama}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {borrowing.peminjam_nim}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium text-foreground">
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
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(borrowing.tanggal_pinjam)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm text-foreground">
                                  {formatDate(borrowing.tanggal_kembali_aktual)}
                                </div>
                                {borrowing.was_overdue && (
                                  <StatusBadge
                                    status="error"
                                    pulse={false}
                                    className="mt-1 text-xs"
                                  >
                                    Terlambat
                                  </StatusBadge>
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
                                <span className="text-sm font-semibold text-destructive">
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
                                className="block truncate text-sm text-muted-foreground"
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
            </GlassCard>
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tandai Sebagai Dikembalikan</DialogTitle>
              <DialogDescription>
                Isi detail pengembalian alat. Stok inventaris akan otomatis
                dikembalikan setelah proses disimpan.
              </DialogDescription>
            </DialogHeader>

            {returnDialog.borrowing && (
              <div className="space-y-5 py-4">
                {/* Borrowing Info */}
                <GlassCard
                  intensity="low"
                  className="border-border/60 bg-muted/30 p-4 shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Ringkasan peminjaman
                      </h3>
                      {returnDialog.borrowing.is_overdue && (
                        <StatusBadge status="error" pulse className="text-xs">
                          Terlambat {returnDialog.borrowing.days_overdue} hari
                        </StatusBadge>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Peminjam
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.peminjam_nama}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Alat
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.inventaris_nama}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Jumlah
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {returnDialog.borrowing.jumlah_pinjam}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Jadwal kembali
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatDate(
                            returnDialog.borrowing.tanggal_kembali_rencana,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Kondisi Kembali */}
                <div className="space-y-2">
                  <Label htmlFor="kondisi">
                    Kondisi Barang Saat Dikembalikan{" "}
                    <span className="text-destructive">*</span>
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
                      setReturnForm({
                        ...returnForm,
                        keterangan: e.target.value,
                      })
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
                          denda: value === "" ? 0 : parseInt(value, 10),
                        });
                      }
                    }}
                  />
                  {returnDialog.borrowing.is_overdue && (
                    <p className="text-xs text-muted-foreground">
                      Saran: Rp 5.000/hari ×{" "}
                      {returnDialog.borrowing.days_overdue} hari ={" "}
                      {formatCurrency(
                        returnDialog.borrowing.days_overdue * 5000,
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setReturnDialog({ ...returnDialog, open: false })
                }
                disabled={processing}
              >
                Batal
              </Button>
              <Button
                onClick={handleMarkAsReturned}
                disabled={processing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Tandai Sudah Kembali
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
