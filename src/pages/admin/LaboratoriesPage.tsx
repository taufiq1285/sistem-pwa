/**
 * Laboratories Management Page for Admin
 * CRUD for managing all laboratories
 */
import { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  getLaboratoriumList,
  updateLaboratorium,
  createLaboratorium,
  deleteLaboratorium,
  type Laboratorium,
  type UpdateLaboratoriumData,
  type CreateLaboratoriumData
} from '@/lib/api/laboran.api';

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<Laboratorium[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation
  const [deletingLab, setDeletingLab] = useState<Laboratorium | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit dialog
  const [editingLab, setEditingLab] = useState<Laboratorium | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateLaboratoriumData>({});

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreateLaboratoriumData>({
    kode_lab: '',
    nama_lab: '',
    lokasi: '',
    kapasitas: 0,
    keterangan: '',
    is_active: true,
  });

  useEffect(() => { loadLaboratories(); }, [searchQuery]);

  const loadLaboratories = async () => {
    try {
      setLoading(true);
      const data = await getLaboratoriumList({ search: searchQuery || undefined });
      setLaboratories(data);
    } catch (error) {
      toast.error('Failed to load laboratories');
      console.error(error);
    } finally { setLoading(false); }
  };

  const handleEdit = (lab: Laboratorium) => {
    setEditingLab(lab);
    setEditFormData({
      kode_lab: lab.kode_lab,
      nama_lab: lab.nama_lab,
      kapasitas: lab.kapasitas || undefined,
      lokasi: lab.lokasi || undefined,
      is_active: lab.is_active ?? true,
      keterangan: lab.keterangan || undefined
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLab) return;
    try {
      await updateLaboratorium(editingLab.id, editFormData);
      toast.success('Laboratory updated successfully');
      setIsEditDialogOpen(false);
      await loadLaboratories();
    } catch (error) {
      toast.error('Failed to update laboratory');
      console.error(error);
    }
  };

  const handleAdd = () => {
    setAddFormData({
      kode_lab: '',
      nama_lab: '',
      lokasi: '',
      kapasitas: 0,
      keterangan: '',
      is_active: true,
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      if (!addFormData.kode_lab || !addFormData.nama_lab) {
        toast.error('Please fill in all required fields');
        return;
      }

      await createLaboratorium(addFormData);
      toast.success('Laboratory created successfully');
      setIsAddDialogOpen(false);
      await loadLaboratories();
    } catch (error: any) {
      toast.error('Failed to create laboratory: ' + (error.message || 'Unknown error'));
      console.error(error);
    }
  };

  const handleDelete = (lab: Laboratorium) => {
    setDeletingLab(lab);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingLab) return;
    try {
      await deleteLaboratorium(deletingLab.id);
      toast.success(`Laboratory "${deletingLab.nama_lab}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setDeletingLab(null);
      await loadLaboratories();
    } catch (error: any) {
      toast.error('Failed to delete laboratory: ' + (error.message || 'Unknown error'));
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laboratories Management</h1>
          <p className="text-muted-foreground">Manage all laboratory facilities</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />Add Laboratory
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laboratories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {laboratories.reduce((sum, lab) => sum + (lab.kapasitas || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Labs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {laboratories.filter(lab => lab.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search laboratories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Laboratories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Laboratories</CardTitle>
          <CardDescription>Manage laboratory facilities and information</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : laboratories.length === 0 ? (
            <div className="text-center py-8">No laboratories found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laboratories.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-mono">{lab.kode_lab}</TableCell>
                    <TableCell className="font-medium">{lab.nama_lab}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lab.lokasi || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{lab.kapasitas}</TableCell>
                    <TableCell>
                      <Badge variant={lab.is_active ? 'default' : 'secondary'}>
                        {lab.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lab)}>
                          <Edit className="h-4 w-4 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(lab)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Laboratory</DialogTitle>
            <DialogDescription>Update laboratory information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kode_lab">Lab Code</Label>
              <Input
                id="kode_lab"
                value={editFormData.kode_lab || ''}
                onChange={(e) => setEditFormData({...editFormData, kode_lab: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="nama_lab">Lab Name</Label>
              <Input
                id="nama_lab"
                value={editFormData.nama_lab || ''}
                onChange={(e) => setEditFormData({...editFormData, nama_lab: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lokasi">Location</Label>
              <Input
                id="lokasi"
                value={editFormData.lokasi || ''}
                onChange={(e) => setEditFormData({...editFormData, lokasi: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="kapasitas">Capacity</Label>
              <Input
                id="kapasitas"
                type="number"
                value={editFormData.kapasitas || ''}
                onChange={(e) => setEditFormData({...editFormData, kapasitas: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="keterangan">Description</Label>
              <Input
                id="keterangan"
                value={editFormData.keterangan || ''}
                onChange={(e) => setEditFormData({...editFormData, keterangan: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editFormData.is_active ?? true}
                onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Laboratory</DialogTitle>
            <DialogDescription>Create a new laboratory facility</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_kode_lab">Lab Code *</Label>
              <Input
                id="new_kode_lab"
                value={addFormData.kode_lab}
                onChange={(e) => setAddFormData({...addFormData, kode_lab: e.target.value})}
                placeholder="LAB-001"
              />
            </div>
            <div>
              <Label htmlFor="new_nama_lab">Lab Name *</Label>
              <Input
                id="new_nama_lab"
                value={addFormData.nama_lab}
                onChange={(e) => setAddFormData({...addFormData, nama_lab: e.target.value})}
                placeholder="Computer Laboratory"
              />
            </div>
            <div>
              <Label htmlFor="new_lokasi">Location</Label>
              <Input
                id="new_lokasi"
                value={addFormData.lokasi}
                onChange={(e) => setAddFormData({...addFormData, lokasi: e.target.value})}
                placeholder="Building A, 2nd Floor"
              />
            </div>
            <div>
              <Label htmlFor="new_kapasitas">Capacity</Label>
              <Input
                id="new_kapasitas"
                type="number"
                value={addFormData.kapasitas}
                onChange={(e) => setAddFormData({...addFormData, kapasitas: parseInt(e.target.value) || 0})}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="new_keterangan">Description</Label>
              <Input
                id="new_keterangan"
                value={addFormData.keterangan}
                onChange={(e) => setAddFormData({...addFormData, keterangan: e.target.value})}
                placeholder="Computer lab with 30 workstations"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new_is_active"
                checked={addFormData.is_active ?? true}
                onChange={(e) => setAddFormData({...addFormData, is_active: e.target.checked})}
              />
              <Label htmlFor="new_is_active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Laboratory</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingLab && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Laboratorium - Konfirmasi"
          itemName={deletingLab.nama_lab}
          itemType="Laboratorium"
          description={`Kode: ${deletingLab.kode_lab} | Lokasi: ${deletingLab.lokasi || 'Tidak ada'}`}
          consequences={[
            'Data laboratorium akan dihapus permanen',
            'Jadwal praktikum yang menggunakan lab ini akan terpengaruh',
            'Equipment/inventaris di lab ini tetap ada',
            'Tindakan ini tidak dapat dibatalkan',
          ]}
        />
      )}
    </div>
  );
}
