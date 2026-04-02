import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/config/routes.config";

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
    return <>{children}</>;
  }

  // Pemanggilan useAuth() tadinya ada di sini

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}

export default RoleGuard;
