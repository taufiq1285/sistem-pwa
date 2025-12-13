/**
 * Laboratorium Management Page for Laboran
 *
 * Manage laboratory information, schedules, and equipment.
 *
 * Features:
 * - View all laboratories
 * - Create new laboratory
 * - Edit laboratory information
 * - Delete laboratory (with validation)
 * - View lab details (schedule, equipment)
 * - Search and filter labs
 */

import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Calendar,
  Package,
  Users,
  MapPin,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLaboratoriumList,
  getLabScheduleByLabId,
  getLabEquipment,
  createLaboratorium,
  updateLaboratorium,
  deleteLaboratorium,
  type LabScheduleItem,
  type LabEquipmentItem,
  type CreateLaboratoriumData,
} from "@/lib/api/laboran.api";
import type { Laboratorium } from "@/lib/api/laboran.api";
import { formatDate } from "@/lib/utils/format";

type FormMode = "create" | "edit" | null;

interface FormData extends CreateLaboratoriumData {
  id?: string;
}

export default function LaboratoriumPage() {
  const [laboratories, setLaboratories] = useState<Laboratorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Detail dialog state
  const [selectedLab, setSelectedLab] = useState<Laboratorium | null>(null);
  const [labSchedule, setLabSchedule] = useState<LabScheduleItem[]>([]);
  const [labEquipment, setLabEquipment] = useState<LabEquipmentItem[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form dialog state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    kode_lab: "",
    nama_lab: "",
    lokasi: "",
    kapasitas: 30,
    keterangan: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<Laboratorium | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadLaboratories();
  }, [searchQuery]);

  const loadLaboratories = async () => {
    try {
      setLoading(true);
      const data = await getLaboratoriumList({
        search: searchQuery || undefined,
        is_active: true,
      });
      setLaboratories(data as Laboratorium[]);
    } catch (error) {
      toast.error("Gagal memuat data laboratorium");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (lab: Laboratorium) => {
    setSelectedLab(lab);
    setDetailDialogOpen(true);
    setLoadingDetail(true);

    try {
      const [schedule, equipment] = await Promise.all([
        getLabScheduleByLabId(lab.id, 10),
        getLabEquipment(lab.id),
      ]);
      setLabSchedule(schedule);
      setLabEquipment(equipment);
    } catch (error) {
      toast.error("Gagal memuat detail laboratorium");
      console.error(error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefresh = () => {
    loadLaboratories();
    toast.success("Data diperbarui");
  };

  // ============================================================================
  // CREATE / EDIT HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setFormMode("create");
    setFormData({
      kode_lab: "",
      nama_lab: "",
      lokasi: "",
      kapasitas: 30,
      keterangan: "",
      is_active: true,
    });
    setFormDialogOpen(true);
  };

  const handleEdit = (lab: Laboratorium) => {
    setFormMode("edit");
    setFormData({
      id: lab.id,
      kode_lab: lab.kode_lab,
      nama_lab: lab.nama_lab,
      lokasi: lab.lokasi || "",
      kapasitas: lab.kapasitas || 30,
      keterangan: lab.keterangan || "",
      is_active: lab.is_active ?? true,
    });
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.kode_lab.trim()) {
      toast.error("Kode lab harus diisi");
      return;
    }
    if (!formData.nama_lab.trim()) {
      toast.error("Nama lab harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const submitData: CreateLaboratoriumData = {
        kode_lab: formData.kode_lab.trim(),
        nama_lab: formData.nama_lab.trim(),
        lokasi: formData.lokasi?.trim() || undefined,
        kapasitas: formData.kapasitas || 30,
        keterangan: formData.keterangan?.trim() || undefined,
        is_active: formData.is_active ?? true,
      };

      if (formMode === "create") {
        await createLaboratorium(submitData);
        toast.success("Laboratorium berhasil ditambahkan");
      } else if (formMode === "edit" && formData.id) {
        await updateLaboratorium(formData.id, submitData);
        toast.success("Laboratorium berhasil diperbarui");
      }

      setFormDialogOpen(false);
      loadLaboratories();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(
        error.message ||
          `Gagal ${formMode === "create" ? "menambahkan" : "memperbarui"} laboratorium`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================

  const handleDeleteClick = (lab: Laboratorium) => {
    setLabToDelete(lab);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!labToDelete) return;

    try {
      setDeleting(true);
      await deleteLaboratorium(labToDelete.id);
      toast.success("Laboratorium berhasil dihapus");
      setDeleteDialogOpen(false);
      loadLaboratories();
    } catch (error: any) {
      console.error("Error deleting laboratorium:", error);
      toast.error(error.message || "Gagal menghapus laboratorium");
    } finally {
      setDeleting(false);
    }
  };

  const filteredLabs = laboratories;

  return (
    <div className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Laboratorium</h1>
            <p className="text-muted-foreground">
              Kelola informasi laboratorium dan fasilitas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Laboratorium
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Laboratorium
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{laboratories.length}</div>
              <p className="text-xs text-muted-foreground">
                Laboratorium aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Kapasitas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {laboratories.reduce(
                  (sum, lab) => sum + (lab.kapasitas || 0),
                  0,
                )}
              </div>
              <p className="text-xs text-muted-foreground">Mahasiswa</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rata-rata Kapasitas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {laboratories.length > 0
                  ? Math.round(
                      laboratories.reduce(
                        (sum, lab) => sum + (lab.kapasitas || 0),
                        0,
                      ) / laboratories.length,
                    )
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">Per lab</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari laboratorium..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Laboratories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Laboratorium</CardTitle>
            <CardDescription>
              Kelola data laboratorium praktikum
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada laboratorium ditemukan
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Lab</TableHead>
                      <TableHead>Nama Laboratorium</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead className="text-right">Kapasitas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell className="font-mono text-sm">
                          {lab.kode_lab}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lab.nama_lab}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {lab.lokasi || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {lab.kapasitas}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={lab.is_active ? "default" : "secondary"}
                          >
                            {lab.is_active ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(lab)}
                            >
                              Detail
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(lab)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(lab)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================================== */}
      {/* DETAIL DIALOG */}
      {/* ======================================================================== */}

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedLab?.nama_lab}
            </DialogTitle>
            <DialogDescription>
              Detail informasi, jadwal, dan inventaris laboratorium
            </DialogDescription>
          </DialogHeader>

          {selectedLab && (
            <div className="space-y-6">
              {/* Lab Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Laboratorium</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Kode Lab</p>
                    <p className="font-mono font-semibold">
                      {selectedLab.kode_lab}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kapasitas</p>
                    <p className="font-semibold">
                      {selectedLab.kapasitas} mahasiswa
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi</p>
                    <p className="font-semibold">{selectedLab.lokasi || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={selectedLab.is_active ? "default" : "secondary"}
                    >
                      {selectedLab.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                  {selectedLab.keterangan && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Keterangan
                      </p>
                      <p className="font-medium">{selectedLab.keterangan}</p>
                    </div>
                  )}
                  {selectedLab.fasilitas &&
                    selectedLab.fasilitas.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Fasilitas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedLab.fasilitas.map((fasilitas, idx) => (
                            <Badge key={idx} variant="outline">
                              {fasilitas}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Jadwal Praktikum (10 Terdekat)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDetail ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading...
                    </div>
                  ) : labSchedule.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Tidak ada jadwal mendatang
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Mata Kuliah</TableHead>
                          <TableHead>Dosen</TableHead>
                          <TableHead>Topik</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labSchedule.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              {formatDate(schedule.tanggal_praktikum)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {schedule.jam_mulai} - {schedule.jam_selesai}
                            </TableCell>
                            <TableCell>{schedule.kelas_nama}</TableCell>
                            <TableCell>{schedule.mata_kuliah_nama}</TableCell>
                            <TableCell>{schedule.dosen_nama}</TableCell>
                            <TableCell>{schedule.topik || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Equipment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Inventaris Peralatan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDetail ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading...
                    </div>
                  ) : labEquipment.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Tidak ada peralatan terdaftar
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama Barang</TableHead>
                          <TableHead>Kondisi</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Tersedia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labEquipment.map((equipment) => (
                          <TableRow key={equipment.id}>
                            <TableCell className="font-mono text-sm">
                              {equipment.kode_barang}
                            </TableCell>
                            <TableCell>{equipment.nama_barang}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  equipment.kondisi === "baik"
                                    ? "default"
                                    : equipment.kondisi === "rusak_ringan"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {equipment.kondisi || "baik"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {equipment.jumlah}
                            </TableCell>
                            <TableCell className="text-right">
                              {equipment.jumlah_tersedia}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================================== */}
      {/* CREATE / EDIT FORM DIALOG */}
      {/* ======================================================================== */}

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Tambah Laboratorium Baru"
                : "Edit Laboratorium"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Tambahkan laboratorium praktikum baru"
                : "Perbarui informasi laboratorium"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Kode Lab */}
              <div className="space-y-2">
                <Label htmlFor="kode_lab">
                  Kode Lab <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kode_lab"
                  value={formData.kode_lab}
                  onChange={(e) =>
                    setFormData({ ...formData, kode_lab: e.target.value })
                  }
                  placeholder="LAB-01"
                  required
                />
              </div>

              {/* Kapasitas */}
              <div className="space-y-2">
                <Label htmlFor="kapasitas">Kapasitas</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kapasitas: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Nama Lab */}
            <div className="space-y-2">
              <Label htmlFor="nama_lab">
                Nama Laboratorium <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama_lab"
                value={formData.nama_lab}
                onChange={(e) =>
                  setFormData({ ...formData, nama_lab: e.target.value })
                }
                placeholder="Laboratorium Komputer 1"
                required
              />
            </div>

            {/* Lokasi */}
            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) =>
                  setFormData({ ...formData, lokasi: e.target.value })
                }
                placeholder="Gedung A, Lantai 2"
              />
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Informasi tambahan tentang laboratorium..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_active: value === "active" })
                }
              >
                <SelectTrigger id="is_active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Menyimpan..."
                  : formMode === "create"
                    ? "Tambah"
                    : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================================== */}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Laboratorium?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <strong>{labToDelete?.nama_lab}</strong> (
              {labToDelete?.kode_lab}).
              <br />
              <br />
              <span className="text-red-600 font-semibold">
                Aksi ini tidak dapat dibatalkan!
              </span>
              <br />
              <br />
              Laboratorium tidak dapat dihapus jika:
              <ul className="list-disc pl-5 mt-2">
                <li>Masih memiliki inventaris/peralatan</li>
                <li>Masih memiliki jadwal praktikum</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
