/**
 * Jadwal Page - OPSI B: Autocomplete + Manual Input
 * Dosen bisa pilih dari list ATAU ketik manual mata kuliah & kelas
 */

import { useState, useEffect } from 'react';
import { Plus, List, Calendar as CalendarIcon, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { query, insert } from '@/lib/api/base.api';
import type {
  Jadwal,
  CreateJadwalData,
  CalendarEvent,
} from '@/types/jadwal.types';
import { HARI_OPTIONS, JAM_PRAKTIKUM } from '@/types/jadwal.types';

// ============================================================================
// TYPES
// ============================================================================

interface MataKuliah {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  is_active: boolean;
}

interface Kelas {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  mata_kuliah_id: string;
  dosen_id: string | null;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  is_active: boolean;
}

interface Laboratorium {
  id: string;
  nama_lab: string;
  kode_lab: string;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const jadwalSchema = z.object({
  mata_kuliah_nama: z.string().min(1, 'Mata kuliah harus diisi'),
  kelas_nama: z.string().min(1, 'Kelas harus diisi'),
  laboratorium_id: z.string().min(1, 'Laboratorium harus dipilih'),
  tanggal_praktikum: z.date({ message: 'Tanggal praktikum harus dipilih' }),
  jam_mulai: z.string().min(1, 'Jam mulai harus dipilih'),
  jam_selesai: z.string().min(1, 'Jam selesai harus dipilih'),
  topik: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 10,
      'Topik harus minimal 10 karakter'
    ),
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
  const [laboratoriumList, setLaboratoriumList] = useState<Laboratorium[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);

  // Combobox open states
  const [mataKuliahOpen, setMataKuliahOpen] = useState(false);
  const [kelasOpen, setKelasOpen] = useState(false);

  // View state
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate] = useState(new Date());

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
  // FETCH DATA
  // ============================================================================

  const fetchJadwal = async () => {
    try {
      setLoading(true);

      const filters: Record<string, string | boolean> = { is_active: true };
      if (filterKelas) filters.kelas_id = filterKelas;
      if (filterLab) filters.laboratorium_id = filterLab;
      if (filterHari) filters.hari = filterHari;

      const data = await getJadwal(filters);
      setJadwalList(data);

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const events = await getCalendarEvents(calendarStart, calendarEnd);
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
      setLaboratoriumList(data as Laboratorium[]);
    } catch (error) {
      console.error('Failed to fetch laboratorium:', error);
    }
  };

  const fetchMataKuliah = async () => {
    try {
      const data = await query('mata_kuliah', {
        select: 'id, kode_mk, nama_mk, sks, semester, program_studi, is_active',
        order: { column: 'nama_mk', ascending: true },
      });
      setMataKuliahList(data.filter((mk: any) => mk.is_active) as MataKuliah[]);
    } catch (error) {
      console.error('Failed to fetch mata kuliah:', error);
    }
  };

  const fetchKelas = async () => {
    try {
      const data = await query('kelas', {
        select: 'id, kode_kelas, nama_kelas, mata_kuliah_id, dosen_id, tahun_ajaran, semester_ajaran, kuota, is_active',
        order: { column: 'nama_kelas', ascending: true },
      });
      setKelasList(data.filter((k: any) => k.is_active) as Kelas[]);
    } catch (error) {
      console.error('Failed to fetch kelas:', error);
    }
  };

  useEffect(() => {
    fetchLaboratorium();
    fetchMataKuliah();
    fetchKelas();
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [currentDate, filterKelas, filterLab, filterHari]);

  // ============================================================================
  // HELPER: Create or Get Mata Kuliah & Kelas
  // ============================================================================

  const getOrCreateMataKuliah = async (namaMk: string): Promise<string> => {
    // Cek apakah sudah ada di list
    const existing = mataKuliahList.find(
      mk => mk.nama_mk.toLowerCase() === namaMk.toLowerCase()
    );
    
    if (existing) {
      return existing.id;
    }

    // Create new mata kuliah
    try {
      const newMk = await insert('mata_kuliah', {
        kode_mk: namaMk.substring(0, 10).toUpperCase().replace(/\s/g, ''),
        nama_mk: namaMk,
        sks: 2,
        semester: 1,
        program_studi: 'Kebidanan',
        is_active: true,
      }) as MataKuliah;

      // Refresh list
      await fetchMataKuliah();

      return newMk.id;
    } catch (error) {
      console.error('Failed to create mata kuliah:', error);
      throw error;
    }
  };

  const getOrCreateKelas = async (namaKelas: string, mataKuliahId: string): Promise<string> => {
    // Cek apakah sudah ada di list
    const existing = kelasList.find(
      k => k.nama_kelas.toLowerCase() === namaKelas.toLowerCase() &&
           k.mata_kuliah_id === mataKuliahId
    );
    
    if (existing) {
      return existing.id;
    }

    // Create new kelas
    try {
      const currentYear = new Date().getFullYear();
      const newKelas = await insert('kelas', {
        kode_kelas: namaKelas.substring(0, 10).toUpperCase().replace(/\s/g, ''),
        nama_kelas: namaKelas,
        mata_kuliah_id: mataKuliahId,
        dosen_id: null,
        tahun_ajaran: `${currentYear}/${currentYear + 1}`,
        semester_ajaran: 1,
        kuota: 40,
        is_active: true,
      }) as Kelas;

      // Refresh list
      await fetchKelas();
      
      return newKelas.id;
    } catch (error) {
      console.error('Failed to create kelas:', error);
      throw error;
    }
  };

  // ============================================================================
  // CREATE FORM
  // ============================================================================

  const createForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      mata_kuliah_nama: '',
      kelas_nama: '',
      laboratorium_id: '',
      tanggal_praktikum: new Date(),
      jam_mulai: '08:00',
      jam_selesai: '10:00',
      topik: '',
      catatan: '',
      is_active: true,
    },
  });

  // ============================================================================
  // EDIT FORM
  // ============================================================================

  const editForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = async (data: JadwalFormData) => {
    try {
      setIsCreating(true);

      // Get or create mata kuliah
      const mataKuliahId = await getOrCreateMataKuliah(data.mata_kuliah_nama);
      
      // Get or create kelas
      const kelasId = await getOrCreateKelas(data.kelas_nama, mataKuliahId);

      // ✅ PERBAIKAN DITERAPKAN: Ganti 'kelas' menjadi 'kelas_id'
      const createData: CreateJadwalData = {
        kelas_id: kelasId, // ✅ Diubah sesuai instruksi Anda
        laboratorium_id: data.laboratorium_id,
        tanggal_praktikum: format(data.tanggal_praktikum, 'yyyy-MM-dd'),
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        topik: data.topik || undefined,
        catatan: data.catatan || undefined,
        is_active: data.is_active ?? true,
      };

      await createJadwal(createData);
      
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

  const handleEdit = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    
    // ✅ PERBAIKAN DITERAPKAN: Ganti 'jadwal.kelas' menjadi 'jadwal.kelas_id'
    const kelas = kelasList.find(k => k.id === jadwal.kelas_id); // ✅ Diubah sesuai instruksi Anda
    const mataKuliah = mataKuliahList.find(mk => mk.id === kelas?.mata_kuliah_id);
    
    editForm.reset({
      mata_kuliah_nama: mataKuliah?.nama_mk || '',
      kelas_nama: kelas?.nama_kelas || '',
      laboratorium_id: jadwal.laboratorium_id || '',
      tanggal_praktikum: jadwal.tanggal_praktikum ? new Date(jadwal.tanggal_praktikum) : new Date(),
      jam_mulai: jadwal.jam_mulai || '08:00',
      jam_selesai: jadwal.jam_selesai || '10:00',
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

      // Get or create mata kuliah
      const mataKuliahId = await getOrCreateMataKuliah(data.mata_kuliah_nama);
      
      // Get or create kelas
      const kelasId = await getOrCreateKelas(data.kelas_nama, mataKuliahId);

      // ✅ PERBAIKAN DITERAPKAN: Ganti 'kelas' menjadi 'kelas_id'
      const updateData: Partial<Omit<CreateJadwalData, 'hari'>> & { hari?: string } = {
        kelas_id: kelasId, // ✅ Diubah sesuai instruksi Anda
        laboratorium_id: data.laboratorium_id,
        hari: format(data.tanggal_praktikum, 'EEEE', { locale: id }).toLowerCase(),
        tanggal_praktikum: format(data.tanggal_praktikum, 'yyyy-MM-dd'),
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        topik: data.topik || undefined,
        catatan: data.catatan || undefined,
        is_active: data.is_active ?? true,
      };

      await updateJadwal(selectedJadwal.id, updateData);
      
      toast.success('Jadwal berhasil diperbarui');
      setIsEditOpen(false);
      editForm.reset();
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

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventEdit = (event: CalendarEvent) => {
    const jadwal = jadwalList.find((j) => j.id === event.id);
    if (jadwal) {
      setIsEventDialogOpen(false);
      handleEdit(jadwal);
    }
  };

  const handleEventDelete = (event: CalendarEvent) => {
    const jadwal = jadwalList.find((j) => j.id === event.id);
    if (jadwal) {
      setIsEventDialogOpen(false);
      handleDelete(jadwal);
    }
  };

  const handleClearFilters = () => {
    setFilterKelas('');
    setFilterLab('');
    setFilterHari('');
  };

  // ============================================================================
  // RENDER FORM FIELDS
  // ============================================================================

  const renderFormFields = (form: any) => (
    <>
      {/* Mata Kuliah Combobox */}
      <FormField
        control={form.control}
        name="mata_kuliah_nama"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Mata Kuliah Praktikum *</FormLabel>
            <Popover open={mataKuliahOpen} onOpenChange={setMataKuliahOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value || 'Pilih atau ketik mata kuliah praktikum...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Cari atau ketik mata kuliah baru..." 
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      Tidak ada hasil. Tekan Enter untuk menggunakan "{field.value}"
                    </CommandEmpty>
                    <CommandGroup>
                      {mataKuliahList.map((mk) => (
                        <CommandItem
                          key={mk.id}
                          value={mk.nama_mk}
                          onSelect={(value) => {
                            field.onChange(value);
                            setMataKuliahOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value === mk.nama_mk ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {mk.kode_mk} - {mk.nama_mk}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Pilih dari list atau ketik nama mata kuliah praktikum
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kelas Combobox */}
      <FormField
        control={form.control}
        name="kelas_nama"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Kelas *</FormLabel>
            <Popover open={kelasOpen} onOpenChange={setKelasOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value || 'Pilih atau ketik kelas...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Cari atau ketik kelas baru..." 
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                  <CommandList>
                    <CommandEmpty>
                      Tidak ada hasil. Tekan Enter untuk menggunakan "{field.value}"
                    </CommandEmpty>
                    <CommandGroup>
                      {kelasList.map((kelas) => (
                        <CommandItem
                          key={kelas.id}
                          value={kelas.nama_kelas}
                          onSelect={(value) => {
                            field.onChange(value);
                            setKelasOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              field.value === kelas.nama_kelas ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {kelas.kode_kelas} - {kelas.nama_kelas} ({kelas.tahun_ajaran})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Pilih dari list atau ketik nama kelas (contoh: Kelas A, Kelas B)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Laboratorium Field */}
      <FormField
        control={form.control}
        name="laboratorium_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Laboratorium *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih laboratorium" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {laboratoriumList.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.kode_lab} - {lab.nama_lab}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tanggal Praktikum Field */}
      <FormField
        control={form.control}
        name="tanggal_praktikum"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Tanggal Praktikum *</FormLabel>
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
                      <span>Pilih tanggal pelaksanaan praktikum</span>
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Jam Mulai & Jam Selesai */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="jam_mulai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Mulai *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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

        <FormField
          control={form.control}
          name="jam_selesai"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jam Selesai *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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

      {/* Topik Field */}
      <FormField
        control={form.control}
        name="topik"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topik (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Topik praktikum..."
                {...field}
              />
            </FormControl>
            <FormDescription>
              Minimal 10 karakter untuk menjelaskan materi praktikum
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Catatan Field */}
      <FormField
        control={form.control}
        name="catatan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Catatan tambahan..."
                className="resize-none"
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Praktikum"
        description="Kelola jadwal praktikum laboratorium"
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
          <div className="flex flex-wrap gap-4">
            <Select value={filterLab} onValueChange={setFilterLab}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Laboratorium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lab</SelectItem>
                {laboratoriumList.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.nama_lab}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterHari} onValueChange={setFilterHari}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Hari" />
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
                    {jadwalList.map((jadwal) => {
                      // ✅ PERBAIKAN DITERAPKAN: Ganti 'jadwal.kelas' menjadi 'jadwal.kelas_id'
                      const kelas = kelasList.find(k => k.id === jadwal.kelas_id); // ✅ Diubah sesuai instruksi Anda
                      return (
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
                              {kelas?.nama_kelas || '-'}
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
                      );
                    })}
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