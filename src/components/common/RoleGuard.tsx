

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROUTES } from '@/config/routes.config';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[]; // Array of allowed role names
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading, initialized } = useAuth();

  // 🐛 DEBUG: Log all role guard states
  console.log('🛡️ RoleGuard Check:', {
    loading,
    initialized,
    userRole: user?.role,
    allowedRoles,
    hasPermission: user ? allowedRoles.includes(user.role) : false,
    timestamp: new Date().toISOString(),
  });

  // Show loading spinner while checking roles
  if (loading || !initialized) {
    console.log('⏳ RoleGuard: LOADING STATE', { loading, initialized });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
          {/* 🐛 DEBUG INFO DISPLAYED ON SCREEN */}
          <p className="mt-2 text-xs text-gray-400">
            Loading: {loading ? 'true' : 'false'} | Initialized: {initialized ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  // User must be authenticated to check roles
  if (!user) {
    console.log('❌ RoleGuard: NO USER, redirecting to login');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check if user's role is in the allowed roles
  const hasPermission = allowedRoles.includes(user.role);

  // Redirect to unauthorized page if user doesn't have permission
  if (!hasPermission) {
    console.log('🚫 RoleGuard: UNAUTHORIZED, redirecting to 403', {
      userRole: user.role,
      allowedRoles,
    });
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  console.log('✅ RoleGuard: AUTHORIZED, rendering children', {
    userRole: user.role,
    allowedRoles,
  });
  // User has required role, render the protected content
  return <>{children}</>;
}