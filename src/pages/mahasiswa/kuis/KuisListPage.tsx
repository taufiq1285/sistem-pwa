/**
 * KuisListPage - Mahasiswa
 *
 * Purpose: Display list of available quizzes for students
 * Route: /mahasiswa/kuis
 * Features: Filter by status, search, quiz cards, start quiz, view results
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileQuestion,
  Clock,
  Calendar,
  Trophy,
  Search,
  Play,
  Eye,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// API & Hooks
import { useAuth } from "@/lib/hooks/useAuth";
import { getUpcomingQuizzes } from "@/lib/api/kuis.api";
import type { UpcomingQuiz } from "@/types/kuis.types";
import { toast } from "sonner";

// Utils
import { cn } from "@/lib/utils";

type QuizStatus = "all" | "upcoming" | "ongoing" | "completed" | "missed";

export default function KuisListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<UpcomingQuiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<UpcomingQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuizStatus>("all");

  useEffect(() => {
    if (user?.mahasiswa?.id) loadQuizzes();
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    applyFilters();
  }, [quizzes, searchQuery, statusFilter]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (
      status &&
      ["all", "upcoming", "ongoing", "completed", "missed"].includes(status)
    ) {
      setStatusFilter(status as QuizStatus);
    }
  }, [searchParams]);

  const loadQuizzes = async () => {
    if (!user?.mahasiswa?.id) {
      setError("Data mahasiswa tidak ditemukan");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUpcomingQuizzes(user.mahasiswa.id);
      setQuizzes(data);
    } catch (err: any) {
      const errorMessage = err?.message || "Gagal memuat daftar kuis";
      setError(errorMessage);
      toast.error("Gagal memuat kuis", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quizzes];
    if (statusFilter !== "all")
      filtered = filtered.filter((quiz) => quiz.status === statusFilter);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.judul.toLowerCase().includes(query) ||
          quiz.nama_mk.toLowerCase().includes(query) ||
          quiz.kode_mk.toLowerCase().includes(query) ||
          quiz.nama_kelas.toLowerCase().includes(query),
      );
    }
    setFilteredQuizzes(filtered);
  };

  const handleStartQuiz = (quizId: string) =>
    navigate(`/mahasiswa/kuis/${quizId}/attempt`);
  const handleViewResults = (quizId: string) =>
    navigate(`/mahasiswa/kuis/${quizId}/result`);
  const handleStatusChange = (status: QuizStatus) => {
    setStatusFilter(status);
    setSearchParams({ status });
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Belum Dimulai
        </Badge>
      ),
      ongoing: (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Sedang Berlangsung
        </Badge>
      ),
      completed: (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Selesai
        </Badge>
      ),
      missed: <Badge variant="destructive">Terlewat</Badge>,
    };
    return (
      badges[status as keyof typeof badges] || (
        <Badge variant="outline">{status}</Badge>
      )
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      upcoming: <Clock className="h-4 w-4 text-blue-600" />,
      ongoing: <Play className="h-4 w-4 text-green-600" />,
      completed: <CheckCircle2 className="h-4 w-4 text-gray-600" />,
      missed: <XCircle className="h-4 w-4 text-red-600" />,
    };
    return (
      icons[status as keyof typeof icons] || (
        <FileQuestion className="h-4 w-4" />
      )
    );
  };

  const getCountByStatus = (status: QuizStatus): number => {
    if (status === "all") return quizzes.length;
    return quizzes.filter((q) => q.status === status).length;
  };

  const QuizCard = ({ quiz }: { quiz: UpcomingQuiz }) => {
    const canStart = quiz.status === "ongoing" && quiz.can_attempt;
    const isCompleted = quiz.status === "completed";
    const hasBestScore = typeof quiz.best_score === "number";
    const isPassed =
      hasBestScore && quiz.best_score! >= ((quiz as any).passing_grade || 0);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(quiz.status)}
                <Badge variant="outline" className="text-xs">
                  {(quiz as any).tipe_kuis || "Campuran"}
                </Badge>
              </div>
              <CardTitle className="text-lg mb-1">{quiz.judul}</CardTitle>
              <CardDescription>
                {quiz.kode_mk} - {quiz.nama_mk}
                {quiz.nama_kelas && ` • ${quiz.nama_kelas}`}
              </CardDescription>
            </div>
            <div className="flex-shrink-0">{getStatusIcon(quiz.status)}</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>{quiz.durasi_menit} menit</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileQuestion className="h-4 w-4" />
              <span>{quiz.total_soal} soal</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{formatDate(quiz.tanggal_mulai)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">
                {formatDate(quiz.tanggal_selesai)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">Percobaan</span>
            <span className="font-semibold">
              {quiz.attempts_used} / {quiz.max_attempts}
            </span>
          </div>

          {hasBestScore && (
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg text-sm",
                isPassed
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200",
              )}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={cn(
                    "h-4 w-4",
                    isPassed ? "text-green-600" : "text-red-600",
                  )}
                />
                <span className="font-medium">Nilai Terbaik</span>
              </div>
              <span
                className={cn(
                  "font-bold text-lg",
                  isPassed ? "text-green-700" : "text-red-700",
                )}
              >
                {quiz.best_score}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {canStart && (
              <Button
                onClick={() => handleStartQuiz(quiz.id)}
                className="flex-1 gap-2"
              >
                <Play className="h-4 w-4" />
                {quiz.attempts_used > 0 ? "Coba Lagi" : "Mulai Kuis"}
              </Button>
            )}
            {isCompleted && quiz.attempts_used > 0 && (
              <Button
                variant="outline"
                onClick={() => handleViewResults(quiz.id)}
                className="flex-1 gap-2"
              >
                <Eye className="h-4 w-4" />
                Lihat Hasil
              </Button>
            )}
            {quiz.status === "upcoming" && (
              <Button variant="outline" disabled className="flex-1">
                Belum Dimulai
              </Button>
            )}
            {quiz.status === "missed" && (
              <Button variant="outline" disabled className="flex-1">
                Terlewat
              </Button>
            )}
            {quiz.status === "ongoing" && !quiz.can_attempt && (
              <Button variant="outline" disabled className="flex-1">
                Percobaan Habis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={loadQuizzes}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Daftar Kuis</h1>
        <p className="text-muted-foreground mt-1">
          Kerjakan kuis sesuai jadwal yang tersedia
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["upcoming", "ongoing", "completed", "missed"] as const).map(
          (status, idx) => {
            const icons = [Clock, Play, CheckCircle2, XCircle];
            const colors = ["blue", "green", "gray", "red"];
            const labels = [
              "Akan Datang",
              "Berlangsung",
              "Selesai",
              "Terlewat",
            ];
            const Icon = icons[idx];
            return (
              <Card key={status}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${colors[idx]}-100 rounded-lg`}>
                      <Icon className={`h-5 w-5 text-${colors[idx]}-600`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {labels[idx]}
                      </p>
                      <p className="text-2xl font-bold">
                        {getCountByStatus(status)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kuis, mata kuliah, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => handleStatusChange(v as QuizStatus)}
            >
              <TabsList>
                <TabsTrigger value="all">
                  Semua ({getCountByStatus("all")})
                </TabsTrigger>
                <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
                <TabsTrigger value="ongoing">Berlangsung</TabsTrigger>
                <TabsTrigger value="completed">Selesai</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted rounded-full">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Tidak Ada Kuis</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Tidak ada kuis yang sesuai dengan pencarian Anda"
                    : statusFilter === "all"
                      ? "Belum ada kuis yang tersedia"
                      : `Tidak ada kuis dengan status "${statusFilter}"`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
