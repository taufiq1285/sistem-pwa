/**
 * PresensiPage - Mahasiswa
 * View attendance records and statistics
 */

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI } from "@/lib/offline/api-cache";
import {
  getMahasiswaKehadiran,
  type MahasiswaKehadiranRecord,
  type KehadiranStatus,
} from "@/lib/api/kehadiran.api";
import { toast } from "sonner";

export default function PresensiPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MahasiswaKehadiranRecord[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadPresensi();
    }
  }, [user?.id]);

  const loadPresensi = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // ✅ Check if mahasiswa data exists
      if (!user?.mahasiswa?.id) {
        toast.error("Profil mahasiswa tidak ditemukan");
        return;
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const data = await cacheAPI(
        `mahasiswa_presensi_${user?.mahasiswa?.id}`,
        () => getMahasiswaKehadiran(user.mahasiswa.id),
        {
          ttl: 10 * 60 * 1000, // 10 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setRecords(data);
      console.log("[Presensi] Data loaded:", data.length, "records");
    } catch (error) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - could not load presensi");
        toast.info("Mode offline - menampilkan data tersimpan");
      } else {
        console.error("Error loading presensi:", error);
        toast.error("Gagal memuat data presensi");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = records.length;
    const hadir = records.filter((r) => r.status === "hadir").length;
    const izin = records.filter((r) => r.status === "izin").length;
    const sakit = records.filter((r) => r.status === "sakit").length;
    const alpha = records.filter((r) => r.status === "alpha").length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alpha, persentase };
  };

  const getStatusBadge = (status: KehadiranStatus) => {
    const variants: Record<
      KehadiranStatus,
      { color: string; icon: any; label: string }
    > = {
      hadir: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle2,
        label: "Hadir",
      },
      izin: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: Clock,
        label: "Izin",
      },
      sakit: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: AlertCircle,
        label: "Sakit",
      },
      alpha: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        label: "Alpha",
      },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Memuat data presensi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-extrabold">Presensi Praktikum</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Rekap kehadiran praktikum Anda
        </p>
      </div>

      {/* Summary Stats - Gradient */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-xl bg-linear-to-r from-gray-500 to-gray-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white">
              Total Pertemuan
            </CardTitle>
            <Calendar className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-linear-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white">
              Hadir
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.hadir}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-linear-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white">Izin</CardTitle>
            <Clock className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.izin}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-linear-to-r from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white">
              Sakit
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.sakit}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-linear-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-white">
              Alpha
            </CardTitle>
            <XCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold">{stats.alpha}</div>
          </CardContent>
        </Card>
      </div>

      {/* Persentase Kehadiran */}
      <Card className="border-0 shadow-xl p-6">
        <CardHeader>
          <CardTitle>Persentase Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">
              {stats.persentase}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    stats.persentase >= 75
                      ? "bg-green-600"
                      : stats.persentase >= 50
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }`}
                  style={{ width: `${stats.persentase}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.persentase >= 75
                  ? "Kehadiran Anda sangat baik!"
                  : stats.persentase >= 50
                    ? "Tingkatkan kehadiran Anda"
                    : "Perhatian! Kehadiran di bawah standar"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Presensi */}
      <Card className="border-0 shadow-xl p-6">
        <CardHeader>
          <CardTitle>Riwayat Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <Alert>
              <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              <AlertDescription>
                Belum ada data presensi. Data akan muncul setelah dosen
                melakukan absensi.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(record.jadwal?.tanggal_praktikum || "")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {record.jadwal?.kelas?.mata_kuliah?.nama_mk ||
                              "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {record.jadwal?.kelas?.nama_kelas || "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.jadwal?.topik || "Praktikum"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {record.jadwal?.laboratorium?.nama_lab || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTime(record.jadwal?.jam_mulai || "")} -{" "}
                        {formatTime(record.jadwal?.jam_selesai || "")}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
