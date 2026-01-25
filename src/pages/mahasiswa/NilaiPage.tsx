/**
 * NilaiPage Enhanced - Mahasiswa
 *
 * Purpose: View grades/assessments with cumulative view and revision requests
 * Features:
 * - View grades per class OR per mata kuliah (cumulative)
 * - Request grade revisions
 * - Track revision request history
 * - Download transcript
 */

import { useState, useEffect } from "react";
import {
  Loader2,
  FileText,
  Download,
  TrendingUp,
  Award,
  Edit,
  History,
  BookOpen,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import { getNilaiByMahasiswa } from "@/lib/api/nilai.api";
import {
  getPermintaanByMahasiswa,
  createPermintaan,
} from "@/lib/api/permintaan-perbaikan.api";
import type { Nilai } from "@/types/nilai.types";
import type {
  PermintaanPerbaikanWithRelations,
  KomponenNilai,
} from "@/types/permintaan-perbaikan.types";
import {
  KOMPONEN_NILAI_LABELS,
  STATUS_PERMINTAAN_LABELS,
  STATUS_COLORS,
} from "@/types/permintaan-perbaikan.types";
import { toast } from "sonner";
import { getGradeStatus } from "@/lib/validations/nilai.schema";
import { cacheAPI } from "@/lib/offline/api-cache";

// ============================================================================
// TYPES
// ============================================================================

interface NilaiKumulatifPerMK {
  mata_kuliah_id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  total_kelas: number;
  nilai_kumulatif: number; // Average across all classes
  nilai_huruf: string;
  kelas_list: Nilai[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaNilaiPageEnhanced() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [permintaanList, setPermintaanList] = useState<
    PermintaanPerbaikanWithRelations[]
  >([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("all");

  // Permintaan Perbaikan Dialog
  const [permintaanDialogOpen, setPermintaanDialogOpen] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<Nilai | null>(null);
  const [komponenNilai, setKomponenNilai] = useState<KomponenNilai>("kuis");
  const [nilaiUsulan, setNilaiUsulan] = useState("");
  const [alasanPermintaan, setAlasanPermintaan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadData();
    }
  }, [user?.mahasiswa?.id]);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.mahasiswa?.id) return;

      // Use cacheAPI with stale-while-revalidate for offline support
      const [nilaiData, permintaanData] = await Promise.all([
        cacheAPI(
          `mahasiswa_nilai_${user?.mahasiswa?.id}`,
          () => getNilaiByMahasiswa(user.mahasiswa.id),
          {
            ttl: 15 * 60 * 1000, // 15 minutes (nilai jarang berubah)
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(
          `mahasiswa_permintaan_${user?.mahasiswa?.id}`,
          () => getPermintaanByMahasiswa(user.mahasiswa.id),
          {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      setNilaiList(nilaiData);
      setPermintaanList(permintaanData);
      console.log("[NilaiPage] Data loaded:", nilaiData.length, "nilai");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data nilai");
    } finally {
      setLoading(false);
    }
  };

  // Filter nilai
  const getFilteredNilai = (): Nilai[] => {
    let filtered = [...nilaiList];

    if (selectedSemester !== "all") {
      filtered = filtered.filter(
        (n) => n.kelas?.semester_ajaran?.toString() === selectedSemester,
      );
    }

    if (selectedTahunAjaran !== "all") {
      filtered = filtered.filter(
        (n) => n.kelas?.tahun_ajaran === selectedTahunAjaran,
      );
    }

    return filtered;
  };

  // Group nilai per mata kuliah
  const getNilaiKumulatifPerMK = (): NilaiKumulatifPerMK[] => {
    const filtered = getFilteredNilai();
    const grouped = new Map<string, Nilai[]>();

    filtered.forEach((nilai) => {
      const mkId = nilai.kelas?.mata_kuliah?.nama_mk || "Unknown";
      if (!grouped.has(mkId)) {
        grouped.set(mkId, []);
      }
      grouped.get(mkId)!.push(nilai);
    });

    return Array.from(grouped.entries()).map(([mkName, kelasList]) => {
      const firstKelas = kelasList[0];
      const totalNilai = kelasList.reduce(
        (sum, n) => sum + (n.nilai_akhir || 0),
        0,
      );
      const avgNilai = totalNilai / kelasList.length;

      // Calculate letter grade from average
      let nilaiHuruf = "E";
      if (avgNilai >= 85) nilaiHuruf = "A";
      else if (avgNilai >= 70) nilaiHuruf = "B";
      else if (avgNilai >= 55) nilaiHuruf = "C";
      else if (avgNilai >= 40) nilaiHuruf = "D";

      return {
        mata_kuliah_id: firstKelas.kelas?.mata_kuliah?.nama_mk || "",
        kode_mk: firstKelas.kelas?.mata_kuliah?.kode_mk || "",
        nama_mk: mkName,
        sks: firstKelas.kelas?.mata_kuliah?.sks || 0,
        total_kelas: kelasList.length,
        nilai_kumulatif: avgNilai,
        nilai_huruf: nilaiHuruf,
        kelas_list: kelasList,
      };
    });
  };

  // Open permintaan dialog
  const handleAjukanPerbaikan = (nilai: Nilai) => {
    setSelectedNilai(nilai);
    setKomponenNilai("kuis");
    setNilaiUsulan("");
    setAlasanPermintaan("");
    setPermintaanDialogOpen(true);
  };

  // Submit permintaan
  const handleSubmitPermintaan = async () => {
    if (!selectedNilai || !alasanPermintaan.trim()) {
      toast.error("Alasan permintaan harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const nilaiLama = selectedNilai[
        `nilai_${komponenNilai}` as keyof Nilai
      ] as number;

      await createPermintaan({
        mahasiswa_id: user!.mahasiswa!.id,
        nilai_id: selectedNilai.id,
        kelas_id: selectedNilai.kelas_id,
        komponen_nilai: komponenNilai,
        nilai_lama: nilaiLama,
        nilai_usulan: nilaiUsulan ? parseFloat(nilaiUsulan) : undefined,
        alasan_permintaan: alasanPermintaan,
      });

      toast.success("Permintaan perbaikan nilai berhasil diajukan");
      setPermintaanDialogOpen(false);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error submitting permintaan:", error);
      toast.error("Gagal mengajukan permintaan");
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers
  const getSemesterOptions = () => {
    const semesters = new Set(
      nilaiList
        .map((n) => n.kelas?.semester_ajaran)
        .filter((s) => s !== undefined),
    );
    return Array.from(semesters).sort((a, b) => (b ?? 0) - (a ?? 0));
  };

  const getTahunAjaranOptions = () => {
    const years = new Set(
      nilaiList
        .map((n) => n.kelas?.tahun_ajaran)
        .filter((y) => y !== undefined),
    );
    return Array.from(years).sort().reverse();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredNilai = getFilteredNilai();
  const nilaiKumulatif = getNilaiKumulatifPerMK();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nilai Akademik</h1>
          <p className="text-gray-600">
            Lihat nilai per kelas, per mata kuliah, dan ajukan perbaikan
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Transkrip
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Semester</SelectItem>
            {getSemesterOptions().map((sem) => (
              <SelectItem key={sem} value={sem?.toString() || ""}>
                Semester {sem}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedTahunAjaran}
          onValueChange={setSelectedTahunAjaran}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {getTahunAjaranOptions().map((year) => (
              <SelectItem key={year} value={year || ""}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="per-kelas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="per-kelas" className="gap-2">
            <FileText className="h-4 w-4" />
            Per Kelas
          </TabsTrigger>
          <TabsTrigger value="per-mk" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Per Mata Kuliah (Kumulatif)
          </TabsTrigger>
          <TabsTrigger value="permintaan" className="gap-2">
            <History className="h-4 w-4" />
            Riwayat Permintaan ({permintaanList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Per Kelas */}
        <TabsContent value="per-kelas">
          <Card>
            <CardHeader>
              <CardTitle>Nilai Per Kelas</CardTitle>
              <CardDescription>
                Nilai untuk setiap kelas praktikum yang Anda ikuti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNilai.length === 0 ? (
                <Alert>
                  <AlertDescription>Belum ada data nilai</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Kode MK</TableHead>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="text-center">Praktikum</TableHead>
                        <TableHead className="text-center">
                          Nilai Akhir
                        </TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNilai.map((nilai, index) => (
                        <TableRow key={nilai.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">
                            {nilai.kelas?.mata_kuliah?.kode_mk}
                          </TableCell>
                          <TableCell className="font-medium">
                            {nilai.kelas?.mata_kuliah?.nama_mk}
                          </TableCell>
                          <TableCell>{nilai.kelas?.nama_kelas}</TableCell>
                          <TableCell className="text-center">
                            {nilai.nilai_praktikum?.toFixed(1) || "0.0"}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {nilai.nilai_akhir?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                nilai.nilai_huruf?.startsWith("A")
                                  ? "bg-green-600"
                                  : nilai.nilai_huruf?.startsWith("B")
                                    ? "bg-blue-600"
                                    : nilai.nilai_huruf?.startsWith("C")
                                      ? "bg-yellow-600"
                                      : "bg-red-600"
                              }
                            >
                              {nilai.nilai_huruf || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleAjukanPerbaikan(nilai)}
                            >
                              <Edit className="h-3 w-3" />
                              Ajukan Perbaikan
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Per Mata Kuliah (Kumulatif) */}
        <TabsContent value="per-mk">
          <Card>
            <CardHeader>
              <CardTitle>Nilai Per Mata Kuliah (Kumulatif)</CardTitle>
              <CardDescription>
                Rata-rata nilai dari semua kelas untuk setiap mata kuliah
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nilaiKumulatif.length === 0 ? (
                <Alert>
                  <AlertDescription>Belum ada data nilai</AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Kode MK</TableHead>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead className="text-center">SKS</TableHead>
                        <TableHead className="text-center">
                          Total Kelas
                        </TableHead>
                        <TableHead className="text-center">
                          Nilai Kumulatif
                        </TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nilaiKumulatif.map((mk, index) => (
                        <TableRow key={mk.mata_kuliah_id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">
                            {mk.kode_mk}
                          </TableCell>
                          <TableCell className="font-medium">
                            {mk.nama_mk}
                          </TableCell>
                          <TableCell className="text-center">
                            {mk.sks}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{mk.total_kelas}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-lg">
                            {mk.nilai_kumulatif.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                mk.nilai_huruf.startsWith("A")
                                  ? "bg-green-600"
                                  : mk.nilai_huruf.startsWith("B")
                                    ? "bg-blue-600"
                                    : mk.nilai_huruf.startsWith("C")
                                      ? "bg-yellow-600"
                                      : "bg-red-600"
                              }
                            >
                              {mk.nilai_huruf}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Riwayat Permintaan */}
        <TabsContent value="permintaan">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Permintaan Perbaikan Nilai</CardTitle>
              <CardDescription>
                Status permintaan perbaikan nilai yang pernah Anda ajukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permintaanList.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Belum ada permintaan perbaikan nilai
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Komponen</TableHead>
                        <TableHead className="text-center">
                          Nilai Lama
                        </TableHead>
                        <TableHead className="text-center">
                          Nilai Baru
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permintaanList.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">
                            {req.kelas?.mata_kuliah?.nama_mk}
                          </TableCell>
                          <TableCell>
                            {KOMPONEN_NILAI_LABELS[req.komponen_nilai]}
                          </TableCell>
                          <TableCell className="text-center">
                            {req.nilai_lama}
                          </TableCell>
                          <TableCell className="text-center">
                            {req.nilai_baru ? (
                              <span className="font-bold text-green-600">
                                {req.nilai_baru}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${STATUS_COLORS[req.status].bg} ${STATUS_COLORS[req.status].text} border ${STATUS_COLORS[req.status].border}`}
                            >
                              {STATUS_PERMINTAAN_LABELS[req.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(req.created_at)}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {req.response_dosen || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Ajukan Permintaan Perbaikan */}
      <Dialog
        open={permintaanDialogOpen}
        onOpenChange={setPermintaanDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajukan Permintaan Perbaikan Nilai</DialogTitle>
            <DialogDescription>
              {selectedNilai?.kelas?.mata_kuliah?.nama_mk} -{" "}
              {selectedNilai?.kelas?.nama_kelas}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Komponen Nilai</Label>
              <Select
                value={komponenNilai}
                onValueChange={(v) => setKomponenNilai(v as KomponenNilai)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KOMPONEN_NILAI_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label} (
                      {String(
                        selectedNilai?.[`nilai_${key}` as keyof Nilai] || 0,
                      )}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nilai Usulan (Opsional)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={nilaiUsulan}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setNilaiUsulan(value);
                  }
                }}
                placeholder="Contoh: 85"
              />
            </div>

            <div>
              <Label>
                Alasan Permintaan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={alasanPermintaan}
                onChange={(e) => setAlasanPermintaan(e.target.value)}
                placeholder="Jelaskan alasan Anda mengajukan perbaikan nilai..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermintaanDialogOpen(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Batal
            </Button>
            <Button
              onClick={handleSubmitPermintaan}
              disabled={submitting || !alasanPermintaan.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Kirim Permintaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
