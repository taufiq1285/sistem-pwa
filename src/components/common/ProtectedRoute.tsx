
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROUTES } from '@/config/routes.config';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();

  // 🐛 DEBUG: Log all authentication states
  console.log('🔒 ProtectedRoute Check:', {
    path: location.pathname,
    loading,
    initialized,
    isAuthenticated,
    timestamp: new Date().toISOString(),
  });

  // Show loading spinner while checking authentication
  if (loading || !initialized) {
    console.log('⏳ ProtectedRoute: LOADING STATE', { loading, initialized });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
          {/* 🐛 DEBUG INFO DISPLAYED ON SCREEN */}
          <p className="mt-2 text-xs text-gray-400">
            Loading: {loading ? 'true' : 'false'} | Initialized: {initialized ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Save current location to redirect back after login
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
  // User is authenticated, render the protected content
  return <>{children}</>;
}