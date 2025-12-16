/**
 * Admin Kelas Management Page - ENHANCED
 *
 * Features:
 * - View all Kelas
 * - Create/Edit/Delete Kelas
 * - ASSIGN/REASSIGN DOSEN to Kelas ✅ NEW
 * - Assign Mata Kuliah to Kelas ✅ NEW
 * - Konfirmasi dialog saat ganti dosen ✅ NEW
 * - Auto-notification ke mahasiswa saat dosen diganti ✅ NEW
 * - Manage student enrollments
 */

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  UserPlus,
  CheckCircle,
  AlertTriangle,
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
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import { supabase } from "@/lib/supabase/client";
import {
  notifyMahasiswaDosenChanged,
  notifyDosenNewAssignment,
  notifyDosenRemoval,
} from "@/lib/api/notification.api";
import type { Kelas } from "@/types/kelas.types";
import type { MataKuliah } from "@/types/mata-kuliah.types";

interface DosenInfo {
  id: string;
  nip: string;
  user_id: string;
  full_name: string;
}

export default function KelasPageEnhanced() {
  const hasLoadedRef = useRef(false);

  // State
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [dosenList, setDosenList] = useState<DosenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: "",
    mata_kuliah_id: "",
    dosen_id: "",
    semester_ajaran: 1,
    tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    ruangan: "",
    kuota: 30,
  });

  // Konfirmasi dialog state
  const [showDosenChangeConfirm, setShowDosenChangeConfirm] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingKelas, setDeletingKelas] = useState<Kelas | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadKelas(), loadMataKuliah(), loadDosen()]);
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

  const loadMataKuliah = async () => {
    try {
      const data = await getMataKuliah();
      setMataKuliahList(data);
    } catch (error: any) {
      console.error("Error loading mata kuliah:", error);
      throw error;
    }
  };

  const loadDosen = async () => {
    try {
      const { data, error } = await supabase
        .from("dosen")
        .select(
          `
          id,
          nip,
          user_id,
          users:user_id (
            full_name
          )
        `,
        )
        .order("nip", { ascending: true });

      if (error) throw error;

      const dosenData: DosenInfo[] = (data || []).map((d: any) => ({
        id: d.id,
        nip: d.nip,
        user_id: d.user_id,
        full_name: d.users?.full_name || "Unknown",
      }));

      setDosenList(dosenData);
    } catch (error: any) {
      console.error("Error loading dosen:", error);
      throw error;
    }
  };

  const handleCreate = () => {
    setEditingKelas(null);
    setFormData({
      nama_kelas: "",
      mata_kuliah_id: "",
      dosen_id: "",
      semester_ajaran: 1,
      tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      ruangan: "",
      kuota: 30,
    });
    setShowFormDialog(true);
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({
      nama_kelas: kelas.nama_kelas,
      mata_kuliah_id: kelas.mata_kuliah_id || "",
      dosen_id: kelas.dosen_id || "",
      semester_ajaran: kelas.semester_ajaran,
      tahun_ajaran: kelas.tahun_ajaran,
      ruangan: kelas.ruangan || "",
      kuota: kelas.kuota || 30,
    });
    setShowFormDialog(true);
  };

  const handleSaveKelas = async () => {
    if (!formData.nama_kelas) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    // Check if dosen changed (only for edit mode)
    if (editingKelas && editingKelas.dosen_id !== formData.dosen_id) {
      // Trigger konfirmasi dialog
      setPendingSaveData(formData);
      setShowDosenChangeConfirm(true);
      return;
    }

    // No dosen change, proceed normally
    await executeSave(formData);
  };

  const executeSave = async (data: typeof formData) => {
    setIsProcessing(true);
    try {
      const normalizedFormData: any = {
        nama_kelas: normalize.kelasNama(data.nama_kelas),
        mata_kuliah_id: data.mata_kuliah_id || null,
        dosen_id: data.dosen_id || null,
        semester_ajaran: data.semester_ajaran,
        tahun_ajaran: data.tahun_ajaran,
        ruangan: data.ruangan || null,
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
        mata_kuliah_id: "",
        dosen_id: "",
        semester_ajaran: 1,
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        ruangan: "",
        kuota: 30,
      });
    } catch (error: any) {
      console.error("Error saving kelas:", error);
      toast.error(error.message || "Gagal menyimpan kelas");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDosenChange = async () => {
    if (!pendingSaveData || !editingKelas) return;

    setShowDosenChangeConfirm(false);
    setIsProcessing(true);

    try {
      // 1. Update kelas
      await updateKelas(editingKelas.id, {
        nama_kelas: normalize.kelasNama(pendingSaveData.nama_kelas),
        mata_kuliah_id: pendingSaveData.mata_kuliah_id || null,
        dosen_id: pendingSaveData.dosen_id || null,
        semester_ajaran: pendingSaveData.semester_ajaran,
        tahun_ajaran: pendingSaveData.tahun_ajaran,
        ruangan: pendingSaveData.ruangan || null,
        kuota: pendingSaveData.kuota,
      });

      // 2. Get mahasiswa list
      const enrolledStudents = await getEnrolledStudents(editingKelas.id);
      const mahasiswaUserIds = enrolledStudents
        .map((e: any) => e.mahasiswa?.users?.id || e.mahasiswa?.user_id)
        .filter(Boolean);

      // 3. Get dosen info
      const oldDosen = dosenList.find((d) => d.id === editingKelas.dosen_id);
      const newDosen = dosenList.find((d) => d.id === pendingSaveData.dosen_id);
      const mataKuliah = mataKuliahList.find(
        (mk) => mk.id === pendingSaveData.mata_kuliah_id,
      );

      // 4. Send notifications
      if (mahasiswaUserIds.length > 0 && oldDosen && newDosen) {
        await notifyMahasiswaDosenChanged(
          mahasiswaUserIds,
          pendingSaveData.nama_kelas,
          mataKuliah?.nama_mk || "Mata Kuliah",
          oldDosen.full_name,
          newDosen.full_name,
          editingKelas.id,
        );

        // Notify new dosen
        await notifyDosenNewAssignment(
          newDosen.user_id,
          pendingSaveData.nama_kelas,
          mataKuliah?.nama_mk || "Mata Kuliah",
          mahasiswaUserIds.length,
          editingKelas.id,
        );

        // Notify old dosen
        if (oldDosen.user_id) {
          await notifyDosenRemoval(
            oldDosen.user_id,
            pendingSaveData.nama_kelas,
            mataKuliah?.nama_mk || "Mata Kuliah",
            newDosen.full_name,
            editingKelas.id,
          );
        }

        console.log(
          `[NOTIFICATION] ${mahasiswaUserIds.length} mahasiswa notified about dosen change`,
        );
      }

      toast.success(
        `Dosen berhasil diganti. ${mahasiswaUserIds.length} mahasiswa telah dinotifikasi.`,
      );
      await loadKelas();
      setShowFormDialog(false);
      setPendingSaveData(null);
    } catch (error: any) {
      console.error("Error changing dosen:", error);
      toast.error(error.message || "Gagal mengganti dosen");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelDosenChange = () => {
    setShowDosenChangeConfirm(false);
    setPendingSaveData(null);
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

  // Helper to get mata kuliah name
  const getMataKuliahName = (id: string | null) => {
    if (!id) return "-";
    const mk = mataKuliahList.find((m) => m.id === id);
    return mk ? `${mk.kode_mk} - ${mk.nama_mk}` : "-";
  };

  // Helper to get dosen name
  const getDosenName = (id: string | null) => {
    if (!id) return "-";
    const dosen = dosenList.find((d) => d.id === id);
    return dosen ? dosen.full_name : "-";
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
            Kelola kelas, assign dosen, dan atur mata kuliah
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
          <strong>Fitur Baru:</strong> Admin sekarang bisa mengganti dosen untuk
          kelas yang sudah berjalan. Mahasiswa akan otomatis dinotifikasi saat
          terjadi pergantian dosen.
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
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Semester/Tahun</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelasList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
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
                      {getMataKuliahName(kelas.mata_kuliah_id)}
                    </TableCell>
                    <TableCell>{getDosenName(kelas.dosen_id)}</TableCell>
                    <TableCell>
                      Semester {kelas.semester_ajaran} • {kelas.tahun_ajaran}
                    </TableCell>
                    <TableCell>{kelas.kuota || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                ? "Ubah informasi kelas termasuk dosen pengampu"
                : "Isi formulir untuk membuat kelas baru"}
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

            {/* Mata Kuliah */}
            <div>
              <Label htmlFor="mata_kuliah_id">Mata Kuliah</Label>
              <Select
                value={formData.mata_kuliah_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, mata_kuliah_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {mataKuliahList.map((mk) => (
                    <SelectItem key={mk.id} value={mk.id}>
                      {mk.kode_mk} - {mk.nama_mk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dosen */}
            <div>
              <Label htmlFor="dosen_id">Dosen Pengampu</Label>
              <Select
                value={formData.dosen_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, dosen_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  {dosenList.map((dosen) => (
                    <SelectItem key={dosen.id} value={dosen.id}>
                      {dosen.nip} - {dosen.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingKelas && editingKelas.dosen_id !== formData.dosen_id && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ Dosen akan diganti. Mahasiswa akan dinotifikasi.
                </p>
              )}
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

            {/* Ruangan & Kuota */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ruangan">Ruangan</Label>
                <Input
                  id="ruangan"
                  placeholder="Lab 101"
                  value={formData.ruangan}
                  onChange={(e) =>
                    setFormData({ ...formData, ruangan: e.target.value })
                  }
                />
              </div>
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

      {/* Konfirmasi Dialog Pergantian Dosen */}
      <AlertDialog
        open={showDosenChangeConfirm}
        onOpenChange={setShowDosenChangeConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Konfirmasi Pergantian Dosen
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Anda akan mengganti dosen untuk kelas:</p>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    📚 {pendingSaveData?.nama_kelas}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {getMataKuliahName(pendingSaveData?.mata_kuliah_id)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Dosen Lama:</p>
                    <p className="text-sm text-red-600">
                      {getDosenName(editingKelas?.dosen_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dosen Baru:</p>
                    <p className="text-sm text-green-600">
                      {getDosenName(pendingSaveData?.dosen_id)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    Dampak Pergantian:
                  </p>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 list-disc list-inside mt-1">
                    <li>Mahasiswa akan mendapat notifikasi</li>
                    <li>Dosen lama dan baru akan dinotifikasi</li>
                    <li>Semua tugas yang sudah dibuat tetap ada</li>
                    <li>Nilai yang sudah diinput tetap ada</li>
                  </ul>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Apakah Anda yakin ingin melanjutkan?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDosenChange}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDosenChange}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Ya, Ganti Dosen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      {deletingKelas && (
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingKelas(null);
          }}
          onConfirm={confirmDelete}
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
    </div>
  );
}
