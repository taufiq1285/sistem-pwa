/**
 * Register page component using the shared split-panel authentication layout.
 */

import { useNavigate } from "react-router-dom";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

/**
 * RegisterPage component.
 */
export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout variant="register">
      <RegisterForm
        onSuccess={() => {
          window.setTimeout(() => navigate("/login", { replace: true }), 1200);
        }}
      />
    </AuthLayout>
  );
}
