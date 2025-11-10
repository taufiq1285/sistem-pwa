/**
 * EnrollKelasDialog Component
 * Dialog for students to view and enroll in available classes
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Check,
  X,
  Loader2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  getAvailableKelas, 
  enrollToKelas,
  type AvailableKelas 
} from '@/lib/api/mahasiswa.api';

interface EnrollKelasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrollSuccess?: () => void;
}

export function EnrollKelasDialog({ 
  open, 
  onOpenChange,
  onEnrollSuccess 
}: EnrollKelasDialogProps) {
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [availableKelas, setAvailableKelas] = useState<AvailableKelas[]>([]);

  useEffect(() => {
    if (open) {
      fetchAvailableKelas();
    }
  }, [open]);

  const fetchAvailableKelas = async () => {
    try {
      setLoading(true);
      const data = await getAvailableKelas();
      setAvailableKelas(data);
    } catch (error) {
      toast.error('Gagal memuat kelas tersedia');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (kelasId: string) => {
    try {
      setEnrolling(kelasId);
      const result = await enrollToKelas(kelasId);
      
      if (result.success) {
        toast.success(result.message);
        await fetchAvailableKelas(); // Refresh list
        onEnrollSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Gagal mendaftar ke kelas');
    } finally {
      setEnrolling(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Daftar Kelas
          </DialogTitle>
          <DialogDescription>
            Pilih kelas yang ingin Anda ikuti. Anda dapat melihat jadwal praktikum setelah mendaftar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : availableKelas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tidak ada kelas tersedia saat ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableKelas.map((kelas) => (
                <Card 
                  key={kelas.id}
                  className={`${
                    kelas.is_enrolled 
                      ? 'border-green-200 bg-green-50/50' 
                      : kelas.is_full 
                      ? 'border-gray-200 bg-gray-50/50 opacity-60' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Class Info */}
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {kelas.mata_kuliah.nama_mk}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {kelas.mata_kuliah.kode_mk}
                            </Badge>
                            {kelas.is_enrolled && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Terdaftar
                              </Badge>
                            )}
                            {kelas.is_full && !kelas.is_enrolled && (
                              <Badge variant="destructive" className="text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Penuh
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-medium">{kelas.nama_kelas}</span>
                            <span>•</span>
                            <span>{kelas.mata_kuliah.sks} SKS</span>
                            <span>•</span>
                            <span>{kelas.tahun_ajaran}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                              {kelas.jumlah_mahasiswa}/{kelas.kuota} mahasiswa
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{kelas.jadwal_count} jadwal praktikum</span>
                          </div>
                        </div>

                        {/* Next Schedule */}
                        {kelas.next_jadwal && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-medium text-blue-900 mb-1">
                              Praktikum Berikutnya:
                            </p>
                            <div className="flex items-center gap-3 text-sm text-blue-700">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(kelas.next_jadwal.tanggal_praktikum)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(kelas.next_jadwal.jam_mulai)} - {formatTime(kelas.next_jadwal.jam_selesai)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {kelas.next_jadwal.lab_nama}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Enroll Button */}
                      <div className="flex-shrink-0">
                        {kelas.is_enrolled ? (
                          <Button disabled variant="outline" className="w-28">
                            <Check className="h-4 w-4 mr-2" />
                            Terdaftar
                          </Button>
                        ) : kelas.is_full ? (
                          <Button disabled variant="outline" className="w-28">
                            <X className="h-4 w-4 mr-2" />
                            Penuh
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleEnroll(kelas.id)}
                            disabled={enrolling === kelas.id}
                            className="w-28"
                          >
                            {enrolling === kelas.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Daftar...
                              </>
                            ) : (
                              'Daftar'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}