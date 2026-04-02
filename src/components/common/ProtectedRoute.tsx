import type { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/config/routes.config";

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
    return children ? <>{children}</> : <Outlet />;
  }

  // Show minimal loading - cache makes this very fast!
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 to-accent/10 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-gray-700 mx-auto" />
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-500 mx-auto absolute top-0 left-1/2 -translate-x-1/2" />
          </div>
          <p className="mt-6 text-gray-700 dark:text-gray-200 font-medium">
            Loading...
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            This should be instant with cache!
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
