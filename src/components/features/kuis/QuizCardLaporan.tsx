/**
 * QuizCardLaporan Component
 *
 * Purpose: Menampilkan kartu tugas Laporan Praktikum
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
  Users,
  FileText,
  Calendar,
  MoreVertical,
  AlertCircle,
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

interface QuizCardLaporanProps {
  quiz: Kuis;
  onUpdate?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  showActions?: boolean;
}

export function QuizCardLaporan({
  quiz,
  onUpdate,
  onDelete,
  compact = false,
  showActions = true,
}: QuizCardLaporanProps) {
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

  const totalAttempts =
    (quiz as any).submitted_count || (quiz as any).total_attempts || 0;
  const pendingReviewCount =
    (quiz as any).pending_review_count ?? totalAttempts;
  const gradedCount = (quiz as any).graded_count || 0;

  const reportStatusText =
    pendingReviewCount > 0
      ? `${pendingReviewCount} laporan menunggu penilaian`
      : gradedCount > 0
        ? `${gradedCount} laporan sudah dinilai`
        : totalAttempts > 0
          ? `${totalAttempts} pengumpulan masuk`
          : isPublished
            ? "Belum ada laporan dikumpulkan"
            : "Siap dilengkapi sebelum dipublikasikan";

  const formatShortDate = (date?: string | null) => {
    if (!date) return "Fleksibel";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

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
          className="h-8 w-8 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
          <Users className="mr-2 h-4 w-4" />
          Lihat Pengumpulan
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
          "border border-amber-200 bg-gradient-to-br from-[#fffaf2] via-[#fff5e8] to-[#f7fbf2] text-slate-900 shadow-[0_18px_40px_-24px_rgba(217,119,6,0.2)]",
          compact && "rounded-xl",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-700 via-amber-500 to-lime-300" />

        <CardHeader className={cn("px-5 pb-0 pt-5", compact && "px-4 pt-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    isPublished
                      ? "border-green-200 bg-green-50 text-green-800"
                      : quizStatus === "draft"
                        ? "border-amber-300 bg-[#fff2d8] text-amber-900"
                        : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isPublished
                        ? "bg-green-500"
                        : quizStatus === "draft"
                          ? "bg-amber-500"
                          : "bg-muted-foreground",
                    )}
                  />
                  {isPublished
                    ? "Aktif"
                    : quizStatus === "draft"
                      ? "Draft"
                      : statusLabel}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-800">
                  <FileText className="h-3 w-3" />
                  Laporan Praktikum
                </span>

                {pendingReviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800">
                    <AlertCircle className="h-3 w-3" />
                    {pendingReviewCount} Perlu Dinilai
                  </span>
                ) : gradedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                    <Users className="h-3 w-3" />
                    {gradedCount} Sudah Dinilai
                  </span>
                ) : null}
              </div>

              <h3
                className={cn(
                  "font-semibold leading-snug tracking-tight text-slate-900",
                  compact ? "text-base" : "text-[17px]",
                )}
              >
                {quiz.judul}
              </h3>

              {quiz.kelas && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-amber-900/75">
                  {quizMataKuliah && (
                    <>
                      <code className="rounded-md border border-blue-300/40 bg-blue-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-blue-800">
                        {quizMataKuliah.kode_mk}
                      </code>
                      <span
                        className="text-muted-foreground/60"
                        aria-hidden="true"
                      >
                        -
                      </span>
                      <span>{quizMataKuliah.nama_mk}</span>
                      <span
                        className="text-muted-foreground/40"
                        aria-hidden="true"
                      >
                        &bull;
                      </span>
                    </>
                  )}
                  <span>Kelas {quiz.kelas.nama_kelas}</span>
                </div>
              )}

              {quiz.deskripsi && !compact && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                  {quiz.deskripsi}
                </p>
              )}

              {!compact && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-gradient-to-r from-[#fff1d8] via-[#fff6e8] to-[#edf8e7] px-3.5 py-2 text-sm">
                  <p className="text-[13px] font-semibold text-amber-900">
                    Deadline {formatShortDate(quiz.tanggal_selesai)}
                    {" | "}
                    {totalAttempts} pengumpulan
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700/75">
                    {reportStatusText}
                  </p>
                </div>
              )}
            </div>

            {showActions && compact && actionMenu}
          </div>
        </CardHeader>

        <CardContent className={cn("px-5 pb-0 pt-3", compact && "px-4 pt-2.5")}>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-white/80 px-3 py-2.5 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white">
                <FileText className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Format
              </p>
              <p className="tabular-nums text-sm font-semibold text-slate-900">
                Upload file
              </p>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-white/80 px-3 py-2.5 shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime-100">
                <Users className="h-3.5 w-3.5 text-lime-800" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Pengumpulan
              </p>
              <p className="tabular-nums text-sm font-semibold text-slate-900">
                {totalAttempts} file
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter
          className={cn(
            "mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-amber-100 px-5 pb-3.5 pt-3",
            compact && "mt-3 px-4 pb-3 pt-3",
          )}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="leading-tight">
              {quiz.tanggal_mulai && quiz.tanggal_selesai ? (
                <>
                  Deadline{" "}
                  {new Date(quiz.tanggal_selesai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              ) : (
                "Tanggal fleksibel"
              )}
            </span>
          </div>

          {!compact && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="h-9 min-w-[110px] rounded-xl border-amber-200 bg-white px-3 text-xs font-medium text-amber-900 hover:border-amber-300 hover:bg-amber-50"
              >
                <Edit className="mr-1.5 h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                onClick={isPublished ? handleViewResults : handleEdit}
                className="h-9 min-w-[158px] rounded-xl border border-amber-200 bg-white px-3 text-xs font-medium text-amber-900 hover:bg-amber-50"
              >
                <FileText className="mr-1.5 h-3 w-3" />
                {isPublished ? "Lihat Pengumpulan" : "Lengkapi & Publish"}
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
