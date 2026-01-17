/**
 * Laboran Profile Page
 * Menampilkan dan mengedit profil laboran
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
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

interface LaboranProfile {
  id: string;
  nip: string;
  shift?: string;
}

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
    nip: "",
    shift: "",
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

      if (!user?.id) return;

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Get laboran data
      const { data: laboranData, error: laboranError } = await supabase
        .from("laboran")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (laboranError) throw laboranError;

      if (userData) {
        setUserProfile({
          full_name: userData.full_name || "",
          email: userData.email || "",
        });
      }

      if (laboranData) {
        setLaboranProfile({
          id: laboranData.id,
          nip: laboranData.nip || "",
          shift: laboranData.shift || "",
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

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: userProfile.full_name,
        })
        .eq("id", user.id);

      if (userError) throw userError;

      // Update laboran table
      const { error: laboranError } = await supabase
        .from("laboran")
        .update({
          shift: laboranProfile.shift,
        })
        .eq("user_id", user.id);

      if (laboranError) throw laboranError;

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
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={laboranProfile.nip}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pekerjaan</CardTitle>
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
