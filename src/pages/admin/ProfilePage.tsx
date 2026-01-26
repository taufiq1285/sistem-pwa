/**
 * Admin Profile Page
 * Menampilkan dan mengedit profil admin
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { getAdminProfile, updateAdminProfile } from "@/lib/api/profile.api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

interface UserProfile {
  full_name: string;
  email: string;
  role: string;
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    role: "admin",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const profileData = await cacheAPI(
        `admin_profile_${user?.id}`,
        () => getAdminProfile(user!.id!),
        {
          ttl: 20 * 60 * 1000, // 20 minutes - profile data rarely changes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          role: profileData.role || "admin",
        });
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Update admin profile
      await updateAdminProfile(user!.id!, profile);

      setSuccess("Profil berhasil diperbarui!");

      // Invalidate cache and reload
      await invalidateCache(`admin_profile_${user?.id}`);
      await fetchProfile(true);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Profil Saya"
          description="Kelola informasi profil Anda"
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* User Information Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="h-5 w-5" />
              Informasi Akun
            </CardTitle>
            <CardDescription className="text-base font-semibold mt-1">
              Informasi akun administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="pl-10 bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="role"
                    value="Administrator"
                    disabled
                    className="pl-10 bg-gray-50 capitalize"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => fetchProfile(false)}
            disabled={saving}
            className="font-semibold border-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="font-semibold bg-linear-to-r from-blue-500 to-indigo-600"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
