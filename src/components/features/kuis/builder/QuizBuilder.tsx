/**
 * QuizBuilder - IMPROVED FLOW WITH CLEAR STEPS
 *
 * Flow:
 * Step 1: Fill quiz info → Save Quiz Info (explicit button)
 * Step 2: Add questions (Buat Baru / Dari Bank)
 * Step 3: Publish quiz (Draft → Published)
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, AlertCircle, Target, FileText, Save, CheckCircle, BookOpen } from "lucide-react";

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
import type { Kuis, Soal } from "@/types/kuis.types";
import type { Kelas } from "@/types/kelas.types";
import type { MataKuliah } from "@/types/mata-kuliah.types";
import { cn } from "@/lib/utils";

interface QuizBuilderProps {
  quiz?: Kuis;
  kelasId?: string;
  dosenId: string;
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
  onSave,
  onCancel: _onCancel,
}: QuizBuilderProps) {
  const isEditing = !!quiz;
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

  const [showCreateKelasDialog, setShowCreateKelasDialog] = useState(false);
  const [isCreatingKelas, setIsCreatingKelas] = useState(false);
  const [newKelasData, setNewKelasData] = useState({
    nama_kelas: "",
    mata_kuliah_id: "", // DROPDOWN, bukan text input
    semester_ajaran: 1,
    tahun_ajaran:
      new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  });

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
          durasi_menit: quiz.durasi_menit,
          passing_score: quiz.passing_score ?? null,
          max_attempts: quiz.max_attempts ?? null,
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
          durasi_menit: 60,
          passing_score: 70,
          max_attempts: 1,
          randomize_questions: false,
          randomize_options: false,
          show_results_immediately: true,
          status: "draft",
        },
  });

  const formData = watch();

  useEffect(() => {
    loadKelas();
    loadMataKuliah();
  }, [dosenId]);

  const loadKelas = async () => {
    setIsLoadingKelas(true);
    try {
      const data = await getKelas({ is_active: true });
      setKelasList(data);
      if (data.length === 1 && !isEditing) setValue("kelas_id", data[0].id);
    } catch (_error: unknown) {
      // ✅ FIXED: Unused variable
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

  const handleQuickCreateKelas = async () => {
    if (!newKelasData.nama_kelas.trim() || !newKelasData.mata_kuliah_id) {
      toast.error("Pilih mata kuliah dan isi nama kelas");
      return;
    }

    setIsCreatingKelas(true);

    try {
      const kodeKelas = newKelasData.nama_kelas
        .toUpperCase()
        .replace(/\s+/g, "-");

      const kelas = await createKelas({
        nama_kelas: newKelasData.nama_kelas,
        kode_kelas: kodeKelas,
        mata_kuliah_id: newKelasData.mata_kuliah_id,
        dosen_id: dosenId,
        semester_ajaran: parseInt(String(newKelasData.semester_ajaran)),
        tahun_ajaran: newKelasData.tahun_ajaran,
        is_active: true,
      });

      toast.success("Kelas berhasil dibuat!");
      await loadKelas();
      setValue("kelas_id", kelas.id);
      setShowCreateKelasDialog(false);

      setNewKelasData({
        nama_kelas: "",
        mata_kuliah_id: "",
        semester_ajaran: 1,
        tahun_ajaran:
          new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      });
    } catch (_error: unknown) {
      // ✅ FIXED: Unused variable
      toast.error("Gagal membuat kelas", {
        description: (_error as Error).message,
      });
    } finally {
      setIsCreatingKelas(false);
    }
  };

  // ✅ NEW: Explicit save quiz info button handler
  const handleSaveQuizInfo = async () => {
    const formData = watch();

    // Validate required fields
    if (!formData.judul || !formData.judul.trim()) {
      toast.error("Judul kuis harus diisi");
      return;
    }
    if (!formData.kelas_id) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }
    if (!formData.durasi_menit || formData.durasi_menit < 5) {
      toast.error("Durasi minimal 5 menit");
      return;
    }

    setIsSavingQuiz(true);
    try {
      const dataToSave = {
        ...formData,
        status: "draft", // Always start as draft
      };

      if (currentQuiz) {
        // Update existing quiz
        const updated = await updateKuis(currentQuiz.id, dataToSave);
        setCurrentQuiz(updated);
        toast.success("Informasi kuis berhasil diperbarui");
      } else {
        // Create new quiz
        const savedQuiz = await createKuis(dataToSave);
        setCurrentQuiz(savedQuiz);
        toast.success("Kuis berhasil disimpan! Sekarang tambahkan soal.");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Gagal menyimpan kuis", {
        description: (error as Error).message,
      });
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // ✅ IMPROVED: No auto-save, require quiz to be saved first
  const handleAddQuestion = () => {
    if (!currentQuiz) {
      toast.error("Simpan informasi kuis terlebih dahulu");
      return;
    }
    setEditorState({ isOpen: true, index: questions.length });
  };

  // ✅ NEW: Publish quiz handler
  const handlePublishQuiz = async () => {
    console.log("🔵 handlePublishQuiz called");
    console.log("🔵 currentQuiz:", currentQuiz);
    console.log("🔵 questions.length:", questions.length);

    if (!currentQuiz) {
      console.log("❌ No currentQuiz");
      toast.error("Kuis belum disimpan");
      return;
    }

    if (questions.length === 0) {
      console.log("❌ No questions");
      toast.error("Tambahkan minimal 1 soal sebelum publish");
      return;
    }

    const confirmed = confirm("Yakin ingin publish kuis ini? Mahasiswa akan bisa mengerjakan kuis ini.");
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
      toast.success("Kuis berhasil dipublish! Mahasiswa sekarang bisa mengerjakan kuis ini.");
    } catch (error) {
      console.error("❌ Error publishing quiz:", error);
      toast.error("Gagal publish kuis", {
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

        // Auto-save to Bank Soal if checkbox was checked
        if (shouldSaveToBank) {
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
        question={editorState.question}
        urutan={(editorState.index || 0) + 1}
        defaultPoin={1}
        onSave={handleSaveQuestion}
        onCancel={() => setEditorState({ isOpen: false })}
      />
    );
  }

  const totalPoints = questions.reduce((sum, q) => sum + (q.poin || 0), 0);
  const quizStatus = currentQuiz?.status || "draft";

  return (
    <div className="space-y-6">
      {/* ✅ NEW: Step Indicator */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          {/* Step 1 */}
          <div className={cn("flex items-center gap-2", currentQuiz ? "text-green-600" : "text-primary")}>
            {currentQuiz ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">1</div>}
            <span className="font-medium">Informasi Kuis</span>
          </div>

          <div className={cn("h-px w-8 bg-border", currentQuiz && "bg-green-600")} />

          {/* Step 2 */}
          <div className={cn("flex items-center gap-2", questions.length > 0 ? "text-green-600" : currentQuiz ? "text-primary" : "text-muted-foreground")}>
            {questions.length > 0 ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">2</div>}
            <span className="font-medium">Tambah Soal</span>
          </div>

          <div className={cn("h-px w-8 bg-border", questions.length > 0 && "bg-green-600")} />

          {/* Step 3 */}
          <div className={cn("flex items-center gap-2", quizStatus === "published" ? "text-green-600" : questions.length > 0 ? "text-primary" : "text-muted-foreground")}>
            {quizStatus === "published" ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">3</div>}
            <span className="font-medium">Publish</span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {quizStatus === "draft" ? (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              🟡 Draft
            </Badge>
          ) : quizStatus === "published" ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              🟢 Published
            </Badge>
          ) : (
            <Badge variant="outline">
              {quizStatus}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Informasi Kuis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="judul">Judul Kuis *</Label>
                <Input
                  id="judul"
                  {...register("judul")}
                  placeholder="Contoh: Kuis Anatomi"
                  className={cn(errors.judul && "border-destructive")}
                />
                {errors.judul && (
                  <p className="text-sm text-destructive">
                    {errors.judul.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="kelas_id">Kelas *</Label>
                <Select
                  value={formData.kelas_id || ""}
                  onValueChange={(value) => setValue("kelas_id", value)}
                  disabled={isLoadingKelas || isEditing}
                >
                  <SelectTrigger
                    className={cn(errors.kelas_id && "border-destructive")}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingKelas
                          ? "Memuat..."
                          : kelasList.length === 0
                            ? "Tidak ada kelas aktif - Hubungi admin"
                            : "Pilih kelas..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasList.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} - {kelas.kode_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kelas_id && (
                  <p className="text-sm text-destructive">
                    {errors.kelas_id.message}
                  </p>
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

              {/* ✅ NEW: Info alert */}
              <div className="md:col-span-2">
                {!currentQuiz ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Simpan informasi kuis terlebih dahulu sebelum menambah soal.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Informasi kuis sudah tersimpan. Sekarang tambahkan soal untuk kuis ini.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* ✅ NEW: Explicit Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSaveQuizInfo}
                disabled={isSavingQuiz}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingQuiz ? "Menyimpan..." : currentQuiz ? "Perbarui Informasi Kuis" : "Simpan Informasi Kuis"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Step 2: Daftar Soal</CardTitle>
              <p className="text-sm text-muted-foreground">
                {questions.length} soal · {totalPoints} poin total
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBankDialog(true)}
                disabled={!currentQuiz}
                size="sm"
                title={!currentQuiz ? "Simpan informasi kuis terlebih dahulu" : "Ambil soal dari Bank Soal"}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Ambil dari Bank
              </Button>
              <Button
                onClick={handleAddQuestion}
                disabled={!currentQuiz}
                size="sm"
                title={!currentQuiz ? "Simpan informasi kuis terlebih dahulu" : "Buat soal baru"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Soal Baru
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {!currentQuiz ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Simpan informasi kuis terlebih dahulu untuk menambah soal
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Belum ada soal. Pilih salah satu:
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setShowBankDialog(true)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ambil dari Bank Soal
                    </Button>
                    <Button onClick={handleAddQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Soal Baru
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Badge variant="outline">#{i + 1}</Badge>
                      <div className="flex-1">
                        <p className="font-medium">{q.pertanyaan}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            <Target className="h-3 w-3 inline mr-1" />
                            {q.poin} poin
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {q.tipe_soal}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(q, i)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NEW: Step 3 - Publish Section */}
      {currentQuiz && questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Publish Kuis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {quizStatus === "draft" ? (
                    <>
                      Kuis masih dalam status <strong>Draft</strong>. Mahasiswa belum bisa melihat dan mengerjakan kuis ini.
                      Klik tombol <strong>Publish</strong> untuk mengaktifkan kuis.
                    </>
                  ) : (
                    <>
                      Kuis sudah <strong>Published</strong>. Mahasiswa sekarang bisa melihat dan mengerjakan kuis ini.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {questions.length} soal · {totalPoints} poin total
                  </p>
                  {/* DEBUG INFO */}
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {quizStatus} | Has Quiz: {currentQuiz ? "✅" : "❌"} | Has Questions: {questions.length > 0 ? "✅" : "❌"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {quizStatus === "draft" ? (
                    <Button
                      onClick={handlePublishQuiz}
                      disabled={isPublishing}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isPublishing ? "Publishing..." : "Publish Kuis"}
                    </Button>
                  ) : (
                    <div className="text-sm text-green-600 font-medium">
                      ✅ Kuis sudah published
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onSave) onSave(currentQuiz);
                    }}
                    size="lg"
                  >
                    Kembali ke Daftar Kuis
                  </Button>
                </div>
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
