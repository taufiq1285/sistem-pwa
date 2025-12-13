/**
 * Profile Form Component
 * Form for updating user profile information
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from "@/lib/validations/user.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface ProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileForm({ onSuccess, onCancel }: ProfileFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setValue("full_name", user.full_name || "");
      setValue("phone", user.phone || "");
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      setError(null);
      setSuccess(null);

      if (!user?.id) {
        throw new Error("User not found");
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully!");

      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      let errorMessage = "Failed to update profile. Please try again.";
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

      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ""}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500">
          Email cannot be changed. Contact administrator if you need to update
          it.
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">
          <User className="inline-block w-4 h-4 mr-2" />
          Full Name
        </Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Enter your full name"
          {...register("full_name")}
          disabled={isSubmitting}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          <Phone className="inline-block w-4 h-4 mr-2" />
          Phone Number (Optional)
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+62 xxx xxx xxxx"
          {...register("phone")}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Role (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          type="text"
          value={user?.role || ""}
          disabled
          className="bg-gray-50 capitalize"
        />
        <p className="text-xs text-gray-500">
          Your role is assigned by the administrator.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Updating...
            </>
          ) : (
            "Update Profile"
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
