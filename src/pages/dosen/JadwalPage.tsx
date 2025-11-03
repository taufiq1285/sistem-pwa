/**
 * Jadwal Page - Updated with Date Picker
 * Schedule management with calendar and list view
 */

import { useState, useEffect } from 'react';
import { Plus, List, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'; // ✅ TAMBAH startOfWeek, endOfWeek
import { id } from 'date-fns/locale';

// Components
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Calendar } from '@/components/shared/Calendar/Calendar';
import { EventDialog } from '@/components/shared/Calendar/EventDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// API & Types
import {
  getJadwal,
  getCalendarEvents,
  createJadwal,
  updateJadwal,
  deleteJadwal,
} from '@/lib/api/jadwal.api';
import { query } from '@/lib/api/base.api';
import type {
  Jadwal,
  CreateJadwalData,
  CalendarEvent,
} from '@/types/jadwal.types';
import { HARI_OPTIONS, JAM_PRAKTIKUM } from '@/types/jadwal.types';

// ============================================================================
// VALIDATION SCHEMA - UPDATED WITH DATE PICKER
// ============================================================================

const jadwalSchema = z.object({
  kelas: z.string().min(1, 'Kelas harus diisi').max(10, 'Maksimal 10 karakter'),
  laboratorium_id: z.string().min(1, 'Laboratorium harus dipilih'),
  tanggal_praktikum: z.date({ message: 'Tanggal praktikum harus dipilih' }),
  jam_mulai: z.string().min(1, 'Jam mulai harus dipilih'),
  jam_selesai: z.string().min(1, 'Jam selesai harus dipilih'),
  topik: z.string().optional(),
  catatan: z.string().optional(),
  is_active: z.boolean().optional(),
}).refine((data) => data.jam_mulai < data.jam_selesai, {
  message: 'Jam selesai harus lebih besar dari jam mulai',
  path: ['jam_selesai'],
});

type JadwalFormData = z.infer<typeof jadwalSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function JadwalPage() {
  // State
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [laboratoriumList, setLaboratoriumList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate] = useState(new Date()); // ✅ UBAH: tidak pakai const, biar bisa di-update

  // Filter state
  const [filterKelas, setFilterKelas] = useState<string>('');
  const [filterLab, setFilterLab] = useState<string>('');
  const [filterHari, setFilterHari] = useState<string>('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================================
  // FETCH DATA - ✅ FIXED: Gunakan startOfWeek & endOfWeek
  // ============================================================================

  const fetchJadwal = async () => {
    try {
      setLoading(true);

      // Fetch jadwal with filters
      const filters: any = { is_active: true };
      if (filterKelas) filters.kelas = filterKelas;
      if (filterLab) filters.laboratorium_id = filterLab;
      if (filterHari) filters.hari = filterHari;

      const data = await getJadwal(filters);
      setJadwalList(data);

      // ✅ FIX: Fetch calendar events dengan range yang benar
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      // Ambil minggu lengkap (termasuk hari dari bulan sebelah)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Sunday
      
      console.log('📅 Fetching calendar events:', {
        monthStart: format(monthStart, 'yyyy-MM-dd'),
        monthEnd: format(monthEnd, 'yyyy-MM-dd'),
        calendarStart: format(calendarStart, 'yyyy-MM-dd'),
        calendarEnd: format(calendarEnd, 'yyyy-MM-dd'),
      });

      const events = await getCalendarEvents(calendarStart, calendarEnd); // ✅ Gunakan calendarStart & calendarEnd
      setCalendarEvents(events);
    } catch (error: any) {
      toast.error('Gagal memuat data jadwal', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLaboratorium = async () => {
    try {
      const data = await query('laboratorium', {
        select: 'id, nama_lab, kode_lab',
        order: { column: 'nama_lab', ascending: true },
      });
      setLaboratoriumList(data);
    } catch (error) {
      console.error('Failed to fetch laboratorium:', error);
    }
  };

  useEffect(() => {
    fetchLaboratorium();
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [currentDate, filterKelas, filterLab, filterHari]);

  // ============================================================================
  // CREATE FORM - UPDATED WITH DATE PICKER
  // ============================================================================

  const createForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      kelas: '',
      laboratorium_id: '',
      tanggal_praktikum: new Date(),
      jam_mulai: '08:00',
      jam_selesai: '10:00',
      topik: '',
      catatan: '',
      is_active: true,
    },
  });

  const handleCreate = async (data: JadwalFormData) => {
    try {
      setIsCreating(true);

      const payload: CreateJadwalData = {
        ...data,
        topik: data.topik || undefined,
        catatan: data.catatan || undefined,
      };

      await createJadwal(payload);

      toast.success('Jadwal berhasil ditambahkan');
      setIsCreateOpen(false);
      createForm.reset();
      fetchJadwal();
    } catch (error: any) {
      toast.error('Gagal menambahkan jadwal', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================================
  // EDIT FORM - UPDATED WITH DATE PICKER
  // ============================================================================

  const editForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
  });

  const handleEdit = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    editForm.reset({
      kelas: jadwal.kelas || '',
      laboratorium_id: jadwal.laboratorium_id,
      tanggal_praktikum: jadwal.tanggal_praktikum ? new Date(jadwal.tanggal_praktikum) : new Date(),
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      topik: jadwal.topik || '',
      catatan: jadwal.catatan || '',
      is_active: jadwal.is_active ?? true,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (data: JadwalFormData) => {
    if (!selectedJadwal) return;

    try {
      setIsUpdating(true);

      await updateJadwal(selectedJadwal.id, data);

      toast.success('Jadwal berhasil diperbarui');
      setIsEditOpen(false);
      setSelectedJadwal(null);
      fetchJadwal();
    } catch (error: any) {
      toast.error('Gagal memperbarui jadwal', {
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ============================================================================
  // DELETE
  // ============================================================================

  const handleDelete = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedJadwal) return;

    try {
      setIsDeleting(true);

      await deleteJadwal(selectedJadwal.id);

      toast.success('Jadwal berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedJadwal(null);
      fetchJadwal();
    } catch (error: any) {
      toast.error('Gagal menghapus jadwal', {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    const jadwal = jadwalList.find((j) => j.id === event.metadata?.jadwal_id);
    if (jadwal) {
      handleEdit(jadwal);
    }
  };

  const handleEventDelete = (event: CalendarEvent) => {
    const jadwal = jadwalList.find((j) => j.id === event.metadata?.jadwal_id);
    if (jadwal) {
      handleDelete(jadwal);
    }
  };

  const handleClearFilters = () => {
    setFilterKelas('');
    setFilterLab('');
    setFilterHari('');
  };

  // ============================================================================
  // RENDER FORM FIELDS - UPDATED WITH DATE PICKER
  // ============================================================================

  const renderFormFields = (form: any) => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Kelas */}
        <FormField
          control={form.control}
          name="kelas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kelas</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Masukkan kelas (contoh: A, B, 3A)" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Masukkan kode kelas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Laboratorium */}
        <FormField
          control={form.control}
          name="laboratorium_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Laboratorium</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih laboratorium" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {laboratoriumList.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id}>
                      {lab.nama_lab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* DATE PICKER - NEW FIELD */}
      <FormField
        control={form.control}
        name="tanggal_praktikum"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Tanggal Praktikum</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? (
                      format(field.value, 'PPP', { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date: Date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              Pilih tanggal pelaksanaan praktikum
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Jam Mulai */}
        <FormField
          control={form.control}
          name="jam_mulai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Mulai</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jam" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {JAM_PRAKTIKUM.map((jam) => (
                    <SelectItem key={jam.value} value={jam.value}>
                      {jam.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Jam Selesai */}
        <FormField
          control={form.control}
          name="jam_selesai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Selesai</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jam" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {JAM_PRAKTIKUM.map((jam) => (
                    <SelectItem key={jam.value} value={jam.value}>
                      {jam.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Topik */}
      <FormField
        control={form.control}
        name="topik"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topik (Opsional)</FormLabel>
            <FormControl>
              <Input placeholder="Topik praktikum..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Catatan */}
      <FormField
        control={form.control}
        name="catatan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan (Opsional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Catatan tambahan..."
                className="min-h-[80px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && jadwalList.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat data jadwal..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Jadwal Praktikum"
        description="Kelola jadwal praktikum laboratorium kebidanan"
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Jadwal
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Filter Kelas */}
            <Input
              placeholder="Filter kelas (contoh: A, B)"
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full md:w-[200px]"
            />

            {/* Filter Lab */}
            <Select value={filterLab} onValueChange={setFilterLab}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Semua Laboratorium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Laboratorium</SelectItem>
                {laboratoriumList.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.nama_lab}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Hari */}
            <Select value={filterHari} onValueChange={setFilterHari}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Semua Hari" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Hari</SelectItem>
                {HARI_OPTIONS.map((hari) => (
                  <SelectItem key={hari.value} value={hari.value}>
                    {hari.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filterKelas || filterLab || filterHari) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          {calendarEvents.length === 0 ? (
            <EmptyState
              title="Tidak ada jadwal"
              description="Belum ada jadwal praktikum untuk bulan ini. Tambahkan jadwal baru untuk memulai."
              action={{
                label: 'Tambah Jadwal',
                onClick: () => setIsCreateOpen(true),
              }}
            />
          ) : (
            <Calendar
              events={calendarEvents}
              onEventClick={handleEventClick}
              initialDate={currentDate}
            />
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {jadwalList.length === 0 ? (
                <EmptyState
                  title="Tidak ada jadwal"
                  description="Belum ada jadwal praktikum. Tambahkan jadwal baru untuk memulai."
                  action={{
                    label: 'Tambah Jadwal',
                    onClick: () => setIsCreateOpen(true),
                  }}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Laboratorium</TableHead>
                      <TableHead>Topik</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jadwalList.map((jadwal) => (
                      <TableRow key={jadwal.id}>
                        <TableCell className="font-medium">
                          {jadwal.tanggal_praktikum 
                            ? format(new Date(jadwal.tanggal_praktikum), 'PPP', { locale: id })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {jadwal.jam_mulai} - {jadwal.jam_selesai}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {jadwal.kelas || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {jadwal.laboratorium?.nama_lab || '-'}
                        </TableCell>
                        <TableCell>
                          {jadwal.topik ? (
                            <span className="text-sm">{jadwal.topik}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(jadwal)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(jadwal)}
                            >
                              Hapus
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
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Lengkapi form berikut untuk menambahkan jadwal baru
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              {renderFormFields(createForm)}

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Perbarui informasi jadwal praktikum
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              {renderFormFields(editForm)}

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
        title="Hapus Jadwal"
        description={`Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
      />

     {/* Event Detail Dialog */}
      <EventDialog
        event={selectedEvent}
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        showActions={true}
      />
    </div>
  );
}