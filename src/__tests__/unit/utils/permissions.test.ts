/**
 * Permissions Utility Unit Tests
 *
 * Tests for RBAC permission checking functions:
 * - Basic permission checks
 * - Role hierarchy
 * - Resource-specific permissions
 * - Permission utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  checkPermission,
  isRoleHigher,
  isRoleLower,
  isRoleEqual,
  compareRoles,
  canManageRole,
  canView,
  canCreate,
  canUpdate,
  canDelete,
  canManage,
  canApprove,
  canGrade,
  getPermissionAction,
  getPermissionResource,
  formatPermission,
} from '../../../lib/utils/permissions';
import type { UserRole } from '../../../types/auth.types';
import type { Permission, PermissionContext } from '../../../types/permission.types';

// ============================================================================
// BASIC PERMISSION CHECKING TESTS
// ============================================================================

describe('Permissions - Basic Checking', () => {
  describe('hasPermission', () => {
    it('should return true if admin has permission', () => {
      // Use actual admin permissions
      expect(hasPermission('admin', 'manage:kuis')).toBe(true);
      expect(hasPermission('admin', 'manage:user')).toBe(true);
      expect(hasPermission('admin', 'view:nilai')).toBe(true);
      expect(hasPermission('admin', 'view:analytics')).toBe(true);
    });

    it('should return true if dosen has dosen permissions', () => {
      // Use actual dosen permissions
      expect(hasPermission('dosen', 'manage:kuis')).toBe(true);
      expect(hasPermission('dosen', 'manage:kelas')).toBe(true);
      expect(hasPermission('dosen', 'grade:attempt_kuis')).toBe(true);
      expect(hasPermission('dosen', 'view:mata_kuliah')).toBe(true);
    });

    it('should return false if dosen lacks admin permissions', () => {
      expect(hasPermission('dosen', 'manage:user')).toBe(false);
      expect(hasPermission('dosen', 'view:analytics')).toBe(false);
      expect(hasPermission('dosen', 'manage:admin')).toBe(false);
    });

    it('should return true if mahasiswa has mahasiswa permissions', () => {
      expect(hasPermission('mahasiswa', 'view:kuis')).toBe(true);
      expect(hasPermission('mahasiswa', 'create:jawaban')).toBe(true);
      expect(hasPermission('mahasiswa', 'view:nilai')).toBe(true);
      expect(hasPermission('mahasiswa', 'create:attempt_kuis')).toBe(true);
    });

    it('should return false if mahasiswa lacks dosen permissions', () => {
      expect(hasPermission('mahasiswa', 'manage:kuis')).toBe(false);
      expect(hasPermission('mahasiswa', 'grade:attempt_kuis')).toBe(false);
      expect(hasPermission('mahasiswa', 'manage:kelas')).toBe(false);
    });

    it('should return true if laboran has laboran permissions', () => {
      expect(hasPermission('laboran', 'manage:inventaris')).toBe(true);
      expect(hasPermission('laboran', 'manage:peminjaman')).toBe(true);
      expect(hasPermission('laboran', 'manage:laboratorium')).toBe(true);
    });

    it('should return false if laboran lacks dosen permissions', () => {
      expect(hasPermission('laboran', 'manage:kuis')).toBe(false);
      expect(hasPermission('laboran', 'grade:attempt_kuis')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      const permissions: Permission[] = ['manage:kuis', 'manage:user', 'view:nilai'];

      expect(hasAnyPermission('admin', permissions)).toBe(true);
      expect(hasAnyPermission('dosen', permissions)).toBe(true); // has manage:kuis
      expect(hasAnyPermission('mahasiswa', permissions)).toBe(true); // has view:nilai
    });

    it('should return false if user has none of the permissions', () => {
      const adminOnlyPermissions: Permission[] = ['manage:user', 'manage:admin'];

      expect(hasAnyPermission('dosen', adminOnlyPermissions)).toBe(false);
      expect(hasAnyPermission('mahasiswa', adminOnlyPermissions)).toBe(false);
      expect(hasAnyPermission('laboran', adminOnlyPermissions)).toBe(false);
    });

    it('should return false for empty permission array', () => {
      expect(hasAnyPermission('admin', [])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      const adminPermissions: Permission[] = ['manage:user', 'manage:kuis', 'view:nilai'];

      expect(hasAllPermissions('admin', adminPermissions)).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      const mixedPermissions: Permission[] = ['manage:kuis', 'manage:user'];

      expect(hasAllPermissions('dosen', mixedPermissions)).toBe(false); // has manage:kuis but not manage:user
    });

    it('should return true for empty permission array', () => {
      expect(hasAllPermissions('mahasiswa', [])).toBe(true);
    });

    it('should return true if dosen has all dosen permissions', () => {
      const dosenPermissions: Permission[] = ['manage:kuis', 'manage:kelas', 'grade:attempt_kuis'];

      expect(hasAllPermissions('dosen', dosenPermissions)).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const permissions = getRolePermissions('admin');

      expect(permissions).toContain('manage:user');
      expect(permissions).toContain('manage:kuis');
      expect(permissions.length).toBeGreaterThan(10);
    });

    it('should return all permissions for dosen', () => {
      const permissions = getRolePermissions('dosen');

      expect(permissions).toContain('manage:kuis');
      expect(permissions).toContain('grade:attempt_kuis');
      expect(permissions.length).toBeGreaterThan(5);
    });

    it('should return all permissions for mahasiswa', () => {
      const permissions = getRolePermissions('mahasiswa');

      expect(permissions).toContain('view:kuis');
      expect(permissions).toContain('create:jawaban');
      expect(permissions.length).toBeGreaterThan(3);
    });

    it('should return all permissions for laboran', () => {
      const permissions = getRolePermissions('laboran');

      expect(permissions).toContain('manage:inventaris');
      expect(permissions).toContain('manage:peminjaman');
    });
  });
});

// ============================================================================
// PERMISSION CHECKING WITH CONTEXT TESTS
// ============================================================================

describe('Permissions - Context-based Checking', () => {
  describe('checkPermission', () => {
    it('should allow if user has permission and no resource', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'dosen' },
      };

      const result = checkPermission(context, 'manage:kuis');

      expect(result.allowed).toBe(true);
    });

    it('should deny if user lacks permission', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'mahasiswa' },
      };

      const result = checkPermission(context, 'manage:kuis');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have required permission');
    });

    it('should allow owner to update their own resource', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'dosen' },
        resource: { type: 'peminjaman', ownerId: 'user-1' },
      };

      const result = checkPermission(context, 'update:peminjaman');

      expect(result.allowed).toBe(true);
    });

    it('should deny non-owner to update resource', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'dosen' },
        resource: { type: 'peminjaman', ownerId: 'user-2' },
      };

      const result = checkPermission(context, 'update:peminjaman');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('own resources');
    });

    it('should allow admin to manage any resource', () => {
      const context: PermissionContext = {
        user: { id: 'admin-1', role: 'admin' },
        resource: { type: 'peminjaman', ownerId: 'user-2' },
      };

      const result = checkPermission(context, 'manage:peminjaman');

      expect(result.allowed).toBe(true);
    });

    it('should allow view operations without ownership check', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'mahasiswa' },
        resource: { type: 'kuis', ownerId: 'user-2' },
      };

      const result = checkPermission(context, 'view:kuis');

      expect(result.allowed).toBe(true);
    });

    it('should allow create operations without ownership check', () => {
      const context: PermissionContext = {
        user: { id: 'user-1', role: 'mahasiswa' },
        resource: { type: 'peminjaman', ownerId: 'user-2' },
      };

      const result = checkPermission(context, 'create:peminjaman');

      expect(result.allowed).toBe(true);
    });
  });
});

// ============================================================================
// ROLE HIERARCHY TESTS
// ============================================================================

describe('Permissions - Role Hierarchy', () => {
  describe('isRoleHigher', () => {
    it('should return true if admin higher than other roles', () => {
      expect(isRoleHigher('admin', 'dosen')).toBe(true);
      expect(isRoleHigher('admin', 'laboran')).toBe(true);
      expect(isRoleHigher('admin', 'mahasiswa')).toBe(true);
    });

    it('should return true if dosen higher than mahasiswa', () => {
      expect(isRoleHigher('dosen', 'mahasiswa')).toBe(true);
    });

    it('should return false if role is not higher', () => {
      expect(isRoleHigher('mahasiswa', 'dosen')).toBe(false);
      expect(isRoleHigher('mahasiswa', 'admin')).toBe(false);
      expect(isRoleHigher('dosen', 'admin')).toBe(false);
    });

    it('should return false if roles are equal', () => {
      expect(isRoleHigher('admin', 'admin')).toBe(false);
      expect(isRoleHigher('dosen', 'dosen')).toBe(false);
    });
  });

  describe('isRoleLower', () => {
    it('should return true if mahasiswa lower than dosen', () => {
      expect(isRoleLower('mahasiswa', 'dosen')).toBe(true);
      expect(isRoleLower('mahasiswa', 'admin')).toBe(true);
    });

    it('should return true if dosen lower than admin', () => {
      expect(isRoleLower('dosen', 'admin')).toBe(true);
    });

    it('should return false if role is not lower', () => {
      expect(isRoleLower('admin', 'dosen')).toBe(false);
      expect(isRoleLower('dosen', 'mahasiswa')).toBe(false);
    });

    it('should return false if roles are equal', () => {
      expect(isRoleLower('admin', 'admin')).toBe(false);
    });
  });

  describe('isRoleEqual', () => {
    it('should return true for same roles', () => {
      expect(isRoleEqual('admin', 'admin')).toBe(true);
      expect(isRoleEqual('dosen', 'dosen')).toBe(true);
      expect(isRoleEqual('mahasiswa', 'mahasiswa')).toBe(true);
    });

    it('should return false for different roles', () => {
      expect(isRoleEqual('admin', 'dosen')).toBe(false);
      expect(isRoleEqual('dosen', 'mahasiswa')).toBe(false);
    });
  });

  describe('compareRoles', () => {
    it('should correctly compare admin vs dosen', () => {
      const result = compareRoles('admin', 'dosen');

      expect(result.isHigher).toBe(true);
      expect(result.isLower).toBe(false);
      expect(result.isEqual).toBe(false);
      expect(result.difference).toBeGreaterThan(0);
    });

    it('should correctly compare dosen vs admin', () => {
      const result = compareRoles('dosen', 'admin');

      expect(result.isHigher).toBe(false);
      expect(result.isLower).toBe(true);
      expect(result.isEqual).toBe(false);
      expect(result.difference).toBeLessThan(0);
    });

    it('should correctly compare equal roles', () => {
      const result = compareRoles('dosen', 'dosen');

      expect(result.isHigher).toBe(false);
      expect(result.isLower).toBe(false);
      expect(result.isEqual).toBe(true);
      expect(result.difference).toBe(0);
    });
  });

  describe('canManageRole', () => {
    it('should allow admin to manage all roles', () => {
      expect(canManageRole('admin', 'admin')).toBe(true);
      expect(canManageRole('admin', 'dosen')).toBe(true);
      expect(canManageRole('admin', 'laboran')).toBe(true);
      expect(canManageRole('admin', 'mahasiswa')).toBe(true);
    });

    it('should allow dosen to manage lower roles', () => {
      expect(canManageRole('dosen', 'mahasiswa')).toBe(true);
    });

    it('should not allow dosen to manage admin', () => {
      expect(canManageRole('dosen', 'admin')).toBe(false);
    });

    it('should not allow dosen to manage dosen', () => {
      expect(canManageRole('dosen', 'dosen')).toBe(false);
    });

    it('should not allow mahasiswa to manage any roles', () => {
      expect(canManageRole('mahasiswa', 'mahasiswa')).toBe(false);
      expect(canManageRole('mahasiswa', 'dosen')).toBe(false);
      expect(canManageRole('mahasiswa', 'admin')).toBe(false);
    });
  });
});

// ============================================================================
// RESOURCE-SPECIFIC PERMISSION TESTS
// ============================================================================

describe('Permissions - Resource-Specific', () => {
  describe('canView', () => {
    it('should check view permission correctly', () => {
      expect(canView('mahasiswa', 'kuis')).toBe(true);
      expect(canView('dosen', 'mata_kuliah')).toBe(true);
      expect(canView('laboran', 'peminjaman')).toBe(true);
    });
  });

  describe('canCreate', () => {
    it('should check create permission correctly', () => {
      // Mahasiswa can create attempts and jawaban
      expect(canCreate('mahasiswa', 'attempt_kuis')).toBe(true);
      expect(canCreate('mahasiswa', 'jawaban')).toBe(true);

      // Mahasiswa cannot create kuis
      expect(canCreate('mahasiswa', 'kuis')).toBe(false);

      // Dosen can create peminjaman and pengumuman
      expect(canCreate('dosen', 'peminjaman')).toBe(true);
      expect(canCreate('dosen', 'pengumuman')).toBe(true);
    });
  });

  describe('canUpdate', () => {
    it('should check update permission correctly', () => {
      // Dosen can update peminjaman
      expect(canUpdate('dosen', 'peminjaman')).toBe(true);

      // Mahasiswa can update jawaban and attempt_kuis
      expect(canUpdate('mahasiswa', 'jawaban')).toBe(true);
      expect(canUpdate('mahasiswa', 'attempt_kuis')).toBe(true);

      // Laboran can update peminjaman
      expect(canUpdate('laboran', 'peminjaman')).toBe(true);
    });
  });

  describe('canDelete', () => {
    it('should check delete permission correctly', () => {
      // Note: No explicit delete permissions in ROLE_METADATA
      // Delete would typically be part of manage permission
      expect(canDelete('admin', 'user')).toBe(false); // No delete:user permission
      expect(canDelete('dosen', 'user')).toBe(false);
      expect(canDelete('mahasiswa', 'kuis')).toBe(false);
    });
  });

  describe('canManage', () => {
    it('should check manage permission correctly', () => {
      expect(canManage('admin', 'user')).toBe(true);
      expect(canManage('laboran', 'inventaris')).toBe(true);
      expect(canManage('dosen', 'kuis')).toBe(true);
      expect(canManage('mahasiswa', 'kuis')).toBe(false);
    });
  });

  describe('canApprove', () => {
    it('should check approve permission correctly', () => {
      // Note: No approve:* permissions exist in ROLE_METADATA
      expect(canApprove('laboran', 'peminjaman')).toBe(false);
      expect(canApprove('mahasiswa', 'peminjaman')).toBe(false);
    });
  });

  describe('canGrade', () => {
    it('should check grade permission correctly', () => {
      // Actual permission is grade:attempt_kuis not grade:kuis
      expect(canGrade('dosen', 'attempt_kuis')).toBe(true);
      expect(canGrade('mahasiswa', 'attempt_kuis')).toBe(false);
    });
  });
});

// ============================================================================
// PERMISSION UTILITY TESTS
// ============================================================================

describe('Permissions - Utilities', () => {
  describe('getPermissionAction', () => {
    it('should extract action from permission', () => {
      expect(getPermissionAction('create:kuis')).toBe('create');
      expect(getPermissionAction('view:nilai')).toBe('view');
      expect(getPermissionAction('manage:user')).toBe('manage');
      expect(getPermissionAction('delete:inventaris')).toBe('delete');
    });
  });

  describe('getPermissionResource', () => {
    it('should extract resource from permission', () => {
      expect(getPermissionResource('create:kuis')).toBe('kuis');
      expect(getPermissionResource('view:nilai')).toBe('nilai');
      expect(getPermissionResource('manage:user')).toBe('user');
      expect(getPermissionResource('delete:inventaris')).toBe('inventaris');
    });
  });

  describe('formatPermission', () => {
    it('should format permission for display', () => {
      expect(formatPermission('create:kuis')).toBe('Create kuis');
      expect(formatPermission('view:mata_kuliah')).toBe('View mata kuliah');
      expect(formatPermission('manage:user')).toBe('Manage user');
    });

    it('should capitalize action', () => {
      const formatted = formatPermission('update:nilai');
      expect(formatted).toMatch(/^Update/);
    });

    it('should replace underscores in resource', () => {
      const formatted = formatPermission('create:mata_kuliah');
      expect(formatted).toContain('mata kuliah');
      expect(formatted).not.toContain('_');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Permissions - Integration', () => {
  it('should correctly handle admin full access', () => {
    const adminRole: UserRole = 'admin';
    const permissions = getRolePermissions(adminRole);

    // Admin should have manage permissions (not separate CRUD)
    expect(hasAllPermissions(adminRole, [
      'manage:kuis',
      'manage:user',
      'view:nilai',
    ])).toBe(true);

    // Admin should be able to manage all roles
    expect(canManageRole(adminRole, 'dosen')).toBe(true);
    expect(canManageRole(adminRole, 'mahasiswa')).toBe(true);
    expect(canManageRole(adminRole, 'laboran')).toBe(true);
  });

  it('should correctly handle dosen permissions', () => {
    const dosenRole: UserRole = 'dosen';

    // Dosen can manage and grade
    expect(canManage(dosenRole, 'kuis')).toBe(true);
    expect(canGrade(dosenRole, 'attempt_kuis')).toBe(true);

    // Dosen can create peminjaman and pengumuman
    expect(canCreate(dosenRole, 'peminjaman')).toBe(true);
    expect(canCreate(dosenRole, 'pengumuman')).toBe(true);

    // Dosen cannot manage users
    expect(canManage(dosenRole, 'user')).toBe(false);

    // Dosen can manage mahasiswa role
    expect(canManageRole(dosenRole, 'mahasiswa')).toBe(true);

    // But not admin or dosen roles
    expect(canManageRole(dosenRole, 'admin')).toBe(false);
    expect(canManageRole(dosenRole, 'dosen')).toBe(false);
  });

  it('should correctly handle mahasiswa permissions', () => {
    const mahasiswaRole: UserRole = 'mahasiswa';

    // Mahasiswa can view and submit answers
    expect(canView(mahasiswaRole, 'kuis')).toBe(true);
    expect(canCreate(mahasiswaRole, 'jawaban')).toBe(true);
    expect(canCreate(mahasiswaRole, 'attempt_kuis')).toBe(true);

    // Mahasiswa cannot manage kuis
    expect(canManage(mahasiswaRole, 'kuis')).toBe(false);

    // Mahasiswa cannot grade
    expect(canGrade(mahasiswaRole, 'attempt_kuis')).toBe(false);

    // Mahasiswa cannot manage any roles
    expect(canManageRole(mahasiswaRole, 'mahasiswa')).toBe(false);
  });

  it('should correctly handle laboran permissions', () => {
    const laboranRole: UserRole = 'laboran';

    // Laboran can manage inventaris
    expect(canManage(laboranRole, 'inventaris')).toBe(true);
    expect(canManage(laboranRole, 'laboratorium')).toBe(true);
    expect(canManage(laboranRole, 'peminjaman')).toBe(true);

    // Laboran cannot manage kuis (no such permission)
    expect(canManage(laboranRole, 'kuis')).toBe(false);
  });
});
