/**
 * QuizBuilder Component - FIXED VERSION
 * 
 * FIX: Added Kelas dropdown field (was missing!)
 * 
 * Purpose: Main quiz builder orchestrator with question management
 * Used by: KuisBuilderPage (Dosen)
 * Features: Quiz metadata, question list, drag-drop reorder, auto-save
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Target,
  FileText,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Custom Components
import { QuestionEditor } from './QuestionEditor';

// Validation
import {
  createKuisSchema,
  type CreateKuisFormData,
} from '@/lib/validations/kuis.schema';

// API
import { createKuis, updateKuis, createSoal, updateSoal, deleteSoal } from '@/lib/api/kuis.api';

// Types
import type { Kuis, Soal } from '@/types/kuis.types';

// Utils
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface QuizBuilderProps {
  /**
   * Existing quiz data (for editing)
   */
  quiz?: Kuis;
  
  /**
   * Kelas ID (required for new quiz)
   */
  kelasId?: string;
  
  /**
   * Dosen ID (required for new quiz)
   */
  dosenId: string;
  
  /**
   * Callback when quiz is saved
   */
  onSave?: (quiz: Kuis) => void;
  
  /**
   * Callback when cancelled
   */
  onCancel?: () => void;
}

interface EditorState {
  isOpen: boolean;
  question?: Soal;
  index?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuizBuilder({
  quiz,
  kelasId,
  dosenId,
  onSave,
  onCancel,
}: QuizBuilderProps) {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const isEditing = !!quiz;
  const [currentQuiz, setCurrentQuiz] = useState<Kuis | null>(quiz || null);
  const [questions, setQuestions] = useState<Soal[]>(quiz?.soal || []);
  const [editorState, setEditorState] = useState<EditorState>({ isOpen: false });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Form for quiz metadata
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateKuisFormData>({
    resolver: zodResolver(createKuisSchema),
    defaultValues: quiz ? {
      kelas_id: quiz.kelas_id,
      dosen_id: quiz.dosen_id,
      judul: quiz.judul,
      deskripsi: quiz.deskripsi || '',
      durasi_menit: quiz.durasi_menit,
      tanggal_mulai: quiz.tanggal_mulai,
      tanggal_selesai: quiz.tanggal_selesai,
      passing_score: quiz.passing_score ?? null,
      max_attempts: quiz.max_attempts ?? null,
      randomize_questions: quiz.randomize_questions ?? null,
      randomize_options: quiz.randomize_options ?? null,
      show_results_immediately: quiz.show_results_immediately ?? null,
      status: quiz.status ?? null,
    } : {
      kelas_id: kelasId || '',
      dosen_id: dosenId,
      judul: '',
      deskripsi: '',
      durasi_menit: 60,
      tanggal_mulai: '',
      tanggal_selesai: '',
      passing_score: 70,
      max_attempts: 1,
      randomize_questions: false,
      randomize_options: false,
      show_results_immediately: true,
      status: 'draft',
    },
  });
  
  const formData = watch();
  
  // ============================================================================
  // HANDLERS - QUIZ METADATA
  // ============================================================================
  
  /**
   * Save quiz metadata
   */
  const handleSaveQuizMetadata = async (data: CreateKuisFormData) => {
    setIsSaving(true);
    
    try {
      let savedQuiz: Kuis;
      
      if (isEditing && currentQuiz) {
        // Update existing quiz
        savedQuiz = await updateKuis(currentQuiz.id, data);
        toast.success('Kuis berhasil diperbarui', {
          description: 'Informasi kuis telah disimpan',
        });
      } else {
        // Create new quiz
        savedQuiz = await createKuis(data);
        toast.success('Kuis berhasil dibuat', {
          description: 'Sekarang Anda dapat menambahkan soal',
        });
      }
      
      setCurrentQuiz(savedQuiz);
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave(savedQuiz);
      }
    } catch (error: any) {
      toast.error('Gagal menyimpan kuis', {
        description: error.message || 'Terjadi kesalahan',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // ============================================================================
  // HANDLERS - QUESTIONS
  // ============================================================================
  
  /**
   * Open editor for new question
   */
  const handleAddQuestion = () => {
    if (!currentQuiz) {
      toast.error('Simpan kuis terlebih dahulu', {
        description: 'Anda harus menyimpan informasi kuis sebelum menambah soal',
      });
      return;
    }
    
    setEditorState({
      isOpen: true,
      question: undefined,
      index: questions.length,
    });
  };
  
  /**
   * Open editor for editing question
   */
  const handleEditQuestion = (question: Soal, index: number) => {
    setEditorState({
      isOpen: true,
      question,
      index,
    });
  };
  
  /**
   * Save question (create or update)
   */
  const handleSaveQuestion = async (questionData: any) => {
    if (!currentQuiz) return;
    
    try {
      let savedQuestion: Soal;
      
      if (editorState.question) {
        // Update existing question
        savedQuestion = await updateSoal(editorState.question.id, questionData);
        
        // Update in list
        setQuestions(prev => 
          prev.map(q => q.id === savedQuestion.id ? savedQuestion : q)
        );
        
        toast.success('Soal berhasil diperbarui');
      } else {
        // Create new question
        savedQuestion = await createSoal({
          ...questionData,
          kuis_id: currentQuiz.id,
        });
        
        // Add to list
        setQuestions(prev => [...prev, savedQuestion]);
        
        toast.success('Soal berhasil ditambahkan');
      }
      
      // Close editor
      setEditorState({ isOpen: false });
    } catch (error: any) {
      toast.error('Gagal menyimpan soal', {
        description: error.message,
      });
    }
  };
  
  /**
   * Delete question
   */
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    
    try {
      await deleteSoal(questionId);
      
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      toast.success('Soal berhasil dihapus');
    } catch (error: any) {
      toast.error('Gagal menghapus soal', {
        description: error.message,
      });
    }
  };
  
  /**
   * Cancel editor
   */
  const handleCancelEditor = () => {
    setEditorState({ isOpen: false });
  };
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const totalPoints = questions.reduce((sum, q) => sum + (q.poin || 0), 0);
  const canAddQuestions = !!currentQuiz;
  const hasQuestions = questions.length > 0;
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Show question editor
  if (editorState.isOpen) {
    return (
      <QuestionEditor
        kuisId={currentQuiz!.id}
        question={editorState.question}
        urutan={(editorState.index || 0) + 1}
        defaultPoin={1}
        onSave={handleSaveQuestion}
        onCancel={handleCancelEditor}
      />
    );
  }
  
  // Show quiz builder
  return (
    <div className="space-y-6">
      {/* Quiz Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informasi Kuis</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-yellow-600">
                Belum Disimpan
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(handleSaveQuizMetadata)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Judul */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="judul">
                  Judul Kuis
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="judul"
                  {...register('judul')}
                  placeholder="Contoh: Kuis Anatomi Sistem Reproduksi"
                  className={cn(errors.judul && "border-destructive")}
                />
                {errors.judul && (
                  <p className="text-sm text-destructive">{errors.judul.message}</p>
                )}
              </div>
              
              {/* Kelas ID - Hidden or from URL */}
              <input
                type="hidden"
                {...register('kelas_id')}
                value={formData.kelas_id || kelasId || ''}
              />
              
              {/* Show kelas info if editing */}
              {isEditing && quiz?.kelas_id && (
                <div className="md:col-span-2">
                  <Alert>
                    <AlertDescription>
                      <strong>Kelas:</strong> {quiz.kelas_id}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        Kelas tidak dapat diubah setelah quiz dibuat
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Manual kelas input for testing (temporary) */}
              {!isEditing && !kelasId && (
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="kelas_id_manual">
                    Kelas ID (Manual Input)
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="kelas_id_manual"
                    {...register('kelas_id')}
                    placeholder="Paste kelas ID dari database..."
                    className={cn(errors.kelas_id && "border-destructive")}
                  />
                  {errors.kelas_id && (
                    <p className="text-sm text-destructive">{errors.kelas_id.message}</p>
                  )}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Temporary:</strong> Copy kelas ID dari database atau buat kelas dulu.
                      <br />
                      Nanti akan diganti dengan dropdown setelah kelas.api siap.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Deskripsi */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                <Textarea
                  id="deskripsi"
                  {...register('deskripsi')}
                  placeholder="Deskripsi singkat tentang kuis..."
                  rows={3}
                />
              </div>
              
              {/* Durasi */}
              <div className="space-y-2">
                <Label htmlFor="durasi_menit">
                  Durasi (menit)
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="durasi_menit"
                  type="number"
                  {...register('durasi_menit', { valueAsNumber: true })}
                  min={5}
                  max={300}
                  className={cn(errors.durasi_menit && "border-destructive")}
                />
                {errors.durasi_menit && (
                  <p className="text-sm text-destructive">{errors.durasi_menit.message}</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_mulai">
                  Tanggal Mulai
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="tanggal_mulai"
                  type="datetime-local"
                  {...register('tanggal_mulai')}
                  className={cn(errors.tanggal_mulai && "border-destructive")}
                />
                {errors.tanggal_mulai && (
                  <p className="text-sm text-destructive">{errors.tanggal_mulai.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tanggal_selesai">
                  Tanggal Selesai
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="tanggal_selesai"
                  type="datetime-local"
                  {...register('tanggal_selesai')}
                  className={cn(errors.tanggal_selesai && "border-destructive")}
                />
                {errors.tanggal_selesai && (
                  <p className="text-sm text-destructive">{errors.tanggal_selesai.message}</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passing_score">Passing Score (%)</Label>
                <Input
                  id="passing_score"
                  type="number"
                  {...register('passing_score', { 
                    setValueAs: (v) => v === '' ? null : Number(v)
                  })}
                  min={0}
                  max={100}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_attempts">Maksimal Percobaan</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  {...register('max_attempts', { 
                    setValueAs: (v) => v === '' ? null : Number(v)
                  })}
                  min={1}
                  max={10}
                />
              </div>
            </div>
            
            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="randomize_questions">Acak Urutan Soal</Label>
                <Switch
                  id="randomize_questions"
                  checked={formData.randomize_questions ?? false}
                  onCheckedChange={(checked) => setValue('randomize_questions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="randomize_options">Acak Urutan Jawaban</Label>
                <Switch
                  id="randomize_options"
                  checked={formData.randomize_options ?? false}
                  onCheckedChange={(checked) => setValue('randomize_options', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show_results_immediately">Tampilkan Hasil Langsung</Label>
                <Switch
                  id="show_results_immediately"
                  checked={formData.show_results_immediately ?? true}
                  onCheckedChange={(checked) => setValue('show_results_immediately', checked)}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Batal
                </Button>
              )}
              
              <Button type="submit" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Informasi Kuis'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Soal</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {hasQuestions 
                  ? `${questions.length} soal · Total ${totalPoints} poin`
                  : 'Belum ada soal'
                }
              </p>
            </div>
            
            <Button
              onClick={handleAddQuestion}
              disabled={!canAddQuestions}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Soal
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {!canAddQuestions && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Simpan informasi kuis terlebih dahulu sebelum menambah soal
              </AlertDescription>
            </Alert>
          )}
          
          {canAddQuestions && !hasQuestions && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Belum Ada Soal</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mulai tambahkan soal untuk kuis Anda
              </p>
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Soal Pertama
              </Button>
            </div>
          )}
          
          {hasQuestions && (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-base px-3 py-1">
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2">
                          {question.pertanyaan}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {question.poin} poin
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {question.tipe_soal}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuestion(question, index)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-destructive hover:text-destructive"
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
    </div>
  );
}