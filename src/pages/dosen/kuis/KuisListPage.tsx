/**
 * KuisListPage
 * 
 * Purpose: Main quiz list page for Dosen
 * Route: /dosen/kuis
 * Features: View all quizzes, filter, search, create new quiz
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid3x3, List, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuizCard } from '@/components/features/kuis/QuizCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { getKuis } from '@/lib/api/kuis.api';
import type { Kuis, KuisFilters } from '@/types/kuis.types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'draft' | 'active' | 'scheduled' | 'ended';

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [quizzes, setQuizzes] = useState<Kuis[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Kuis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [kelasFilter, setKelasFilter] = useState<string>('all');
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Load quizzes on mount
   */
  useEffect(() => {
    loadQuizzes();
  }, [user]);
  
  /**
   * Apply filters when data or filters change
   */
  useEffect(() => {
    applyFilters();
  }, [quizzes, searchQuery, statusFilter, kelasFilter]);
  
  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================
  
  /**
   * Load all quizzes
   */
  const loadQuizzes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: KuisFilters = {};
      
      // Filter by dosen if user is dosen
      if (user?.dosen?.id) {
        filters.dosen_id = user.dosen.id;
      }
      
      const data = await getKuis(filters);
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar kuis');
      toast.error('Gagal memuat daftar kuis', {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Apply filters to quiz list
   */
  const applyFilters = () => {
    let filtered = [...quizzes];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.judul.toLowerCase().includes(query) ||
          quiz.deskripsi?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quiz) => {
        const status = getQuizStatusFromDates(quiz);
        return status === statusFilter;
      });
    }
    
    // Kelas filter
    if (kelasFilter !== 'all') {
      filtered = filtered.filter((quiz) => quiz.kelas_id === kelasFilter);
    }
    
    setFilteredQuizzes(filtered);
  };
  
  // ============================================================================
  // HANDLERS - NAVIGATION
  // ============================================================================
  
  /**
   * Navigate to create new quiz
   */
  const handleCreateQuiz = () => {
    navigate('/dosen/kuis/create');
  };
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Get unique kelas for filter
  const kelasOptions = Array.from(
    new Set(quizzes.map((q) => q.kelas_id))
  ).filter(Boolean);
  
  // Count by status
  const statusCounts = {
    all: quizzes.length,
    draft: quizzes.filter((q) => getQuizStatusFromDates(q) === 'draft').length,
    active: quizzes.filter((q) => getQuizStatusFromDates(q) === 'active').length,
    scheduled: quizzes.filter((q) => getQuizStatusFromDates(q) === 'scheduled').length,
    ended: quizzes.filter((q) => getQuizStatusFromDates(q) === 'ended').length,
  };
  
  // ============================================================================
  // RENDER - LOADING
  // ============================================================================
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Memuat daftar kuis...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER - ERROR
  // ============================================================================
  
  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={loadQuizzes}>Coba Lagi</Button>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER - MAIN
  // ============================================================================
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Daftar Kuis</h1>
          <p className="text-muted-foreground mt-1">
            Kelola kuis praktikum Anda
          </p>
        </div>
        
        <Button onClick={handleCreateQuiz} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Buat Kuis Baru
        </Button>
      </div>
      
      {/* Filters & Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kuis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Semua ({statusCounts.all})
              </SelectItem>
              <SelectItem value="draft">
                Draft ({statusCounts.draft})
              </SelectItem>
              <SelectItem value="scheduled">
                Terjadwal ({statusCounts.scheduled})
              </SelectItem>
              <SelectItem value="active">
                Aktif ({statusCounts.active})
              </SelectItem>
              <SelectItem value="ended">
                Selesai ({statusCounts.ended})
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Kelas Filter */}
          {kelasOptions.length > 0 && (
            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasOptions.map((kelasId) => (
                  <SelectItem key={kelasId} value={kelasId}>
                    Kelas {kelasId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>
      
      {/* Quiz List/Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tidak ada kuis</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || kelasFilter !== 'all'
                  ? 'Tidak ada kuis yang sesuai dengan filter'
                  : 'Belum ada kuis yang dibuat'}
              </p>
            </div>
            {!searchQuery && statusFilter === 'all' && kelasFilter === 'all' && (
              <Button onClick={handleCreateQuiz} className="gap-2">
                <Plus className="h-4 w-4" />
                Buat Kuis Pertama
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-4'
          )}
        >
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onUpdate={loadQuizzes}
              onDelete={loadQuizzes}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
      
      {/* Results Count */}
      {filteredQuizzes.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Menampilkan {filteredQuizzes.length} dari {quizzes.length} kuis
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get quiz status from dates
 */
function getQuizStatusFromDates(quiz: Kuis): StatusFilter {
  const isActive = (quiz as any).is_active ?? (quiz as any).status === 'active';
  
  if (!isActive) {
    return 'draft';
  }
  
  const now = new Date();
  const startDate = new Date(quiz.tanggal_mulai);
  const endDate = new Date(quiz.tanggal_selesai);
  
  if (now < startDate) {
    return 'scheduled';
  }
  
  if (now >= startDate && now <= endDate) {
    return 'active';
  }
  
  return 'ended';
}