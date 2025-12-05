/**
 * Admin - Mata Kuliah Management Page
 * Manage mata kuliah (courses) for the system
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getMataKuliah, createMataKuliah, updateMataKuliah, deleteMataKuliah } from '@/lib/api/mata-kuliah.api';
import type { MataKuliah, CreateMataKuliahData } from '@/types/mata-kuliah.types';

export default function MataKuliahPage() {
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showDialog, setShowDialog] = useState(false);
  const [editingMK, setEditingMK] = useState<MataKuliah | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateMataKuliahData>({
    kode_mk: '',
    nama_mk: '',
    sks: 3,
    semester: 1,
    program_studi: 'D3 Kebidanan',
    deskripsi: '',
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingMK, setDeletingMK] = useState<MataKuliah | null>(null);

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
      toast.error('Gagal memuat mata kuliah', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMK(null);
    setFormData({
      kode_mk: '',
      nama_mk: '',
      sks: 3,
      semester: 1,
      program_studi: 'D3 Kebidanan',
      deskripsi: '',
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
      deskripsi: mk.deskripsi || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.kode_mk.trim() || !formData.nama_mk.trim()) {
      toast.error('Kode MK dan Nama MK harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (editingMK) {
        await updateMataKuliah(editingMK.id, formData);
        toast.success('Mata kuliah berhasil diperbarui');
      } else {
        await createMataKuliah(formData);
        toast.success('Mata kuliah berhasil ditambahkan');
      }

      await loadMataKuliah();
      setShowDialog(false);
    } catch (error: any) {
      toast.error(editingMK ? 'Gagal memperbarui' : 'Gagal menambahkan', {
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (mk: MataKuliah) => {
    setDeletingMK(mk);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMK) return;

    try {
      await deleteMataKuliah(deletingMK.id);
      toast.success('Mata kuliah berhasil dihapus');
      setIsDeleteDialogOpen(false);
      setDeletingMK(null);
      await loadMataKuliah();
    } catch (error: any) {
      toast.error('Gagal menghapus', { description: error.message });
    }
  };

  // Filter mata kuliah
  const filteredMK = mataKuliahList.filter(mk =>
    mk.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mk.kode_mk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mata Kuliah</h1>
          <p className="text-muted-foreground">Kelola mata kuliah untuk sistem</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Mata Kuliah
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari mata kuliah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Kuliah ({filteredMK.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredMK.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada mata kuliah'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMK.map((mk) => (
                <Card key={mk.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{mk.kode_mk}</Badge>
                          <Badge variant="secondary">Semester {mk.semester}</Badge>
                          <Badge>{mk.sks} SKS</Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{mk.nama_mk}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mk.program_studi}
                        </p>
                        {mk.deskripsi && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {mk.deskripsi}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(mk)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(mk)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMK ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
            </DialogTitle>
            <DialogDescription>
              Isi informasi mata kuliah
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode MK *</Label>
                <Input
                  placeholder="MK001"
                  value={formData.kode_mk}
                  onChange={(e) => setFormData(p => ({ ...p, kode_mk: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-muted-foreground">
                  Format: 2-5 huruf + 3 angka (contoh: BID001, KOMBI001)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Program Studi *</Label>
                <Input
                  value={formData.program_studi}
                  onChange={(e) => setFormData(p => ({ ...p, program_studi: e.target.value }))}
                  placeholder="D3 Kebidanan"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Mata Kuliah *</Label>
              <Input
                placeholder="Contoh: Komunikasi Bisnis Digital"
                value={formData.nama_mk}
                onChange={(e) => setFormData(p => ({ ...p, nama_mk: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKS *</Label>
                <Select
                  value={String(formData.sks)}
                  onValueChange={(v) => setFormData(p => ({ ...p, sks: parseInt(v) }))}
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
                  onValueChange={(v) => setFormData(p => ({ ...p, semester: parseInt(v) }))}
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
                onChange={(e) => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
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
              {isSaving ? 'Menyimpan...' : editingMK ? 'Simpan' : 'Tambah'}
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
            'Data mata kuliah akan dihapus permanen',
            'Kelas yang menggunakan mata kuliah ini akan terpengaruh',
            'Jadwal praktikum terkait akan terpengaruh',
            'Data nilai mahasiswa tidak akan terhapus',
          ]}
        />
      )}
    </div>
  );
}
