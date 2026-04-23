/**
 * Halaman inventaris admin untuk monitoring dan koreksi data depo alat.
 */
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableBody } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/DataTable/TableSkeleton";
import {
  EnhancedTable,
  EnhancedTableHeader,
  EnhancedTableRow,
  EnhancedTableHead,
  EnhancedTableCell,
} from "@/components/shared/DataTable/EnhancedTable";
import {
  EnhancedEmptyState,
  EmptySearchResults,
} from "@/components/shared/DataTable/EnhancedEmptyState";
import { useRowSelection } from "@/components/shared/DataTable/useRowSelection";
import { useTableExport } from "@/components/shared/DataTable/useTableExport";
import { ColumnVisibilityDropdown } from "@/components/shared/DataTable/ColumnVisibility";
import {
  BulkActionsBar,
  BulkActions,
} from "@/components/shared/DataTable/BulkActionsBar";
import {
  RowSelectionHeader,
  RowSelectionCell,
} from "@/components/shared/DataTable/RowSelectionColumn";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import {
  getInventarisList,
  getInventarisCategories,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  syncInventarisAvailableStock,
  type InventarisListItem,
  type CreateInventarisData,
} from "@/lib/api/laboran.api";

export default function EquipmentsPage() {
  const [inventaris, setInventaris] = useState<InventarisListItem[]>([]);
  const [borrowingHistoryIds, setBorrowingHistoryIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [isSaving, setIsSaving] = useState(false);
  const [syncingStockItemId, setSyncingStockItemId] = useState<string | null>(
    null,
  );

  // Edit dialog
  const [editingItem, setEditingItem] = useState<InventarisListItem | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<CreateInventarisData>({
    kode_barang: "",
    nama_barang: "",
    kategori: "",
    merk: "",
    spesifikasi: "",
    jumlah: 1,
    jumlah_tersedia: 1,
    kondisi: "baik",
    tahun_pengadaan: new Date().getFullYear(),
    keterangan: "",
  });

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState<InventarisListItem | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventarisListItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreateInventarisData>({
    kode_barang: "",
    nama_barang: "",
    kategori: "",
    merk: "",
    spesifikasi: "",
    jumlah: 1,
    jumlah_tersedia: 1,
    kondisi: "baik",
    tahun_pengadaan: new Date().getFullYear(),
    keterangan: "",
  });

  // Phase 2: Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    select: true,
    code: true,
    name: true,
    category: true,
    brand: true,
    stock: true,
    condition: true,
    actions: true,
  });

  const { exportToCSV } = useTableExport<InventarisListItem>();

  const hasBorrowingHistory = async (inventarisId: string): Promise<boolean> => {
    const { count, error } = await supabase
      .from("peminjaman")
      .select("id", { count: "exact", head: true })
      .eq("inventaris_id", inventarisId);

    if (error) {
      throw error;
    }

    return (count || 0) > 0;
  };

  const handleExport = () => {
    exportToCSV({
      columns: [
        { key: "kode_barang", label: "Kode Barang" },
        { key: "nama_barang", label: "Nama Barang" },
        { key: "kategori", label: "Kategori" },
        { key: "merk", label: "Merek" },
        { key: "jumlah", label: "Total Stok" },
        { key: "jumlah_tersedia", label: "Sisa Tersedia" },
        { key: "kondisi", label: "Kondisi" },
        { key: "keterangan", label: "Keterangan" },
      ],
      data: filteredInventaris,
      filename: "inventaris-depo-alat",
    });
  };

  const handleBulkDelete = async (items: InventarisListItem[]) => {
    try {
      const historyChecks = await Promise.all(
        items.map(async (item) => ({
          item,
          hasHistory:
            borrowingHistoryIds.has(item.id) || (await hasBorrowingHistory(item.id)),
        })),
      );

      const blockedItems = historyChecks.filter((result) => result.hasHistory);
      if (blockedItems.length > 0) {
        toast.error("Sebagian inventaris tidak bisa dihapus", {
          description:
            "Admin hanya boleh menghapus inventaris yang belum pernah dipakai dalam peminjaman. Gunakan koreksi data untuk inventaris yang sudah punya riwayat.",
        });
        return;
      }

      if (!confirm(`Hapus ${items.length} inventaris monitoring admin?`)) return;

      await Promise.all(items.map((item) => deleteInventaris(item.id)));
      toast.success(`${items.length} inventaris berhasil dihapus`);
      rowSelection.clearSelection();
      await loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus inventaris", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui",
      });
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        inventarisResult,
        borrowingHistoryResult,
        categoryResult,
      ] = await Promise.all([
        getInventarisList({
          search: searchQuery || undefined,
        }),
        supabase
          .from("peminjaman")
          .select("inventaris_id")
          .not("inventaris_id", "is", null),
        getInventarisCategories(),
      ]);

      if (borrowingHistoryResult.error) {
        throw borrowingHistoryResult.error;
      }

      const historyIdSet = new Set(
        (borrowingHistoryResult.data || [])
          .map((item) => item.inventaris_id)
          .filter(Boolean),
      );

      setInventaris(inventarisResult.data);
      setBorrowingHistoryIds(historyIdSet);
      setCategories(categoryResult);
    } catch (error) {
      toast.error("Gagal memuat data inventaris");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventarisListItem) => {
    if (item.jumlah_tersedia <= 0) return "habis";
    if (item.jumlah_tersedia < item.jumlah) {
      const remainingRatio =
        item.jumlah > 0 ? item.jumlah_tersedia / item.jumlah : 0;
      if (remainingRatio <= 0.3) return "menipis";
      return "dipinjam";
    }

    return "aman";
  };

  const filteredInventaris = inventaris.filter(
    (item) => {
      const matchesSearch =
        item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kode_barang.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.kategori === selectedCategory;
      const matchesCondition =
        selectedCondition === "all" || item.kondisi === selectedCondition;
      const matchesStockStatus =
        selectedStockStatus === "all" ||
        getStockStatus(item) === selectedStockStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesStockStatus
      );
    },
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventaris.length / Number(itemsPerPage)),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedInventaris = filteredInventaris.slice(
    (safeCurrentPage - 1) * Number(itemsPerPage),
    safeCurrentPage * Number(itemsPerPage),
  );

  // Phase 2: Row selection - must be at top level, not inside conditional render
  const rowSelection = useRowSelection({
    data: paginatedInventaris,
    getKey: (item) => item.id,
  });

  const stats = {
    total: inventaris.length,
    available: inventaris.filter((i) => i.kondisi === "baik").length,
    damaged: inventaris.filter(
      (i) => i.kondisi === "rusak_ringan" || i.kondisi === "rusak_berat",
    ).length,
    borrowed: inventaris.filter((i) => i.jumlah - i.jumlah_tersedia > 0).length,
  };

  const handleAdd = () => {
    setAddFormData({
      kode_barang: "",
      nama_barang: "",
      kategori: "",
      merk: "",
      spesifikasi: "",
      jumlah: 1,
      jumlah_tersedia: 1,
      kondisi: "baik",
      tahun_pengadaan: new Date().getFullYear(),
      keterangan: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!addFormData.kode_barang || !addFormData.nama_barang) {
      toast.error("Kode Barang dan Nama Barang wajib diisi");
      return;
    }

    if (addFormData.jumlah_tersedia > addFormData.jumlah) {
      toast.error("Jumlah tersedia tidak boleh melebihi jumlah total");
      return;
    }

    setIsSaving(true);
    try {
      await createInventaris({
        ...addFormData,
        laboratorium_id: null,
      });
      toast.success("Inventaris berhasil ditambahkan");
      setIsAddDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error("Gagal menambahkan inventaris", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui",
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: InventarisListItem) => {
    setEditingItem(item);
    setEditFormData({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori: item.kategori || "",
      merk: item.merk || "",
      spesifikasi: item.spesifikasi || "",
      jumlah: item.jumlah,
      jumlah_tersedia: item.jumlah_tersedia,
      kondisi: item.kondisi || "baik",
      tahun_pengadaan: item.tahun_pengadaan || new Date().getFullYear(),
      keterangan: item.keterangan || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!editFormData.kode_barang || !editFormData.nama_barang) {
      toast.error("Kode Barang dan Nama Barang wajib diisi");
      return;
    }

    if (editFormData.jumlah_tersedia > editFormData.jumlah) {
      toast.error("Jumlah tersedia tidak boleh melebihi jumlah total");
      return;
    }

    setIsSaving(true);
    try {
      await updateInventaris(editingItem.id, editFormData);
      toast.success("Inventaris berhasil diperbarui");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error: any) {
      toast.error("Gagal memperbarui inventaris", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui",
      });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: InventarisListItem) => {
    void (async () => {
      try {
        const hasHistory = await hasBorrowingHistory(item.id);
        if (hasHistory) {
          toast.error("Inventaris tidak bisa dihapus", {
            description:
              "Inventaris ini sudah pernah dipakai dalam peminjaman. Untuk menjaga riwayat tetap valid, admin hanya boleh melakukan koreksi data.",
          });
          return;
        }

        setDeletingItem(item);
        setIsDeleteDialogOpen(true);
      } catch (error: any) {
        toast.error("Gagal memeriksa riwayat inventaris", {
          description: error.message || "Terjadi kesalahan yang tidak diketahui",
        });
        console.error(error);
      }
    })();
  };

  const handleSyncStock = async (item: InventarisListItem) => {
    try {
      setSyncingStockItemId(item.id);
      const result = await syncInventarisAvailableStock(item.id);

      if (result.changed) {
        toast.success("Stok inventaris berhasil disinkronkan", {
          description: `${result.nama_barang}: ${result.previousAvailable}/${result.jumlah} menjadi ${result.expectedAvailable}/${result.jumlah}. Aktif dipinjam: ${result.activeBorrowedQuantity}.`,
        });
      } else {
        toast.success("Stok inventaris sudah sinkron", {
          description: `${result.nama_barang}: ${result.expectedAvailable}/${result.jumlah}. Aktif dipinjam: ${result.activeBorrowedQuantity}.`,
        });
      }

      await loadData();
      if (detailItem?.id === item.id) {
        const refreshed = await getInventarisList({ search: item.kode_barang });
        const latestItem = refreshed.data.find((entry) => entry.id === item.id);
        if (latestItem) {
          setDetailItem(latestItem);
        }
      }
    } catch (error: any) {
      toast.error("Gagal sinkronkan stok inventaris", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui",
      });
      console.error(error);
    } finally {
      setSyncingStockItemId(null);
    }
  };

  const handleViewDetail = (item: InventarisListItem) => {
    setDetailItem(item);
    setIsDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const hasHistory = await hasBorrowingHistory(deletingItem.id);
      if (hasHistory) {
        throw new Error(
          "Inventaris ini sudah pernah dipakai dalam peminjaman. Hapus diblok untuk menjaga riwayat tetap valid.",
        );
      }

      await deleteInventaris(deletingItem.id);
      toast.success(`Inventaris "${deletingItem.nama_barang}" berhasil dihapus`);
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      await loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus inventaris", {
        description: error.message || "Terjadi kesalahan yang tidak diketahui",
      });
      console.error(error);
    }
  };

  const canDeleteItem = (itemId: string) => !borrowingHistoryIds.has(itemId);
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedCondition !== "all" ||
    selectedStockStatus !== "all";

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCondition("all");
    setSelectedStockStatus("all");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedCondition,
    selectedStockStatus,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="app-container space-y-6">
      {/* Header */}
      <div className="section-shell flex items-center justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Peralatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau inventaris laboratorium yang dikelola laboran dan lakukan koreksi bila diperlukan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            className="font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Muat Ulang
          </Button>
          <Button
            onClick={handleAdd}
            className="font-semibold bg-linear-to-r from-primary to-accent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Peralatan
          </Button>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Halaman admin berfungsi sebagai monitoring dan backup atas inventaris
          yang dikelola laboran. Tambah, ubah, atau hapus data hanya dilakukan
          bila memang diperlukan untuk koreksi administratif. Inventaris yang
          sudah punya riwayat peminjaman tidak boleh dihapus dari halaman admin.
        </AlertDescription>
      </Alert>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total Barang"
          value={stats.total}
          icon={Package}
          color="blue"
        />
        <DashboardCard
          title="Kondisi Baik"
          value={stats.available}
          icon={Package}
          color="green"
        />
        <DashboardCard
          title="Rusak"
          value={stats.damaged}
          icon={AlertCircle}
          color="red"
        />
        <DashboardCard
          title="Dipinjam"
          value={stats.borrowed}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      {/* Search */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama peralatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Semua status stok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status stok</SelectItem>
            <SelectItem value="aman">Aman</SelectItem>
            <SelectItem value="dipinjam">Sedang Dipinjam</SelectItem>
            <SelectItem value="menipis">Menipis</SelectItem>
            <SelectItem value="habis">Habis</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger>
              <SelectValue placeholder="Semua kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kondisi</SelectItem>
              <SelectItem value="baik">Baik</SelectItem>
              <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
              <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="shrink-0"
          >
            Reset
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">
            Monitoring Inventaris
          </CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            Daftar inventaris laboratorium untuk pemantauan admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton
              rows={5}
              columns={7}
              columnWidths={[
                "50px",
                "120px",
                "200px",
                "120px",
                "100px",
                "120px",
                "160px",
              ]}
            />
          ) : filteredInventaris.length === 0 ? (
            searchQuery ? (
              <EmptySearchResults onClear={() => setSearchQuery("")} />
            ) : (
              <EnhancedEmptyState
                icon={Package}
                title="Belum ada inventaris"
                description="Data inventaris laboratorium akan tampil di sini untuk dipantau admin."
                action={{
                  label: "Tambah Inventaris",
                  onClick: handleAdd,
                }}
              />
            )
          ) : (
            <>
              <BulkActionsBar
                selectedCount={rowSelection.selectedCount}
                onClearSelection={rowSelection.clearSelection}
                isAllSelected={rowSelection.isAllSelected}
                isSomeSelected={rowSelection.isSomeSelected}
                onSelectAll={rowSelection.toggleAll}
                actions={[
                  BulkActions.delete(
                    () => handleBulkDelete(rowSelection.selectedItems),
                    rowSelection.selectedCount,
                  ),
                ]}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan{" "}
                  {filteredInventaris.length === 0
                    ? 0
                    : (safeCurrentPage - 1) * Number(itemsPerPage) + 1}
                  -
                  {Math.min(
                    safeCurrentPage * Number(itemsPerPage),
                    filteredInventaris.length,
                  )}{" "}
                  dari {filteredInventaris.length} inventaris
                </div>
                <div className="flex gap-2">
                  <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="10 / halaman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / halaman</SelectItem>
                      <SelectItem value="25">25 / halaman</SelectItem>
                      <SelectItem value="50">50 / halaman</SelectItem>
                      <SelectItem value="100">100 / halaman</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="font-semibold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <ColumnVisibilityDropdown
                    columns={[
                      { id: "select", label: "Pilih", visible: columnVisibility.select },
                      {
                        id: "code",
                        label: "Kode",
                        visible: columnVisibility.code,
                      },
                      {
                        id: "name",
                        label: "Nama",
                        visible: columnVisibility.name,
                      },
                      {
                        id: "category",
                        label: "Kategori",
                        visible: columnVisibility.category,
                      },
                      {
                        id: "brand",
                        label: "Merek",
                        visible: columnVisibility.brand,
                      },
                      {
                        id: "stock",
                        label: "Sisa / Total",
                        visible: columnVisibility.stock,
                      },
                      {
                        id: "condition",
                        label: "Kondisi",
                        visible: columnVisibility.condition,
                      },
                      {
                        id: "actions",
                        label: "Aksi",
                        visible: columnVisibility.actions,
                      },
                    ]}
                    onColumnToggle={(columnId) => {
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [columnId]: !prev[columnId as keyof typeof prev],
                      }));
                    }}
                  />
                </div>
              </div>

              <EnhancedTable>
                <EnhancedTableHeader>
                  <EnhancedTableRow>
                    {columnVisibility.select && (
                      <EnhancedTableHead className="w-12.5">
                        <RowSelectionHeader
                          checked={rowSelection.isAllSelected}
                          indeterminate={rowSelection.isSomeSelected}
                          onCheckedChange={rowSelection.toggleAll}
                        />
                      </EnhancedTableHead>
                    )}
                    {columnVisibility.code && (
                      <EnhancedTableHead>Kode</EnhancedTableHead>
                    )}
                    {columnVisibility.name && (
                      <EnhancedTableHead>Nama Barang</EnhancedTableHead>
                    )}
                    {columnVisibility.category && (
                      <EnhancedTableHead>Kategori</EnhancedTableHead>
                    )}
                    {columnVisibility.brand && (
                      <EnhancedTableHead>Merek</EnhancedTableHead>
                    )}
                    {columnVisibility.stock && (
                      <EnhancedTableHead>Sisa / Total</EnhancedTableHead>
                    )}
                    {columnVisibility.condition && (
                      <EnhancedTableHead>Kondisi</EnhancedTableHead>
                    )}
                    {columnVisibility.actions && (
                      <EnhancedTableHead>Aksi</EnhancedTableHead>
                    )}
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <TableBody>
                  {paginatedInventaris.map((item) => (
                    <EnhancedTableRow key={item.id}>
                      {columnVisibility.select && (
                        <EnhancedTableCell>
                          <RowSelectionCell
                            checked={rowSelection.isSelected(item)}
                            onCheckedChange={() => rowSelection.toggleRow(item)}
                          />
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.code && (
                        <EnhancedTableCell className="font-mono text-xs">
                          {item.kode_barang}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.name && (
                        <EnhancedTableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{item.nama_barang}</div>
                            {borrowingHistoryIds.has(item.id) && (
                              <div className="text-xs text-muted-foreground">
                                Sudah memiliki riwayat peminjaman
                              </div>
                            )}
                          </div>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.category && (
                        <EnhancedTableCell>
                          {item.kategori || "-"}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.brand && (
                        <EnhancedTableCell>
                          {item.merk || "-"}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.stock && (
                        <EnhancedTableCell>
                          <div className="space-y-1">
                            <div>
                              <span
                                className={
                                  item.jumlah_tersedia < item.jumlah
                                    ? "text-warning font-semibold"
                                    : "font-semibold"
                                }
                              >
                                {item.jumlah_tersedia}
                              </span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-muted-foreground">
                                {item.jumlah}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Dipinjam: {Math.max(item.jumlah - item.jumlah_tersedia, 0)}
                              </span>
                              <span>
                                •
                              </span>
                              <span>
                                {getStockStatus(item) === "aman"
                                  ? "Status aman"
                                  : getStockStatus(item) === "dipinjam"
                                    ? "Sedang dipinjam"
                                    : getStockStatus(item) === "menipis"
                                      ? "Stok menipis"
                                      : "Stok habis"}
                              </span>
                            </div>
                          </div>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.condition && (
                        <EnhancedTableCell>
                          <StatusBadge
                            status={
                              item.kondisi === "baik"
                                ? "success"
                                : item.kondisi === "rusak_ringan"
                                  ? "warning"
                                  : "error"
                            }
                            pulse={item.kondisi === "baik"}
                          >
                            {item.kondisi === "rusak_ringan"
                              ? "Rusak Ringan"
                              : item.kondisi === "rusak_berat"
                                ? "Rusak Berat"
                                : "Baik"}
                          </StatusBadge>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.actions && (
                        <EnhancedTableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(item)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detail
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDeleteItem(item.id)}
                              onClick={() => handleDelete(item)}
                              title={
                                canDeleteItem(item.id)
                                  ? "Hapus inventaris"
                                  : "Inventaris dengan riwayat peminjaman tidak bisa dihapus"
                              }
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </EnhancedTableCell>
                      )}
                    </EnhancedTableRow>
                  ))}
                </TableBody>
              </EnhancedTable>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-muted-foreground">
                  Halaman {safeCurrentPage} dari {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={safeCurrentPage <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={safeCurrentPage >= totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
              <DialogTitle className="text-xl font-bold">
              Tambah Inventaris
              </DialogTitle>
              <DialogDescription className="text-base font-semibold">
              Input data inventaris sebagai backup admin bila diperlukan
              </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                DATA UTAMA
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Inventaris pada halaman ini dibaca sebagai inventaris depo alat.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kode_barang">Kode Barang *</Label>
                  <Input
                    id="new_kode_barang"
                    value={addFormData.kode_barang}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        kode_barang: e.target.value,
                      })
                    }
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="new_nama_barang">Nama Barang *</Label>
                  <Input
                    id="new_nama_barang"
                    value={addFormData.nama_barang}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        nama_barang: e.target.value,
                      })
                    }
                    placeholder="Mikroskop Digital"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_jumlah">Jumlah Total *</Label>
                  <Input
                    id="new_jumlah"
                    type="number"
                    min="1"
                    value={addFormData.jumlah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setAddFormData({ ...addFormData, jumlah: val });
                    }}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="new_jumlah_tersedia">
                    Jumlah Tersedia *
                  </Label>
                  <Input
                    id="new_jumlah_tersedia"
                    type="number"
                    min="0"
                    value={addFormData.jumlah_tersedia}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setAddFormData({ ...addFormData, jumlah_tersedia: val });
                    }}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tidak boleh melebihi jumlah total
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                DATA PENDUKUNG
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kategori">Kategori</Label>
                  <Input
                    id="new_kategori"
                    value={addFormData.kategori || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        kategori: e.target.value || null,
                      })
                    }
                    placeholder="Alat Praktikum"
                  />
                </div>
                <div>
                  <Label htmlFor="new_merk">Merek</Label>
                  <Input
                    id="new_merk"
                    value={addFormData.merk || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        merk: e.target.value || null,
                      })
                    }
                    placeholder="Olympus"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="new_spesifikasi">Spesifikasi</Label>
                <Textarea
                  id="new_spesifikasi"
                  value={addFormData.spesifikasi || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      spesifikasi: e.target.value || null,
                    })
                  }
                  placeholder="Pembesaran 1000x, pencahayaan LED"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_kondisi">Kondisi</Label>
                  <Select
                    value={addFormData.kondisi}
                    onValueChange={(value: any) =>
                      setAddFormData({ ...addFormData, kondisi: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Baik</SelectItem>
                      <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                      <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_tahun_pengadaan">Tahun Pengadaan</Label>
                  <Input
                    id="new_tahun_pengadaan"
                    type="number"
                    value={addFormData.tahun_pengadaan || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        tahun_pengadaan: parseInt(e.target.value) || null,
                      })
                    }
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="new_keterangan">Keterangan</Label>
                <Textarea
                  id="new_keterangan"
                  value={addFormData.keterangan || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      keterangan: e.target.value,
                    })
                  }
                  placeholder="Catatan tambahan inventaris..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSaving}
                className="font-semibold border-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan Inventaris
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Detail Inventaris
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Informasi lengkap inventaris untuk monitoring admin
            </DialogDescription>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    Koreksi stok inventaris
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gunakan jika stok lama terlihat tidak sesuai dengan
                    peminjaman aktif yang masih berstatus disetujui.
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSyncStock(detailItem)}
                  disabled={syncingStockItemId === detailItem.id}
                  className="gap-2 bg-background"
                >
                  {syncingStockItemId === detailItem.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sinkronkan...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sinkronkan Stok
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Kode Barang</div>
                  <div className="mt-1 font-mono text-sm">{detailItem.kode_barang}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Nama Barang</div>
                  <div className="mt-1 font-semibold">{detailItem.nama_barang}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Kategori</div>
                  <div className="mt-1">{detailItem.kategori || "-"}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Merek</div>
                  <div className="mt-1">{detailItem.merk || "-"}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Tahun Pengadaan</div>
                  <div className="mt-1">{detailItem.tahun_pengadaan || "-"}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Sisa / Total</div>
                  <div className="mt-1 font-semibold">
                    {detailItem.jumlah_tersedia} / {detailItem.jumlah}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Dipinjam: {Math.max(detailItem.jumlah - detailItem.jumlah_tersedia, 0)}
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-muted-foreground">Kondisi</div>
                  <div className="mt-2">
                    <StatusBadge
                      status={
                        detailItem.kondisi === "baik"
                          ? "success"
                          : detailItem.kondisi === "rusak_ringan"
                            ? "warning"
                            : "error"
                      }
                    >
                      {detailItem.kondisi === "rusak_ringan"
                        ? "Rusak Ringan"
                        : detailItem.kondisi === "rusak_berat"
                          ? "Rusak Berat"
                          : "Baik"}
                    </StatusBadge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {getStockStatus(detailItem) === "aman"
                      ? "Status stok aman"
                      : getStockStatus(detailItem) === "dipinjam"
                        ? "Sebagian stok sedang dipinjam"
                        : getStockStatus(detailItem) === "menipis"
                          ? "Stok menipis"
                          : "Stok habis"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">Spesifikasi</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {detailItem.spesifikasi || "-"}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">Keterangan</div>
                <div className="mt-2 whitespace-pre-wrap text-sm">
                  {detailItem.keterangan || "-"}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-muted-foreground">Riwayat Peminjaman</div>
                <div className="mt-2 text-sm">
                  {borrowingHistoryIds.has(detailItem.id)
                    ? "Inventaris ini sudah memiliki riwayat peminjaman."
                    : "Inventaris ini belum memiliki riwayat peminjaman."}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Jika stok lama terlihat tidak sesuai, gunakan sinkronkan stok
                  untuk menghitung ulang `jumlah_tersedia` dari peminjaman yang
                  masih berstatus disetujui.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
             <DialogTitle className="text-xl font-bold">
              Koreksi Inventaris
              </DialogTitle>
              <DialogDescription className="text-base font-semibold">
              Koreksi data inventaris yang dikelola laboran
              </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kode Barang *</Label>
                <Input
                  value={editFormData.kode_barang}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      kode_barang: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Nama Barang *</Label>
                <Input
                  value={editFormData.nama_barang}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      nama_barang: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Jumlah Total *</Label>
                <Input
                  type="number"
                  value={editFormData.jumlah}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      jumlah: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Jumlah Tersedia *</Label>
                <Input
                  type="number"
                  value={editFormData.jumlah_tersedia}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      jumlah_tersedia: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <Input
                  value={editFormData.kategori || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      kategori: e.target.value || null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Merek</Label>
                <Input
                  value={editFormData.merk || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      merk: e.target.value || null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Kondisi</Label>
                <Select
                  value={editFormData.kondisi}
                  onValueChange={(value: any) =>
                    setEditFormData({ ...editFormData, kondisi: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tahun Pengadaan</Label>
                <Input
                  type="number"
                  value={editFormData.tahun_pengadaan || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      tahun_pengadaan: parseInt(e.target.value) || null,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Spesifikasi</Label>
              <Textarea
                value={editFormData.spesifikasi || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    spesifikasi: e.target.value || null,
                  })
                }
                rows={2}
              />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Textarea
                value={editFormData.keterangan || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    keterangan: e.target.value || null,
                  })
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
                className="font-semibold border-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan Koreksi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {deletingItem && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Inventaris - Konfirmasi"
          itemName={deletingItem.nama_barang}
          itemType="Inventaris"
          description={`Kode: ${deletingItem.kode_barang} | Stok: ${deletingItem.jumlah_tersedia}/${deletingItem.jumlah}`}
          consequences={[
            "Data inventaris akan dihapus permanen",
            "Hanya inventaris tanpa riwayat peminjaman yang bisa dihapus admin",
            "Gunakan koreksi data bila inventaris ini seharusnya tetap dipertahankan",
            "Tindakan ini tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
