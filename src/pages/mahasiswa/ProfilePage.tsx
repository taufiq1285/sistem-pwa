/**
 * Mahasiswa Profile Page
 * Menampilkan dan mengedit profil mahasiswa
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import {
  getMahasiswaProfile,
  updateMahasiswaProfile,
  updateUserProfile,
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
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

interface MahasiswaProfile {
  id: string;
  nim: string;
  program_studi: string;
  angkatan: number;
  semester: number;
  gender?: "L" | "P" | null;
  date_of_birth?: string;
  address?: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
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
    phone: "",
  });

  const [mahasiswaProfile, setMahasiswaProfile] = useState<MahasiswaProfile>({
    id: "",
    nim: "",
    program_studi: "",
    angkatan: new Date().getFullYear(),
    semester: 1,
    gender: null,
    date_of_birth: "",
    address: "",
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
        `mahasiswa_profile_${user?.id}`,
        () => getMahasiswaProfile(user!.id!),
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
          phone: "",
        });

        setMahasiswaProfile({
          id: profileData.id || "",
          nim: profileData.nim || "",
          program_studi: profileData.program_studi || "",
          angkatan: profileData.angkatan || new Date().getFullYear(),
          semester: profileData.semester || 1,
          gender: profileData.gender || null,
          date_of_birth: profileData.date_of_birth || "",
          address: profileData.address || "",
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

      await updateUserProfile(user!.id!, userProfile);

      await updateMahasiswaProfile(mahasiswaProfile.id, {
        gender: mahasiswaProfile.gender,
        date_of_birth: mahasiswaProfile.date_of_birth,
        address: mahasiswaProfile.address,
      });

      setSuccess("Profil berhasil diperbarui!");

      await invalidateCache(`mahasiswa_profile_${user?.id}`);
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
          <div className="h-24 rounded-3xl bg-blue-100/70" />
          <div className="h-72 rounded-3xl bg-slate-100" />
          <div className="h-72 rounded-3xl bg-slate-100" />
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
        <Alert className="rounded-2xl border-success/30 bg-success/10 dark:border-success/20 dark:bg-success/15">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card className="interactive-card rounded-2xl border border-blue-100/70 bg-white/95 shadow-sm">
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
              <Label htmlFor="phone">No. Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  value={userProfile.phone}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, phone: e.target.value })
                  }
                  placeholder="08xx-xxxx-xxxx"
                  className="border-blue-100 pl-10 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nim">NIM</Label>
              <Input
                id="nim"
                value={mahasiswaProfile.nim}
                disabled
                className="border-blue-100 bg-slate-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-card rounded-2xl border border-blue-100/70 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <GraduationCap className="h-5 w-5 text-blue-700" />
            Informasi Akademik
          </CardTitle>
          <CardDescription>Data akademik Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="program_studi">Program Studi</Label>
              <Input
                id="program_studi"
                value={mahasiswaProfile.program_studi}
                disabled
                className="border-blue-100 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input
                id="angkatan"
                value={mahasiswaProfile.angkatan}
                disabled
                className="border-blue-100 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={mahasiswaProfile.semester}
                disabled
                className="border-blue-100 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <select
                id="gender"
                className="flex h-10 w-full rounded-md border border-blue-100 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={mahasiswaProfile.gender || ""}
                onChange={(e) =>
                  setMahasiswaProfile({
                    ...mahasiswaProfile,
                    gender: (e.target.value as "L" | "P" | "") || null,
                  })
                }
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-card rounded-2xl border border-blue-100/70 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Informasi Pribadi</CardTitle>
          <CardDescription>Tanggal lahir dan alamat Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={mahasiswaProfile.date_of_birth || ""}
                onChange={(e) =>
                  setMahasiswaProfile({
                    ...mahasiswaProfile,
                    date_of_birth: e.target.value,
                  })
                }
                className="border-blue-100 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <textarea
                id="address"
                rows={3}
                className="flex w-full rounded-md border border-blue-100 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={mahasiswaProfile.address || ""}
                onChange={(e) =>
                  setMahasiswaProfile({
                    ...mahasiswaProfile,
                    address: e.target.value,
                  })
                }
                placeholder="Alamat lengkap tempat tinggal"
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
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Batal
        </ButtonEnhanced>
        <ButtonEnhanced
          onClick={handleSave}
          loading={saving}
          loadingText="Menyimpan..."
          className="bg-blue-700 text-white hover:bg-blue-800"
        >
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </ButtonEnhanced>
      </div>
    </div>
  );
}
