/**
 * Register Page
 * Page for new user registration
 */

import { useNavigate, Link } from "react-router-dom";
import { RegisterForm } from "@/components/forms/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to login after successful registration
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Fill in your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onSuccess={handleSuccess} />

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
