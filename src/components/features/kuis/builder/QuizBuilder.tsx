/**
 * QuizBuilder - WITH AUTO-CREATE MATA KULIAH (TEXT INPUT)
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, AlertCircle, Target, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { QuestionEditor } from './QuestionEditor';
import { createKuisSchema, type CreateKuisFormData } from '@/lib/validations/kuis.schema';
import { createKuis, createSoal, updateSoal, deleteSoal } from '@/lib/api/kuis.api';
import { getKelas, createKelas } from '@/lib/api/kelas.api';
import { getMataKuliah } from '@/lib/api/mata-kuliah.api';
import type { Kuis, Soal } from '@/types/kuis.types';
import type { Kelas } from '@/types/kelas.types';
import type { MataKuliah } from '@/types/mata-kuliah.types';
import { cn } from '@/lib/utils';

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

export function QuizBuilder({ quiz, kelasId, dosenId, onSave, onCancel: _onCancel }: QuizBuilderProps) {
  const isEditing = !!quiz;
  const [currentQuiz, setCurrentQuiz] = useState<Kuis | null>(quiz || null);
  const [questions, setQuestions] = useState<Soal[]>(quiz?.soal || []);
  const [editorState, setEditorState] = useState<EditorState>({ isOpen: false });
  
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  
  const [showCreateKelasDialog, setShowCreateKelasDialog] = useState(false);
  const [isCreatingKelas, setIsCreatingKelas] = useState(false);
  const [newKelasData, setNewKelasData] = useState({
    nama_kelas: '',
    mata_kuliah_id: '', // DROPDOWN, bukan text input
    semester_ajaran: 1,
    tahun_ajaran: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
  });
  
  // Helper function to get default dates
  const getDefaultDates = () => {
    const now = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(now.getFullYear() + 1);

    return {
      tanggal_mulai: now.toISOString(),
      tanggal_selesai: oneYearLater.toISOString(),
    };
  };

  const { register, formState: { errors }, setValue, watch } = useForm<CreateKuisFormData>({
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
      randomize_questions: quiz.randomize_questions ?? false,
      randomize_options: quiz.randomize_options ?? false,
      show_results_immediately: quiz.show_results_immediately ?? true,
      status: quiz.status ?? 'draft',
    } : {
      kelas_id: kelasId || '',
      dosen_id: dosenId,
      judul: '',
      deskripsi: '',
      durasi_menit: 60,
      ...getDefaultDates(), // ✅ Auto-set default dates
      passing_score: 70,
      max_attempts: 1,
      randomize_questions: false,
      randomize_options: false,
      show_results_immediately: true,
      status: 'draft',
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
      const data = await getKelas({ dosen_id: dosenId, is_active: true });
      setKelasList(data);
      if (data.length === 1 && !isEditing) setValue('kelas_id', data[0].id);
    } catch (error: any) {
      toast.error('Gagal memuat kelas');
    } finally {
      setIsLoadingKelas(false);
    }
  };
  
  const loadMataKuliah = async () => {
    try {
      const data = await getMataKuliah();
      setMataKuliahList(data);
    } catch (error) {
      console.error('Failed to load mata kuliah');
    }
  };
  
  const handleQuickCreateKelas = async () => {
    if (!newKelasData.nama_kelas.trim() || !newKelasData.mata_kuliah_id) {
      toast.error('Pilih mata kuliah dan isi nama kelas');
      return;
    }

    setIsCreatingKelas(true);
    
    try {
      const kodeKelas = newKelasData.nama_kelas.toUpperCase().replace(/\s+/g, '-');
      
      const kelas = await createKelas({
        nama_kelas: newKelasData.nama_kelas,
        kode_kelas: kodeKelas,
        mata_kuliah_id: newKelasData.mata_kuliah_id,
        dosen_id: dosenId,
        semester_ajaran: parseInt(String(newKelasData.semester_ajaran)),
        tahun_ajaran: newKelasData.tahun_ajaran,
        is_active: true,
      });

      toast.success('Kelas berhasil dibuat!');
      await loadKelas();
      setValue('kelas_id', kelas.id);
      setShowCreateKelasDialog(false);
      
      setNewKelasData({
        nama_kelas: '',
        mata_kuliah_id: '',
        semester_ajaran: 1,
        tahun_ajaran: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
      });
    } catch (error: any) {
      toast.error('Gagal membuat kelas', { description: error.message });
    } finally {
      setIsCreatingKelas(false);
    }
  };
  
  
  const handleAddQuestion = async () => {
    // ✅ Auto-save quiz if not saved yet
    if (!currentQuiz) {
      const formData = watch();

      // Check required fields manually
      if (!formData.judul || !formData.judul.trim()) {
        toast.error('Judul kuis harus diisi');
        return;
      }
      if (!formData.kelas_id) {
        toast.error('Pilih kelas terlebih dahulu');
        return;
      }
      if (!formData.durasi_menit || formData.durasi_menit < 5) {
        toast.error('Durasi minimal 5 menit');
        return;
      }

      // Auto-save quiz
      try {
        const dataWithDates = {
          ...formData,
          tanggal_mulai: formData.tanggal_mulai || new Date().toISOString(),
          tanggal_selesai: formData.tanggal_selesai || (() => {
            const oneYearLater = new Date();
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            return oneYearLater.toISOString();
          })(),
        };

        console.log('🔵 Auto-saving quiz before adding question...');
        const savedQuiz = await createKuis(dataWithDates);
        console.log('✅ Quiz auto-saved:', savedQuiz);
        setCurrentQuiz(savedQuiz);
        toast.success('Kuis disimpan! Silakan tambah soal.');

        // Open question editor after successful save
        setEditorState({ isOpen: true, index: questions.length });
      } catch (error: any) {
        console.error('❌ Error auto-saving quiz:', error);
        toast.error('Gagal menyimpan kuis', {
          description: error.message || error.toString()
        });
      } finally {
      }
      return;
    }

    // Quiz already saved, just open editor
    setEditorState({ isOpen: true, index: questions.length });
  };
  
  const handleEditQuestion = (question: Soal, index: number) => {
    setEditorState({ isOpen: true, question, index });
  };
  
  const handleSaveQuestion = async (questionData: any) => {
    if (!currentQuiz) return;
    try {
      let savedQuestion: Soal;
      if (editorState.question) {
        savedQuestion = await updateSoal(editorState.question.id, questionData);
        setQuestions(prev => prev.map(q => q.id === savedQuestion.id ? savedQuestion : q));
        toast.success('Soal berhasil diperbarui');
      } else {
        savedQuestion = await createSoal({ ...questionData, kuis_id: currentQuiz.id });
        setQuestions(prev => [...prev, savedQuestion]);
        toast.success('Soal berhasil ditambahkan');
      }
      setEditorState({ isOpen: false });
    } catch (error: any) {
      toast.error('Gagal menyimpan soal', { description: error.message });
    }
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      await deleteSoal(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast.success('Soal berhasil dihapus');
    } catch (error: any) {
      toast.error('Gagal menghapus soal');
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
  const canAddQuestions = true; // ✅ Always enabled - auto-save on first add
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kuis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="judul">Judul Kuis *</Label>
                <Input id="judul" {...register('judul')} placeholder="Contoh: Kuis Anatomi" className={cn(errors.judul && "border-destructive")} />
                {errors.judul && <p className="text-sm text-destructive">{errors.judul.message}</p>}
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="kelas_id">Kelas *</Label>
                  {!isEditing && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateKelasDialog(true)} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Buat Kelas Baru
                    </Button>
                  )}
                </div>
                <Select value={formData.kelas_id || ''} onValueChange={(value) => setValue('kelas_id', value)} disabled={isLoadingKelas || isEditing}>
                  <SelectTrigger className={cn(errors.kelas_id && "border-destructive")}>
                    <SelectValue placeholder={isLoadingKelas ? "Memuat..." : kelasList.length === 0 ? "Klik 'Buat Kelas Baru'" : "Pilih kelas..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasList.map((kelas) => (
                      <SelectItem key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} - {kelas.kode_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.kelas_id && <p className="text-sm text-destructive">{errors.kelas_id.message}</p>}
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea id="deskripsi" {...register('deskripsi')} placeholder="Deskripsi..." rows={3} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="durasi_menit">Durasi (menit) *</Label>
                <Input id="durasi_menit" type="number" {...register('durasi_menit', { valueAsNumber: true })} min={5} className={cn(errors.durasi_menit && "border-destructive")} />
              </div>
            </div>

            {/* ✅ REMOVED: Tanggal Mulai & Tanggal Selesai - Auto-set to now and +1 year */}
            {/* ✅ REMOVED: Simpan Kuis button - auto-save when adding questions */}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Soal</CardTitle>
              <p className="text-sm text-muted-foreground">{questions.length} soal · {totalPoints} poin</p>
            </div>
            <Button onClick={handleAddQuestion} disabled={!canAddQuestions} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Soal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <Button onClick={handleAddQuestion}><Plus className="h-4 w-4 mr-2" />Tambah Soal</Button>
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
                          <span><Target className="h-3 w-3 inline mr-1" />{q.poin} poin</span>
                          <Badge variant="secondary" className="text-xs">{q.tipe_soal}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(q, i)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Finish Button - Only show after adding questions */}
      {currentQuiz && questions.length > 0 && (
        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={() => {
              if (onSave) onSave(currentQuiz);
            }}
          >
            Simpan & Kembali ke Daftar Kuis
          </Button>
        </div>
      )}

      <Dialog open={showCreateKelasDialog} onOpenChange={setShowCreateKelasDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buat Kelas Baru</DialogTitle>
            <DialogDescription>
              Pilih mata kuliah dan isi detail kelas untuk quiz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Mata Kuliah Dropdown */}
            <div className="space-y-2">
              <Label>Mata Kuliah *</Label>
              <Select 
                value={newKelasData.mata_kuliah_id} 
                onValueChange={(v) => setNewKelasData(p => ({ ...p, mata_kuliah_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah..." />
                </SelectTrigger>
                <SelectContent>
                  {mataKuliahList.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Belum ada mata kuliah
                    </div>
                  ) : (
                    mataKuliahList.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.kode_mk} - {mk.nama_mk}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              {/* Empty State - Link to Create MK */}
              {mataKuliahList.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <p className="mb-1 font-medium">Belum ada mata kuliah di sistem.</p>
                    <p className="text-muted-foreground">
                      Silakan hubungi Admin untuk menambahkan mata kuliah terlebih dahulu.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Nama Kelas *</Label>
              <Input 
                placeholder="Contoh: Kelas A" 
                value={newKelasData.nama_kelas} 
                onChange={(e) => setNewKelasData(p => ({ ...p, nama_kelas: e.target.value }))} 
              />
              <p className="text-xs text-muted-foreground">
                Kode kelas akan dibuat otomatis (contoh: KELAS-A)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select 
                  value={String(newKelasData.semester_ajaran)} 
                  onValueChange={(v) => setNewKelasData(p => ({ ...p, semester_ajaran: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Input 
                  placeholder="2025/2026" 
                  value={newKelasData.tahun_ajaran} 
                  onChange={(e) => setNewKelasData(p => ({ ...p, tahun_ajaran: e.target.value }))} 
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateKelasDialog(false)} 
              disabled={isCreatingKelas}
            >
              Batal
            </Button>
            <Button 
              onClick={handleQuickCreateKelas} 
              disabled={isCreatingKelas || !newKelasData.nama_kelas || !newKelasData.mata_kuliah_id}
            >
              {isCreatingKelas ? 'Membuat...' : 'Buat Kelas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}