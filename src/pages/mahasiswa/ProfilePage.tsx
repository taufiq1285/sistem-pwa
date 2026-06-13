/**
 * Mahasiswa Profile Page
 * Menampilkan dan mengedit profil mahasiswa
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
} from "@/lib/offline/api-cache";
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
  WifiOff,
} from "lucide-react";
import { FormSkeleton } from "@/components/common";

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

/** Raw shape returned from the API / cache before mapping into local state */
interface MahasiswaProfileRaw {
  id?: string;
  nim?: string;
  program_studi?: string;
  angkatan?: number;
  semester?: number;
  gender?: "L" | "P" | null;
  date_of_birth?: string;
  address?: string;
  users?: { full_name?: string; email?: string };
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
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

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

  const profileCacheKey = user?.id ? `mahasiswa_profile_${user.id}` : null;

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!profileCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: MahasiswaProfileRaw;
      }>;

      if (
        customEvent.detail?.key !== profileCacheKey ||
        !customEvent.detail?.data
      ) {
        return;
      }

      const profileData = customEvent.detail.data;
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

      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    };

    window.addEventListener("cache:updated", handleCacheUpdated);
    return () =>
      window.removeEventListener("cache:updated", handleCacheUpdated);
  }, [profileCacheKey]);

  const fetchProfile = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      if (!profileCacheKey) {
        return;
      }

      const cachedProfileEntry =
        await getCachedData<MahasiswaProfileRaw>(profileCacheKey);
      const cachedProfile = cachedProfileEntry?.data;

      if (cachedProfile) {
        setUserProfile({
          full_name: cachedProfile.users?.full_name || "",
          email: cachedProfile.users?.email || "",
          phone: "",
        });

        setMahasiswaProfile({
          id: cachedProfile.id || "",
          nim: cachedProfile.nim || "",
          program_studi: cachedProfile.program_studi || "",
          angkatan: cachedProfile.angkatan || new Date().getFullYear(),
          semester: cachedProfile.semester || 1,
          gender: cachedProfile.gender || null,
          date_of_birth: cachedProfile.date_of_birth || "",
          address: cachedProfile.address || "",
        });

        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedProfileEntry?.timestamp || null);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          cachedProfile
            ? "Perangkat sedang offline. Menampilkan profil tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada profil tersimpan.",
        );
      }

      const profileData = await cacheAPI(
        profileCacheKey,
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

        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Gagal memuat profil");
      if (!navigator.onLine) {
        setIsOfflineData(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!navigator.onLine) {
        setError(
          "Perubahan profil belum didukung penuh saat offline. Sambungkan internet untuk menyimpan perubahan.",
        );
        return;
      }

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

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

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

      {(isOfflineData || lastUpdatedLabel) && (
        <Alert className="rounded-2xl border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            {isOfflineData
              ? "Profil ditampilkan dari cache lokal. Perubahan data profil masih memerlukan koneksi internet."
              : "Data profil lokal tersedia sebagai fallback offline."}
            {lastUpdatedLabel ? ` Update terakhir: ${lastUpdatedLabel}.` : ""}
          </AlertDescription>
        </Alert>
      )}

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
              <Label htmlFor="phone">No. Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={userProfile.phone}
                  onChange={(e) =>
                    setUserProfile({ ...userProfile, phone: e.target.value })
                  }
                  placeholder="08xx-xxxx-xxxx"
                  className="border-border/50 pl-10 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nim">NIM</Label>
              <Input
                id="nim"
                value={mahasiswaProfile.nim}
                disabled
                className="border-border/50 bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-card rounded-2xl border border-border/60 bg-white/95 shadow-sm dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
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
                className="border-border/50 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
              <Input
                id="angkatan"
                value={mahasiswaProfile.angkatan}
                disabled
                className="border-border/50 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={mahasiswaProfile.semester}
                disabled
                className="border-border/50 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <select
                id="gender"
                className="flex h-11 w-full cursor-pointer rounded-lg border border-border/50 bg-background px-3.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:shadow-sm"
                value={mahasiswaProfile.gender || ""}
                onChange={(e) =>
                  setMahasiswaProfile({
                    ...mahasiswaProfile,
                    gender: (e.target.value as "L" | "P" | "") || null,
                  })
                }
              >
                <option value="" className="text-muted-foreground">
                  Pilih jenis kelamin
                </option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="interactive-card rounded-2xl border border-border/60 bg-white/95 shadow-sm dark:bg-card">
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
                className="border-border/50 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <textarea
                id="address"
                rows={3}
                className="flex min-h-[5rem] w-full rounded-lg border border-border/50 bg-transparent px-3.5 py-3 text-sm shadow-xs placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:shadow-sm outline-none transition-[color,box-shadow] resize-none"
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
          className="border-primary/30 text-primary hover:bg-primary/5"
        >
          Batal
        </ButtonEnhanced>
        <ButtonEnhanced
          onClick={handleSave}
          loading={saving}
          loadingText="Menyimpan..."
          disabled={!navigator.onLine}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </ButtonEnhanced>
      </div>
    </div>
  );
}
