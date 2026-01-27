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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  getLaboratoriumList,
  updateLaboratorium,
  createLaboratorium,
  deleteLaboratorium,
  type Laboratorium,
  type UpdateLaboratoriumData,
  type CreateLaboratoriumData,
} from "@/lib/api/laboran.api";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    try {
      await updateLaboratorium(editingLab.id, editFormData);
      toast.success("Laboratory updated successfully");
      setIsEditDialogOpen(false);
      // Invalidate cache and reload
      await invalidateCache("admin_laboratories_");
      await loadLaboratories(true);
    } catch (error) {
      toast.error("Failed to update laboratory");
      console.error(error);
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
    try {
      if (!addFormData.kode_lab || !addFormData.nama_lab) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createLaboratorium(addFormData);
      toast.success("Laboratory created successfully");
      setIsAddDialogOpen(false);
      // Invalidate cache and reload
      await invalidateCache("admin_laboratories_");
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error(
        "Failed to create laboratory: " + (error.message || "Unknown error"),
      );
      console.error(error);
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
      toast.success("Laboratory berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingLab(null);
      // Invalidate cache and reload
      await invalidateCache("admin_laboratories_");
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error("Gagal menghapus laboratory: " + error.message);
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
      await invalidateCache("admin_laboratories_");
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
      await invalidateCache("admin_laboratories_");
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error("Failed to update laboratories: " + error.message);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Laboratories Management</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            Manage all laboratory facilities
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Laboratory
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-linear-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Total Labs
            </CardTitle>
            <Building2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{laboratories.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Total Capacity
            </CardTitle>
            <Users className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">
              {laboratories.reduce((sum, lab) => sum + (lab.kapasitas || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Active Labs
            </CardTitle>
            <Building2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">
              {laboratories.filter((lab) => lab.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search laboratories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Laboratories Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">All Laboratories</CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            Manage laboratory facilities and information
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
                "150px",
                "80px",
                "100px",
                "160px",
              ]}
            />
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
                      <EnhancedTableHead className="w-[50px]">
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
                          <Badge
                            variant={lab.is_active ? "default" : "secondary"}
                          >
                            {lab.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </EnhancedTableCell>
                      )}
                      {columnVisibility.actions && (
                        <EnhancedTableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(lab)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(lab)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Laboratory
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Update laboratory information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kode_lab">Lab Code</Label>
              <Input
                id="kode_lab"
                value={editFormData.kode_lab || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, kode_lab: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="nama_lab">Lab Name</Label>
              <Input
                id="nama_lab"
                value={editFormData.nama_lab || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, nama_lab: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lokasi">Location</Label>
              <Input
                id="lokasi"
                value={editFormData.lokasi || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, lokasi: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="kapasitas">Capacity</Label>
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
            <div>
              <Label htmlFor="keterangan">Description</Label>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active ?? true}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    is_active: e.target.checked,
                  })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="font-semibold border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Add New Laboratory
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Create a new laboratory facility
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_kode_lab">Lab Code *</Label>
              <Input
                id="new_kode_lab"
                value={addFormData.kode_lab}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, kode_lab: e.target.value })
                }
                placeholder="LAB-001"
              />
            </div>
            <div>
              <Label htmlFor="new_nama_lab">Lab Name *</Label>
              <Input
                id="new_nama_lab"
                value={addFormData.nama_lab}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, nama_lab: e.target.value })
                }
                placeholder="Computer Laboratory"
              />
            </div>
            <div>
              <Label htmlFor="new_lokasi">Location</Label>
              <Input
                id="new_lokasi"
                value={addFormData.lokasi}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, lokasi: e.target.value })
                }
                placeholder="Building A, 2nd Floor"
              />
            </div>
            <div>
              <Label htmlFor="new_kapasitas">Capacity</Label>
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
            <div>
              <Label htmlFor="new_keterangan">Description</Label>
              <Input
                id="new_keterangan"
                value={addFormData.keterangan}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, keterangan: e.target.value })
                }
                placeholder="Computer lab with 30 workstations"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new_is_active"
                checked={addFormData.is_active ?? true}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    is_active: e.target.checked,
                  })
                }
              />
              <Label htmlFor="new_is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="font-semibold border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
              >
                Create Laboratory
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
            "Data laboratorium akan dihapus permanen",
            "Jadwal praktikum yang menggunakan lab ini akan terpengaruh",
            "Equipment/inventaris di lab ini tetap ada",
            "Tindakan ini tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
