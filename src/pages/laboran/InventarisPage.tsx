/**
 * Inventaris Management Page
 *
 * Full CRUD for managing laboratory equipment inventory
 */

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Package,
  AlertCircle,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard } from "@/components/ui/dashboard-card";
import {
  TableSkeleton,
  ErrorFallback,
  EmptyState,
  OfflineAwareContent,
} from "@/components/common";
import { useOfflineContext } from "@/context/OfflineContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getInventarisList,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  updateStock,
  getInventarisCategories,
  type InventarisListItem,
  type CreateInventarisData,
} from "@/lib/api/laboran.api";
import type { EquipmentCondition } from "@/types/inventaris.types";
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
} from "@/lib/offline/api-cache";

const KONDISI_OPTIONS: {
  value: EquipmentCondition;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}[] = [
  { value: "baik", label: "Baik", variant: "default" },
  { value: "rusak_ringan", label: "Rusak Ringan", variant: "secondary" },
  { value: "rusak_berat", label: "Rusak Berat", variant: "destructive" },
  { value: "maintenance", label: "Maintenance", variant: "outline" },
];

const DEFAULT_CATEGORIES = [
  "Alat Lab",
  "Komputer",
  "Elektronik",
  "Kimia",
  "Mekanik",
  "Umum",
];

export default function InventarisPage() {
  const { isOffline } = useOfflineContext();
  const [inventaris, setInventaris] = useState<InventarisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarisListItem | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<CreateInventarisData>>({
    kondisi: "baik",
  });
  const [stockAdjustment, setStockAdjustment] = useState({
    amount: 0,
    type: "add" as "add" | "subtract" | "set",
  });
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  useEffect(() => {
    loadInventaris(false);
    loadCategories(false);
  }, [searchQuery, selectedKategori]);

  const loadInventaris = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const cacheKey = `inventaris_list_${searchQuery || ""}_${selectedKategori || ""}`;
      const cachedInventarisEntry = await getCachedData<{
        data: InventarisListItem[];
        count: number;
      }>(cacheKey);
      const hasCachedData = Array.isArray(cachedInventarisEntry?.data?.data);

      if (hasCachedData) {
        setInventaris(cachedInventarisEntry.data.data);
        setTotalCount(cachedInventarisEntry.data.count || 0);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedInventarisEntry.timestamp || null);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan snapshot inventaris terakhir."
            : "Perangkat sedang offline dan belum ada snapshot inventaris tersimpan.",
        );
      }

      const result = await cacheAPI(
        cacheKey,
        () =>
          getInventarisList({
            search: searchQuery || undefined,
            kategori: selectedKategori || undefined,
          }),
        {
          ttl: 5 * 60 * 1000, // 5 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setInventaris(result.data);
      setTotalCount(result.count);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (err: any) {
      if (!navigator.onLine) {
        setIsOfflineData(true);
      } else {
        setError(err.message || "Gagal memuat data inventaris");
      }
      toast.error("Gagal memuat data inventaris");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (forceRefresh = false) => {
    try {
      const cats = await cacheAPI(
        "inventaris_categories",
        getInventarisCategories,
        {
          ttl: 20 * 60 * 1000, // 20 minutes - categories rarely change
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      if (cats.length > 0) setCategories(cats);
    } catch (error) {
      console.error("Gagal memuat kategori inventaris:", error);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData({ kondisi: "baik", jumlah: 0, jumlah_tersedia: 0 });
    setIsFormOpen(true);
  };

  const handleEdit = (item: InventarisListItem) => {
    setSelectedItem(item);
    setFormData({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori: item.kategori || "",
      merk: item.merk || "",
      spesifikasi: item.spesifikasi || "",
      jumlah: item.jumlah,
      jumlah_tersedia: item.jumlah_tersedia,
      kondisi: item.kondisi || "baik",
      harga_satuan: item.harga_satuan || undefined,
      tahun_pengadaan: item.tahun_pengadaan || undefined,
      keterangan: item.keterangan || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item: InventarisListItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleStockManagement = (item: InventarisListItem) => {
    setSelectedItem(item);
    setStockAdjustment({ amount: 0, type: "add" });
    setIsStockOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.kode_barang || !formData.nama_barang) {
        toast.error("Lengkapi semua field wajib");
        return;
      }
      if (selectedItem) {
        await updateInventaris(selectedItem.id, formData);
        toast.success("Inventaris berhasil diperbarui");
      } else {
        await createInventaris(formData as CreateInventarisData);
        toast.success("Inventaris berhasil ditambahkan");
      }
      setIsFormOpen(false);
      // Invalidate all inventaris caches
      await invalidateCache("inventaris_list_");
      await loadInventaris(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data inventaris";
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteInventaris(selectedItem.id);
      toast.success("Inventaris berhasil dihapus");
      setIsDeleteOpen(false);
      // Invalidate all inventaris caches
      await invalidateCache("inventaris_list_");
      await loadInventaris(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus inventaris";
      toast.error(message);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedItem) return;
    try {
      await updateStock(
        selectedItem.id,
        stockAdjustment.amount,
        stockAdjustment.type,
      );
      toast.success("Stok inventaris berhasil diperbarui");
      setIsStockOpen(false);
      // Invalidate all inventaris caches
      await invalidateCache("inventaris_list_");
      await loadInventaris(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui stok";
      toast.error(message);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Kode",
      "Nama",
      "Kategori",
      "Merk",
      "Jumlah",
      "Tersedia",
      "Kondisi",
      "Lab",
    ];
    const rows = inventaris.map((item) => [
      item.kode_barang,
      item.nama_barang,
      item.kategori || "-",
      item.merk || "-",
      item.jumlah,
      item.jumlah_tersedia,
      item.kondisi || "-",
      item.laboratorium?.nama_lab || "-",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaris-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorFallback message={error} onRetry={() => loadInventaris(true)} />
    );
  }

  // Offline empty state
  if (isOffline && !inventaris?.length) {
    return <EmptyState variant="offline" context="peralatan" />;
  }

  // Empty state
  if (!inventaris?.length && !searchQuery && !selectedKategori) {
    return (
      <EmptyState
        variant="no-data"
        context="peralatan"
        actionLabel="Tambah Peralatan"
        onAction={handleCreate}
      />
    );
  }

  return (
    <OfflineAwareContent
      hasData={inventaris.length > 0}
      context="peralatan"
      onSync={() => loadInventaris(true)}
    >
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Data Inventaris Laboratorium
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola peralatan laboratorium, stok tersedia, kategori, dan
              kondisi inventaris untuk operasional praktikum.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Ekspor CSV
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Inventaris
            </Button>
          </div>
        </div>

        {(isOfflineData || !navigator.onLine) && (
          <Alert className="border-warning/40 bg-warning/10">
            <AlertDescription>
              Data inventaris sedang memakai snapshot lokal dari perangkat.
              {lastUpdatedLabel
                ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Total Item"
            value={totalCount}
            icon={Package}
            color="primary"
          />
          <DashboardCard
            title="Stok Rendah"
            value={inventaris.filter((i) => i.jumlah_tersedia < 5).length}
            icon={AlertCircle}
            color="warning"
          />
          <DashboardCard
            title="Kategori"
            value={categories.length}
            icon={Filter}
            color="accent"
          />
        </div>

        <GlassCard
          intensity="low"
          className="border-border/60 bg-background/85 shadow-lg"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="relative flex-1 space-y-2">
              <Label htmlFor="inventaris-search">Cari inventaris</Label>
              <Search className="absolute left-3 top-[calc(50%+12px)] h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                id="inventaris-search"
                placeholder="Cari berdasarkan nama barang atau kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 lg:w-64">
              <Label>Kategori</Label>
              <Select
                value={selectedKategori || undefined}
                onValueChange={(value) => setSelectedKategori(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedKategori && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedKategori("")}
                title="Reset filter kategori"
                className="shrink-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </GlassCard>

        <GlassCard
          intensity="low"
          className="border-border/60 bg-background/85 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Daftar Inventaris
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalCount} item terdata pada hasil pencarian saat ini.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground">
                    Kode
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Nama Barang
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Kategori
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Merk
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground">
                    Jumlah
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground">
                    Tersedia
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Kondisi
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Lab
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventaris.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={9} className="p-8">
                      <EmptyState
                        variant="no-results"
                        actionLabel="Reset Filter"
                        onAction={() => {
                          setSearchQuery("");
                          setSelectedKategori("");
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  inventaris.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm text-foreground">
                        {item.kode_barang}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {item.nama_barang}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.kategori || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.merk || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {item.jumlah}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.jumlah_tersedia < 5
                              ? "font-semibold text-warning"
                              : "font-medium text-foreground"
                          }
                        >
                          {item.jumlah_tersedia}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const kondisiStatusMap: Record<
                            string,
                            "success" | "warning" | "error" | "info"
                          > = {
                            baik: "success",
                            rusak_ringan: "warning",
                            rusak_berat: "error",
                            maintenance: "info",
                          };
                          const label =
                            KONDISI_OPTIONS.find(
                              (k) => k.value === item.kondisi,
                            )?.label || item.kondisi;
                          return (
                            <StatusBadge
                              status={kondisiStatusMap[item.kondisi] || "info"}
                              pulse={false}
                            >
                              {label}
                            </StatusBadge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.laboratorium?.nama_lab || "Depot"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStockManagement(item)}
                            className="table-action-btn table-action-btn-view"
                            title="Kelola stok"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="table-action-btn table-action-btn-edit"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="table-action-btn table-action-btn-delete"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </GlassCard>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Edit Inventaris" : "Tambah Inventaris"}
              </DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? "Perbarui detail item inventaris"
                  : "Tambahkan item baru ke inventaris"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kode_barang">Kode Barang *</Label>
                  <Input
                    id="kode_barang"
                    value={formData.kode_barang || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_barang: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama_barang">Nama Barang *</Label>
                  <Input
                    id="nama_barang"
                    value={formData.nama_barang || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_barang: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select
                    value={formData.kategori || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, kategori: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="merk">Merk</Label>
                  <Input
                    id="merk"
                    value={formData.merk || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, merk: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spesifikasi">Spesifikasi</Label>
                <Textarea
                  id="spesifikasi"
                  value={formData.spesifikasi || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, spesifikasi: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah Total *</Label>
                  <Input
                    id="jumlah"
                    type="text"
                    inputMode="numeric"
                    value={formData.jumlah || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setFormData({
                          ...formData,
                          jumlah: value === "" ? 0 : parseInt(value),
                        });
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlah_tersedia">Jumlah Tersedia *</Label>
                  <Input
                    id="jumlah_tersedia"
                    type="text"
                    inputMode="numeric"
                    value={formData.jumlah_tersedia || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setFormData({
                          ...formData,
                          jumlah_tersedia: value === "" ? 0 : parseInt(value),
                        });
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kondisi">Kondisi</Label>
                <Select
                  value={formData.kondisi || "baik"}
                  onValueChange={(value: EquipmentCondition) =>
                    setFormData({ ...formData, kondisi: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KONDISI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harga_satuan">Harga Satuan (Rp)</Label>
                  <Input
                    id="harga_satuan"
                    type="text"
                    inputMode="numeric"
                    value={formData.harga_satuan || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setFormData({
                          ...formData,
                          harga_satuan:
                            value === "" ? undefined : parseFloat(value),
                        });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun_pengadaan">Tahun Pengadaan</Label>
                  <Input
                    id="tahun_pengadaan"
                    type="text"
                    inputMode="numeric"
                    value={formData.tahun_pengadaan || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setFormData({
                          ...formData,
                          tahun_pengadaan:
                            value === "" ? undefined : parseInt(value),
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {selectedItem ? "Simpan Perubahan" : "Tambah Barang"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Inventaris?</AlertDialogTitle>
              <AlertDialogDescription>
                Inventaris "{selectedItem?.nama_barang}" akan dihapus permanen.
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stock Management Dialog */}
        <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kelola Stok</DialogTitle>
              <DialogDescription>
                Atur stok untuk: {selectedItem?.nama_barang}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Saat Ini</p>
                    <p className="text-4xl font-extrabold">
                      {selectedItem?.jumlah}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tersedia</p>
                    <p className="text-4xl font-extrabold">
                      {selectedItem?.jumlah_tersedia}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jenis Penyesuaian</Label>
                <Select
                  value={stockAdjustment.type}
                  onValueChange={(value: "add" | "subtract" | "set") =>
                    setStockAdjustment({ ...stockAdjustment, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Tambah Stok
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Kurangi Stok
                      </div>
                    </SelectItem>
                    <SelectItem value="set">Tetapkan Jumlah Pasti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={stockAdjustment.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setStockAdjustment({
                        ...stockAdjustment,
                        amount: value === "" ? 0 : parseInt(value),
                      });
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockUpdate}>Simpan Stok</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OfflineAwareContent>
  );
}
