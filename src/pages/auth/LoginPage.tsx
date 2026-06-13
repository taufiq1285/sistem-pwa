/**
 * Login page component using the shared split-panel authentication layout.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/forms/LoginForm";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Helper to determine dashboard path based on user role.
 * @param role - The authenticated user's role
 * @returns The destination dashboard path
 */
function getDashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "dosen":
      return "/dosen";
    case "mahasiswa":
      return "/mahasiswa";
    case "laboran":
      return "/laboran";
    default:
      return "/";
  }
}

/**
 * LoginPage component.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <AuthLayout variant="login">
      <LoginForm />
    </AuthLayout>
  );
}
