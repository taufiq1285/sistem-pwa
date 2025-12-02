/**
 * Permission Error Classes
 * Custom error types for RBAC permission system
 *
 * IMPORTANT: All errors extend Error to maintain compatibility
 * with existing try-catch blocks in components
 */

/**
 * Base Permission Error
 * Thrown when user lacks required permission
 */
export class PermissionError extends Error {
  public readonly code: string = 'PERMISSION_DENIED';
  public readonly statusCode: number = 403;
  public readonly permission?: string;
  public readonly userRole?: string;

  constructor(message: string, permission?: string, userRole?: string) {
    super(message);
    this.name = 'PermissionError';
    this.permission = permission;
    this.userRole = userRole;

    // Maintain proper stack trace (V8 engines)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, PermissionError);
    }
  }

  /**
   * Get user-friendly error message
   */
  toUserMessage(): string {
    return 'Anda tidak memiliki izin untuk melakukan aksi ini';
  }

  /**
   * Get detailed error for logging
   */
  toLogMessage(): string {
    return `Permission denied: ${this.permission} for role ${this.userRole}`;
  }
}

/**
 * Ownership Error
 * Thrown when user tries to access/modify resource they don't own
 */
export class OwnershipError extends Error {
  public readonly code: string = 'OWNERSHIP_REQUIRED';
  public readonly statusCode: number = 403;
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(message: string, resourceType?: string, resourceId?: string) {
    super(message);
    this.name = 'OwnershipError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, OwnershipError);
    }
  }

  toUserMessage(): string {
    return 'Anda hanya dapat mengakses resource milik Anda sendiri';
  }

  toLogMessage(): string {
    return `Ownership denied: ${this.resourceType}/${this.resourceId}`;
  }
}

/**
 * Authentication Error
 * Thrown when user is not authenticated
 */
export class AuthenticationError extends Error {
  public readonly code: string = 'AUTHENTICATION_REQUIRED';
  public readonly statusCode: number = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, AuthenticationError);
    }
  }

  toUserMessage(): string {
    return 'Silakan login terlebih dahulu';
  }
}

/**
 * Role Not Found Error
 * Thrown when user role cannot be determined
 */
export class RoleNotFoundError extends Error {
  public readonly code: string = 'ROLE_NOT_FOUND';
  public readonly statusCode: number = 500;
  public readonly userId?: string;

  constructor(message: string, userId?: string) {
    super(message);
    this.name = 'RoleNotFoundError';
    this.userId = userId;

    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, RoleNotFoundError);
    }
  }

  toUserMessage(): string {
    return 'Terjadi kesalahan sistem. Silakan hubungi administrator';
  }
}

/**
 * Type guard to check if error is permission-related
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

export function isOwnershipError(error: unknown): error is OwnershipError {
  return error instanceof OwnershipError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Check if error is any RBAC-related error
 */
export function isRBACError(error: unknown): boolean {
  return (
    isPermissionError(error) ||
    isOwnershipError(error) ||
    isAuthenticationError(error) ||
    error instanceof RoleNotFoundError
  );
}

/**
 * Get user-friendly message from any RBAC error
 */
export function getRBACErrorMessage(error: unknown): string {
  if (isPermissionError(error)) {
    return error.toUserMessage();
  }
  if (isOwnershipError(error)) {
    return error.toUserMessage();
  }
  if (isAuthenticationError(error)) {
    return error.toUserMessage();
  }
  if (error instanceof RoleNotFoundError) {
    return error.toUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui';
}
