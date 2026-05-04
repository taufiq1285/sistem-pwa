/**
 * Bank Soal Page
 *
 * Purpose: Manage reusable question bank for dosen
 * Features:
 * - View all saved questions
 * - Search and filter questions
 * - Create, edit, delete questions
 * - View usage statistics
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import {
  getBankSoal,
  getBankSoalStats,
  deleteBankSoal,
  createBankSoal,
  updateBankSoal,
} from "@/lib/api/bank-soal.api";
import type {
  BankSoal,
  BankSoalFilters,
  BankSoalStats,
  CreateBankSoalData,
} from "@/types/bank-soal.types";
import { TIPE_SOAL } from "@/types/kuis.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  BookOpen,
  TrendingUp,
  Target,
  CheckCircle2,
  MessageSquareText,
  CircleDashed,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { QuestionEditor } from "@/components/features/kuis/builder/QuestionEditor";

export default function BankSoalPage() {
  const { user } = useAuth();
  const [dosenId, setDosenId] = useState<string>("");

  const [questions, setQuestions] = useState<BankSoal[]>([]);
  const [stats, setStats] = useState<BankSoalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [discussionFilter, setDiscussionFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankSoal | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<BankSoal | null>(
    null,
  );

  const getCorrectOption = (question: BankSoal) => {
    const options = question.opsi_jawaban || [];
    return (
      options.find(
        (option) =>
          option.is_correct === true ||
          option.id === question.jawaban_benar ||
          option.label === question.jawaban_benar,
      ) || null
    );
  };

  const filteredQuestions = questions.filter((question) => {
    if (discussionFilter === "with") {
      return Boolean(question.penjelasan?.trim());
    }

    if (discussionFilter === "without") {
      return !question.penjelasan?.trim();
    }

    return true;
  });

  const visibleQuestions = filteredQuestions.slice(0, visibleCount);
  const questionsWithoutDiscussion = questions.filter(
    (question) => !question.penjelasan?.trim(),
  ).length;

  // Fetch dosen ID
  useEffect(() => {
    const fetchDosenId = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("dosen")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (data) setDosenId(data.id);
      } catch (error) {
        console.error("Error fetching dosen ID:", error);
      }
    };

    fetchDosenId();
  }, [user]);

  // Load questions
  useEffect(() => {
    if (!dosenId) return;
    setVisibleCount(20);
    loadQuestions();
    loadStats();
  }, [dosenId, searchQuery]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      const filters: BankSoalFilters = {
        dosen_id: dosenId,
        include_public: false,
        sortBy: "created_at",
        sortOrder: "desc",
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      // Always filter only pilihan ganda
      filters.tipe_soal = TIPE_SOAL.PILIHAN_GANDA as any;

      const data = await getBankSoal(filters);
      setQuestions(data);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Gagal memuat bank soal");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getBankSoalStats(dosenId);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus soal ini dari bank?")) return;

    try {
      await deleteBankSoal(id);
      toast.success("Soal berhasil dihapus");
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Gagal menghapus soal");
    }
  };

  const handleEdit = (question: BankSoal) => {
    setEditingQuestion(question);
    setShowEditor(true);
  };

  const handleSaveQuestion = async (questionData: any) => {
    try {
      // Transform data from QuestionEditor format to BankSoal format
      // Remove kuis_id and urutan fields which don't exist in bank_soal
      const bankSoalData = {
        pertanyaan: questionData.pertanyaan,
        tipe_soal: questionData.tipe_soal,
        poin: questionData.poin,
        opsi_jawaban: questionData.opsi_jawaban || undefined,
        jawaban_benar: questionData.jawaban_benar || undefined,
        penjelasan: questionData.penjelasan || undefined,
        tags: questionData.tags || [],
      };

      if (editingQuestion) {
        // Update existing
        await updateBankSoal(editingQuestion.id, bankSoalData);
        toast.success("Soal berhasil diperbarui");
      } else {
        // Create new
        await createBankSoal({
          ...bankSoalData,
          dosen_id: dosenId,
          is_public: true,
        } as CreateBankSoalData);
        toast.success("Soal berhasil ditambahkan ke bank");
      }

      setSearchQuery("");
      setShowEditor(false);
      setEditingQuestion(null);
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Gagal menyimpan soal");
    }
  };

  if (showEditor) {
    if (!dosenId) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Bank Soal</h1>
          <p className="text-muted-foreground">Memuat data dosen…</p>
        </div>
      );
    }

    return (
      <QuestionEditor
        kuisId="bank" // Dummy kuis ID for bank
        dosenId={dosenId}
        question={editingQuestion as any}
        urutan={1}
        defaultPoin={1}
        cbtMode={true} // Force only pilihan ganda
        onSave={handleSaveQuestion}
        onCancel={() => {
          setShowEditor(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="role-page-shell">
      <div className="role-page-content space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent">
              Bank Soal
            </h1>
            <p className="text-sm sm:text-lg font-semibold text-muted-foreground">
              Kelola soal yang dapat digunakan kembali untuk kuis
            </p>
          </div>

          <Button
            onClick={() => setShowEditor(true)}
            className="w-full sm:w-auto bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Soal Baru
          </Button>
        </div>

        {/* Statistics Cards - Only Pilihan Ganda */}
        {stats && (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-primary">
                  Total Soal Pilihan Ganda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="text-3xl sm:text-4xl font-bold text-primary/90">
                    {stats.pilihan_ganda_count}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-warning/5 to-warning/10 dark:from-warning/10 dark:to-warning/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-warning">
                  Total Penggunaan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  <div className="text-3xl sm:text-4xl font-bold text-warning">
                    {stats.total_usage}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-success/5 to-success/10 dark:from-success/10 dark:to-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-success">
                  Belum Ada Pembahasan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-success" />
                  <div className="text-3xl sm:text-4xl font-bold text-success/90">
                    {questionsWithoutDiscussion}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search - Only Pilihan Ganda */}
        <Card className="interactive-card border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Pencarian Soal Pilihan Ganda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari soal pilihan ganda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={discussionFilter}
                  onValueChange={(value) =>
                    setDiscussionFilter(value as "all" | "with" | "without")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter pembahasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembahasan</SelectItem>
                    <SelectItem value="with">Ada Pembahasan</SelectItem>
                    <SelectItem value="without">
                      Belum Ada Pembahasan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery.trim()
                  ? `Menampilkan ${filteredQuestions.length} hasil dari total ${stats?.pilihan_ganda_count || 0} soal`
                  : `Menampilkan ${visibleQuestions.length} dari ${filteredQuestions.length} soal milik Anda`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="interactive-card border-0 shadow-xl p-8 sm:p-12">
              <CardContent className="text-center">
                <p className="text-base font-semibold">Memuat soal...</p>
              </CardContent>
            </Card>
          ) : filteredQuestions.length === 0 ? (
            <Card className="interactive-card border-0 shadow-xl bg-linear-to-br from-white to-primary/5 dark:from-slate-900 dark:to-primary/10 p-8 sm:p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-linear-to-br from-primary/20 to-accent/20 blur-3xl -mr-20 -mt-20" />
              <CardContent className="text-center relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <BookOpen className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-bold mb-2">Belum ada soal di bank</p>
                <p className="text-sm text-muted-foreground mb-5">
                  Mulai dengan membuat soal pilihan ganda pertama untuk
                  memperkaya bank soal.
                </p>
                <Button
                  onClick={() => setShowEditor(true)}
                  className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Soal Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            visibleQuestions.map((q) => (
              <Card
                key={q.id}
                className="interactive-card border-0 shadow-xl p-4 sm:p-6"
              >
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-semibold">
                          {q.poin} poin
                        </Badge>
                        <Badge variant="secondary" className="font-semibold">
                          CBT
                        </Badge>
                        <StatusBadge status="info" pulse={false} dot={false}>
                          Dipakai {q.usage_count || 0}x
                        </StatusBadge>
                        {q.penjelasan ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-200">
                            <MessageSquareText className="mr-1 h-3 w-3" />
                            Ada Pembahasan
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-200"
                          >
                            <CircleDashed className="mr-1 h-3 w-3" />
                            Belum Ada Pembahasan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-semibold">
                        {q.pertanyaan}
                      </p>

                      {!!q.opsi_jawaban?.length && (
                        <div className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Preview Opsi
                            </p>
                            {getCorrectOption(q) && (
                              <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Jawaban benar:{" "}
                                {getCorrectOption(q)?.label ||
                                  getCorrectOption(q)?.id}
                              </div>
                            )}
                          </div>

                          <div className="grid gap-2">
                            {q.opsi_jawaban.slice(0, 2).map((option) => {
                              const isCorrect =
                                option.is_correct === true ||
                                option.id === q.jawaban_benar ||
                                option.label === q.jawaban_benar;

                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                                    isCorrect
                                      ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100"
                                      : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                                  }`}
                                >
                                  <span className="min-w-5 font-semibold">
                                    {option.label}.
                                  </span>
                                  <span className="flex-1">
                                    {option.text || "(opsi kosong)"}
                                  </span>
                                </div>
                              );
                            })}
                            {q.opsi_jawaban.length > 2 && (
                              <p className="text-xs font-medium text-muted-foreground">
                                +{q.opsi_jawaban.length - 2} opsi lain
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                          Pembahasan Untuk Mahasiswa
                        </p>
                        <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                          {q.penjelasan?.trim()
                            ? q.penjelasan
                            : "Belum ada pembahasan. Tambahkan pembahasan agar mahasiswa mendapat penjelasan setelah menjawab."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQuestion(q)}
                        className="font-semibold"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(q)}
                        className="font-semibold"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                        className="text-destructive hover:text-destructive font-semibold"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {visibleCount < filteredQuestions.length && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((count) => count + 20)}
                className="font-semibold"
              >
                Muat Lagi
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedQuestion}
        onOpenChange={(open) => !open && setSelectedQuestion(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedQuestion && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Soal CBT</DialogTitle>
                <DialogDescription>
                  {selectedQuestion.poin} poin | Dipakai{" "}
                  {selectedQuestion.usage_count || 0}x
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pertanyaan
                  </p>
                  <p className="font-semibold">{selectedQuestion.pertanyaan}</p>
                </div>

                {!!selectedQuestion.opsi_jawaban?.length && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Opsi Jawaban
                    </p>
                    {selectedQuestion.opsi_jawaban.map((option) => {
                      const isCorrect =
                        option.is_correct === true ||
                        option.id === selectedQuestion.jawaban_benar ||
                        option.label === selectedQuestion.jawaban_benar;

                      return (
                        <div
                          key={option.id}
                          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                            isCorrect
                              ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100"
                              : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                          }`}
                        >
                          <span className="min-w-5 font-semibold">
                            {option.label}.
                          </span>
                          <span className="flex-1">
                            {option.text || "(opsi kosong)"}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                    Pembahasan Untuk Mahasiswa
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                    {selectedQuestion.penjelasan?.trim()
                      ? selectedQuestion.penjelasan
                      : "Belum ada pembahasan."}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
