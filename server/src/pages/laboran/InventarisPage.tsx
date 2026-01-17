/**
 * Inventaris Management Page
 *
 * Full CRUD for managing laboratory equipment inventory
 */

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [inventaris, setInventaris] = useState<InventarisListItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadInventaris();
    loadCategories();
  }, [searchQuery, selectedKategori]);

  const loadInventaris = async () => {
    try {
      setLoading(true);
      const result = await getInventarisList({
        search: searchQuery || undefined,
        kategori: selectedKategori || undefined,
      });
      setInventaris(result.data);
      setTotalCount(result.count);
    } catch (error) {
      toast.error("Failed to load inventaris data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getInventarisCategories();
      if (cats.length > 0) setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
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
        toast.error("Please fill in all required fields");
        return;
      }
      if (selectedItem) {
        await updateInventaris(selectedItem.id, formData);
        toast.success("Inventaris updated successfully");
      } else {
        await createInventaris(formData as CreateInventarisData);
        toast.success("Inventaris created successfully");
      }
      setIsFormOpen(false);
      loadInventaris();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save inventaris";
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteInventaris(selectedItem.id);
      toast.success("Inventaris deleted successfully");
      setIsDeleteOpen(false);
      loadInventaris();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete inventaris";
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
      toast.success("Stock updated successfully");
      setIsStockOpen(false);
      loadInventaris();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update stock";
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

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventaris Lab</h1>
            <p className="text-muted-foreground">
              Manage laboratory equipment and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Total Items</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{totalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <h3 className="text-sm font-medium">Low Stock</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {inventaris.filter((i) => i.jumlah_tersedia < 5).length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Categories</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{categories.length}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedKategori || undefined}
            onValueChange={(value) => setSelectedKategori(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedKategori && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedKategori("")}
              title="Clear filter"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="rounded-md border">
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
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : inventaris.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                inventaris.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">
                      {item.kode_barang}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {item.nama_barang}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {item.kategori || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {item.merk || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {item.jumlah}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.jumlah_tersedia < 5
                            ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                            : "font-medium text-gray-900 dark:text-gray-100"
                        }
                      >
                        {item.jumlah_tersedia}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          KONDISI_OPTIONS.find((k) => k.value === item.kondisi)
                            ?.variant || "default"
                        }
                      >
                        {KONDISI_OPTIONS.find((k) => k.value === item.kondisi)
                          ?.label || item.kondisi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {item.laboratorium?.nama_lab || "Depot"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStockManagement(item)}
                          title="Manage Stock"
                        >
                          <Package className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Edit Inventaris" : "Add New Inventaris"}
              </DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? "Update inventory item details"
                  : "Add a new item to the inventory"}
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
                      <SelectValue placeholder="Select category" />
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
                          harga_satuan: value === "" ? undefined : parseFloat(value),
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
                          tahun_pengadaan: value === "" ? undefined : parseInt(value),
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
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{selectedItem?.nama_barang}". This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stock Management Dialog */}
        <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Stock</DialogTitle>
              <DialogDescription>
                Adjust stock for: {selectedItem?.nama_barang}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Total</p>
                    <p className="text-2xl font-bold">{selectedItem?.jumlah}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">
                      {selectedItem?.jumlah_tersedia}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
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
                        Add Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Subtract Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="set">Set Exact Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
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
                Cancel
              </Button>
              <Button onClick={handleStockUpdate}>Update Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
