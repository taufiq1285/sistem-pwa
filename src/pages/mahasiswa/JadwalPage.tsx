/**
 * Jadwal Page - Mahasiswa (UPDATED)
 * Display schedule for enrolled classes - READ ONLY
 *
 * CHANGES FROM ORIGINAL:
 * ❌ REMOVED: Self-enrollment Button & dialog
 * ❌ REMOVED: "Daftar Kelas" functionality
 * ✅ ADDED: Info banner for clarity
 * ✅ UPDATED: Empty states (no enrollment CTA)
 */

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Info, // ✅ NEW: Info icon for banner
  BookOpen,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"; // ✅ NEW: Alert component
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ❌ REMOVED: EnrollKelasDialog import
import {
  getMyKelas,
  getMyJadwal,
  type MyKelas,
  type JadwalMahasiswa,
} from "@/lib/api/mahasiswa.api";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";

export default function JadwalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myKelas, setMyKelas] = useState<MyKelas[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalMahasiswa[]>([]);
  // ❌ REMOVED: enrollDialogOpen state
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const kelasCacheKey = user?.id ? `mahasiswa_kelas_${user.id}` : null;
  const jadwalCacheKey = user?.id ? `mahasiswa_jadwal_full_${user.id}` : null;

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!kelasCacheKey || !jadwalCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: MyKelas[] | JadwalMahasiswa[];
      }>;

      if (customEvent.detail?.key === kelasCacheKey) {
        const nextKelas = customEvent.detail?.data;
        if (Array.isArray(nextKelas)) {
          setMyKelas(nextKelas as MyKelas[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }

      if (customEvent.detail?.key === jadwalCacheKey) {
        const nextJadwal = customEvent.detail?.data;
        if (Array.isArray(nextJadwal)) {
          setAllJadwal(nextJadwal as JadwalMahasiswa[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [kelasCacheKey, jadwalCacheKey]);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!kelasCacheKey || !jadwalCacheKey) return;

      const [cachedKelasEntry, cachedJadwalEntry] = await Promise.all([
        getCachedData<MyKelas[]>(kelasCacheKey),
        getCachedData<JadwalMahasiswa[]>(jadwalCacheKey),
      ]);

      const hasCachedKelas = Array.isArray(cachedKelasEntry?.data);
      const hasCachedJadwal = Array.isArray(cachedJadwalEntry?.data);
      const hasAnyCachedData = hasCachedKelas || hasCachedJadwal;

      if (hasAnyCachedData) {
        setMyKelas(hasCachedKelas ? cachedKelasEntry!.data : []);
        setAllJadwal(hasCachedJadwal ? cachedJadwalEntry!.data : []);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedKelasEntry?.timestamp || 0,
            cachedJadwalEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasAnyCachedData
            ? "Perangkat sedang offline. Menampilkan jadwal tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada jadwal tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const [kelasData, jadwalData] = await Promise.all([
        cacheAPI(kelasCacheKey, () => getMyKelas(), {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(jadwalCacheKey, () => getMyJadwal(50), {
          ttl: 5 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);

      setMyKelas(kelasData);
      setAllJadwal(jadwalData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      console.log("[JadwalPage] Data loaded:", jadwalData.length, "jadwal");
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (myKelas.length > 0 || allJadwal.length > 0 || !navigator.onLine) {
        setIsOfflineData(true);
      }
      toast.error(error?.message || "Gagal memuat data jadwal");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Group jadwal by date
  const groupedJadwal = allJadwal.reduce(
    (acc, jadwal) => {
      const date = jadwal.tanggal_praktikum;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(jadwal);
      return acc;
    },
    {} as Record<string, JadwalMahasiswa[]>,
  );

  const sortedDates = Object.keys(groupedJadwal).sort();

  // Get today's jadwal
  const today = new Date().toISOString().split("T")[0];
  const todayJadwal = groupedJadwal[today] || [];

  // Get upcoming jadwal (excluding today)
  const upcomingDates = sortedDates.filter((date) => date > today);

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
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-card"
        >
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  Jadwal Praktikum
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Lihat jadwal praktikum untuk semua kelas yang Anda ikuti
                </p>
                {(isOfflineData || lastUpdatedLabel) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {isOfflineData && (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <WifiOff className="h-4 w-4" />
                        Menampilkan jadwal tersimpan lokal
                      </span>
                    )}
                    {lastUpdatedLabel && (
                      <span>Update terakhir: {lastUpdatedLabel}</span>
                    )}
                  </div>
                )}
              </div>
              {/* ❌ REMOVED: Daftar Kelas Button */}
            </div>
          </CardContent>
        </GlassCard>

        {isOfflineData && (
          <Alert className="border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
            <AlertDescription>
              Halaman jadwal tetap bisa dibuka dari cache lokal saat offline. Data yang tampil adalah snapshot terakhir yang berhasil disimpan dan mungkin belum mencerminkan perubahan jadwal terbaru.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {myKelas.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Kelas"
              value={myKelas.length}
              icon={BookOpen}
              color="blue"
            />
            <DashboardCard
              title="Hari Ini"
              value={todayJadwal.length}
              icon={Calendar}
              color="green"
            />
            <DashboardCard
              title="Mendatang"
              value={upcomingDates.length}
              icon={Clock}
              color="purple"
            />
            <DashboardCard
              title="Total Jadwal"
              value={allJadwal.length}
              icon={AlertCircle}
              color="amber"
            />
          </div>
        )}

        {/* ✅ NEW: Info Banner */}
        <GlassCard
          intensity="low"
          className="border-primary/20 bg-primary/5 shadow-sm dark:border-primary/20 dark:bg-primary/10"
        >
          <CardContent className="p-4 sm:p-5">
            <Alert className="border-0 bg-transparent p-0 shadow-none">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary dark:text-primary/80">
                Jadwal praktikum diatur oleh dosen pengampu kelas Anda. Jika ada
                pertanyaan terkait jadwal, silakan hubungi dosen yang
                bersangkutan.
              </AlertDescription>
            </Alert>
          </CardContent>
        </GlassCard>

        {/* ✅ UPDATED: Empty State (No Enrollment CTA) */}
        {myKelas.length === 0 && (
          <GlassCard
            intensity="low"
            className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-card"
          >
            <CardContent className="p-12">
              <div className="text-center">
                <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground/40" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Belum Ada Jadwal Praktikum
                </h3>
                <p className="mx-auto max-w-md text-muted-foreground">
                  Anda belum terdaftar di kelas praktikum manapun. Hubungi dosen
                  pengampu atau koordinator program studi untuk informasi
                  pendaftaran kelas.
                </p>
                {/* ❌ REMOVED: Daftar Kelas Button */}
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Has Classes - Tabs */}
        {myKelas.length > 0 && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl bg-muted/60 p-1 sm:grid-cols-3">
              <TabsTrigger value="upcoming" className="rounded-xl">
                Jadwal Mendatang ({upcomingDates.length})
              </TabsTrigger>
              <TabsTrigger value="today" className="rounded-xl">
                Hari Ini ({todayJadwal.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-xl">
                Semua ({allJadwal.length})
              </TabsTrigger>
            </TabsList>

            {/* Today's Schedule */}
            <TabsContent value="today" className="space-y-4">
              {todayJadwal.length === 0 ? (
                <GlassCard
                  intensity="low"
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-card"
                >
                  <CardContent className="p-6">
                    <div className="py-6 text-center">
                      <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground">
                        Tidak ada jadwal praktikum hari ini
                      </p>
                    </div>
                  </CardContent>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {todayJadwal.map((jadwal) => (
                    <GlassCard
                      key={jadwal.id}
                      intensity="low"
                      className="border-success/30 bg-success/5 dark:border-success/20 dark:bg-success/10"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="w-16 h-16 bg-success/10 rounded-lg flex flex-col items-center justify-center">
                              <Clock className="h-5 w-5 text-success mb-1" />
                              <span className="text-xs font-medium text-success">
                                {formatTime(jadwal.jam_mulai)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {jadwal.mata_kuliah_nama}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {jadwal.kelas_nama}
                            </p>
                            {jadwal.topik && (
                              <p className="text-sm text-muted-foreground mb-2">
                                📝 {jadwal.topik}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(jadwal.jam_mulai)} -{" "}
                                {formatTime(jadwal.jam_selesai)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {jadwal.lab_nama}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </GlassCard>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Schedule */}
            <TabsContent value="upcoming" className="space-y-6">
              {upcomingDates.length === 0 ? (
                <GlassCard
                  intensity="low"
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-card"
                >
                  <CardContent className="p-6">
                    <div className="py-6 text-center">
                      <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground">
                        Tidak ada jadwal praktikum mendatang
                      </p>
                    </div>
                  </CardContent>
                </GlassCard>
              ) : (
                upcomingDates.map((date) => (
                  <div key={date}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-3">
                      {groupedJadwal[date].map((jadwal) => (
                        <GlassCard
                          key={jadwal.id}
                          intensity="low"
                          className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-card"
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="shrink-0">
                                <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                                  <Clock className="h-5 w-5 text-primary mb-1" />
                                  <span className="text-xs font-medium text-primary">
                                    {formatTime(jadwal.jam_mulai)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {jadwal.mata_kuliah_nama}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {jadwal.kelas_nama}
                                </p>
                                {jadwal.topik && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    📝 {jadwal.topik}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(jadwal.jam_mulai)} -{" "}
                                    {formatTime(jadwal.jam_selesai)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {jadwal.lab_nama}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </GlassCard>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* All Schedule */}
            <TabsContent value="all" className="space-y-6">
              {sortedDates.length === 0 ? (
                <GlassCard
                  intensity="low"
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-card"
                >
                  <CardContent className="p-6">
                    <div className="py-6 text-center">
                      <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground">
                        Belum ada jadwal praktikum
                      </p>
                    </div>
                  </CardContent>
                </GlassCard>
              ) : (
                sortedDates.map((date) => {
                  const isToday = date === today;
                  return (
                    <div key={date}>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {formatDate(date)}
                        {isToday && (
                          <StatusBadge status="success" pulse>
                            Hari Ini
                          </StatusBadge>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {groupedJadwal[date].map((jadwal) => (
                          <GlassCard
                            key={jadwal.id}
                            intensity="low"
                            className={
                              isToday
                                ? "border-success/30 bg-success/5 dark:border-success/20 dark:bg-success/10"
                                : "border-border/40 bg-white/90 shadow-lg dark:bg-card"
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className="/* shrink-0 */">
                                  <div
                                    className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${
                                      isToday ? "bg-success/10" : "bg-primary/10"
                                    }`}
                                  >
                                    <Clock
                                      className={`h-5 w-5 mb-1 ${
                                        isToday
                                          ? "text-success"
                                    : "text-primary"
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-medium ${
                                        isToday
                                    ? "text-success"
                                    : "text-primary"
                                      }`}
                                    >
                                      {formatTime(jadwal.jam_mulai)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {jadwal.mata_kuliah_nama}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {jadwal.kelas_nama}
                                  </p>
                                  {jadwal.topik && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      📝 {jadwal.topik}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {formatTime(jadwal.jam_mulai)} -{" "}
                                      {formatTime(jadwal.jam_selesai)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {jadwal.lab_nama}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* ❌ REMOVED: Kelas yang Diikuti card
            Reason: Redundant and not relevant to jadwal viewing
            - Page is focused on schedule (when/where)
            - Kelas list is not needed here
            - User already knows which kelas they're enrolled in
            - If needed, this info belongs in Dashboard or Profile
        */}
      </div>

      {/* ❌ REMOVED: EnrollKelasDialog component */}
    </div>
  );
}
