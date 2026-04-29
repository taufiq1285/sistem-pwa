/**
 * Monitoring Praktikum & Referensi Akademik - Unified Management System
 *
 * Purpose: Single page untuk memantau referensi akademik dan jadwal praktikum
 * Features:
 * - Master-Detail View: Referensi akademik sebagai master record, Jadwal sebagai detail
 * - Unified CRUD operations
 * - Enhanced cascade delete dengan konfirmasi
 * - Real-time updates
 * - Analytics dashboard
 */

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { useAuth } from "@/lib/hooks/useAuth";
import { networkDetector } from "@/lib/offline/network-detector";
import { supabase } from "@/lib/supabase/client";

// Types
interface AssignmentDetail {
  id: string;
  dosen_id: string;
  mata_kuliah_id: string;
  kelas_id: string;
  total_jadwal: number;
  tanggal_mulai: string;
  tanggal_selesai: string;

  // Join data
  dosen: {
    id: string;
    full_name: string;
    email: string;
  };
  mata_kuliah: {
    id: string;
    nama_mk: string;
    kode_mk: string;
    sks?: number;
  };
  kelas: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
    tahun_ajaran: string;
    semester_ajaran: number;
  };

  // Detailed schedules
  jadwalDetail?: Jadwal[];
}

interface Jadwal {
  id: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  status: string;
  laboratorium: {
    id: string;
    nama_lab: string;
    kode_lab: string;
  };
}

interface AssignmentFilters {
  dosen_id?: string;
  mata_kuliah_id?: string;
  kelas_id?: string;
  status?: string;
  semester?: string;
}

interface DeleteConfirmationData {
  assignment: AssignmentDetail;
  totalJadwal: number;
}

// Edit interfaces
interface EditJadwalData {
  id: string;
  tanggal_praktikum: string;
  jam_mulai: string;
  jam_selesai: string;
  laboratorium_id: string;
  topik: string;
}

interface EditAssignmentData {
  dosen_id: string;
  old_dosen_id: string;
  kelas_id: string;
  old_kelas_id: string;
  mata_kuliah_id: string;
  old_mata_kuliah_id: string;
}

interface PraktikumReferenceRow {
  key: string;
  kelas_id: string;
  kelas_nama: string;
  kelas_kode: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  dosen_id: string;
  dosen_nama: string;
  dosen_email: string;
  mata_kuliah_id: string;
  mata_kuliah_nama: string;
  mata_kuliah_kode: string;
  mata_kuliah_sks?: number;
  total_jadwal: number;
  assignment: AssignmentDetail;
}

// Tab 1: Assignment Dosen types
interface KelasWithAssignment {
  id: string;
  nama_kelas: string;
  kode_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  dosen_id?: string | null;
  mata_kuliah_id?: string | null;
  mata_kuliah?: { id: string; nama_mk: string; kode_mk: string; sks: number };
  dosen?: {
    id: string;
    nip: string;
    users?: { full_name: string; email: string };
  };
}

function getDosenDisplayName(dosen: any): string {
  const user = Array.isArray(dosen?.user) ? dosen.user[0] : dosen?.user;
  const users = Array.isArray(dosen?.users) ? dosen.users[0] : dosen?.users;

  return (
    user?.full_name ||
    users?.full_name ||
    user?.email ||
    users?.email ||
    dosen?.nip ||
    "Dosen tanpa nama"
  );
}

export default function ManajemenAssignmentPage() {
  const { user } = useAuth();

  // ── Tab 1: Assignment Dosen state ──────────────────────────────────────────
  const [kelasList, setKelasList] = useState<KelasWithAssignment[]>([]);
  const [filterDosen, setFilterDosen] = useState("all");
  const [filterMataKuliah, setFilterMataKuliah] = useState("all");
  const [filterTahunAjaran, setFilterTahunAjaran] = useState("all");
  const [searchKelas, setSearchKelas] = useState("");
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [kelasLoading, setKelasLoading] = useState(true);

  // ── Tab 2: Jadwal Praktikum state ──────────────────────────────────────────
  // State Management
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationData | null>(null);
  const [deleteOptions, setDeleteOptions] = useState({
    notifyDosen: true,
  });

  // Edit dialog states
  const [editJadwalDialogOpen, setEditJadwalDialogOpen] = useState(false);
  const [editJadwalData, setEditJadwalData] = useState<EditJadwalData | null>(
    null,
  );
  const [editJadwalLoading, setEditJadwalLoading] = useState(false);

  const [editAssignmentDialogOpen, setEditAssignmentDialogOpen] =
    useState(false);
  const [editAssignmentData, setEditAssignmentData] =
    useState<EditAssignmentData | null>(null);
  const [editAssignmentLoading, setEditAssignmentLoading] = useState(false);

  // Dropdown data (Tab 2 jadwal dialogs)
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [labList, setLabList] = useState<any[]>([]);
  const [kelasDropdownList, setKelasDropdownList] = useState<any[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalJadwal: 0,
    activeAssignments: 0,
    historyJadwal: 0,
    uniqueDosen: 0,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      // Build master assignment query
      // FIX: Add dosen_id to select and include dosen relation
      const query = supabase
        .from("jadwal_praktikum")
        .select(
          `
          id,
          dosen_id,
          kelas_id,
          mata_kuliah_id,
          kelas:kelas!inner(
            id,
            nama_kelas,
            kode_kelas,
            tahun_ajaran,
            semester_ajaran
          ),
          mata_kuliah:mata_kuliah_id (
            id,
            nama_mk,
            kode_mk,
            sks
          ),
          dosen:dosen_id (
            id,
            user:user_id (
              id,
              full_name,
              email
            )
          ),
          laboratorium:laboratorium_id (
            id,
            nama_lab,
            kode_lab
          )
        `,
        )
        .eq("is_active", true);

      // Apply filters
      let typedQuery: any = query;
      if (filters?.dosen_id) {
        typedQuery = typedQuery.eq("dosen_id", filters.dosen_id);
      }

      if (filters?.mata_kuliah_id) {
        typedQuery = typedQuery.eq("mata_kuliah_id", filters.mata_kuliah_id);
      }

      if (filters?.kelas_id) {
        typedQuery = typedQuery.eq("kelas_id", filters.kelas_id);
      }

      if (filters?.status && filters.status !== "all") {
        typedQuery = typedQuery.eq("status", filters.status);
      }

      if ((filters as any)?.tahun_ajaran) {
        typedQuery = typedQuery.eq(
          "kelas.tahun_ajaran",
          (filters as any).tahun_ajaran,
        );
      }

      if (filters?.semester) {
        typedQuery = typedQuery.eq(
          "kelas.semester_ajaran",
          parseInt(filters.semester as string, 10),
        );
      }

      // Apply search
      if (searchQuery) {
        typedQuery = typedQuery.or(`
          dosen.user.full_name.ilike.%${searchQuery}%,
          mata_kuliah.nama_mk.ilike.%${searchQuery}%,
          mata_kuliah.kode_mk.ilike.%${searchQuery}%,
          kelas.nama_kelas.ilike.%${searchQuery}%,
          kelas.kode_kelas.ilike.%${searchQuery}%
        `);
      }

      const { data: rawData, error } = await typedQuery;

      if (error) throw error;
      if (!rawData || rawData.length === 0) {
        setAssignments([]);
        setStats({
          totalAssignments: 0,
          totalJadwal: 0,
          activeAssignments: 0,
          historyJadwal: 0,
          uniqueDosen: 0,
        });
        return;
      }

      // Group by unique assignment (dosen + mata_kuliah + kelas)
      const assignmentMap = new Map<string, any>();

      rawData.forEach((item: any) => {
        if (
          !item.dosen_id ||
          !item.kelas_id ||
          !item.mata_kuliah_id ||
          !item.mata_kuliah
        ) {
          return;
        }

        const mataKuliahId = item.mata_kuliah_id;
        const key = `${item.dosen_id}-${mataKuliahId}-${item.kelas_id}`;

        if (!assignmentMap.has(key)) {
          assignmentMap.set(key, {
            dosen_id: item.dosen_id,
            mata_kuliah_id: mataKuliahId,
            kelas_id: item.kelas_id,
            total_jadwal: 0,
            tanggal_mulai: "",
            tanggal_selesai: "",
            dosen: {
              id: item.dosen?.id,
              full_name: item.dosen?.user?.full_name,
              email: item.dosen?.user?.email,
            },
            mata_kuliah: item.mata_kuliah,
            kelas: item.kelas,
            jadwalDetail: [],
          });
        }
      });

      // Get detailed schedules for each assignment
      const assignmentsWithSchedules = [];

      for (const [key, assignment] of assignmentMap) {
        const { data: jadwalData, error: jadwalError } = await (supabase as any)
          .from("jadwal_praktikum")
          .select(
            `
            id,
            tanggal_praktikum,
            hari,
            jam_mulai,
            jam_selesai,
            topik,
            status,
            mata_kuliah_id,
            laboratorium:laboratorium_id (
              id,
              nama_lab,
              kode_lab
            )
          `,
          )
          .eq("dosen_id", assignment.dosen_id)
          .eq("kelas_id", assignment.kelas_id)
          .eq("mata_kuliah_id", assignment.mata_kuliah_id)
          .eq("is_active", true)
          .order("tanggal_praktikum", { ascending: true });

        if (jadwalError) {
          console.warn(
            "Error fetching jadwal details for assignment:",
            key,
            jadwalError,
          );
          continue;
        }

        const jadwalDetail = jadwalData || [];
        const dates = jadwalDetail
          .map((j) => (j as any).tanggal_praktikum)
          .filter(Boolean);

        assignmentsWithSchedules.push({
          ...assignment,
          total_jadwal: jadwalDetail.length,
          tanggal_mulai: dates.length > 0 ? dates[0] : "",
          tanggal_selesai: dates.length > 0 ? dates[dates.length - 1] : "",
          jadwalDetail: jadwalDetail,
        });
      }

      setAssignments(assignmentsWithSchedules);

      // Calculate stats
      const totalJadwal =
        assignmentsWithSchedules?.reduce(
          (sum: number, assignment: AssignmentDetail) =>
            sum + (assignment.jadwalDetail?.length || 0),
          0,
        ) || 0;

      const uniqueDosenCount = new Set(
        assignmentsWithSchedules?.map((a: AssignmentDetail) => a.dosen_id),
      ).size;
      const historyJadwal =
        assignmentsWithSchedules?.reduce(
          (sum: number, assignment: AssignmentDetail) =>
            sum +
            (assignment.jadwalDetail?.filter((j: Jadwal) => isPastJadwal(j))
              .length || 0),
          0,
        ) || 0;

      setStats({
        totalAssignments: assignmentsWithSchedules?.length || 0,
        totalJadwal,
        activeAssignments:
          assignmentsWithSchedules?.filter((a: AssignmentDetail) =>
            a.jadwalDetail?.some((j: Jadwal) => j.status === "approved"),
          ).length || 0,
        historyJadwal,
        uniqueDosen: uniqueDosenCount,
      });
    } catch (error: any) {
      console.error("Error fetching monitoring references:", error);
      toast.error("Gagal memuat data monitoring praktikum", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [filters, searchQuery]);

  // ============================================================================
  // TAB 1: ASSIGNMENT DOSEN — DATA FETCHING
  // ============================================================================

  const loadKelasData = async () => {
    try {
      setKelasLoading(true);

      const [kelasResponse, dosenForTab1, mkForTab1, jadwalAssignmentResponse] =
        await Promise.all([
          supabase
            .from("kelas")
            .select(
              `
            *,
            mata_kuliah:mata_kuliah_id (
              id,
              nama_mk,
              kode_mk,
              sks
            ),
            dosen:dosen_id (
              id,
              nip,
              users:user_id (
                id,
                full_name,
                email
              )
            )
          `,
            )
            .eq("is_active", true)
            .order("tahun_ajaran", { ascending: false })
            .order("nama_kelas"),
          supabase
            .from("dosen")
            .select(
              `
            id,
            nip,
            users:user_id (
              id,
              full_name,
              email
            )
          `,
            )
            .order("users(full_name)"),
          supabase
            .from("mata_kuliah")
            .select("id, nama_mk, kode_mk, sks, is_active")
            .eq("is_active", true)
            .order("nama_mk"),
          (supabase as any)
            .from("jadwal_praktikum")
            .select(
              `
            id,
            kelas_id,
            dosen_id,
            mata_kuliah_id,
            created_at,
            updated_at,
            dosen:dosen_id (
              id,
              nip,
              users:user_id (
                id,
                full_name,
                email
              )
            ),
            mata_kuliah:mata_kuliah_id (
              id,
              nama_mk,
              kode_mk,
              sks
            )
          `,
            )
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (kelasResponse.error) throw kelasResponse.error;

      setKelasList(kelasResponse.data || []);

      // Also update shared dropdown lists for Tab 2 dialogs if they haven't loaded
      if (dosenForTab1.data && dosenList.length === 0) {
        setDosenList(dosenForTab1.data);
      }
      if (mkForTab1.data && mataKuliahList.length === 0) {
        setMataKuliahList(mkForTab1.data);
      }

      // Extract unique tahun ajaran
      const tahunAjarans = [
        ...new Set((kelasResponse.data || []).map((k: any) => k.tahun_ajaran)),
      ].sort((a: any, b: any) => b.localeCompare(a));
      setTahunAjaranList(tahunAjarans as string[]);
    } catch (error: any) {
      console.error("Error loading kelas data:", error);
      toast.error(error.message || "Gagal memuat data kelas");
    } finally {
      setKelasLoading(false);
    }
  };

  useEffect(() => {
    loadKelasData();
  }, []);

  const praktikumReferences = useMemo<PraktikumReferenceRow[]>(() => {
    return assignments.map((assignment) => ({
      key: `${assignment.kelas_id}-${assignment.mata_kuliah_id}-${assignment.dosen_id}`,
      kelas_id: assignment.kelas_id,
      kelas_nama: assignment.kelas.nama_kelas,
      kelas_kode: assignment.kelas.kode_kelas,
      tahun_ajaran: assignment.kelas.tahun_ajaran,
      semester_ajaran: assignment.kelas.semester_ajaran,
      dosen_id: assignment.dosen_id,
      dosen_nama: assignment.dosen.full_name,
      dosen_email: assignment.dosen.email,
      mata_kuliah_id: assignment.mata_kuliah_id,
      mata_kuliah_nama: assignment.mata_kuliah.nama_mk,
      mata_kuliah_kode: assignment.mata_kuliah.kode_mk,
      mata_kuliah_sks: assignment.mata_kuliah.sks,
      total_jadwal: assignment.total_jadwal,
      assignment,
    }));
  }, [assignments]);

  const filteredReferences = useMemo(() => {
    let filtered = [...praktikumReferences];

    if (filterDosen !== "all") {
      filtered = filtered.filter(
        (reference) => reference.dosen_id === filterDosen,
      );
    }
    if (filterMataKuliah !== "all") {
      filtered = filtered.filter(
        (reference) => reference.mata_kuliah_id === filterMataKuliah,
      );
    }
    if (filterTahunAjaran !== "all") {
      filtered = filtered.filter(
        (reference) => reference.tahun_ajaran === filterTahunAjaran,
      );
    }
    if (searchKelas) {
      const q = searchKelas.toLowerCase();
      filtered = filtered.filter(
        (reference) =>
          reference.kelas_nama.toLowerCase().includes(q) ||
          (reference.kelas_kode || "").toLowerCase().includes(q) ||
          reference.dosen_nama.toLowerCase().includes(q) ||
          reference.mata_kuliah_nama.toLowerCase().includes(q) ||
          reference.mata_kuliah_kode.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [
    praktikumReferences,
    filterDosen,
    filterMataKuliah,
    filterTahunAjaran,
    searchKelas,
  ]);

  const referenceStats = useMemo(() => {
    return {
      totalReferences: praktikumReferences.length,
      totalJadwal: praktikumReferences.reduce(
        (sum, reference) => sum + reference.total_jadwal,
        0,
      ),
      dosenAktif: new Set(praktikumReferences.map((r) => r.dosen_id)).size,
      mataKuliahAktif: new Set(praktikumReferences.map((r) => r.mata_kuliah_id))
        .size,
    };
  }, [praktikumReferences]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const toggleExpanded = (assignmentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(assignmentId)) {
      newExpanded.delete(assignmentId);
    } else {
      newExpanded.add(assignmentId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteAssignment = (assignment: AssignmentDetail) => {
    const totalJadwal = assignment.jadwalDetail?.length || 0;

    setDeleteConfirmation({
      assignment,
      totalJadwal,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!deleteConfirmation) return;

    try {
      // ✅ Check if offline
      if (!networkDetector.isOnline()) {
        toast.error("Tidak dapat menghapus assignment saat offline");
        return;
      }

      // ✅ Use user from useAuth hook (component level)
      if (!user) {
        throw new Error("Unauthorized - silakan login terlebih dahulu");
      }

      if (user.role !== "admin") {
        throw new Error("Forbidden - akses admin diperlukan");
      }

      const supabaseAny = supabase as any;

      const { dosen_id, kelas_id, mata_kuliah_id } =
        deleteConfirmation.assignment;

      const validOptions = {
        notifyDosen: Boolean(deleteOptions?.notifyDosen),
      };

      const { data: jadwalCandidates, error: countError } = await supabaseAny
        .from("jadwal_praktikum")
        .select(
          `
          id,
          tanggal_praktikum,
          topik,
          mata_kuliah_id
        `,
        )
        .eq("dosen_id", dosen_id)
        .eq("kelas_id", kelas_id)
        .eq("mata_kuliah_id", mata_kuliah_id);

      if (countError) throw countError;

      const jadwalToDelete = jadwalCandidates || [];

      const totalJadwal = jadwalToDelete?.length || 0;
      const hasPastJadwal = jadwalToDelete.some((jadwal: any) =>
        isPastJadwal(jadwal),
      );

      if (totalJadwal === 0) {
        throw new Error(
          "Jadwal untuk kombinasi kelas, mata kuliah, dan dosen ini tidak ditemukan",
        );
      }

      if (hasPastJadwal) {
        throw new Error(
          "Referensi praktikum ini sudah memiliki sesi yang lewat tanggal. Untuk menjaga riwayat tetap valid, referensi dan jadwalnya tidak bisa dihapus lagi.",
        );
      }

      const jadwalIdsToDelete = jadwalToDelete.map((jadwal: any) => jadwal.id);

      const [
        { count: kehadiranCount, error: kehadiranCheckError },
        { count: logbookCount, error: logbookCheckError },
        { count: materiCount, error: materiCheckError },
        { count: kuisCount, error: kuisCheckError },
        { count: nilaiCount, error: nilaiCheckError },
      ] = await Promise.all([
        supabaseAny
          .from("kehadiran")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("jadwal_id", jadwalIdsToDelete),
        supabaseAny
          .from("logbook_entries")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("jadwal_id", jadwalIdsToDelete),
        supabaseAny
          .from("materi")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", kelas_id)
          .eq("dosen_id", dosen_id),
        supabaseAny
          .from("kuis")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", kelas_id)
          .eq("dosen_id", dosen_id)
          .eq("mata_kuliah_id", mata_kuliah_id),
        supabaseAny
          .from("nilai")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", kelas_id)
          .eq("mata_kuliah_id", mata_kuliah_id),
      ]);

      if (kehadiranCheckError) throw kehadiranCheckError;
      if (logbookCheckError) throw logbookCheckError;
      if (materiCheckError) throw materiCheckError;
      if (kuisCheckError) throw kuisCheckError;
      if (nilaiCheckError) throw nilaiCheckError;

      const blockedDataLabels = [
        (kehadiranCount || 0) > 0 ? "presensi" : null,
        (logbookCount || 0) > 0 ? "logbook" : null,
        (materiCount || 0) > 0 ? "materi" : null,
        (kuisCount || 0) > 0 ? "kuis/tugas" : null,
        (nilaiCount || 0) > 0 ? "nilai" : null,
      ].filter(Boolean);

      if (blockedDataLabels.length > 0) {
        throw new Error(
          `Referensi praktikum tidak dapat dihapus karena sudah ada data ${blockedDataLabels.join(", ")}. Untuk menjaga riwayat akademik tetap valid, nonaktifkan atau koreksi detail jadwal saja, bukan menghapus referensinya.`,
        );
      }

      const jadwalArchiveBuilder = supabaseAny
        .from("jadwal_praktikum")
        .update?.({ is_active: false });

      const jadwalArchiveResult = jadwalArchiveBuilder
        ? await jadwalArchiveBuilder.in("id", jadwalIdsToDelete)
        : await supabaseAny
            .from("jadwal_praktikum")
            .delete()
            .in("id", jadwalIdsToDelete);

      if (jadwalArchiveResult?.error) throw jadwalArchiveResult.error;

      const kelasDeleted = false;

      // Check if there are other assignments for this dosen + mata_kuliah combination
      // FIX: Query jadwal with kelas join to find assignments with same mata_kuliah
      const { data: otherAssignments, error: otherAssignError } =
        await supabaseAny
          .from("jadwal_praktikum")
          .select(
            `
            id,
            kelas_id,
            mata_kuliah_id
          `,
          )
          .eq("dosen_id", dosen_id)
          .eq("is_active", true);

      if (otherAssignError) throw otherAssignError;

      const matchingAssignments = (otherAssignments || []).filter(
        (assignment: any) => assignment.mata_kuliah_id === mata_kuliah_id,
      );

      // Only delete dosen_mata_kuliah if no other assignments exist for this combination
      if (matchingAssignments.length === 0) {
        const { error: dmDeleteError } = await supabase
          .from("dosen_mata_kuliah")
          .delete()
          .eq("dosen_id", dosen_id)
          .eq("mata_kuliah_id", mata_kuliah_id);

        if (dmDeleteError) throw dmDeleteError;
      }

      if (validOptions.notifyDosen) {
        const [
          { data: dosenData, error: dosenError },
          { data: mkData, error: mkError },
          { data: kelasData, error: kError },
        ] = await Promise.all([
          supabaseAny
            .from("dosen")
            .select("user:user_id(id)")
            .eq("id", dosen_id)
            .single(),
          supabaseAny
            .from("mata_kuliah")
            .select("nama_mk")
            .eq("id", mata_kuliah_id)
            .single(),
          supabaseAny
            .from("kelas")
            .select("nama_kelas")
            .eq("id", kelas_id)
            .single(),
        ]);

        if (dosenError) throw dosenError;
        if (mkError) throw mkError;
        if (kError) throw kError;

        const dosenUserId = dosenData?.user?.id;
        if (dosenUserId) {
          const { error: notifError } = await supabaseAny
            .from("notifications")
            .insert({
              user_id: dosenUserId,
              title: "Referensi Praktikum Diarsipkan",
              message: `Assignment untuk mata kuliah ${mkData?.nama_mk} di kelas ${kelasData?.nama_kelas} telah diarsipkan oleh admin.`,
              type: "assignment_archived",
              data: {
                dosen_id,
                mata_kuliah_id,
                kelas_id,
                deleted_jadwal_count: totalJadwal,
                kelas_deleted: false,
              },
            });

          if (notifError) throw notifError;
        }
      }

      const { data: mahasiswaNotifList } = await supabaseAny
        .from("kelas_mahasiswa")
        .select(
          "mahasiswa_id, mahasiswa:mahasiswa_id(user:user_id(id, full_name, email))",
        )
        .eq("kelas_id", kelas_id)
        .eq("is_active", true);

      if (mahasiswaNotifList && mahasiswaNotifList.length > 0) {
        const uniqueMahasiswaNotifications = Array.from(
          new Map(
            (mahasiswaNotifList || [])
              .filter((m: any) => m.mahasiswa?.user?.id)
              .map((m: any) => [m.mahasiswa.user.id, m]),
          ).values(),
        )
          .filter((m: any) => m.mahasiswa?.user?.id)
          .map((m: any) => ({
            user_id: m.mahasiswa.user.id,
            title: "Referensi Praktikum Diarsipkan",
            message: `Admin mengarsipkan referensi praktikum ${deleteConfirmation.assignment.mata_kuliah.nama_mk} - ${deleteConfirmation.assignment.kelas.nama_kelas}. Jadwal yang belum berjalan untuk referensi ini tidak lagi berlaku.`,
            type: "jadwal_updated",
            data: {
              dosen_id,
              mata_kuliah_id,
              kelas_id,
              deleted_jadwal_count: totalJadwal,
            },
          }));

        if (uniqueMahasiswaNotifications.length > 0) {
          const { error: mahasiswaNotifError } = await supabaseAny
            .from("notifications")
            .insert(uniqueMahasiswaNotifications);

          if (mahasiswaNotifError) {
            console.warn(
              "Failed to send praktikum deletion notifications to mahasiswa:",
              mahasiswaNotifError,
            );
          }
        }
      }

      const auditUserAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

      const { error: auditError } = await supabaseAny
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "ARCHIVE_ASSIGNMENT_CASCADE",
          table_name: "jadwal_praktikum",
          record_id: `${dosen_id}-${mata_kuliah_id}-${kelas_id}`,
          old_data: {
            dosen_id,
            mata_kuliah_id,
            kelas_id,
            options: validOptions,
          },
          new_data: {
            deleted_jadwal_count: totalJadwal,
            kelas_deleted: false,
            jadwal_details: jadwalToDelete,
          },
          ip_address: "unknown",
          user_agent: auditUserAgent,
        });

      if (auditError) {
        console.warn("Failed to write audit log:", auditError);
      }

      toast.success("Assignment berhasil diarsipkan", {
        description: `${deleteConfirmation.totalJadwal} jadwal praktikum dinonaktifkan`,
      });

      setDeleteDialogOpen(false);
      setDeleteConfirmation(null);
      fetchAssignments();
    } catch (error: any) {
      console.error("Error deleting academic reference:", error);
      toast.error("Gagal menghapus referensi praktikum", {
        description: error.message,
      });
    }
  };

  // ============================================================================
  // EDIT HANDLERS
  // ============================================================================

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      const supabaseAny = supabase as any;

      const [dosenResult, labResult, kelasResult, mataKuliahResult] =
        await Promise.all([
          supabaseAny
            .from("dosen")
            .select("id, user:user_id(id, full_name, email)")
            .order("user(full_name)"),
          supabaseAny
            .from("laboratorium")
            .select("id, nama_lab, kode_lab")
            .order("nama_lab"),
          supabaseAny
            .from("kelas")
            .select("id, kode_kelas, nama_kelas, mata_kuliah_id")
            .order("nama_kelas"),
          supabaseAny
            .from("mata_kuliah")
            .select("id, kode_mk, nama_mk")
            .order("nama_mk"),
        ]);

      if (dosenResult.error) {
        console.error("❌ Error fetching dosen dropdown:", dosenResult.error);
        toast.error("Gagal memuat data dosen", {
          description: dosenResult.error.message || "RLS policy error",
        });
      }

      if (labResult.error) {
        console.error("❌ Error fetching lab dropdown:", labResult.error);
      }

      if (kelasResult.error) {
        console.error("❌ Error fetching kelas dropdown:", kelasResult.error);
        toast.error("Gagal memuat data kelas", {
          description: kelasResult.error.message || "RLS policy error",
        });
      }

      if (mataKuliahResult.error) {
        console.error(
          "❌ Error fetching mata kuliah dropdown:",
          mataKuliahResult.error,
        );
        toast.error("Gagal memuat data mata kuliah", {
          description: mataKuliahResult.error.message || "RLS policy error",
        });
      }

      if (dosenResult.data) {
        setDosenList(
          dosenResult.data.filter(
            (dosen: any) =>
              Boolean(dosen?.id) && Boolean(getDosenDisplayName(dosen)),
          ),
        );
      }
      if (labResult.data) setLabList(labResult.data);
      if (kelasResult.data) setKelasDropdownList(kelasResult.data);
      if (mataKuliahResult.data) setMataKuliahList(mataKuliahResult.data);
    };

    fetchDropdownData();
  }, []);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const isPastJadwal = (
    jadwal?: { tanggal_praktikum?: string | null } | null,
  ) =>
    Boolean(jadwal?.tanggal_praktikum) &&
    (jadwal?.tanggal_praktikum || "") < todayDate;

  // Edit Jadwal Handler
  const handleEditJadwal = (jadwal: Jadwal) => {
    if (isPastJadwal(jadwal)) {
      toast.error("Praktikum yang sudah lewat tidak bisa dikoreksi lagi", {
        description: "Sesi ini sudah menjadi riwayat tetap.",
      });
      return;
    }

    setEditJadwalData({
      id: jadwal.id,
      tanggal_praktikum: jadwal.tanggal_praktikum,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      laboratorium_id: jadwal.laboratorium.id,
      topik: jadwal.topik || "",
    });
    setEditJadwalDialogOpen(true);
  };

  const confirmEditJadwal = async () => {
    if (!editJadwalData || !user) return;

    try {
      setEditJadwalLoading(true);

      // Check offline
      if (!networkDetector.isOnline()) {
        toast.error("Tidak dapat mengedit jadwal saat offline");
        return;
      }

      if (user.role !== "admin") {
        throw new Error("Forbidden - akses admin diperlukan");
      }

      if (editJadwalData.tanggal_praktikum < todayDate) {
        throw new Error(
          "Tanggal praktikum tidak boleh diatur ke tanggal yang sudah lewat.",
        );
      }

      if (editJadwalData.jam_selesai <= editJadwalData.jam_mulai) {
        throw new Error("Jam selesai harus setelah jam mulai.");
      }

      const supabaseAny = supabase as any;

      // Get current jadwal data before update
      const { data: currentJadwal, error: fetchError } = await supabaseAny
        .from("jadwal_praktikum")
        .select(
          `
          *,
          kelas:kelas_id (
            id,
            nama_kelas
          ),
          mata_kuliah:mata_kuliah_id (
            id,
            nama_mk,
            kode_mk,
            sks
          ),
          dosen:dosen_id (
            id,
            user:user_id (full_name, email)
          ),
          laboratorium:laboratorium_id (nama_lab)
        `,
        )
        .eq("id", editJadwalData.id)
        .single();

      if (fetchError) throw fetchError;

      if (isPastJadwal(currentJadwal)) {
        throw new Error(
          "Praktikum yang sudah lewat tidak bisa dikoreksi lagi karena sudah menjadi riwayat tetap.",
        );
      }

      // Update jadwal
      const { error: updateError } = await supabaseAny
        .from("jadwal_praktikum")
        .update({
          tanggal_praktikum: editJadwalData.tanggal_praktikum,
          jam_mulai: editJadwalData.jam_mulai,
          jam_selesai: editJadwalData.jam_selesai,
          laboratorium_id: editJadwalData.laboratorium_id,
          topik: editJadwalData.topik,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editJadwalData.id);

      if (updateError) throw updateError;

      // Get all mahasiswa in this kelas
      const { data: mahasiswaList } = await supabaseAny
        .from("kelas_mahasiswa")
        .select(
          "mahasiswa_id, mahasiswa:mahasiswa_id(user:user_id(id, full_name, email))",
        )
        .eq("kelas_id", currentJadwal.kelas.id)
        .eq("is_active", true);

      // Send notification to dosen using users.id, because notification center
      // fetches rows by authenticated user id instead of dosen profile id.
      const dosenUserId = currentJadwal.dosen?.user?.id;
      const mataKuliahNama =
        currentJadwal.mata_kuliah?.nama_mk || "mata kuliah praktikum";
      if (dosenUserId) {
        const { error: dosenNotifError } = await supabaseAny
          .from("notifications")
          .insert({
            user_id: dosenUserId,
            title: "Jadwal Praktikum Diupdate",
            message: `Jadwal praktikum ${mataKuliahNama} - ${currentJadwal.kelas.nama_kelas} telah diupdate oleh admin.`,
            type: "jadwal_updated",
            data: {
              jadwal_id: editJadwalData.id,
              tanggal_baru: editJadwalData.tanggal_praktikum,
              jam_baru: `${editJadwalData.jam_mulai} - ${editJadwalData.jam_selesai}`,
            },
          });

        if (dosenNotifError) {
          console.warn(
            "Failed to send jadwal update notification to dosen:",
            dosenNotifError,
          );
        }
      }

      // Send notifications to all mahasiswa
      if (mahasiswaList && mahasiswaList.length > 0) {
        const notifications = mahasiswaList.map((m: any) => ({
          user_id: m.mahasiswa.user.id,
          title: "Jadwal Praktikum Diupdate",
          message: `Jadwal praktikum ${mataKuliahNama} - ${currentJadwal.kelas.nama_kelas} telah diupdate oleh admin.`,
          type: "jadwal_updated",
          data: {
            jadwal_id: editJadwalData.id,
            tanggal_baru: editJadwalData.tanggal_praktikum,
            jam_baru: `${editJadwalData.jam_mulai} - ${editJadwalData.jam_selesai}`,
          },
        }));

        const { error: mahasiswaNotifError } = await supabaseAny
          .from("notifications")
          .insert(notifications);

        if (mahasiswaNotifError) {
          console.warn(
            "Failed to send jadwal update notifications to mahasiswa:",
            mahasiswaNotifError,
          );
        }
      }

      // Audit log
      const auditUserAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
      await supabaseAny.from("audit_logs").insert({
        user_id: user.id,
        action: "UPDATE_JADWAL",
        table_name: "jadwal_praktikum",
        record_id: editJadwalData.id,
        old_data: {
          tanggal_praktikum: currentJadwal.tanggal_praktikum,
          jam_mulai: currentJadwal.jam_mulai,
          jam_selesai: currentJadwal.jam_selesai,
          laboratorium_id: currentJadwal.laboratorium_id,
          topik: currentJadwal.topik,
        },
        new_data: editJadwalData,
        ip_address: "unknown",
        user_agent: auditUserAgent,
      });

      toast.success("Jadwal berhasil diupdate", {
        description: `Notifikasi telah dikirim ke dosen dan ${mahasiswaList?.length || 0} mahasiswa`,
      });

      setEditJadwalDialogOpen(false);
      setEditJadwalData(null);
      fetchAssignments();
    } catch (error: any) {
      console.error("Error editing jadwal:", error);
      toast.error("Gagal mengupdate jadwal", {
        description: error.message,
      });
    } finally {
      setEditJadwalLoading(false);
    }
  };

  // Edit Assignment Handler (Ganti Dosen)
  const handleEditAssignment = (assignment: AssignmentDetail) => {
    const hasPastJadwal = assignment.jadwalDetail?.some((jadwal) =>
      isPastJadwal(jadwal),
    );

    if (hasPastJadwal) {
      toast.error(
        "Referensi dengan sesi yang sudah lewat tidak bisa dikoreksi",
        {
          description:
            "Riwayat praktikum yang sudah lewat tanggal tetap dikunci untuk menjaga konsistensi data.",
        },
      );
      return;
    }

    setEditAssignmentData({
      dosen_id: assignment.dosen_id,
      old_dosen_id: assignment.dosen_id,
      kelas_id: assignment.kelas_id,
      old_kelas_id: assignment.kelas_id,
      mata_kuliah_id: assignment.mata_kuliah_id,
      old_mata_kuliah_id: assignment.mata_kuliah_id,
    });
    setEditAssignmentDialogOpen(true);
  };

  const confirmEditAssignment = async () => {
    if (!editAssignmentData || !user) return;

    try {
      setEditAssignmentLoading(true);

      // Check offline
      if (!networkDetector.isOnline()) {
        toast.error("Tidak dapat mengedit assignment saat offline");
        return;
      }

      if (user.role !== "admin") {
        throw new Error("Forbidden - akses admin diperlukan");
      }

      const supabaseAny = supabase as any;

      const dosenChanged =
        editAssignmentData.dosen_id !== editAssignmentData.old_dosen_id;
      const kelasChanged =
        editAssignmentData.kelas_id !== editAssignmentData.old_kelas_id;
      const mataKuliahChanged =
        editAssignmentData.mata_kuliah_id !==
        editAssignmentData.old_mata_kuliah_id;

      if (!dosenChanged && !kelasChanged && !mataKuliahChanged) {
        toast.info("Tidak ada perubahan");
        return;
      }

      const { data: oldDosen } = await supabaseAny
        .from("dosen")
        .select("id, user:user_id(id, full_name, email)")
        .eq("id", editAssignmentData.old_dosen_id)
        .single();

      const { data: newDosen } = await supabaseAny
        .from("dosen")
        .select("id, user:user_id(id, full_name, email)")
        .eq("id", editAssignmentData.dosen_id)
        .single();

      const { data: oldKelasInfo } = await supabaseAny
        .from("kelas")
        .select("id, nama_kelas, kode_kelas")
        .eq("id", editAssignmentData.old_kelas_id)
        .single();

      const { data: newKelasInfo } = await supabaseAny
        .from("kelas")
        .select("id, nama_kelas, kode_kelas")
        .eq("id", editAssignmentData.kelas_id)
        .single();

      const { data: oldMataKuliahInfo } = await supabaseAny
        .from("mata_kuliah")
        .select("id, nama_mk, kode_mk")
        .eq("id", editAssignmentData.old_mata_kuliah_id)
        .single();

      const { data: newMataKuliahInfo } = await supabaseAny
        .from("mata_kuliah")
        .select("id, nama_mk, kode_mk")
        .eq("id", editAssignmentData.mata_kuliah_id)
        .single();

      const { data: jadwalCandidates, error: jadwalFetchError } =
        await supabaseAny
          .from("jadwal_praktikum")
          .select(
            `
            id,
            tanggal_praktikum,
            mata_kuliah_id,
            kelas:kelas_id!inner (
              mata_kuliah_id
            )
          `,
          )
          .eq("dosen_id", editAssignmentData.old_dosen_id)
          .eq("kelas_id", editAssignmentData.old_kelas_id)
          .eq("is_active", true);

      if (jadwalFetchError) throw jadwalFetchError;

      const jadwalIdsToUpdate = (jadwalCandidates || [])
        .filter(
          (jadwal: any) =>
            jadwal.mata_kuliah_id === editAssignmentData.old_mata_kuliah_id,
        )
        .map((jadwal: any) => jadwal.id);

      const hasPastJadwal = (jadwalCandidates || []).some(
        (jadwal: any) =>
          jadwal.mata_kuliah_id === editAssignmentData.old_mata_kuliah_id &&
          isPastJadwal(jadwal),
      );

      if (jadwalIdsToUpdate.length === 0) {
        throw new Error(
          "Jadwal referensi praktikum yang dipilih tidak ditemukan untuk diperbarui",
        );
      }

      if (hasPastJadwal) {
        throw new Error(
          "Referensi praktikum ini sudah memiliki sesi yang lewat tanggal. Untuk menjaga riwayat tetap valid, kelas, mata kuliah, atau dosen pengampu tidak bisa diubah lagi.",
        );
      }

      const [
        { count: kehadiranCount, error: kehadiranCheckError },
        { count: logbookCount, error: logbookCheckError },
        { count: materiCount, error: materiCheckError },
        { count: kuisCount, error: kuisCheckError },
        { count: nilaiCount, error: nilaiCheckError },
      ] = await Promise.all([
        supabaseAny
          .from("kehadiran")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("jadwal_id", jadwalIdsToUpdate),
        supabaseAny
          .from("logbook_entries")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("jadwal_id", jadwalIdsToUpdate),
        supabaseAny
          .from("materi")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", editAssignmentData.old_kelas_id)
          .eq("dosen_id", editAssignmentData.old_dosen_id),
        supabaseAny
          .from("kuis")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", editAssignmentData.old_kelas_id)
          .eq("dosen_id", editAssignmentData.old_dosen_id)
          .eq("mata_kuliah_id", editAssignmentData.old_mata_kuliah_id),
        supabaseAny
          .from("nilai")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("kelas_id", editAssignmentData.old_kelas_id)
          .eq("mata_kuliah_id", editAssignmentData.old_mata_kuliah_id),
      ]);

      if (kehadiranCheckError) throw kehadiranCheckError;
      if (logbookCheckError) throw logbookCheckError;
      if (materiCheckError) throw materiCheckError;
      if (kuisCheckError) throw kuisCheckError;
      if (nilaiCheckError) throw nilaiCheckError;

      const blockedDataLabels = [
        (kehadiranCount || 0) > 0 ? "presensi" : null,
        (logbookCount || 0) > 0 ? "logbook" : null,
        (materiCount || 0) > 0 ? "materi" : null,
        (kuisCount || 0) > 0 ? "kuis/tugas" : null,
        (nilaiCount || 0) > 0 ? "nilai" : null,
      ].filter(Boolean);

      if (blockedDataLabels.length > 0) {
        throw new Error(
          `Referensi praktikum tidak dapat dikoreksi karena sudah ada data ${blockedDataLabels.join(", ")}. Untuk menjaga riwayat akademik tetap valid, ubah hanya detail jadwal (tanggal, jam, lab, topik) atau buat referensi praktikum baru.`,
        );
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (dosenChanged) {
        updateData.dosen_id = editAssignmentData.dosen_id;
      }
      if (kelasChanged) {
        updateData.kelas_id = editAssignmentData.kelas_id;
      }
      if (mataKuliahChanged) {
        updateData.mata_kuliah_id = editAssignmentData.mata_kuliah_id;
      }

      const { error: updateError } = await supabaseAny
        .from("jadwal_praktikum")
        .update(updateData)
        .in("id", jadwalIdsToUpdate);

      if (updateError) throw updateError;

      const kelasNotifIds = Array.from(
        new Set(
          [editAssignmentData.old_kelas_id, editAssignmentData.kelas_id].filter(
            Boolean,
          ),
        ),
      );

      const { data: mahasiswaList } = await supabaseAny
        .from("kelas_mahasiswa")
        .select(
          "mahasiswa_id, mahasiswa:mahasiswa_id(user:user_id(id, full_name, email))",
        )
        .in("kelas_id", kelasNotifIds)
        .eq("is_active", true);

      const perubahanLabels = [
        dosenChanged ? "dosen pengampu" : null,
        kelasChanged ? "kelas" : null,
        mataKuliahChanged ? "mata kuliah" : null,
      ].filter(Boolean);

      if (dosenChanged && oldDosen?.user?.id) {
        const { error: oldDosenNotifError } = await supabaseAny
          .from("notifications")
          .insert({
            user_id: oldDosen.user.id,
            title: "Referensi Praktikum Dikoreksi",
            message: `Referensi praktikum ${oldMataKuliahInfo?.nama_mk || "-"} - ${oldKelasInfo?.nama_kelas || "-"} tidak lagi ditugaskan kepada Anda.`,
            type: "assignment_reassigned",
            data: {
              old_kelas_id: editAssignmentData.old_kelas_id,
              new_kelas_id: editAssignmentData.kelas_id,
              old_mata_kuliah_id: editAssignmentData.old_mata_kuliah_id,
              new_mata_kuliah_id: editAssignmentData.mata_kuliah_id,
              old_dosen_id: editAssignmentData.old_dosen_id,
              new_dosen_id: editAssignmentData.dosen_id,
            },
          });

        if (oldDosenNotifError) {
          console.warn(
            "Failed to send reassignment notification to old dosen:",
            oldDosenNotifError,
          );
        }
      }

      if (newDosen?.user?.id) {
        const dosenNotificationMessage = dosenChanged
          ? `Anda ditetapkan pada praktikum ${newMataKuliahInfo?.nama_mk || "-"} - ${newKelasInfo?.nama_kelas || "-"} setelah koreksi admin.`
          : `Admin memperbarui ${perubahanLabels.join(", ")} pada praktikum ${newMataKuliahInfo?.nama_mk || "-"} - ${newKelasInfo?.nama_kelas || "-"}.`;

        const { error: newDosenNotifError } = await supabaseAny
          .from("notifications")
          .insert({
            user_id: newDosen.user.id,
            title: "Referensi Praktikum Dikoreksi",
            message: dosenNotificationMessage,
            type: dosenChanged ? "assignment_added" : "jadwal_updated",
            data: {
              old_kelas_id: editAssignmentData.old_kelas_id,
              new_kelas_id: editAssignmentData.kelas_id,
              old_mata_kuliah_id: editAssignmentData.old_mata_kuliah_id,
              new_mata_kuliah_id: editAssignmentData.mata_kuliah_id,
              old_dosen_id: editAssignmentData.old_dosen_id,
              new_dosen_id: editAssignmentData.dosen_id,
            },
          });

        if (newDosenNotifError) {
          console.warn(
            "Failed to send praktikum reference notification to new/current dosen:",
            newDosenNotifError,
          );
        }
      }

      if (mahasiswaList && mahasiswaList.length > 0) {
        const mahasiswaChangeSummary = [
          dosenChanged
            ? `dosen: ${oldDosen?.user?.full_name || "-"} -> ${newDosen?.user?.full_name || "-"}`
            : null,
          kelasChanged
            ? `kelas: ${oldKelasInfo?.nama_kelas || "-"} -> ${newKelasInfo?.nama_kelas || "-"}`
            : null,
          mataKuliahChanged
            ? `mata kuliah: ${oldMataKuliahInfo?.nama_mk || "-"} -> ${newMataKuliahInfo?.nama_mk || "-"}`
            : null,
        ]
          .filter(Boolean)
          .join("; ");

        const notifications = Array.from(
          new Map(
            (mahasiswaList || [])
              .filter((m: any) => m.mahasiswa?.user?.id)
              .map((m: any) => [m.mahasiswa.user.id, m]),
          ).values(),
        )
          .filter((m: any) => m.mahasiswa?.user?.id)
          .map((m: any) => ({
            user_id: m.mahasiswa.user.id,
            title: "Referensi Praktikum Diperbarui",
            message: mahasiswaChangeSummary
              ? `Admin mengoreksi referensi praktikum. Perubahan: ${mahasiswaChangeSummary}.`
              : `Admin memperbarui referensi praktikum ${newMataKuliahInfo?.nama_mk || "-"} - ${newKelasInfo?.nama_kelas || "-"}.`,
            type: "jadwal_updated",
            data: {
              old_kelas_id: editAssignmentData.old_kelas_id,
              new_kelas_id: editAssignmentData.kelas_id,
              old_mata_kuliah_id: editAssignmentData.old_mata_kuliah_id,
              new_mata_kuliah_id: editAssignmentData.mata_kuliah_id,
              old_dosen_id: editAssignmentData.old_dosen_id,
              new_dosen_id: editAssignmentData.dosen_id,
            },
          }));

        if (notifications.length > 0) {
          const { error: mahasiswaNotifError } = await supabaseAny
            .from("notifications")
            .insert(notifications);

          if (mahasiswaNotifError) {
            console.warn(
              "Failed to send praktikum reference notifications to mahasiswa:",
              mahasiswaNotifError,
            );
          }
        }
      }

      const auditUserAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
      await supabaseAny.from("audit_logs").insert({
        user_id: user.id,
        action: "UPDATE_PRAKTIKUM_REFERENCE",
        table_name: "jadwal_praktikum",
        record_id: `${editAssignmentData.old_kelas_id}-${editAssignmentData.old_mata_kuliah_id}-${editAssignmentData.old_dosen_id}`,
        old_data: {
          kelas_id: editAssignmentData.old_kelas_id,
          kelas_name: oldKelasInfo?.nama_kelas || "-",
          mata_kuliah_id: editAssignmentData.old_mata_kuliah_id,
          mata_kuliah_name: oldMataKuliahInfo?.nama_mk || "-",
          dosen_id: editAssignmentData.old_dosen_id,
          dosen_name: oldDosen?.user?.full_name || "-",
        },
        new_data: {
          kelas_id: editAssignmentData.kelas_id,
          kelas_name: newKelasInfo?.nama_kelas || "-",
          mata_kuliah_id: editAssignmentData.mata_kuliah_id,
          mata_kuliah_name: newMataKuliahInfo?.nama_mk || "-",
          dosen_id: editAssignmentData.dosen_id,
          dosen_name: newDosen?.user?.full_name || "-",
        },
        ip_address: "unknown",
        user_agent: auditUserAgent,
      });

      toast.success("Referensi praktikum berhasil diperbarui", {
        description: `${perubahanLabels.join(", ")} berhasil dikoreksi. Notifikasi dikirim ke pihak terkait.`,
      });

      setEditAssignmentDialogOpen(false);
      setEditAssignmentData(null);
      await loadKelasData();
      fetchAssignments();
    } catch (error: any) {
      console.error("Error editing academic reference:", error);
      toast.error("Gagal mengupdate referensi akademik", {
        description: error.message,
      });
    } finally {
      setEditAssignmentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "info" | "success" | "error" | "offline"> =
      {
        pending: "info",
        approved: "success",
        rejected: "error",
        cancelled: "error",
        scheduled: "info",
        completed: "success",
      };

    const statusLabelMap: Record<string, string> = {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      cancelled: "Cancelled",
      scheduled: "Scheduled",
      completed: "Completed",
    };

    return (
      <StatusBadge status={statusMap[status] || "offline"} pulse={false}>
        {statusLabelMap[status] || status}
      </StatusBadge>
    );
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;

    const query = searchQuery.toLowerCase();
    return assignments.filter(
      (assignment) =>
        assignment.dosen.full_name.toLowerCase().includes(query) ||
        assignment.mata_kuliah.nama_mk.toLowerCase().includes(query) ||
        assignment.kelas.nama_kelas.toLowerCase().includes(query) ||
        assignment.mata_kuliah.kode_mk.toLowerCase().includes(query),
    );
  }, [assignments, searchQuery]);

  const dosenSummaryView = useMemo(() => {
    const map = new Map<
      string,
      {
        dosen_id: string;
        nama: string;
        email: string;
        kelasList: Array<{
          id: string;
          nama_kelas: string;
          kode_kelas: string;
          mata_kuliah_id?: string;
          nama_mk: string;
          kode_mk: string;
          sks: number;
          tahun_ajaran: string;
          semester_ajaran: number;
        }>;
        mataKuliahSet: Set<string>;
        totalJadwal: number;
        jadwalScheduled: number;
        jadwalCompleted: number;
      }
    >();

    const ensureEntry = (dosenId: string, nama?: string, email?: string) => {
      if (!map.has(dosenId)) {
        map.set(dosenId, {
          dosen_id: dosenId,
          nama: nama || "Dosen",
          email: email || "-",
          kelasList: [],
          mataKuliahSet: new Set(),
          totalJadwal: 0,
          jadwalScheduled: 0,
          jadwalCompleted: 0,
        });
      }

      return map.get(dosenId)!;
    };

    const ringkasanKeys = new Set<string>();

    assignments.forEach((a) => {
      const entry = ensureEntry(a.dosen_id, a.dosen.full_name, a.dosen.email);
      const referenceKey = `${a.dosen_id}-${a.kelas_id}-${a.mata_kuliah_id}`;

      if (!ringkasanKeys.has(referenceKey)) {
        entry.kelasList.push({
          id: referenceKey,
          nama_kelas: a.kelas.nama_kelas,
          kode_kelas: a.kelas.kode_kelas,
          mata_kuliah_id: a.mata_kuliah?.id || a.mata_kuliah_id || undefined,
          nama_mk: a.mata_kuliah?.nama_mk || "-",
          kode_mk: a.mata_kuliah?.kode_mk || "-",
          sks: a.mata_kuliah?.sks || 0,
          tahun_ajaran: (a.kelas as any).tahun_ajaran || "-",
          semester_ajaran: (a.kelas as any).semester_ajaran || 0,
        });
        ringkasanKeys.add(referenceKey);
      }

      entry.totalJadwal += a.jadwalDetail?.length || 0;
      a.jadwalDetail?.forEach((j) => {
        if (j.status === "pending") entry.jadwalScheduled++;
        if (j.status === "approved") entry.jadwalCompleted++;
      });
    });

    map.forEach((entry) => {
      entry.kelasList.forEach((kelasItem) => {
        if (kelasItem.mata_kuliah_id) {
          entry.mataKuliahSet.add(kelasItem.mata_kuliah_id);
        }
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [assignments]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data monitoring praktikum...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Monitoring Praktikum & Referensi Akademik"
        description="Pantau data praktikum yang dibuat dosen dan lakukan koreksi admin bila ada salah pengampu atau mata kuliah"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referensi
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Referensi akademik</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jadwal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJadwal}</div>
            <p className="text-xs text-muted-foreground">
              Detail jadwal praktikum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jadwal Disetujui
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Jadwal disetujui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riwayat Tetap</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.historyJadwal}</div>
            <p className="text-xs text-muted-foreground">
              Praktikum yang sudah lewat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dosen Terlibat
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDosen}</div>
            <p className="text-xs text-muted-foreground">
              Pengampu pada jadwal aktif
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jadwal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Referensi Akademik
          </TabsTrigger>
          <TabsTrigger value="jadwal" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Jadwal Praktikum
          </TabsTrigger>
          <TabsTrigger value="ringkasan" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ringkasan Pengampu
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: ASSIGNMENT DOSEN                                          */}
        {/* ================================================================ */}
        <TabsContent value="assignment" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Dosen tetap membuat kelas dan praktikum. Tab ini membantu admin
              memantau referensi per kelas dan mengoreksi bila dosen salah
              memilih dosen pengampu atau mata kuliah.
            </AlertDescription>
          </Alert>

          {/* Tab 1 Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Relasi"
              value={referenceStats.totalReferences}
              description="Relasi praktikum aktif"
              icon={Users}
              color="primary"
            />
            <DashboardCard
              title="Dosen Aktif"
              value={referenceStats.dosenAktif}
              description={`${dosenList.length} dosen tersedia di master`}
              icon={BookOpen}
              color="info"
            />
            <DashboardCard
              title="Mata Kuliah"
              value={referenceStats.mataKuliahAktif}
              description="Mata kuliah yang sedang dipakai"
              icon={Calendar}
              color="success"
            />
            <DashboardCard
              title="Total Jadwal"
              value={referenceStats.totalJadwal}
              description="Jadwal pada relasi aktif"
              icon={CheckCircle}
              color="accent"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter Referensi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kelas, dosen, atau mata kuliah..."
                    value={searchKelas}
                    onChange={(e) => setSearchKelas(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDosen} onValueChange={setFilterDosen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Dosen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dosen</SelectItem>
                    {dosenList.map((dosen: any) => (
                      <SelectItem key={dosen.id} value={dosen.id}>
                        {dosen.users?.full_name ||
                          dosen.user?.full_name ||
                          dosen.nip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterMataKuliah}
                  onValueChange={setFilterMataKuliah}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Mata Kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                    {mataKuliahList.map((mk: any) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.nama_mk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterTahunAjaran}
                  onValueChange={setFilterTahunAjaran}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                    {tahunAjaranList.map((ta) => (
                      <SelectItem key={ta} value={ta}>
                        {ta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Referensi Praktikum Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                Daftar Referensi Praktikum ({filteredReferences.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void Promise.all([loadKelasData(), fetchAssignments()]);
                }}
                disabled={kelasLoading || loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${kelasLoading || loading ? "animate-spin" : ""}`}
                />
                Muat Ulang
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {kelasLoading || loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Memuat referensi praktikum...</span>
                </div>
              ) : filteredReferences.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">
                    Tidak ada referensi praktikum ditemukan
                  </p>
                  <p className="text-sm">
                    Coba ubah filter atau kata kunci pencarian
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dosen</TableHead>
                      <TableHead>Tahun Ajaran</TableHead>
                      <TableHead>Jadwal Terkait</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferences.map((reference) => (
                      <TableRow key={reference.key}>
                        <TableCell>
                          <div className="font-medium">
                            {reference.kelas_nama}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reference.kelas_kode}
                          </div>
                        </TableCell>
                        <TableCell>
                          {reference.mata_kuliah_nama ? (
                            <div>
                              <div className="font-medium">
                                {reference.mata_kuliah_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {reference.mata_kuliah_kode}
                                {typeof reference.mata_kuliah_sks === "number"
                                  ? ` · ${reference.mata_kuliah_sks} SKS`
                                  : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {reference.dosen_nama ? (
                            <div>
                              <div className="font-medium">
                                {reference.dosen_nama}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {reference.dosen_email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {reference.tahun_ajaran}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Sem {reference.semester_ajaran}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {reference.total_jadwal} jadwal
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleEditAssignment(reference.assignment)
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Koreksi Relasi
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteAssignment(reference.assignment)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
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

        {/* ================================================================ */}
        {/* TAB 2: JADWAL PRAKTIKUM                                          */}
        {/* ================================================================ */}
        <TabsContent value="jadwal" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Admin memantau praktikum yang dibuat dosen. Gunakan koreksi
              referensi untuk mengubah kelas, mata kuliah, atau dosen, dan
              gunakan koreksi jadwal untuk mengubah waktu, lab, atau topik.
              Praktikum yang sudah lewat otomatis menjadi riwayat tetap dan
              tidak bisa dikoreksi lagi.
            </AlertDescription>
          </Alert>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari praktikum berdasarkan dosen, mata kuliah, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value || undefined,
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={fetchAssignments}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Muat Ulang
              </Button>
            </div>
          </div>

          {/* Assignment List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Memuat data jadwal...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">
                        Tidak ada data jadwal praktikum ditemukan
                      </p>
                      <p className="text-sm">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredAssignments.map((assignment) => (
                  <Card
                    key={`${assignment.dosen_id}-${assignment.mata_kuliah_id}-${assignment.kelas_id}`}
                  >
                    <CardHeader>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="font-semibold">
                              {assignment.dosen.full_name}
                            </span>
                            <Badge variant="outline" className="max-w-full">
                              {assignment.dosen.email}
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                            <div className="flex min-w-0 items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span className="truncate">
                                {assignment.mata_kuliah.kode_mk} -{" "}
                                {assignment.mata_kuliah.nama_mk}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{assignment.kelas.nama_kelas}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {assignment.total_jadwal} sesi
                            </Badge>
                            {assignment.tanggal_mulai &&
                              assignment.tanggal_selesai && (
                                <Badge variant="outline">
                                  {format(
                                    new Date(assignment.tanggal_mulai),
                                    "dd MMM",
                                    { locale: localeId },
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    new Date(assignment.tanggal_selesai),
                                    "dd MMM yyyy",
                                    { locale: localeId },
                                  )}
                                </Badge>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start sm:justify-center"
                            onClick={() =>
                              toggleExpanded(
                                `${assignment.dosen_id}-${assignment.mata_kuliah_id}-${assignment.kelas_id}`,
                              )
                            }
                          >
                            {expandedRows.has(
                              `${assignment.dosen_id}-${assignment.mata_kuliah_id}-${assignment.kelas_id}`,
                            ) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            Detail Jadwal
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start sm:justify-center"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Kelas/MK/Dosen
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="justify-start text-danger hover:text-danger/80 hover:bg-danger/5 sm:justify-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded Jadwal Details */}
                    {expandedRows.has(
                      `${assignment.dosen_id}-${assignment.mata_kuliah_id}-${assignment.kelas_id}`,
                    ) && (
                      <CardContent className="border-t">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-muted-foreground">
                            Rincian Sesi Praktikum
                          </h4>

                          {!assignment.jadwalDetail ||
                          assignment.jadwalDetail.length === 0 ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Belum ada sesi pada praktikum ini
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="space-y-4">
                              {(() => {
                                const upcomingJadwal =
                                  assignment.jadwalDetail.filter(
                                    (jadwal) => !isPastJadwal(jadwal),
                                  );
                                const historyJadwal =
                                  assignment.jadwalDetail.filter((jadwal) =>
                                    isPastJadwal(jadwal),
                                  );

                                const renderJadwalRow = (
                                  jadwal: Jadwal,
                                  readOnly = false,
                                ) => (
                                  <div
                                    key={jadwal.id}
                                    className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          <span>
                                            {format(
                                              new Date(
                                                jadwal.tanggal_praktikum,
                                              ),
                                              "dd MMM yyyy",
                                              { locale: localeId },
                                            )}
                                          </span>
                                          <Badge variant="outline">
                                            {jadwal.hari}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          <span>
                                            {jadwal.jam_mulai} -{" "}
                                            {jadwal.jam_selesai}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4" />
                                          <span>
                                            {jadwal.laboratorium.nama_lab}
                                          </span>
                                        </div>
                                        {jadwal.topik && (
                                          <div className="text-muted-foreground">
                                            {jadwal.topik}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(jadwal.status)}

                                      {readOnly ? (
                                        <Badge variant="secondary">
                                          Riwayat Tetap
                                        </Badge>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleEditJadwal(jadwal)
                                          }
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                          Koreksi Jadwal
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );

                                return (
                                  <>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold">
                                          Jadwal Aktif / Mendatang
                                        </h5>
                                        <Badge variant="outline">
                                          {upcomingJadwal.length} sesi
                                        </Badge>
                                      </div>
                                      {upcomingJadwal.length > 0 ? (
                                        upcomingJadwal.map((jadwal) =>
                                          renderJadwalRow(jadwal),
                                        )
                                      ) : (
                                        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                          Tidak ada sesi aktif atau mendatang.
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold">
                                          Riwayat Praktikum
                                        </h5>
                                        <Badge variant="secondary">
                                          {historyJadwal.length} sesi
                                        </Badge>
                                      </div>
                                      {historyJadwal.length > 0 ? (
                                        historyJadwal.map((jadwal) =>
                                          renderJadwalRow(jadwal, true),
                                        )
                                      ) : (
                                        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                                          Belum ada riwayat praktikum pada
                                          kelompok ini.
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: RINGKASAN DOSEN                                           */}
        {/* ================================================================ */}
        <TabsContent value="ringkasan" className="space-y-4">
          {dosenSummaryView.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Belum ada data dosen</p>
                  <p className="text-sm">
                    Data akan muncul setelah jadwal praktikum dibuat
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dosenSummaryView.map((dosen) => (
                <Card key={dosen.dosen_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
                          {dosen.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {dosen.nama}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {dosen.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="text-center">
                          <div className="font-bold text-foreground text-lg">
                            {dosen.kelasList.length}
                          </div>
                          <div className="text-xs">Kelas</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground text-lg">
                            {dosen.mataKuliahSet.size}
                          </div>
                          <div className="text-xs">Mata Kuliah</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-foreground text-lg">
                            {dosen.totalJadwal}
                          </div>
                          <div className="text-xs">Total Jadwal</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600 text-lg">
                            {dosen.jadwalCompleted}
                          </div>
                          <div className="text-xs">Approved</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600 text-lg">
                            {dosen.jadwalScheduled}
                          </div>
                          <div className="text-xs">Pending</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {dosen.kelasList.length > 0 && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Kelas</TableHead>
                            <TableHead>Mata Kuliah</TableHead>
                            <TableHead>SKS</TableHead>
                            <TableHead>Tahun Ajaran</TableHead>
                            <TableHead>Semester</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dosen.kelasList.map((k) => (
                            <TableRow key={k.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {k.nama_kelas}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {k.kode_kelas}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{k.nama_mk}</div>
                                <div className="text-xs text-muted-foreground">
                                  {k.kode_mk}
                                </div>
                              </TableCell>
                              <TableCell>
                                {k.sks > 0 ? `${k.sks} SKS` : "—"}
                              </TableCell>
                              <TableCell>{k.tahun_ajaran}</TableCell>
                              <TableCell>Sem {k.semester_ajaran}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Referensi Praktikum</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus referensi praktikum dan jadwal
              terkait. Penghapusan akan ditolak jika referensi ini sudah dipakai
              untuk proses akademik seperti presensi, logbook, materi, kuis,
              atau nilai.
            </DialogDescription>
          </DialogHeader>

          {deleteConfirmation && (
            <div className="space-y-4">
              <Alert className="border-danger/30 bg-danger/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Perhatian:</strong> Ini akan menghapus:
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>
                      Referensi untuk{" "}
                      <strong>
                        {deleteConfirmation.assignment.dosen.full_name}
                      </strong>
                    </li>
                    <li>
                      Mata kuliah{" "}
                      <strong>
                        {deleteConfirmation.assignment.mata_kuliah.nama_mk}
                      </strong>
                    </li>
                    <li>
                      Kelas{" "}
                      <strong>
                        {deleteConfirmation.assignment.kelas.nama_kelas}
                      </strong>
                    </li>
                    <li>
                      {deleteConfirmation.totalJadwal} jadwal praktikum terkait
                    </li>
                    <li>
                      Jika sudah ada aktivitas akademik, penghapusan akan diblok
                      untuk menjaga riwayat data
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifyDosen"
                    checked={deleteOptions.notifyDosen}
                    onCheckedChange={(checked) =>
                      setDeleteOptions((prev) => ({
                        ...prev,
                        notifyDosen: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="notifyDosen" className="text-sm">
                    Kirim notifikasi ke dosen terkait
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAssignment}>
              Hapus Referensi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Jadwal Dialog */}
      <Dialog
        open={editJadwalDialogOpen}
        onOpenChange={setEditJadwalDialogOpen}
      >
        <DialogContent className="flex flex-col sm:max-w-md max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle>Koreksi Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Lakukan koreksi terbatas pada detail jadwal praktikum. Perubahan
              akan diberitahukan ke dosen dan mahasiswa.
            </DialogDescription>
          </DialogHeader>

          {editJadwalData && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="tanggal" className="text-sm font-medium">
                    Tanggal Praktikum
                  </label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={editJadwalData.tanggal_praktikum}
                    onChange={(e) =>
                      setEditJadwalData({
                        ...editJadwalData,
                        tanggal_praktikum: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="jam_mulai" className="text-sm font-medium">
                      Jam Mulai
                    </label>
                    <Input
                      id="jam_mulai"
                      type="time"
                      value={editJadwalData.jam_mulai.substring(0, 5)}
                      onChange={(e) =>
                        setEditJadwalData({
                          ...editJadwalData,
                          jam_mulai: e.target.value + ":00",
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="jam_selesai"
                      className="text-sm font-medium"
                    >
                      Jam Selesai
                    </label>
                    <Input
                      id="jam_selesai"
                      type="time"
                      value={editJadwalData.jam_selesai.substring(0, 5)}
                      onChange={(e) =>
                        setEditJadwalData({
                          ...editJadwalData,
                          jam_selesai: e.target.value + ":00",
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="laboratorium" className="text-sm font-medium">
                    Laboratorium
                  </label>
                  <Select
                    value={editJadwalData.laboratorium_id}
                    onValueChange={(value) =>
                      setEditJadwalData({
                        ...editJadwalData,
                        laboratorium_id: value,
                      })
                    }
                  >
                    <SelectTrigger id="laboratorium">
                      <SelectValue placeholder="Pilih laboratorium" />
                    </SelectTrigger>
                    <SelectContent>
                      {labList.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.nama_lab}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="topik" className="text-sm font-medium">
                    Topik
                  </label>
                  <Input
                    id="topik"
                    placeholder="Topik praktikum"
                    value={editJadwalData.topik}
                    onChange={(e) =>
                      setEditJadwalData({
                        ...editJadwalData,
                        topik: e.target.value,
                      })
                    }
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Notifikasi koreksi akan dikirim ke dosen pengajar dan semua
                    mahasiswa di kelas ini.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditJadwalDialogOpen(false)}
              disabled={editJadwalLoading}
            >
              Batal
            </Button>
            <Button onClick={confirmEditJadwal} disabled={editJadwalLoading}>
              {editJadwalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Koreksi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Assignment Dialog */}
      <Dialog
        open={editAssignmentDialogOpen}
        onOpenChange={setEditAssignmentDialogOpen}
      >
        <DialogContent className="flex flex-col sm:max-w-md max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle>Koreksi Referensi Praktikum</DialogTitle>
            <DialogDescription>
              Perbarui kelas, mata kuliah, atau dosen pengampu untuk praktikum
              ini bila ada data yang salah.
            </DialogDescription>
          </DialogHeader>

          {editAssignmentData && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kelas_assignment_info">Kelas</Label>
                  <Select
                    value={editAssignmentData.kelas_id}
                    onValueChange={(value) =>
                      setEditAssignmentData({
                        ...editAssignmentData,
                        kelas_id: value,
                      })
                    }
                  >
                    <SelectTrigger id="kelas_assignment_info">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {kelasDropdownList.map((kelas) => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.nama_kelas} ({kelas.kode_kelas})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mata_kuliah_assignment_info">
                    Mata Kuliah
                  </Label>
                  <Select
                    value={editAssignmentData.mata_kuliah_id}
                    onValueChange={(value) =>
                      setEditAssignmentData({
                        ...editAssignmentData,
                        mata_kuliah_id: value,
                      })
                    }
                  >
                    <SelectTrigger id="mata_kuliah_assignment_info">
                      <SelectValue placeholder="Pilih mata kuliah" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {mataKuliahList.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id}>
                          {mk.nama_mk} ({mk.kode_mk})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dosen_baru" className="text-sm font-medium">
                    Dosen
                  </label>
                  <Select
                    value={editAssignmentData.dosen_id}
                    onValueChange={(value) =>
                      setEditAssignmentData({
                        ...editAssignmentData,
                        dosen_id: value,
                      })
                    }
                  >
                    <SelectTrigger id="dosen_baru">
                      <SelectValue placeholder="Pilih dosen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {dosenList.map((dosen) => (
                        <SelectItem key={dosen.id} value={dosen.id}>
                          {getDosenDisplayName(dosen)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert className="border-primary/20 bg-primary/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Perhatian:</strong>
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>
                        Hanya jadwal pada referensi praktikum yang dipilih ini
                        yang akan diperbarui
                      </li>
                      <li>
                        Jika kelas berubah, mahasiswa pada kelas lama dan kelas
                        baru akan menerima notifikasi
                      </li>
                      <li>
                        Jika dosen berubah, dosen lama dan dosen baru akan
                        menerima notifikasi
                      </li>
                      <li>
                        Koreksi mata kuliah juga akan disinkronkan ke jadwal
                        praktikum terkait
                      </li>
                      <li>
                        Jika ada sesi praktikum yang sudah lewat tanggal,
                        koreksi referensi tidak bisa dilakukan
                      </li>
                      <li>
                        Jika salah satu jadwal sudah memiliki presensi, koreksi
                        referensi akan ditolak untuk menjaga riwayat kehadiran
                      </li>
                      <li>
                        Jika sudah ada materi, kuis, nilai, atau logbook pada
                        referensi lama, koreksi referensi juga akan ditolak
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditAssignmentDialogOpen(false)}
              disabled={editAssignmentLoading}
            >
              Batal
            </Button>
            <Button
              onClick={confirmEditAssignment}
              disabled={editAssignmentLoading}
            >
              {editAssignmentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Koreksi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
