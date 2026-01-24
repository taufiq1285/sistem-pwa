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
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

// UI Components
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
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

export default function ManajemenAssignmentPage() {
  const { user } = useAuth();

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

      // Build master assignment query (same logic as the API route)
      let query = supabase
        .from("jadwal_praktikum")
        .select(
          `
          dosen_id,
          mata_kuliah_id,
          kelas_id,
          dosen:users!inner(id, full_name, email),
          mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk),
          kelas:kelas!inner(id, nama_kelas, kode_kelas)
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
        query = query.eq(
          "kelas.semester_ajaran",
          parseInt(filters.semester as string, 10),
        );
      }

      // Apply search
      if (searchQuery) {
        typedQuery = typedQuery.or(`
          dosen.full_name.ilike.%${searchQuery}%,
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
          uniqueDosen: 0,
        });
        return;
      }

      // Group by unique assignment (dosen + mata_kuliah + kelas)
      const assignmentMap = new Map<string, any>();

      rawData.forEach((item: any) => {
        const key = `${item.dosen_id}-${item.mata_kuliah_id}-${item.kelas_id}`;

        if (!assignmentMap.has(key)) {
          assignmentMap.set(key, {
            dosen_id: item.dosen_id,
            mata_kuliah_id: item.mata_kuliah_id,
            kelas_id: item.kelas_id,
            total_jadwal: 0,
            tanggal_mulai: "",
            tanggal_selesai: "",
            dosen: item.dosen,
            mata_kuliah: item.mata_kuliah,
            kelas: item.kelas,
            jadwalDetail: [],
          });
        }
      });

      // Get detailed schedules for each assignment
      const assignmentsWithSchedules = [];

      for (const [key, assignment] of assignmentMap) {
        // Get all jadwal for this assignment
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
          .eq("mata_kuliah_id", assignment.mata_kuliah_id)
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

      const { dosen_id, mata_kuliah_id, kelas_id } =
        deleteConfirmation.assignment;

      const validOptions = {
        alsoDeleteKelas: Boolean(deleteOptions?.alsoDeleteKelas),
        notifyDosen: Boolean(deleteOptions?.notifyDosen),
      };

      const { data: jadwalToDelete, error: countError } = await supabaseAny
        .from("jadwal_praktikum")
        .select("id, tanggal_praktikum, topik")
        .eq("dosen_id", dosen_id)
        .eq("mata_kuliah_id", mata_kuliah_id)
        .eq("kelas_id", kelas_id);

      if (countError) throw countError;

      const totalJadwal = jadwalToDelete?.length || 0;

      const { error: jadwalDeleteError } = await supabaseAny
        .from("jadwal_praktikum")
        .delete()
        .eq("dosen_id", dosen_id)
        .eq("mata_kuliah_id", mata_kuliah_id)
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

      const { data: otherAssignments, error: otherAssignError } =
        await supabaseAny
          .from("jadwal_praktikum")
          .select("id")
          .eq("dosen_id", dosen_id)
          .eq("mata_kuliah_id", mata_kuliah_id)
          .eq("is_active", true);

      if (otherAssignError) throw otherAssignError;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
              setFilters((prev) => ({ ...prev, status: value || undefined }))
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
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Assignment List */}
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
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">
                        {assignment.dosen.full_name}
                      </span>
                      <Badge variant="outline">{assignment.dosen.email}</Badge>
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

                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                                  <Badge variant="outline">{jadwal.hari}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {jadwal.jam_mulai} - {jadwal.jam_selesai}
                                  </span>
                                </div>
                              </div>

                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{jadwal.laboratorium.nama_lab}</span>
                                </div>
                                {jadwal.topik && (
                                  <div className="text-muted-foreground">
                                    {jadwal.topik}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(jadwal.status)}>
                                {jadwal.status}
                              </Badge>

                              <Button variant="ghost" size="sm">
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
              <Alert className="border-red-200 bg-red-50">
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
    </div>
  );
}
