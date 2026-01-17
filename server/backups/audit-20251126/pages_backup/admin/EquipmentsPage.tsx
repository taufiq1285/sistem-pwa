/**
 * Equipment/Inventaris Management Page for Admin
 * Full CRUD for managing laboratory equipment inventory
 * FIXED VERSION - No invalid fields
 */
import { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Package, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  getInventarisList,
  createInventaris,
  type InventarisListItem,
  type CreateInventarisData,
} from '@/lib/api/laboran.api';

export default function EquipmentsPage() {
  const [inventaris, setInventaris] = useState<InventarisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreateInventarisData>({
    kode_barang: '',
    nama_barang: '',
    kategori: '',
    merk: '',
    spesifikasi: '',
    jumlah: 1,
    jumlah_tersedia: 1,
    kondisi: 'baik',
    tahun_pengadaan: new Date().getFullYear(),
    keterangan: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const inventarisResult = await getInventarisList({ search: searchQuery || undefined });
      setInventaris(inventarisResult.data);
    } catch (error) {
      toast.error('Failed to load equipment data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventaris = inventaris.filter((item) =>
    item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: inventaris.length,
    available: inventaris.filter(i => i.kondisi === 'baik').length,
    damaged: inventaris.filter(i => i.kondisi === 'rusak_ringan' || i.kondisi === 'rusak_berat').length,
    borrowed: inventaris.filter(i => (i.jumlah - i.jumlah_tersedia) > 0).length,
  };

  const handleAdd = () => {
    setAddFormData({
      kode_barang: '',
      nama_barang: '',
      kategori: '',
      merk: '',
      spesifikasi: '',
      jumlah: 1,
      jumlah_tersedia: 1,
      kondisi: 'baik',
      tahun_pengadaan: new Date().getFullYear(),
      keterangan: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      if (!addFormData.kode_barang || !addFormData.nama_barang) {
        toast.error('Please fill in all required fields (Code, Name)');
        return;
      }

      // Validate jumlah_tersedia
      if (addFormData.jumlah_tersedia > addFormData.jumlah) {
        toast.error('Available quantity cannot be greater than total quantity');
        return;
      }

      // Create equipment with laboratorium_id as null (stored in central depot)
      await createInventaris({
        ...addFormData,
        laboratorium_id: null,
      });
      toast.success('Equipment created successfully');
      setIsAddDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error('Failed to create equipment: ' + (error.message || 'Unknown error'));
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">Manage laboratory equipment and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Equipment
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Condition</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Damaged</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.damaged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.borrowed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
          <CardDescription>All laboratory equipment and supplies</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredInventaris.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No equipment found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventaris.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.kode_barang}</TableCell>
                    <TableCell className="font-medium">{item.nama_barang}</TableCell>
                    <TableCell>{item.kategori || '-'}</TableCell>
                    <TableCell>
                      <span className={item.jumlah_tersedia < item.jumlah ? 'text-orange-600' : ''}>
                        {item.jumlah_tersedia}
                      </span>
                      {' / '}
                      {item.jumlah}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.kondisi === 'baik' ? 'default' :
                        item.kondisi === 'rusak_ringan' ? 'secondary' :
                        'destructive'
                      }>
                        {item.kondisi}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>Create a new equipment/inventory item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Required Fields Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">REQUIRED FIELDS</h3>
              <p className="text-xs text-muted-foreground mb-4">All equipment is stored in central depot</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kode_barang">Equipment Code *</Label>
                  <Input
                    id="new_kode_barang"
                    value={addFormData.kode_barang}
                    onChange={(e) => setAddFormData({...addFormData, kode_barang: e.target.value})}
                    placeholder="EQP-001"
                  />
                </div>
                <div>
                  <Label htmlFor="new_nama_barang">Equipment Name *</Label>
                  <Input
                    id="new_nama_barang"
                    value={addFormData.nama_barang}
                    onChange={(e) => setAddFormData({...addFormData, nama_barang: e.target.value})}
                    placeholder="Digital Microscope"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_jumlah">Total Quantity *</Label>
                  <Input
                    id="new_jumlah"
                    type="number"
                    min="1"
                    value={addFormData.jumlah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setAddFormData({...addFormData, jumlah: val});
                    }}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="new_jumlah_tersedia">Available Quantity *</Label>
                  <Input
                    id="new_jumlah_tersedia"
                    type="number"
                    min="0"
                    value={addFormData.jumlah_tersedia}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setAddFormData({...addFormData, jumlah_tersedia: val});
                    }}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Must be ≤ Total Quantity</p>
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">OPTIONAL FIELDS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_kategori">Category</Label>
                  <Input
                    id="new_kategori"
                    value={addFormData.kategori || ''}
                    onChange={(e) => setAddFormData({...addFormData, kategori: e.target.value || null})}
                    placeholder="Lab Equipment"
                  />
                </div>
                <div>
                  <Label htmlFor="new_merk">Brand</Label>
                  <Input
                    id="new_merk"
                    value={addFormData.merk || ''}
                    onChange={(e) => setAddFormData({...addFormData, merk: e.target.value || null})}
                    placeholder="Olympus"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="new_spesifikasi">Specifications</Label>
                <Textarea
                  id="new_spesifikasi"
                  value={addFormData.spesifikasi || ''}
                  onChange={(e) => setAddFormData({...addFormData, spesifikasi: e.target.value || null})}
                  placeholder="1000x magnification, LED illumination"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="new_kondisi">Condition</Label>
                  <Select
                    value={addFormData.kondisi}
                    onValueChange={(value: any) => setAddFormData({...addFormData, kondisi: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Good</SelectItem>
                      <SelectItem value="rusak_ringan">Minor Damage</SelectItem>
                      <SelectItem value="rusak_berat">Major Damage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new_tahun_pengadaan">Acquisition Year</Label>
                  <Input
                    id="new_tahun_pengadaan"
                    type="number"
                    value={addFormData.tahun_pengadaan || ''}
                    onChange={(e) => setAddFormData({...addFormData, tahun_pengadaan: parseInt(e.target.value) || null})}
                    placeholder={new Date().getFullYear().toString()}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="new_keterangan">Notes/Description</Label>
                <Textarea
                  id="new_keterangan"
                  value={addFormData.keterangan || ''}
                  onChange={(e) => setAddFormData({...addFormData, keterangan: e.target.value})}
                  placeholder="Additional notes about this equipment..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Equipment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
