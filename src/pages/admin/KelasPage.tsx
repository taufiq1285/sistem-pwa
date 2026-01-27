/**
 * Admin Kelas Management Page
 *
 * Features:
 * - View all Kelas
 * - Create/Edit/Delete Kelas
 * - Assign Mahasiswa to Kelas
 * - Manage student enrollments (activate/deactivate)
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
  UserMinus,
  CheckCircle,
  XCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/DataTable/TableSkeleton";
import { EnhancedTable, EnhancedTableHeader, EnhancedTableRow, EnhancedTableHead, EnhancedTableCell } from "@/components/shared/DataTable/EnhancedTable";
import { EnhancedEmptyState } from "@/components/shared/DataTable/EnhancedEmptyState";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// API & Types
import {
  getKelas,
  createKelas,
  updateKelas,
  deleteKelas,
  getEnrolledStudents,
  enrollStudent,
  unenrollStudent,
  toggleStudentStatus,
  getAllMahasiswa,
  type KelasMahasiswa,
} from "@/lib/api/kelas.api";
import type { Kelas } from "@/types/kelas.types";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

export default function KelasPage() {
  // Ref untuk prevent double load di strict mode
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
  });

  // Student management state
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<KelasMahasiswa[]>(
    [],
  );
  const [allMahasiswa, setAllMahasiswa] = useState<any[]>([]);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mahasiswaSubscription, setMahasiswaSubscription] = useState<any>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingKelas, setDeletingKelas] = useState<Kelas | null>(null);

  useEffect(() => {
    // Prevent double load in React Strict Mode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadData();
  }, []);

  // ✅ Cleanup subscription saat component unmount atau dialog ditutup
  useEffect(() => {
    return () => {
      if (mahasiswaSubscription) {
        mahasiswaSubscription.unsubscribe();
      }
    };
  }, [mahasiswaSubscription]);

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

  const loadKelas = async (forceRefresh = false) => {
    try {
      const startTime = performance.now();
      const data = await cacheAPI(
        "admin_all_kelas",
        () => getKelas({ is_active: undefined }), // Load all kelas
        {
          ttl: 10 * 60 * 1000, // 10 minutes - kelas data changes slowly
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      const endTime = performance.now();
      console.log(`⏱️ Load kelas took: ${(endTime - startTime).toFixed(2)}ms`);
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
    });
    setShowFormDialog(true);
  };

  const handleEdit = (kelas: Kelas) => {
    setEditingKelas(kelas);
    setFormData({
      nama_kelas: kelas.nama_kelas,
      semester_ajaran: kelas.semester_ajaran,
      tahun_ajaran: kelas.tahun_ajaran,
    });
    setShowFormDialog(true);
  };

  const handleSaveKelas = async () => {
    if (!formData.nama_kelas) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    setIsProcessing(true);
    try {
      // ✅ Normalize kelas nama before saving
      const normalizedFormData = {
        ...formData,
        nama_kelas: normalize.kelasNama(formData.nama_kelas),
      };

      if (editingKelas) {
        const startTime = performance.now();
        await updateKelas(editingKelas.id, normalizedFormData);
        const endTime = performance.now();
        console.log(
          `⏱️ Update kelas took: ${(endTime - startTime).toFixed(2)}ms`,
        );
        toast.success("Kelas berhasil diupdate");
      } else {
        const startTime = performance.now();
        await createKelas({ ...normalizedFormData, is_active: true });
        const endTime = performance.now();
        console.log(
          `⏱️ Create kelas took: ${(endTime - startTime).toFixed(2)}ms`,
        );
        toast.success("Kelas berhasil dibuat");
      }
      setShowFormDialog(false);
      // Invalidate cache and reload
      await invalidateCache("admin_all_kelas");
      await loadKelas(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan kelas");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (kelas: Kelas) => {
    setDeletingKelas(kelas);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingKelas) return;

    try {
      await deleteKelas(deletingKelas.id);
      toast.success("Kelas berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingKelas(null);
      // Invalidate cache and reload
      await invalidateCache("admin_all_kelas");
      await loadKelas(true);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus kelas");
    }
  };

  // Student Management Functions
  const handleManageStudents = async (kelas: Kelas) => {
    setSelectedKelas(kelas);
    setIsProcessing(true);
    try {
      const [enrolled, all] = await Promise.all([
        cacheAPI(
          `admin_kelas_enrolled_${kelas.id}`,
          () => getEnrolledStudents(kelas.id),
          {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh: false,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI("admin_all_mahasiswa", () => getAllMahasiswa(), {
          ttl: 10 * 60 * 1000, // 10 minutes - mahasiswa list changes slowly
          forceRefresh: false,
          staleWhileRevalidate: true,
        }),
      ]);
      setEnrolledStudents(enrolled);
      setAllMahasiswa(all);
      setShowStudentsDialog(true);

      // ✅ Setup realtime subscription untuk mahasiswa baru
      const { supabase } = await import("@/lib/supabase/client");
      const subscription = supabase
        .channel(`mahasiswa-updates-${kelas.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "mahasiswa",
          },
          async () => {
            // Reload mahasiswa list saat ada mahasiswa baru
            try {
              const updatedMahasiswa = await cacheAPI(
                "admin_all_mahasiswa",
                () => getAllMahasiswa(),
                {
                  ttl: 10 * 60 * 1000,
                  forceRefresh: true,
                  staleWhileRevalidate: true,
                },
              );
              setAllMahasiswa(updatedMahasiswa);
              toast.success("Mahasiswa baru tersedia untuk dipilih");
            } catch (error) {
              console.error("Error reloading mahasiswa:", error);
            }
          },
        )
        .subscribe();

      // Store subscription untuk cleanup nanti
      setMahasiswaSubscription(subscription);
    } catch (error: any) {
      toast.error("Gagal memuat data mahasiswa");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedKelas) return;

    // Validate mahasiswa dipilih
    if (!selectedMahasiswaId) {
      toast.error("Pilih mahasiswa");
      return;
    }

    setIsProcessing(true);
    try {
      // Enroll existing mahasiswa
      await enrollStudent(selectedKelas.id, selectedMahasiswaId);
      toast.success("Mahasiswa berhasil ditambahkan");
      // Invalidate cache and reload
      await invalidateCache(`admin_kelas_enrolled_${selectedKelas.id}`);
      const enrolled = await cacheAPI(
        `admin_kelas_enrolled_${selectedKelas.id}`,
        () => getEnrolledStudents(selectedKelas.id),
        {
          ttl: 5 * 60 * 1000,
          forceRefresh: true,
          staleWhileRevalidate: true,
        },
      );
      setEnrolledStudents(enrolled);
      setShowAddStudentDialog(false);
      setSelectedMahasiswaId("");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan mahasiswa");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveStudent = async (mahasiswaId: string) => {
    if (!selectedKelas) return;
    if (!confirm("Hapus mahasiswa dari kelas ini?")) return;

    setIsProcessing(true);
    try {
      await unenrollStudent(selectedKelas.id, mahasiswaId);
      toast.success("Mahasiswa berhasil dihapus");
      // Invalidate cache and reload
      await invalidateCache(`admin_kelas_enrolled_${selectedKelas.id}`);
      const enrolled = await cacheAPI(
        `admin_kelas_enrolled_${selectedKelas.id}`,
        () => getEnrolledStudents(selectedKelas.id),
        {
          ttl: 5 * 60 * 1000,
          forceRefresh: true,
          staleWhileRevalidate: true,
        },
      );
      setEnrolledStudents(enrolled);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus mahasiswa");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (
    mahasiswaId: string,
    currentStatus: boolean,
  ) => {
    if (!selectedKelas) return;

    setIsProcessing(true);
    try {
      await toggleStudentStatus(selectedKelas.id, mahasiswaId, !currentStatus);
      toast.success("Status berhasil diubah");
      // Invalidate cache and reload
      await invalidateCache(`admin_kelas_enrolled_${selectedKelas.id}`);
      const enrolled = await cacheAPI(
        `admin_kelas_enrolled_${selectedKelas.id}`,
        () => getEnrolledStudents(selectedKelas.id),
        {
          ttl: 5 * 60 * 1000,
          forceRefresh: true,
          staleWhileRevalidate: true,
        },
      );
      setEnrolledStudents(enrolled);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status");
    } finally {
      setIsProcessing(false);
    }
  };

  const getAvailableMahasiswa = () => {
    const enrolledIds = enrolledStudents.map((e) => e.mahasiswa_id);
    return allMahasiswa.filter((m) => !enrolledIds.includes(m.id));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold">Kelola Kelas</h1>
            <p className="text-lg font-semibold text-muted-foreground mt-2">
              Buat kelas dan assign mahasiswa
            </p>
          </div>
        </div>
        <Card className="border-0 shadow-xl">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold">Daftar Kelas</CardTitle>
            <CardDescription className="text-base font-semibold mt-1">
              Memuat data...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={4} columnWidths={["200px", "180px", "100px", "200px"]} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Kelola Kelas</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            Buat kelas dan assign mahasiswa
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Kelas
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Setelah membuat kelas, gunakan tombol &quot;Kelola Mahasiswa&quot;
          untuk menambahkan mahasiswa ke kelas tersebut.
        </AlertDescription>
      </Alert>

      {/* Kelas Table */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">Daftar Kelas</CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            Total {kelasList.length} kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kelasList.length === 0 ? (
            <EnhancedEmptyState
              icon={Users}
              title="Belum ada kelas"
              description="Buat kelas baru dan mulai kelola mahasiswa untuk praktikum."
              action={{
                label: "Buat Kelas",
                onClick: handleCreate,
              }}
            />
          ) : (
            <EnhancedTable>
              <EnhancedTableHeader>
                <EnhancedTableRow>
                  <EnhancedTableHead>Nama Kelas</EnhancedTableHead>
                  <EnhancedTableHead>Semester/Tahun</EnhancedTableHead>
                  <EnhancedTableHead>Status</EnhancedTableHead>
                  <EnhancedTableHead className="text-right">Aksi</EnhancedTableHead>
                </EnhancedTableRow>
              </EnhancedTableHeader>
              <TableBody>
                {kelasList.map((kelas) => (
                  <EnhancedTableRow key={kelas.id}>
                    <EnhancedTableCell className="font-medium">
                      {kelas.nama_kelas}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      Semester {kelas.semester_ajaran} • {kelas.tahun_ajaran}
                    </EnhancedTableCell>
                    <EnhancedTableCell>
                      <Badge
                        variant={kelas.is_active ? "default" : "secondary"}
                      >
                        {kelas.is_active ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </EnhancedTableCell>
                    <EnhancedTableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageStudents(kelas)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Kelola
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
                    </EnhancedTableCell>
                  </EnhancedTableRow>
                ))}
              </TableBody>
            </EnhancedTable>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Kelas Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingKelas ? "Edit Kelas" : "Buat Kelas Baru"}
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Isi informasi kelas di bawah ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kelas">Nama Kelas *</Label>
              <Input
                id="nama_kelas"
                placeholder="Contoh: Kelas A, Kelas Pagi, dll"
                value={formData.nama_kelas}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kelas: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester_ajaran">Semester</Label>
                <Select
                  value={formData.semester_ajaran.toString()}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      semester_ajaran: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFormDialog(false)}
              disabled={isProcessing}
              className="font-semibold border-2"
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveKelas}
              disabled={isProcessing}
              className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingKelas ? "Update" : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog
        open={showStudentsDialog}
        onOpenChange={(open) => {
          setShowStudentsDialog(open);
          // ✅ Cleanup subscription saat dialog ditutup
          if (!open && mahasiswaSubscription) {
            mahasiswaSubscription.unsubscribe();
            setMahasiswaSubscription(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Kelola Mahasiswa - {selectedKelas?.nama_kelas}
            </DialogTitle>
            <DialogDescription>
              Tambah atau hapus mahasiswa dari kelas ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total {enrolledStudents.length} mahasiswa terdaftar
              </p>
              <Button size="sm" onClick={() => setShowAddStudentDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Mahasiswa
              </Button>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="text-center py-8">
                <EnhancedEmptyState
                  icon={Users}
                  title="Belum ada mahasiswa di kelas ini"
                  description="Tambahkan mahasiswa untuk memulai pengelolaan kelas."
                  action={{
                    label: "Tambah Mahasiswa",
                    onClick: () => setShowAddStudentDialog(true),
                  }}
                />
              </div>
            ) : (
              <EnhancedTable>
                <EnhancedTableHeader>
                  <EnhancedTableRow>
                    <EnhancedTableHead>NIM</EnhancedTableHead>
                    <EnhancedTableHead>Nama</EnhancedTableHead>
                    <EnhancedTableHead>Angkatan</EnhancedTableHead>
                    <EnhancedTableHead>Email</EnhancedTableHead>
                    <EnhancedTableHead>Status</EnhancedTableHead>
                    <EnhancedTableHead className="text-right">Aksi</EnhancedTableHead>
                  </EnhancedTableRow>
                </EnhancedTableHeader>
                <TableBody>
                  {enrolledStudents.map((enrollment) => (
                    <EnhancedTableRow key={enrollment.id}>
                      <EnhancedTableCell className="font-mono text-xs">
                        {enrollment.mahasiswa?.nim}
                      </EnhancedTableCell>
                      <EnhancedTableCell className="font-medium">
                        {enrollment.mahasiswa?.users?.full_name}
                      </EnhancedTableCell>
                      <EnhancedTableCell>
                        {enrollment.mahasiswa?.angkatan}
                      </EnhancedTableCell>
                      <EnhancedTableCell className="text-xs text-muted-foreground">
                        {enrollment.mahasiswa?.users?.email}
                      </EnhancedTableCell>
                      <EnhancedTableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(
                              enrollment.mahasiswa_id,
                              enrollment.is_active ?? false,
                            )
                          }
                          className="hover:bg-muted"
                        >
                          {enrollment.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mr-1" />
                          )}
                          {enrollment.is_active ? "Aktif" : "Nonaktif"}
                        </Button>
                      </EnhancedTableCell>
                      <EnhancedTableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveStudent(enrollment.mahasiswa_id)
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </EnhancedTableCell>
                    </EnhancedTableRow>
                  ))}
                </TableBody>
              </EnhancedTable>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Mahasiswa</DialogTitle>
            <DialogDescription>
              Pilih mahasiswa dari list yang sudah terdaftar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Mahasiswa</Label>
              <Select
                value={selectedMahasiswaId}
                onValueChange={setSelectedMahasiswaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mahasiswa yang sudah terdaftar" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMahasiswa().length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Semua mahasiswa sudah terdaftar
                    </div>
                  ) : (
                    getAvailableMahasiswa().map((mhs) => (
                      <SelectItem key={mhs.id} value={mhs.id}>
                        {mhs.nim} - {mhs.users?.full_name} (Angkatan{" "}
                        {mhs.angkatan})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddStudentDialog(false);
                setSelectedMahasiswaId("");
              }}
            >
              Batal
            </Button>
            <Button onClick={handleAddStudent} disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Tambah Mahasiswa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingKelas && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Kelas - Konfirmasi"
          itemName={deletingKelas.nama_kelas}
          itemType="Kelas"
          description={`${deletingKelas.tahun_ajaran} - Semester ${deletingKelas.semester_ajaran}`}
          consequences={[
            "Data kelas akan dihapus permanen",
            "Mahasiswa yang terdaftar akan kehilangan akses ke kelas ini",
            "Jadwal praktikum terkait akan terpengaruh",
            "Data nilai dan presensi tidak akan terhapus",
          ]}
        />
      )}
    </div>
  );
}
