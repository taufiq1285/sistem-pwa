/**
 * Password Form Component
 * Form for updating user password
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  passwordUpdateSchema,
  type PasswordUpdateFormData,
} from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

interface PasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PasswordForm({ onSuccess, onCancel }: PasswordFormProps) {
  const { updatePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
  });

  const onSubmit = async (data: PasswordUpdateFormData) => {
    try {
      setError(null);
      setSuccess(null);

      await updatePassword(data.password);

      setSuccess("Password updated successfully!");
      reset();

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      let errorMessage = "Failed to update password. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Success Alert */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">
          <Lock className="inline-block w-4 h-4 mr-2" />
          New Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter new password (min. 6 characters)"
          {...register("password")}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          <Lock className="inline-block w-4 h-4 mr-2" />
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter new password"
          {...register("confirmPassword")}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
