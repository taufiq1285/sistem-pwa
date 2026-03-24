/**
 * Jadwal Page - OPSI B: Autocomplete + Manual Input
 * Dosen bisa pilih dari list ATAU ketik manual mata kuliah & kelas
 */

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  List,
  Calendar as CalendarIcon,
  Loader2,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Filter,
  WifiOff,
} from "lucide-react";
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
import { StatusBadge } from "@/components/common/StatusBadge";
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
import { useAuth } from "@/lib/hooks/useAuth";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  notifyLaboranJadwalBaru,
  notifyMahasiswaJadwalChange,
} from "@/lib/api/notification.api";
import type {
  Jadwal,
  CreateJadwalData,
  CalendarEvent,
} from "@/types/jadwal.types";
import { HARI_OPTIONS, JAM_PRAKTIKUM } from "@/types/jadwal.types";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { supabase } from "@/lib/supabase/client";

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
  // ✅ NEW: Get current dosen for ownership check
  const { user } = useAuth();
  const currentDosenId = user?.dosen?.id;

  // State
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [laboratoriumList, setLaboratoriumList] = useState<Laboratorium[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

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

  const referenceCacheKeys = useMemo(
    () => ({
      laboratorium: user?.id ? `dosen_jadwal_laboratorium_${user.id}` : null,
      mataKuliah: user?.id ? `dosen_jadwal_mata_kuliah_${user.id}` : null,
      kelas: user?.id ? `dosen_jadwal_kelas_${user.id}` : null,
    }),
    [user?.id],
  );

  const scheduleCacheKeys = useMemo(() => {
    if (!user?.id) {
      return { jadwal: null, events: null };
    }

    const filterKey = JSON.stringify({
      kelas: filterKelas || "all",
      lab: filterLab || "all",
      hari: filterHari || "all",
      month: format(currentDate, "yyyy-MM"),
    });

    return {
      jadwal: `dosen_jadwal_list_${user.id}_${filterKey}`,
      events: `dosen_jadwal_events_${user.id}_${filterKey}`,
    };
  }, [currentDate, filterHari, filterKelas, filterLab, user?.id]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  // ============================================================================
  // FETCH DATA
  // ============================================================================

  const fetchJadwal = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const filters: Record<string, string | boolean> = {};
      if (filterKelas) filters.kelas_id = filterKelas;
      if (filterLab) filters.laboratorium_id = filterLab;
      if (filterHari) filters.hari = filterHari;

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      if (!scheduleCacheKeys.jadwal || !scheduleCacheKeys.events) {
        setJadwalList([]);
        setCalendarEvents([]);
        setIsOfflineData(false);
        setLastUpdatedAt(null);
        return;
      }

      const [cachedJadwalEntry, cachedEventsEntry] = await Promise.all([
        getCachedData<Jadwal[]>(scheduleCacheKeys.jadwal),
        getCachedData<CalendarEvent[]>(scheduleCacheKeys.events),
      ]);

      const hasCachedJadwal = Array.isArray(cachedJadwalEntry?.data);
      const hasCachedEvents = Array.isArray(cachedEventsEntry?.data);
      const hasAnyCachedData = hasCachedJadwal || hasCachedEvents;

      if (hasAnyCachedData) {
        setJadwalList(hasCachedJadwal ? cachedJadwalEntry!.data : []);
        setCalendarEvents(hasCachedEvents ? cachedEventsEntry!.data : []);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedJadwalEntry?.timestamp || 0,
            cachedEventsEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasAnyCachedData
            ? "Perangkat sedang offline. Menampilkan data jadwal tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data jadwal tersimpan.",
        );
      }

      const [data, events] = await Promise.all([
        cacheAPI(
          scheduleCacheKeys.jadwal,
          () => getJadwal(filters),
          {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(
          scheduleCacheKeys.events,
          () => getCalendarEvents(calendarStart, calendarEnd, filters),
          {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      setJadwalList(data);
      setCalendarEvents(events);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error: any) {
      if (!navigator.onLine && (jadwalList.length > 0 || calendarEvents.length > 0)) {
        toast.error("Mode offline aktif", {
          description:
            error?.message ||
            "Menampilkan snapshot jadwal dosen terakhir yang tersimpan di perangkat.",
        });
      } else {
        toast.error("Gagal memuat data jadwal", {
          description: error?.message || "Unknown error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLaboratorium = async (forceRefresh = false) => {
    try {
      if (!referenceCacheKeys.laboratorium) return;

      const cachedEntry = await getCachedData<Laboratorium[]>(
        referenceCacheKeys.laboratorium,
      );
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        setLaboratoriumList(cachedEntry!.data);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt((prev) => Math.max(prev || 0, cachedEntry?.timestamp || 0) || null);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan data laboratorium tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data laboratorium tersimpan.",
        );
      }

      const data = await cacheAPI(
        referenceCacheKeys.laboratorium,
        () =>
          query("laboratorium", {
            select: "id, nama_lab, kode_lab",
            order: { column: "nama_lab", ascending: true },
          }) as Promise<Laboratorium[]>,
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setLaboratoriumList(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error) {
      console.error("Failed to fetch laboratorium:", error);
    }
  };

  const fetchMataKuliah = async (forceRefresh = false) => {
    try {
      if (!referenceCacheKeys.mataKuliah) return;

      const cachedEntry = await getCachedData<MataKuliah[]>(
        referenceCacheKeys.mataKuliah,
      );
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        setMataKuliahList(cachedEntry!.data);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt((prev) => Math.max(prev || 0, cachedEntry?.timestamp || 0) || null);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan data mata kuliah tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data mata kuliah tersimpan.",
        );
      }

      const data = await cacheAPI(
        referenceCacheKeys.mataKuliah,
        async () => {
          const response = await query("mata_kuliah", {
            select: "id, kode_mk, nama_mk, sks, semester, program_studi, is_active",
            order: { column: "nama_mk", ascending: true },
          });
          return response.filter((mk: any) => mk.is_active) as MataKuliah[];
        },
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setMataKuliahList(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error) {
      console.error("Failed to fetch mata kuliah:", error);
      toast.error("Gagal memuat mata kuliah", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const fetchKelas = async (forceRefresh = false) => {
    try {
      if (!referenceCacheKeys.kelas) return;

      const cachedEntry = await getCachedData<Kelas[]>(referenceCacheKeys.kelas);
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        setKelasList(cachedEntry!.data);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt((prev) => Math.max(prev || 0, cachedEntry?.timestamp || 0) || null);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan data kelas tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data kelas tersimpan.",
        );
      }

      const data = await cacheAPI(
        referenceCacheKeys.kelas,
        async () => {
          const response = await query("kelas", {
            select:
              "id, kode_kelas, nama_kelas, mata_kuliah_id, dosen_id, tahun_ajaran, semester_ajaran, kuota, is_active",
            order: { column: "nama_kelas", ascending: true },
          });
          return response.filter((k: any) => k.is_active) as Kelas[];
        },
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setKelasList(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error) {
      console.error("Failed to fetch kelas:", error);
      toast.error("Gagal memuat kelas", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Helper: Get mahasiswa user IDs by kelas ID
  const getMahasiswaIds = async (kelasId: string): Promise<string[]> => {
    try {
      const { data } = await supabase
        .from("kelas_mahasiswa")
        .select("mahasiswa_id")
        .eq("kelas_id", kelasId);
      return data?.map((km: any) => km.mahasiswa_id) || [];
    } catch (error) {
      console.error("Failed to fetch mahasiswa IDs:", error);
      return [];
    }
  };

  // Helper: Get all laboran user IDs
  const getLaboranUserIds = async (): Promise<string[]> => {
    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("role", "laboran");
      return data?.map((u: any) => u.id) || [];
    } catch (error) {
      console.error("Failed to fetch laboran IDs:", error);
      return [];
    }
  };

  useEffect(() => {
    if (
      !referenceCacheKeys.laboratorium ||
      !referenceCacheKeys.mataKuliah ||
      !referenceCacheKeys.kelas ||
      !scheduleCacheKeys.jadwal ||
      !scheduleCacheKeys.events
    ) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?:
          | Laboratorium[]
          | MataKuliah[]
          | Kelas[]
          | Jadwal[]
          | CalendarEvent[];
      }>;

      if (
        customEvent.detail?.key === referenceCacheKeys.laboratorium &&
        Array.isArray(customEvent.detail?.data)
      ) {
        setLaboratoriumList(customEvent.detail.data as Laboratorium[]);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }

      if (
        customEvent.detail?.key === referenceCacheKeys.mataKuliah &&
        Array.isArray(customEvent.detail?.data)
      ) {
        setMataKuliahList(customEvent.detail.data as MataKuliah[]);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }

      if (
        customEvent.detail?.key === referenceCacheKeys.kelas &&
        Array.isArray(customEvent.detail?.data)
      ) {
        setKelasList(customEvent.detail.data as Kelas[]);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }

      if (
        customEvent.detail?.key === scheduleCacheKeys.jadwal &&
        Array.isArray(customEvent.detail?.data)
      ) {
        setJadwalList(customEvent.detail.data as Jadwal[]);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }

      if (
        customEvent.detail?.key === scheduleCacheKeys.events &&
        Array.isArray(customEvent.detail?.data)
      ) {
        setCalendarEvents(customEvent.detail.data as CalendarEvent[]);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }
    };

    window.addEventListener("cache:updated", handleCacheUpdated);
    return () => window.removeEventListener("cache:updated", handleCacheUpdated);
  }, [referenceCacheKeys, scheduleCacheKeys]);

  // ✅ OPTIMIZED: Fetch all reference data in parallel
  useEffect(() => {
    Promise.all([fetchLaboratorium(), fetchMataKuliah(), fetchKelas()]);
  }, [referenceCacheKeys]);

  useEffect(() => {
    fetchJadwal();
  }, [scheduleCacheKeys]);

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

      // Cari kelas dari list
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

      await createJadwal(createData);

      // ✅ IMPROVED: Beri feedback jelas tentang status pending
      toast.success("Jadwal berhasil dibuat!", {
        description:
          "Status: Menunggu approval dari Laboran. Anda akan diberitahu setelah jadwal disetujui.",
      });

      // Notify laboran (best-effort, non-blocking)
      const laboranIds = await getLaboranUserIds();
      if (laboranIds.length > 0 && mataKuliahList) {
        const mataKuliah = mataKuliahList.find(
          (mk) => mk.id === selectedKelas.mata_kuliah_id,
        );
        const lab = laboratoriumList.find((l) => l.id === data.laboratorium_id);

        notifyLaboranJadwalBaru(
          laboranIds,
          user?.full_name || "Dosen",
          mataKuliah?.nama_mk || "Mata Kuliah",
          selectedKelas.nama_kelas,
          data.tanggal_praktikum instanceof Date
            ? data.tanggal_praktikum.toISOString()
            : data.tanggal_praktikum,
          lab?.nama_lab || "Lab",
        ).catch((err) => {
          console.error("Failed to notify laboran:", err);
        });

        // Notify mahasiswa in the kelas (best-effort, non-blocking)
        const mahasiswaIds = await getMahasiswaIds(kelasId);
        if (mahasiswaIds.length > 0) {
          notifyMahasiswaJadwalChange(
            mahasiswaIds,
            mataKuliah?.nama_mk || "Mata Kuliah",
            selectedKelas.nama_kelas,
            data.tanggal_praktikum instanceof Date
              ? data.tanggal_praktikum.toISOString()
              : data.tanggal_praktikum,
            "baru",
          ).catch((err) => {
            console.error("Failed to notify mahasiswa:", err);
          });
        }
      }

      setIsCreateOpen(false);
      createForm.reset();
      fetchJadwal();
    } catch (error: any) {
      toast.error("Gagal menambahkan jadwal", {
        description: error.message || "Unknown error occurred",
      });
    } finally {
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

      // Notify laboran and mahasiswa about the update (best-effort, non-blocking)
      const kelas = kelasList.find((k) => k.id === selectedKelas?.id);
      const mataKuliah = kelas
        ? mataKuliahList.find((mk) => mk.id === kelas.mata_kuliah_id)
        : null;
      const lab = laboratoriumList.find((l) => l.id === data.laboratorium_id);

      if (kelas && mataKuliah) {
        // Notify laboran
        const laboranIds = await getLaboranUserIds();
        if (laboranIds.length > 0) {
          notifyLaboranJadwalBaru(
            laboranIds,
            user?.full_name || "Dosen",
            mataKuliah.nama_mk,
            kelas.nama_kelas,
            data.tanggal_praktikum instanceof Date
              ? data.tanggal_praktikum.toISOString()
              : data.tanggal_praktikum,
            lab?.nama_lab || "Lab",
          ).catch((err) => {
            console.error("Failed to notify laboran:", err);
          });
        }

        // Notify mahasiswa
        const mahasiswaIds = await getMahasiswaIds(kelas.id);
        if (mahasiswaIds.length > 0) {
          notifyMahasiswaJadwalChange(
            mahasiswaIds,
            mataKuliah.nama_mk,
            kelas.nama_kelas,
            data.tanggal_praktikum instanceof Date
              ? data.tanggal_praktikum.toISOString()
              : data.tanggal_praktikum,
            "diupdate",
          ).catch((err) => {
            console.error("Failed to notify mahasiswa:", err);
          });
        }
      }

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

      // Notify mahasiswa about the cancellation (best-effort, non-blocking)
      const kelas = kelasList.find((k) => k.id === selectedJadwal.kelas_id);
      const mataKuliah = kelas
        ? mataKuliahList.find((mk) => mk.id === kelas.mata_kuliah_id)
        : null;

      if (kelas && mataKuliah) {
        const mahasiswaIds = await getMahasiswaIds(kelas.id);
        if (mahasiswaIds.length > 0) {
          notifyMahasiswaJadwalChange(
            mahasiswaIds,
            mataKuliah.nama_mk,
            kelas.nama_kelas,
            selectedJadwal.tanggal_praktikum ||
              new Date().toISOString().split("T")[0],
            "dibatalkan",
          ).catch((err) => {
            console.error("Failed to notify mahasiswa:", err);
          });
        }
      }

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
    <div className="role-page-shell">
      <div className="role-page-content space-y-8">
        {(isOfflineData || !navigator.onLine) && (
          <Alert className="border-warning/40 bg-warning/10 text-foreground shadow-sm">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Jadwal dosen sedang memakai snapshot lokal dari perangkat.
              {lastUpdatedLabel
                ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3">
              <div className="p-3 bg-linear-to-br from-primary to-accent rounded-2xl shadow-lg shadow-primary/30">
                <CalendarIcon className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-primary to-accent dark:from-primary/80 dark:to-accent/80">
                  Jadwal Praktikum
                </h1>
                <p className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground mt-1">
                  Kelola jadwal praktikum laboratorium
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base font-semibold text-muted-foreground ml-1">
              Atur dan pantau semua jadwal praktikum dengan mudah
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/30 font-semibold px-6"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tambah Jadwal
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-xl bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <CardContent className="p-5 relative">
              <p className="text-sm font-bold text-primary dark:text-primary/80">
                Total Jadwal
              </p>
              <p className="mt-2 text-3xl font-black text-primary/90 dark:text-primary/70">
                {jadwalList.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-linear-to-br from-info/5 to-info/10 dark:from-info/10 dark:to-info/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-info/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <CardContent className="p-5 relative">
              <p className="text-sm font-bold text-info dark:text-info/80">
                Event Bulan Ini
              </p>
              <p className="mt-2 text-3xl font-black text-info/90 dark:text-info/70">
                {calendarEvents.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-linear-to-br from-success/5 to-success/10 dark:from-success/10 dark:to-success/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <CardContent className="p-5 relative">
              <p className="text-sm font-bold text-success dark:text-success/80">
                Tampilan Aktif
              </p>
              <p className="mt-2 text-lg sm:text-xl font-extrabold text-success/90 dark:text-success/70">
                {currentView === "calendar" ? "Calendar View" : "List View"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Filter:
              </div>
              <Select value={filterLab} onValueChange={setFilterLab}>
                <SelectTrigger className="w-full sm:w-55 border-2">
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
                <SelectTrigger className="w-full sm:w-55 border-2">
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
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="border-2 hover:bg-muted/40 font-semibold"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Tabs */}
        <Tabs
          value={currentView}
          onValueChange={(v) => setCurrentView(v as any)}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl p-1 h-auto bg-linear-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
            <TabsTrigger
              value="calendar"
              className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-card"
            >
              <CalendarIcon className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-card"
            >
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-6">
            {calendarEvents.length === 0 ? (
              <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
                <CardContent className="p-12">
                  <EmptyState
                    title="Tidak ada jadwal"
                    description="Belum ada jadwal praktikum untuk bulan ini. Tambahkan jadwal baru untuk memulai."
                    action={{
                      label: "Tambah Jadwal",
                      onClick: () => setIsCreateOpen(true),
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Calendar
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                    initialDate={currentDate}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            {jadwalList.length === 0 ? (
              <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
                <CardContent className="p-12">
                  <EmptyState
                    title="Tidak ada jadwal"
                    description="Belum ada jadwal praktikum. Tambahkan jadwal baru untuk memulai."
                    action={{
                      label: "Tambah Jadwal",
                      onClick: () => setIsCreateOpen(true),
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jadwalList.map((jadwal) => {
                  const kelas = kelasList.find((k) => k.id === jadwal.kelas_id);
                  const mataKuliah = mataKuliahList.find(
                    (mk) => mk.id === kelas?.mata_kuliah_id,
                  );

                  // ✅ NEW: Check if this jadwal belongs to current dosen
                  const isOwner = jadwal.dosen_id === currentDosenId;
                  const creatorName =
                    (jadwal as any).dosen?.user?.full_name || "Unknown";

                  return (
                    <Card
                      key={jadwal.id}
                      className={`group hover:shadow-2xl transition-all duration-300 border-2 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm overflow-hidden relative ${
                        isOwner
                          ? "border-primary/30 dark:border-primary/30"
                          : "border-border/50 dark:border-border/30"
                      }`}
                    >
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${
                          isOwner
                            ? "from-primary/20 to-accent/20"
                            : "from-gray-300/10 to-gray-400/10"
                        } rounded-full blur-3xl -mr-16 -mt-16`}
                      />
                      <CardContent className="relative p-6">
                        <div className="flex items-start gap-6">
                          {/* Date Badge */}
                          <div className="shrink-0">
                            <div
                              className={`w-20 h-20 rounded-2xl shadow-lg flex flex-col items-center justify-center text-primary-foreground ${
                                isOwner
                                  ? "bg-linear-to-br from-primary to-accent shadow-primary/30"
                                  : "bg-linear-to-br from-gray-400 to-gray-500 shadow-gray-400/30"
                              }`}
                            >
                              <div className="text-2xl font-bold">
                                {jadwal.tanggal_praktikum
                                  ? format(
                                      new Date(jadwal.tanggal_praktikum),
                                      "dd",
                                    )
                                  : "-"}
                              </div>
                              <div className="text-xs font-medium uppercase">
                                {jadwal.tanggal_praktikum
                                  ? format(
                                      new Date(jadwal.tanggal_praktikum),
                                      "MMM",
                                      { locale: id },
                                    )
                                  : "-"}
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                  {mataKuliah?.nama_mk || "Mata Kuliah"}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full font-semibold">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {kelas?.kode_kelas} - {kelas?.nama_kelas}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full font-semibold">
                                    <Users className="h-3.5 w-3.5" />
                                    {kelas?.tahun_ajaran}
                                  </span>
                                  {/* ✅ NEW: Creator Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold ${
                                      isOwner
                                        ? "bg-success/10 text-success"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isOwner ? "👤 Anda" : `👤 ${creatorName}`}
                                  </span>
                                  {/* ✅ NEW: Status Badge */}
                                  <StatusBadge
                                    status={jadwal.status || "pending"}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-3">
                              {jadwal.topik && (
                                <div className="flex items-start gap-2">
                                  <div className="w-1 h-1 bg-primary rounded-full mt-2"></div>
                                  <p className="text-sm font-semibold text-muted-foreground">
                                    <span className="text-primary">
                                      Topik:
                                    </span>{" "}
                                    {jadwal.topik}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-success" />
                                <span className="font-bold text-success">
                                  {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-warning" />
                                <span className="font-bold text-warning">
                                  {jadwal.laboratorium?.nama_lab || "-"}
                                </span>
                              </div>
                            </div>

                            {jadwal.catatan && (
                              <div className="mt-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  📝 {jadwal.catatan}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {isOwner ? (
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(jadwal)}
                                className="border-2 hover:bg-primary/5 font-semibold"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(jadwal)}
                                className="font-semibold"
                              >
                                Hapus
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
              <DialogTitle className="text-2xl font-bold">
                Tambah Jadwal Praktikum
              </DialogTitle>
              <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-1">
                Lengkapi form berikut untuk menambahkan jadwal baru
              </DialogDescription>
            </div>

            <div className="p-6">
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(handleCreate)}
                  className="space-y-4"
                >
                  {renderFormFields(createForm)}

                  <DialogFooter className="mt-6 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      disabled={isCreating}
                      className="border-2 font-semibold"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
                    >
                      {isCreating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Simpan Jadwal
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
              <DialogTitle className="text-2xl font-bold">
                Edit Jadwal Praktikum
              </DialogTitle>
              <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-1">
                Perbarui informasi jadwal praktikum
              </DialogDescription>
            </div>

            <div className="p-6">
              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit(handleUpdate)}
                  className="space-y-4"
                >
                  {renderFormFields(editForm)}

                  <DialogFooter className="mt-6 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditOpen(false)}
                      disabled={isUpdating}
                      className="border-2 font-semibold"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
                    >
                      {isUpdating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Perbarui Jadwal
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus Jadwal"
          description={
            selectedJadwal
              ? `Apakah Anda yakin ingin menghapus jadwal praktikum ini?\n\nStatus: ${selectedJadwal.status === "pending" ? "⏳ Menunggu Approval" : selectedJadwal.status === "approved" ? "✅ Approved" : selectedJadwal.status}\n\nTindakan ini tidak dapat dibatalkan.`
              : "Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
          }
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
    </div>
  );
}
