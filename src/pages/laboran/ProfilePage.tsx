/**
 * Laboran Profile Page
 * Menampilkan dan mengedit profil laboran
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import {
  getLaboranProfile,
  updateLaboranProfile,
  updateUserProfile,
  type LaboranProfile,
} from "@/lib/api/profile.api";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GlassCard } from "@/components/ui/glass-card";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Save,
  User,
  Wrench,
} from "lucide-react";

interface UserProfile {
  full_name: string;
  email: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
  });

  const [laboranProfile, setLaboranProfile] = useState<LaboranProfile>({
    id: "",
    user_id: "",
    nip: "",
    nama_laboran: "",
    shift: "",
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

      if (!user?.id) return;

      const profileData = await cacheAPI(
        `laboran_profile_${user.id}`,
        () => getLaboranProfile(user.id),
        {
          ttl: 20 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      if (profileData) {
        setUserProfile({
          full_name: profileData.users?.full_name || "",
          email: profileData.users?.email || "",
        });

        setLaboranProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          nip: profileData.nip || "",
          nama_laboran: profileData.nama_laboran,
          shift: profileData.shift || "",
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

      if (!user?.id) return;

      await updateUserProfile(user.id, userProfile);

      await updateLaboranProfile(laboranProfile.id, {
        shift: laboranProfile.shift,
      });

      setSuccess("Profil berhasil diperbarui!");

      await invalidateCache(`laboran_profile_${user.id}`);
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
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="h-24 w-full skeleton-shimmer rounded-2xl" />
        <FormSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola informasi akun dan data kerja laboran.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Profil</p>
              <p className="font-semibold text-foreground">
                {userProfile.full_name || "-"}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/10 p-3 text-success">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground break-all">
                {userProfile.email || "-"}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shift</p>
              <p className="font-semibold text-foreground">
                {laboranProfile.shift || "-"}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

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

      <GlassCard
        intensity="low"
        className="interactive-card rounded-2xl border-white/40 bg-white/95 shadow-lg dark:border-white/10 dark:bg-card"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Informasi akun dan kontak Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={userProfile.full_name}
                onChange={(e) =>
                  setUserProfile({
                    ...userProfile,
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
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="border-border/50 bg-muted/50 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={laboranProfile.nip}
                disabled
                className="border-border/50 bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard
        intensity="low"
        className="interactive-card rounded-2xl border-white/40 bg-white/95 shadow-lg dark:border-white/10 dark:bg-card"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Informasi Pekerjaan
          </CardTitle>
          <CardDescription>
            Informasi shift dan jadwal kerja Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shift">Shift Kerja</Label>
              <Input
                id="shift"
                value={laboranProfile.shift}
                onChange={(e) =>
                  setLaboranProfile({
                    ...laboranProfile,
                    shift: e.target.value,
                  })
                }
                placeholder="Contoh: Pagi (08:00 - 16:00)"
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={() => fetchProfile(false)}
          disabled={saving}
          className="border-primary/30 text-primary hover:bg-primary/5"
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
