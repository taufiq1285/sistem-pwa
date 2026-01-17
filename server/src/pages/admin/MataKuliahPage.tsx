/**
 * Admin - Mata Kuliah Management Page
 * Manage mata kuliah (courses) for the system
 */

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableColumnHeader } from "@/components/shared/DataTable/DataTableColumnHeader";
import {
  getMataKuliah,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
} from "@/lib/api/mata-kuliah.api";
import type {
  MataKuliah,
  CreateMataKuliahData,
} from "@/types/mata-kuliah.types";

export default function MataKuliahPage() {
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingMK, setEditingMK] = useState<MataKuliah | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateMataKuliahData>({
    kode_mk: "",
    nama_mk: "",
    sks: 3,
    semester: 1,
    program_studi: "D3 Kebidanan",
    deskripsi: "",
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMK, setDeletingMK] = useState<MataKuliah | null>(null);
  const [cascadeInfo, setCascadeInfo] = useState<{ kelasCount: number } | null>(
    null,
  );
  const [showCascadeDialog, setShowCascadeDialog] = useState(false);

  // Load mata kuliah
  useEffect(() => {
    loadMataKuliah();
  }, []);

  const loadMataKuliah = async () => {
    setIsLoading(true);
    try {
      const data = await getMataKuliah();
      setMataKuliahList(data);
    } catch (error: any) {
      toast.error("Gagal memuat mata kuliah", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMK(null);
    setFormData({
      kode_mk: "",
      nama_mk: "",
      sks: 3,
      semester: 1,
      program_studi: "D3 Kebidanan",
      deskripsi: "",
    });
    setShowDialog(true);
  };

  const handleEdit = (mk: MataKuliah) => {
    setEditingMK(mk);
    setFormData({
      kode_mk: mk.kode_mk,
      nama_mk: mk.nama_mk,
      sks: mk.sks,
      semester: mk.semester,
      program_studi: mk.program_studi,
      deskripsi: mk.deskripsi || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.kode_mk.trim() || !formData.nama_mk.trim()) {
      toast.error("Kode MK dan Nama MK harus diisi");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMK) {
        await updateMataKuliah(editingMK.id, formData);
        toast.success("Mata kuliah berhasil diperbarui");
      } else {
        await createMataKuliah(formData);
        toast.success("Mata kuliah berhasil ditambahkan");
      }

      await loadMataKuliah();
      setShowDialog(false);
    } catch (error: any) {
      toast.error(editingMK ? "Gagal memperbarui" : "Gagal menambahkan", {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (mk: MataKuliah) => {
    setDeletingMK(mk);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async (cascade: boolean = false) => {
    if (!deletingMK) return;

    try {
      await deleteMataKuliah(deletingMK.id, { cascade });
      toast.success(
        cascade
          ? "Mata kuliah dan semua kelas terkait berhasil dihapus"
          : "Mata kuliah berhasil dihapus",
      );
      setIsDeleteDialogOpen(false);
      setShowCascadeDialog(false);
      setDeletingMK(null);
      setCascadeInfo(null);
      await loadMataKuliah();
    } catch (error: any) {
      // Check if error is about active kelas
      if (
        error.message?.includes("Found") &&
        error.message?.includes("active kelas")
      ) {
        // Extract kelas count from error message
        const match = error.message.match(/Found (\d+) active kelas/);
        const kelasCount = match ? parseInt(match[1], 10) : 0;

        // Show cascade confirmation dialog
        setCascadeInfo({ kelasCount });
        setShowCascadeDialog(true);
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Gagal menghapus", { description: error.message });
      }
    }
  };

  const confirmCascadeDelete = async () => {
    // Call confirmDelete with cascade=true
    await confirmDelete(true);
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns = useMemo<ColumnDef<MataKuliah>[]>(
    () => [
      {
        accessorKey: "kode_mk",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Kode MK" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.getValue("kode_mk")}
          </Badge>
        ),
      },
      {
        accessorKey: "nama_mk",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nama Mata Kuliah" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <div className="font-semibold">{row.getValue("nama_mk")}</div>
            {row.original.deskripsi && (
              <div className="text-sm text-muted-foreground truncate">
                {row.original.deskripsi}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "program_studi",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Program Studi" />
        ),
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue("program_studi")}</div>
        ),
      },
      {
        accessorKey: "semester",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Semester" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">Semester {row.getValue("semester")}</Badge>
        ),
      },
      {
        accessorKey: "sks",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="SKS" />
        ),
        cell: ({ row }) => <Badge>{row.getValue("sks")} SKS</Badge>,
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(row.original)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mata Kuliah</h1>
          <p className="text-muted-foreground">
            Kelola mata kuliah untuk sistem
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Mata Kuliah
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={mataKuliahList}
            isLoading={isLoading}
            searchable
            searchPlaceholder="Cari mata kuliah..."
            pageSize={20}
            pageSizeOptions={[10, 20, 30, 50]}
            showPagination
            emptyMessage="Belum ada mata kuliah"
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMK ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
            </DialogTitle>
            <DialogDescription>Isi informasi mata kuliah</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode MK *</Label>
                <Input
                  placeholder="MK001"
                  value={formData.kode_mk}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      kode_mk: e.target.value.toUpperCase(),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Format: 2-5 huruf + 3 angka (contoh: BID001, KOMBI001)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Program Studi *</Label>
                <Input
                  value={formData.program_studi}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      program_studi: e.target.value,
                    }))
                  }
                  placeholder="D3 Kebidanan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Mata Kuliah *</Label>
              <Input
                placeholder="Contoh: Komunikasi Bisnis Digital"
                value={formData.nama_mk}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nama_mk: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKS *</Label>
                <Select
                  value={String(formData.sks)}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, sks: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((sks) => (
                      <SelectItem key={sks} value={String(sks)}>
                        {sks} SKS
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select
                  value={String(formData.semester)}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, semester: parseInt(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={String(sem)}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi mata kuliah (opsional)"
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, deskripsi: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : editingMK ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingMK && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Mata Kuliah - Konfirmasi"
          itemName={deletingMK.nama_mk}
          itemType="Mata Kuliah"
          description={`${deletingMK.kode_mk} | ${deletingMK.sks} SKS | Semester ${deletingMK.semester}`}
          consequences={[
            "Data mata kuliah akan dihapus permanen",
            "Kelas yang menggunakan mata kuliah ini akan terpengaruh",
            "Jadwal praktikum terkait akan terpengaruh",
            "Data nilai mahasiswa tidak akan terhapus",
          ]}
        />
      )}
    </div>
  );
}
