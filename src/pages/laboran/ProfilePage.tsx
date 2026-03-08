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
import { DashboardCard } from "@/components/ui/dashboard-card";
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
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-blue-100/70" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-3xl bg-slate-100" />
            <div className="h-28 rounded-3xl bg-slate-100" />
            <div className="h-28 rounded-3xl bg-slate-100" />
          </div>
          <div className="h-72 rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-slate-900/80"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Profil Saya
                  </h1>
                  <p className="text-muted-foreground">
                    Kelola informasi akun dan data kerja laboran.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard
            intensity="low"
            className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
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
            className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/10 p-3 text-green-600">
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
            className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-600">
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
        <Alert className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <GlassCard
        intensity="low"
        className="interactive-card rounded-2xl border-white/40 bg-white/95 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <User className="h-5 w-5 text-blue-700" />
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
                className="border-blue-100 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  value={userProfile.email}
                  disabled
                  className="border-blue-100 bg-slate-50 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={laboranProfile.nip}
                disabled
                className="border-blue-100 bg-slate-50"
              />
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard
        intensity="low"
        className="interactive-card rounded-2xl border-white/40 bg-white/95 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Wrench className="h-5 w-5 text-blue-700" />
            Informasi Pekerjaan
          </CardTitle>
          <CardDescription>Informasi shift dan jadwal kerja Anda</CardDescription>
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
                className="border-blue-100 focus-visible:ring-blue-500"
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
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-700 text-white hover:bg-blue-800"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
      </div>
    </div>
  );
}
