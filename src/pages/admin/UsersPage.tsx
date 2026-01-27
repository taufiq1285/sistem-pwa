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
  GraduationCap,
  BookOpen,
  Microscope,
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
import { TableSkeleton } from "@/components/shared/DataTable/TableSkeleton";
import { EnhancedTable, EnhancedTableHeader, EnhancedTableRow, EnhancedTableHead, EnhancedTableCell } from "@/components/shared/DataTable/EnhancedTable";
import { EnhancedEmptyState, EmptySearchResults } from "@/components/shared/DataTable/EnhancedEmptyState";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

const ROLE_BADGE = {
  admin: "default" as const,
  dosen: "secondary" as const,
  mahasiswa: "outline" as const,
  laboran: "destructive" as const,
};

type UserRole = "admin" | "dosen" | "mahasiswa" | "laboran";

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
  const [activeTab, setActiveTab] = useState<UserRole | "all">("all");

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

  const loadUsers = async (forceRefresh = false) => {
    try {
      console.log(
        "[loadUsers] START - fetching data... (forceRefresh:",
        forceRefresh,
        ")",
      );
      setLoading(true);

      // Use cacheAPI with stale-while-revalidate pattern
      const [usersData, statsData] = await Promise.all([
        cacheAPI("all_users", getAllUsers, {
          ttl: 10 * 60 * 1000, // 10 minutes cache
          forceRefresh,
          staleWhileRevalidate: true, // Show stale data immediately when offline
        }),
        cacheAPI("user_stats", getUserStats, {
          ttl: 10 * 60 * 1000, // 10 minutes cache
          forceRefresh,
          staleWhileRevalidate: true,
        }),
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
      await invalidateCache("all_users");
      await invalidateCache("user_stats");
      await loadUsers(true);
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
      await invalidateCache("all_users");
      await invalidateCache("user_stats");
      await loadUsers(true);
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
      await invalidateCache("all_users");
      await invalidateCache("user_stats");
      await loadUsers(true);
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

      // Invalidate cache and reload
      await invalidateCache("all_users");
      await invalidateCache("user_stats");
      console.log("[confirmDelete] Reloading user list...");
      await loadUsers(true);
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

  // Filter users by search query
  const searchFilteredUsers = users.filter((u) => {
    const match =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nim && u.nim.includes(searchQuery)) ||
      (u.nip && u.nip.includes(searchQuery));
    return match;
  });

  // Get users by role
  const getUsersByRole = (role: UserRole) => {
    return searchFilteredUsers.filter((u) => u.role === role);
  };

  const adminUsers = getUsersByRole("admin");
  const dosenUsers = getUsersByRole("dosen");
  const mahasiswaUsers = getUsersByRole("mahasiswa");
  const laboranUsers = getUsersByRole("laboran");

  // Render user table for a specific role
  const renderUserTable = (roleUsers: SystemUser[], emptyMessage: string) => {
    if (loading) {
      return (
        <TableSkeleton
          rows={5}
          columns={5}
          columnWidths={["200px", "250px", "150px", "120px", "180px"]}
        />
      );
    }

    if (roleUsers.length === 0) {
      if (searchQuery) {
        return (
          <EmptySearchResults
            onClear={() => setSearchQuery("")}
          />
        );
      }
      return (
        <EnhancedEmptyState
          icon={Users}
          title={emptyMessage}
          description="Tambahkan user baru untuk memulai pengelolaan sistem."
          action={{
            label: "Tambah User",
            onClick: handleAdd,
          }}
        />
      );
    }

    return (
      <EnhancedTable>
        <EnhancedTableHeader>
          <EnhancedTableRow>
            <EnhancedTableHead>Nama</EnhancedTableHead>
            <EnhancedTableHead>Email</EnhancedTableHead>
            <EnhancedTableHead>ID</EnhancedTableHead>
            <EnhancedTableHead>Status</EnhancedTableHead>
            <EnhancedTableHead>Aksi</EnhancedTableHead>
          </EnhancedTableRow>
        </EnhancedTableHeader>
        <TableBody>
          {roleUsers.map((u) => (
            <EnhancedTableRow key={u.id}>
              <EnhancedTableCell className="font-medium">{u.full_name}</EnhancedTableCell>
              <EnhancedTableCell>{u.email}</EnhancedTableCell>
              <EnhancedTableCell className="font-mono text-xs">
                {u.nim || u.nip || u.nidn || "-"}
              </EnhancedTableCell>
              <EnhancedTableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(u.id, u.is_active)}
                  className="hover:bg-muted"
                >
                  {u.is_active ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600 mr-1" />
                      Nonaktif
                    </>
                  )}
                </Button>
              </EnhancedTableCell>
              <EnhancedTableCell>
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
              </EnhancedTableCell>
            </EnhancedTableRow>
          ))}
        </TableBody>
      </EnhancedTable>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mt-2">
            Manage all system users
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => loadUsers(true)}
            className="font-semibold border-2 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleAdd}
            className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-5 md:grid-cols-5">
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-100">
              Total
            </CardTitle>
            <div className="p-2 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-blue-900 dark:text-white mb-2">
              {stats.total}
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold text-purple-900 dark:text-purple-100">
              Admin
            </CardTitle>
            <div className="p-2 bg-linear-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-purple-900 dark:text-white">
              {stats.admin}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold text-cyan-900 dark:text-cyan-100">
              Dosen
            </CardTitle>
            <div className="p-2 bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg shadow-md">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-cyan-900 dark:text-white">
              {stats.dosen}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold text-emerald-900 dark:text-emerald-100">
              Mahasiswa
            </CardTitle>
            <div className="p-2 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-emerald-900 dark:text-white">
              {stats.mahasiswa}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold text-orange-900 dark:text-orange-100">
              Laboran
            </CardTitle>
            <div className="p-2 bg-linear-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
              <Microscope className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-orange-900 dark:text-white">
              {stats.laboran}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama, email, NIM, atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Users Table with Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as UserRole | "all")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Semua ({searchFilteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin ({adminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="dosen" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Dosen ({dosenUsers.length})
          </TabsTrigger>
          <TabsTrigger value="mahasiswa" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Mahasiswa ({mahasiswaUsers.length})
          </TabsTrigger>
          <TabsTrigger value="laboran" className="flex items-center gap-2">
            <Microscope className="h-4 w-4" />
            Laboran ({laboranUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* All Users Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Semua User</CardTitle>
              <CardDescription>
                Kelola semua akun pengguna dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable(
                searchFilteredUsers,
                "Tidak ada user yang ditemukan",
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administrator
              </CardTitle>
              <CardDescription>
                Kelola akun administrator sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable(adminUsers, "Tidak ada admin yang ditemukan")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dosen Tab */}
        <TabsContent value="dosen">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Dosen
              </CardTitle>
              <CardDescription>Kelola akun dosen</CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable(dosenUsers, "Tidak ada dosen yang ditemukan")}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mahasiswa Tab */}
        <TabsContent value="mahasiswa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Mahasiswa
              </CardTitle>
              <CardDescription>Kelola akun mahasiswa</CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable(
                mahasiswaUsers,
                "Tidak ada mahasiswa yang ditemukan",
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Laboran Tab */}
        <TabsContent value="laboran">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Laboran
              </CardTitle>
              <CardDescription>Kelola akun laboran</CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserTable(
                laboranUsers,
                "Tidak ada laboran yang ditemukan",
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
