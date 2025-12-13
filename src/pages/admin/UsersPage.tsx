import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getAllUsers,
  getUserStats,
  toggleUserStatus,
  updateUser,
  createUser,
  deleteUser,
  type SystemUser,
  type UserStats,
  type UpdateUserData,
  type CreateUserData,
} from "@/lib/api/users.api";

const ROLE_BADGE = {
  admin: "default" as const,
  dosen: "secondary" as const,
  mahasiswa: "outline" as const,
  laboran: "destructive" as const,
};

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admin: 0,
    dosen: 0,
    mahasiswa: 0,
    laboran: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Edit dialog
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserData>({});

  // Delete confirmation
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    full_name: "",
    role: "mahasiswa",
    nim: "",
    nip: "",
    nidn: "",
    phone: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log("[loadUsers] START - fetching fresh data...");
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
      ]);
      console.log("[loadUsers] Data fetched:", {
        userCount: usersData.length,
        stats: statsData,
      });
      setUsers(usersData);
      setStats(statsData);
      console.log("[loadUsers] State updated with", usersData.length, "users");
    } catch (error) {
      console.error("[loadUsers] Error:", error);
      toast.error("Gagal memuat data users");
    } finally {
      setLoading(false);
      console.log("[loadUsers] DONE");
    }
  };

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      toast.success("Status updated");
      await loadUsers();
    } catch (error) {
      toast.error("Gagal mengubah status");
    }
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, editFormData);
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleAdd = () => {
    setAddFormData({
      email: "",
      password: "",
      full_name: "",
      role: "mahasiswa",
      nim: "",
      nip: "",
      nidn: "",
      phone: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      if (
        !addFormData.email ||
        !addFormData.password ||
        !addFormData.full_name
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createUser(addFormData);
      toast.success("User created successfully");
      setIsAddDialogOpen(false);
      await loadUsers();
    } catch (error: any) {
      toast.error(
        "Failed to create user: " + (error.message || "Unknown error"),
      );
      console.error(error);
    }
  };

  const handleDelete = (user: SystemUser) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;

    try {
      console.log(
        "[confirmDelete] Deleting user:",
        deletingUser.id,
        deletingUser.email,
      );
      await deleteUser(deletingUser.id);
      console.log("[confirmDelete] Delete successful!");

      toast.success(`User "${deletingUser.full_name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);

      // Force reload from server
      console.log("[confirmDelete] Reloading user list...");
      await loadUsers();
      console.log("[confirmDelete] Reload complete!");
    } catch (error: any) {
      console.error("[confirmDelete] Delete failed:", error);
      console.error("[confirmDelete] Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      const errorMsg =
        error?.message || error?.error?.message || "Unknown error";
      toast.error("Failed to delete user: " + errorMsg);
    }
  };

  const filteredUsers = users.filter((u) => {
    const match =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nim && u.nim.includes(searchQuery)) ||
      (u.nip && u.nip.includes(searchQuery));
    const role = roleFilter === "all" || u.role === roleFilter;
    return match && role;
  });

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all system users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <Shield className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dosen</CardTitle>
            <Badge variant="secondary">Dosen</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dosen}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
            <Badge variant="outline">Mhs</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mahasiswa}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laboran</CardTitle>
            <Badge variant="destructive">Lab</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.laboran}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="dosen">Dosen</SelectItem>
            <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
            <SelectItem value="laboran">Laboran</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>Manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {u.nim || u.nip || u.nidn || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(u.id, u.is_active)}
                      >
                        {u.is_active ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-600 mr-1" />
                            Inactive
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(u)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u)}
                        >
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editFormData.full_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    full_name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: any) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                  <SelectItem value="laboran">Laboran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={editFormData.is_active ?? true}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    is_active: e.target.checked,
                  })
                }
              />
              <Label htmlFor="is_active_edit">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
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
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_full_name">Full Name *</Label>
              <Input
                id="new_full_name"
                value={addFormData.full_name}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, full_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="new_email">Email *</Label>
              <Input
                id="new_email"
                type="email"
                value={addFormData.email}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="new_password">Password *</Label>
              <Input
                id="new_password"
                type="password"
                value={addFormData.password}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, password: e.target.value })
                }
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="new_role">Role *</Label>
              <Select
                value={addFormData.role}
                onValueChange={(value: any) =>
                  setAddFormData({ ...addFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="dosen">Dosen</SelectItem>
                  <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                  <SelectItem value="laboran">Laboran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role-specific fields */}
            {addFormData.role === "mahasiswa" && (
              <div>
                <Label htmlFor="new_nim">NIM</Label>
                <Input
                  id="new_nim"
                  value={addFormData.nim}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, nim: e.target.value })
                  }
                  placeholder="1234567890"
                />
              </div>
            )}

            {addFormData.role === "dosen" && (
              <>
                <div>
                  <Label htmlFor="new_nip">NIP</Label>
                  <Input
                    id="new_nip"
                    value={addFormData.nip}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, nip: e.target.value })
                    }
                    placeholder="198001012020121001"
                  />
                </div>
                <div>
                  <Label htmlFor="new_nidn">NIDN</Label>
                  <Input
                    id="new_nidn"
                    value={addFormData.nidn}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, nidn: e.target.value })
                    }
                    placeholder="0101018001"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="new_phone">Phone</Label>
              <Input
                id="new_phone"
                value={addFormData.phone}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, phone: e.target.value })
                }
                placeholder="08123456789"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Hapus User - Konfirmasi
            </DialogTitle>
            <DialogDescription className="text-base">
              <strong>Perhatian!</strong> Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="space-y-4">
              {/* User Info to Delete */}
              <div className="p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950/30">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  User yang akan dihapus:
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {deletingUser.full_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deletingUser.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Role:{" "}
                  <Badge variant={ROLE_BADGE[deletingUser.role]}>
                    {deletingUser.role}
                  </Badge>
                </p>
              </div>

              {/* Warning Box */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-400 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                  ⚠️ Data yang akan dihapus:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 ml-4 list-disc space-y-1">
                  <li>Akun user dari sistem</li>
                  <li>Data profil dan role</li>
                  <li>Akses login user</li>
                  <li>User tidak dapat login lagi</li>
                </ul>
              </div>

              {/* Confirmation Question */}
              <p className="text-center font-semibold text-gray-900 dark:text-white">
                Apakah Anda yakin ingin menghapus user ini?
              </p>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="min-w-[100px]"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="min-w-[100px] bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ya, Hapus
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
