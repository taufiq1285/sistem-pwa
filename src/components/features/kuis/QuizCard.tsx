/**
 * QuizCard Component
 * 
 * Purpose: Display quiz information in card format with actions
 * Used by: KuisListPage (Dosen)
 * Features: Publish/unpublish, edit, delete, duplicate, view results
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Kuis } from '@/types/kuis.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteKuis, duplicateKuis, updateKuis } from '@/lib/api/kuis.api';

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
  
  const isActive = (quiz as any).is_active ?? (quiz as any).status === 'active';
  const isPublished = isActive;
  
  // Quiz status based on dates
  const now = new Date();
  const startDate = new Date(quiz.tanggal_mulai);
  const endDate = new Date(quiz.tanggal_selesai);
  
  let statusLabel = 'Draft';
  let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  
  if (isPublished) {
    if (now < startDate) {
      statusLabel = 'Terjadwal';
      statusVariant = 'outline';
    } else if (now >= startDate && now <= endDate) {
      statusLabel = 'Aktif';
      statusVariant = 'default';
    } else {
      statusLabel = 'Selesai';
      statusVariant = 'secondary';
    }
  }
  
  // Get stats
  const totalQuestions = (quiz as any).total_soal || 0;
  const totalAttempts = (quiz as any).total_attempts || 0;
  const totalPoints = (quiz as any).total_poin || 0;
  const duration = (quiz as any).durasi || (quiz as any).durasi_menit || 0;
  
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
      await updateKuis(quiz.id, {
        is_active: !isActive,
      } as any);
      
      toast.success(
        isActive ? 'Kuis berhasil di-unpublish' : 'Kuis berhasil dipublish'
      );
      
      onUpdate?.();
    } catch (error: any) {
      toast.error('Gagal mengubah status kuis', {
        description: error.message,
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
      
      toast.success('Kuis berhasil diduplikasi', {
        description: 'Kuis baru telah dibuat',
      });
      
      onUpdate?.();
      
      // Navigate to edit the duplicated quiz
      navigate(`/dosen/kuis/${duplicated.id}/edit`);
    } catch (error: any) {
      toast.error('Gagal menduplikasi kuis', {
        description: error.message,
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
      
      toast.success('Kuis berhasil dihapus');
      
      onDelete?.();
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error('Gagal menghapus kuis', {
        description: error.message,
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
      <Card className={cn(
        "hover:shadow-md transition-shadow",
        compact && "border-dashed"
      )}>
        <CardHeader className={cn("pb-3", compact && "pb-2")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Status & Type Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant={statusVariant}>
                  {statusLabel}
                </Badge>
                
                {(quiz as any).tipe_kuis && (
                  <Badge variant="outline">
                    {(quiz as any).tipe_kuis}
                  </Badge>
                )}
                
                {isPublished && (
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" />
                    Published
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <h3 className={cn(
                "font-semibold truncate",
                compact ? "text-base" : "text-lg"
              )}>
                {quiz.judul}
              </h3>
              
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
                    {isActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Publish
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
          <div className={cn(
            "grid gap-3",
            compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
          )}>
            {/* Questions Count */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Soal</p>
                <p className="text-sm font-semibold truncate">
                  {totalQuestions} soal
                </p>
              </div>
            </div>
            
            {/* Duration */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
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
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
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
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
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
        
        <CardFooter className={cn(
          "flex items-center justify-between pt-3 border-t",
          compact && "pt-2"
        )}>
          {/* Date Range */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(quiz.tanggal_mulai).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
              {' - '}
              {new Date(quiz.tanggal_selesai).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          
          {/* Quick Actions */}
          {!compact && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleViewResults}
              >
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
              Hapus Kuis?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kuis "{quiz.judul}"?
              <br /><br />
              <strong>Perhatian:</strong> Semua data termasuk soal, percobaan mahasiswa, 
              dan jawaban akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
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
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
} {
  const isActive = (quiz as any).is_active ?? (quiz as any).status === 'active';
  const now = new Date();
  const startDate = new Date(quiz.tanggal_mulai);
  const endDate = new Date(quiz.tanggal_selesai);
  
  if (!isActive) {
    return {
      label: 'Draft',
      variant: 'secondary',
      icon: EyeOff,
    };
  }
  
  if (now < startDate) {
    return {
      label: 'Terjadwal',
      variant: 'outline',
      icon: Clock,
    };
  }
  
  if (now >= startDate && now <= endDate) {
    return {
      label: 'Aktif',
      variant: 'default',
      icon: CheckCircle2,
    };
  }
  
  return {
    label: 'Selesai',
    variant: 'secondary',
    icon: XCircle,
  };
}