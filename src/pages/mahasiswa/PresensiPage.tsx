/**
 * PresensiPage - Mahasiswa
 * View attendance records and statistics
 */

import { useState, useEffect, useMemo } from "react";
import type { ElementType } from "react";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  WifiOff,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import {
  getMahasiswaKehadiran,
  type MahasiswaKehadiranRecord,
  type KehadiranStatus,
} from "@/lib/api/kehadiran.api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PresensiPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MahasiswaKehadiranRecord[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [selectedMataKuliah, setSelectedMataKuliah] =
    useState<string>("__all__");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const presensiCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_presensi_${user.mahasiswa.id}`
    : null;

  useEffect(() => {
    if (user?.id) {
      loadPresensi();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!presensiCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: MahasiswaKehadiranRecord[];
      }>;

      if (customEvent.detail?.key !== presensiCacheKey) {
        return;
      }

      const nextRecords = customEvent.detail?.data;
      if (!Array.isArray(nextRecords)) {
        return;
      }

      setRecords(nextRecords);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [presensiCacheKey]);

  const loadPresensi = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // ✅ Check if mahasiswa data exists
      if (!user?.mahasiswa?.id || !presensiCacheKey) {
        toast.error("Profil mahasiswa tidak ditemukan");
        return;
      }

      const cachedEntry =
        await getCachedData<MahasiswaKehadiranRecord[]>(presensiCacheKey);
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        setRecords(cachedEntry!.data);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedEntry!.timestamp);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan presensi tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data presensi tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const data = await cacheAPI(
        presensiCacheKey,
        () => getMahasiswaKehadiran(user.mahasiswa.id),
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setRecords(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      console.log("[Presensi] Data loaded:", data.length, "records");
    } catch (error: any) {
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - could not load presensi");
        setIsOfflineData(true);
        toast.info(
          error?.message ||
            "Mode offline - menampilkan data presensi tersimpan",
        );
      } else {
        console.error("Error loading presensi:", error);
        if (records.length > 0) {
          setIsOfflineData(true);
        }
        toast.error(error?.message || "Gagal memuat data presensi");
      }
    } finally {
      setLoading(false);
    }
  };

  const getRecordMataKuliahName = (record: MahasiswaKehadiranRecord) =>
    (record as any).nama_mk ||
    record.jadwal?.mata_kuliah?.nama_mk ||
    record.jadwal?.kelas?.mata_kuliah?.nama_mk ||
    "Mata kuliah tidak diketahui";

  const getRecordMataKuliahKode = (record: MahasiswaKehadiranRecord) =>
    (record as any).kode_mk || record.jadwal?.mata_kuliah?.kode_mk || "";

  const getRecordMataKuliahKey = (record: MahasiswaKehadiranRecord) =>
    record.mata_kuliah_id ||
    record.jadwal?.mata_kuliah?.id ||
    `nama:${getRecordMataKuliahName(record)}`;

  const mataKuliahOptions = useMemo(() => {
    const optionMap = new Map<
      string,
      { id: string; nama: string; kode: string; total: number }
    >();

    records.forEach((record) => {
      const id = getRecordMataKuliahKey(record);
      const existing = optionMap.get(id);
      optionMap.set(id, {
        id,
        nama: getRecordMataKuliahName(record),
        kode: getRecordMataKuliahKode(record),
        total: (existing?.total || 0) + 1,
      });
    });

    return Array.from(optionMap.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedMataKuliah === "__all__") {
      return records;
    }

    return records.filter(
      (record) => getRecordMataKuliahKey(record) === selectedMataKuliah,
    );
  }, [records, selectedMataKuliah]);

  const groupedRecords = useMemo(() => {
    const sortedRecords = [...filteredRecords].sort((a, b) => {
      const aDate = a.tanggal || a.jadwal?.tanggal_praktikum || "";
      const bDate = b.tanggal || b.jadwal?.tanggal_praktikum || "";
      return bDate.localeCompare(aDate);
    });

    const groups = new Map<
      string,
      {
        id: string;
        nama: string;
        kode: string;
        total: number;
        hadir: number;
        izin: number;
        sakit: number;
        alpha: number;
        persentase: number;
        records: MahasiswaKehadiranRecord[];
      }
    >();

    sortedRecords.forEach((record) => {
      const id = getRecordMataKuliahKey(record);
      const existing = groups.get(id);

      if (!existing) {
        groups.set(id, {
          id,
          nama: getRecordMataKuliahName(record),
          kode: getRecordMataKuliahKode(record),
          total: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          persentase: 0,
          records: [],
        });
      }

      const group = groups.get(id)!;
      group.records.push(record);
      group.total += 1;
      if (record.status === "hadir") group.hadir += 1;
      if (record.status === "izin") group.izin += 1;
      if (record.status === "sakit") group.sakit += 1;
      if (record.status === "alpha") group.alpha += 1;
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        persentase:
          group.total > 0 ? Math.round((group.hadir / group.total) * 100) : 0,
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [filteredRecords]);

  useEffect(() => {
    if (selectedMataKuliah === "__all__") {
      setExpandedGroups(new Set());
      return;
    }

    setExpandedGroups(new Set([selectedMataKuliah]));
  }, [selectedMataKuliah]);

  const calculateStats = () => {
    const total = filteredRecords.length;
    const hadir = filteredRecords.filter((r) => r.status === "hadir").length;
    const izin = filteredRecords.filter((r) => r.status === "izin").length;
    const sakit = filteredRecords.filter((r) => r.status === "sakit").length;
    const alpha = filteredRecords.filter((r) => r.status === "alpha").length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alpha, persentase };
  };

  const getStatusBadge = (status: KehadiranStatus) => {
    const statusMap: Record<
      KehadiranStatus,
      "success" | "info" | "warning" | "error"
    > = {
      hadir: "success",
      izin: "info",
      sakit: "warning",
      alpha: "error",
    };
    const labels: Record<KehadiranStatus, string> = {
      hadir: "Hadir",
      izin: "Izin",
      sakit: "Sakit",
      alpha: "Alpha",
    };
    const icons: Record<KehadiranStatus, ElementType> = {
      hadir: CheckCircle2,
      izin: Clock,
      sakit: AlertCircle,
      alpha: XCircle,
    };
    const Icon = icons[status];
    return (
      <StatusBadge status={statusMap[status]} pulse={false}>
        <Icon className="h-3 w-3 mr-1" />
        {labels[status]}
      </StatusBadge>
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

  const formatRecordedTime = (dateTimeString?: string | null) => {
    if (!dateTimeString) {
      return "-";
    }

    const date = new Date(dateTimeString);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = calculateStats();
  const selectedMataKuliahInfo = mataKuliahOptions.find(
    (mk) => mk.id === selectedMataKuliah,
  );
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Presensi Kehadiran
                  </h1>
                  <p className="text-muted-foreground">
                    Rekap presensi umum per mata kuliah, kelas, dan tanggal
                    sesuai catatan kehadiran yang dibuat dosen.
                  </p>
                  {(isOfflineData || lastUpdatedLabel) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {isOfflineData && (
                        <span className="inline-flex items-center gap-1 font-medium text-warning">
                          <WifiOff className="h-4 w-4" />
                          Menampilkan presensi tersimpan lokal
                        </span>
                      )}
                      {lastUpdatedLabel && (
                        <span>Update terakhir: {lastUpdatedLabel}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {isOfflineData && (
          <Alert className="border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
            <AlertDescription>
              Halaman presensi tetap bisa dibuka dari cache lokal saat offline.
              Data yang tampil adalah snapshot terakhir yang berhasil disimpan
              dan mungkin belum memuat absensi terbaru.
            </AlertDescription>
          </Alert>
        )}

        {records.length > 0 && (
          <GlassCard
            intensity="low"
            className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
          >
            <CardHeader>
              <CardTitle>Filter Mata Kuliah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-center">
                <Select
                  value={selectedMataKuliah}
                  onValueChange={setSelectedMataKuliah}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      Semua mata kuliah ({records.length} catatan)
                    </SelectItem>
                    {mataKuliahOptions.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.nama}
                        {mk.kode ? ` (${mk.kode})` : ""} - {mk.total} catatan
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {selectedMataKuliah === "__all__"
                    ? "Menampilkan seluruh presensi yang dikelompokkan per mata kuliah. Jika satu tanggal memiliki beberapa mata kuliah, setiap mata kuliah tetap dihitung sebagai catatan terpisah."
                    : `Menampilkan presensi untuk ${
                        selectedMataKuliahInfo?.nama || "mata kuliah aktif"
                      } saja.`}
                </p>
              </div>
            </CardContent>
          </GlassCard>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Catatan Presensi"
            value={stats.total}
            icon={Calendar}
            color="blue"
          />
          <DashboardCard
            title="Hadir"
            value={stats.hadir}
            icon={CheckCircle2}
            color="green"
          />
          <DashboardCard
            title="Izin"
            value={stats.izin}
            icon={Clock}
            color="blue"
          />
          <DashboardCard
            title="Sakit"
            value={stats.sakit}
            icon={AlertCircle}
            color="amber"
          />
          <DashboardCard
            title="Alpha"
            value={stats.alpha}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Persentase Kehadiran */}
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <CardHeader>
            <CardTitle>
              Persentase Kehadiran
              {selectedMataKuliahInfo
                ? ` - ${selectedMataKuliahInfo.nama}`
                : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="text-5xl font-bold text-primary">
                {stats.persentase}%
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      stats.persentase >= 75
                        ? "bg-success"
                        : stats.persentase >= 50
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ width: `${stats.persentase}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.persentase >= 75
                    ? "Kehadiran Anda sangat baik!"
                    : stats.persentase >= 50
                      ? "Tingkatkan kehadiran Anda"
                      : "Perhatian! Kehadiran di bawah standar"}
                </p>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Riwayat Presensi */}
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <CardHeader>
            <CardTitle>Riwayat Presensi</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <Alert className="border-border/60 bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  Belum ada data presensi. Data akan muncul setelah dosen
                  mengisi kehadiran kelas Anda.
                </AlertDescription>
              </Alert>
            ) : filteredRecords.length === 0 ? (
              <Alert className="border-border/60 bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  Belum ada presensi untuk mata kuliah yang dipilih.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {groupedRecords.map((group) => {
                  const isExpanded =
                    expandedGroups.has(group.id) ||
                    selectedMataKuliah !== "__all__";

                  return (
                    <div
                      key={group.id}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-background/70"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full flex-col gap-4 p-4 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <h3 className="truncate text-base font-bold text-foreground sm:text-lg">
                                {group.nama}
                              </h3>
                              {group.kode && (
                                <Badge variant="outline">{group.kode}</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {group.total} pertemuan tercatat •{" "}
                              {group.persentase}% hadir
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              Hadir {group.hadir}
                            </Badge>
                            {group.izin > 0 && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                Izin {group.izin}
                              </Badge>
                            )}
                            {group.sakit > 0 && (
                              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Sakit {group.sakit}
                              </Badge>
                            )}
                            {group.alpha > 0 && (
                              <Badge className="bg-red-50 text-red-700 border-red-200">
                                Alpha {group.alpha}
                              </Badge>
                            )}
                            <span
                              className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground",
                              )}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/60 px-4 pb-4 pt-4">
                          <div className="overflow-hidden rounded-xl border border-border/60">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tanggal</TableHead>
                                  <TableHead>Kelas</TableHead>
                                  <TableHead>Topik/Keterangan</TableHead>
                                  <TableHead>Waktu Dicatat</TableHead>
                                  <TableHead className="text-center">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.records.map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell className="font-medium text-foreground">
                                      {formatDate(
                                        record.tanggal ||
                                          record.jadwal?.tanggal_praktikum ||
                                          "",
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {record.jadwal?.kelas?.nama_kelas ||
                                        (record as any).nama_kelas ||
                                        "-"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {record.keterangan ||
                                        record.jadwal?.topik ||
                                        "Presensi perkuliahan"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {formatRecordedTime(record.created_at)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {getStatusBadge(record.status)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
