import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Package, Clock, CheckCircle, XCircle, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMyBorrowing, type MyBorrowingRequest, type BorrowingStatus } from '@/lib/api/dosen.api';

const STATUS_CONFIG = { menunggu: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock }, disetujui: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle }, dipinjam: { label: 'Dipinjam', variant: 'default' as const, icon: Package }, dikembalikan: { label: 'Dikembalikan', variant: 'outline' as const, icon: RotateCcw }, ditolak: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle } };

export default function PeminjamanPage() {
  const [borrowings, setBorrowings] = useState<MyBorrowingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => { loadBorrowings(); }, []);

  const loadBorrowings = async () => {
    try {
      setLoading(true);
      const data = await getMyBorrowing();
      setBorrowings(data);
    } catch (error) {
      toast.error('Gagal memuat data peminjaman');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBorrowings = borrowings.filter((b) => {
    const match = b.inventaris_nama.toLowerCase().includes(searchQuery.toLowerCase()) || b.inventaris_kode.toLowerCase().includes(searchQuery.toLowerCase());
    const status = statusFilter === 'all' || b.status === statusFilter;
    return match && status;
  });

  const stats = { total: borrowings.length, menunggu: borrowings.filter(b => b.status === 'menunggu').length, disetujui: borrowings.filter(b => b.status === 'disetujui' || b.status === 'dipinjam').length, dikembalikan: borrowings.filter(b => b.status === 'dikembalikan').length, ditolak: borrowings.filter(b => b.status === 'ditolak').length };

  return (<AppLayout><div className="space-y-6"><div><h1 className="text-3xl font-bold">Peminjaman Alat</h1><p className="text-muted-foreground">Riwayat peminjaman peralatan</p></div><div className="grid gap-4 md:grid-cols-5"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Menunggu</CardTitle><Clock className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.menunggu}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Disetujui</CardTitle><CheckCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.disetujui}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dikembalikan</CardTitle><RotateCcw className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.dikembalikan}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ditolak</CardTitle><XCircle className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.ditolak}</div></CardContent></Card></div><div className="flex gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari alat..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="menunggu">Menunggu</SelectItem><SelectItem value="disetujui">Disetujui</SelectItem><SelectItem value="dipinjam">Dipinjam</SelectItem><SelectItem value="dikembalikan">Dikembalikan</SelectItem><SelectItem value="ditolak">Ditolak</SelectItem></SelectContent></Select></div><Card><CardHeader><CardTitle>Riwayat Peminjaman</CardTitle></CardHeader><CardContent>{loading ? <div className="text-center py-8">Loading...</div> : filteredBorrowings.length === 0 ? <div className="text-center py-8">Tidak ada data</div> : <Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Lab</TableHead><TableHead>Jumlah</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filteredBorrowings.map(b => { const cfg = STATUS_CONFIG[b.status as BorrowingStatus] || STATUS_CONFIG.menunggu; const Icon = cfg.icon; return <TableRow key={b.id}><TableCell className="font-mono">{b.inventaris_kode}</TableCell><TableCell>{b.inventaris_nama}</TableCell><TableCell>{b.laboratorium_nama}</TableCell><TableCell>{b.jumlah_pinjam}</TableCell><TableCell><Badge variant={cfg.variant}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge></TableCell></TableRow>})}</TableBody></Table>}</CardContent></Card></div></AppLayout>);
}
