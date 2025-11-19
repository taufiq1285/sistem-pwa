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

import { useState, useEffect } from 'react';
import { Loader2, Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MateriList } from '@/components/features/materi/MateriCard';
import { MateriViewer } from '@/components/features/materi/MateriViewer';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMateri, downloadMateri } from '@/lib/api/materi.api';
import type { Materi } from '@/types/materi.types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

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
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedMinggu, setSelectedMinggu] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [materiList, selectedKelas, selectedMinggu, searchQuery]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData() {
    if (!user?.mahasiswa?.id) return;

    try {
      setLoading(true);

      // Get enrolled kelas IDs
      const { data: enrollments } = await supabase
        .from('kelas_mahasiswa')
        .select('kelas_id')
        .eq('mahasiswa_id', user.mahasiswa.id)
        .eq('is_active', true);

      const kelasIds = enrollments?.map((e) => e.kelas_id) || [];
      setEnrolledKelasIds(kelasIds);

      // Get all materi and filter by enrolled kelas
      const allMateri = await getMateri({ is_active: true });

      // Filter materi by enrolled kelas
      const enrolledMateri = allMateri.filter((m) =>
        kelasIds.includes(m.kelas_id)
      );

      setMateriList(enrolledMateri);
    } catch (error) {
      console.error('Error loading materi:', error);
      toast.error('Gagal memuat materi');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  function filterMateri() {
    let filtered = [...materiList];

    // Filter by kelas
    if (selectedKelas !== 'all') {
      filtered = filtered.filter((m) => m.kelas_id === selectedKelas);
    }

    // Filter by minggu
    if (selectedMinggu !== 'all') {
      const minggu = parseInt(selectedMinggu);
      filtered = filtered.filter((m) => m.minggu_ke === minggu);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.judul.toLowerCase().includes(query) ||
          m.deskripsi?.toLowerCase().includes(query)
      );
    }

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
      toast.success('Download dimulai');
    } catch (error: any) {
      console.error('Error downloading materi:', error);
      toast.error(error.message || 'Gagal mendownload materi');
    }
  }

  // ============================================================================
  // GET UNIQUE KELAS LIST
  // ============================================================================

  const uniqueKelas = Array.from(
    new Map(
      materiList.map((m) => [
        m.kelas_id,
        {
          id: m.kelas_id,
          nama: m.kelas?.nama_kelas || 'Unknown',
        },
      ])
    ).values()
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
          <h1 className="text-3xl font-bold">Materi Pembelajaran</h1>
        </div>
        <p className="text-muted-foreground">
          Akses materi pembelajaran dari dosen Anda
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
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

        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            {uniqueKelas.map((kelas) => (
              <SelectItem key={kelas.id} value={kelas.id}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Materi</p>
            <p className="text-2xl font-bold">{materiList.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Kelas Terdaftar</p>
            <p className="text-2xl font-bold">{uniqueKelas.length}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Materi Minggu Ini</p>
            <p className="text-2xl font-bold">
              {
                materiList.filter((m) => {
                  const now = new Date();
                  const weeksSinceStart = Math.ceil(
                    (now.getTime() - new Date('2024-01-01').getTime()) /
                      (7 * 24 * 60 * 60 * 1000)
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
            ? 'Anda belum terdaftar di kelas manapun'
            : 'Belum ada materi tersedia'
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
