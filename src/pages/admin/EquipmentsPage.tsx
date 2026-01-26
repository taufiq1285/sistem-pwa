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
    try {
      if (!addFormData.kode_barang || !addFormData.nama_barang) {
        toast.error("Please fill in all required fields (Code, Name)");
        return;
      }

      // Validate jumlah_tersedia
      if (addFormData.jumlah_tersedia > addFormData.jumlah) {
        toast.error("Available quantity cannot be greater than total quantity");
        return;
      }

      // Create equipment with laboratorium_id as null (stored in central depot)
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

    try {
      if (!editFormData.kode_barang || !editFormData.nama_barang) {
        toast.error("Please fill in all required fields (Code, Name)");
        return;
      }

      if (editFormData.jumlah_tersedia > editFormData.jumlah) {
        toast.error("Available quantity cannot be greater than total quantity");
        return;
      }

      await updateInventaris(editingItem.id, {
        ...editFormData,
        laboratorium_id: null,
      });
      toast.success("Equipment updated successfully");
      setIsEditDialogOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error: any) {
      toast.error(
        "Failed to update equipment: " + (error.message || "Unknown error"),
      );
      console.error(error);
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
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Equipment Management</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            Manage laboratory equipment and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            className="font-semibold border-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleAdd}
            className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg bg-linear-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Total
            </CardTitle>
            <Package className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Good Condition
            </CardTitle>
            <Package className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.available}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              Damaged
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.damaged}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold text-white">
              In Use
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.borrowed}</div>
          </CardContent>
        </Card>
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
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredInventaris.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No equipment found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Stock</TableHead>
                  <TableHead className="font-semibold">Condition</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventaris.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">
                      {item.kode_barang}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.nama_barang}
                    </TableCell>
                    <TableCell>{item.kategori || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          item.jumlah_tersedia < item.jumlah
                            ? "text-orange-600"
                            : ""
                        }
                      >
                        {item.jumlah_tersedia}
                      </span>
                      {" / "}
                      {item.jumlah}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.kondisi === "baik"
                            ? "default"
                            : item.kondisi === "rusak_ringan"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.kondisi}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                className="font-semibold border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
              >
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
                className="font-semibold border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
              >
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
