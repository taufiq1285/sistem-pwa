/**
 * Admin Profile Page
 * Menampilkan dan mengedit profil admin
 */

import { useEffect, useState } from "react";
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
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Save,
  Shield,
  User,
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
          ttl: 20 * 60 * 1000,
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

      await updateAdminProfile(user!.id!, profile);

      setSuccess("Profil berhasil diperbarui!");

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
      <div className="app-container">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-24 rounded-3xl bg-primary/10" />
          <div className="h-64 rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Kelola informasi profil Anda"
        className="section-shell"
      />

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="rounded-2xl border-success/30 bg-success/10 text-success-foreground dark:border-success/20 dark:bg-success/15">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card className="interactive-card rounded-2xl border border-border/60 bg-white/95 shadow-sm dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Informasi akun administrator</CardDescription>
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
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="border-border/50 bg-muted/50 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="role"
                  value="Administrator"
                  disabled
                  className="border-border/50 bg-muted/50 pl-10 capitalize"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonEnhanced
          variant="outline"
          onClick={() => fetchProfile(false)}
          disabled={saving}
          className="border-primary/30 text-primary hover:bg-primary/5"
        >
          Batal
        </ButtonEnhanced>
        <ButtonEnhanced
          onClick={handleSave}
          loading={saving}
          loadingText="Menyimpan..."
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </ButtonEnhanced>
      </div>
    </div>
  );
}
