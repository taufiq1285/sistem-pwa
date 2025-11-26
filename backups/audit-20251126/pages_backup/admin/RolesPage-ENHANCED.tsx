import { useState, useEffect } from 'react';
import { Shield, Lock, RefreshCw, Eye, Users as UsersIcon, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getUserStats, type UserStats } from '@/lib/api/users.api';

// Role permissions definition
interface RolePermission {
  category: string;
  permissions: string[];
}

interface Role {
  name: string;
  key: string;
  description: string;
  users: number;
  permissions: RolePermission[];
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
}

const ROLE_PERMISSIONS: Record<string, RolePermission[]> = {
  admin: [
    {
      category: 'User Management',
      permissions: [
        'Create, edit, delete users',
        'Manage user roles',
        'Activate/deactivate accounts',
        'View all user data',
      ],
    },
    {
      category: 'System Management',
      permissions: [
        'Manage laboratories',
        'Manage equipment/inventory',
        'System configuration',
        'View analytics & reports',
      ],
    },
    {
      category: 'Content Management',
      permissions: [
        'Create/manage announcements',
        'Manage mata kuliah',
        'Manage kelas',
        'Full access to all features',
      ],
    },
  ],
  dosen: [
    {
      category: 'Teaching',
      permissions: [
        'Manage own classes',
        'View student list',
        'Create/manage kuis',
        'Grade student work',
      ],
    },
    {
      category: 'Content',
      permissions: [
        'Upload/manage materi',
        'Create assignments',
        'View class schedules',
        'Manage kehadiran',
      ],
    },
    {
      category: 'Equipment',
      permissions: [
        'Borrow laboratory equipment',
        'View equipment availability',
        'Submit borrowing requests',
      ],
    },
  ],
  mahasiswa: [
    {
      category: 'Learning',
      permissions: [
        'View enrolled classes',
        'Access learning materials',
        'Take quizzes',
        'Submit assignments',
      ],
    },
    {
      category: 'Academic',
      permissions: [
        'View grades & results',
        'View class schedules',
        'Mark attendance (presensi)',
        'View announcements',
      ],
    },
    {
      category: 'Profile',
      permissions: [
        'Update personal profile',
        'View academic progress',
        'Access offline sync',
      ],
    },
  ],
  laboran: [
    {
      category: 'Laboratory Management',
      permissions: [
        'Manage laboratory facilities',
        'Manage inventory',
        'Update equipment status',
        'View lab schedules',
      ],
    },
    {
      category: 'Borrowing',
      permissions: [
        'Approve/reject borrowing requests',
        'Track borrowed equipment',
        'Manage equipment returns',
        'Generate borrowing reports',
      ],
    },
    {
      category: 'Reports',
      permissions: [
        'Generate lab usage reports',
        'View equipment statistics',
        'Export data',
      ],
    },
  ],
};

export default function RolesPage() {
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load role statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const roles: Role[] = [
    {
      name: 'Administrator',
      key: 'admin',
      description: 'Full system access with all administrative privileges',
      users: stats.admin,
      permissions: ROLE_PERMISSIONS.admin,
      variant: 'default',
      color: 'bg-blue-500',
    },
    {
      name: 'Dosen',
      key: 'dosen',
      description: 'Teaching staff with class and student management capabilities',
      users: stats.dosen,
      permissions: ROLE_PERMISSIONS.dosen,
      variant: 'secondary',
      color: 'bg-purple-500',
    },
    {
      name: 'Mahasiswa',
      key: 'mahasiswa',
      description: 'Students with access to learning materials and courses',
      users: stats.mahasiswa,
      permissions: ROLE_PERMISSIONS.mahasiswa,
      variant: 'outline',
      color: 'bg-green-500',
    },
    {
      name: 'Laboran',
      key: 'laboran',
      description: 'Laboratory staff managing facilities and equipment',
      users: stats.laboran,
      permissions: ROLE_PERMISSIONS.laboran,
      variant: 'destructive',
      color: 'bg-orange-500',
    },
  ];

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setIsDetailDialogOpen(true);
  };

  const getTotalPermissions = (role: Role) => {
    return role.permissions.reduce((sum, cat) => sum + cat.permissions.length, 0);
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and access permissions across the system
          </p>
        </div>
        <Button variant="outline" onClick={loadStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Role Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <Card key={role.key} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${role.color} bg-opacity-10`}>
                      <Shield className={`h-6 w-6 ${role.color.replace('bg-', 'text-')}`} />
                    </div>
                    <Badge variant={role.variant}>{role.name}</Badge>
                  </div>
                  <CardTitle className="mt-4 text-2xl">{role.users}</CardTitle>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>{getTotalPermissions(role)} permissions</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(role)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Total users across all roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive Users</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                  </div>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">About Roles & Permissions</p>
                  <p className="text-sm text-blue-700">
                    Permissions are defined in the application code and enforced through route guards
                    and API access controls. Each role has specific capabilities designed for their
                    responsibilities in the system. Click "View" on any role card to see detailed
                    permissions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedRole?.name} Permissions
            </DialogTitle>
            <DialogDescription>{selectedRole?.description}</DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{selectedRole.users}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Permissions</p>
                  <p className="text-2xl font-bold">{getTotalPermissions(selectedRole)}</p>
                </div>
              </div>

              {/* Permissions by Category */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Capabilities</h3>
                {selectedRole.permissions.map((category, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">{category.category}</h4>
                      <Badge variant="secondary" className="ml-auto">
                        {category.permissions.length} permissions
                      </Badge>
                    </div>
                    <ul className="space-y-2 ml-6">
                      {category.permissions.map((perm, permIdx) => (
                        <li key={permIdx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-sm">{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
