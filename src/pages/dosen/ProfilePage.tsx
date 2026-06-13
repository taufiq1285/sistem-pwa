/**
 * Dosen Profile Page
 * Menampilkan dan mengedit profil dosen
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import {
  getDosenProfile,
  updateDosenProfile,
  updateUserProfile,
  type DosenProfile,
} from "@/lib/api/profile.api";
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
  BookOpen,
  CheckCircle2,
  Mail,
  Save,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FormSkeleton } from "@/components/common";

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

  const [dosenProfile, setDosenProfile] = useState<DosenProfile>({
    id: "",
    user_id: "",
    nidn: "",
    nama_dosen: "",
    program_studi: "",
    nip: "",
    gelar_depan: "",
    gelar_belakang: "",
    fakultas: "",
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
        `dosen_profile_${user.id}`,
        () => getDosenProfile(user.id),
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

        setDosenProfile({
          id: profileData.id,
          user_id: profileData.user_id,
          nidn: profileData.nidn || "",
          nama_dosen: profileData.nama_dosen,
          program_studi: profileData.program_studi || "",
          nip: profileData.nip || "",
          gelar_depan: profileData.gelar_depan || "",
          gelar_belakang: profileData.gelar_belakang || "",
          fakultas: profileData.fakultas || "",
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
    if (!navigator.onLine) {
      setError(
        "Perubahan profil belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user?.id) return;

      await updateUserProfile(user.id, userProfile);

      await updateDosenProfile(dosenProfile.id, {
        nidn: dosenProfile.nidn,
        gelar_depan: dosenProfile.gelar_depan,
        gelar_belakang: dosenProfile.gelar_belakang,
        fakultas: dosenProfile.fakultas,
        program_studi: dosenProfile.program_studi,
      });

      setSuccess("Profil berhasil diperbarui!");

      await invalidateCache(`dosen_profile_${user.id}`);
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
            Kelola informasi profil Anda
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="rounded-2xl border-success/30 bg-success/10 dark:border-success/20 dark:bg-success/15">
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
              <Label htmlFor="nidn">NIDN / NUPTK</Label>
              <Input
                id="nidn"
                value={dosenProfile.nidn}
                onChange={(e) =>
                  setDosenProfile({ ...dosenProfile, nidn: e.target.value })
                }
                placeholder="Masukkan NIDN atau NUPTK"
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-card rounded-2xl border border-border/60 bg-white/95 shadow-sm dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Informasi Akademik
          </CardTitle>
          <CardDescription>Gelar dan informasi akademik Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gelar_depan">Gelar Depan</Label>
              <Input
                id="gelar_depan"
                value={dosenProfile.gelar_depan}
                onChange={(e) =>
                  setDosenProfile({
                    ...dosenProfile,
                    gelar_depan: e.target.value,
                  })
                }
                placeholder="Dr., Prof., dll"
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gelar_belakang">Gelar Belakang</Label>
              <Input
                id="gelar_belakang"
                value={dosenProfile.gelar_belakang}
                onChange={(e) =>
                  setDosenProfile({
                    ...dosenProfile,
                    gelar_belakang: e.target.value,
                  })
                }
                placeholder="S.Kom., M.Kom., Ph.D., dll"
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fakultas">Fakultas</Label>
              <Input
                id="fakultas"
                value={dosenProfile.fakultas}
                onChange={(e) =>
                  setDosenProfile({
                    ...dosenProfile,
                    fakultas: e.target.value,
                  })
                }
                placeholder="Nama fakultas"
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_studi">Program Studi</Label>
              <Input
                id="program_studi"
                value={dosenProfile.program_studi}
                onChange={(e) =>
                  setDosenProfile({
                    ...dosenProfile,
                    program_studi: e.target.value,
                  })
                }
                placeholder="Nama program studi"
                className="border-border/50 focus-visible:ring-primary"
              />
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
          disabled={saving || !navigator.onLine}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </ButtonEnhanced>
      </div>
    </div>
  );
}
