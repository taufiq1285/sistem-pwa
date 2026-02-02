/**
 * QuizCard Component (Tugas Praktikum)
 *
 * Purpose: Display task information in card format with actions
 * Used by: KuisListPage (Dosen)
 * Features: Publish/unpublish, edit, delete, duplicate, view results
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
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
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// ============================================================================
// TYPES
// ============================================================================

interface QuizCardProps {
  /**
   * Quiz data
   */
  quiz: Kuis;

  /**
   * Callback when quiz is updated
   */
  onUpdate?: () => void;

  /**
   * Callback when quiz is deleted
   */
  onDelete?: () => void;

  /**
   * Compact mode (smaller card)
   */
  compact?: boolean;

  /**
   * Show actions menu
   */
  showActions?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizCard({
  quiz,
  onUpdate,
  onDelete,
  compact = false,
  showActions = true,
}: QuizCardProps) {
  const navigate = useNavigate();

  // State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // ✅ SIMPLIFIED: Status based only on publish state (no dates)
  const quizStatus = quiz.status || "draft";
  const isPublished = quizStatus === "published";

  // ✅ DETERMINE QUIZ TYPE for visual differentiation
  const quizType = (quiz as any).tipe_kuis || "campuran"; // Default to mixed

  // ✅ Mapping: essay = laporan praktikum, selain itu = Tes CBT
  const isLaporan = quizType === "essay";
  const isCBT = !isLaporan; // Everything else (pilihan_ganda, campuran) is CBT-style

  let statusLabel = "Draft";
  let statusVariant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";

  if (quizStatus === "archived") {
    statusLabel = "Diarsipkan";
    statusVariant = "destructive";
  } else if (isPublished) {
    statusLabel = "Aktif";
    statusVariant = "default";
  }

  // Get stats
  const totalQuestions = (quiz as any).total_soal || 0;
  const totalAttempts = (quiz as any).total_attempts || 0;
  const totalPoints = (quiz as any).total_poin || 0;
  const duration = (quiz as any).durasi || (quiz as any).durasi_menit || 0;

  // ✅ VISUAL DIFFERENTIATION: Different styles for CBT vs Laporan
  const typeConfig = isLaporan
    ? {
        // 📄 LAPORAN PRAKTIKUM - Orange/Amber theme
        borderColor: "border-l-orange-500",
        headerBg: "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
        typeLabel: "Laporan Praktikum",
        typeIcon: "📄",
        typeBadgeColor: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300",
        typeBorder: "border-orange-200 dark:border-orange-800",
      }
    : {
        // ✅ TES CBT - Blue theme (ALL non-laporan types)
        borderColor: "border-l-blue-500",
        headerBg: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
        typeLabel: "Tes CBT",
        typeIcon: "✅",
        typeBadgeColor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300",
        typeBorder: "border-blue-200 dark:border-blue-800",
      };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Navigate to edit page
   */
  const handleEdit = () => {
    navigate(`/dosen/kuis/${quiz.id}/edit`);
  };

  /**
   * Navigate to results page
   */
  const handleViewResults = () => {
    navigate(`/dosen/kuis/${quiz.id}/results`);
  };

  /**
   * Toggle publish/unpublish
   */
  const handleTogglePublish = async () => {
    setIsToggling(true);

    try {
      if (isPublished) {
        // Unpublish: change status from 'published' to 'draft'
        await unpublishKuis(quiz.id);
        toast.success("Tugas berhasil di-unpublish", {
          description: "Tugas tidak akan muncul di akun mahasiswa",
        });
      } else {
        // Publish: change status from 'draft' to 'published'
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

  /**
   * Duplicate quiz
   */
  const handleDuplicate = async () => {
    setIsDuplicating(true);

    try {
      const duplicated = await duplicateKuis(quiz.id);

      toast.success("Tugas berhasil diduplikasi", {
        description: "Tugas baru telah dibuat",
      });

      onUpdate?.();

      // Navigate to edit the duplicated task
      navigate(`/dosen/kuis/${duplicated.id}/edit`);
    } catch (error: unknown) {
      toast.error("Gagal menduplikasi tugas", {
        description: (error as Error).message,
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  /**
   * Delete quiz
   */
  const handleDelete = async () => {
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <Card
        className={cn(
          "hover:shadow-lg transition-all duration-200 border-l-4",
          compact && "border-dashed",
          // ✅ Type-based border color (overrides status border for clarity)
          typeConfig.borderColor,
        )}
      >
        <CardHeader className={cn("pb-3", compact && "pb-2", typeConfig.headerBg)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* ✅ ENHANCED: Type Badge - More prominent for clarity */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Status Badge */}
                <Badge
                  variant={statusVariant}
                  className={cn(
                    isPublished &&
                      "bg-green-100 text-green-700 border-green-300",
                    !isPublished &&
                      quizStatus === "draft" &&
                      "bg-yellow-100 text-yellow-700 border-yellow-300",
                  )}
                >
                  {isPublished
                    ? "🟢 Aktif"
                    : quizStatus === "draft"
                      ? "🟡 Draft"
                      : statusLabel}
                </Badge>

                {/* ✅ TYPE BADGE - LARGER AND MORE PROMINENT */}
                <Badge
                  variant="outline"
                  className={cn(
                    "font-bold text-sm px-3 py-1 border-2",
                    typeConfig.typeBadgeColor,
                    typeConfig.typeBorder,
                  )}
                >
                  {typeConfig.typeLabel}
                </Badge>

                {isPublished && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-blue-50 text-blue-600"
                  >
                    <Eye className="h-3 w-3" />
                    Tersedia
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3
                className={cn(
                  "font-semibold truncate",
                  compact ? "text-base" : "text-lg",
                )}
              >
                {quiz.judul}
              </h3>

              {/* Mata Kuliah & Kelas Info */}
              {quiz.kelas && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    📚
                    <span className="font-medium text-blue-700">
                      {quiz.kelas.mata_kuliah?.kode_mk}
                    </span>
                    - {quiz.kelas.mata_kuliah?.nama_mk}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Kelas: {quiz.kelas.nama_kelas}</span>
                </div>
              )}

              {/* Description */}
              {quiz.deskripsi && !compact && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {quiz.deskripsi}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleViewResults}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Lihat Hasil
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleTogglePublish}
                    disabled={isToggling}
                  >
                    {isPublished ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Publish / Mulai
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    disabled={isDuplicating}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplikasi
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn("pb-3", compact && "pb-2")}>
          {/* Stats Grid */}
          <div
            className={cn(
              "grid gap-3",
              compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4",
            )}
          >
            {/* Questions Count OR File Upload */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                isLaporan ? "bg-amber-100 dark:bg-amber-900" : "bg-blue-100 dark:bg-blue-900"
              )}>
                <FileText className={cn(
                  "h-4 w-4",
                  isLaporan ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                )} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{isLaporan ? "Instruksi" : "Soal"}</p>
                <p className="text-sm font-semibold truncate">
                  {isLaporan ? "Upload File" : `${totalQuestions} soal`}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                isLaporan ? "bg-orange-100 dark:bg-orange-900" : "bg-orange-100 dark:bg-orange-900"
              )}>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Durasi</p>
                <p className="text-sm font-semibold truncate">
                  {duration} menit
                </p>
              </div>
            </div>

            {/* Attempts */}
            {!compact && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  isLaporan ? "bg-green-100 dark:bg-green-900" : "bg-green-100 dark:bg-green-900"
                )}>
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Percobaan</p>
                  <p className="text-sm font-semibold truncate">
                    {totalAttempts} kali
                  </p>
                </div>
              </div>
            )}

            {/* Total Points */}
            {!compact && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  isLaporan ? "bg-purple-100 dark:bg-purple-900" : "bg-purple-100 dark:bg-purple-900"
                )}>
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Poin</p>
                  <p className="text-sm font-semibold truncate">
                    {totalPoints} poin
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter
          className={cn(
            "flex items-center justify-between pt-3 border-t",
            compact && "pt-2",
          )}
        >
          {/* Date Range */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {quiz.tanggal_mulai && quiz.tanggal_selesai ? (
                <>
                  {new Date(quiz.tanggal_mulai).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" - "}
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

          {/* Quick Actions */}
          {!compact && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>

              <Button variant="default" size="sm" onClick={handleViewResults}>
                <BarChart3 className="h-3 w-3 mr-1" />
                Hasil
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
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
              disabled={isDeleting}
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get quiz status based on dates and published state
 */
export function getQuizStatus(quiz: Kuis): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
} {
  const isActive = (quiz as any).is_active ?? (quiz as any).status === "active";
  const now = new Date();
  // ✅ If dates not set, default to "Aktif"
  const startDate = quiz.tanggal_mulai ? new Date(quiz.tanggal_mulai) : null;
  const endDate = quiz.tanggal_selesai ? new Date(quiz.tanggal_selesai) : null;

  if (!isActive) {
    return {
      label: "Draft",
      variant: "secondary",
      icon: EyeOff,
    };
  }

  // ✅ If dates not set, default to "Aktif"
  if (startDate && endDate) {
    if (now < startDate) {
      return {
        label: "Terjadwal",
        variant: "outline",
        icon: Clock,
      };
    }

    if (now >= startDate && now <= endDate) {
      return {
        label: "Aktif",
        variant: "default",
        icon: CheckCircle2,
      };
    }
  } else {
    return {
      label: "Aktif",
      variant: "default",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Selesai",
    variant: "secondary",
    icon: XCircle,
  };
}
