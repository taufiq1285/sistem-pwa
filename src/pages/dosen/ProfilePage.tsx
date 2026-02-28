/**
 * Dosen Profile Page
 * Menampilkan dan mengedit profil dosen
 */

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Mail,
  Phone,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

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
          ttl: 20 * 60 * 1000, // 20 minutes - profile data rarely changes
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
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user?.id) return;

      // Update user profile
      await updateUserProfile(user.id, userProfile);

      // Update dosen profile
      await updateDosenProfile(dosenProfile.id, {
        nidn: dosenProfile.nidn,
        gelar_depan: dosenProfile.gelar_depan,
        gelar_belakang: dosenProfile.gelar_belakang,
        fakultas: dosenProfile.fakultas,
        program_studi: dosenProfile.program_studi,
      });

      setSuccess("Profil berhasil diperbarui!");

      // Invalidate cache and reload
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
      <div className="role-page-shell">
        <div className="role-page-content max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell">
      <div className="role-page-content max-w-4xl space-y-6">
        <PageHeader
          title="Profil Saya"
          description="Kelola informasi profil Anda"
          className="mb-2"
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
        <Card className="interactive-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    value={userProfile.email}
                    disabled
                    className="pl-10 bg-gray-50"
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information Card */}
        <Card className="interactive-card border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Informasi Akademik</CardTitle>
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => fetchProfile(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
