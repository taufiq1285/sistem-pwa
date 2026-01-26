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
      toast.success(
        `Laboratory "${deletingLab.nama_lab}" deleted successfully`,
      );
      setIsDeleteDialogOpen(false);
      setDeletingLab(null);
      // Invalidate cache and reload
      await invalidateCache("admin_laboratories_");
      await loadLaboratories(true);
    } catch (error: any) {
      toast.error(
        "Failed to delete laboratory: " + (error.message || "Unknown error"),
      );
      console.error(error);
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
            <div className="text-center py-8">Loading...</div>
          ) : laboratories.length === 0 ? (
            <div className="text-center py-8">No laboratories found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laboratories.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-mono">{lab.kode_lab}</TableCell>
                    <TableCell className="font-medium">
                      {lab.nama_lab}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lab.lokasi || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{lab.kapasitas}</TableCell>
                    <TableCell>
                      <Badge variant={lab.is_active ? "default" : "secondary"}>
                        {lab.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
