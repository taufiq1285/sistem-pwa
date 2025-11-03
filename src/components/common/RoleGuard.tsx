import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROUTES } from '@/config/routes.config';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  // --- PERBAIKAN: Pindahkan Hook ke paling atas ---
  const { user, loading, initialized } = useAuth();
  // --- Batas Perbaikan ---

  const BYPASS_ROLE = false;
  
  if (BYPASS_ROLE) {
    console.log('🔓 ROLE GUARD BYPASSED FOR TESTING - Allowed roles:', allowedRoles);
    return <>{children}</>;
  }

  // Pemanggilan useAuth() tadinya ada di sini

  console.log('🛡️ RoleGuard Check:', {
    loading,
    initialized,
    userRole: user?.role,
    allowedRoles,
    hasPermission: user ? allowedRoles.includes(user.role) : false,
    timestamp: new Date().toISOString(),
  });

  if (loading || !initialized) {
    console.log('⏳ RoleGuard: LOADING STATE', { loading, initialized });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
          <p className="mt-2 text-xs text-gray-400">
            Loading: {loading ? 'true' : 'false'} | Initialized: {initialized ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ RoleGuard: NO USER, redirecting to login');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const hasPermission = allowedRoles.includes(user.role);

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
  
  return <>{children}</>;
}

export default RoleGuard;