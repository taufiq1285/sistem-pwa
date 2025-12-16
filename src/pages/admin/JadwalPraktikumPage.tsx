/**
 * Admin - Jadwal Praktikum Management Page
 *
 * Purpose: Admin dapat melihat dan mengelola semua jadwal praktikum yang dibuat dosen
 * Features:
 * - Create: Tambah jadwal praktikum baru
 * - Read: View all jadwal praktikum (dari semua dosen)
 * - Update: Edit jadwal praktikum yang ada
 * - Delete: Hapus jadwal jika dosen salah pilih
 * - Filter: Filter by mata kuliah, dosen, kelas
 * - View detail jadwal
 */

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  User,
  BookOpen,
  Users,
  Plus,
  Edit,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DataTableColumnHeader } from "@/components/shared/DataTable/DataTableColumnHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// API
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

interface JadwalPraktikumWithRelations {
  id: string;
  kelas_id: string | null;
  laboratorium_id: string | null;
  dosen_id: string | null; // Override dosen untuk jadwal ini
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tanggal_praktikum: string | null;
  topik: string | null;
  catatan: string | null;
  is_active: boolean | null;
  created_at: string | null;
  // Relations
  kelas: {
    id: string;
    nama_kelas: string;
    mata_kuliah: {
      id: string;
      nama_mk: string;
      kode_mk: string;
    } | null;
    dosen: {
      id: string;
      users: {
        full_name: string;
      } | null;
    } | null;
  } | null;
  laboratorium: {
    id: string;
    nama_lab: string;
    kode_lab: string;
  } | null;
  dosen: {
    // Dosen override (jika ada)
    id: string;
    users: {
      full_name: string;
    } | null;
  } | null;
}

interface FilterState {
  search: string;
  dosenId: string;
  mataKuliahId: string;
  kelasId: string;
}

interface DosenOption {
  id: string;
  nama: string;
}

interface MataKuliahOption {
  id: string;
  nama_mk: string;
  kode_mk: string;
}

interface KelasOption {
  id: string;
  nama_kelas: string;
}

interface LaboratoriumOption {
  id: string;
  nama_lab: string;
  kode_lab: string;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const jadwalSchema = z
  .object({
    kelas_id: z.string().min(1, "Kelas harus dipilih"),
    laboratorium_id: z.string().min(1, "Laboratorium harus dipilih"),
    dosen_id: z.string().optional(), // Optional: Override dosen untuk jadwal ini
    tanggal_praktikum: z.date({ message: "Tanggal praktikum harus dipilih" }),
    jam_mulai: z.string().min(1, "Jam mulai harus dipilih"),
    jam_selesai: z.string().min(1, "Jam selesai harus dipilih"),
    topik: z.string().optional(),
    catatan: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.jam_mulai < data.jam_selesai, {
    message: "Jam selesai harus lebih besar dari jam mulai",
    path: ["jam_selesai"],
  });

type JadwalFormData = z.infer<typeof jadwalSchema>;

// Jam options for select dropdown
const JAM_PRAKTIKUM = [
  { value: "07:00", label: "07:00" },
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "12:00", label: "12:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
  { value: "16:00", label: "16:00" },
  { value: "17:00", label: "17:00" },
  { value: "18:00", label: "18:00" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function JadwalPraktikumPage() {
  // State
  const [jadwalList, setJadwalList] = useState<JadwalPraktikumWithRelations[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    dosenId: "all",
    mataKuliahId: "all",
    kelasId: "all",
  });

  // Options for filters
  const [dosenOptions, setDosenOptions] = useState<DosenOption[]>([]);
  const [mataKuliahOptions, setMataKuliahOptions] = useState<
    MataKuliahOption[]
  >([]);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [laboratoriumOptions, setLaboratoriumOptions] = useState<
    LaboratoriumOption[]
  >([]);

  // Create/Edit state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingJadwal, setDeletingJadwal] =
    useState<JadwalPraktikumWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail view state
  const [selectedJadwal, setSelectedJadwal] =
    useState<JadwalPraktikumWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form instances
  const createForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      kelas_id: "",
      laboratorium_id: "",
      dosen_id: "", // Default kosong, akan gunakan dosen dari kelas
      tanggal_praktikum: new Date(),
      jam_mulai: "08:00",
      jam_selesai: "10:00",
      topik: "",
      catatan: "",
      is_active: true,
    },
  });

  const editForm = useForm<JadwalFormData>({
    resolver: zodResolver(jadwalSchema),
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadJadwal(), loadFilterOptions()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadJadwal = async () => {
    const { data, error } = await supabase
      .from("jadwal_praktikum")
      .select(
        `
        *,
        kelas:kelas_id (
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            id,
            nama_mk,
            kode_mk
          ),
          dosen:dosen_id (
            id,
            users:user_id (
              full_name
            )
          )
        ),
        laboratorium:laboratorium_id (
          id,
          nama_lab,
          kode_lab
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    setJadwalList(data || []);
  };

  const loadFilterOptions = async () => {
    // Load dosen options
    const { data: dosenData } = await supabase
      .from("dosen")
      .select(
        `
        id,
        users:user_id (
          full_name
        )
      `
      )
      .order("users(full_name)");

    if (dosenData) {
      setDosenOptions(
        dosenData.map((d: any) => ({
          id: d.id,
          nama: d.users?.full_name || "Unknown",
        }))
      );
    }

    // Load mata kuliah options
    const { data: mkData } = await supabase
      .from("mata_kuliah")
      .select("id, nama_mk, kode_mk")
      .order("nama_mk");

    if (mkData) {
      setMataKuliahOptions(mkData);
    }

    // Load kelas options
    const { data: kelasData } = await supabase
      .from("kelas")
      .select("id, nama_kelas")
      .order("nama_kelas");

    if (kelasData) {
      setKelasOptions(kelasData);
    }

    // Load laboratorium options
    const { data: labData } = await supabase
      .from("laboratorium")
      .select("id, nama_lab, kode_lab")
      .order("nama_lab");

    if (labData) {
      setLaboratoriumOptions(labData);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (jadwal: JadwalPraktikumWithRelations) => {
    setDeletingJadwal(jadwal);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingJadwal) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("jadwal_praktikum")
        .delete()
        .eq("id", deletingJadwal.id);

      if (error) throw error;

      toast.success("Jadwal praktikum berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingJadwal(null);
      await loadJadwal();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus jadwal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (data: JadwalFormData) => {
    try {
      setIsCreating(true);

      // Auto-compute hari from tanggal
      const hari = format(data.tanggal_praktikum, "EEEE", {
        locale: localeId,
      }).toLowerCase();

      const { error } = await supabase.from("jadwal_praktikum").insert({
        kelas_id: data.kelas_id,
        laboratorium_id: data.laboratorium_id,
        dosen_id: (data.dosen_id && data.dosen_id !== "default") ? data.dosen_id : null, // Optional: override dosen
        tanggal_praktikum: format(data.tanggal_praktikum, "yyyy-MM-dd"),
        hari,
        jam_mulai: data.jam_mulai,
        jam_selesai: data.jam_selesai,
        topik: data.topik || null,
        catatan: data.catatan || null,
        is_active: data.is_active ?? true,
      });

      if (error) throw error;

      toast.success("Jadwal praktikum berhasil ditambahkan");
      setIsCreateOpen(false);
      createForm.reset();
      await loadJadwal();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan jadwal");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (jadwal: JadwalPraktikumWithRelations) => {
    setSelectedJadwal(jadwal);

    editForm.reset({
      kelas_id: jadwal.kelas_id || "",
      laboratorium_id: jadwal.laboratorium_id || "",
      dosen_id: jadwal.dosen_id || "", // Dosen override (jika ada)
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

      // Auto-compute hari from tanggal
      const hari = format(data.tanggal_praktikum, "EEEE", {
        locale: localeId,
      }).toLowerCase();

      const { error } = await supabase
        .from("jadwal_praktikum")
        .update({
          kelas_id: data.kelas_id,
          laboratorium_id: data.laboratorium_id,
          dosen_id: (data.dosen_id && data.dosen_id !== "default") ? data.dosen_id : null, // Optional: override dosen
          tanggal_praktikum: format(data.tanggal_praktikum, "yyyy-MM-dd"),
          hari,
          jam_mulai: data.jam_mulai,
          jam_selesai: data.jam_selesai,
          topik: data.topik || null,
          catatan: data.catatan || null,
          is_active: data.is_active ?? true,
        })
        .eq("id", selectedJadwal.id);

      if (error) throw error;

      toast.success("Jadwal praktikum berhasil diperbarui");
      setIsEditOpen(false);
      editForm.reset();
      setSelectedJadwal(null);
      await loadJadwal();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui jadwal");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewDetail = (jadwal: JadwalPraktikumWithRelations) => {
    setSelectedJadwal(jadwal);
    setIsDetailOpen(true);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      dosenId: "all",
      mataKuliahId: "all",
      kelasId: "all",
    });
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredJadwal = useMemo(() => {
    return jadwalList.filter((jadwal) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchSearch =
          jadwal.kelas?.nama_kelas?.toLowerCase().includes(searchLower) ||
          jadwal.kelas?.mata_kuliah?.nama_mk
            ?.toLowerCase()
            .includes(searchLower) ||
          jadwal.kelas?.dosen?.users?.full_name
            ?.toLowerCase()
            .includes(searchLower) ||
          jadwal.laboratorium?.nama_lab?.toLowerCase().includes(searchLower) ||
          jadwal.topik?.toLowerCase().includes(searchLower);
        if (!matchSearch) return false;
      }

      // Dosen filter
      if (filters.dosenId && filters.dosenId !== "all" && jadwal.kelas?.dosen?.id !== filters.dosenId) {
        return false;
      }

      // Mata Kuliah filter
      if (
        filters.mataKuliahId &&
        filters.mataKuliahId !== "all" &&
        jadwal.kelas?.mata_kuliah?.id !== filters.mataKuliahId
      ) {
        return false;
      }

      // Kelas filter
      if (filters.kelasId && filters.kelasId !== "all" && jadwal.kelas_id !== filters.kelasId) {
        return false;
      }

      return true;
    });
  }, [jadwalList, filters]);

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnDef<JadwalPraktikumWithRelations>[] = useMemo(
    () => [
      {
        accessorKey: "tanggal_praktikum",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tanggal" />
        ),
        cell: ({ row }) => {
          const tanggal = row.original.tanggal_praktikum;
          return tanggal ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(tanggal), "dd MMM yyyy", { locale: localeId })}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "mata_kuliah",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Mata Kuliah" />
        ),
        cell: ({ row }) => {
          const mk = row.original.kelas?.mata_kuliah;
          return mk ? (
            <div>
              <div className="font-medium">{mk.nama_mk}</div>
              <div className="text-xs text-muted-foreground">{mk.kode_mk}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "kelas",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Kelas" />
        ),
        cell: ({ row }) => {
          const kelas = row.original.kelas;
          return kelas ? (
            <Badge variant="outline">{kelas.nama_kelas}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "dosen",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Dosen" />
        ),
        cell: ({ row }) => {
          const dosen = row.original.kelas?.dosen;
          return dosen?.users?.full_name ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{dosen.users.full_name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "waktu",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Waktu" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {row.original.jam_mulai?.substring(0, 5)} -{" "}
              {row.original.jam_selesai?.substring(0, 5)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "laboratorium",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Laboratorium" />
        ),
        cell: ({ row }) => {
          const lab = row.original.laboratorium;
          return lab ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{lab.nama_lab}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "topik",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Topik" />
        ),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate">
            {row.original.topik || "-"}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "secondary"}>
            {row.original.is_active ? "Aktif" : "Tidak Aktif"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewDetail(row.original)}
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(row.original)}
              className="text-destructive hover:text-destructive"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <PageHeader
        title="Jadwal Praktikum"
        description="Kelola jadwal praktikum yang dibuat oleh dosen"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jadwal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jadwalList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Aktif</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jadwalList.filter((j) => j.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mata Kuliah</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mataKuliahOptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dosen Pengajar
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dosenOptions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-9"
              />
            </div>
            <Select
              value={filters.dosenId}
              onValueChange={(value) =>
                setFilters({ ...filters, dosenId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Dosen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Dosen</SelectItem>
                {dosenOptions.map((dosen) => (
                  <SelectItem key={dosen.id} value={dosen.id}>
                    {dosen.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.mataKuliahId}
              onValueChange={(value) =>
                setFilters({ ...filters, mataKuliahId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {mataKuliahOptions.map((mk) => (
                  <SelectItem key={mk.id} value={mk.id}>
                    {mk.nama_mk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.kelasId}
              onValueChange={(value) =>
                setFilters({ ...filters, kelasId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasOptions.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Praktikum</CardTitle>
          <CardDescription>
            Menampilkan {filteredJadwal.length} dari {jadwalList.length} jadwal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredJadwal}
            isLoading={isLoading}
            searchPlaceholder="Cari jadwal..."
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setDeletingJadwal(null);
        }}
        onConfirm={confirmDelete}
        title="Hapus Jadwal Praktikum"
        itemName={deletingJadwal?.kelas?.nama_kelas || "Jadwal"}
        itemType="jadwal praktikum"
        description={
          deletingJadwal
            ? `Jadwal untuk kelas "${deletingJadwal.kelas?.nama_kelas || "-"}" pada tanggal ${deletingJadwal.tanggal_praktikum ? format(new Date(deletingJadwal.tanggal_praktikum), "dd MMMM yyyy", { locale: localeId }) : "-"}`
            : ""
        }
        isLoading={isDeleting}
      />

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Informasi lengkap jadwal praktikum
            </DialogDescription>
          </DialogHeader>
          {selectedJadwal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mata Kuliah
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.kelas?.mata_kuliah?.nama_mk || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedJadwal.kelas?.mata_kuliah?.kode_mk || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kelas
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.kelas?.nama_kelas || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dosen Pengampu
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.kelas?.dosen?.users?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Laboratorium
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.laboratorium?.nama_lab || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tanggal Praktikum
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.tanggal_praktikum
                      ? format(
                          new Date(selectedJadwal.tanggal_praktikum),
                          "EEEE, dd MMMM yyyy",
                          { locale: localeId }
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Waktu
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.jam_mulai?.substring(0, 5)} -{" "}
                    {selectedJadwal.jam_selesai?.substring(0, 5)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <p>
                    <Badge
                      variant={
                        selectedJadwal.is_active ? "default" : "secondary"
                      }
                    >
                      {selectedJadwal.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Dibuat Pada
                  </label>
                  <p className="font-medium">
                    {selectedJadwal.created_at
                      ? format(
                          new Date(selectedJadwal.created_at),
                          "dd MMM yyyy HH:mm",
                          { locale: localeId }
                        )
                      : "-"}
                  </p>
                </div>
              </div>
              {selectedJadwal.topik && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Topik
                  </label>
                  <p className="font-medium">{selectedJadwal.topik}</p>
                </div>
              )}
              {selectedJadwal.catatan && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Catatan
                  </label>
                  <p className="text-sm">{selectedJadwal.catatan}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
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
              {/* Kelas */}
              <FormField
                control={createForm.control}
                name="kelas_id"
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
                        {kelasOptions.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dosen (Optional Override) */}
              <FormField
                control={createForm.control}
                name="dosen_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosen (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Gunakan dosen dari kelas (default)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Gunakan dosen dari kelas</SelectItem>
                        {dosenOptions.map((dosen) => (
                          <SelectItem key={dosen.id} value={dosen.id}>
                            {dosen.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kosongkan untuk menggunakan dosen yang mengampu kelas ini.
                      Pilih dosen lain jika ada pergantian dosen.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Laboratorium */}
              <FormField
                control={createForm.control}
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
                        {laboratoriumOptions.map((lab) => (
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

              {/* Tanggal Praktikum */}
              <FormField
                control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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

              {/* Topik */}
              <FormField
                control={createForm.control}
                name="topik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topik (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Topik praktikum..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Catatan */}
              <FormField
                control={createForm.control}
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

      {/* Edit Dialog */}
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
              {/* Kelas */}
              <FormField
                control={editForm.control}
                name="kelas_id"
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
                        {kelasOptions.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama_kelas}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dosen (Optional Override) */}
              <FormField
                control={editForm.control}
                name="dosen_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosen (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Gunakan dosen dari kelas (default)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Gunakan dosen dari kelas</SelectItem>
                        {dosenOptions.map((dosen) => (
                          <SelectItem key={dosen.id} value={dosen.id}>
                            {dosen.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kosongkan untuk menggunakan dosen yang mengampu kelas ini.
                      Pilih dosen lain jika ada pergantian dosen.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Laboratorium */}
              <FormField
                control={editForm.control}
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
                        {laboratoriumOptions.map((lab) => (
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

              {/* Tanggal Praktikum */}
              <FormField
                control={editForm.control}
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
                  control={editForm.control}
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
                  control={editForm.control}
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

              {/* Topik */}
              <FormField
                control={editForm.control}
                name="topik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topik (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Topik praktikum..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Catatan */}
              <FormField
                control={editForm.control}
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
    </div>
  );
}
