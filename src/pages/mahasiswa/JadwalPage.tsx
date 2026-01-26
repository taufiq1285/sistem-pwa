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
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"; // ✅ NEW: Alert component
import { Badge } from "@/components/ui/badge";
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
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold">Jadwal Praktikum</h1>
            <p className="text-gray-500 mt-1">
              Lihat jadwal praktikum untuk semua kelas yang Anda ikuti
            </p>
          </div>
          {/* ❌ REMOVED: Daftar Kelas Button */}
        </div>

        {/* ✅ NEW: Info Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Jadwal praktikum diatur oleh dosen pengampu kelas Anda. Jika ada
            pertanyaan terkait jadwal, silakan hubungi dosen yang bersangkutan.
          </AlertDescription>
        </Alert>

        {/* ✅ UPDATED: Empty State (No Enrollment CTA) */}
        {myKelas.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-xl mb-2 text-gray-900">
                  Belum Ada Jadwal Praktikum
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Anda belum terdaftar di kelas praktikum manapun. Hubungi dosen
                  pengampu atau koordinator program studi untuk informasi
                  pendaftaran kelas.
                </p>
                {/* ❌ REMOVED: Daftar Kelas Button */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Has Classes - Tabs */}
        {myKelas.length > 0 && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="upcoming">
                Jadwal Mendatang ({upcomingDates.length})
              </TabsTrigger>
              <TabsTrigger value="today">
                Hari Ini ({todayJadwal.length})
              </TabsTrigger>
              <TabsTrigger value="all">Semua ({allJadwal.length})</TabsTrigger>
            </TabsList>

            {/* Today's Schedule */}
            <TabsContent value="today" className="space-y-4">
              {todayJadwal.length === 0 ? (
                <Card className="border-0 shadow-xl p-6">
                  <CardContent className="p-6">
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        Tidak ada jadwal praktikum hari ini
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todayJadwal.map((jadwal) => (
                    <Card
                      key={jadwal.id}
                      className="border-green-200 bg-green-50/30"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
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
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Upcoming Schedule */}
            <TabsContent value="upcoming" className="space-y-6">
              {upcomingDates.length === 0 ? (
                <Card className="border-0 shadow-xl p-6">
                  <CardContent className="p-6">
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        Tidak ada jadwal praktikum mendatang
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                upcomingDates.map((date) => (
                  <div key={date}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-3">
                      {groupedJadwal[date].map((jadwal) => (
                        <Card key={jadwal.id}>
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="flex-shrink-0">
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
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* All Schedule */}
            <TabsContent value="all" className="space-y-6">
              {sortedDates.length === 0 ? (
                <Card className="border-0 shadow-xl p-6">
                  <CardContent className="p-6">
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        Belum ada jadwal praktikum
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                          <Card
                            key={jadwal.id}
                            className={
                              isToday ? "border-green-200 bg-green-50/30" : ""
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
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
                          </Card>
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
