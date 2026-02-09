/**
 * Admin Assignment Management Page
 *
 * Purpose: Manage jadwal assignments and reassign dosen
 * Features:
 * - View all jadwal with filtering
 * - Edit jadwal details
 * - Reassign to different dosen
 * - Update status (approved/rejected/cancelled)
 * - Delete jadwal
 */

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// API
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import type { Jadwal } from "@/types/jadwal.types";
import type { Kelas, MataKuliah } from "@/types";

// API Types
interface JadwalWithDetails extends Jadwal {
  kelas?: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
    tahun_ajaran: string;
    semester_ajaran: string;
  };
  mata_kuliah?: {
    id: string;
    nama_mk: string;
    kode_mk: string;
    sks: number;
  };
  laboratorium?: {
    id: string;
    nama_lab: string;
    kode_lab: string;
    kapasitas: number;
  };
  dosen?: {
    id: string;
    full_name: string;
    email: string;
    nip: string;
  };
  mata_kuliah_id?: string;
  dosen_id?: string;
}

interface EditFormData {
  tanggal_praktikum: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  catatan: string;
  status: "pending" | "approved" | "rejected" | "cancelled"; // ✅ WORKFLOW: pending → approved/rejected → cancelled
  laboratorium_id: string;
  dosen_id?: string;
  kelas_id?: string;
}

export default function AssignmentManagementPage() {
  const [loading, setLoading] = useState(true);
  const [jadwalList, setJadwalList] = useState<JadwalWithDetails[]>([]);
  const [filteredJadwal, setFilteredJadwal] = useState<JadwalWithDetails[]>([]);

  // Data for dropdowns
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [laboratoriumList, setLaboratoriumList] = useState<any[]>([]);
  const [dosenList, setDosenList] = useState<any[]>([]);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLab, setFilterLab] = useState<string>("all");
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedJadwal, setSelectedJadwal] =
    useState<JadwalWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for edit dialog
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  // Form state for reassign dialog
  const [reassignFormData, setReassignFormData] = useState<{
    dosen_id: string;
    reason: string;
  }>({ dosen_id: "", reason: "" });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jadwalList, filterStatus, filterLab, filterKelas, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);

      const [
        jadwalResponse,
        kelasResponse,
        mkResponse,
        labResponse,
        dosenResponse,
      ] = await Promise.all([
        supabase
          .from("jadwal_praktikum")
          .select(
            `
            *,
            kelas:kelas_id (
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
            laboratorium:laboratorium_id (
              id,
              nama_lab,
              kode_lab,
              kapasitas
            ),
            dosen:dosen_id (
              id,
              nip,
              users:user_id (
                full_name,
                email
              )
            )
          `,
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("kelas")
          .select("id, nama_kelas, kode_kelas, is_active")
          .eq("is_active", true)
          .order("nama_kelas"),
        supabase
          .from("mata_kuliah")
          .select("id, nama_mk, kode_mk, is_active")
          .eq("is_active", true)
          .order("nama_mk"),
        supabase
          .from("laboratorium")
          .select("id, nama_lab, kode_lab, is_active")
          .eq("is_active", true)
          .order("nama_lab"),
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
      ]);

      if (jadwalResponse.error) throw jadwalResponse.error;
      if (kelasResponse.error) throw kelasResponse.error;
      if (mkResponse.error) throw mkResponse.error;
      if (labResponse.error) throw labResponse.error;
      if (dosenResponse.error) throw dosenResponse.error;

      const processedJadwal = (jadwalResponse.data || []).map(
        (jadwal: any) => ({
          ...jadwal,
          kelas: kelasResponse.data?.find((k) => k.id === jadwal.kelas_id),
          mata_kuliah: mkResponse.data?.find(
            (mk) => mk.id === jadwal.mata_kuliah_id,
          ),
          laboratorium: labResponse.data?.find(
            (l) => l.id === jadwal.laboratorium_id,
          ),
          dosen: dosenResponse.data?.find((d) => d.id === jadwal.dosen_id),
        }),
      );

      setJadwalList(processedJadwal as JadwalWithDetails[]);
      setKelasList((kelasResponse.data || []) as Kelas[]);
      setMataKuliahList((mkResponse.data || []) as any as MataKuliah[]);
      setLaboratoriumList(labResponse.data || []);
      setDosenList(dosenResponse.data || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...jadwalList];

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((j) => j.status === filterStatus);
    }

    // Lab filter
    if (filterLab !== "all") {
      filtered = filtered.filter((j) => j.laboratorium_id === filterLab);
    }

    // Kelas filter
    if (filterKelas !== "all") {
      filtered = filtered.filter((j) => j.kelas_id === filterKelas);
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.kelas?.nama_kelas?.toLowerCase().includes(searchLower) ||
          j.kelas?.kode_kelas?.toLowerCase().includes(searchLower) ||
          j.mata_kuliah?.nama_mk?.toLowerCase().includes(searchLower) ||
          j.mata_kuliah?.kode_mk?.toLowerCase().includes(searchLower) ||
          j.laboratorium?.nama_lab?.toLowerCase().includes(searchLower) ||
          j.dosen?.full_name?.toLowerCase().includes(searchLower) ||
          j.dosen?.nip?.toLowerCase().includes(searchLower),
      );
    }

    setFilteredJadwal(filtered);
  }

  const handleEdit = (jadwal: JadwalWithDetails) => {
    setSelectedJadwal(jadwal);
    setEditFormData({
      tanggal_praktikum: jadwal.tanggal_praktikum,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
      topik: jadwal.topik || "",
      catatan: jadwal.catatan || "",
      status: (jadwal.status as "pending" | "approved" | "rejected" | "cancelled") || "pending", // ✅ WORKFLOW: Default to pending
      laboratorium_id: jadwal.laboratorium_id,
      dosen_id: jadwal.dosen_id,
      kelas_id: jadwal.kelas_id,
    });
    setIsEditOpen(true);
  };

  const handleReassign = (jadwal: JadwalWithDetails) => {
    setSelectedJadwal(jadwal);
    setIsReassignOpen(true);
  };

  const handleDelete = async (jadwal: JadwalWithDetails) => {
    if (
      !confirm(
        `Hapus jadwal "${jadwal.topik || "Tanpa Topik"}" pada ${format(new Date(jadwal.tanggal_praktikum), "dd MMM yyyy")}?`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("jadwal_praktikum")
        .delete()
        .eq("id", jadwal.id);

      if (error) throw error;

      toast.success("Jadwal berhasil dihapus");
      await loadData(); // Reload data
    } catch (error: any) {
      console.error("Error deleting jadwal:", error);
      toast.error("Gagal menghapus jadwal");
    }
  };

  const handleEditSubmit = async (data: EditFormData) => {
    if (!selectedJadwal) return;

    try {
      setIsSubmitting(true);

      const dayMapping: Record<string, string> = {
        monday: "senin",
        tuesday: "selasa",
        wednesday: "rabu",
        thursday: "kamis",
        friday: "jumat",
        saturday: "sabtu",
        sunday: "minggu",
      };
      const dayInEnglish = format(new Date(data.tanggal_praktikum), "EEEE", {
        locale: localeId,
      }).toLowerCase();
      const hari = dayMapping[dayInEnglish] || dayInEnglish;

      const { error } = await supabase
        .from("jadwal_praktikum")
        .update({
          tanggal_praktikum: data.tanggal_praktikum,
          hari: hari as Database["public"]["Enums"]["day_of_week"],
          jam_mulai: data.jam_mulai,
          jam_selesai: data.jam_selesai,
          topik: data.topik,
          catatan: data.catatan,
          status: data.status,
          laboratorium_id: data.laboratorium_id,
          ...(data.dosen_id && { dosen_id: data.dosen_id }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedJadwal.id);

      if (error) throw error;

      toast.success("Jadwal berhasil diperbarui");
      setIsEditOpen(false);
      setSelectedJadwal(null);
      await loadData(); // Reload data
    } catch (error: any) {
      console.error("Error updating jadwal:", error);
      toast.error(error.message || "Gagal memperbarui jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (data: {
    dosen_id: string;
    reason?: string;
  }) => {
    if (!selectedJadwal) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("jadwal_praktikum")
        .update({
          dosen_id: data.dosen_id,
          catatan: data.reason
            ? `Reassigned: ${data.reason} (Previous: ${selectedJadwal.catatan || "N/A"})`
            : `Reassigned from previous dosen`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedJadwal.id);

      if (error) throw error;

      toast.success("Jadwal berhasil dipindahkan ke dosen lain");
      setIsReassignOpen(false);
      setSelectedJadwal(null);
      await loadData(); // Reload data
    } catch (error: any) {
      console.error("Error reassigning jadwal:", error);
      toast.error(error.message || "Gagal memindahkan jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Management Assignment Dosen
        </h1>
        <p className="text-muted-foreground">
          Kelola dan manajemen jadwal praktikum dosen
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Jadwal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredJadwal.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredJadwal.filter((j) => j.status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredJadwal.filter((j) => j.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredJadwal.filter((j) => j.status === "rejected").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {filteredJadwal.filter((j) => j.status === "cancelled").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLab} onValueChange={setFilterLab}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Laboratorium" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lab</SelectItem>
                {laboratoriumList.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.kode_lab} - {lab.nama_lab}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterKelas} onValueChange={setFilterKelas}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.kode_kelas} - {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1">
              <Input
                placeholder="Cari jadwal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Praktikum</CardTitle>
          <CardDescription>
            Kelola jadwal praktikum, edit detail, atau pindahkan ke dosen lain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredJadwal.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-4" />
              <p>Tidak ada jadwal yang ditemukan</p>
              <p className="text-sm">Coba atur filter atau buat jadwal baru</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hari</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Lab</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Topik</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJadwal.map((jadwal) => (
                  <TableRow key={jadwal.id}>
                    <TableCell>
                      {format(
                        new Date(jadwal.tanggal_praktikum),
                        "dd MMM yyyy",
                      )}
                    </TableCell>
                    <TableCell className="capitalize">
                      {jadwal.hari || "-"}
                    </TableCell>
                    <TableCell>
                      {jadwal.jam_mulai} - {jadwal.jam_selesai}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {jadwal.mata_kuliah?.nama_mk || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {jadwal.mata_kuliah?.kode_mk}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {jadwal.kelas?.nama_kelas || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {jadwal.kelas?.kode_kelas}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {jadwal.laboratorium?.nama_lab || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {jadwal.laboratorium?.kode_lab}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {jadwal.dosen?.full_name || "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {jadwal.dosen?.nip}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(jadwal.status || "pending")}
                      >
                        {getStatusIcon(jadwal.status || "pending")}
                        <span className="ml-1">
                          {(jadwal.status || "pending")
                            .charAt(0)
                            .toUpperCase() +
                            (jadwal.status || "pending").slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {jadwal.topik || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(jadwal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReassign(jadwal)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(jadwal)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Praktikum</DialogTitle>
            <DialogDescription>
              Perbarui detail jadwal praktikum
            </DialogDescription>
          </DialogHeader>

          {selectedJadwal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggal_praktikum">Tanggal Praktikum</Label>
                  <Input
                    type="date"
                    value={editFormData?.tanggal_praktikum || ""}
                    onChange={(e) => {
                      if (editFormData) {
                        setEditFormData({
                          ...editFormData,
                          tanggal_praktikum: e.target.value,
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="jam_mulai">Jam Mulai</Label>
                  <Input
                    type="time"
                    value={editFormData?.jam_mulai || ""}
                    onChange={(e) => {
                      if (editFormData) {
                        setEditFormData({
                          ...editFormData,
                          jam_mulai: e.target.value,
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="jam_selesai">Jam Selesai</Label>
                  <Input
                    type="time"
                    value={editFormData?.jam_selesai || ""}
                    onChange={(e) => {
                      if (editFormData) {
                        setEditFormData({
                          ...editFormData,
                          jam_selesai: e.target.value,
                        });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editFormData?.status || "pending"}
                    onValueChange={(value) => {
                      if (editFormData) {
                        setEditFormData({
                          ...editFormData,
                          status: value as
                            | "pending"
                            | "approved"
                            | "rejected"
                            | "cancelled",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="laboratorium_id">Laboratorium</Label>
                  <Select
                    value={editFormData?.laboratorium_id || ""}
                    onValueChange={(value) => {
                      if (editFormData) {
                        setEditFormData({
                          ...editFormData,
                          laboratorium_id: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {laboratoriumList.map((lab) => (
                        <SelectItem key={lab.id} value={lab.id}>
                          {lab.kode_lab} - {lab.nama_lab}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="topik">Topik</Label>
                <Textarea
                  placeholder="Topik atau materi praktikum..."
                  value={editFormData?.topik || ""}
                  onChange={(e) => {
                    if (editFormData) {
                      setEditFormData({
                        ...editFormData,
                        topik: e.target.value,
                      });
                    }
                  }}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  placeholder="Catatan tambahan..."
                  value={editFormData?.catatan || ""}
                  onChange={(e) => {
                    if (editFormData) {
                      setEditFormData({
                        ...editFormData,
                        catatan: e.target.value,
                      });
                    }
                  }}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (editFormData && selectedJadwal) {
                      handleEditSubmit({
                        ...editFormData,
                        laboratorium_id: editFormData.laboratorium_id,
                        dosen_id: editFormData.dosen_id,
                      });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pindahkan Jadwal ke Dosen Lain</DialogTitle>
            <DialogDescription>
              Pilih dosen baru untuk mengajar jadwal ini
            </DialogDescription>
          </DialogHeader>

          {selectedJadwal && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <strong>Info Jadwal:</strong>{" "}
                    {selectedJadwal.kelas?.nama_kelas} -{" "}
                    {selectedJadwal.mata_kuliah?.nama_mk}
                  </div>
                  <div className="text-sm mt-1">
                    {format(
                      new Date(selectedJadwal.tanggal_praktikum),
                      "dd MMM yyyy HH:mm",
                    )}{" "}
                    - {selectedJadwal.jam_mulai} s/d{" "}
                    {selectedJadwal.jam_selesai}
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="dosen_id">Dosen Baru</Label>
                <Select
                  value={reassignFormData.dosen_id}
                  onValueChange={(value) =>
                    setReassignFormData({
                      ...reassignFormData,
                      dosen_id: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dosen baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {dosenList
                      .filter((d: any) => d.id !== selectedJadwal.dosen_id)
                      .map((dosen: any) => (
                        <SelectItem key={dosen.id} value={dosen.id}>
                          {dosen.users?.full_name} ({dosen.nip})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Alasan Pemindahan (Opsional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Kenapa jadwal ini dipindahkan ke dosen baru?"
                  className="resize-none"
                  rows={3}
                  value={reassignFormData.reason}
                  onChange={(e) =>
                    setReassignFormData({
                      ...reassignFormData,
                      reason: e.target.value,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReassignOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => handleReassignSubmit(reassignFormData)}
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Pindahkan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
