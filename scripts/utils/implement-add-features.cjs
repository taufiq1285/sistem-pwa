const fs = require('fs');
const path = require('path');

console.log('🔧 Implementing Add functionality for Admin pages...\n');

// ============================================================================
// 1. IMPLEMENT ADD USER DIALOG - UsersPage.tsx
// ============================================================================

const usersPagePath = path.join(__dirname, 'src/pages/admin/UsersPage.tsx');
let usersContent = fs.readFileSync(usersPagePath, 'utf8');

// Add state for add dialog
usersContent = usersContent.replace(
  'const [editDialogOpen, setEditDialogOpen] = useState(false);',
  `const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'mahasiswa' as 'mahasiswa' | 'dosen' | 'admin' | 'laboran',
    is_active: true,
  });`
);

// Add onClick handler to Add User button
usersContent = usersContent.replace(
  `        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>`,
  `        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>`
);

// Add handleAddUser function before handleEdit
usersContent = usersContent.replace(
  'const handleEdit = (user: User) => {',
  `const handleAddUser = async () => {
    if (!newUser.email || !newUser.full_name) {
      toast.error('Email and Full Name are required');
      return;
    }

    try {
      // First, create auth user (this will also create the users table entry)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'DefaultPassword123!', // User should change this on first login
        options: {
          data: {
            full_name: newUser.full_name,
            role: newUser.role,
          }
        }
      });

      if (authError) throw authError;

      // Update the user record with is_active status
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_active: newUser.is_active })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      toast.success('User added successfully. Default password: DefaultPassword123!');
      setAddDialogOpen(false);
      setNewUser({
        email: '',
        full_name: '',
        role: 'mahasiswa',
        is_active: true,
      });
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user: ' + (error as Error).message);
    }
  };

  const handleEdit = (user: User) => {`
);

// Add Add User Dialog before Edit User Dialog
usersContent = usersContent.replace(
  '      {/* Edit User Dialog */}',
  `      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_email">Email *</Label>
              <Input
                id="new_email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_full_name">Full Name *</Label>
              <Input
                id="new_full_name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_role">Role</Label>
              <select
                id="new_role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as typeof newUser.role })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
                <option value="laboran">Laboran</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new_is_active"
                checked={newUser.is_active}
                onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
              />
              <Label htmlFor="new_is_active">Active User</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Default password: DefaultPassword123! (User should change on first login)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}`
);

fs.writeFileSync(usersPagePath, usersContent, 'utf8');
console.log('✅ Step 1: Added Add User functionality to UsersPage');

// ============================================================================
// 2. IMPLEMENT ADD LABORATORY DIALOG - LaboratoriesPage.tsx
// ============================================================================

const labsPagePath = path.join(__dirname, 'src/pages/admin/LaboratoriesPage.tsx');
let labsContent = fs.readFileSync(labsPagePath, 'utf8');

// Add state for add dialog
labsContent = labsContent.replace(
  'const [editDialogOpen, setEditDialogOpen] = useState(false);',
  `const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLab, setNewLab] = useState({
    kode_lab: '',
    nama_lab: '',
    kapasitas: null as number | null,
    lokasi: '',
    keterangan: '',
    is_active: true,
  });`
);

// Add onClick handler to Add Laboratory button
labsContent = labsContent.replace(
  `        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Laboratory
        </Button>`,
  `        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Laboratory
        </Button>`
);

// Add handleAddLab function before handleEdit
labsContent = labsContent.replace(
  'const handleEdit = (lab: Lab) => {',
  `const handleAddLab = async () => {
    if (!newLab.kode_lab || !newLab.nama_lab) {
      toast.error('Lab Code and Lab Name are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('laboratorium')
        .insert({
          kode_lab: newLab.kode_lab,
          nama_lab: newLab.nama_lab,
          kapasitas: newLab.kapasitas,
          lokasi: newLab.lokasi,
          keterangan: newLab.keterangan,
          is_active: newLab.is_active,
        });

      if (error) throw error;

      toast.success('Laboratory added successfully');
      setAddDialogOpen(false);
      setNewLab({
        kode_lab: '',
        nama_lab: '',
        kapasitas: null,
        lokasi: '',
        keterangan: '',
        is_active: true,
      });
      loadLabs();
    } catch (error) {
      console.error('Error adding laboratory:', error);
      toast.error('Failed to add laboratory: ' + (error as Error).message);
    }
  };

  const handleEdit = (lab: Lab) => {`
);

// Add Add Laboratory Dialog before Edit Laboratory Dialog
labsContent = labsContent.replace(
  '      {/* Edit Laboratory Dialog */}',
  `      {/* Add Laboratory Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Laboratory</DialogTitle>
            <DialogDescription>
              Create a new laboratory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_kode_lab">Lab Code *</Label>
              <Input
                id="new_kode_lab"
                value={newLab.kode_lab}
                onChange={(e) => setNewLab({ ...newLab, kode_lab: e.target.value })}
                placeholder="LAB-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_nama_lab">Lab Name *</Label>
              <Input
                id="new_nama_lab"
                value={newLab.nama_lab}
                onChange={(e) => setNewLab({ ...newLab, nama_lab: e.target.value })}
                placeholder="Computer Lab 1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_kapasitas">Capacity</Label>
              <Input
                id="new_kapasitas"
                type="number"
                value={newLab.kapasitas || ''}
                onChange={(e) => setNewLab({ ...newLab, kapasitas: parseInt(e.target.value) || null })}
                placeholder="30"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_lokasi">Location</Label>
              <Input
                id="new_lokasi"
                value={newLab.lokasi}
                onChange={(e) => setNewLab({ ...newLab, lokasi: e.target.value })}
                placeholder="Building A, Floor 2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new_keterangan">Description</Label>
              <Textarea
                id="new_keterangan"
                value={newLab.keterangan}
                onChange={(e) => setNewLab({ ...newLab, keterangan: e.target.value })}
                rows={3}
                placeholder="Laboratory description..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new_is_active"
                checked={newLab.is_active}
                onChange={(e) => setNewLab({ ...newLab, is_active: e.target.checked })}
              />
              <Label htmlFor="new_is_active">Active Laboratory</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLab}>Add Laboratory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Laboratory Dialog */}`
);

fs.writeFileSync(labsPagePath, labsContent, 'utf8');
console.log('✅ Step 2: Added Add Laboratory functionality to LaboratoriesPage');

console.log('\n═══════════════════════════════════════');
console.log('✅ Add features implemented successfully!');
console.log('═══════════════════════════════════════\n');

console.log('Features added:');
console.log('  📝 UsersPage:');
console.log('     - Add dialog with form (email, full_name, role, is_active)');
console.log('     - Creates auth account with default password');
console.log('     - Toast notifications');
console.log('');
console.log('  📝 LaboratoriesPage:');
console.log('     - Add dialog with form (kode_lab, nama_lab, kapasitas, lokasi, keterangan, is_active)');
console.log('     - Insert into laboratorium table');
console.log('     - Toast notifications');
console.log('');
console.log('Test by clicking "Add User" and "Add Laboratory" buttons!');
