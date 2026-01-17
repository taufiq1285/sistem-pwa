/**
 * Jadwal Page - OPSI B: Autocomplete + Manual Input
 * Dosen bisa pilih dari list ATAU ketik manual mata kuliah & kelas
 */

import { useState, useEffect } from "react";
import { Plus, List, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { id } from "date-fns/locale";

// Components
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Calendar } from "@/components/shared/Calendar/Calendar";
import { EventDialog } from "@/components/shared/Calendar/EventDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Removed: Command imports (now using simple Select)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// API & Types
import {
  getJadwal,
  getCalendarEvents,
  createJadwal,
  updateJadwal,
  deleteJadwal,
} from "@/lib/api/jadwal.api";
import { query } from "@/lib/api/base.api";
import type {
  Jadwal,
  CreateJadwalData,
  CalendarEvent,
} from "@/types/jadwal.types";
import { HARI_OPTIONS, JAM_PRAKTIKUM } from "@/types/jadwal.types";

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

const jadwalSchema = z
  .object({
    mata_kuliah_nama: z.string().min(1, "Mata kuliah harus diisi"),
    kelas_nama: z.string().min(1, "Kelas harus diisi"),
    laboratorium_id: z.string().min(1, "Laboratorium harus dipilih"),
    tanggal_praktikum: z.date({ message: "Tanggal praktikum harus dipilih" }),
    jam_mulai: z.string().min(1, "Jam mulai harus dipilih"),
    jam_selesai: z.string().min(1, "Jam selesai harus dipilih"),
    topik: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 10,
        "Topik harus minimal 10 karakter",
      ),
    catatan: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.jam_mulai < data.jam_selesai, {
    message: "Jam selesai harus lebih besar dari jam mulai",
    path: ["jam_selesai"],
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

  // Removed: Combobox states (now using simple Select)

  // View state
  const [currentView, setCurrentView] = useState<"calendar" | "list">(
    "calendar",
  );
  const [currentDate] = useState(new Date());

  // Filter state
  const [filterKelas, setFilterKelas] = useState<string>("");
  const [filterLab, setFilterLab] = useState<string>("");
  const [filterHari, setFilterHari] = useState<string>("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

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
      toast.error("Gagal memuat data jadwal", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLaboratorium = async () => {
    try {
      const data = await query("laboratorium", {
        select: "id, nama_lab, kode_lab",
        order: { column: "nama_lab", ascending: true },
      });
      setLaboratoriumList(data as Laboratorium[]);
    } catch (error) {
      console.error("Failed to fetch laboratorium:", error);
    }
  };

  const fetchMataKuliah = async () => {
    try {
      console.log("🔵 Fetching mata kuliah...");
      const data = await query("mata_kuliah", {
        select: "id, kode_mk, nama_mk, sks, semester, program_studi, is_active",
        order: { column: "nama_mk", ascending: true },
      });
      console.log("📦 Raw mata kuliah data:", data);
      const filtered = data.filter((mk: any) => mk.is_active) as MataKuliah[];
      console.log("✅ Filtered mata kuliah (is_active=true):", filtered);
      console.table(filtered); // ← Tampilkan dalam tabel
      setMataKuliahList(filtered);
      console.log("🔵 State mataKuliahList updated, count:", filtered.length);
    } catch (error) {
      console.error("❌ Failed to fetch mata kuliah:", error);
      toast.error("Gagal memuat mata kuliah", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const fetchKelas = async () => {
    try {
      console.log("🔵 Fetching kelas...");
      const data = await query("kelas", {
        select:
          "id, kode_kelas, nama_kelas, mata_kuliah_id, dosen_id, tahun_ajaran, semester_ajaran, kuota, is_active",
        order: { column: "nama_kelas", ascending: true },
      });
      console.log("📦 Raw kelas data:", data);
      const filtered = data.filter((k: any) => k.is_active) as Kelas[];
      console.log("✅ Filtered kelas (is_active=true):", filtered);
      console.table(filtered); // ← Tampilkan dalam tabel
      setKelasList(filtered);
      console.log("🔵 State kelasList updated, count:", filtered.length);
    } catch (error) {
      console.error("❌ Failed to fetch kelas:", error);
      toast.error("Gagal memuat kelas", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
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
  // CREATE FORM
  // ============================================================================

  const createForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      mata_kuliah_nama: "",
      kelas_nama: "",
      laboratorium_id: "",
      tanggal_praktikum: new Date(),
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      topik: "",
      catatan: "",
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

      // 🔍 DEBUG: Log data yang masuk
      console.log("🔍 DEBUG handleCreate called with data:", {
        data,
        kelasList: kelasList.map(k => ({ id: k.id, nama_kelas: k.nama_kelas })),
        laboratoriumList: laboratoriumList.map(l => ({ id: l.id, nama_lab: l.nama_lab }))
      });

      // Dosen HANYA bisa memilih kelas yang sudah ada
      // Cari kelas dari list
      const selectedKelas = kelasList.find(
        (k) => k.nama_kelas === data.kelas_nama,
      );

      console.log("🔍 DEBUG: selectedKelas:", selectedKelas);

      if (!selectedKelas) {
        console.error("❌ Kelas tidak ditemukan:", data.kelas_nama);
        toast.error("Kelas tidak ditemukan", {
          description:
            "Pilih kelas yang sudah ada. Jika tidak ada, hubungi Admin.",
        });
        return;
      }

      const kelasId = selectedKelas.id;
      console.log("🔍 DEBUG: kelasId:", kelasId);

      // ✅ Dosen memilih kelas yang sudah ada (dibuat Admin)
      const createData: CreateJadwalData = {
        kelas_id: kelasId, // ✅ Gunakan kelas yang dipilih
        laboratorium_id: data.laboratorium_id,
        tanggal_praktikum: format(data.tanggal_praktikum, "yyyy-MM-dd"),
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        topik: data.topik || undefined,
        catatan: data.catatan || undefined,
        is_active: data.is_active ?? true,
      };

      console.log("🔍 DEBUG: createData:", createData);

      console.log("🔍 DEBUG: Memanggil createJadwal...");
      const result = await createJadwal(createData);
      console.log("✅ DEBUG: createJadwal success:", result);

      toast.success("Jadwal berhasil ditambahkan");
      setIsCreateOpen(false);
      createForm.reset();
      fetchJadwal();
    } catch (error: any) {
      console.error("❌ DEBUG: Error di handleCreate:", error);
      toast.error("Gagal menambahkan jadwal", {
        description: error.message || "Unknown error occurred",
      });
    } finally {
      console.log("🔍 DEBUG: setIsCreating(false)");
      setIsCreating(false);
    }
  };

  const handleEdit = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);

    // ✅ PERBAIKAN DITERAPKAN: Ganti 'jadwal.kelas' menjadi 'jadwal.kelas_id'
    const kelas = kelasList.find((k) => k.id === jadwal.kelas_id); // ✅ Diubah sesuai instruksi Anda
    const mataKuliah = mataKuliahList.find(
      (mk) => mk.id === kelas?.mata_kuliah_id,
    );

    editForm.reset({
      mata_kuliah_nama: mataKuliah?.nama_mk || "",
      kelas_nama: kelas?.nama_kelas || "",
      laboratorium_id: jadwal.laboratorium_id || "",
      tanggal_praktikum: jadwal.tanggal_praktikum
        ? new Date(jadwal.tanggal_praktikum)
        : new Date(),
      jam_mulai: jadwal.jam_mulai || "08:00",
      jam_selesai: jadwal.jam_selesai || "10:00",
      topik: jadwal.topik || "",
      catatan: jadwal.catatan || "",
      is_active: jadwal.is_active ?? true,
    });

    setIsEditOpen(true);
  };

  const handleUpdate = async (data: JadwalFormData) => {
    if (!selectedJadwal) return;

    try {
      setIsUpdating(true);

      // Dosen HANYA bisa memilih kelas yang sudah ada
      const selectedKelas = kelasList.find(
        (k) => k.nama_kelas === data.kelas_nama,
      );

      if (!selectedKelas) {
        toast.error("Kelas tidak ditemukan", {
          description:
            "Pilih kelas yang sudah ada. Jika tidak ada, hubungi Admin.",
        });
        return;
      }

      const kelasId = selectedKelas.id;

      // ✅ Dosen memilih kelas yang sudah ada (dibuat Admin)
      const updateData: Partial<Omit<CreateJadwalData, "hari">> & {
        hari?: string;
      } = {
        kelas_id: kelasId, // ✅ Gunakan kelas yang dipilih
        laboratorium_id: data.laboratorium_id,
        hari: format(data.tanggal_praktikum, "EEEE", {
          locale: id,
        }).toLowerCase(),
        tanggal_praktikum: format(data.tanggal_praktikum, "yyyy-MM-dd"),
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        topik: data.topik || undefined,
        catatan: data.catatan || undefined,
        is_active: data.is_active ?? true,
      };

      await updateJadwal(selectedJadwal.id, updateData);

      toast.success("Jadwal berhasil diperbarui");
      setIsEditOpen(false);
      editForm.reset();
      setSelectedJadwal(null);
      fetchJadwal();
    } catch (error: any) {
      toast.error("Gagal memperbarui jadwal", {
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

      toast.success("Jadwal berhasil dihapus");
      setIsDeleteOpen(false);
      setSelectedJadwal(null);
      fetchJadwal();
    } catch (error: any) {
      toast.error("Gagal menghapus jadwal", {
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
    setFilterKelas("");
    setFilterLab("");
    setFilterHari("");
  };

  // ============================================================================
  // RENDER FORM FIELDS
  // ============================================================================

  const renderFormFields = (form: any) => (
    <>
      {/* Mata Kuliah Select - SIMPLE VERSION */}
      <FormField
        control={form.control}
        name="mata_kuliah_nama"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mata Kuliah *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mataKuliahList.map((mk) => (
                  <SelectItem key={mk.id} value={mk.nama_mk}>
                    {mk.kode_mk} - {mk.nama_mk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Kelas Select - SIMPLE VERSION */}
      <FormField
        control={form.control}
        name="kelas_nama"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kelas *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.nama_kelas}>
                    {kelas.kode_kelas} - {kelas.nama_kelas} (
                    {kelas.tahun_ajaran})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Tanggal Praktikum Field - SIMPLE INPUT DATE */}
      <FormField
        control={form.control}
        name="tanggal_praktikum"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tanggal Praktikum *</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const dateValue = e.target.value
                    ? new Date(e.target.value)
                    : new Date();
                  field.onChange(dateValue);
                }}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </FormControl>
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
              <Input placeholder="Topik praktikum..." {...field} />
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
                label: "Tambah Jadwal",
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
                    label: "Tambah Jadwal",
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
                      const kelas = kelasList.find(
                        (k) => k.id === jadwal.kelas_id,
                      ); // ✅ Diubah sesuai instruksi Anda
                      return (
                        <TableRow key={jadwal.id}>
                          <TableCell className="font-medium">
                            {jadwal.tanggal_praktikum
                              ? format(
                                  new Date(jadwal.tanggal_praktikum),
                                  "PPP",
                                  { locale: id },
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {jadwal.jam_mulai} - {jadwal.jam_selesai}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {kelas?.nama_kelas || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {jadwal.laboratorium?.nama_lab || "-"}
                          </TableCell>
                          <TableCell>
                            {jadwal.topik ? (
                              <span className="text-sm">{jadwal.topik}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
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
            <form
              onSubmit={createForm.handleSubmit(handleCreate)}
              className="space-y-4"
            >
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
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
            <form
              onSubmit={editForm.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
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
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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