/**
 * MateriPage - Mahasiswa
 *
 * Purpose: View and download learning materials
 * Features:
 * - List all available materi
 * - Filter by kelas, minggu
 * - View materi (PDF, images, videos)
 * - Download materi
 * - Search materi
 */

import { useState, useEffect } from "react";
import { Loader2, Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MateriList } from "@/components/features/materi/MateriCard";
import { MateriViewer } from "@/components/features/materi/MateriViewer";
import { useAuth } from "@/lib/hooks/useAuth";
import { getMateri, downloadMateri } from "@/lib/api/materi.api";
import type { Materi } from "@/types/materi.types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaMateriPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [filteredMateri, setFilteredMateri] = useState<Materi[]>([]);
  const [enrolledKelasIds, setEnrolledKelasIds] = useState<string[]>([]);

  // Filters
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("all");
  const [selectedMinggu, setSelectedMinggu] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Viewer
  const [viewingMateri, setViewingMateri] = useState<Materi | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadData();
    }
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    filterMateri();
  }, [
    materiList,
    selectedKelas,
    selectedMataKuliah,
    selectedMinggu,
    searchQuery,
  ]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData(forceRefresh = false) {
    if (!user?.mahasiswa?.id) return;

    try {
      setLoading(true);

      // Use cacheAPI for materi with offline support
      const enrolledMateri = await cacheAPI(
        `mahasiswa_materi_${user?.mahasiswa?.id}`,
        async () => {
          // Get enrolled kelas IDs
          const { data: enrollments, error: enrollmentError } = await supabase
            .from("kelas_mahasiswa")
            .select("kelas_id, mahasiswa_id, is_active")
            .eq("mahasiswa_id", user.mahasiswa.id)
            .eq("is_active", true);

          if (enrollmentError) throw enrollmentError;

          const kelasIds = enrollments?.map((e) => e.kelas_id) || [];
          setEnrolledKelasIds(kelasIds);

          // Get all materi and filter by enrolled kelas
          const allMateri = await getMateri({ is_active: true });

          // Filter materi by enrolled kelas
          return allMateri.filter((m) => kelasIds.includes(m.kelas_id));
        },
        {
          ttl: 15 * 60 * 1000, // 15 minutes (materi changes less frequently)
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setMateriList(enrolledMateri);
      console.log("[Materi] Data loaded:", enrolledMateri.length, "materi");
    } catch (error) {
      console.error("Error loading materi:", error);
      toast.error("Gagal memuat materi");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  function filterMateri() {
    let filtered = [...materiList];

    console.log("Filtering materi:", {
      total: filtered.length,
      mataKuliah: selectedMataKuliah,
      kelas: selectedKelas,
      minggu: selectedMinggu,
      search: searchQuery,
    });

    // Filter by mata kuliah
    if (selectedMataKuliah !== "all") {
      filtered = filtered.filter(
        (m) => m.kelas?.mata_kuliah?.nama_mk === selectedMataKuliah,
      );
      console.log("After mata kuliah filter:", filtered.length);
    }

    // Filter by kelas
    if (selectedKelas !== "all") {
      filtered = filtered.filter((m) => m.kelas_id === selectedKelas);
      console.log("After kelas filter:", filtered.length);
    }

    // Filter by minggu
    if (selectedMinggu !== "all") {
      const minggu = parseInt(selectedMinggu);
      filtered = filtered.filter((m) => m.minggu_ke === minggu);
      console.log("After minggu filter:", filtered.length);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.judul.toLowerCase().includes(query) ||
          m.deskripsi?.toLowerCase().includes(query),
      );
      console.log("After search filter:", filtered.length);
    }

    console.log("Final filtered:", filtered.length);
    setFilteredMateri(filtered);
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  async function handleView(materi: Materi) {
    setViewingMateri(materi);
    setShowViewer(true);
  }

  async function handleDownload(materi: Materi) {
    try {
      await downloadMateri(materi.id);
      toast.success("Download dimulai");
    } catch (error: any) {
      console.error("Error downloading materi:", error);
      toast.error(error.message || "Gagal mendownload materi");
    }
  }

  // ============================================================================
  // GET UNIQUE KELAS AND MATA KULIAH LIST
  // ============================================================================

  // Get unique mata kuliah
  const uniqueMataKuliah = Array.from(
    new Set(
      materiList.map((m) => m.kelas?.mata_kuliah?.nama_mk).filter(Boolean),
    ),
  );

  // Get unique kelas with more info
  const uniqueKelas = Array.from(
    new Map(
      materiList.map((m) => [
        m.kelas_id,
        {
          id: m.kelas_id,
          nama: m.kelas?.nama_kelas || "Unknown",
          mataKuliah: m.kelas?.mata_kuliah?.nama_mk || "-",
          kodeMk: m.kelas?.mata_kuliah?.kode_mk || "",
        },
      ]),
    ).values(),
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-extrabold">Materi Pembelajaran</h1>
        </div>
        <p className="text-muted-foreground">
          Akses materi pembelajaran dari dosen Anda
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={selectedMataKuliah}
          onValueChange={(value) => {
            setSelectedMataKuliah(value);
            setSelectedKelas("all"); // Reset kelas filter when mata kuliah changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Mata Kuliah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Mata Kuliah</SelectItem>
            {uniqueMataKuliah.map((mk) => (
              <SelectItem key={mk} value={mk}>
                {mk}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedKelas}
          onValueChange={(value) => {
            setSelectedKelas(value);
            setSelectedMataKuliah("all"); // Reset mata kuliah filter when kelas changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {uniqueKelas.map((kelas) => (
              <SelectItem key={kelas.id} value={kelas.id}>
                {kelas.kodeMk && `${kelas.kodeMk} - `}
                {kelas.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMinggu} onValueChange={setSelectedMinggu}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Minggu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Minggu</SelectItem>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
              <SelectItem key={minggu} value={minggu.toString()}>
                Minggu {minggu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info Cards */}
      {materiList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Materi</p>
            <p className="text-4xl font-extrabold">{materiList.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Mata Kuliah</p>
            <p className="text-4xl font-extrabold">{uniqueMataKuliah.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Kelas Terdaftar</p>
            <p className="text-4xl font-extrabold">{uniqueKelas.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Materi Minggu Ini</p>
            <p className="text-4xl font-extrabold">
              {
                materiList.filter((m) => {
                  const now = new Date();
                  const weeksSinceStart = Math.ceil(
                    (now.getTime() - new Date("2024-01-01").getTime()) /
                      (7 * 24 * 60 * 60 * 1000),
                  );
                  return m.minggu_ke === weeksSinceStart;
                }).length
              }
            </p>
          </div>
        </div>
      )}

      {/* Materi List */}
      <MateriList
        materiList={filteredMateri}
        showActions={true}
        showDosenActions={false}
        onView={handleView}
        onDownload={handleDownload}
        emptyMessage={
          enrolledKelasIds.length === 0
            ? "Anda belum terdaftar di kelas manapun"
            : "Belum ada materi tersedia"
        }
      />

      {/* Viewer */}
      <MateriViewer
        materi={viewingMateri}
        open={showViewer}
        onClose={() => {
          setShowViewer(false);
          setViewingMateri(null);
        }}
        onDownload={() => viewingMateri && handleDownload(viewingMateri)}
      />
    </div>
  );
}
