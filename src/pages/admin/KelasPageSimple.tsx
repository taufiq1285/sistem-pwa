/**
 * Admin Kelas Management Page - SIMPLIFIED
 *
 * Konsep Baru:
 * - Kelas = Kelompok mahasiswa berdasarkan angkatan
 * - Hanya berisi: Nama Kelas + Angkatan
 * - Mahasiswa di-assign ke kelas (fitur terpisah)
 * - Mata Kuliah & Dosen di-assign secara terpisah (fitur lain)
 */

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";

// API
import { supabase } from "@/lib/supabase/client";

interface Kelas {
  id: string;
  nama_kelas: string;
  kode_kelas: string;
  tahun_ajaran: string; // Digunakan sebagai "angkatan"
  semester_ajaran: number;
  is_active: boolean;
  created_at?: string;
}

interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  email: string;
  angkatan: number;
  program_studi: string;
}

interface KelasMahasiswa {
  mahasiswa_id: string;
  mahasiswa: Mahasiswa;
}

export default function KelasPageSimple() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: "",
    angkatan: new Date().getFullYear(), // Display sebagai angkatan, simpan sebagai tahun_ajaran
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [kelasToDelete, setKelasToDelete] = useState<Kelas | null>(null);

  // Mahasiswa management state
  const [showMahasiswaDialog, setShowMahasiswaDialog] = useState(false);
  const [selectedKelasForMahasiswa, setSelectedKelasForMahasiswa] =
    useState<Kelas | null>(null);
  const [mahasiswaInKelas, setMahasiswaInKelas] = useState<Mahasiswa[]>([]);
  const [allMahasiswa, setAllMahasiswa] = useState<Mahasiswa[]>([]);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [mahasiswaSearch, setMahasiswaSearch] = useState("");

  useEffect(() => {
    loadKelas();
    loadAllMahasiswa();

    // Realtime subscription untuk mahasiswa baru
    const subscription = supabase
      .channel("mahasiswa-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mahasiswa",
        },
        () => {
          loadAllMahasiswa();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadKelas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kelas")
        .select(
          "id, nama_kelas, kode_kelas, tahun_ajaran, semester_ajaran, is_active, created_at",
        )
        .eq("is_active", true)
        .order("tahun_ajaran", { ascending: false })
        .order("nama_kelas", { ascending: true });

      if (error) throw error;
      setKelasList(data || []);
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (kelas?: Kelas) => {
    if (kelas) {
      setIsEditing(true);
      setSelectedKelas(kelas);
      setFormData({
        nama_kelas: kelas.nama_kelas,
        angkatan: parseInt(kelas.tahun_ajaran) || new Date().getFullYear(),
      });
    } else {
      setIsEditing(false);
      setSelectedKelas(null);
      setFormData({
        nama_kelas: "",
        angkatan: new Date().getFullYear(),
      });
    }
    setShowFormDialog(true);
  };

  const handleCloseForm = () => {
    setShowFormDialog(false);
    setIsEditing(false);
    setSelectedKelas(null);
    setFormData({
      nama_kelas: "",
      angkatan: new Date().getFullYear(),
    });
  };

  const handleSave = async () => {
    if (!formData.nama_kelas.trim()) {
      toast.error("Nama kelas harus diisi");
      return;
    }

    if (!formData.angkatan || formData.angkatan < 2000) {
      toast.error("Angkatan tidak valid");
      return;
    }

    setIsSaving(true);
    try {
      // Generate kode_kelas
      const kode_kelas =
        formData.nama_kelas.toUpperCase().replace(/\s+/g, "-") +
        `-${formData.angkatan}`;

      if (isEditing && selectedKelas) {
        // Update existing kelas
        const { error } = await supabase
          .from("kelas")
          .update({
            nama_kelas: formData.nama_kelas,
            kode_kelas: kode_kelas,
            tahun_ajaran: formData.angkatan.toString(),
          })
          .eq("id", selectedKelas.id);

        if (error) throw error;
        toast.success("Kelas berhasil diperbarui");
      } else {
        // Create new kelas
        const { error } = await supabase.from("kelas").insert({
          nama_kelas: formData.nama_kelas,
          kode_kelas: kode_kelas,
          tahun_ajaran: formData.angkatan.toString(),
          semester_ajaran: 1,
          is_active: true,
          // Field yang dibiarkan null (nanti di-assign terpisah)
          mata_kuliah_id: null,
          dosen_id: null,
        });

        if (error) throw error;
        toast.success("Kelas berhasil ditambahkan");
      }

      handleCloseForm();
      loadKelas();
    } catch (error: any) {
      console.error("Error saving kelas:", error);
      toast.error("Gagal menyimpan kelas", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!kelasToDelete) return;

    try {
      // Soft delete
      const { error } = await supabase
        .from("kelas")
        .update({ is_active: false })
        .eq("id", kelasToDelete.id);

      if (error) throw error;

      toast.success("Kelas berhasil dihapus");
      setShowDeleteDialog(false);
      setKelasToDelete(null);
      loadKelas();
    } catch (error: any) {
      console.error("Error deleting kelas:", error);
      toast.error("Gagal menghapus kelas", {
        description: error.message,
      });
    }
  };

  // Load all mahasiswa
  const loadAllMahasiswa = async () => {
    try {
      const { data, error } = await supabase
        .from("mahasiswa")
        .select(
          `
          id,
          nim,
          angkatan,
          program_studi,
          user_id,
          users:user_id (
            id,
            full_name,
            email
          )
        `,
        )
        .order("nim", { ascending: true });

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = (data || []).map((mhs: any) => ({
        id: mhs.id,
        nim: mhs.nim,
        nama: mhs.users?.full_name || "-",
        email: mhs.users?.email || "-",
        angkatan: mhs.angkatan,
        program_studi: mhs.program_studi,
        user_id: mhs.user_id,
      }));

      setAllMahasiswa(transformedData);
    } catch (error) {
      console.error("Error loading mahasiswa:", error);
    }
  };

  // Open mahasiswa dialog
  const handleOpenMahasiswaDialog = async (kelas: Kelas) => {
    setSelectedKelasForMahasiswa(kelas);
    setShowMahasiswaDialog(true);
    setMahasiswaSearch("");
    await loadMahasiswaInKelas(kelas.id);
  };

  // Load mahasiswa in kelas
  const loadMahasiswaInKelas = async (kelasId: string) => {
    try {
      setLoadingMahasiswa(true);
      const { data, error } = await supabase
        .from("kelas_mahasiswa")
        .select(
          `
          mahasiswa_id,
          mahasiswa:mahasiswa_id (
            id,
            nim,
            angkatan,
            program_studi,
            user_id,
            users:user_id (
              id,
              full_name,
              email
            )
          )
        `,
        )
        .eq("kelas_id", kelasId)
        .eq("is_active", true);

      if (error) throw error;

      // Transform data to match expected format
      const mhsList = (data || [])
        .map((item: any) => {
          if (!item.mahasiswa) return null;
          return {
            id: item.mahasiswa.id,
            nim: item.mahasiswa.nim,
            nama: item.mahasiswa.users?.full_name || "-",
            email: item.mahasiswa.users?.email || "-",
            angkatan: item.mahasiswa.angkatan,
            program_studi: item.mahasiswa.program_studi,
            user_id: item.mahasiswa.user_id,
          };
        })
        .filter((mhs: any) => mhs !== null);

      setMahasiswaInKelas(mhsList);
    } catch (error) {
      console.error("Error loading mahasiswa in kelas:", error);
      toast.error("Gagal memuat mahasiswa");
    } finally {
      setLoadingMahasiswa(false);
    }
  };

  // Add mahasiswa to kelas
  const handleAddMahasiswa = async (mahasiswaId: string) => {
    if (!selectedKelasForMahasiswa) return;

    try {
      const { error } = await supabase.from("kelas_mahasiswa").insert({
        kelas_id: selectedKelasForMahasiswa.id,
        mahasiswa_id: mahasiswaId,
        is_active: true,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Mahasiswa sudah ada di kelas ini");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Mahasiswa berhasil ditambahkan ke kelas");
      await loadMahasiswaInKelas(selectedKelasForMahasiswa.id);
    } catch (error: any) {
      console.error("Error adding mahasiswa:", error);
      toast.error("Gagal menambahkan mahasiswa");
    }
  };

  // Remove mahasiswa from kelas
  const handleRemoveMahasiswa = async (mahasiswaId: string) => {
    if (!selectedKelasForMahasiswa) return;

    try {
      const { error } = await supabase
        .from("kelas_mahasiswa")
        .update({ is_active: false })
        .eq("kelas_id", selectedKelasForMahasiswa.id)
        .eq("mahasiswa_id", mahasiswaId);

      if (error) throw error;

      toast.success("Mahasiswa berhasil dihapus dari kelas");
      await loadMahasiswaInKelas(selectedKelasForMahasiswa.id);
    } catch (error: any) {
      console.error("Error removing mahasiswa:", error);
      toast.error("Gagal menghapus mahasiswa");
    }
  };

  const filteredKelas = kelasList.filter(
    (kelas) =>
      kelas.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelas.kode_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kelas.tahun_ajaran.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Kelas</h1>
          <p className="text-muted-foreground mt-1">
            Kelola kelas mahasiswa berdasarkan angkatan
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kelas
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>
            {filteredKelas.length} kelas dari {kelasList.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKelas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Tidak ada kelas yang cocok" : "Belum ada kelas"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kelas</TableHead>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKelas.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell className="font-mono text-sm">
                      {kelas.kode_kelas}
                    </TableCell>
                    <TableCell className="font-medium">
                      {kelas.nama_kelas}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{kelas.tahun_ajaran}</Badge>
                    </TableCell>
                    <TableCell>
                      {kelas.is_active ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMahasiswaDialog(kelas)}
                          title="Kelola Mahasiswa"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(kelas)}
                          title="Edit Kelas"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setKelasToDelete(kelas);
                            setShowDeleteDialog(true);
                          }}
                          title="Hapus Kelas"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Kelas" : "Tambah Kelas Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi informasi kelas. Kode kelas akan dibuat otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama_kelas">Nama Kelas *</Label>
              <Input
                id="nama_kelas"
                placeholder="contoh: Kelas A, Kelas Pagi"
                value={formData.nama_kelas}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kelas: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan *</Label>
              <Input
                id="angkatan"
                type="number"
                min="2000"
                max="2100"
                placeholder="contoh: 2024"
                value={formData.angkatan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    angkatan:
                      parseInt(e.target.value) || new Date().getFullYear(),
                  })
                }
              />
            </div>

            {formData.nama_kelas && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Kode Kelas:</p>
                <p className="font-mono font-semibold">
                  {formData.nama_kelas.toUpperCase().replace(/\s+/g, "-")}-
                  {formData.angkatan}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Simpan Perubahan" : "Tambah Kelas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kelas"
        itemType="kelas"
        description={
          kelasToDelete
            ? `Yakin ingin menghapus kelas "${kelasToDelete.nama_kelas}"? Kelas tidak akan terhapus permanen, hanya dinonaktifkan.`
            : ""
        }
        itemName={kelasToDelete?.nama_kelas || ""}
      />
    </div>
  );
}
