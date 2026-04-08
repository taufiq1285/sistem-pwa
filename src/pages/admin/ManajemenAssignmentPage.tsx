/**
 * Manajemen Assignment & Jadwal Praktikum - Unified Management System
 *
 * Purpose: Single page untuk mengelola assignment dosen dan jadwal praktikum
 * Features:
 * - Master-Detail View: Assignment sebagai master record, Jadwal sebagai detail
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
  };
  kelas: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
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
  mata_kuliah_id: string;
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

export default function ManajemenAssignmentPage() {
  const { user } = useAuth();

  // ── Tab 1: Assignment Dosen state ──────────────────────────────────────────
  const [kelasList, setKelasList] = useState<KelasWithAssignment[]>([]);
  const [filterDosen, setFilterDosen] = useState("all");
  const [filterMataKuliah, setFilterMataKuliah] = useState("all");
  const [filterTahunAjaran, setFilterTahunAjaran] = useState("all");
  const [searchKelas, setSearchKelas] = useState("");
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [isEditKelasOpen, setIsEditKelasOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] =
    useState<KelasWithAssignment | null>(null);
  const [isSubmittingKelas, setIsSubmittingKelas] = useState(false);
  const [editKelasDosenId, setEditKelasDosenId] = useState("");
  const [editKelasMkId, setEditKelasMkId] = useState("");
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
    alsoDeleteKelas: false,
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
      let query = supabase
        .from("jadwal_praktikum")
        .select(
          `
          id,
          dosen_id,
          kelas_id,
          kelas:kelas!inner(
            id,
            nama_kelas,
            kode_kelas,
            mata_kuliah_id,
            mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk)
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

      // FIX: mata_kuliah_id is in kelas relation, use nested filter
      if (filters?.mata_kuliah_id) {
        typedQuery = typedQuery.eq(
          "kelas.mata_kuliah_id",
          filters.mata_kuliah_id,
        );
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
        query = query.eq(
          "kelas.semester_ajaran",
          parseInt(filters.semester as string, 10),
        );
      }

      // Apply search
      if (searchQuery) {
        typedQuery = typedQuery.or(`
          dosen.user.full_name.ilike.%${searchQuery}%,
          kelas.mata_kuliah.nama_mk.ilike.%${searchQuery}%,
          kelas.mata_kuliah.kode_mk.ilike.%${searchQuery}%,
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
          uniqueDosen: 0,
        });
        return;
      }

      // Group by unique assignment (dosen + mata_kuliah + kelas)
      const assignmentMap = new Map<string, any>();

      rawData.forEach((item: any) => {
        // FIX: Get mata_kuliah_id from kelas relation, not from root
        const mataKuliahId = item.kelas?.mata_kuliah_id;
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
            mata_kuliah: item.kelas?.mata_kuliah,
            kelas: item.kelas,
            jadwalDetail: [],
          });
        }
      });

      // Get detailed schedules for each assignment
      const assignmentsWithSchedules = [];

      for (const [key, assignment] of assignmentMap) {
        // Get all jadwal for this assignment
        // FIX: Filter by dosen_id and kelas_id only (mata_kuliah_id is in kelas table)
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
            laboratorium:laboratorium_id (
              id,
              nama_lab,
              kode_lab
            )
          `,
          )
          .eq("dosen_id", assignment.dosen_id)
          .eq("kelas_id", assignment.kelas_id)
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

      setStats({
        totalAssignments: assignmentsWithSchedules?.length || 0,
        totalJadwal,
        activeAssignments:
          assignmentsWithSchedules?.filter((a: AssignmentDetail) =>
            a.jadwalDetail?.some((j: Jadwal) => j.status === "scheduled"),
          ).length || 0,
        uniqueDosen: uniqueDosenCount,
      });
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast.error("Gagal memuat data assignment", {
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

      const [kelasResponse, dosenForTab1, mkForTab1] = await Promise.all([
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

  const filteredKelas = useMemo(() => {
    let filtered = [...kelasList];

    if (filterDosen !== "all") {
      filtered = filtered.filter((k) => k.dosen?.id === filterDosen);
    }
    if (filterMataKuliah !== "all") {
      filtered = filtered.filter((k) => k.mata_kuliah?.id === filterMataKuliah);
    }
    if (filterTahunAjaran !== "all") {
      filtered = filtered.filter((k) => k.tahun_ajaran === filterTahunAjaran);
    }
    if (searchKelas) {
      const q = searchKelas.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.nama_kelas.toLowerCase().includes(q) ||
          k.kode_kelas.toLowerCase().includes(q) ||
          k.dosen?.users?.full_name?.toLowerCase().includes(q) ||
          k.mata_kuliah?.nama_mk?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [
    kelasList,
    filterDosen,
    filterMataKuliah,
    filterTahunAjaran,
    searchKelas,
  ]);

  const handleEditKelas = (kelas: KelasWithAssignment) => {
    setSelectedKelas(kelas);
    setEditKelasDosenId(kelas.dosen_id || "");
    setEditKelasMkId(kelas.mata_kuliah_id || "");
    setIsEditKelasOpen(true);
  };

  const handleEditKelasSubmit = async () => {
    if (!selectedKelas) return;

    try {
      setIsSubmittingKelas(true);

      const newDosenId =
        editKelasDosenId && editKelasDosenId !== "none"
          ? editKelasDosenId
          : null;
      const newMkId =
        editKelasMkId && editKelasMkId !== "none" ? editKelasMkId : null;
      const oldDosenId = selectedKelas.dosen_id || null;
      const dosenChanged =
        newDosenId && oldDosenId && newDosenId !== oldDosenId;

      // 1. Update kelas
      const { error: kelasError } = await supabase
        .from("kelas")
        .update({
          dosen_id: newDosenId,
          mata_kuliah_id: newMkId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedKelas.id);

      if (kelasError) throw kelasError;

      // 2. Jika dosen berubah, cascade ke jadwal_praktikum
      if (dosenChanged) {
        const { error: jadwalError } = await (supabase as any)
          .from("jadwal_praktikum")
          .update({
            dosen_id: newDosenId,
            updated_at: new Date().toISOString(),
          })
          .eq("kelas_id", selectedKelas.id)
          .eq("dosen_id", oldDosenId);

        if (jadwalError) throw jadwalError;

        // 3. Notifikasi dosen lama
        const { data: oldDosenUser } = await (supabase as any)
          .from("dosen")
          .select("id, users:user_id(id, full_name)")
          .eq("id", oldDosenId)
          .single();

        const { data: newDosenUser } = await (supabase as any)
          .from("dosen")
          .select("id, users:user_id(id, full_name)")
          .eq("id", newDosenId)
          .single();

        if (oldDosenUser?.users?.id) {
          await (supabase as any).from("notifications").insert({
            user_id: oldDosenUser.users.id,
            title: "Assignment Kelas Dipindah",
            message: `Assignment untuk kelas ${selectedKelas.nama_kelas} telah dialihkan dari Anda ke ${newDosenUser?.users?.full_name || "dosen lain"} oleh admin.`,
            type: "assignment_reassigned",
            metadata: {
              kelas_id: selectedKelas.id,
              old_dosen_id: oldDosenId,
              new_dosen_id: newDosenId,
            },
          });
        }

        if (newDosenUser?.users?.id) {
          await (supabase as any).from("notifications").insert({
            user_id: newDosenUser.users.id,
            title: "Assignment Kelas Baru",
            message: `Anda ditugaskan untuk mengajar kelas ${selectedKelas.nama_kelas}${selectedKelas.mata_kuliah ? ` (${selectedKelas.mata_kuliah.nama_mk})` : ""} oleh admin.`,
            type: "assignment_added",
            metadata: {
              kelas_id: selectedKelas.id,
              new_dosen_id: newDosenId,
            },
          });
        }

        toast.success("Assignment kelas berhasil diperbarui", {
          description: `Dosen diganti dan ${dosenChanged ? "jadwal praktikum ikut diperbarui" : ""}. Notifikasi dikirim ke dosen terkait.`,
        });
      } else {
        toast.success("Assignment kelas berhasil diperbarui");
      }

      setIsEditKelasOpen(false);
      setSelectedKelas(null);
      await loadKelasData();
      // Refresh Tab 2 juga karena jadwal mungkin berubah
      if (dosenChanged) fetchAssignments();
    } catch (error: any) {
      console.error("Error updating kelas assignment:", error);
      toast.error(error.message || "Gagal memperbarui assignment");
    } finally {
      setIsSubmittingKelas(false);
    }
  };

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
        alsoDeleteKelas: Boolean(deleteOptions?.alsoDeleteKelas),
        notifyDosen: Boolean(deleteOptions?.notifyDosen),
      };

      // FIX: Filter by dosen_id and kelas_id only (mata_kuliah_id is in kelas table)
      const { data: jadwalToDelete, error: countError } = await supabaseAny
        .from("jadwal_praktikum")
        .select("id, tanggal_praktikum, topik")
        .eq("dosen_id", dosen_id)
        .eq("kelas_id", kelas_id);

      if (countError) throw countError;

      const totalJadwal = jadwalToDelete?.length || 0;

      const { error: jadwalDeleteError } = await supabaseAny
        .from("jadwal_praktikum")
        .delete()
        .eq("dosen_id", dosen_id)
        .eq("kelas_id", kelas_id);

      if (jadwalDeleteError) throw jadwalDeleteError;

      let kelasDeleted = false;
      if (validOptions.alsoDeleteKelas) {
        const { count, error: studentCountError } = await supabaseAny
          .from("kelas_mahasiswa")
          .select("*", { count: "exact", head: true })
          .eq("kelas_id", kelas_id);

        if (studentCountError) throw studentCountError;

        if ((count ?? 0) === 0) {
          const { count: otherJadwalCount, error: otherJadwalError } =
            await supabaseAny
              .from("jadwal_praktikum")
              .select("*", { count: "exact", head: true })
              .eq("kelas_id", kelas_id)
              .eq("is_active", true);

          if (otherJadwalError) throw otherJadwalError;

          if ((otherJadwalCount ?? 0) === 0) {
            const { error: kelasDeleteError } = await supabaseAny
              .from("kelas")
              .delete()
              .eq("id", kelas_id);

            if (kelasDeleteError) throw kelasDeleteError;
            kelasDeleted = true;
          }
        }
      }

      // Check if there are other assignments for this dosen + mata_kuliah combination
      // FIX: Query jadwal with kelas join to find assignments with same mata_kuliah
      const { data: otherAssignments, error: otherAssignError } =
        await supabaseAny
          .from("jadwal_praktikum")
          .select(
            `
            id,
            kelas_id,
            kelas:kelas_id!inner (
              mata_kuliah_id
            )
          `,
          )
          .eq("dosen_id", dosen_id)
          .eq("kelas.mata_kuliah_id", mata_kuliah_id)
          .eq("is_active", true);

      if (otherAssignError) throw otherAssignError;

      // Only delete dosen_mata_kuliah if no other assignments exist for this combination
      if (!otherAssignments || otherAssignments.length === 0) {
        const { error: dmDeleteError } = await supabase
          .from("dosen_mata_kuliah")
          .delete()
          .eq("dosen_id", dosen_id)
          .eq("mata_kuliah_id", mata_kuliah_id);

        if (dmDeleteError) throw dmDeleteError;
      }

      if (validOptions.notifyDosen) {
        const [
          { data: mkData, error: mkError },
          { data: kelasData, error: kError },
        ] = await Promise.all([
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

        if (mkError) throw mkError;
        if (kError) throw kError;

        const { error: notifError } = await supabaseAny
          .from("notifications")
          .insert({
            user_id: dosen_id,
            title: "Assignment Dihapus",
            message: `Assignment untuk mata kuliah ${mkData?.nama_mk} di kelas ${kelasData?.nama_kelas} telah dihapus oleh admin.`,
            type: "assignment_deleted",
            metadata: {
              dosen_id,
              mata_kuliah_id,
              kelas_id,
              deleted_jadwal_count: totalJadwal,
              kelas_deleted: kelasDeleted,
            },
          });

        if (notifError) throw notifError;
      }

      const auditUserAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

      const { error: auditError } = await supabaseAny
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "DELETE_ASSIGNMENT_CASCADE",
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
            kelas_deleted: kelasDeleted,
            jadwal_details: jadwalToDelete,
          },
          ip_address: "unknown",
          user_agent: auditUserAgent,
        });

      if (auditError) {
        console.warn("Failed to write audit log:", auditError);
      }

      toast.success("Assignment berhasil dihapus", {
        description: `${deleteConfirmation.totalJadwal} jadwal praktikum juga dihapus${deleteOptions.alsoDeleteKelas ? ", data kelas dibersihkan" : ""}`,
      });

      setDeleteDialogOpen(false);
      setDeleteConfirmation(null);
      fetchAssignments();
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      toast.error("Gagal menghapus assignment", {
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

      if (dosenResult.data) setDosenList(dosenResult.data);
      if (labResult.data) setLabList(labResult.data);
      if (kelasResult.data) setKelasDropdownList(kelasResult.data);
      if (mataKuliahResult.data) setMataKuliahList(mataKuliahResult.data);
    };

    fetchDropdownData();
  }, []);

  // Edit Jadwal Handler
  const handleEditJadwal = (jadwal: Jadwal) => {
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

      const supabaseAny = supabase as any;

      // Get current jadwal data before update
      const { data: currentJadwal, error: fetchError } = await supabaseAny
        .from("jadwal_praktikum")
        .select(
          `
          *,
          kelas:kelas_id (
            id,
            nama_kelas,
            mata_kuliah:mata_kuliah_id (nama_mk)
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
        .eq("kelas_id", currentJadwal.kelas.id);

      // Send notification to dosen
      await supabaseAny.from("notifications").insert({
        user_id: currentJadwal.dosen.id,
        title: "Jadwal Praktikum Diupdate",
        message: `Jadwal praktikum ${currentJadwal.kelas.mata_kuliah.nama_mk} - ${currentJadwal.kelas.nama_kelas} telah diupdate oleh admin.`,
        type: "jadwal_updated",
        metadata: {
          jadwal_id: editJadwalData.id,
          tanggal_baru: editJadwalData.tanggal_praktikum,
          jam_baru: `${editJadwalData.jam_mulai} - ${editJadwalData.jam_selesai}`,
        },
      });

      // Send notifications to all mahasiswa
      if (mahasiswaList && mahasiswaList.length > 0) {
        const notifications = mahasiswaList.map((m: any) => ({
          user_id: m.mahasiswa.user.id,
          title: "Jadwal Praktikum Diupdate",
          message: `Jadwal praktikum ${currentJadwal.kelas.mata_kuliah.nama_mk} - ${currentJadwal.kelas.nama_kelas} telah diupdate oleh admin.`,
          type: "jadwal_updated",
          metadata: {
            jadwal_id: editJadwalData.id,
            tanggal_baru: editJadwalData.tanggal_praktikum,
            jam_baru: `${editJadwalData.jam_mulai} - ${editJadwalData.jam_selesai}`,
          },
        }));

        await supabaseAny.from("notifications").insert(notifications);
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
    setEditAssignmentData({
      dosen_id: assignment.dosen_id,
      old_dosen_id: assignment.dosen_id,
      kelas_id: assignment.kelas_id,
      mata_kuliah_id: assignment.mata_kuliah_id,
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

      // Check if anything changed
      const dosenChanged =
        editAssignmentData.dosen_id !== editAssignmentData.old_dosen_id;

      if (!dosenChanged) {
        toast.info("Tidak ada perubahan");
        return;
      }

      // Get old and new dosen info
      const { data: oldDosen } = await supabaseAny
        .from("dosen")
        .select("id, user:user_id(full_name, email)")
        .eq("id", editAssignmentData.old_dosen_id)
        .single();

      const { data: newDosen } = await supabaseAny
        .from("dosen")
        .select("id, user:user_id(full_name, email)")
        .eq("id", editAssignmentData.dosen_id)
        .single();

      // Get kelas and mata kuliah info
      const { data: kelasInfo } = await supabaseAny
        .from("kelas")
        .select("nama_kelas, mata_kuliah:mata_kuliah_id(nama_mk)")
        .eq("id", editAssignmentData.kelas_id)
        .single();

      const { data: mataKuliahInfo } = await supabaseAny
        .from("mata_kuliah")
        .select("nama_mk, kode_mk")
        .eq("id", editAssignmentData.mata_kuliah_id)
        .single();

      // Build update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that changed
      if (dosenChanged) {
        updateData.dosen_id = editAssignmentData.dosen_id;
      }

      // Update all jadwal for this assignment
      const { error: updateError } = await supabaseAny
        .from("jadwal_praktikum")
        .update(updateData)
        .eq("dosen_id", editAssignmentData.old_dosen_id)
        .eq("kelas_id", editAssignmentData.kelas_id);

      if (updateError) throw updateError;

      // Get all mahasiswa in this kelas
      const { data: mahasiswaList } = await supabaseAny
        .from("kelas_mahasiswa")
        .select(
          "mahasiswa_id, mahasiswa:mahasiswa_id(user:user_id(id, full_name, email))",
        )
        .eq("kelas_id", editAssignmentData.kelas_id);

      // Notify old dosen (if dosen changed)
      if (dosenChanged && oldDosen) {
        await supabaseAny.from("notifications").insert({
          user_id: oldDosen.user.id,
          title: "Assignment Diberikan ke Dosen Lain",
          message: `Assignment ${mataKuliahInfo.nama_mk} - ${kelasInfo.nama_kelas} telah dialihkan dari Anda ke ${newDosen.user.full_name}.`,
          type: "assignment_reassigned",
          metadata: {
            kelas_id: editAssignmentData.kelas_id,
            mata_kuliah_id: editAssignmentData.mata_kuliah_id,
            old_dosen_id: editAssignmentData.old_dosen_id,
            new_dosen_id: editAssignmentData.dosen_id,
          },
        });
      }

      // Notify new dosen
      await supabaseAny.from("notifications").insert({
        user_id: newDosen.user.id,
        title: "Assignment Baru Ditambahkan",
        message: `Anda telah ditugaskan untuk mengajar ${mataKuliahInfo.nama_mk} - ${kelasInfo.nama_kelas}.`,
        type: "assignment_added",
        metadata: {
          kelas_id: editAssignmentData.kelas_id,
          mata_kuliah_id: editAssignmentData.mata_kuliah_id,
        },
      });

      // Notify all mahasiswa
      if (mahasiswaList && mahasiswaList.length > 0) {
        const notifications = mahasiswaList.map((m: any) => ({
          user_id: m.mahasiswa.user.id,
          title: "Dosen Pengajar Diubah",
          message: `Dosen pengajar untuk ${mataKuliahInfo.nama_mk} - ${kelasInfo.nama_kelas} telah diubah dari ${oldDosen.user.full_name} ke ${newDosen.user.full_name}.`,
          type: "dosen_changed",
          metadata: {
            kelas_id: editAssignmentData.kelas_id,
            mata_kuliah_id: editAssignmentData.mata_kuliah_id,
            old_dosen_id: editAssignmentData.old_dosen_id,
            new_dosen_id: editAssignmentData.dosen_id,
          },
        }));

        await supabaseAny.from("notifications").insert(notifications);
      }

      // Audit log
      const auditUserAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
      await supabaseAny.from("audit_logs").insert({
        user_id: user.id,
        action: "REASSIGN_DOSEN",
        table_name: "jadwal_praktikum",
        record_id: `${editAssignmentData.kelas_id}-${editAssignmentData.mata_kuliah_id}`,
        old_data: {
          dosen_id: editAssignmentData.old_dosen_id,
          dosen_name: oldDosen.user.full_name,
        },
        new_data: {
          dosen_id: editAssignmentData.dosen_id,
          dosen_name: newDosen.user.full_name,
        },
        ip_address: "unknown",
        user_agent: auditUserAgent,
      });

      toast.success("Assignment berhasil diupdate", {
        description: `Dosen telah diganti dari ${oldDosen.user.full_name} ke ${newDosen.user.full_name}. Notifikasi dikirim ke ${mahasiswaList?.length || 0} mahasiswa`,
      });

      setEditAssignmentDialogOpen(false);
      setEditAssignmentData(null);
      fetchAssignments();
    } catch (error: any) {
      console.error("Error editing assignment:", error);
      toast.error("Gagal mengupdate assignment", {
        description: error.message,
      });
    } finally {
      setEditAssignmentLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "info" | "success" | "error" | "offline"> =
      {
        scheduled: "info",
        completed: "success",
        cancelled: "error",
      };
    return (
      <StatusBadge status={statusMap[status] || "offline"} pulse={false}>
        {status}
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

  // ── Tab 3: Ringkasan per dosen ────────────────────────────────────────────
  // Gabungkan data dari kelasList (assignment) + assignments (jadwal)
  const dosenSummary = useMemo(() => {
    // Map: dosen_id → ringkasan
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

    // Dari kelasList (Tab 1): setiap kelas yang punya dosen
    kelasList.forEach((k) => {
      if (!k.dosen_id || !k.dosen?.users) return;
      const id = k.dosen_id;
      if (!map.has(id)) {
        map.set(id, {
          dosen_id: id,
          nama: k.dosen.users.full_name,
          email: k.dosen.users.email,
          kelasList: [],
          mataKuliahSet: new Set(),
          totalJadwal: 0,
          jadwalScheduled: 0,
          jadwalCompleted: 0,
        });
      }
      const entry = map.get(id)!;
      entry.kelasList.push({
        id: k.id,
        nama_kelas: k.nama_kelas,
        kode_kelas: k.kode_kelas,
        nama_mk: k.mata_kuliah?.nama_mk || "—",
        kode_mk: k.mata_kuliah?.kode_mk || "—",
        sks: k.mata_kuliah?.sks || 0,
        tahun_ajaran: k.tahun_ajaran,
        semester_ajaran: k.semester_ajaran,
      });
      if (k.mata_kuliah?.id) entry.mataKuliahSet.add(k.mata_kuliah.id);
    });

    // Dari assignments (Tab 2): jadwal count per dosen
    assignments.forEach((a) => {
      if (!map.has(a.dosen_id)) {
        // Dosen ada jadwal tapi tidak terdaftar di kelas aktif
        map.set(a.dosen_id, {
          dosen_id: a.dosen_id,
          nama: a.dosen.full_name,
          email: a.dosen.email,
          kelasList: [],
          mataKuliahSet: new Set(),
          totalJadwal: 0,
          jadwalScheduled: 0,
          jadwalCompleted: 0,
        });
      }
      const entry = map.get(a.dosen_id)!;
      entry.totalJadwal += a.jadwalDetail?.length || 0;
      a.jadwalDetail?.forEach((j) => {
        if (j.status === "scheduled") entry.jadwalScheduled++;
        if (j.status === "completed") entry.jadwalCompleted++;
      });
      entry.mataKuliahSet.add(a.mata_kuliah_id);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [kelasList, assignments]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Memuat data assignment...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Manajemen Assignment & Jadwal Praktikum"
        description="Kelola assignment dosen dan jadwal praktikum dalam satu sistem terintegrasi"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignment
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Master assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jadwal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJadwal}</div>
            <p className="text-xs text-muted-foreground">Schedule details</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssignments}</div>
            <p className="text-xs text-muted-foreground">Scheduled jadwal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Dosen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDosen}</div>
            <p className="text-xs text-muted-foreground">Active lecturers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Assignment Dosen
          </TabsTrigger>
          <TabsTrigger value="jadwal" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Jadwal Praktikum
          </TabsTrigger>
          <TabsTrigger value="ringkasan" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ringkasan Dosen
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: ASSIGNMENT DOSEN                                          */}
        {/* ================================================================ */}
        <TabsContent value="assignment" className="space-y-4">
          {/* Tab 1 Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Kelas Aktif"
              value={kelasList.length}
              description={`${kelasList.filter((k) => k.dosen_id).length} dengan dosen assigned`}
              icon={Users}
              color="primary"
            />
            <DashboardCard
              title="Dosen Aktif"
              value={dosenList.length}
              description={`${new Set(kelasList.filter((k) => k.dosen_id).map((k) => k.dosen_id)).size} mengajar`}
              icon={BookOpen}
              color="info"
            />
            <DashboardCard
              title="Mata Kuliah"
              value={mataKuliahList.length}
              description={`${new Set(kelasList.filter((k) => k.mata_kuliah_id).map((k) => k.mata_kuliah_id)).size} diajarkan`}
              icon={Calendar}
              color="success"
            />
            <DashboardCard
              title="Assignment Complete"
              value={
                kelasList.filter((k) => k.dosen_id && k.mata_kuliah_id).length
              }
              description={`${Math.round((kelasList.filter((k) => k.dosen_id && k.mata_kuliah_id).length / (kelasList.length || 1)) * 100)}% dari total`}
              icon={CheckCircle}
              color="accent"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kelas, dosen, mk..."
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

          {/* Kelas Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                Daftar Kelas ({filteredKelas.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadKelasData}
                disabled={kelasLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${kelasLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {kelasLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Memuat data kelas...</span>
                </div>
              ) : filteredKelas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Tidak ada kelas ditemukan</p>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKelas.map((kelas) => {
                      const isAssigned = !!(
                        kelas.dosen_id && kelas.mata_kuliah_id
                      );
                      return (
                        <TableRow key={kelas.id}>
                          <TableCell>
                            <div className="font-medium">
                              {kelas.nama_kelas}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {kelas.kode_kelas}
                            </div>
                          </TableCell>
                          <TableCell>
                            {kelas.mata_kuliah ? (
                              <div>
                                <div className="font-medium">
                                  {kelas.mata_kuliah.nama_mk}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {kelas.mata_kuliah.kode_mk} ·{" "}
                                  {kelas.mata_kuliah.sks} SKS
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {kelas.dosen?.users ? (
                              <div>
                                <div className="font-medium">
                                  {kelas.dosen.users.full_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {kelas.dosen.users.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{kelas.tahun_ajaran}</div>
                            <div className="text-xs text-muted-foreground">
                              Sem {kelas.semester_ajaran}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isAssigned ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Assigned
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-300"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Belum Assign
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditKelas(kelas)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
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

        {/* ================================================================ */}
        {/* TAB 2: JADWAL PRAKTIKUM                                          */}
        {/* ================================================================ */}
        <TabsContent value="jadwal" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dosen, mata kuliah, atau kelas..."
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
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
                Refresh
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
                        Tidak ada assignment ditemukan
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
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="font-semibold">
                              {assignment.dosen.full_name}
                            </span>
                            <Badge variant="outline">
                              {assignment.dosen.email}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span>
                                {assignment.mata_kuliah.kode_mk} -{" "}
                                {assignment.mata_kuliah.nama_mk}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{assignment.kelas.nama_kelas}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {assignment.total_jadwal} jadwal aktif
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

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
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
                            Details
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="text-danger hover:text-danger/80 hover:bg-danger/5"
                          >
                            <Trash2 className="h-4 w-4" />
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
                            Jadwal Praktikum Detail
                          </h4>

                          {!assignment.jadwalDetail ||
                          assignment.jadwalDetail.length === 0 ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Tidak ada jadwal praktikum untuk assignment ini
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <div className="space-y-2">
                              {assignment.jadwalDetail.map((jadwal) => (
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
                                            new Date(jadwal.tanggal_praktikum),
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

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditJadwal(jadwal)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
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
          {dosenSummary.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Belum ada data dosen</p>
                  <p className="text-sm">
                    Data akan muncul setelah assignment dibuat
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dosenSummary.map((dosen) => (
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
                          <div className="text-xs">Selesai</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600 text-lg">
                            {dosen.jadwalScheduled}
                          </div>
                          <div className="text-xs">Dijadwalkan</div>
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
            <DialogTitle>Konfirmasi Hapus Assignment</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus assignment dan semua data terkait.
              Tindakan tidak dapat dibatalkan.
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
                      Assignment untuk{" "}
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
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alsoDeleteKelas"
                    checked={deleteOptions.alsoDeleteKelas}
                    onCheckedChange={(checked) =>
                      setDeleteOptions((prev) => ({
                        ...prev,
                        alsoDeleteKelas: checked as boolean,
                      }))
                    }
                  />
                  <label htmlFor="alsoDeleteKelas" className="text-sm">
                    Hapus juga data kelas (jika tidak ada mahasiswa terdaftar)
                  </label>
                </div>

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
              Hapus Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Jadwal Dialog */}
      <Dialog
        open={editJadwalDialogOpen}
        onOpenChange={setEditJadwalDialogOpen}
      >
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Ubah detail jadwal praktikum. Perubahan akan diberitahukan ke
              dosen dan mahasiswa.
            </DialogDescription>
          </DialogHeader>

          {editJadwalData && (
            <div className="space-y-4 py-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  <label htmlFor="jam_selesai" className="text-sm font-medium">
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
                  Notifikasi akan dikirim ke dosen pengajar dan semua mahasiswa
                  di kelas ini.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
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
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Kelas (Assignment Dosen) Dialog */}
      <Dialog open={isEditKelasOpen} onOpenChange={setIsEditKelasOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment Dosen</DialogTitle>
            <DialogDescription>
              Assign atau ganti dosen dan mata kuliah untuk kelas{" "}
              <strong>{selectedKelas?.nama_kelas}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_kelas_dosen">Dosen</Label>
              <Select
                value={editKelasDosenId}
                onValueChange={setEditKelasDosenId}
              >
                <SelectTrigger id="edit_kelas_dosen">
                  <SelectValue placeholder="Pilih dosen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tidak ada dosen —</SelectItem>
                  {dosenList.map((dosen: any) => (
                    <SelectItem key={dosen.id} value={dosen.id}>
                      {dosen.users?.full_name ||
                        dosen.user?.full_name ||
                        dosen.nip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_kelas_mk">Mata Kuliah</Label>
              <Select value={editKelasMkId} onValueChange={setEditKelasMkId}>
                <SelectTrigger id="edit_kelas_mk">
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    — Tidak ada mata kuliah —
                  </SelectItem>
                  {mataKuliahList.map((mk: any) => (
                    <SelectItem key={mk.id} value={mk.id}>
                      {mk.nama_mk} ({mk.kode_mk})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditKelasOpen(false)}
              disabled={isSubmittingKelas}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditKelasSubmit}
              disabled={isSubmittingKelas}
            >
              {isSubmittingKelas ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
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
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Ubah dosen, kelas, atau mata kuliah untuk assignment ini. Dosen
              lama dan mahasiswa akan diberitahu.
            </DialogDescription>
          </DialogHeader>

          {editAssignmentData && (
            <div className="space-y-4 py-4">
              {/* Dropdown Dosen */}
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
                  <SelectContent>
                    {dosenList.map((dosen) => (
                      <SelectItem key={dosen.id} value={dosen.id}>
                        {dosen.user?.full_name || dosen.user?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Kelas */}
              <div className="space-y-2">
                <label htmlFor="kelas_baru" className="text-sm font-medium">
                  Kelas
                </label>
                <Select
                  value={editAssignmentData.kelas_id}
                  onValueChange={(value) =>
                    setEditAssignmentData({
                      ...editAssignmentData,
                      kelas_id: value,
                    })
                  }
                >
                  <SelectTrigger id="kelas_baru">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasDropdownList.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} ({kelas.kode_kelas})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Mata Kuliah */}
              <div className="space-y-2">
                <label
                  htmlFor="mata_kuliah_baru"
                  className="text-sm font-medium"
                >
                  Mata Kuliah
                </label>
                <Select
                  value={editAssignmentData.mata_kuliah_id}
                  onValueChange={(value) =>
                    setEditAssignmentData({
                      ...editAssignmentData,
                      mata_kuliah_id: value,
                    })
                  }
                >
                  <SelectTrigger id="mata_kuliah_baru">
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {mataKuliahList.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.nama_mk} ({mk.kode_mk})
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
                    <li>Semua jadwal untuk assignment ini akan diperbarui</li>
                    <li>
                      Dosen lama akan menerima notifikasi perubahan assignment
                    </li>
                    <li>Dosen baru akan menerima notifikasi penugasan</li>
                    <li>
                      Semua mahasiswa di kelas ini akan diberitahu tentang
                      perubahan
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
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
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
