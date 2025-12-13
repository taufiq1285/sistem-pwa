const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/dosen/PeminjamanPage.tsx');

const newContent = `/**
 * Peminjaman Page - Dosen
 * Submit and track equipment borrowing requests for practicum activities
 */

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Mock data untuk development - nanti akan diganti dengan API call
interface Peminjaman {
  id: string;
  nama_alat: string;
  kode_alat: string;
  jumlah: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
  catatan?: string;
}

const mockPeminjaman: Peminjaman[] = [
  {
    id: '1',
    nama_alat: 'Stetoskop Digital',
    kode_alat: 'ST-001',
    jumlah: 5,
    keperluan: 'Praktikum Pemeriksaan Fisik',
    tanggal_pinjam: '2025-11-25',
    tanggal_kembali: '2025-11-27',
    status: 'approved',
  },
  {
    id: '2',
    nama_alat: 'Tensi Meter Manual',
    kode_alat: 'TM-002',
    jumlah: 10,
    keperluan: 'Praktikum Vital Sign',
    tanggal_pinjam: '2025-11-26',
    tanggal_kembali: '2025-11-28',
    status: 'pending',
  },
];

export default function DosenPeminjamanPage() {
  const [loading] = useState(false);
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>(mockPeminjaman);
  const [filteredData, setFilteredData] = useState<Peminjaman[]>(mockPeminjaman);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_alat: '',
    jumlah: '',
    keperluan: '',
    tanggal_pinjam: '',
    tanggal_kembali: '',
  });

  useEffect(() => {
    let filtered = peminjaman;
    if (filterStatus !== 'all') filtered = filtered.filter((p) => p.status === filterStatus);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.nama_alat.toLowerCase().includes(query) ||
        p.kode_alat.toLowerCase().includes(query) ||
        p.keperluan.toLowerCase().includes(query)
      );
    }
    setFilteredData(filtered);
  }, [peminjaman, searchQuery, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_alat || !formData.jumlah) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    const newItem: Peminjaman = {
      id: String(Date.now()),
      nama_alat: formData.nama_alat,
      kode_alat: 'ALT-' + String(Date.now()).slice(-3),
      jumlah: parseInt(formData.jumlah),
      keperluan: formData.keperluan,
      tanggal_pinjam: formData.tanggal_pinjam,
      tanggal_kembali: formData.tanggal_kembali,
      status: 'pending',
    };
    setPeminjaman([newItem, ...peminjaman]);
    toast.success('Permohonan peminjaman berhasil diajukan');
    setFormData({ nama_alat: '', jumlah: '', keperluan: '', tanggal_pinjam: '', tanggal_kembali: '' });
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: Peminjaman['status']) => {
    const config = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
      returned: { label: 'Dikembalikan', variant: 'outline' as const, icon: Package },
      overdue: { label: 'Terlambat', variant: 'destructive' as const, icon: AlertCircle },
    };
    const cfg = config[status];
    const Icon = cfg.icon;
    return <Badge variant={cfg.variant} className="gap-1"><Icon className="h-3 w-3" />{cfg.label}</Badge>;
  };

  const stats = {
    total: peminjaman.length,
    pending: peminjaman.filter((p) => p.status === 'pending').length,
    approved: peminjaman.filter((p) => p.status === 'approved').length,
    returned: peminjaman.filter((p) => p.status === 'returned').length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Peminjaman Alat</h1>
          <p className="text-muted-foreground">Ajukan dan kelola peminjaman alat praktikum</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ajukan Peminjaman</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Ajukan Peminjaman Baru</DialogTitle>
                <DialogDescription>Isi form untuk mengajukan peminjaman alat praktikum</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nama_alat">Nama Alat *</Label>
                  <Input id="nama_alat" placeholder="Contoh: Stetoskop Digital" value={formData.nama_alat} onChange={(e) => setFormData({ ...formData, nama_alat: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="jumlah">Jumlah *</Label>
                  <Input id="jumlah" type="number" min="1" value={formData.jumlah} onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="keperluan">Keperluan *</Label>
                  <Textarea id="keperluan" placeholder="Jelaskan keperluan..." value={formData.keperluan} onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tanggal_pinjam">Tanggal Pinjam *</Label>
                    <Input id="tanggal_pinjam" type="date" value={formData.tanggal_pinjam} onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tanggal_kembali">Tanggal Kembali *</Label>
                    <Input id="tanggal_kembali" type="date" value={formData.tanggal_kembali} onChange={(e) => setFormData({ ...formData, tanggal_kembali: e.target.value })} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit">Ajukan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Menunggu</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Disetujui</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.approved}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Dikembalikan</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.returned}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter & Pencarian</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari alat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-md">
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="returned">Dikembalikan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daftar Peminjaman</CardTitle><CardDescription>{filteredData.length} dari {peminjaman.length} peminjaman</CardDescription></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8">Loading...</div> :
           peminjaman.length === 0 ? <Alert><Package className="h-4 w-4" /><AlertDescription>Belum ada peminjaman</AlertDescription></Alert> :
           filteredData.length === 0 ? <Alert><Search className="h-4 w-4" /><AlertDescription>Tidak ada hasil</AlertDescription></Alert> :
           <div className="rounded-md border">
             <Table>
               <TableHeader>
                 <TableRow><TableHead>Kode</TableHead><TableHead>Nama Alat</TableHead><TableHead>Jumlah</TableHead><TableHead>Keperluan</TableHead><TableHead>Tanggal Pinjam</TableHead><TableHead>Tanggal Kembali</TableHead><TableHead>Status</TableHead></TableRow>
               </TableHeader>
               <TableBody>
                 {filteredData.map((item) => (
                   <TableRow key={item.id}>
                     <TableCell className="font-mono">{item.kode_alat}</TableCell>
                     <TableCell className="font-medium">{item.nama_alat}</TableCell>
                     <TableCell>{item.jumlah}</TableCell>
                     <TableCell className="max-w-[200px] truncate">{item.keperluan}</TableCell>
                     <TableCell><Calendar className="inline h-3 w-3 mr-1" />{new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}</TableCell>
                     <TableCell><Calendar className="inline h-3 w-3 mr-1" />{new Date(item.tanggal_kembali).toLocaleDateString('id-ID')}</TableCell>
                     <TableCell>{getStatusBadge(item.status)}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
`;

try {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ Successfully replaced PeminjamanPage.tsx with correct content!');
  console.log('\nNew features:');
  console.log('  - ✅ Form to submit equipment borrowing requests');
  console.log('  - ✅ List of borrowing requests with status');
  console.log('  - ✅ Filter by status (pending, approved, rejected, etc.)');
  console.log('  - ✅ Search by equipment name/code');
  console.log('  - ✅ Stats cards showing totals');
} catch (error) {
  console.error('❌ Error replacing file:', error.message);
  process.exit(1);
}
