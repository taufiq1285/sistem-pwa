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
  User,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAttemptById } from "@/lib/api/kuis.api";
import { gradeAnswer } from "@/lib/api/kuis.api";
import type { AttemptKuis, Soal, Jawaban } from "@/types/kuis.types";
import { TIPE_SOAL_LABELS, ATTEMPT_STATUS_LABELS } from "@/types/kuis.types";
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

    setIsSaving(true);

    try {
      // Save grading for each jawaban
      const promises = attempt.jawaban.map((jawaban) => {
        const grading = gradingState[jawaban.id];
        if (!grading) return Promise.resolve();

        const poinDiperoleh = grading.poin_diperoleh;
        const maxPoin = jawaban.soal?.poin || 0;
        const isCorrect = poinDiperoleh === maxPoin;

        return gradeAnswer(
          jawaban.id,
          poinDiperoleh,
          isCorrect,
          grading.feedback,
        );
      });

      await Promise.all(promises);

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
      return sum + (grading?.poin_diperoleh || jawaban.poin_diperoleh || 0);
    }, 0);
  };

  const calculateMaxScore = () => {
    if (!attempt?.kuis?.soal) return 0;
    return attempt.kuis.soal.reduce((sum, soal) => sum + soal.poin, 0);
  };

  const isAutoGraded = (soal: Soal) => {
    return soal.tipe_soal === "pilihan_ganda";
  };

  const checkAnswer = (jawaban: Jawaban, soal: Soal) => {
    if (soal.tipe_soal === "pilihan_ganda") {
      return jawaban.jawaban_mahasiswa === soal.jawaban_benar;
    }
    return jawaban.is_correct || false;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Memuat detail hasil...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Data tidak ditemukan"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const mahasiswa = attempt.mahasiswa;
  const kuis = attempt.kuis;
  const totalScore = calculateTotalScore();
  const maxScore = calculateMaxScore();
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Hasil
        </Button>

        {hasChanges && (
          <Button
            onClick={handleSaveGrading}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Penilaian
          </Button>
        )}
      </div>

      {/* Student & Quiz Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Student Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Informasi Mahasiswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {mahasiswa?.user?.full_name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {mahasiswa?.user?.full_name || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">
                  NIM: {mahasiswa?.nim || "-"}
                </p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge
                  variant={
                    attempt.status === "graded"
                      ? "default"
                      : attempt.status === "submitted"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {ATTEMPT_STATUS_LABELS[attempt.status]}
                </Badge>
              </div>
              {attempt.started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Mulai:</span>
                  <span className="font-medium">
                    {format(
                      new Date(attempt.started_at),
                      "dd MMM yyyy, HH:mm",
                      { locale: localeId },
                    )}
                  </span>
                </div>
              )}
              {attempt.submitted_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dikumpulkan:</span>
                  <span className="font-medium">
                    {format(
                      new Date(attempt.submitted_at),
                      "dd MMM yyyy, HH:mm",
                      { locale: localeId },
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quiz Info */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informasi Tugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">{kuis?.judul}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {kuis?.deskripsi || "Tidak ada deskripsi"}
              </p>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Soal:</span>
                <span className="font-medium">{kuis?.soal?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durasi:</span>
                <span className="font-medium">{kuis?.durasi_menit} menit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4" />
              Nilai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {totalScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">dari {maxScore} poin</div>
              <div className="mt-2">
                <Badge
                  variant={percentage >= 70 ? "default" : "destructive"}
                  className="text-base px-3 py-1"
                >
                  {percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Benar:</span>
                <span className="font-medium text-green-600">
                  {attempt.jawaban?.filter((j) => checkAnswer(j, j.soal!))
                    .length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salah/Belum Dinilai:</span>
                <span className="font-medium text-red-600">
                  {(kuis?.soal?.length || 0) -
                    (attempt.jawaban?.filter((j) => checkAnswer(j, j.soal!))
                      .length || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jawaban List */}
      <Card>
        <CardHeader>
          <CardTitle>Jawaban Mahasiswa</CardTitle>
          <CardDescription>
            Review dan beri nilai untuk setiap jawaban
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {kuis?.soal?.map((soal, index) => {
            const jawaban = attempt.jawaban?.find((j) => j.soal_id === soal.id);
            const isCorrect = jawaban ? checkAnswer(jawaban, soal) : false;
            const grading = jawaban ? gradingState[jawaban.id] : null;
            const autoGraded = isAutoGraded(soal);

            return (
              <div
                key={soal.id}
                className={cn(
                  "p-6 border-2 rounded-lg",
                  isCorrect
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50",
                )}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Soal {index + 1}</Badge>
                      <Badge variant="secondary">
                        {TIPE_SOAL_LABELS[soal.tipe_soal]}
                      </Badge>
                      <Badge variant="outline">{soal.poin} poin</Badge>
                      {autoGraded && (
                        <Badge className="bg-blue-600">Auto-Graded</Badge>
                      )}
                    </div>
                    <p className="text-base font-medium text-gray-900">
                      {soal.pertanyaan}
                    </p>
                  </div>
                  {jawaban && (
                    <div className="ml-4">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  )}
                </div>

                {/* Answer Display */}
                <div className="space-y-4">
                  {/* Pilihan Ganda */}
                  {soal.tipe_soal === "pilihan_ganda" && (
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded border">
                        <Label className="text-sm text-gray-600 mb-2 block">
                          Jawaban Mahasiswa:
                        </Label>
                        <p
                          className={cn(
                            "font-semibold",
                            isCorrect ? "text-green-700" : "text-red-700",
                          )}
                        >
                          {jawaban?.jawaban_mahasiswa || "Tidak dijawab"}
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <Label className="text-sm text-gray-600 mb-2 block">
                          Jawaban Benar:
                        </Label>
                        <p className="font-semibold text-blue-700">
                          {soal.jawaban_benar}
                        </p>
                      </div>

                      {soal.penjelasan && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertDescription>
                            <strong>Penjelasan:</strong> {soal.penjelasan}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Essay */}
                  {soal.tipe_soal === "essay" && jawaban && (
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded border">
                        <Label className="text-sm text-gray-600 mb-2 block">
                          Jawaban Mahasiswa:
                        </Label>
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {jawaban.jawaban_mahasiswa || "Tidak dijawab"}
                        </p>
                      </div>

                      {/* Grading Form */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`poin-${jawaban.id}`}>
                            Poin (Max: {soal.poin})
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
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`feedback-${jawaban.id}`}>
                            Feedback/Komentar
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
                            placeholder="Berikan feedback untuk mahasiswa..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {soal.tipe_soal === "file_upload" && jawaban && (
                    <div className="space-y-3">
                      {jawaban.file_url ? (
                        <div className="bg-white p-4 rounded border">
                          <Label className="text-sm text-gray-600 mb-2 block">
                            File yang Diupload:
                          </Label>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {jawaban.file_name || "File"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {jawaban.file_type} •{" "}
                                  {jawaban.file_size
                                    ? (jawaban.file_size / 1024).toFixed(2)
                                    : 0}{" "}
                                  KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(jawaban.file_url!, "_blank")
                              }
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : jawaban.jawaban_mahasiswa ? (
                        // Student typed the answer instead of uploading file
                        <div className="bg-white p-4 rounded border">
                          <Label className="text-sm text-gray-600 mb-2 block">
                            Jawaban Mahasiswa (Diketik):
                          </Label>
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {jawaban.jawaban_mahasiswa}
                          </p>
                        </div>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Mahasiswa tidak mengirim jawaban
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Grading Form */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`poin-${jawaban.id}`}>
                            Poin (Max: {soal.poin})
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
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`feedback-${jawaban.id}`}>
                            Feedback/Komentar
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
                            placeholder="Berikan feedback untuk mahasiswa..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display Feedback if exists */}
                  {jawaban?.feedback && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertDescription>
                        <strong>Feedback Dosen:</strong> {jawaban.feedback}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-900 font-medium">
                Ada perubahan penilaian yang belum disimpan
              </span>
            </div>
            <Button
              onClick={handleSaveGrading}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Penilaian
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
