/**
 * QuizBuilder (Tugas Praktikum) - Simple & Optional
 *
 * Flow sederhana:
 * 1. Isi info tugas → Simpan
 * 2. (Opsional) Tambah soal jika diperlukan
 * 3. (Opsional) Publish jika ada soal
 *
 * Note: Fitur ini OPSIONAL - tidak semua praktikum memerlukan tes
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Save,
  CheckCircle,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { QuestionEditor } from "./QuestionEditor";
import { AddFromBankDialog } from "../AddFromBankDialog";
import {
  createKuisSchema,
  type CreateKuisFormData,
} from "@/lib/validations/kuis.schema";
import {
  createKuis,
  updateKuis,
  createSoal,
  updateSoal,
  deleteSoal,
  getKuisById,
} from "@/lib/api/kuis.api";
import { getKelas, createKelas } from "@/lib/api/kelas.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import { saveSoalToBank } from "@/lib/api/bank-soal.api";
import { supabase } from "@/lib/supabase/client";
import type { Kuis, Soal } from "@/types/kuis.types";
import type { Kelas } from "@/types/kelas.types";
import type { MataKuliah } from "@/types/mata-kuliah.types";
import { cn } from "@/lib/utils";

interface QuizBuilderProps {
  quiz?: Kuis;
  kelasId?: string;
  dosenId: string;
  defaultTipe?: "pre_test" | "post_test" | "laporan";
  cbtMode?: boolean; // CBT mode - multiple choice only (for Tes)
  laporanMode?: boolean; // Laporan mode - essay/upload only
  onSave?: (quiz: Kuis) => void;
  onCancel?: () => void;
}

interface EditorState {
  isOpen: boolean;
  question?: Soal;
  index?: number;
}

export function QuizBuilder({
  quiz,
  kelasId,
  dosenId,
  defaultTipe,
  cbtMode = false,
  laporanMode = false,
  onSave,
  onCancel: _onCancel,
}: QuizBuilderProps) {
  const isEditing = !!quiz;

  // ✅ AUTO-DETECT MODE from quiz.tipe_kuis when editing
  // If mode props are not explicitly set, infer from tipe_kuis
  const effectiveCbtMode =
    cbtMode || (!laporanMode && quiz?.tipe_kuis === "pilihan_ganda");
  const effectiveLaporanMode =
    laporanMode || (!cbtMode && quiz?.tipe_kuis === "essay");

  console.log("🔍 [QuizBuilder] Mode detection:", {
    isEditing,
    quizTipe: quiz?.tipe_kuis,
    propsCbtMode: cbtMode,
    propsLaporanMode: laporanMode,
    effectiveCbtMode,
    effectiveLaporanMode,
  });
  const [currentQuiz, setCurrentQuiz] = useState<Kuis | null>(quiz || null);
  const [questions, setQuestions] = useState<Soal[]>(quiz?.soal || []);
  const [editorState, setEditorState] = useState<EditorState>({
    isOpen: false,
  });
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("");

  // Helper to convert ISO date to datetime-local format (kept for editing if needed later)
  const formatDateTimeLocal = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ✅ FIX: Set selectedMataKuliah from quiz data when editing
  useEffect(() => {
    if (quiz?.kelas_id && !selectedMataKuliah) {
      // Get mata_kuliah_id from the quiz's kelas
      const findMataKuliahFromKelas = async () => {
        try {
          // Load all kelas to find the mata_kuliah_id
          const { data: kelasData } = await supabase
            .from("kelas")
            .select("mata_kuliah_id")
            .eq("id", quiz.kelas_id)
            .single();

          if (kelasData?.mata_kuliah_id) {
            setSelectedMataKuliah(kelasData.mata_kuliah_id);
            console.log(
              "✅ [QuizBuilder] Auto-selected mata kuliah:",
              kelasData.mata_kuliah_id,
            );
          }
        } catch (error) {
          console.warn(
            "⚠️ [QuizBuilder] Failed to get mata kuliah from kelas:",
            error,
          );
        }
      };
      findMataKuliahFromKelas();
    }
  }, [quiz?.kelas_id, selectedMataKuliah]);

  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateKuisFormData>({
    resolver: zodResolver(createKuisSchema),
    defaultValues: quiz
      ? {
          kelas_id: quiz.kelas_id,
          dosen_id: quiz.dosen_id,
          judul: quiz.judul,
          deskripsi: quiz.deskripsi || "",
          durasi_menit:
            quiz.durasi_menit || (effectiveLaporanMode ? 10080 : 60),
          passing_score: quiz.passing_score ?? null,
          max_attempts: quiz.max_attempts ?? (effectiveCbtMode ? 1 : 3),
          randomize_questions: quiz.randomize_questions ?? false,
          randomize_options: quiz.randomize_options ?? false,
          show_results_immediately: quiz.show_results_immediately ?? true,
          status: quiz.status ?? "draft",
        }
      : {
          kelas_id: kelasId || "",
          dosen_id: dosenId,
          judul: "",
          deskripsi: "",
          // Laporan: 1 minggu (10080 menit), CBT: 60 menit
          durasi_menit: effectiveLaporanMode ? 10080 : 60,
          passing_score: 70,
          // ✅ UKOM Standards: CBT = 1 attempt (no retry), Laporan = 3 attempts (can resubmit)
          max_attempts: effectiveCbtMode ? 1 : 3,
          randomize_questions: false,
          randomize_options: false,
          show_results_immediately: true,
          status: "draft",
        },
  });

  const formData = watch();

  useEffect(() => {
    loadMataKuliah();
    // FIXED: Load ALL global kelas (not tied to mata kuliah)
    loadKelas();
  }, [dosenId]);

  // Load kelas when mata kuliah changes (for display purposes only)
  useEffect(() => {
    if (selectedMataKuliah) {
      // Kelas bersifat GLOBAL, tidak perlu reload berdasarkan MK
      // Reset kelas selection when mata kuliah changes
      setValue("kelas_id", "");
    }
  }, [selectedMataKuliah]);

  const loadKelas = async (mataKuliahId?: string) => {
    setIsLoadingKelas(true);
    try {
      console.log(
        "🔍 Loading ALL active kelas (global, not tied to mata_kuliah)",
      );

      // FIXED: Load ALL active kelas (GLOBAL - tidak terikat mata kuliah)
      // Kelas dibuat UMUM oleh admin, tidak perlu filter by mata_kuliah_id
      const data = await getKelas({
        is_active: true,
        // REMOVED: mata_kuliah_id filter - kelas bersifat GLOBAL
      });

      console.log("✅ Kelas loaded:", data.length, "kelas found");
      console.log(
        "📋 Kelas list:",
        data.map((k) => ({
          id: k.id,
          nama: k.nama_kelas,
          kode: k.kode_kelas,
          global: true,
        })),
      );

      setKelasList(data);

      // Don't auto-select kelas - let user choose explicitly
      // This ensures the dosen reviews the class list before selecting

      // Show warning if no kelas found
      if (data.length === 0) {
        console.warn("⚠️ No kelas found in database");
        toast.warning("Belum ada kelas", {
          description: "Kelas bersifat UMUM dan dibuat oleh Admin",
        });
      }
    } catch (error: unknown) {
      console.error("❌ Error loading kelas:", error);
      toast.error("Gagal memuat kelas");
    } finally {
      setIsLoadingKelas(false);
    }
  };

  const loadMataKuliah = async () => {
    try {
      const data = await getMataKuliah();
      setMataKuliahList(data);
    } catch (_error: unknown) {
      // ✅ FIXED: Unused variable
      console.error("Failed to load mata kuliah");
    }
  };

  // REMOVED: handleQuickCreateKelas - Kelas dibuat oleh admin, dosen hanya memilih

  // ✅ NEW: Explicit save quiz info button handler
  const handleSaveQuizInfo = async () => {
    const formData = watch();

    // Validate required fields
    if (!formData.judul || !formData.judul.trim()) {
      toast.error("Judul tugas harus diisi");
      return;
    }
    if (!formData.kelas_id) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }
    // Skip durasi validation for laporan (no time limit needed)
    if (
      !effectiveLaporanMode &&
      (!formData.durasi_menit || formData.durasi_menit < 5)
    ) {
      toast.error("Durasi minimal 5 menit");
      return;
    }

    setIsSavingQuiz(true);
    try {
      // ✅ Determine tipe_kuis based on effective mode
      let tipeKuisValue: "essay" | "pilihan_ganda" | "campuran" = "campuran";
      if (effectiveLaporanMode) {
        tipeKuisValue = "essay"; // Laporan Praktikum
      } else if (effectiveCbtMode) {
        tipeKuisValue = "pilihan_ganda"; // Tes CBT
      }

      const dataToSave = {
        ...formData,
        tipe_kuis: tipeKuisValue, // ✅ Set tipe_kuis based on mode
        status: "draft" as const, // Always start as draft
      };

      if (currentQuiz) {
        // Update existing quiz
        const updated = await updateKuis(currentQuiz.id, dataToSave);
        setCurrentQuiz(updated);
        toast.success("Informasi tugas berhasil diperbarui");
      } else {
        // Create new quiz
        const savedQuiz = await createKuis(dataToSave);
        setCurrentQuiz(savedQuiz);
        toast.success("Tugas berhasil disimpan! Sekarang tambahkan soal.");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Gagal menyimpan tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // ✅ IMPROVED: No auto-save, require quiz to be saved first
  const handleAddQuestion = () => {
    if (!currentQuiz) {
      toast.error("Simpan informasi tugas terlebih dahulu");
      return;
    }
    setEditorState({ isOpen: true, index: questions.length });
  };

  // ✅ NEW: Publish quiz handler
  const handlePublishQuiz = async () => {
    console.log("🔵 handlePublishQuiz called");
    console.log("🔵 currentQuiz:", currentQuiz);
    console.log("🔵 questions.length:", questions.length);
    console.log("🔵 effectiveLaporanMode:", effectiveLaporanMode);

    if (!currentQuiz) {
      console.log("❌ No currentQuiz");
      toast.error("Tugas belum disimpan");
      return;
    }

    // ✅ UPDATED: Laporan Praktikum BOLEH publish tanpa soal
    // CBT butuh minimal 1 soal
    if (!effectiveLaporanMode && questions.length === 0) {
      console.log("❌ No questions for CBT");
      toast.error("Tambahkan minimal 1 soal sebelum publish");
      return;
    }

    const confirmMsg = effectiveLaporanMode
      ? "Yakin ingin publish laporan ini? Mahasiswa akan bisa mengupload file laporan."
      : "Yakin ingin publish tes ini? Mahasiswa akan bisa mengerjakan soal tes.";

    const confirmed = confirm(confirmMsg);
    console.log("🔵 User confirmed:", confirmed);

    if (!confirmed) {
      console.log("❌ User cancelled");
      return;
    }

    setIsPublishing(true);
    try {
      console.log("🔵 Calling updateKuis with status: published");
      const updated = await updateKuis(currentQuiz.id, { status: "published" });
      console.log("✅ Updated quiz:", updated);
      setCurrentQuiz(updated);
      toast.success(
        "Tugas berhasil dipublish! Mahasiswa sekarang bisa mengerjakan tugas ini.",
      );
    } catch (error) {
      console.error("❌ Error publishing quiz:", error);
      toast.error("Gagal publish tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // ✅ NEW: Unpublish quiz - untuk mengedit soal pada tugas yang sudah published
  const handleUnpublishQuiz = async () => {
    if (!currentQuiz) {
      toast.error("Tugas belum disimpan");
      return;
    }

    const confirmed = confirm(
      "Unpublish tugas ini?\n\n" +
        "Mahasiswa TIDAK akan bisa melihat atau mengerjakan tugas ini sementara.\n\n" +
        "Anda bisa mengedit soal setelah unpublish, lalu publish kembali.",
    );

    if (!confirmed) {
      return;
    }

    setIsPublishing(true);
    try {
      const updated = await updateKuis(currentQuiz.id, { status: "draft" });
      setCurrentQuiz(updated);
      toast.success(
        "Tugas berhasil unpublish! Mahasiswa sementara tidak bisa mengakses tugas ini.",
      );
    } catch (error) {
      console.error("❌ Error unpublishing quiz:", error);
      toast.error("Gagal unpublish tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // ✅ NEW: Reload questions after adding from bank
  const reloadQuestions = async () => {
    if (!currentQuiz) return;
    try {
      const updated = await getKuisById(currentQuiz.id);
      setQuestions(updated.soal || []);
    } catch (error) {
      console.error("Error reloading questions:", error);
    }
  };

  const handleEditQuestion = (question: Soal, index: number) => {
    setEditorState({ isOpen: true, question, index });
  };

  const handleSaveQuestion = async (questionData: any) => {
    if (!currentQuiz) return;
    try {
      let savedQuestion: Soal;
      const shouldSaveToBank = questionData.saveToBank === true;

      if (editorState.question) {
        // Update existing question
        savedQuestion = await updateSoal(editorState.question.id, questionData);
        setQuestions((prev) =>
          prev.map((q) => (q.id === savedQuestion.id ? savedQuestion : q)),
        );
        toast.success("Soal berhasil diperbarui");
      } else {
        // Create new question
        savedQuestion = await createSoal({
          ...questionData,
          kuis_id: currentQuiz.id,
        });
        setQuestions((prev) => [...prev, savedQuestion]);

        // Auto-save to Bank Soal if checkbox was checked (only for PILIHAN_GANDA)
        // Bank Soal hanya untuk CBT (pilihan ganda), tidak untuk laporan
        if (shouldSaveToBank && savedQuestion.tipe_soal === "pilihan_ganda") {
          try {
            await saveSoalToBank(savedQuestion, dosenId);
            toast.success("Soal berhasil dibuat dan disimpan ke Bank Soal");
          } catch (bankError) {
            console.error("Error saving to bank:", bankError);
            toast.success("Soal berhasil dibuat");
            toast.warning("Gagal menyimpan ke Bank Soal", {
              description: "Soal sudah ada di kuis, tapi tidak masuk ke bank",
            });
          }
        } else {
          toast.success("Soal berhasil dibuat");
        }
      }
      setEditorState({ isOpen: false });
    } catch (_error: unknown) {
      // ✅ FIXED: Unused variable
      toast.error("Gagal menyimpan soal", {
        description: (_error as Error).message,
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return;
    try {
      await deleteSoal(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("Soal berhasil dihapus");
    } catch (_error: unknown) {
      // ✅ FIXED: Unused variable
      toast.error("Gagal menghapus soal");
    }
  };

  if (editorState.isOpen) {
    return (
      <QuestionEditor
        kuisId={currentQuiz!.id}
        dosenId={dosenId}
        question={editorState.question}
        urutan={(editorState.index || 0) + 1}
        defaultPoin={1}
        cbtMode={effectiveCbtMode}
        laporanMode={effectiveLaporanMode}
        onSave={handleSaveQuestion}
        onCancel={() => setEditorState({ isOpen: false })}
      />
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.poin || 0), 0);
  const quizStatus = currentQuiz?.status || "draft";

  return (
    <div className="space-y-6">
      {/* Simple Status Header - Different based on mode */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{effectiveLaporanMode ? "📄" : "🖥️"}</div>
          <div>
            <h2 className="font-semibold text-lg">
              {isEditing
                ? effectiveLaporanMode
                  ? "Edit Tugas Laporan"
                  : "Edit Tes CBT"
                : effectiveLaporanMode
                  ? "Buat Tugas Laporan"
                  : "Buat Tes CBT"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {effectiveLaporanMode
                ? "Tugas Praktikum - Essay / Upload File"
                : "Computer Based Test - Pilihan Ganda"}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {currentQuiz && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {questions.length} soal • {totalPoints} poin
            </span>
            {quizStatus === "draft" ? (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 px-4 py-1">
                🟡 Draft
              </Badge>
            ) : quizStatus === "published" ? (
              <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-1">
                🟢 Aktif
              </Badge>
            ) : (
              <Badge variant="outline">{quizStatus}</Badge>
            )}
          </div>
        )}
      </div>

      {/* Info Card - Simplified */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            {effectiveLaporanMode ? "📄 Informasi Laporan" : "📝 Informasi Tes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="judul">
                  {effectiveLaporanMode ? "Judul Laporan" : "Judul Tes"} *
                </Label>
                <Input
                  id="judul"
                  {...register("judul")}
                  placeholder={
                    effectiveLaporanMode
                      ? "Contoh: Laporan Praktikum Anatomi - Modul 1"
                      : "Contoh: Pre-Test Praktikum Anatomi"
                  }
                  className={cn(errors.judul && "border-destructive")}
                />
                {errors.judul && (
                  <p className="text-sm text-destructive">
                    {errors.judul.message}
                  </p>
                )}
              </div>

              {/* Dropdown Mata Kuliah */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="mata_kuliah">Pilih Mata Kuliah *</Label>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Mengubah mata kuliah akan mereset pilihan kelas
                  </p>
                )}
                <Select
                  value={selectedMataKuliah}
                  onValueChange={(value) => {
                    setSelectedMataKuliah(value);
                    // Reset kelas selection when mata kuliah changes
                    setValue("kelas_id", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata kuliah..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mataKuliahList.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        <div className="flex flex-col">
                          <span className="font-semibold">{mk.kode_mk}</span>
                          <span className="text-xs text-muted-foreground">
                            {mk.nama_mk}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Kelas */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="kelas_id">Pilih Kelas *</Label>
                <Select
                  value={formData.kelas_id || ""}
                  onValueChange={(value) => setValue("kelas_id", value)}
                  disabled={!selectedMataKuliah || isLoadingKelas}
                >
                  <SelectTrigger
                    className={cn(errors.kelas_id && "border-destructive")}
                  >
                    <SelectValue
                      placeholder={
                        !selectedMataKuliah
                          ? "Pilih mata kuliah terlebih dahulu"
                          : isLoadingKelas
                            ? "Memuat kelas..."
                            : kelasList.length === 0
                              ? "Tidak ada kelas untuk mata kuliah ini"
                              : "Pilih kelas..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasList.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} ({kelas.kode_kelas})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kelas_id && (
                  <p className="text-sm text-destructive">
                    {errors.kelas_id.message}
                  </p>
                )}

                {/* Info jika tidak ada kelas */}
                {selectedMataKuliah &&
                  !isLoadingKelas &&
                  kelasList.length === 0 && (
                    <Alert className="bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-900">
                        <p className="font-semibold mb-2">
                          Belum ada kelas untuk mata kuliah ini
                        </p>
                        <p className="text-sm mb-3">
                          Kelas bersifat <strong>UMUM</strong> dan dibuat oleh{" "}
                          <strong>Admin</strong> di menu Manajemen Kelas. Dosen
                          hanya memilih kelas yang sudah tersedia untuk
                          diberikan tugas.
                        </p>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline" className="bg-white">
                            📞 Hubungi Admin
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            🏫 Buat Kelas di Manajemen Kelas
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                {formData.kelas_id && selectedMataKuliah && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 mt-0.5">📚</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">
                          {
                            mataKuliahList.find(
                              (mk) => mk.id === selectedMataKuliah,
                            )?.nama_mk
                          }
                        </p>
                        <p className="text-xs text-blue-700">
                          Kelas:{" "}
                          {
                            kelasList.find((k) => k.id === formData.kelas_id)
                              ?.nama_kelas
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  {...register("deskripsi")}
                  placeholder="Deskripsi..."
                  rows={3}
                />
              </div>

              {/* HIDDEN: Durasi tidak ditampilkan untuk laporan (no time limit) */}
              {!effectiveLaporanMode && (
                <div className="space-y-2">
                  <Label htmlFor="durasi_menit">Durasi (menit) *</Label>
                  <Input
                    id="durasi_menit"
                    type="number"
                    {...register("durasi_menit", { valueAsNumber: true })}
                    min={5}
                    className={cn(errors.durasi_menit && "border-destructive")}
                  />
                </div>
              )}

              {/* Info note */}
              <div className="md:col-span-2 space-y-3">
                {currentQuiz?.status === "published" && (
                  <Alert className="bg-orange-50 border-orange-300">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      <p className="font-semibold mb-1">
                        ⚠️ Tugas sudah dipublish
                      </p>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Informasi tugas masih bisa diedit</li>
                        <li>Soal TIDAK bisa diedit/dihapus</li>
                        <li>Untuk edit soal, unpublish terlebih dahulu</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {currentQuiz && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      {effectiveLaporanMode
                        ? "✓ Laporan tersimpan. Tambahkan soal essay/upload jika diperlukan."
                        : "✓ Tes tersimpan. Tambahkan soal pilihan ganda."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveQuizInfo} disabled={isSavingQuiz}>
                <Save className="h-4 w-4 mr-2" />
                {isSavingQuiz
                  ? "Menyimpan..."
                  : currentQuiz
                    ? "Perbarui"
                    : effectiveLaporanMode
                      ? "Simpan Laporan"
                      : "Simpan Tes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soal Card - Show after quiz saved (for both CBT and Laporan) */}
      {currentQuiz && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {effectiveLaporanMode
                    ? "📄 Soal Laporan"
                    : "📋 Soal Pilihan Ganda"}
                  <Badge variant="secondary" className="ml-2">
                    {questions.length} soal
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {effectiveLaporanMode
                    ? "Buat soal essay atau upload file laporan"
                    : "Buat soal manual atau ambil dari Bank Soal"}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Bank Soal button - Hanya untuk CBT, disembunyikan untuk Laporan */}
                {!effectiveLaporanMode && (
                  <Button
                    variant="outline"
                    onClick={() => setShowBankDialog(true)}
                    size="sm"
                    disabled={currentQuiz.status === "published"}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Bank Soal
                  </Button>
                )}
                <Button
                  onClick={handleAddQuestion}
                  size="sm"
                  disabled={currentQuiz.status === "published"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Soal
                </Button>
              </div>
            </div>
            {currentQuiz.status === "published" && (
              <Alert className="mt-3 bg-orange-50 border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900 text-xs">
                  Soal tidak dapat diubah saat tugas aktif. Unpublish terlebih
                  dahulu untuk mengedit soal.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Belum ada soal</p>
                <p className="text-sm">
                  {effectiveLaporanMode
                    ? "Klik 'Buat Soal' untuk membuat soal essay atau upload file laporan"
                    : "Klik 'Buat Soal' untuk membuat soal baru atau ambil dari Bank Soal"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
                      currentQuiz.status === "published" && "opacity-75",
                    )}
                  >
                    <Badge variant="outline" className="shrink-0">
                      #{i + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{q.pertanyaan}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {q.tipe_soal}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {q.poin} poin
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuestion(q, i)}
                        disabled={currentQuiz.status === "published"}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={currentQuiz.status === "published"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publish Section */}
      {currentQuiz && (
        <Card
          className={cn(
            "border-2",
            quizStatus === "published"
              ? "border-green-300 bg-green-50/50"
              : "border-dashed",
          )}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {quizStatus === "published" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">
                      Tes aktif - mahasiswa dapat mengerjakan
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {questions.length > 0
                        ? "Klik Publish untuk mengaktifkan tes"
                        : effectiveLaporanMode
                          ? "Klik Publish untuk mengaktifkan tugas laporan"
                          : "Tambahkan soal terlebih dahulu"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {/* FIXED: Laporan tidak perlu soal, bisa langsung publish */}
                {quizStatus === "draft" &&
                  (effectiveLaporanMode || questions.length > 0) && (
                    <Button
                      onClick={handlePublishQuiz}
                      disabled={isPublishing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isPublishing ? "Publishing..." : "Publish"}
                    </Button>
                  )}
                {/* Unpublish button - only show when published */}
                {quizStatus === "published" && (
                  <Button
                    onClick={handleUnpublishQuiz}
                    disabled={isPublishing}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {isPublishing ? "Unpublishing..." : "Unpublish"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onSave && currentQuiz) onSave(currentQuiz);
                  }}
                >
                  Selesai
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add From Bank Dialog */}
      {currentQuiz && (
        <AddFromBankDialog
          open={showBankDialog}
          onOpenChange={setShowBankDialog}
          kuisId={currentQuiz.id}
          dosenId={dosenId}
          nextUrutan={questions.length + 1}
          onSuccess={reloadQuestions}
        />
      )}
    </div>
  );
}