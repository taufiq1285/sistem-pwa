/**
 * Admin Kelas Management Page - ENHANCED
 *
 * Features:
 * - View all Kelas (Universal Class)
 * - Create/Edit/Delete Kelas
 * - Manage student enrollments
 *
 * NOTE: Kelas bersifat universal, bisa digunakan oleh banyak dosen tanpa assign spesifik
 * NOTE: Mata kuliah dikelola di fitur terpisah
 */

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  RefreshCw,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { normalize } from "@/lib/utils/normalize";
import { isOnline as isOnlineNow } from "@/lib/offline/api-cache";
import { TableSkeleton } from "@/components/common";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API & Types
import {
  getKelas,
  createKelas,
  updateKelas,
  deleteKelas,
  getEnrolledStudents,
} from "@/lib/api/kelas.api";
import type { Kelas } from "@/types/kelas.types";
import { KelolaMahasiswaDialog } from "@/components/features/kelas/KelolaMahasiswaDialog";

export default function KelasPageEnhanced() {
  const hasLoadedRef = useRef(false);

  // State
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "all"
  >("active");

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: "",
    semester_ajaran: 1,
    tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    kuota: 30,
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingKelas, setDeletingKelas] = useState<Kelas | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Kelola Mahasiswa dialog state
  const [showKelolaMahasiswa, setShowKelolaMahasiswa] = useState(false);
  const [selectedKelasForMahasiswa, setSelectedKelasForMahasiswa] =
    useState<Kelas | null>(null);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
    }
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await loadKelas();
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadKelas = async () => {
    try {
      const data = await getKelas(
        statusFilter === "all" ? {} : { is_active: statusFilter === "active" },
      );
      setKelasList(data);
    } catch (error: any) {
      console.error("Error loading kelas:", error);
      throw error;
    }
  };

  const handleCreate = () => {
    setEditingKelas(null);
    setFormData({
      nama_kelas: "",
      semester_ajaran: 1,
      tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      kuota: 30,
    });
    setShowFormDialog(true);
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({
      nama_kelas: kelas.nama_kelas,
      semester_ajaran: kelas.semester_ajaran,
      tahun_ajaran: kelas.tahun_ajaran,
      kuota: kelas.kuota || 30,
    });
    setShowFormDialog(true);
  };

  const handleSaveKelas = async () => {
    if (!formData.nama_kelas) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    if (!isOnlineNow()) {
      toast.error(
        "Tidak dapat menyimpan kelas saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    // Proceed normally - no dosen assignment needed for universal class
    await executeSave(formData);
  };

  const executeSave = async (data: typeof formData) => {
    setIsProcessing(true);
    try {
      const normalizedFormData: any = {
        nama_kelas: normalize.kelasNama(data.nama_kelas),
        semester_ajaran: data.semester_ajaran,
        tahun_ajaran: data.tahun_ajaran,
        kuota: data.kuota,
      };

      if (editingKelas) {
        await updateKelas(editingKelas.id, normalizedFormData);
        toast.success("Kelas berhasil diperbarui");
      } else {
        await createKelas(normalizedFormData);
        toast.success("Kelas berhasil dibuat");
      }

      await loadKelas();
      setShowFormDialog(false);
      setFormData({
        nama_kelas: "",
        semester_ajaran: 1,
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        kuota: 30,
      });
    } catch (error: any) {
      console.error("Error saving kelas:", error);
      toast.error(error.message || "Gagal menyimpan kelas");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKelolaMahasiswa = (kelas: Kelas) => {
    setSelectedKelasForMahasiswa(kelas);
    setShowKelolaMahasiswa(true);
  };

  const handleDelete = (kelas: Kelas) => {
    setDeletingKelas(kelas);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKelas) return;

    if (!isOnlineNow()) {
      toast.error(
        "Tidak dapat menghapus kelas saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      await deleteKelas(deletingKelas.id);
      toast.success("Kelas berhasil diarsipkan");
      await loadKelas();
      setIsDeleteDialogOpen(false);
      setDeletingKelas(null);
    } catch (error: any) {
      console.error("Error deleting kelas:", error);
      toast.error(error.message || "Gagal menghapus kelas");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div className="space-y-2">
            <div className="h-8 w-48 skeleton-shimmer rounded-md" />
            <div className="h-4 w-72 skeleton-shimmer rounded-md" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-24 skeleton-shimmer rounded-md" />
            <div className="h-10 w-36 skeleton-shimmer rounded-md" />
          </div>
        </div>

        {/* Alert Info Skeleton */}
        <div className="h-16 w-full skeleton-shimmer rounded-md" />

        {/* Kelas Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kelas</CardTitle>
            <CardDescription>Memuat daftar kelas...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-24 skeleton-shimmer rounded-xs" />
                <div className="h-3 w-48 skeleton-shimmer rounded-xs" />
              </div>
              <div className="h-10 w-60 skeleton-shimmer rounded-md" />
            </div>
            <TableSkeleton rows={5} columns={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Kelas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kelas universal untuk pengelolaan mahasiswa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Kelas Baru
          </Button>
        </div>
      </div>

      {/* Alert Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Fitur Baru:</strong> Kelas universal untuk pengelolaan
          mahasiswa. Admin bisa mengelola mahasiswa di kelas, menambah mahasiswa
          yang sudah registrasi, dan update realtime saat ada mahasiswa baru.
        </AlertDescription>
      </Alert>

      {/* Kelas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>
            Total {kelasList.length} kelas terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Status Data
              </p>
              <p className="text-xs text-muted-foreground">
                Kelas yang dihapus dari admin akan masuk arsip, bukan hilang
                permanen.
              </p>
            </div>
            <div className="w-full max-w-60">
              <Select
                value={statusFilter}
                onValueChange={(value: "active" | "inactive" | "all") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Arsip</SelectItem>
                  <SelectItem value="all">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Semester/Tahun</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Belum ada kelas. Klik "Buat Kelas Baru" untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                kelasList.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell className="font-medium">
                      {kelas.nama_kelas}
                    </TableCell>
                    <TableCell>
                      Semester {kelas.semester_ajaran} • {kelas.tahun_ajaran}
                    </TableCell>
                    <TableCell>{kelas.kuota || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={kelas.is_active ? "default" : "secondary"}
                      >
                        {kelas.is_active ? "Aktif" : "Arsip"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleKelolaMahasiswa(kelas)}
                          className="table-action-btn table-action-btn-view"
                          title="Kelola Mahasiswa"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(kelas)}
                          className="table-action-btn table-action-btn-edit"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(kelas)}
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
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingKelas ? "Edit Kelas" : "Buat Kelas Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingKelas
                ? "Ubah informasi kelas universal untuk pengelolaan mahasiswa"
                : "Isi formulir untuk membuat kelas universal baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nama Kelas */}
            <div>
              <Label htmlFor="nama_kelas">Nama Kelas *</Label>
              <Input
                id="nama_kelas"
                placeholder="Contoh: Kelas A, Kelas Pagi"
                value={formData.nama_kelas}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kelas: e.target.value })
                }
              />
            </div>

            {/* Semester & Tahun Ajaran */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="semester_ajaran">Semester</Label>
                <Input
                  id="semester_ajaran"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="1"
                  value={formData.semester_ajaran}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      semester_ajaran: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="tahun_ajaran">Tahun Ajaran</Label>
                <Input
                  id="tahun_ajaran"
                  placeholder="2024/2025"
                  value={formData.tahun_ajaran}
                  onChange={(e) =>
                    setFormData({ ...formData, tahun_ajaran: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Kuota */}
            <div>
              <Label htmlFor="kuota">Kuota</Label>
              <Input
                id="kuota"
                type="text"
                inputMode="numeric"
                placeholder="30"
                value={formData.kuota}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty or numeric values only
                  if (value === "" || /^\d+$/.test(value)) {
                    setFormData({
                      ...formData,
                      kuota: value === "" ? 0 : parseInt(value),
                    });
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFormDialog(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button onClick={handleSaveKelas} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingKelas && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsDeleteDialogOpen(false);
              setDeletingKelas(null);
            }
          }}
          onConfirm={confirmDelete}
          title="Hapus Kelas"
          itemName={deletingKelas.nama_kelas}
          itemType="Kelas"
          description={`${deletingKelas.tahun_ajaran} - Semester ${deletingKelas.semester_ajaran}`}
          consequences={[
            "Kelas akan diarsipkan/nonaktifkan dari daftar aktif admin",
            "Mahasiswa tidak lagi melihat kelas ini sebagai kelas aktif",
            "Riwayat data yang sudah ada tetap dijaga oleh sistem",
          ]}
        />
      )}

      {/* Kelola Mahasiswa Dialog */}
      {selectedKelasForMahasiswa && (
        <KelolaMahasiswaDialog
          open={showKelolaMahasiswa}
          onOpenChange={(open) => {
            setShowKelolaMahasiswa(open);
            if (!open) {
              setSelectedKelasForMahasiswa(null);
            }
          }}
          kelas={{
            id: selectedKelasForMahasiswa.id,
            nama_kelas: selectedKelasForMahasiswa.nama_kelas,
            kuota: selectedKelasForMahasiswa.kuota,
          }}
        />
      )}
    </div>
  );
}
