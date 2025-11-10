/**
 * KuisBuilderPage
 * 
 * Purpose: Full page wrapper for quiz builder
 * Route: /dosen/kuis/create or /dosen/kuis/edit/:id
 * Role: Dosen only
 */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizBuilder } from '@/components/features/kuis/builder/QuizBuilder';
import { useAuth } from '@/lib/hooks/useAuth'; // ✅ FIXED: Updated path

export default function KuisBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const isEditing = !!id;
  
  // Get dosen_id from user.dosen.id (primary key of dosen table)
  const dosenId = user?.dosen?.id || '';
  
  const handleSave = () => {
    navigate('/dosen/kuis');
  };
  
  const handleCancel = () => {
    navigate('/dosen/kuis');
  };
  
  // Redirect if not dosen or dosen profile not loaded
  if (user && (user.role !== 'dosen' || !user.dosen?.id)) {
    navigate('/');
    return null;
  }
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dosen/kuis')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Kuis
        </Button>
        
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Kuis' : 'Buat Kuis Baru'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing 
            ? 'Edit informasi dan soal kuis' 
            : 'Buat kuis baru untuk mahasiswa Anda'
          }
        </p>
      </div>
      
      {/* Quiz Builder */}
      <QuizBuilder
        dosenId={dosenId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}