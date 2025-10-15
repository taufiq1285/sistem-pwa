/**
 * Role Test Component
 * Test component for RBAC system
 */

import { useRole } from '@/lib/hooks/useRole';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/card';

export function RoleTest() {
  const { user, isAuthenticated } = useAuth();
  const {
    roleLabel,
    roleDescription,
    roleColor,
    isAdmin,
    isDosen,
    isMahasiswa,
    isLaboran,
    can,
    canView,
    canCreate,
    canManage,
    hasPermission,
    permissions,
  } = useRole();

  if (!isAuthenticated || !user) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">RBAC Test</h2>
        <p className="text-gray-600">Please login to test RBAC system</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">User Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> <span className={`text-${roleColor}-600 font-semibold`}>{roleLabel}</span></p>
          <p className="text-sm text-gray-600">{roleDescription}</p>
        </div>
      </Card>

      {/* Role Booleans */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Role Checks</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>isAdmin: {isAdmin ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isDosen ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>isDosen: {isDosen ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isMahasiswa ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>isMahasiswa: {isMahasiswa ? '✅' : '❌'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isLaboran ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>isLaboran: {isLaboran ? '✅' : '❌'}</span>
          </div>
        </div>
      </Card>

      {/* Permission Tests */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Permission Tests</h2>
        <div className="space-y-2">
          <PermissionRow 
            label="View Kuis" 
            result={canView('kuis')} 
          />
          <PermissionRow 
            label="Create Kuis" 
            result={canCreate('kuis')} 
          />
          <PermissionRow 
            label="Manage Kuis" 
            result={canManage('kuis')} 
          />
          <PermissionRow 
            label="Can create:mata_kuliah" 
            result={can('create', 'mata_kuliah')} 
          />
          <PermissionRow 
            label="Can view:nilai" 
            result={can('view', 'nilai')} 
          />
          <PermissionRow 
            label="Can manage:inventaris" 
            result={canManage('inventaris')} 
          />
          <PermissionRow 
            label="Has view:kuis permission" 
            result={hasPermission('view:kuis')} 
          />
        </div>
      </Card>

      {/* All Permissions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">All Permissions ({permissions.length})</h2>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {permissions.map((permission: string) => (
            <div 
              key={permission} 
              className="text-sm bg-blue-50 px-3 py-1 rounded text-blue-700"
            >
              {permission}
            </div>
          ))}
        </div>
      </Card>

      {/* Role-Specific Features */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Role-Specific Features</h2>
        <div className="space-y-3">
          {isAdmin && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="font-semibold text-red-700">🛡️ Admin Feature</p>
              <p className="text-sm text-red-600">You have full system access</p>
            </div>
          )}
          
          {isDosen && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="font-semibold text-blue-700">👨‍🏫 Dosen Feature</p>
              <p className="text-sm text-blue-600">You can manage kelas and kuis</p>
            </div>
          )}
          
          {isMahasiswa && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-700">👨‍🎓 Mahasiswa Feature</p>
              <p className="text-sm text-green-600">You can take quizzes and view grades</p>
            </div>
          )}
          
          {isLaboran && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
              <p className="font-semibold text-purple-700">🔧 Laboran Feature</p>
              <p className="text-sm text-purple-600">You can manage inventaris</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Helper component for permission row
function PermissionRow({ label, result }: { label: string; result: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm">{label}</span>
      <span className={`font-semibold ${result ? 'text-green-600' : 'text-red-600'}`}>
        {result ? '✅ Allowed' : '❌ Denied'}
      </span>
    </div>
  );
}