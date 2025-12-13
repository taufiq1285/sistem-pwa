const fs = require('fs');
const path = require('path');

console.log('🔧 Implementing Edit functionality for Admin pages...\n');

// ============================================================================
// 1. FIX USERS PAGE - Add Edit Dialog
// ============================================================================

const usersPagePath = path.join(__dirname, 'src/pages/admin/UsersPage.tsx');
let usersContent = fs.readFileSync(usersPagePath, 'utf8');

// Add imports for Dialog
if (!usersContent.includes('Dialog,')) {
  usersContent = usersContent.replace(
    "import { Badge } from '@/components/ui/badge';",
    `import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';`
  );
}

// Add state for edit dialog
usersContent = usersContent.replace(
  'const [filterRole, setFilterRole] = useState',
  `const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState`
);

// Add edit handler function
usersContent = usersContent.replace(
  'const getRoleBadgeColor = (role: string | null) => {',
  `const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          phone: editingUser.phone,
          is_active: editingUser.is_active,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const getRoleBadgeColor = (role: string | null) => {`
);

// Replace Edit button with onClick handler
usersContent = usersContent.replace(
  '<Button variant="ghost" size="sm">Edit</Button>',
  '<Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>Edit</Button>'
);

// Add Edit Dialog before closing div
usersContent = usersContent.replace(
  '    </div>\n  );\n}',
  `    </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Input id="email" value={editingUser.email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role (Read-only)</Label>
                <Input id="role" value={editingUser.role || ''} disabled />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingUser.is_active}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active User</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`
);

fs.writeFileSync(usersPagePath, usersContent, 'utf8');
console.log('✅ Step 1: Added Edit functionality to UsersPage');

// ============================================================================
// 2. FIX LABORATORIES PAGE - Add Edit Dialog
// ============================================================================

const labsPagePath = path.join(__dirname, 'src/pages/admin/LaboratoriesPage.tsx');
let labsContent = fs.readFileSync(labsPagePath, 'utf8');

// Add Dialog imports
if (!labsContent.includes('Dialog,')) {
  labsContent = labsContent.replace(
    "import { FlaskConical, Search, Plus, RefreshCw } from 'lucide-react';",
    `import { FlaskConical, Search, Plus, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';`
  );
}

// Add state for edit dialog
labsContent = labsContent.replace(
  'const [searchQuery, setSearchQuery] = useState',
  `const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [searchQuery, setSearchQuery] = useState`
);

// Add edit handlers
labsContent = labsContent.replace(
  'const filteredLabs = labs.filter',
  `const handleEdit = (lab: Lab) => {
    setEditingLab(lab);
    setEditDialogOpen(true);
  };

  const handleSaveLab = async () => {
    if (!editingLab) return;

    try {
      const { error } = await supabase
        .from('laboratorium')
        .update({
          nama_lab: editingLab.nama_lab,
          kapasitas: editingLab.kapasitas,
          lokasi: editingLab.lokasi,
          is_active: editingLab.is_active,
          keterangan: editingLab.keterangan,
        })
        .eq('id', editingLab.id);

      if (error) throw error;

      toast.success('Laboratory updated successfully');
      setEditDialogOpen(false);
      loadLabs();
    } catch (error) {
      console.error('Error updating laboratory:', error);
      toast.error('Failed to update laboratory');
    }
  };

  const filteredLabs = labs.filter`
);

// Replace Edit button
labsContent = labsContent.replace(
  '<Button variant="ghost" size="sm">Edit</Button>',
  '<Button variant="ghost" size="sm" onClick={() => handleEdit(lab)}>Edit</Button>'
);

// Add Edit Dialog
labsContent = labsContent.replace(
  '    </div>\n  );\n}',
  `    </div>

      {/* Edit Laboratory Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Laboratory</DialogTitle>
            <DialogDescription>
              Update laboratory information
            </DialogDescription>
          </DialogHeader>
          {editingLab && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="kode_lab">Lab Code (Read-only)</Label>
                <Input id="kode_lab" value={editingLab.kode_lab} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nama_lab">Lab Name</Label>
                <Input
                  id="nama_lab"
                  value={editingLab.nama_lab}
                  onChange={(e) => setEditingLab({ ...editingLab, nama_lab: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kapasitas">Capacity</Label>
                <Input
                  id="kapasitas"
                  type="number"
                  value={editingLab.kapasitas || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, kapasitas: parseInt(e.target.value) || null })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lokasi">Location</Label>
                <Input
                  id="lokasi"
                  value={editingLab.lokasi || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, lokasi: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keterangan">Description</Label>
                <Textarea
                  id="keterangan"
                  value={editingLab.keterangan || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, keterangan: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingLab.is_active || false}
                  onChange={(e) => setEditingLab({ ...editingLab, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active Laboratory</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLab}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`
);

fs.writeFileSync(labsPagePath, labsContent, 'utf8');
console.log('✅ Step 2: Added Edit functionality to LaboratoriesPage');

console.log('\n═══════════════════════════════════════');
console.log('✅ Edit features implemented successfully!');
console.log('═══════════════════════════════════════\n');

console.log('Features added:');
console.log('  📝 UsersPage:');
console.log('     - Edit dialog with form');
console.log('     - Update full_name, phone, is_active');
console.log('     - Toast notifications');
console.log('');
console.log('  📝 LaboratoriesPage:');
console.log('     - Edit dialog with form');
console.log('     - Update nama_lab, kapasitas, lokasi, keterangan, is_active');
console.log('     - Toast notifications');
console.log('');
console.log('Test by clicking "Edit" button on any user or laboratory!');
