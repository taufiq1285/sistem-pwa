/**
 * QuizCardCBT Component
 *
 * Purpose: Menampilkan kartu tugas Tes CBT
 * Used by: KuisListPage (Dosen)
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Users,
  FileText,
  Calendar,
  MoreVertical,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Kuis } from "@/types/kuis.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  deleteKuis,
  duplicateKuis,
  publishKuis,
  unpublishKuis,
} from "@/lib/api/kuis.api";

interface QuizCardCBTProps {
  quiz: Kuis;
  onUpdate?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showActions?: boolean;
}

export function QuizCardCBT({
  quiz,
  onUpdate,
  onDelete,
  compact = false,
  showActions = true,
}: QuizCardCBTProps) {
  const navigate = useNavigate();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const quizStatus = quiz.status || "draft";
  const isPublished = quizStatus === "published";
  const quizMataKuliah = quiz.mata_kuliah || quiz.kelas?.mata_kuliah || null;

  let statusLabel = "Draft";
  if (quizStatus === "archived") statusLabel = "Diarsipkan";
  else if (isPublished) statusLabel = "Aktif";

  const soalList = Array.isArray(quiz.soal) ? quiz.soal : [];
  const totalQuestions = (quiz as any).total_soal || soalList.length || 0;
  const totalAttempts =
    (quiz as any).submitted_count || (quiz as any).total_attempts || 0;
  const totalPoints =
    (quiz as any).total_poin ||
    soalList.reduce((sum, soal) => sum + (soal?.poin || 0), 0);
  const duration = (quiz as any).durasi || (quiz as any).durasi_menit || 0;

  const cbtSubmissionText =
    totalAttempts > 0
      ? `${totalAttempts} pengumpulan jawaban sudah masuk`
      : isPublished
        ? "Belum ada pengumpulan jawaban"
        : "Siap dipublikasikan ke mahasiswa";

  const handleEdit = () => navigate(`/dosen/kuis/${quiz.id}/edit`);
  const handleViewResults = () => navigate(`/dosen/kuis/${quiz.id}/results`);

  const handleTogglePublish = async () => {
    setIsToggling(true);
    try {
      if (isPublished) {
        await unpublishKuis(quiz.id);
        toast.success("Tugas berhasil di-unpublish", {
          description: "Tugas tidak akan muncul di akun mahasiswa",
        });
      } else {
        await publishKuis(quiz.id);
        toast.success("Tugas berhasil dipublish", {
          description: "Tugas sekarang muncul di akun mahasiswa",
        });
      }
      onUpdate?.();
    } catch (error: unknown) {
      toast.error("Gagal mengubah status tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDuplicate = async () => {
    if (!navigator.onLine) {
      toast.error(
        "Tidak dapat menduplikasi tugas saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }
    setIsDuplicating(true);
    try {
      const duplicated = await duplicateKuis(quiz.id);
      toast.success("Tugas berhasil diduplikasi", {
        description: "Tugas baru telah dibuat",
      });
      onUpdate?.();
      navigate(`/dosen/kuis/${duplicated.id}/edit`);
    } catch (error: unknown) {
      toast.error("Gagal menduplikasi tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!navigator.onLine) {
      toast.error(
        "Tidak dapat menghapus tugas saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }
    setIsDeleting(true);
    try {
      await deleteKuis(quiz.id);
      toast.success("Tugas berhasil dihapus");
      onDelete?.();
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      toast.error("Gagal menghapus tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const actionMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewResults}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Lihat Hasil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTogglePublish} disabled={isToggling}>
          {isPublished ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Publish / Mulai
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDuplicate}
          disabled={isDuplicating || !navigator.onLine}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplikasi
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setShowDeleteDialog(true)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-md",
          "border border-blue-300 bg-[#2f302a] text-white shadow-[0_20px_44px_-26px_rgba(15,23,42,0.65)]",
          compact && "rounded-xl",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-blue-400 to-sky-300" />

        <CardHeader className={cn("px-5 pb-0 pt-5", compact && "px-4 pt-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={
                    isPublished
                      ? {
                          background: "rgba(74,222,128,0.15)",
                          borderColor: "rgba(74,222,128,0.3)",
                          color: "#86efac",
                        }
                      : quizStatus === "draft"
                        ? {
                            background: "rgba(251,191,36,0.15)",
                            borderColor: "rgba(251,191,36,0.3)",
                            color: "#fcd34d",
                          }
                        : {
                            background: "rgba(255,255,255,0.1)",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.75)",
                          }
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: isPublished
                        ? "#4ade80"
                        : quizStatus === "draft"
                          ? "#fbbf24"
                          : undefined,
                    }}
                  />
                  {isPublished ? "Aktif" : quizStatus === "draft" ? "Draft" : statusLabel}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-sky-200"
                  style={{
                    background: "rgba(56,189,248,0.15)",
                    border: "1px solid rgba(56,189,248,0.3)",
                  }}
                >
                  <ClipboardList className="h-3 w-3" />
                  CBT
                </span>

                {totalAttempts > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-sky-300"
                    style={{
                      background: "rgba(56,189,248,0.15)",
                      border: "1px solid rgba(56,189,248,0.3)",
                    }}
                  >
                    <Users className="h-3 w-3" />
                    {totalAttempts} Pengumpulan
                  </span>
                )}
              </div>

              <h3
                className={cn(
                  "font-semibold leading-snug tracking-tight text-white",
                  compact ? "text-base" : "text-[17px]",
                )}
              >
                {quiz.judul}
              </h3>

              {quiz.kelas && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/70">
                  {quizMataKuliah && (
                    <>
                      <code className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-blue-800">
                        {quizMataKuliah.kode_mk}
                      </code>
                      <span className="text-white/40" aria-hidden="true">
                        -
                      </span>
                      <span>{quizMataKuliah.nama_mk}</span>
                      <span className="text-white/30" aria-hidden="true">
                        &bull;
                      </span>
                    </>
                  )}
                  <span>Kelas {quiz.kelas.nama_kelas}</span>
                </div>
              )}

              {quiz.deskripsi && !compact && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/65">
                  {quiz.deskripsi}
                </p>
              )}

              {!compact && (
                <div className="mt-3 rounded-xl border border-blue-200/70 bg-[#c5d9f1] px-3.5 py-2 text-sm">
                  <p className="text-[13px] text-sky-900">
                    <span className="font-semibold">{totalQuestions} soal</span>
                    {" | "}
                    <span className="font-semibold">
                      {duration > 0 ? `${duration} menit` : "tanpa batas"}
                    </span>
                    {" | "}
                    <span className="font-semibold">{totalPoints} poin</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-700/80">
                    {cbtSubmissionText}
                  </p>
                </div>
              )}
            </div>

            {showActions && compact && actionMenu}
          </div>
        </CardHeader>

        <CardContent className={cn("px-5 pb-0 pt-3", compact && "px-4 pt-2.5")}>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#32332d] px-3 py-2.5 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">
                Soal
              </p>
              <p className="tabular-nums text-sm font-semibold text-white">
                {totalQuestions} soal
              </p>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#32332d] px-3 py-2.5 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">
                Durasi
              </p>
              <p className="tabular-nums text-sm font-semibold text-white">
                {duration > 0 ? `${duration} menit` : "Tanpa batas"}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter
          className={cn(
            "mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 pb-3.5 pt-3",
            compact && "mt-3 px-4 pb-3 pt-3",
          )}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-white/70">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {quiz.tanggal_mulai && quiz.tanggal_selesai
                ? new Date(quiz.tanggal_selesai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Tanggal fleksibel"}
            </span>
          </div>

          {!compact && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="h-9 min-w-[110px] rounded-xl border-white/15 bg-transparent px-3 text-xs font-medium text-white hover:bg-white/8 hover:text-white"
              >
                <Edit className="mr-1.5 h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={isPublished ? handleViewResults : handleEdit}
                className="h-9 min-w-[158px] rounded-xl border border-blue-100 bg-[#d7e7fa] px-3 text-xs font-medium text-slate-800 hover:bg-[#e6f0fc]"
              >
                <BarChart3 className="mr-1.5 h-3 w-3" />
                {isPublished ? "Lihat Hasil" : "Siapkan Publish"}
              </Button>
              {showActions && actionMenu}
            </div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Hapus Tugas?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tugas "{quiz.judul}"?
              <br />
              <br />
              <strong>Perhatian:</strong> Semua data termasuk soal, percobaan
              mahasiswa, dan jawaban akan dihapus permanen. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || !navigator.onLine}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
