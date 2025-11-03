import type { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROUTES } from '@/config/routes.config';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // --- PERBAIKAN: Pindahkan Hooks ke paling atas ---
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();
  // --- Batas Perbaikan ---

  const BYPASS_AUTH = false;
  
  if (BYPASS_AUTH) {
    console.log('🔓 AUTH BYPASSED FOR TESTING');
    return children ? <>{children}</> : <Outlet />;
  }

  // Hooks tadinya ada di sini, sekarang sudah dipindah ke atas

  console.log('🔐 ProtectedRoute Check:', {
    path: location.pathname,
    loading,
    initialized,
    isAuthenticated,
    timestamp: new Date().toISOString(),
  });

  if (loading || !initialized) {
    console.log('⏳ ProtectedRoute: LOADING STATE', { loading, initialized });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
          <p className="mt-2 text-xs text-gray-400">
            Loading: {loading ? 'true' : 'false'} | Initialized: {initialized ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: NOT AUTHENTICATED, redirecting to login', {
      attemptedPath: location.pathname,
      redirectTo: ROUTES.LOGIN,
    });
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  console.log('✅ ProtectedRoute: AUTHENTICATED, rendering children', {
    path: location.pathname,
  });
  
  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;