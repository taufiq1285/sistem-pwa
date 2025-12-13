/**
 * Permission Utilities
 * Helper functions for role-based permission checking
 */

import type { UserRole } from "@/types/auth.types";
import type {
  Permission,
  PermissionCheckResult,
  PermissionContext,
} from "@/types/permission.types";
import type { RoleComparison } from "@/types/role.types";
import { ROLE_HIERARCHY, ROLE_METADATA } from "@/types/role.types";

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if user has a specific permission
 * @param userRole - User's role
 * @param permission - Permission to check
 * @returns Whether user has the permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission,
): boolean {
  const roleMetadata = ROLE_METADATA[userRole];
  return roleMetadata.permissions.includes(permission);
}

/**
 * Check if user has ANY of the given permissions
 * @param userRole - User's role
 * @param permissions - Array of permissions to check
 * @returns Whether user has at least one permission
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Check if user has ALL of the given permissions
 * @param userRole - User's role
 * @param permissions - Array of permissions to check
 * @returns Whether user has all permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 * @param userRole - User's role
 * @returns Array of permissions
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_METADATA[userRole].permissions;
}

// ============================================================================
// PERMISSION CHECKING WITH CONTEXT
// ============================================================================

/**
 * Check permission with context (e.g., ownership)
 * @param context - Permission context with user and resource info
 * @param permission - Permission to check
 * @returns Permission check result
 */
export function checkPermission(
  context: PermissionContext,
  permission: Permission,
): PermissionCheckResult {
  const { user, resource } = context;

  // Check if user has the base permission
  if (!hasPermission(user.role, permission)) {
    return {
      allowed: false,
      reason: "User does not have required permission",
    };
  }

  // If resource is provided, check ownership for certain operations
  if (resource && resource.ownerId) {
    const isOwner = user.id === resource.ownerId;
    const [action] = permission.split(":");

    // Operations that require ownership (unless admin)
    const ownershipRequired = ["update", "delete"];

    if (
      ownershipRequired.includes(action) &&
      !isOwner &&
      user.role !== "admin"
    ) {
      return {
        allowed: false,
        reason: "User can only perform this action on their own resources",
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// ROLE HIERARCHY CHECKING
// ============================================================================

/**
 * Check if role1 has higher hierarchy than role2
 * @param role1 - First role
 * @param role2 - Second role
 * @returns Whether role1 is higher than role2
 */
export function isRoleHigher(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Check if role1 has lower hierarchy than role2
 * @param role1 - First role
 * @param role2 - Second role
 * @returns Whether role1 is lower than role2
 */
export function isRoleLower(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] < ROLE_HIERARCHY[role2];
}

/**
 * Check if two roles are equal
 * @param role1 - First role
 * @param role2 - Second role
 * @returns Whether roles are equal
 */
export function isRoleEqual(role1: UserRole, role2: UserRole): boolean {
  return role1 === role2;
}

/**
 * Compare two roles
 * @param role1 - First role
 * @param role2 - Second role
 * @returns Role comparison result
 */
export function compareRoles(role1: UserRole, role2: UserRole): RoleComparison {
  const hierarchy1 = ROLE_HIERARCHY[role1];
  const hierarchy2 = ROLE_HIERARCHY[role2];
  const difference = hierarchy1 - hierarchy2;

  return {
    isHigher: difference > 0,
    isLower: difference < 0,
    isEqual: difference === 0,
    difference,
  };
}

/**
 * Check if user can manage target role
 * (User can only manage roles lower than their own, except admin can manage all)
 * @param userRole - User's role
 * @param targetRole - Target role to manage
 * @returns Whether user can manage target role
 */
export function canManageRole(
  userRole: UserRole,
  targetRole: UserRole,
): boolean {
  // Admin can manage all roles
  if (userRole === "admin") return true;

  // User can only manage roles lower than their own
  return isRoleHigher(userRole, targetRole);
}

// ============================================================================
// RESOURCE-SPECIFIC PERMISSIONS
// ============================================================================

/**
 * Check if user can view resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can view resource
 */
export function canView(userRole: UserRole, resourceType: string): boolean {
  const permission = `view:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can create resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can create resource
 */
export function canCreate(userRole: UserRole, resourceType: string): boolean {
  const permission = `create:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can update resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can update resource
 */
export function canUpdate(userRole: UserRole, resourceType: string): boolean {
  const permission = `update:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can delete resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can delete resource
 */
export function canDelete(userRole: UserRole, resourceType: string): boolean {
  const permission = `delete:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can manage resource (all CRUD operations)
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can manage resource
 */
export function canManage(userRole: UserRole, resourceType: string): boolean {
  const permission = `manage:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can approve resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can approve resource
 */
export function canApprove(userRole: UserRole, resourceType: string): boolean {
  const permission = `approve:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

/**
 * Check if user can grade resource
 * @param userRole - User's role
 * @param resourceType - Type of resource
 * @returns Whether user can grade resource
 */
export function canGrade(userRole: UserRole, resourceType: string): boolean {
  const permission = `grade:${resourceType}` as Permission;
  return hasPermission(userRole, permission);
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

/**
 * Get permission action from permission string
 * @param permission - Permission string (e.g., "create:kuis")
 * @returns Action part of permission
 */
export function getPermissionAction(permission: Permission): string {
  return permission.split(":")[0];
}

/**
 * Get permission resource from permission string
 * @param permission - Permission string (e.g., "create:kuis")
 * @returns Resource part of permission
 */
export function getPermissionResource(permission: Permission): string {
  return permission.split(":")[1];
}

/**
 * Format permission for display
 * @param permission - Permission string
 * @returns Formatted permission string
 */
export function formatPermission(permission: Permission): string {
  const [action, resource] = permission.split(":");
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
  const resourceLabel = resource.replace(/_/g, " ");
  return `${actionLabel} ${resourceLabel}`;
}
