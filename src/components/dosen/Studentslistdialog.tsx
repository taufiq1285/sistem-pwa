/**
 * StudentsListDialog Component
 * Dialog for dosen to view enrolled students in a class
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Mail, 
  Calendar,
  Download,
  Loader2,
  UserCheck
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  getKelasStudents,
  type EnrolledStudent 
} from '@/lib/api/dosen.api';
import { toast } from 'sonner';

interface StudentsListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kelasId: string;
  kelasName: string;
  mataKuliahName: string;
}

export function StudentsListDialog({ 
  open, 
  onOpenChange,
  kelasId,
  kelasName,
  mataKuliahName
}: StudentsListDialogProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKelasStudents(kelasId);
      setStudents(data);
    } catch {
      toast.error('Gagal memuat daftar mahasiswa');
    } finally {
      setLoading(false);
    }
  }, [kelasId]);

  useEffect(() => {
    if (open && kelasId) {
      fetchStudents();
    }
  }, [open, kelasId, fetchStudents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const handleExport = () => {
    // Create CSV
    const headers = ['No', 'NIM', 'Nama', 'Email', 'Tanggal Daftar'];
    const rows = students.map((student, index) => [
      index + 1,
      student.nim,
      student.nama,
      student.email,
      formatDate(student.enrolled_at),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahasiswa_${kelasName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Data berhasil diexport');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Mahasiswa
              </DialogTitle>
              <DialogDescription className="mt-1">
                {mataKuliahName} • {kelasName}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <UserCheck className="h-3 w-3 mr-1" />
                {students.length} Mahasiswa
              </Badge>
              {students.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada mahasiswa terdaftar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama Mahasiswa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Tanggal Daftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {student.nim}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.nama}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        {student.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(student.enrolled_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}