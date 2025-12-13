/**
 * Mahasiswa Profile Page
 * Menampilkan dan mengedit profil mahasiswa
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
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
  GraduationCap,
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", user?.id!)
        .single();

      if (userError) throw userError;

      // Get mahasiswa data
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .select("*")
        .eq("user_id", user?.id!)
        .single();

      if (mahasiswaError) throw mahasiswaError;

      if (userData) {
        setUserProfile({
          full_name: userData?.full_name || "",
          email: userData?.email || "",
          phone: "",
        });
      }

      if (mahasiswaData) {
        setMahasiswaProfile({
          id: mahasiswaData?.id || "",
          nim: mahasiswaData?.nim || "",
          program_studi: mahasiswaData?.program_studi || "",
          angkatan: mahasiswaData?.angkatan || new Date().getFullYear(),
          semester: mahasiswaData?.semester || 1,
          gender: (mahasiswaData?.gender as "L" | "P" | null) || null,
          date_of_birth: mahasiswaData?.date_of_birth || "",
          address: mahasiswaData?.address || "",
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

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: userProfile.full_name,
        })
        .eq("id", user?.id!);

      if (userError) throw userError;

      // Update mahasiswa table
      const { error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .update({
          gender: mahasiswaProfile.gender,
          date_of_birth: mahasiswaProfile.date_of_birth,
          address: mahasiswaProfile.address,
        })
        .eq("user_id", user?.id!);

      if (mahasiswaError) throw mahasiswaError;

      setSuccess("Profil berhasil diperbarui!");

      // Refresh profile
      await fetchProfile();
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
            <div className="h-96 bg-gray-200 rounded"></div>
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
        <Card>
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
                <Label htmlFor="phone">No. Telepon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, phone: e.target.value })
                    }
                    placeholder="08xx-xxxx-xxxx"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nim">NIM</Label>
                <Input
                  id="nim"
                  value={mahasiswaProfile.nim}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Informasi Akademik
            </CardTitle>
            <CardDescription>
              Data akademik Anda (tidak dapat diubah)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="program_studi">Program Studi</Label>
                <Input
                  id="program_studi"
                  value={mahasiswaProfile.program_studi}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="angkatan">Angkatan</Label>
                <Input
                  id="angkatan"
                  value={mahasiswaProfile.angkatan}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={mahasiswaProfile.semester}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={mahasiswaProfile.gender || ""}
                  onChange={(e) =>
                    setMahasiswaProfile({
                      ...mahasiswaProfile,
                      gender: (e.target.value as "L" | "P" | null) || null,
                    })
                  }
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
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
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <textarea
                  id="address"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={fetchProfile} disabled={saving}>
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
