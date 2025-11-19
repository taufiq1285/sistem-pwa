/**
 * Login Form Component
 * Form for user authentication
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null); // Clear offline error when back online
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError('No internet connection. Please check your network and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

 const onSubmit = async (data: LoginFormData) => {
    try {
      // Check if online before attempting login
      if (!isOnline) {
        setError('Cannot login while offline. Please check your internet connection.');
        return;
      }

      setError(null);
      await login(data);
      onSuccess?.();
    } catch (err: unknown) {
      // Tambahkan type guard
      let errorMessage = 'Login failed. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Offline Warning */}
      {!isOnline && (
        <Alert variant="destructive" className="bg-orange-50 border-orange-200">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>You are offline.</strong> Login requires an internet connection.
            {' '}Please check your network and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && isOnline && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register('password')}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !isOnline}
      >
        {!isOnline ? 'Offline - Cannot Sign In' : isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Offline Helper Text */}
      {!isOnline && (
        <p className="text-sm text-center text-gray-600 mt-2">
          💡 If you've logged in before, your session may still be active when you go back online.
        </p>
      )}
    </form>
  );
}