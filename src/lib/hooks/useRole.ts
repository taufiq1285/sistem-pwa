/**
 * useRole Hook
 * Custom hook for role-based access control and permission checking
 */

import { useMemo } from "react";
import { useAuth } from "./useAuth";
import type { UserRole } from "@/types/auth.types";
import type { Permission } from "@/types/permission.types";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canView,
  canCreate,
  canUpdate,
  canDelete,
  canManage,
  canApprove,
  canGrade,
  isRoleHigher,
  isRoleLower,
  isRoleEqual,
  canManageRole,
} from "@/lib/utils/permissions";
import { ROLE_METADATA } from "@/types/role.types";

/**
 * Hook return type
 */
export interface UseRoleReturn {
  // Current user role
  role: UserRole | null;

  // Role metadata
  roleLabel: string | null;
  roleDescription: string | null;
  roleColor: string | null;
  roleIcon: string | null;
  dashboardPath: string | null;

  // Role booleans
  isAdmin: boolean;
  isDosen: boolean;
  isMahasiswa: boolean;
  isLaboran: boolean;

  // Permission checking
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Resource-specific permissions
  can: (action: string, resource: string) => boolean;
  canView: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  canApprove: (resource: string) => boolean;
  canGrade: (resource: string) => boolean;

  // Role comparison
  isRoleHigher: (targetRole: UserRole) => boolean;
  isRoleLower: (targetRole: UserRole) => boolean;
  isRoleEqual: (targetRole: UserRole) => boolean;
  canManageRole: (targetRole: UserRole) => boolean;

  // Get all permissions
  permissions: Permission[];
}

/**
 * Custom hook for role and permission checking
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAdmin, isDosen, can, hasPermission } = useRole();
 *
 *   if (isAdmin) {
 *     return <AdminPanel />;
 *   }
 *
 *   if (can('create', 'kuis')) {
 *     return <CreateQuizButton />;
 *   }
 *
 *   if (hasPermission('view:nilai')) {
 *     return <GradesList />;
 *   }
 *
 *   return <AccessDenied />;
 * }
 * ```
 */
export function useRole(): UseRoleReturn {
  const { user } = useAuth();
  const role = user?.role ?? null;

  // Get role metadata
  const metadata = useMemo(() => {
    if (!role) return null;
    return ROLE_METADATA[role];
  }, [role]);

  // Role booleans
  const isAdmin = role === "admin";
  const isDosen = role === "dosen";
  const isMahasiswa = role === "mahasiswa";
  const isLaboran = role === "laboran";

  // Permission checking functions
  const checkPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    };
  }, [role]);

  const checkAnyPermission = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAnyPermission(role, permissions);
    };
  }, [role]);

  const checkAllPermissions = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!role) return false;
      return hasAllPermissions(role, permissions);
    };
  }, [role]);

  // Resource-specific permission functions
  const can = useMemo(() => {
    return (action: string, resource: string): boolean => {
      if (!role) return false;
      const permission = `${action}:${resource}` as Permission;
      return hasPermission(role, permission);
    };
  }, [role]);

  const checkCanView = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canView(role, resource);
    };
  }, [role]);

  const checkCanCreate = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canCreate(role, resource);
    };
  }, [role]);

  const checkCanUpdate = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canUpdate(role, resource);
    };
  }, [role]);

  const checkCanDelete = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canDelete(role, resource);
    };
  }, [role]);

  const checkCanManage = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canManage(role, resource);
    };
  }, [role]);

  const checkCanApprove = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canApprove(role, resource);
    };
  }, [role]);

  const checkCanGrade = useMemo(() => {
    return (resource: string): boolean => {
      if (!role) return false;
      return canGrade(role, resource);
    };
  }, [role]);

  // Role comparison functions
  const checkIsRoleHigher = useMemo(() => {
    return (targetRole: UserRole): boolean => {
      if (!role) return false;
      return isRoleHigher(role, targetRole);
    };
  }, [role]);

  const checkIsRoleLower = useMemo(() => {
    return (targetRole: UserRole): boolean => {
      if (!role) return false;
      return isRoleLower(role, targetRole);
    };
  }, [role]);

  const checkIsRoleEqual = useMemo(() => {
    return (targetRole: UserRole): boolean => {
      if (!role) return false;
      return isRoleEqual(role, targetRole);
    };
  }, [role]);

  const checkCanManageRole = useMemo(() => {
    return (targetRole: UserRole): boolean => {
      if (!role) return false;
      return canManageRole(role, targetRole);
    };
  }, [role]);

  // Get all permissions for current role
  const permissions = useMemo(() => {
    if (!role) return [];
    return getRolePermissions(role);
  }, [role]);

  return {
    // Role info
    role,
    roleLabel: metadata?.label ?? null,
    roleDescription: metadata?.description ?? null,
    roleColor: metadata?.color ?? null,
    roleIcon: metadata?.icon ?? null,
    dashboardPath: metadata?.dashboardPath ?? null,

    // Role booleans
    isAdmin,
    isDosen,
    isMahasiswa,
    isLaboran,

    // Permission checking
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,

    // Resource-specific permissions
    can,
    canView: checkCanView,
    canCreate: checkCanCreate,
    canUpdate: checkCanUpdate,
    canDelete: checkCanDelete,
    canManage: checkCanManage,
    canApprove: checkCanApprove,
    canGrade: checkCanGrade,

    // Role comparison
    isRoleHigher: checkIsRoleHigher,
    isRoleLower: checkIsRoleLower,
    isRoleEqual: checkIsRoleEqual,
    canManageRole: checkCanManageRole,

    // All permissions
    permissions,
  };
}
