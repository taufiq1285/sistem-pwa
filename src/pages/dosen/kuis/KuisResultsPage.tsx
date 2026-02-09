/**
 * KuisResultsPage (Tugas Praktikum) - FIXED VERSION
 *
 * Purpose: Task results and analytics page for Dosen
 * Route: /dosen/kuis/:kuisId/results
 * Features: View statistics, student attempts, scores, question analysis, auto-sync nilai
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 *
 * FIXES APPLIED:
 * 1. Changed getAttemptByKuis to getAttemptsByKuis
 * 2. Changed all attempt.nilai to attempt.total_poin
 * 3. Changed all attempt.waktu_mulai to attempt.started_at
 * 4. Changed all attempt.waktu_selesai to attempt.submitted_at
 * 5. Changed all status === 'completed' to status === 'graded'
 * 6. Removed unused FileText import
 * 7. Updated all UI labels for "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Award,
  Clock,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// FIXED: Changed import
import { getKuisById, getAttemptsByKuis } from "@/lib/api/kuis.api";
import type { Kuis } from "@/types/kuis.types";
import type { AttemptWithStudent } from "@/lib/api/kuis.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface QuizStatistics {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTime: number; // in minutes
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisResultsPage() {
  const { kuisId } = useParams<{ kuisId: string }>();
  const navigate = useNavigate();

  // State
  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithStudent[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<
    AttemptWithStudent[]
  >([]);
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if quiz is CBT (auto-graded: pilihan_ganda, benar_salah, jawaban_singkat)
   */
  const isAutoGradedQuiz = (quizData: Kuis | null): boolean => {
    if (!quizData?.soal || quizData.soal.length === 0) return false;

    // ✅ DEBUG: Log soal types for troubleshooting
    console.log("🔍 [isAutoGradedQuiz] Checking quiz:", {
      judul: quizData.judul,
      soal_count: quizData.soal.length,
      soal_types: quizData.soal.map((s: any) => ({
        tipe_soal: s.tipe_soal,
        tipe: s.tipe,
      })),
    });

    // ✅ FIX: Check both database field "tipe" and TypeScript "tipe_soal"
    const result = quizData.soal.every((s: any) => {
      const tipe = s.tipe_soal || s.tipe; // Support both field names
      return tipe === "pilihan_ganda";
    });

    console.log("✅ [isAutoGradedQuiz] Result:", result);
    return result;
  };

  /**
   * Calculate duration between two dates
   */
  const calculateDuration = (start: string, end: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 1000 / 60);

    if (minutes < 60) {
      return `${minutes} menit`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}j ${remainingMinutes}m`;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load quiz and attempts on mount
   */
  useEffect(() => {
    if (!kuisId) return;
    loadQuizData();
  }, [kuisId]);

  /**
   * Apply search filter
   */
  useEffect(() => {
    applySearch();
  }, [attempts, searchQuery]);

  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================

  /**
   * Load quiz and attempts data
   */
  const loadQuizData = async () => {
    if (!kuisId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load quiz
      const quizData = await getKuisById(kuisId);
      setQuiz(quizData);

      // FIXED: Changed function name
      const attemptsData = await getAttemptsByKuis(kuisId);
      setAttempts(attemptsData);

      // Calculate statistics
      const stats = calculateStatistics(attemptsData, quizData);
      setStatistics(stats);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data hasil tugas praktikum");
      toast.error("Gagal memuat data hasil tugas praktikum", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply search filter
   */
  const applySearch = () => {
    if (!searchQuery) {
      setFilteredAttempts(attempts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = attempts.filter(
      (attempt) =>
        attempt.mahasiswa?.user?.full_name.toLowerCase().includes(query) ||
        attempt.mahasiswa?.nim.toLowerCase().includes(query),
    );

    setFilteredAttempts(filtered);
  };

  // ============================================================================
  // HANDLERS - ACTIONS
  // ============================================================================

  /**
   * View individual attempt
   */
  const handleViewAttempt = (attemptId: string) => {
    navigate(`/dosen/kuis/${kuisId}/attempt/${attemptId}`);
  };

  /**
   * Export results to CSV
   */
  const handleExport = () => {
    try {
      const csvContent = [
        [
          "NIM",
          "Nama",
          "Percobaan",
          "Nilai",
          "Status",
          "Waktu Mulai",
          "Waktu Selesai",
        ].join(","),
        ...filteredAttempts.map((attempt) =>
          [
            attempt.mahasiswa.nim,
            attempt.mahasiswa.user.full_name,
            attempt.attempt_number,
            // FIXED: Changed nilai to total_poin
            attempt.total_poin ?? 0,
            attempt.status,
            // FIXED: Changed waktu_mulai to started_at
            new Date(attempt.started_at).toLocaleString(),
            // FIXED: Changed waktu_selesai to submitted_at
            attempt.submitted_at
              ? new Date(attempt.submitted_at).toLocaleString()
              : "-",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hasil-tugas-${quiz?.judul || "quiz"}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Hasil tugas praktikum berhasil diexport");
    } catch (error) {
      toast.error("Gagal export hasil tugas praktikum");
    }
  };

  /**
   * Navigate back
   */
  const handleBack = () => {
    navigate("/dosen/kuis");
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
            <p className="text-muted-foreground">
              Memuat hasil tugas praktikum...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error || !quiz || !statistics) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Gagal memuat data hasil tugas praktikum"}
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button onClick={loadQuizData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  // Detect laporan mode from judul
  const laporanMode = quiz?.judul?.toLowerCase().includes("laporan") || false;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Tugas
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{quiz.judul}</h1>
            <p className="text-muted-foreground mt-1">
              Hasil & Analisis Tugas Praktikum
            </p>
          </div>

          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Hide for CBT mode */}
      {!isAutoGradedQuiz(quiz) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {laporanMode ? (
            // LAPORAN MODE: Show submission status
            <>
              {/* Total Submissions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Submission
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.completedAttempts} mahasiswa
                  </p>
                </CardContent>
              </Card>

              {/* Sudah Upload */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Sudah Upload
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.completedAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Laporan diterima
                  </p>
                </CardContent>
              </Card>

              {/* Belum Upload */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Belum Upload
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics.totalAttempts - statistics.completedAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Menunggu submission
                  </p>
                </CardContent>
              </Card>

              {/* Completion Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tingkat Penyelesaian
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalAttempts > 0
                      ? (
                          (statistics.completedAttempts /
                            statistics.totalAttempts) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </div>
                  <Progress
                    value={
                      statistics.totalAttempts > 0
                        ? (statistics.completedAttempts /
                            statistics.totalAttempts) *
                          100
                        : 0
                    }
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            // CBT MODE: Show score statistics
            <>
              {/* Total Students */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Peserta
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalAttempts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.completedAttempts} sudah mengerjakan
                  </p>
                </CardContent>
              </Card>

              {/* Average Score */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rata-rata Skor
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.averageScore.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    dari 100 poin
                  </p>
                  <Progress value={statistics.averageScore} className="mt-1" />
                </CardContent>
              </Card>

              {/* Highest Score */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Skor Tertinggi
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.highestScore}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Terendah: {statistics.lowestScore}
                  </p>
                </CardContent>
              </Card>

              {/* Pass Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tingkat Kelulusan
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.passRate.toFixed(0)}%
                  </div>
                  <Progress value={statistics.passRate} className="mt-2" />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* For CBT mode: Show attempts table directly (no tabs) */}
      {isAutoGradedQuiz(quiz) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Percobaan</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari mahasiswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAttempts.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Tidak ada hasil yang sesuai"
                    : "Belum ada mahasiswa yang mengerjakan tugas ini"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Skor</TableHead>
                    <TableHead className="text-right">Waktu</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => {
                    const isPassed =
                      (attempt.total_poin || 0) >=
                      ((quiz as any).passing_grade || 60);

                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {attempt.mahasiswa?.user?.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase() || "M"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {attempt.mahasiswa?.user?.full_name ||
                                  "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {attempt.mahasiswa?.nim || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {attempt.status === "graded" ||
                          (attempt.status === "submitted" &&
                            isAutoGradedQuiz(quiz)) ? (
                            <Badge
                              variant={isPassed ? "default" : "destructive"}
                            >
                              {isPassed ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Lulus
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Tidak Lulus
                                </>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Sedang Mengerjakan
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-semibold",
                              isPassed ? "text-green-600" : "text-red-600",
                            )}
                          >
                            {attempt.total_poin || 0}
                          </span>
                          <span className="text-muted-foreground">
                            {" / "}
                            {(quiz as any).total_poin || 100}
                          </span>
                        </TableCell>

                        <TableCell className="text-right text-sm text-muted-foreground">
                          {attempt.submitted_at && attempt.started_at
                            ? calculateDuration(
                                attempt.started_at,
                                attempt.submitted_at,
                              )
                            : "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttempt(attempt.id)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
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
      )}

      {/* Tabs - Hide for CBT mode */}
      {!isAutoGradedQuiz(quiz) && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attempts">
              Submissions ({attempts.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Tugas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {laporanMode ? (
                  // LAPORAN MODE: Show submission info
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tipe Tugas</Label>
                      <p className="text-2xl font-bold">Laporan Praktikum</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Total Mahasiswa
                      </Label>
                      <p className="text-2xl font-bold">
                        {statistics.totalAttempts}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Sudah Submit
                      </Label>
                      <p className="text-2xl font-bold text-green-600">
                        {statistics.completedAttempts}
                      </p>
                    </div>
                  </div>
                ) : (
                  // CBT MODE: Show score info
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Total Soal</Label>
                      <p className="text-2xl font-bold">
                        {(quiz as any).total_soal || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Poin</Label>
                      <p className="text-2xl font-bold">
                        {(quiz as any).total_poin || 100}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durasi</Label>
                      <p className="text-2xl font-bold">
                        {(quiz as any).durasi ||
                          (quiz as any).durasi_menit ||
                          0}{" "}
                        menit
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Waktu Rata-rata
                      </Label>
                      <p className="text-2xl font-bold">
                        {statistics.averageTime.toFixed(0)} menit
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Distribution - Only for CBT */}
            {!laporanMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Skor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getScoreDistribution(attempts).map((range) => (
                      <div key={range.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {range.label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {range.count} mahasiswa
                          </span>
                        </div>
                        <Progress
                          value={
                            attempts.length > 0
                              ? (range.count / attempts.length) * 100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attempts Tab */}
          <TabsContent value="attempts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Percobaan</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mahasiswa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAttempts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Tidak ada hasil yang sesuai"
                        : "Belum ada mahasiswa yang mengerjakan tugas ini"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahasiswa</TableHead>
                        <TableHead>Status</TableHead>
                        {!laporanMode && (
                          <>
                            <TableHead className="text-right">Skor</TableHead>
                            <TableHead className="text-right">Waktu</TableHead>
                          </>
                        )}
                        {laporanMode && <TableHead>Waktu Submit</TableHead>}
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttempts.map((attempt) => {
                        // FIXED: Changed nilai to total_poin
                        const isPassed =
                          (attempt.total_poin || 0) >=
                          ((quiz as any).passing_grade || 60);

                        return (
                          <TableRow key={attempt.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {attempt.mahasiswa?.user?.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase() || "M"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {attempt.mahasiswa?.user?.full_name ||
                                      "Unknown"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {attempt.mahasiswa?.nim || "-"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {laporanMode ? (
                                // LAPORAN MODE: Show upload status
                                attempt.status === "submitted" ||
                                attempt.status === "graded" ? (
                                  <Badge variant="default">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Sudah Upload
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Belum Upload
                                  </Badge>
                                )
                              ) : (
                                // CBT MODE: Show pass/fail status
                                <>
                                  {attempt.status === "graded" ? (
                                    <Badge
                                      variant={
                                        isPassed ? "default" : "destructive"
                                      }
                                    >
                                      {isPassed ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Lulus
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Tidak Lulus
                                        </>
                                      )}
                                    </Badge>
                                  ) : attempt.status === "submitted" ? (
                                    <Badge variant="secondary">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Menunggu Penilaian
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Sedang Dikerjakan
                                    </Badge>
                                  )}
                                </>
                              )}
                            </TableCell>

                            {!laporanMode && (
                              <>
                                <TableCell className="text-right">
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      isPassed
                                        ? "text-green-600"
                                        : "text-red-600",
                                    )}
                                  >
                                    {/* FIXED: Changed nilai to total_poin */}
                                    {attempt.total_poin || 0}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" / "}
                                    {(quiz as any).total_poin || 100}
                                  </span>
                                </TableCell>

                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {/* FIXED: Changed property names */}
                                  {attempt.submitted_at && attempt.started_at
                                    ? calculateDuration(
                                        attempt.started_at,
                                        attempt.submitted_at,
                                      )
                                    : "-"}
                                </TableCell>
                              </>
                            )}

                            {laporanMode && (
                              <TableCell className="text-sm text-muted-foreground">
                                {attempt.submitted_at
                                  ? new Date(
                                      attempt.submitted_at,
                                    ).toLocaleString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </TableCell>
                            )}

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAttempt(attempt.id)}
                                title={
                                  laporanMode
                                    ? "Lihat & Nilai Laporan"
                                    : "Lihat Detail"
                                }
                              >
                                <Eye className="h-4 w-4" />
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

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Analisis Per Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Fitur analisis per soal akan segera tersedia
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate quiz statistics
 */
function calculateStatistics(
  attempts: AttemptWithStudent[],
  quiz: Kuis,
): QuizStatistics {
  // FIXED: Changed status check from 'completed' to 'graded'
  const completedAttempts = attempts.filter((a) => a.status === "graded");

  if (completedAttempts.length === 0) {
    return {
      totalAttempts: attempts.length,
      completedAttempts: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      averageTime: 0,
    };
  }

  // FIXED: Changed nilai to total_poin
  const scores = completedAttempts.map((a) => a.total_poin || 0);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  const passingGrade = (quiz as any).passing_grade || 60;
  const passedCount = completedAttempts.filter(
    // FIXED: Changed nilai to total_poin
    (a) => (a.total_poin || 0) >= passingGrade,
  ).length;
  const passRate = (passedCount / completedAttempts.length) * 100;

  // Calculate average time
  // FIXED: Changed property names
  const durations = completedAttempts
    .filter((a) => a.started_at && a.submitted_at)
    .map((a) => {
      const start = new Date(a.started_at).getTime();
      const end = new Date(a.submitted_at!).getTime();
      return (end - start) / 1000 / 60; // in minutes
    });

  const averageTime =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    totalAttempts: attempts.length,
    completedAttempts: completedAttempts.length,
    averageScore,
    highestScore,
    lowestScore,
    passRate,
    averageTime,
  };
}

/**
 * Get score distribution
 */
function getScoreDistribution(attempts: AttemptWithStudent[]) {
  // FIXED: Changed status check from 'completed' to 'graded'
  const completed = attempts.filter((a) => a.status === "graded");

  const ranges = [
    { label: "91-100", min: 91, max: 100, count: 0 },
    { label: "81-90", min: 81, max: 90, count: 0 },
    { label: "71-80", min: 71, max: 80, count: 0 },
    { label: "61-70", min: 61, max: 70, count: 0 },
    { label: "0-60", min: 0, max: 60, count: 0 },
  ];

  completed.forEach((attempt) => {
    // FIXED: Changed nilai to total_poin
    const score = attempt.total_poin || 0;
    const range = ranges.find((r) => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  return ranges;
}

/**
 * Calculate duration between two dates
 */
function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 1000 / 60);

  if (minutes < 60) {
    return `${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}j ${remainingMinutes}m`;
}

/**
 * Label component helper
 */
function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
