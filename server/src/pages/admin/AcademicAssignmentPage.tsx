/**
 * Admin Academic Assignment Page - MONITORING DOSEN AKADEMIK
 *
 * Purpose: Monitor dosen assignments for mata kuliah and kelas (NOT praktikum)
 * Features:
 * - View which dosen teaches which mata kuliah in which kelas
 * - Filter by dosen, mata kuliah, tahun ajaran
 * - Edit dosen assignment for kelas
 * - Reassign dosen to different kelas/mata kuliah
 * - Statistics dashboard for academic assignments
 *
 * NOTE: This is for academic assignments only, NOT praktikum schedules
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Users,
  BookOpen,
  Calendar,
  Loader2,
  Search,
  Filter,
  Edit,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";

interface KelasWithAssignment {
  id: string;
  nama_kelas: string;
  kode_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  is_active: boolean;
  mata_kuliah?: {
    id: string;
    nama_mk: string;
    kode_mk: string;
    sks: number;
  };
  dosen?: {
    id: string;
    nip: string;
    users?: {
      full_name: string;
      email: string;
    };
  };
  created_at: string;
  updated_at: string;
}

interface DosenInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  nip: string;
  is_active: boolean;
}

interface MataKuliahInfo {
  id: string;
  nama_mk: string;
  kode_mk: string;
  sks: number;
  is_active: boolean;
}

interface EditFormData {
  dosen_id: string;
  mata_kuliah_id: string;
  catatan?: string;
}

export default function AcademicAssignmentPage() {
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<KelasWithAssignment[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<KelasWithAssignment[]>([]);

  // Filters
  const [filterDosen, setFilterDosen] = useState<string>("all");
  const [filterMataKuliah, setFilterMataKuliah] = useState<string>("all");
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown data
  const [dosenList, setDosenList] = useState<DosenInfo[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliahInfo[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState<KelasWithAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kelasList, filterDosen, filterMataKuliah, filterTahunAjaran, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);

      const [kelasResponse, dosenResponse, mkResponse] = await Promise.all([
        supabase
          .from("kelas")
          .select(`
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
          `)
          .eq("is_active", true)
          .order("tahun_ajaran", { ascending: false })
          .order("nama_kelas"),
        supabase
          .from("dosen")
          .select(`
            id,
            nip,
            users:user_id (
              id,
              full_name,
              email
            )
          `)
          .order("users(full_name)"),
        supabase
          .from("mata_kuliah")
          .select("id, nama_mk, kode_mk, sks, is_active")
          .eq("is_active", true)
          .order("nama_mk"),
      ]);

      if (kelasResponse.error) throw kelasResponse.error;
      if (dosenResponse.error) throw dosenResponse.error;
      if (mkResponse.error) throw mkResponse.error;

      setKelasList(kelasResponse.data || []);
      setDosenList(
        (dosenResponse.data || []).map((d: any) => ({
          id: d.id,
          user_id: d.users?.id || "",
          full_name: d.users?.full_name || "",
          email: d.users?.email || "",
          nip: d.nip,
          is_active: true,
        }))
      );
      setMataKuliahList(mkResponse.data || []);

      // Extract unique tahun ajaran for filter
      const tahunAjarans = [
        ...new Set((kelasResponse.data || []).map((k: any) => k.tahun_ajaran)),
      ].sort((a, b) => b.localeCompare(a));
      setTahunAjaranList(tahunAjarans);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...kelasList];

    // Filter by dosen
    if (filterDosen !== "all") {
      filtered = filtered.filter((kelas) => kelas.dosen?.id === filterDosen);
    }

    // Filter by mata kuliah
    if (filterMataKuliah !== "all") {
      filtered = filtered.filter((kelas) => kelas.mata_kuliah?.id === filterMataKuliah);
    }

    // Filter by tahun ajaran
    if (filterTahunAjaran !== "all") {
      filtered = filtered.filter((kelas) => kelas.tahun_ajaran === filterTahunAjaran);
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (kelas) =>
          kelas.nama_kelas.toLowerCase().includes(searchLower) ||
          kelas.kode_kelas.toLowerCase().includes(searchLower) ||
          kelas.dosen?.users?.full_name?.toLowerCase().includes(searchLower) ||
          kelas.mata_kuliah?.nama_mk?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredKelas(filtered);
  }

  const handleEdit = (kelas: KelasWithAssignment) => {
    setSelectedKelas(kelas);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (data: EditFormData) => {
    if (!selectedKelas) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from("kelas")
        .update({
          dosen_id: data.dosen_id,
          mata_kuliah_id: data.mata_kuliah_id,
          catatan: data.catatan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedKelas.id);

      if (error) throw error;

      toast.success("Assignment kelas berhasil diperbarui");
      setIsEditOpen(false);
      setSelectedKelas(null);
      await loadData(); // Reload data
    } catch (error: any) {
      console.error("Error updating kelas assignment:", error);
      toast.error(error.message || "Gagal memperbarui assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTahunAjaranStats = () => {
    const stats = new Map();
    kelasList.forEach((kelas) => {
      const key = `${kelas.tahun_ajaran} - Sem ${kelas.semester_ajaran}`;
      if (!stats.has(key)) {
        stats.set(key, { total: 0, withDosen: 0, withMataKuliah: 0 });
      }
      const stat = stats.get(key);
      stat.total++;
      if (kelas.dosen_id) stat.withDosen++;
      if (kelas.mata_kuliah_id) stat.withMataKuliah++;
    });
    return Array.from(stats.entries()).slice(0, 3); // Show 3 most recent
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const tahunAjaranStats = getTahunAjaranStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assignment Dosen Akademik</h1>
        <p className="text-gray-600">
          Monitor dan kelola assignment dosen untuk mata kuliah dan kelas (bukan praktikum)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kelasList.length}</div>
            <p className="text-xs text-muted-foreground">
              {kelasList.filter((k) => k.dosen_id).length} dengan dosen assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dosen Aktif</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dosenList.length}</div>
            <p className="text-xs text-muted-foreground">
              {dosenList.filter((d) => kelasList.some((k) => k.dosen_id === d.id)).length} mengajar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mata Kuliah</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mataKuliahList.length}</div>
            <p className="text-xs text-muted-foreground">
              {mataKuliahList.filter((mk) => kelasList.some((k) => k.mata_kuliah_id === mk.id)).length} diajarkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Assignment Complete</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kelasList.filter((k) => k.dosen_id && k.mata_kuliah_id).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (kelasList.filter((k) => k.dosen_id && k.mata_kuliah_id).length / kelasList.length) * 100
              )}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tahun Ajaran Stats */}
      {tahunAjaranStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistik per Tahun Ajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {tahunAjaranStats.map(([tahunAjaran, stats]) => (
                <div key={tahunAjaran} className="text-sm">
                  <div className="font-medium">{tahunAjaran}</div>
                  <div className="text-gray-600">
                    {stats.total} kelas, {stats.withDosen} dengan dosen, {stats.withMataKuliah} dengan mata kuliah
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Dosen</Label>
              <Select
                value={filterDosen}
                onValueChange={setFilterDosen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Dosen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Dosen</SelectItem>
                  {dosenList.map((dosen) => (
                    <SelectItem key={dosen.id} value={dosen.id}>
                      {dosen.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mata Kuliah</Label>
              <Select
                value={filterMataKuliah}
                onValueChange={setFilterMataKuliah}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                  {mataKuliahList.map((mk) => (
                    <SelectItem key={mk.id} value={mk.id}>
                      {mk.kode_mk} - {mk.nama_mk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tahun Ajaran</Label>
              <Select
                value={filterTahunAjaran}
                onValueChange={setFilterTahunAjaran}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                  {tahunAjaranList.map((tahun) => (
                    <SelectItem key={tahun} value={tahun}>
                      {tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari kelas, dosen, mata kuliah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kelas Assignment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Assignment Kelas</CardTitle>
          <CardDescription>
            Total {filteredKelas.length} kelas ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKelas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Tidak ada data kelas
                  </TableCell>
                </TableRow>
              ) : (
                filteredKelas.map((kelas) => (
                  <TableRow key={kelas.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{kelas.nama_kelas}</div>
                        <div className="text-xs text-gray-500">{kelas.kode_kelas}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {kelas.mata_kuliah?.nama_mk || "Belum ada mata kuliah"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {kelas.mata_kuliah?.kode_mk || "-"} • {kelas.mata_kuliah?.sks || 0} SKS
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {kelas.dosen?.users?.full_name || "Belum ada dosen"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {kelas.dosen?.nip || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{kelas.tahun_ajaran}</div>
                        <div className="text-xs text-gray-500">
                          Semester {kelas.semester_ajaran}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={kelas.dosen_id ? "default" : "secondary"}
                        >
                          {kelas.dosen_id ? "Dosen Assigned" : "Belum ada Dosen"}
                        </Badge>
                        <Badge
                          variant={kelas.mata_kuliah_id ? "default" : "secondary"}
                        >
                          {kelas.mata_kuliah_id ? "Mata Kuliah Set" : "Belum ada MK"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(kelas)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment Kelas</DialogTitle>
            <DialogDescription>
              Ubah dosen dan mata kuliah untuk kelas {selectedKelas?.nama_kelas}
            </DialogDescription>
          </DialogHeader>

          {selectedKelas && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditSubmit({
                dosen_id: formData.get("dosen_id") as string,
                mata_kuliah_id: formData.get("mata_kuliah_id") as string,
                catatan: formData.get("catatan") as string,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dosen_id">Dosen Pengajar</Label>
                  <Select
                    name="dosen_id"
                    defaultValue={selectedKelas.dosen_id || ""}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Dosen" />
                    </SelectTrigger>
                    <SelectContent>
                      {dosenList.map((dosen) => (
                        <SelectItem key={dosen.id} value={dosen.id}>
                          {dosen.full_name} ({dosen.nip})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mata_kuliah_id">Mata Kuliah</Label>
                  <Select
                    name="mata_kuliah_id"
                    defaultValue={selectedKelas.mata_kuliah_id || ""}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mata Kuliah" />
                    </SelectTrigger>
                    <SelectContent>
                      {mataKuliahList.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id}>
                          {mk.kode_mk} - {mk.nama_mk} ({mk.sks} SKS)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="catatan">Catatan (Opsional)</Label>
                  <Textarea
                    name="catatan"
                    placeholder="Tambahkan catatan untuk perubahan ini..."
                    defaultValue={selectedKelas.catatan || ""}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}