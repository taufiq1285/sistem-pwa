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
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { normalize } from "@/lib/utils/normalize";

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
  const [selectedKelasForMahasiswa, setSelectedKelasForMahasiswa] = useState<Kelas | null>(null);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadData();
  }, []);

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
      const data = await getKelas({ is_active: undefined });
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

    setIsProcessing(true);
    try {
      await deleteKelas(deletingKelas.id);
      toast.success("Kelas berhasil dihapus");
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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
          <p className="text-gray-600">
            Kelola kelas universal untuk pengelolaan mahasiswa
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Kelas Baru
        </Button>
      </div>

      {/* Alert Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Fitur Baru:</strong> Kelas universal untuk pengelolaan mahasiswa.
          Admin bisa mengelola mahasiswa di kelas, menambah mahasiswa yang sudah registrasi,
          dan update realtime saat ada mahasiswa baru.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Semester/Tahun</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKelolaMahasiswa(kelas)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(kelas)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(kelas)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            "Data kelas akan dihapus permanen",
            "Mahasiswa yang terdaftar akan kehilangan akses ke kelas ini",
            "Semua data nilai dan tugas terkait akan hilang",
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
