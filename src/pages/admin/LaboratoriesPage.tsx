/**
 * Laboratories Management Page for Admin
 * CRUD for managing all laboratories
 */
import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Edit,
  Trash2,
  AlertCircle,
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
import { TableSkeleton } from "@/components/common";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getLaboratoriumList,
  updateLaboratorium,
  createLaboratorium,
  deleteLaboratorium,
  type Laboratorium,
  type UpdateLaboratoriumData,
  type CreateLaboratoriumData,
} from "@/lib/api/laboran.api";
import { cacheAPI, invalidateCachePatternSync } from "@/lib/offline/api-cache";

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingLab, setDeletingLab] = useState<Laboratorium | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit dialog
  const [editingLab, setEditingLab] = useState<Laboratorium | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateLaboratoriumData>({});

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreateLaboratoriumData>({
    kode_lab: "",
    nama_lab: "",
    lokasi: "",
    kapasitas: 0,
    keterangan: "",
    is_active: true,
  });

  // Phase 2: Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    select: true,
    code: true,
    name: true,
    location: true,
    capacity: true,
    status: true,
    actions: true,
  });

  // Phase 2: Export functionality
  const { exportToCSV } = useTableExport<Laboratorium>();

  // Phase 2: Row selection - must be at top level, not inside conditional render
  const rowSelection = useRowSelection({
    data: laboratories,
    getKey: (l) => l.id,
  });

  useEffect(() => {
    loadLaboratories(false);
  }, [searchQuery]);

  const loadLaboratories = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const cacheKey = `admin_laboratories_${searchQuery || ""}`;
      const data = await cacheAPI(
        cacheKey,
        () =>
          getLaboratoriumList({
            search: searchQuery || undefined,
          }),
        {
          ttl: 10 * 60 * 1000, // 10 minutes - laboratories rarely change
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setLaboratories(data);
    } catch (error) {
      toast.error("Failed to load laboratories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Invalidate all laboratory cache entries (with and without search)
  const invalidateLabCache = async () => {
    await invalidateCachePatternSync("admin_laboratories");
  };

  const handleEdit = (lab: Laboratorium) => {
    setEditingLab(lab);
    setEditFormData({
      kode_lab: lab.kode_lab,
      nama_lab: lab.nama_lab,
      kapasitas: lab.kapasitas || undefined,
      lokasi: lab.lokasi || undefined,
      is_active: lab.is_active ?? true,
      keterangan: lab.keterangan || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLab) return;
    setIsSaving(true);
    try {
      await updateLaboratorium(editingLab.id, editFormData);
      toast.success("Laboratory updated successfully");
      setIsEditDialogOpen(false);
      await invalidateLabCache();
      await loadLaboratories(true);
    } catch (error) {
      toast.error("Failed to update laboratory");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    setAddFormData({
      kode_lab: "",
      nama_lab: "",
      lokasi: "",
      kapasitas: 0,
      keterangan: "",
      is_active: true,
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!addFormData.kode_lab || !addFormData.nama_lab) {
      toast.error("Kode Lab dan Nama Lab wajib diisi");
      return;
    }
    setIsSaving(true);
    try {
      await createLaboratorium(addFormData);
      toast.success("Laboratory created successfully");
      setIsAddDialogOpen(false);
      await invalidateLabCache();
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error(
        "Failed to create laboratory: " + (error.message || "Unknown error"),
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (lab: Laboratorium) => {
    setDeletingLab(lab);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingLab) return;

    try {
      await deleteLaboratorium(deletingLab.id);
      toast.success("Laboratorium berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingLab(null);
      await invalidateLabCache();
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error(
        "Gagal menghapus laboratorium: " +
          (error.message ||
            "Laboratorium masih dipakai oleh inventaris atau jadwal praktikum."),
      );
    }
  };

  // Phase 2: Handle export
  const handleExport = () => {
    exportToCSV({
      columns: [
        { key: "kode_lab", label: "Code" },
        { key: "nama_lab", label: "Name" },
        { key: "lokasi", label: "Location" },
        { key: "kapasitas", label: "Capacity" },
        {
          key: "is_active",
          label: "Status",
          formatter: (val) => (val ? "Active" : "Inactive"),
        },
      ],
      data: laboratories,
      filename: `laboratories-${new Date().toISOString().split("T")[0]}`,
    });
    toast.success(`Exported ${laboratories.length} laboratories to CSV`);
  };

  // Phase 2: Handle bulk delete
  const handleBulkDelete = async (selectedLabs: Laboratorium[]) => {
    if (!confirm(`Delete ${selectedLabs.length} laboratories?`)) return;

    try {
      await Promise.all(selectedLabs.map((lab) => deleteLaboratorium(lab.id)));
      toast.success(`Successfully deleted ${selectedLabs.length} laboratories`);
      await invalidateLabCache();
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error("Failed to delete laboratories: " + error.message);
    }
  };

  // Phase 2: Handle bulk toggle status
  const handleBulkToggleStatus = async (
    selectedLabs: Laboratorium[],
    newStatus: boolean,
  ) => {
    try {
      await Promise.all(
        selectedLabs.map((lab) =>
          updateLaboratorium(lab.id, { is_active: newStatus }),
        ),
      );
      toast.success(
        `Successfully ${newStatus ? "activated" : "deactivated"} ${selectedLabs.length} laboratories`,
      );
      await invalidateLabCache();
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error("Failed to update laboratories: " + error.message);
    }
  };

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Laboratorium
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola master data laboratorium untuk mendukung operasional kampus
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="font-semibold bg-linear-to-r from-primary to-accent shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Lab
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard
          title="Total Lab"
          value={laboratories.length}
          icon={Building2}
          color="blue"
        />
        <DashboardCard
          title="Total Kapasitas"
          value={laboratories.reduce(
            (sum, lab) => sum + (lab.kapasitas || 0),
            0,
          )}
          icon={Users}
          color="purple"
        />
        <DashboardCard
          title="Lab Aktif"
          value={laboratories.filter((lab) => lab.is_active).length}
          icon={Building2}
          color="green"
        />
      </div>

      <Alert className="border-amber-300/40 bg-amber-50/60 dark:border-amber-700/30 dark:bg-amber-900/10">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Halaman ini berfungsi sebagai master data laboratorium. Laboratorium
          hanya bisa dihapus jika belum dipakai oleh inventaris maupun jadwal
          praktikum.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari laboratorium..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Laboratories Table */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Daftar Laboratorium
          </CardTitle>
          <CardDescription>
            Kelola fasilitas dan informasi laboratorium
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : laboratories.length === 0 ? (
            searchQuery ? (
              <EmptySearchResults onClear={() => setSearchQuery("")} />
            ) : (
              <EnhancedEmptyState
                icon={Building2}
                title="No laboratories found"
                description="Create your first laboratory to get started with lab management."
                action={{
                  label: "Add Laboratory",
                  onClick: handleAdd,
                }}
              />
            )
          ) : (
            <>
              {/* Bulk Actions Bar */}
              <BulkActionsBar
                selectedCount={rowSelection.selectedCount}
                onClearSelection={rowSelection.clearSelection}
                isAllSelected={rowSelection.isAllSelected}
                isSomeSelected={rowSelection.isSomeSelected}
                onSelectAll={() => rowSelection.toggleAll()}
                actions={[
                  BulkActions.delete(
                    () => handleBulkDelete(rowSelection.selectedItems),
                    rowSelection.selectedCount,
                  ),
                  BulkActions.activate(() =>
                    handleBulkToggleStatus(rowSelection.selectedItems, true),
                  ),
                  BulkActions.deactivate(() =>
                    handleBulkToggleStatus(rowSelection.selectedItems, false),
                  ),
                ]}
              />

              {/* Toolbar with Export and Column Visibility */}
              <div className="flex items-center justify-between mb-4">
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
                      { id: "select", label: "Select", visible: true },
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
                        id: "location",
                        label: "Location",
                        visible: columnVisibility.location,
                      },
                      {
                        id: "capacity",
                        label: "Capacity",
                        visible: columnVisibility.capacity,
                      },
                      {
                        id: "status",
                        label: "Status",
                        visible: columnVisibility.status,
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
                          onCheckedChange={() => rowSelection.toggleAll()}
                        />
                      </EnhancedTableHead>
                    )}
                    {columnVisibility.code && (
                      <EnhancedTableHead>Code</EnhancedTableHead>
                    )}
                    {columnVisibility.name && (
                      <EnhancedTableHead>Name</EnhancedTableHead>
                    )}
                    {columnVisibility.location && (
                      <EnhancedTableHead>Location</EnhancedTableHead>
                    )}
                    {columnVisibility.capacity && (
                      <EnhancedTableHead>Capacity</EnhancedTableHead>
                    )}
                    {columnVisibility.status && (
                      <EnhancedTableHead>Status</EnhancedTableHead>
                    )}
                    {columnVisibility.actions && (
                      <EnhancedTableHead>Actions</EnhancedTableHead>
                    )}
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <TableBody>
                  {laboratories.map((lab) => (
                    <EnhancedTableRow key={lab.id}>
                      {columnVisibility.select && (
                        <EnhancedTableCell>
                          <RowSelectionCell
                            checked={rowSelection.isSelected(lab)}
                            onCheckedChange={() => rowSelection.toggleRow(lab)}
                          />
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.code && (
                        <EnhancedTableCell className="font-mono text-xs">
                          {lab.kode_lab}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.name && (
                        <EnhancedTableCell className="font-medium">
                          {lab.nama_lab}
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.location && (
                        <EnhancedTableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {lab.lokasi || "-"}
                          </div>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.capacity && (
                        <EnhancedTableCell>{lab.kapasitas}</EnhancedTableCell>
                      )}
                      {columnVisibility.status && (
                        <EnhancedTableCell>
                          <StatusBadge
                            status={lab.is_active ? "success" : "offline"}
                            pulse={lab.is_active}
                          >
                            {lab.is_active ? "Aktif" : "Nonaktif"}
                          </StatusBadge>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.actions && (
                        <EnhancedTableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(lab)}
                              className="table-action-btn table-action-btn-edit"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(lab)}
                              className="table-action-btn table-action-btn-delete"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Edit Laboratorium
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi laboratorium
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="kode_lab">Kode Lab</Label>
              <Input
                id="kode_lab"
                value={editFormData.kode_lab || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, kode_lab: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_lab">Nama Lab</Label>
              <Input
                id="nama_lab"
                value={editFormData.nama_lab || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, nama_lab: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={editFormData.lokasi || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, lokasi: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kapasitas">Kapasitas</Label>
              <Input
                id="kapasitas"
                type="text"
                inputMode="numeric"
                value={editFormData.kapasitas || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+$/.test(value)) {
                    setEditFormData({
                      ...editFormData,
                      kapasitas: value === "" ? 0 : parseInt(value),
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                value={editFormData.keterangan || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    keterangan: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3.5 py-2.5">
              <Label htmlFor="is_active" className="cursor-pointer font-medium">
                Status Aktif
              </Label>
              <button
                id="is_active"
                type="button"
                role="switch"
                aria-checked={editFormData.is_active ?? true}
                onClick={() =>
                  setEditFormData({
                    ...editFormData,
                    is_active: !(editFormData.is_active ?? true),
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  (editFormData.is_active ?? true)
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                    (editFormData.is_active ?? true)
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && (
                  <span className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" />
                )}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Tambah Laboratorium Baru
            </DialogTitle>
            <DialogDescription>
              Buat fasilitas laboratorium baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new_kode_lab">Kode Lab *</Label>
              <Input
                id="new_kode_lab"
                value={addFormData.kode_lab}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, kode_lab: e.target.value })
                }
                placeholder="LAB-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_nama_lab">Nama Lab *</Label>
              <Input
                id="new_nama_lab"
                value={addFormData.nama_lab}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, nama_lab: e.target.value })
                }
                placeholder="Laboratorium Komputer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_lokasi">Lokasi</Label>
              <Input
                id="new_lokasi"
                value={addFormData.lokasi}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, lokasi: e.target.value })
                }
                placeholder="Gedung A, Lantai 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_kapasitas">Kapasitas</Label>
              <Input
                id="new_kapasitas"
                type="text"
                inputMode="numeric"
                value={addFormData.kapasitas}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d+$/.test(value)) {
                    setAddFormData({
                      ...addFormData,
                      kapasitas: value === "" ? 0 : parseInt(value),
                    });
                  }
                }}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_keterangan">Keterangan</Label>
              <Input
                id="new_keterangan"
                value={addFormData.keterangan}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, keterangan: e.target.value })
                }
                placeholder="Lab komputer dengan 30 workstation"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3.5 py-2.5">
              <Label
                htmlFor="new_is_active"
                className="cursor-pointer font-medium"
              >
                Status Aktif
              </Label>
              <button
                id="new_is_active"
                type="button"
                role="switch"
                aria-checked={addFormData.is_active ?? true}
                onClick={() =>
                  setAddFormData({
                    ...addFormData,
                    is_active: !(addFormData.is_active ?? true),
                  })
                }
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  (addFormData.is_active ?? true)
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                    (addFormData.is_active ?? true)
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSaving}
                className="font-semibold bg-linear-to-r from-primary to-accent"
              >
                {isSaving && (
                  <span className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full inline-block" />
                )}
                Buat Lab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingLab && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Laboratorium - Konfirmasi"
          itemName={deletingLab.nama_lab}
          itemType="Laboratorium"
          description={`Kode: ${deletingLab.kode_lab} | Lokasi: ${deletingLab.lokasi || "Tidak ada"}`}
          consequences={[
            "Laboratorium hanya bisa dihapus jika belum dipakai inventaris",
            "Laboratorium hanya bisa dihapus jika belum dipakai jadwal praktikum",
            "Jika masih dipakai data lain, sistem akan menolak penghapusan",
            "Penghapusan yang berhasil tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
