/**
 * AttemptDetailPage (Placeholder)
 * 
 * Purpose: Detailed view of student's quiz attempt (Dosen)
 * Route: /dosen/kuis/:kuisId/attempt/:attemptId
 * Status: Basic placeholder - can be enhanced later with full grading UI
 */

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AttemptDetailPage() {
  const { kuisId, attemptId } = useParams<{ kuisId: string; attemptId: string }>();
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(`/dosen/kuis/${kuisId}/results`);
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Hasil Kuis
      </Button>
      
      <h1 className="text-3xl font-bold mb-6">Detail Percobaan</h1>
      
      {/* Placeholder Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lihat Jawaban Mahasiswa</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <strong>Feature In Development</strong>
              <br />
              Halaman detail untuk melihat dan menilai jawaban mahasiswa akan segera tersedia.
              <br /><br />
              <strong>Fitur yang akan ditambahkan:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lihat semua jawaban mahasiswa</li>
                <li>Bandingkan dengan jawaban yang benar</li>
                <li>Grading manual untuk essay</li>
                <li>Berikan feedback</li>
                <li>Hitung skor otomatis</li>
              </ul>
              <br />
              <em>Attempt ID: {attemptId}</em>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}