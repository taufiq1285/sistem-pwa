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

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  MapPin,
  Info, // ✅ NEW: Info icon for banner
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"; // ✅ NEW: Alert component
import { Badge } from "@/components/ui/badge";
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
import { cacheAPI } from "@/lib/offline/api-cache";

export default function JadwalPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myKelas, setMyKelas] = useState<MyKelas[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalMahasiswa[]>([]);
  // ❌ REMOVED: enrollDialogOpen state
  const [selectedTab, setSelectedTab] = useState("upcoming");

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Use cacheAPI with stale-while-revalidate for offline support
      const [kelasData, jadwalData] = await Promise.all([
        cacheAPI(`mahasiswa_kelas_${user?.id}`, () => getMyKelas(), {
          ttl: 10 * 60 * 1000, // 10 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(`mahasiswa_jadwal_full_${user?.id}`, () => getMyJadwal(50), {
          ttl: 5 * 60 * 1000, // 5 minutes (schedule changes frequently)
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);

      setMyKelas(kelasData);
      setAllJadwal(jadwalData);
      console.log("[JadwalPage] Data loaded:", jadwalData.length, "jadwal");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data jadwal");
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
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-slate-900/80"
        >
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Jadwal Praktikum
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Lihat jadwal praktikum untuk semua kelas yang Anda ikuti
                </p>
              </div>
              {/* ❌ REMOVED: Daftar Kelas Button */}
            </div>
          </CardContent>
        </GlassCard>

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
          className="border-blue-200/70 bg-blue-50/80 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30"
        >
          <CardContent className="p-4 sm:p-5">
            <Alert className="border-0 bg-transparent p-0 shadow-none">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
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
            className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
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
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
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
                      className="border-green-200/70 bg-green-50/70 dark:border-green-900/40 dark:bg-green-950/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="w-16 h-16 bg-green-100 rounded-lg flex flex-col items-center justify-center">
                              <Clock className="h-5 w-5 text-green-600 mb-1" />
                              <span className="text-xs font-medium text-green-700">
                                {formatTime(jadwal.jam_mulai)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {jadwal.mata_kuliah_nama}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {jadwal.kelas_nama}
                            </p>
                            {jadwal.topik && (
                              <p className="text-sm text-gray-700 mb-2">
                                📝 {jadwal.topik}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
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
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
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
                          className="border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="shrink-0">
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                                  <Clock className="h-5 w-5 text-blue-600 mb-1" />
                                  <span className="text-xs font-medium text-blue-700">
                                    {formatTime(jadwal.jam_mulai)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {jadwal.mata_kuliah_nama}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {jadwal.kelas_nama}
                                </p>
                                {jadwal.topik && (
                                  <p className="text-sm text-gray-700 mb-2">
                                    📝 {jadwal.topik}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                  className="border-white/40 bg-white/90 p-6 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
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
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Hari Ini
                          </Badge>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {groupedJadwal[date].map((jadwal) => (
                          <GlassCard
                            key={jadwal.id}
                            intensity="low"
                            className={
                              isToday
                                ? "border-green-200/70 bg-green-50/70 dark:border-green-900/40 dark:bg-green-950/20"
                                : "border-white/40 bg-white/90 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className="/* shrink-0 */">
                                  <div
                                    className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${
                                      isToday ? "bg-green-100" : "bg-blue-100"
                                    }`}
                                  >
                                    <Clock
                                      className={`h-5 w-5 mb-1 ${
                                        isToday
                                          ? "text-green-600"
                                          : "text-blue-600"
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-medium ${
                                        isToday
                                          ? "text-green-700"
                                          : "text-blue-700"
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
                                  <p className="text-sm text-gray-600 mb-2">
                                    {jadwal.kelas_nama}
                                  </p>
                                  {jadwal.topik && (
                                    <p className="text-sm text-gray-700 mb-2">
                                      📝 {jadwal.topik}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
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
