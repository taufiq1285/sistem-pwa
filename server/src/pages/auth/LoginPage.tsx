/**
 * Login Page
 * Page for user authentication
 */

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoginForm } from "@/components/forms/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "dosen":
          navigate("/dosen");
          break;
        case "mahasiswa":
          navigate("/mahasiswa");
          break;
        case "laboran":
          navigate("/laboran");
          break;
        default:
          navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSuccess = () => {
    // Navigation handled by useEffect above
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleSuccess} />

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up
            </Link>
          </div>

          <div className="mt-2 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-gray-600 hover:text-gray-800"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
