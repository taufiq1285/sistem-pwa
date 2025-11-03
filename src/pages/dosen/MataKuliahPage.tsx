/**
 * Mata Kuliah Page
 * Mata kuliah management for dosen
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Components
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// API & Types
import {
  getMataKuliahPaginated,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
} from '@/lib/api/mata-kuliah.api';
import type {
  MataKuliah,
  MataKuliahQueryParams,
} from '@/types/mata-kuliah.types';
import {
  PROGRAM_STUDI_OPTIONS,
  SEMESTER_OPTIONS,
  SKS_OPTIONS,
} from '@/types/mata-kuliah.types';

// Validation
import {
  createMataKuliahSchema,
  updateMataKuliahSchema,
  type CreateMataKuliahFormData,
  type UpdateMataKuliahFormData,
} from '@/lib/validations/mata-kuliah.schema';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MataKuliahPage() {
  // State
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState<string>('');
  const [filterSemester, setFilterSemester] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<MataKuliah | null>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchMataKuliah = async () => {
    try {
      setLoading(true);

      const params: MataKuliahQueryParams = {
        page: currentPage,
        pageSize,
        search: searchQuery || undefined,
        program_studi: filterProdi || undefined,
        semester: filterSemester ? parseInt(filterSemester) : undefined,
        sortBy: 'kode_mk',
        sortOrder: 'asc',
      };

      const response = await getMataKuliahPaginated(params);

      if (response.success && response.data) {
        setMataKuliahList(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.totalItems);
      }
    } catch (error: any) {
      toast.error('Gagal memuat data mata kuliah', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMataKuliah();
  }, [currentPage, searchQuery, filterProdi, filterSemester]);

  // ============================================================================
  // CREATE FORM
  // ============================================================================

  const createForm = useForm<CreateMataKuliahFormData>({
    resolver: zodResolver(createMataKuliahSchema),
    defaultValues: {
      kode_mk: '',
      nama_mk: '',
      sks: 2,
      semester: 1,
      program_studi: 'D3 Kebidanan',
      deskripsi: '',
    },
  });

  const handleCreate = async (data: CreateMataKuliahFormData) => {
    try {
      setIsCreating(true);

      const newMataKuliah = await createMataKuliah(data);

      toast.success('Mata kuliah berhasil ditambahkan', {
        description: `${newMataKuliah.kode_mk} - ${newMataKuliah.nama_mk}`,
      });

      setIsCreateOpen(false);
      createForm.reset();
      fetchMataKuliah();
    } catch (error: any) {
      toast.error('Gagal menambahkan mata kuliah', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================================
  // EDIT FORM
  // ============================================================================

  const editForm = useForm<UpdateMataKuliahFormData>({
    resolver: zodResolver(updateMataKuliahSchema),
  });

  const handleEdit = (mataKuliah: MataKuliah) => {
    setSelectedMataKuliah(mataKuliah);
    editForm.reset({
      kode_mk: mataKuliah.kode_mk,
      nama_mk: mataKuliah.nama_mk,
      sks: mataKuliah.sks,
      semester: mataKuliah.semester,
      program_studi: mataKuliah.program_studi,
      deskripsi: mataKuliah.deskripsi || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (data: UpdateMataKuliahFormData) => {
    if (!selectedMataKuliah) return;

    try {
      setIsUpdating(true);

      const updated = await updateMataKuliah(selectedMataKuliah.id, data);

      toast.success('Mata kuliah berhasil diperbarui', {
        description: `${updated.kode_mk} - ${updated.nama_mk}`,
      });

      setIsEditOpen(false);
      setSelectedMataKuliah(null);
      fetchMataKuliah();
    } catch (error: any) {
      toast.error('Gagal memperbarui mata kuliah', {
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ============================================================================
  // DELETE
  // ============================================================================

  const handleDelete = (mataKuliah: MataKuliah) => {
    setSelectedMataKuliah(mataKuliah);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMataKuliah) return;

    try {
      setIsDeleting(true);

      await deleteMataKuliah(selectedMataKuliah.id);

      toast.success('Mata kuliah berhasil dihapus', {
        description: `${selectedMataKuliah.kode_mk} - ${selectedMataKuliah.nama_mk}`,
      });

      setIsDeleteOpen(false);
      setSelectedMataKuliah(null);
      fetchMataKuliah();
    } catch (error: any) {
      toast.error('Gagal menghapus mata kuliah', {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================================
  // SEARCH & FILTER
  // ============================================================================

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterProdi('');
    setFilterSemester('');
    setCurrentPage(1);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && mataKuliahList.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data mata kuliah..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Mata Kuliah"
        description="Kelola mata kuliah program studi kebidanan"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Mata Kuliah
          </Button>
        }
      />

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari mata kuliah..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filter Program Studi */}
            <Select value={filterProdi} onValueChange={setFilterProdi}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Program Studi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Program Studi</SelectItem>
                {PROGRAM_STUDI_OPTIONS.map((prodi) => (
                  <SelectItem key={prodi} value={prodi}>
                    {prodi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Semester */}
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {SEMESTER_OPTIONS.map((sem) => (
                  <SelectItem key={sem} value={String(sem)}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchQuery || filterProdi || filterSemester) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {mataKuliahList.length === 0 ? (
            <EmptyState
              title="Tidak ada mata kuliah"
              description="Belum ada mata kuliah yang terdaftar. Tambahkan mata kuliah baru untuk memulai."
              action={{
                label: 'Tambah Mata Kuliah',
                onClick: () => setIsCreateOpen(true),
              }}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode MK</TableHead>
                    <TableHead>Nama Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mataKuliahList.map((mk) => (
                    <TableRow key={mk.id}>
                      <TableCell className="font-medium">{mk.kode_mk}</TableCell>
                      <TableCell>{mk.nama_mk}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{mk.sks} SKS</Badge>
                      </TableCell>
                      <TableCell className="text-center">{mk.semester}</TableCell>
                      <TableCell>{mk.program_studi}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(mk)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(mk)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, totalItems)} dari {totalItems}{' '}
                  mata kuliah
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah</DialogTitle>
            <DialogDescription>
              Lengkapi form berikut untuk menambahkan mata kuliah baru
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Kode MK */}
                <FormField
                  control={createForm.control}
                  name="kode_mk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode MK</FormLabel>
                      <FormControl>
                        <Input placeholder="BID201" {...field} />
                      </FormControl>
                      <FormDescription>Format: 2-5 huruf + 3 angka</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKS */}
                <FormField
                  control={createForm.control}
                  name="sks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKS</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih SKS" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SKS_OPTIONS.map((sks) => (
                            <SelectItem key={sks} value={String(sks)}>
                              {sks} SKS
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nama MK */}
              <FormField
                control={createForm.control}
                name="nama_mk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mata Kuliah</FormLabel>
                    <FormControl>
                      <Input placeholder="Asuhan Kebidanan..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {/* Semester */}
                <FormField
                  control={createForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEMESTER_OPTIONS.map((sem) => (
                            <SelectItem key={sem} value={String(sem)}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Program Studi */}
                <FormField
                  control={createForm.control}
                  name="program_studi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Studi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih program studi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROGRAM_STUDI_OPTIONS.map((prodi) => (
                            <SelectItem key={prodi} value={prodi}>
                              {prodi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Deskripsi */}
              <FormField
                control={createForm.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi mata kuliah..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Mata Kuliah</DialogTitle>
            <DialogDescription>
              Perbarui informasi mata kuliah
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              {/* Same form fields as Create Modal */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="kode_mk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode MK</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="sks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKS</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SKS_OPTIONS.map((sks) => (
                            <SelectItem key={sks} value={String(sks)}>
                              {sks} SKS
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="nama_mk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Mata Kuliah</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SEMESTER_OPTIONS.map((sem) => (
                            <SelectItem key={sem} value={String(sem)}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="program_studi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Studi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROGRAM_STUDI_OPTIONS.map((prodi) => (
                            <SelectItem key={prodi} value={prodi}>
                              {prodi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isUpdating}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Perbarui
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Mata Kuliah"
        description={`Apakah Anda yakin ingin menghapus mata kuliah "${selectedMataKuliah?.nama_mk}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}