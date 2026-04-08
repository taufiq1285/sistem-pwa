/**
 * Equipment/Inventaris Management Page for Admin
 * Full CRUD for managing laboratory equipment inventory
 * FIXED VERSION - No invalid fields
 */
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
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
import {
  getInventarisList,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  type InventarisListItem,
  type CreateInventarisData,
} from "@/lib/api/laboran.api";

export default function EquipmentsPage() {
  const [inventaris, setInventaris] = useState<InventarisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Phase 2: Export functionality
  const { exportToCSV } = useTableExport<InventarisListItem>();

  const handleExport = () => {
    exportToCSV({
      columns: [
        { key: "kode_barang", label: "Code" },
        { key: "nama_barang", label: "Name" },
        { key: "kategori", label: "Category" },
        { key: "merk", label: "Brand" },
        { key: "jumlah", label: "Total Stock" },
        { key: "jumlah_tersedia", label: "Available" },
        { key: "kondisi", label: "Condition" },
        { key: "keterangan", label: "Notes" },
      ],
      data: filteredInventaris,
      filename: "equipment-inventory",
    });
  };

  const handleBulkDelete = async (items: InventarisListItem[]) => {
    if (!confirm(`Hapus ${items.length} equipment?`)) return;

    try {
      await Promise.all(items.map((item) => deleteInventaris(item.id)));
      toast.success(`Successfully deleted ${items.length} equipment(s)`);
      rowSelection.clearSelection();
      await loadData();
    } catch (error: any) {
      toast.error(
        "Failed to delete equipment: " + (error.message || "Unknown error"),
      );
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const inventarisResult = await getInventarisList({
        search: searchQuery || undefined,
      });
      setInventaris(inventarisResult.data);
    } catch (error) {
      toast.error("Failed to load equipment data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventaris = inventaris.filter(
    (item) =>
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Phase 2: Row selection - must be at top level, not inside conditional render
  const rowSelection = useRowSelection({
    data: filteredInventaris,
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
      toast.success("Equipment created successfully");
      setIsAddDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(
        "Failed to create equipment: " + (error.message || "Unknown error"),
      );
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
      toast.success("Equipment updated successfully");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error: any) {
      toast.error(
        "Failed to update equipment: " + (error.message || "Unknown error"),
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: InventarisListItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      await deleteInventaris(deletingItem.id);
      toast.success(
        `Equipment "${deletingItem.nama_barang}" deleted successfully`,
      );
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      await loadData();
    } catch (error: any) {
      toast.error(
        "Failed to delete equipment: " + (error.message || "Unknown error"),
      );
      console.error(error);
    }
  };

  return (
    <div className="app-container space-y-6">
      {/* Header */}
      <div className="section-shell flex items-center justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Peralatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola inventaris peralatan laboratorium
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            className="font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">
            Equipment Inventory
          </CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            All laboratory equipment and supplies
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
                title="No equipment found"
                description="Add equipment to start managing your laboratory inventory."
                action={{
                  label: "Add Equipment",
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
                  {filteredInventaris.length} equipment(s)
                </div>
                <div className="flex gap-2">
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
                      {
                        id: "select",
                        label: "Select",
                        visible: columnVisibility.select,
                      },
                      {
                        id: "code",
                        label: "Code",
                        visible: columnVisibility.code,
                      },
                      {
                        id: "name",
                        label: "Name",
                        visible: columnVisibility.name,
                      },
                      {
                        id: "category",
                        label: "Category",
                        visible: columnVisibility.category,
                      },
                      {
                        id: "brand",
                        label: "Brand",
                        visible: columnVisibility.brand,
                      },
                      {
                        id: "stock",
                        label: "Stock",
                        visible: columnVisibility.stock,
                      },
                      {
                        id: "condition",
                        label: "Condition",
                        visible: columnVisibility.condition,
                      },
                      {
                        id: "actions",
                        label: "Actions",
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
                      <EnhancedTableHead>Code</EnhancedTableHead>
                    )}
                    {columnVisibility.name && (
                      <EnhancedTableHead>Name</EnhancedTableHead>
                    )}
                    {columnVisibility.category && (
                      <EnhancedTableHead>Category</EnhancedTableHead>
                    )}
                    {columnVisibility.brand && (
                      <EnhancedTableHead>Brand</EnhancedTableHead>
                    )}
                    {columnVisibility.stock && (
                      <EnhancedTableHead>Stock</EnhancedTableHead>
                    )}
                    {columnVisibility.condition && (
                      <EnhancedTableHead>Condition</EnhancedTableHead>
                    )}
                    {columnVisibility.actions && (
                      <EnhancedTableHead>Actions</EnhancedTableHead>
                    )}
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <TableBody>
                  {filteredInventaris.map((item) => (
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
                          {item.nama_barang}
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
                          <span
                            className={
                              item.jumlah_tersedia < item.jumlah
                                ? "text-warning font-semibold"
                                : ""
                            }
                          >
                            {item.jumlah_tersedia}
                          </span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-muted-foreground">
                            {item.jumlah}
                          </span>
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
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item)}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Add New Equipment
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Create a new equipment/inventory item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Required Fields Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                REQUIRED FIELDS
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                All equipment is stored in central depot
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kode_barang">Equipment Code *</Label>
                  <Input
                    id="new_kode_barang"
                    value={addFormData.kode_barang}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        kode_barang: e.target.value,
                      })
                    }
                    placeholder="EQP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="new_nama_barang">Equipment Name *</Label>
                  <Input
                    id="new_nama_barang"
                    value={addFormData.nama_barang}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        nama_barang: e.target.value,
                      })
                    }
                    placeholder="Digital Microscope"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_jumlah">Total Quantity *</Label>
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
                    Available Quantity *
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
                    Must be ≤ Total Quantity
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                OPTIONAL FIELDS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kategori">Category</Label>
                  <Input
                    id="new_kategori"
                    value={addFormData.kategori || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        kategori: e.target.value || null,
                      })
                    }
                    placeholder="Lab Equipment"
                  />
                </div>
                <div>
                  <Label htmlFor="new_merk">Brand</Label>
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
                <Label htmlFor="new_spesifikasi">Specifications</Label>
                <Textarea
                  id="new_spesifikasi"
                  value={addFormData.spesifikasi || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      spesifikasi: e.target.value || null,
                    })
                  }
                  placeholder="1000x magnification, LED illumination"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_kondisi">Condition</Label>
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
                      <SelectItem value="baik">Good</SelectItem>
                      <SelectItem value="rusak_ringan">Minor Damage</SelectItem>
                      <SelectItem value="rusak_berat">Major Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_tahun_pengadaan">Acquisition Year</Label>
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
                <Label htmlFor="new_keterangan">Notes/Description</Label>
                <Textarea
                  id="new_keterangan"
                  value={addFormData.keterangan || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      keterangan: e.target.value,
                    })
                  }
                  placeholder="Additional notes about this equipment..."
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
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog - Similar structure to Add */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Equipment
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Update equipment/inventory item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipment Code *</Label>
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
                <Label>Equipment Name *</Label>
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
                <Label>Total Quantity *</Label>
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
                <Label>Available Quantity *</Label>
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
                <Label>Category</Label>
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
                <Label>Brand</Label>
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
                <Label>Condition</Label>
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
                    <SelectItem value="baik">Good</SelectItem>
                    <SelectItem value="rusak_ringan">Minor Damage</SelectItem>
                    <SelectItem value="rusak_berat">Major Damage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
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
              <Label>Notes</Label>
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
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingItem && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Equipment - Konfirmasi"
          itemName={deletingItem.nama_barang}
          itemType="Equipment/Inventaris"
          description={`Kode: ${deletingItem.kode_barang} | Stok: ${deletingItem.jumlah_tersedia}/${deletingItem.jumlah}`}
          consequences={[
            "Data equipment akan dihapus permanen",
            "Riwayat peminjaman equipment ini akan terpengaruh",
            "Data peminjaman yang sudah ada tetap tersimpan",
            "Tindakan ini tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
