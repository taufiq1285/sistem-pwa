/**
 * AttemptDetailPage - Detail Hasil Tugas Mahasiswa (REDESIGN)
 *
 * Purpose: Melihat dan menilai hasil tes/laporan mahasiswa
 * Route: /dosen/kuis/:kuisId/attempt/:attemptId
 *
 * Perubahan desain:
 * - Layout dua kolom: sidebar info kiri + konten utama kanan
 * - CBT: read-only, nilai otomatis, rincian per soal yang clean
 * - Laporan: dokumen PDF menonjol, form penilaian terintegrasi
 * - Header sticky dengan progress simpan
 * - Soal CBT menggunakan accordion ringan agar tidak penuh
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
  User,
  Clock,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getAttemptById } from "@/lib/api/kuis.api";
import { gradeAnswer } from "@/lib/api/kuis.api";
import { notifyMahasiswaTugasGraded } from "@/lib/api/notification.api";
import { syncNilaiPraktikumFromAttempts } from "@/lib/api/nilai.api";
import { supabase } from "@/lib/supabase/client";
import type { AttemptKuis, Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL_LABELS, ATTEMPT_STATUS_LABELS } from "@/types/kuis.types";
import { checkAnswerCorrect } from "@/lib/utils/quiz-scoring";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
// SUB-COMPONENTS
// ============================================================================

/** Kartu ringkasan nilai di sidebar */
function ScoreSummaryCard({
  totalScore,
  maxScore,
  benar,
  salah,
  isAutoGraded,
}: {
  totalScore: number;
  maxScore: number;
  benar: number;
  salah: number;
  isAutoGraded: boolean;
}) {
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const color =
    pct >= 80
      ? "text-success"
      : pct >= 60
        ? "text-warning"
        : "text-destructive";
  const barColor =
    pct >= 80
      ? "bg-success"
      : pct >= 60
        ? "bg-warning"
        : "bg-destructive";

  return (
    <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Nilai</span>
          {isAutoGraded && (
            <Badge variant="secondary" className="ml-auto text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Otomatis
            </Badge>
          )}
        </div>

        {/* Big score */}
        <div className="text-center py-3">
          <div className={cn("text-5xl font-bold tabular-nums", color)}>
            {totalScore.toFixed(0)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            dari {maxScore} poin
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Persentase</span>
            <span className={cn("font-semibold", color)}>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <Separator className="my-3" />

        {/* Benar / Salah */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-success/8 border border-success/20 p-3 text-center">
            <div className="text-2xl font-bold text-success">{benar}</div>
            <div className="text-xs text-success/70 mt-0.5">Benar</div>
          </div>
          <div className="rounded-lg bg-destructive/8 border border-destructive/20 p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{salah}</div>
            <div className="text-xs text-destructive/70 mt-0.5">Salah</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Info mahasiswa di sidebar */
function StudentInfoCard({
  mahasiswa,
  attempt,
}: {
  mahasiswa: any;
  attempt: AttemptKuis;
}) {
  const initials =
    mahasiswa?.user?.full_name
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  return (
    <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {mahasiswa?.user?.full_name || "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              NIM: {mahasiswa?.nim || "—"}
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
              <span className="font-medium text-right">
                {format(new Date(attempt.started_at), "dd MMM, HH:mm", {
                  locale: localeId,
                })}
              </span>
            </div>
          )}

          {attempt.submitted_at && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Dikumpulkan</span>
              <span className="font-medium text-right">
                {format(new Date(attempt.submitted_at), "dd MMM, HH:mm", {
                  locale: localeId,
                })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Info tugas di sidebar */
function QuizInfoCard({ kuis }: { kuis: any }) {
  const namaKelas = kuis?.kelas?.nama_kelas || "—";
  const namaMK = kuis?.mata_kuliah?.nama_mk || kuis?.kelas?.mata_kuliah?.nama_mk || "—";

  return (
    <Card className="border-border/60 bg-white/95 shadow-sm dark:bg-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10">
            <FileText className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Info Tugas
          </span>
        </div>

        <p className="font-semibold text-foreground text-sm mb-1 leading-snug">
          {kuis?.judul || "—"}
        </p>
        {kuis?.deskripsi && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {kuis.deskripsi}
          </p>
        )}

        <Separator className="my-3" />

        <div className="space-y-2 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Mata Kuliah</span>
            <span className="font-medium text-right truncate max-w-[60%]">{namaMK}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Kelas</span>
            <span className="font-medium text-right">{namaKelas}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Soal</span>
            <span className="font-medium">{kuis?.soal?.length || 0} soal</span>
          </div>
          {kuis?.durasi_menit && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Durasi</span>
              <span className="font-medium">{kuis.durasi_menit} menit</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Item soal CBT — read-only, collapsible */
function CbtSoalItem({
  soal,
  jawaban,
  index,
}: {
  soal: Soal;
  jawaban: Jawaban | undefined;
  index: number;
}) {
  const [open, setOpen] = useState(index < 5); // 5 soal pertama terbuka

  const isCorrect = jawaban
    ? checkAnswerCorrect(soal, jawaban.jawaban || jawaban.jawaban_mahasiswa || "")
    : false;

  const jawabanMhs = jawaban?.jawaban_mahasiswa || jawaban?.jawaban || "—";

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        isCorrect
          ? "border-success/30 bg-success/4"
          : "border-border/50 bg-muted/30",
      )}
    >
      {/* Header soal */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Nomor + status */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isCorrect
              ? "bg-success/15 text-success"
              : "bg-destructive/12 text-destructive",
          )}
        >
          {index + 1}
        </div>

        {/* Pertanyaan */}
        <p className="flex-1 text-sm font-medium text-foreground line-clamp-1">
          {soal.pertanyaan}
        </p>

        {/* Icon benar/salah */}
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {soal.poin} poin
          </span>
          {isCorrect ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-success" />
          ) : (
            <XCircle className="h-4.5 w-4.5 text-destructive" />
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Body soal */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <Separator />

          {/* Pertanyaan lengkap */}
          <p className="text-sm text-foreground">{soal.pertanyaan}</p>

          {/* Opsi pilihan ganda */}
          {soal.opsi && soal.opsi.length > 0 && (
            <div className="grid gap-1.5">
              {soal.opsi.map((opsi: any, i: number) => {
                const label = String.fromCharCode(65 + i); // A, B, C, D
                const isJawabanBenar =
                  soal.jawaban_benar === label ||
                  soal.jawaban_benar === opsi ||
                  soal.jawaban_benar === opsi.text;
                const isDipilih =
                  jawabanMhs === label ||
                  jawabanMhs === opsi ||
                  jawabanMhs === opsi.text;

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm",
                      isJawabanBenar
                        ? "bg-success/10 border border-success/30 text-success"
                        : isDipilih && !isJawabanBenar
                          ? "bg-destructive/8 border border-destructive/25 text-destructive"
                          : "bg-muted/40 border border-transparent text-muted-foreground",
                    )}
                  >
                    <span className="font-semibold shrink-0 w-5">{label}.</span>
                    <span>{typeof opsi === "object" ? opsi.text : opsi}</span>
                    {isJawabanBenar && (
                      <CheckCircle2 className="h-4 w-4 ml-auto shrink-0" />
                    )}
                    {isDipilih && !isJawabanBenar && (
                      <XCircle className="h-4 w-4 ml-auto shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback jika tidak ada opsi */}
          {(!soal.opsi || soal.opsi.length === 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 border border-border/40 p-3">
                <p className="text-xs text-muted-foreground mb-1">Jawaban mahasiswa</p>
                <p className={cn("text-sm font-medium", isCorrect ? "text-success" : "text-destructive")}>
                  {jawabanMhs}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Kunci jawaban</p>
                <p className="text-sm font-medium text-primary">
                  {soal.jawaban_benar}
                </p>
              </div>
            </div>
          )}

          {/* Penjelasan */}
          {soal.penjelasan && (
            <div className="flex gap-2.5 rounded-lg bg-primary/5 border border-primary/15 p-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary/80">{soal.penjelasan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Item soal laporan (essay / file_upload) — dengan form penilaian */
function LaporanSoalItem({
  soal,
  jawaban,
  index,
  grading,
  onGradeChange,
}: {
  soal: Soal;
  jawaban: Jawaban | undefined;
  index: number;
  grading: { poin_diperoleh: number; feedback: string } | null;
  onGradeChange: (
    id: string,
    field: "poin_diperoleh" | "feedback",
    value: number | string,
  ) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/95 dark:bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b border-border/40">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
          {index + 1}
        </div>
        <p className="flex-1 text-sm font-semibold text-foreground">
          {soal.pertanyaan}
        </p>
        <Badge variant="outline" className="text-xs shrink-0">
          {soal.poin} poin
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Essay */}
        {soal.tipe_soal === "essay" && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Jawaban mahasiswa
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {jawaban?.jawaban_mahasiswa || (
                <span className="italic text-muted-foreground">Tidak dijawab</span>
              )}
            </p>
          </div>
        )}

        {/* File Upload */}
        {soal.tipe_soal === "file_upload" && (
          <>
            {jawaban?.file_url ? (
              <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {jawaban.file_name || "Dokumen Laporan"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {jawaban.file_type || "PDF"} ·{" "}
                      {jawaban.file_size
                        ? `${(jawaban.file_size / 1024).toFixed(1)} KB`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => window.open(jawaban.file_url!, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => window.open(jawaban.file_url!, "_blank")}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : jawaban?.jawaban_mahasiswa ? (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Jawaban mahasiswa (diketik)
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {jawaban.jawaban_mahasiswa}
                </p>
              </div>
            ) : (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Mahasiswa tidak mengirimkan file atau jawaban
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Form Penilaian */}
        {jawaban && (
          <div className="rounded-xl bg-primary/4 border border-primary/15 p-4">
            <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
              Penilaian Dosen
            </p>
            <div className="grid md:grid-cols-5 gap-3">
              {/* Poin input */}
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
                  value={grading?.poin_diperoleh ?? 0}
                  onChange={(e) =>
                    onGradeChange(
                      jawaban.id,
                      "poin_diperoleh",
                      Math.min(soal.poin, Math.max(0, Number(e.target.value))),
                    )
                  }
                  className="mt-1.5 text-center font-bold text-lg h-11"
                />
              </div>

              {/* Feedback */}
              <div className="md:col-span-4">
                <Label
                  htmlFor={`feedback-${jawaban.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Catatan / feedback untuk mahasiswa
                </Label>
                <Textarea
                  id={`feedback-${jawaban.id}`}
                  value={grading?.feedback ?? ""}
                  onChange={(e) =>
                    onGradeChange(jawaban.id, "feedback", e.target.value)
                  }
                  placeholder="Tulis catatan atau feedback untuk mahasiswa..."
                  className="mt-1.5 resize-none text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AttemptDetailPage() {
  const { kuisId, attemptId } = useParams<{
    kuisId: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptKuis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gradingState, setGradingState] = useState<GradingState>({});
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // EFFECTS & DATA
  // ============================================================================

  useEffect(() => {
    if (!attemptId) return;
    loadAttemptDetail();
  }, [attemptId]);

  const loadAttemptDetail = async () => {
    if (!attemptId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAttemptById(attemptId);
      setAttempt(data);
      const initialGrading: GradingState = {};
      data.jawaban?.forEach((j) => {
        initialGrading[j.id] = {
          poin_diperoleh: j.poin_diperoleh || 0,
          feedback: j.feedback || "",
        };
      });
      setGradingState(initialGrading);
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail hasil tugas");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGradeChange = (
    jawabanId: string,
    field: "poin_diperoleh" | "feedback",
    value: number | string,
  ) => {
    setGradingState((prev) => ({
      ...prev,
      [jawabanId]: { ...prev[jawabanId], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSaveGrading = async () => {
    if (!attempt?.jawaban) return;
    if (!navigator.onLine) {
      toast.error("Tidak bisa menyimpan saat offline.");
      return;
    }
    setIsSaving(true);
    try {
      const scoreAfterSave = calculateTotalScore();
      for (const jawaban of attempt.jawaban) {
        const grading = gradingState[jawaban.id];
        if (!grading) continue;
        const poin = grading.poin_diperoleh;
        const max = jawaban.soal?.poin || 0;
        await gradeAnswer(jawaban.id, poin, poin === max, grading.feedback);
      }
      if (attempt.kuis?.kelas_id) {
        await syncNilaiPraktikumFromAttempts(
          attempt.mahasiswa_id,
          attempt.kuis.kelas_id,
          attempt.kuis.mata_kuliah_id ?? null,
        );
      }
      await notifyMahasiswaGradeResult(attempt, scoreAfterSave).catch(
        console.error,
      );
      toast.success("Penilaian berhasil disimpan");
      setHasChanges(false);
      await loadAttemptDetail();
    } catch (err: any) {
      toast.error("Gagal menyimpan penilaian", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (!confirm("Ada perubahan yang belum disimpan. Yakin ingin kembali?"))
        return;
    }
    navigate(`/dosen/kuis/${kuisId}/results`);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const calculateTotalScore = () => {
    if (!attempt?.jawaban) return 0;
    return attempt.jawaban.reduce((sum, j) => {
      const g = gradingState[j.id];
      return sum + (g?.poin_diperoleh ?? j.poin_diperoleh ?? 0);
    }, 0);
  };

  const calculateMaxScore = () => {
    if (!attempt?.kuis?.soal) return 0;
    return attempt.kuis.soal.reduce((sum, s) => sum + s.poin, 0);
  };

  const checkAnswer = (jawaban: Jawaban, soal: Soal) => {
    if (soal.tipe_soal === "pilihan_ganda") {
      return checkAnswerCorrect(
        soal,
        jawaban.jawaban || jawaban.jawaban_mahasiswa || "",
      );
    }
    return jawaban.is_correct || false;
  };

  const isAutoGradedQuiz = () => {
    return (
      attempt?.kuis?.soal?.every(
        (s: any) => (s.tipe_soal || s.tipe) === "pilihan_ganda",
      ) ?? false
    );
  };

  const notifyMahasiswaGradeResult = async (
    currentAttempt: AttemptKuis,
    nilaiAkhir: number,
  ) => {
    const { data, error } = await supabase
      .from("mahasiswa")
      .select("user_id")
      .eq("id", currentAttempt.mahasiswa_id)
      .single();
    if (error) throw error;
    if (!data?.user_id) return;
    await notifyMahasiswaTugasGraded(
      data.user_id,
      currentAttempt.kuis?.judul || "Tugas Praktikum",
      nilaiAkhir,
      currentAttempt.id,
      currentAttempt.kuis_id,
      (currentAttempt.kuis as any)?.tipe_kuis ?? null,
    );
  };

  // ============================================================================
  // LOADING / ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content">
          <div className="rounded-3xl border border-border/60 bg-white/90 p-12 text-center shadow-2xl dark:bg-card">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground font-medium">
              Memuat detail hasil...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content space-y-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Data tidak ditemukan"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const mahasiswa = attempt.mahasiswa;
  const kuis = attempt.kuis;
  const totalScore = calculateTotalScore();
  const maxScore = calculateMaxScore();
  const autoGraded = isAutoGradedQuiz();

  const benarCount =
    attempt.jawaban?.filter((j) => j.soal && checkAnswer(j, j.soal)).length ||
    0;
  const salahCount = (kuis?.soal?.length || 0) - benarCount;

  return (
    <div className="role-page-shell p-4 sm:p-6 lg:p-8">
      <div className="role-page-content max-w-7xl space-y-5 lg:space-y-6">

        {/* ── HEADER ── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-linear-to-r from-primary via-primary/90 to-accent/85 px-6 py-5 text-primary-foreground shadow-xl sm:px-8 sm:py-6">
          <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBack}
                className="border border-white/30 bg-white/15 text-white hover:bg-white/25 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-lg font-bold sm:text-xl">
                  Detail Hasil Mahasiswa
                </h1>
                <p className="text-xs text-primary-foreground/70 mt-0.5">
                  {mahasiswa?.user?.full_name} · {kuis?.judul}
                </p>
              </div>
            </div>

            {/* Save button */}
            {hasChanges && (
              <Button
                onClick={handleSaveGrading}
                disabled={isSaving || !navigator.onLine}
                className="gap-2 border border-white/30 bg-white/15 text-white hover:bg-white/25 shrink-0"
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
        </section>

        {/* ── BODY: Sidebar + Konten ── */}
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">

          {/* ── SIDEBAR KIRI ── */}
          <aside className="flex flex-col gap-4">
            <StudentInfoCard mahasiswa={mahasiswa} attempt={attempt} />
            <QuizInfoCard kuis={kuis} />
            <ScoreSummaryCard
              totalScore={totalScore}
              maxScore={maxScore}
              benar={benarCount}
              salah={salahCount}
              isAutoGraded={autoGraded}
            />
          </aside>

          {/* ── KONTEN UTAMA KANAN ── */}
          <main className="space-y-4">

            {/* Banner info CBT */}
            {autoGraded && (
              <div className="flex items-center gap-3 rounded-xl border border-info/25 bg-info/8 px-4 py-3">
                <Sparkles className="h-4.5 w-4.5 text-info shrink-0" />
                <p className="text-sm text-info">
                  Tugas ini dinilai <strong>otomatis oleh sistem</strong> berdasarkan jawaban benar/salah.
                  Dosen tidak perlu memberi nilai manual.
                </p>
              </div>
            )}

            {/* Judul seksi */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Jawaban Mahasiswa
                <span className="ml-2 text-muted-foreground font-normal">
                  ({kuis?.soal?.length || 0} soal)
                </span>
              </h2>
              {autoGraded && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Benar
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    Salah
                  </span>
                </div>
              )}
            </div>

            {/* List soal */}
            <div className="space-y-2.5">
              {kuis?.soal?.map((soal: Soal, index: number) => {
                const jawaban = attempt.jawaban?.find(
                  (j) => j.soal_id === soal.id,
                );

                if (autoGraded) {
                  return (
                    <CbtSoalItem
                      key={soal.id}
                      soal={soal}
                      jawaban={jawaban}
                      index={index}
                    />
                  );
                }

                return (
                  <LaporanSoalItem
                    key={soal.id}
                    soal={soal}
                    jawaban={jawaban}
                    index={index}
                    grading={jawaban ? gradingState[jawaban.id] : null}
                    onGradeChange={handleGradeChange}
                  />
                );
              })}
            </div>

            {/* Floating save bar (laporan) */}
            {!autoGraded && hasChanges && (
              <div className="sticky bottom-4 z-20">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-warning/30 bg-warning/8 backdrop-blur-sm px-5 py-3.5 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4.5 w-4.5 text-warning shrink-0" />
                    <span className="text-sm font-medium text-warning">
                      Ada perubahan penilaian yang belum disimpan
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveGrading}
                    disabled={isSaving || !navigator.onLine}
                    className="shrink-0 gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Penilaian
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
