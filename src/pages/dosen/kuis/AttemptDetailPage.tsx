/**
 * AttemptDetailPage - Detail Hasil Tugas Mahasiswa
 *
 * Purpose: Melihat dan menilai hasil tes/laporan mahasiswa
 * Route: /dosen/kuis/:kuisId/attempt/:attemptId
 * Features:
 * - Melihat jawaban mahasiswa (pilihan ganda, essay, file upload)
 * - Grading manual untuk essay/laporan
 * - Preview file upload
 * - Memberikan feedback
 * - Auto-grading untuk pilihan ganda
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  Download,
  FileText,
  Award,
  AlertCircle,
} from "lucide-react";
import logger from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getAttemptById,
  gradeAnswer,
  finalizeAttemptGrading,
} from "@/lib/api/kuis.api";
import { syncNilaiPraktikumFromAttempts } from "@/lib/api/nilai.api";
import { notifyMahasiswaTugasGraded } from "@/lib/api/notification.api";
import { openLaporanFileInNewTab } from "@/lib/api/laporan-storage.api";
import { supabase } from "@/lib/supabase/client";
import type { AttemptKuis, Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL_LABELS, ATTEMPT_STATUS_LABELS } from "@/types/kuis.types";
import { checkAnswerCorrect } from "@/lib/utils/quiz-scoring";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CardListSkeleton } from "@/components/common";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================================
// TYPES
// ============================================================================

interface GradingState {
  [jawabanId: string]: {
    poin_diperoleh: number;
    feedback: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AttemptDetailPage() {
  const { kuisId, attemptId } = useParams<{
    kuisId: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();

  // State
  const [attempt, setAttempt] = useState<AttemptKuis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradingState, setGradingState] = useState<GradingState>({});
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (!attemptId) return;
    loadAttemptDetail();
  }, [attemptId]);

  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================

  const loadAttemptDetail = async () => {
    if (!attemptId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAttemptById(attemptId);
      setAttempt(data);

      // Initialize grading state from existing jawaban
      const initialGrading: GradingState = {};
      data.jawaban?.forEach((jawaban) => {
        initialGrading[jawaban.id] = {
          poin_diperoleh: jawaban.poin_diperoleh || 0,
          feedback: jawaban.feedback || "",
        };
      });
      setGradingState(initialGrading);
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail hasil tugas");
      toast.error("Gagal memuat data", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS - GRADING
  // ============================================================================

  const handleGradeChange = (
    jawabanId: string,
    field: "poin_diperoleh" | "feedback",
    value: number | string,
  ) => {
    setGradingState((prev) => ({
      ...prev,
      [jawabanId]: {
        ...prev[jawabanId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveGrading = async () => {
    if (!attempt?.jawaban) return;

    if (!navigator.onLine) {
      toast.error(
        "Tidak dapat menyimpan penilaian saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    setIsSaving(true);

    try {
      // Save grading for each jawaban
      const promises = attempt.jawaban.map((jawaban) => {
        const grading = gradingState[jawaban.id];
        if (!grading) return Promise.resolve();

        const poinDiperoleh = grading.poin_diperoleh;
        const maxPoin = getSoalForJawaban(jawaban)?.poin || 0;
        const isCorrect = poinDiperoleh === maxPoin;

        return gradeAnswer(
          jawaban.id,
          poinDiperoleh,
          isCorrect,
          grading.feedback,
        );
      });

      await Promise.all(promises);
      const finalizedAttempt = await finalizeAttemptGrading(attempt.id);
      const scoreAfterSave = Number(finalizedAttempt.total_poin || 0);

      if (finalizedAttempt.kuis?.kelas_id) {
        await syncNilaiPraktikumFromAttempts(
          finalizedAttempt.mahasiswa_id,
          finalizedAttempt.kuis.kelas_id,
          finalizedAttempt.kuis.mata_kuliah_id ?? null,
        );
      }

      if (finalizedAttempt.status === "graded") {
        await notifyMahasiswaGradeResult(
          finalizedAttempt,
          scoreAfterSave,
        ).catch((notifError) => {
          console.error(
            "Failed to notify mahasiswa after tugas grading:",
            notifError,
          );
        });
      } else {
        logger.debug(
          "[AttemptDetailPage] Notification skipped because attempt is not graded yet:",
          finalizedAttempt.id,
          finalizedAttempt.status,
        );
      }

      toast.success("Penilaian berhasil disimpan");
      setHasChanges(false);

      // Reload data to get updated attempt status
      await loadAttemptDetail();
    } catch (err: any) {
      toast.error("Gagal menyimpan penilaian", {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (!confirm("Ada perubahan yang belum disimpan. Yakin ingin kembali?")) {
        return;
      }
    }
    navigate(`/dosen/kuis/${kuisId}/results`);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const calculateTotalScore = () => {
    if (!attempt?.jawaban) return 0;
    return attempt.jawaban.reduce((sum, jawaban) => {
      const grading = gradingState[jawaban.id];
      const soal = getSoalForJawaban(jawaban);
      const derivedAutoScore =
        soal && checkAnswer(jawaban, soal) ? soal.poin || 0 : 0;

      return (
        sum +
        (grading?.poin_diperoleh ??
          jawaban.poin_diperoleh ??
          derivedAutoScore ??
          0)
      );
    }, 0);
  };

  const calculateMaxScore = () => {
    if (!attempt?.kuis?.soal) return 0;
    return attempt.kuis.soal.reduce((sum, soal) => sum + soal.poin, 0);
  };

  const isAutoGraded = (soal: Soal) => {
    return (
      soal.tipe_soal === "pilihan_ganda" ||
      soal.tipe_soal === "benar_salah" ||
      soal.tipe_soal === "jawaban_singkat"
    );
  };

  const checkAnswer = (jawaban: Jawaban, soal: Soal) => {
    if (typeof jawaban.is_correct === "boolean") {
      return jawaban.is_correct;
    }

    if (isAutoGraded(soal)) {
      return checkAnswerCorrect(
        soal,
        jawaban.jawaban || jawaban.jawaban_mahasiswa || "",
      );
    }
    return false;
  };

  const getSoalForJawaban = (jawaban: Jawaban): Soal | null => {
    return (
      attempt?.kuis?.soal?.find((soal) => soal.id === jawaban.soal_id) ||
      jawaban.soal ||
      null
    );
  };

  const getResolvedFileSubmission = (jawaban: Jawaban) => {
    const fallbackUrl =
      (typeof jawaban.jawaban_mahasiswa === "string" &&
      jawaban.jawaban_mahasiswa.trim()
        ? jawaban.jawaban_mahasiswa
        : null) ||
      (typeof jawaban.jawaban === "string" && jawaban.jawaban.trim()
        ? jawaban.jawaban
        : null);

    const url = jawaban.file_url || fallbackUrl;
    const derivedName = url
      ? url.split("/").pop()?.split("?")[0] || "Dokumen Laporan"
      : "Dokumen Laporan";

    return {
      url,
      name: jawaban.file_name || derivedName,
      type: jawaban.file_type || "PDF",
      size: jawaban.file_size || 0,
    };
  };

  const handleOpenResolvedFile = async (jawaban: Jawaban) => {
    const submission = getResolvedFileSubmission(jawaban);

    try {
      await openLaporanFileInNewTab({
        fileUrl: submission.url,
        fileType: submission.type,
        fileName: submission.name,
      });
    } catch (error: any) {
      console.error("[AttemptDetailPage] Failed to open laporan file:", error);
      toast.error("File laporan belum tersedia untuk dibuka.", {
        description: error?.message,
      });
    }
  };

  const notifyMahasiswaGradeResult = async (
    currentAttempt: AttemptKuis,
    nilaiAkhir: number,
  ) => {
    const { data: mahasiswaData, error } = await supabase
      .from("mahasiswa")
      .select("user_id")
      .eq("id", currentAttempt.mahasiswa_id)
      .single();

    if (error) throw error;
    if (!mahasiswaData?.user_id) return;

    await notifyMahasiswaTugasGraded(
      mahasiswaData.user_id,
      currentAttempt.kuis?.judul || "Tugas Praktikum",
      nilaiAkhir,
      currentAttempt.id,
      currentAttempt.kuis_id,
      (currentAttempt.kuis as any)?.tipe_kuis ?? null,
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-20 w-full skeleton-shimmer rounded-xl" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="h-[200px] w-full skeleton-shimmer rounded-xl" />
            <div className="h-[150px] w-full skeleton-shimmer rounded-xl" />
          </div>
          <CardListSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex items-center justify-between rounded-2xl p-5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>

        <Alert variant="destructive" className="rounded-2xl border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Data tidak ditemukan"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const mahasiswa = attempt.mahasiswa;
  const kuis = attempt.kuis;
  const kuisMataKuliah =
    (kuis as any)?.mata_kuliah || (kuis as any)?.kelas?.mata_kuliah || null;
  const namaKelas = (kuis as any)?.kelas?.nama_kelas || "-";
  const totalScore = calculateTotalScore();
  const maxScore = calculateMaxScore();
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const correctAnswersCount =
    attempt.jawaban?.filter((jawaban) => {
      const soal = getSoalForJawaban(jawaban);
      return soal ? checkAnswer(jawaban, soal) : false;
    }).length || 0;

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Detail Hasil Mahasiswa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mahasiswa?.user?.full_name || "Mahasiswa"} | {kuis?.judul}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          {hasChanges && (
            <Button
              onClick={handleSaveGrading}
              disabled={isSaving || !navigator.onLine}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Penilaian
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {mahasiswa?.user?.full_name?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {mahasiswa?.user?.full_name || "Unknown"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    NIM: {mahasiswa?.nim || "-"}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge
                    status={
                      attempt.status === "graded"
                        ? "success"
                        : attempt.status === "submitted"
                          ? "warning"
                          : "offline"
                    }
                    pulse={false}
                    className="text-xs"
                  >
                    {ATTEMPT_STATUS_LABELS[attempt.status]}
                  </StatusBadge>
                </div>
                {attempt.started_at && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Mulai</span>
                    <span className="text-right font-medium">
                      {format(new Date(attempt.started_at), "dd MMM, HH:mm", {
                        locale: localeId,
                      })}
                    </span>
                  </div>
                )}
                {attempt.submitted_at && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Dikumpulkan</span>
                    <span className="text-right font-medium">
                      {format(new Date(attempt.submitted_at), "dd MMM, HH:mm", {
                        locale: localeId,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10">
                  <FileText className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Info Tugas
                </span>
              </div>

              <p className="mb-1 text-sm font-semibold leading-snug text-foreground">
                {kuis?.judul}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {kuis?.deskripsi || "Tidak ada deskripsi"}
              </p>

              <Separator className="my-3" />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Mata Kuliah</span>
                  <span className="max-w-[60%] truncate text-right font-medium">
                    {kuisMataKuliah?.nama_mk || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Kelas</span>
                  <span className="font-medium">{namaKelas}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Soal</span>
                  <span className="font-medium">{kuis?.soal?.length || 0}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Durasi</span>
                  <span className="font-medium">
                    {kuis?.durasi_menit || 0} menit
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Nilai
                </span>
              </div>

              <div className="py-3 text-center">
                <div className="text-5xl font-bold tabular-nums text-foreground">
                  {totalScore.toFixed(0)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  dari {maxScore} poin
                </div>
              </div>

              <div className="mb-4 mt-3">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>Persentase</span>
                  <span className="font-semibold text-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      percentage >= 70 ? "bg-success" : "bg-destructive",
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-success/20 bg-success/8 p-3 text-center">
                  <div className="text-2xl font-bold text-success">
                    {correctAnswersCount}
                  </div>
                  <div className="mt-0.5 text-xs text-success/70">Benar</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {(kuis?.soal?.length || 0) - correctAnswersCount}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Salah/Belum Dinilai
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          {kuis?.soal?.every(
            (currentSoal) => currentSoal.tipe_soal === "pilihan_ganda",
          ) ? (
            <Card className="overflow-hidden border-border/60 bg-white/95 shadow-sm dark:bg-card">
              <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {mahasiswa?.user?.full_name?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {mahasiswa?.user?.full_name || "Mahasiswa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mahasiswa?.nim || "-"} |{" "}
                    {attempt.submitted_at
                      ? format(
                          new Date(attempt.submitted_at),
                          "dd MMM yyyy, HH:mm",
                          {
                            locale: localeId,
                          },
                        )
                      : "Belum dikumpulkan"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-primary/15 bg-primary/5 px-5 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm text-primary">
                  Nilai dihitung otomatis oleh sistem berdasarkan jawaban benar.
                </p>
              </div>

              <div className="grid border-b border-border/40 md:grid-cols-3">
                <div className="border-b border-border/40 px-5 py-4 md:border-b-0 md:border-r">
                  <p className="text-xs text-muted-foreground">Nilai akhir</p>
                  <p className="mt-1 text-3xl font-bold text-primary">
                    {percentage.toFixed(0)}%
                  </p>
                </div>
                <div className="border-b border-border/40 px-5 py-4 md:border-b-0 md:border-r">
                  <p className="text-xs text-muted-foreground">Jawaban benar</p>
                  <p className="mt-1 text-3xl font-bold text-success">
                    {correctAnswersCount}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-muted-foreground">Jawaban salah</p>
                  <p className="mt-1 text-3xl font-bold text-destructive">
                    {(kuis?.soal?.length || 0) - correctAnswersCount}
                  </p>
                </div>
              </div>

              <div className="border-b border-border/40 px-5 py-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Persentase kebenaran</span>
                  <span className="font-semibold text-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      percentage >= 70 ? "bg-success" : "bg-destructive",
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="px-5 pb-3 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Rincian per soal
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Review jawaban mahasiswa terhadap kunci jawaban.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {kuis?.soal?.length || 0} soal
                  </Badge>
                </div>

                <div className="space-y-2">
                  {kuis?.soal?.map((soal, index) => {
                    const jawaban = attempt.jawaban?.find(
                      (currentJawaban) => currentJawaban.soal_id === soal.id,
                    );
                    const isCorrect = jawaban
                      ? checkAnswer(jawaban, soal)
                      : false;

                    return (
                      <div
                        key={soal.id}
                        className="flex flex-col gap-3 rounded-xl border border-border/50 px-4 py-4 md:flex-row md:items-center"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium text-foreground">
                            {soal.pertanyaan}
                          </p>
                          {soal.penjelasan && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {soal.penjelasan}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-left md:min-w-[200px] md:text-right">
                          <span
                            className={cn(
                              "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium md:ml-auto",
                              isCorrect
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive",
                            )}
                          >
                            {isCorrect ? "Benar" : "Salah"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Jawaban:{" "}
                            <span className="font-medium text-foreground">
                              {jawaban?.jawaban_mahasiswa || "Tidak dijawab"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kunci:{" "}
                            <span className="font-medium text-primary">
                              {soal.jawaban_benar}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-white/80 px-4 py-3 shadow-sm dark:bg-card/80">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Jawaban Mahasiswa
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Review jawaban dan beri nilai sesuai kebutuhan tugas.
                  </p>
                </div>
                <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {kuis?.soal?.length || 0} soal
                </div>
              </div>

              {kuis?.soal?.map((soal, index) => {
                const jawaban = attempt.jawaban?.find(
                  (j) => j.soal_id === soal.id,
                );
                const grading = jawaban ? gradingState[jawaban.id] : null;

                return (
                  <section
                    key={soal.id}
                    className="overflow-hidden rounded-2xl border border-border/50 bg-white/95 shadow-sm dark:bg-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 bg-slate-50/80 px-5 py-4 dark:bg-muted/20">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {TIPE_SOAL_LABELS[soal.tipe_soal]}
                            </Badge>
                            <Badge variant="outline">{soal.poin} poin</Badge>
                          </div>
                          <p className="text-sm font-semibold leading-6 text-foreground sm:text-base">
                            {soal.pertanyaan}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      {soal.tipe_soal === "essay" && jawaban && (
                        <>
                          <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                            <Label className="mb-2 block text-xs text-muted-foreground">
                              Jawaban Mahasiswa
                            </Label>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {jawaban.jawaban_mahasiswa || "Tidak dijawab"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                              Penilaian Dosen
                            </p>
                            <div className="grid gap-3 md:grid-cols-5">
                              <div className="md:col-span-1">
                                <Label
                                  htmlFor={`poin-${jawaban.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Poin (maks. {soal.poin})
                                </Label>
                                <Input
                                  id={`poin-${jawaban.id}`}
                                  type="number"
                                  min="0"
                                  max={soal.poin}
                                  value={grading?.poin_diperoleh || 0}
                                  onChange={(e) =>
                                    handleGradeChange(
                                      jawaban.id,
                                      "poin_diperoleh",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="mt-1.5 h-11 text-center text-lg font-bold"
                                />
                              </div>
                              <div className="md:col-span-4">
                                <Label
                                  htmlFor={`feedback-${jawaban.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Catatan / feedback untuk mahasiswa
                                </Label>
                                <Textarea
                                  id={`feedback-${jawaban.id}`}
                                  value={grading?.feedback || ""}
                                  onChange={(e) =>
                                    handleGradeChange(
                                      jawaban.id,
                                      "feedback",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Tulis catatan atau feedback untuk mahasiswa..."
                                  className="mt-1.5 resize-none text-sm"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {soal.tipe_soal === "file_upload" && jawaban && (
                        <>
                          {getResolvedFileSubmission(jawaban).url ? (
                            <div className="overflow-hidden rounded-2xl border border-border/60">
                              <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 border-b border-border/50 bg-muted/20 px-6 py-8 text-center">
                                <div className="flex h-16 w-14 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-bold text-destructive">
                                  PDF
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {getResolvedFileSubmission(jawaban).name}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {getResolvedFileSubmission(jawaban).type} |{" "}
                                    {getResolvedFileSubmission(jawaban).size
                                      ? (
                                          getResolvedFileSubmission(jawaban)
                                            .size / 1024
                                        ).toFixed(1)
                                      : 0}{" "}
                                    KB
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() =>
                                    void handleOpenResolvedFile(jawaban)
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                  Buka dokumen
                                </Button>
                              </div>

                              <div className="space-y-4 p-5">
                                <div>
                                  <Label
                                    htmlFor={`feedback-${jawaban.id}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Catatan / feedback untuk mahasiswa
                                  </Label>
                                  <Textarea
                                    id={`feedback-${jawaban.id}`}
                                    value={grading?.feedback || ""}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        jawaban.id,
                                        "feedback",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Tulis catatan penilaian..."
                                    className="mt-1.5 resize-none text-sm"
                                    rows={2}
                                  />
                                </div>

                                <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/15 px-4 py-4 sm:flex-row sm:items-center">
                                  <span className="text-sm text-muted-foreground">
                                    Nilai
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <Input
                                      id={`poin-${jawaban.id}`}
                                      type="number"
                                      min="0"
                                      max={soal.poin}
                                      value={grading?.poin_diperoleh || 0}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          jawaban.id,
                                          "poin_diperoleh",
                                          Number(e.target.value),
                                        )
                                      }
                                      className="h-11 w-24 text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      / {soal.poin}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : jawaban.jawaban_mahasiswa ? (
                            <>
                              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                                <Label className="mb-2 block text-xs text-muted-foreground">
                                  Jawaban Mahasiswa (diketik)
                                </Label>
                                <p className="whitespace-pre-wrap text-sm text-foreground">
                                  {jawaban.jawaban_mahasiswa}
                                </p>
                              </div>

                              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                                  Penilaian Dosen
                                </p>
                                <div className="grid gap-3 md:grid-cols-5">
                                  <div className="md:col-span-1">
                                    <Label
                                      htmlFor={`poin-${jawaban.id}`}
                                      className="text-xs text-muted-foreground"
                                    >
                                      Poin (maks. {soal.poin})
                                    </Label>
                                    <Input
                                      id={`poin-${jawaban.id}`}
                                      type="number"
                                      min="0"
                                      max={soal.poin}
                                      value={grading?.poin_diperoleh || 0}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          jawaban.id,
                                          "poin_diperoleh",
                                          Number(e.target.value),
                                        )
                                      }
                                      className="mt-1.5 h-11 text-center text-lg font-bold"
                                    />
                                  </div>
                                  <div className="md:col-span-4">
                                    <Label
                                      htmlFor={`feedback-${jawaban.id}`}
                                      className="text-xs text-muted-foreground"
                                    >
                                      Catatan / feedback untuk mahasiswa
                                    </Label>
                                    <Textarea
                                      id={`feedback-${jawaban.id}`}
                                      value={grading?.feedback || ""}
                                      onChange={(e) =>
                                        handleGradeChange(
                                          jawaban.id,
                                          "feedback",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Tulis catatan atau feedback untuk mahasiswa..."
                                      className="mt-1.5 resize-none text-sm"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <Alert variant="destructive" className="rounded-xl">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Mahasiswa tidak mengirimkan file atau jawaban
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )}

                      {jawaban?.feedback && (
                        <Alert className="border-warning/30 bg-warning/10">
                          <AlertDescription>
                            <strong>Feedback Dosen:</strong> {jawaban.feedback}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {hasChanges && (
            <div className="sticky bottom-4 z-20">
              <Card className="border-warning/30 bg-warning/5 shadow-xl dark:border-warning/20">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      Ada perubahan penilaian yang belum disimpan
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveGrading}
                    disabled={isSaving || !navigator.onLine}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Penilaian
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
