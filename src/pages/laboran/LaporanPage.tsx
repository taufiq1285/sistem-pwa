/**
 * Laporan (Reports & Analytics) Page for Laboran
 *
 * Comprehensive reports and analytics dashboard with 5-tab interface.
 * Provides detailed statistics and insights into borrowing, equipment, labs, and activities.
 *
 * Features:
 * - Overview Tab: Borrowing stats, equipment status, lab usage
 * - Borrowing Tab: Top borrowed equipment with ranking
 * - Equipment Tab: Equipment overview and inventory status
 * - Labs Tab: Laboratory utilization analysis
 * - Activities Tab: Recent activities timeline
 * - CSV export functionality for reports
 * - Refresh data functionality
 * - Color-coded badges and utilization percentages
 */

import { useState, useEffect } from "react";
import {
  BarChart3,
  Package,
  Building2,
  Activity,
  RefreshCw,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Award,
  AlertTriangle,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getBorrowingStats,
  getEquipmentStats,
  getLabUsageStats,
  getTopBorrowedItems,
  getLabUtilization,
  getRecentActivities,
  type BorrowingStats,
  type EquipmentStats,
  type LabUsageStats,
  type TopBorrowedItem,
  type LabUtilization,
  type RecentActivity,
} from "@/lib/api/reports.api";

export default function LaporanPage() {
  // State for statistics
  const [borrowingStats, setBorrowingStats] = useState<BorrowingStats | null>(
    null,
  );
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(
    null,
  );
  const [labStats, setLabStats] = useState<LabUsageStats | null>(null);
  const [topBorrowed, setTopBorrowed] = useState<TopBorrowedItem[]>([]);
  const [labUtilization, setLabUtilization] = useState<LabUtilization[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );

  // Loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingBorrowing, setLoadingBorrowing] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Load all statistics data
   */
  const loadAllData = async () => {
    await Promise.all([
      loadOverviewData(),
      loadBorrowingData(),
      loadEquipmentData(),
      loadLabsData(),
      loadActivitiesData(),
    ]);
  };

  /**
   * Load overview tab data
   */
  const loadOverviewData = async () => {
    setLoadingOverview(true);
    try {
      const [borrowing, equipment, labs] = await Promise.all([
        getBorrowingStats(),
        getEquipmentStats(),
        getLabUsageStats(),
      ]);
      setBorrowingStats(borrowing);
      setEquipmentStats(equipment);
      setLabStats(labs);
    } catch (error) {
      console.error("Failed to load overview data:", error);
      toast.error("Gagal memuat data overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  /**
   * Load borrowing tab data
   */
  const loadBorrowingData = async () => {
    setLoadingBorrowing(true);
    try {
      const data = await getTopBorrowedItems(10);
      setTopBorrowed(data);
    } catch (error) {
      console.error("Failed to load borrowing data:", error);
      toast.error("Gagal memuat data peminjaman");
    } finally {
      setLoadingBorrowing(false);
    }
  };

  /**
   * Load equipment tab data
   */
  const loadEquipmentData = async () => {
    setLoadingEquipment(true);
    try {
      const data = await getEquipmentStats();
      setEquipmentStats(data);
    } catch (error) {
      console.error("Failed to load equipment data:", error);
      toast.error("Gagal memuat data inventaris");
    } finally {
      setLoadingEquipment(false);
    }
  };

  /**
   * Load labs tab data
   */
  const loadLabsData = async () => {
    setLoadingLabs(true);
    try {
      const data = await getLabUtilization();
      setLabUtilization(data);
    } catch (error) {
      console.error("Failed to load labs data:", error);
      toast.error("Gagal memuat data laboratorium");
    } finally {
      setLoadingLabs(false);
    }
  };

  /**
   * Load activities tab data
   */
  const loadActivitiesData = async () => {
    setLoadingActivities(true);
    try {
      const data = await getRecentActivities(15);
      setRecentActivities(data);
    } catch (error) {
      console.error("Failed to load activities data:", error);
      toast.error("Gagal memuat data aktivitas");
    } finally {
      setLoadingActivities(false);
    }
  };

  /**
   * Refresh all data
   */
  const handleRefresh = async () => {
    toast.info("Memuat ulang data...");
    await loadAllData();
    toast.success("Data berhasil dimuat ulang");
  };

  /**
   * Export data to CSV
   */
  const exportToCSV = (
    data: unknown[],
    filename: string,
    columns: { key: string; header: string }[],
  ) => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Create CSV headers
    const headers = columns.map((col) => col.header).join(",");

    // Create CSV rows
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = (row as Record<string, unknown>)[col.key];
          // Escape commas and quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    // Combine headers and rows
    const csv = [headers, ...rows].join("\n");

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("File CSV berhasil diunduh");
  };

  /**
   * Export top borrowed items
   */
  const exportTopBorrowed = () => {
    exportToCSV(topBorrowed, "top-borrowed-equipment", [
      { key: "inventaris_id", header: "inventaris_id" },
      { key: "kode_barang", header: "kode_barang" },
      { key: "nama_barang", header: "nama_barang" },
      { key: "kategori", header: "kategori" },
      { key: "total_borrowed", header: "total_borrowed" },
      { key: "times_borrowed", header: "times_borrowed" },
    ]);
  };

  /**
   * Export lab utilization
   */
  const exportLabUtilization = () => {
    exportToCSV(labUtilization, "lab-utilization", [
      { key: "laboratorium_id", header: "laboratorium_id" },
      { key: "kode_lab", header: "kode_lab" },
      { key: "nama_lab", header: "nama_lab" },
      { key: "total_schedules", header: "total_schedules" },
      { key: "total_hours", header: "total_hours" },
      { key: "utilization_percentage", header: "utilization_percentage" },
    ]);
  };

  /**
   * Get utilization badge status based on percentage
   */
  const getUtilizationStatus = (
    percentage: number,
  ): "error" | "success" | "offline" => {
    if (percentage > 75) return "error"; // Red: overutilized
    if (percentage >= 50) return "success"; // Green: well-utilized
    return "offline"; // Gray: underutilized
  };

  /**
   * Get activity icon based on type
   */
  const getActivityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "borrowing":
        return <Package className="h-4 w-4" />;
      case "return":
        return <RotateCcw className="h-4 w-4" />;
      case "approval":
        return <CheckCircle className="h-4 w-4" />;
      case "rejection":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  /**
   * Get ranking badge for top borrowed items
   */
  const getRankingBadge = (index: number) => {
    if (index === 0) {
      return (
        <StatusBadge status="warning" pulse={false}>
          <Award className="h-3 w-3 mr-1" />
          #1
        </StatusBadge>
      );
    }
    if (index === 1) {
      return (
        <StatusBadge status="offline" pulse={false}>
          <Award className="h-3 w-3 mr-1" />
          #2
        </StatusBadge>
      );
    }
    if (index === 2) {
      return (
        <StatusBadge status="info" pulse={false}>
          <Award className="h-3 w-3 mr-1" />
          #3
        </StatusBadge>
      );
    }
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  /**
   * Format timestamp to Indonesian locale
   */
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header with Refresh Button */}
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Laporan & Analitik
                  </h1>
                  <p className="text-muted-foreground">
                    Statistik dan laporan lengkap sistem laboratorium.
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Muat Ulang Data
            </Button>
          </div>
        </GlassCard>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 md:grid-cols-5">
            <TabsTrigger value="overview" className="gap-2 rounded-xl">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="borrowing" className="gap-2 rounded-xl">
              <TrendingUp className="h-4 w-4" />
              Peminjaman
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-2 rounded-xl">
              <Package className="h-4 w-4" />
              Inventaris
            </TabsTrigger>
            <TabsTrigger value="labs" className="gap-2 rounded-xl">
              <Building2 className="h-4 w-4" />
              Laboratorium
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2 rounded-xl">
              <Activity className="h-4 w-4" />
              Aktivitas
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            {loadingOverview ? (
              <DashboardSkeleton />
            ) : (
              <>
                {/* Borrowing Statistics Cards */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      Statistik Peminjaman
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ringkasan status peminjaman terbaru untuk laboratorium.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <DashboardCard
                      title="Total Peminjaman"
                      value={borrowingStats?.total_borrowings || 0}
                      icon={Package}
                      color="info"
                    />
                    <DashboardCard
                      title="Menunggu Persetujuan"
                      value={borrowingStats?.pending || 0}
                      icon={Clock}
                      color="warning"
                    />
                    <DashboardCard
                      title="Disetujui"
                      value={borrowingStats?.approved || 0}
                      icon={CheckCircle}
                      color="success"
                    />
                    <DashboardCard
                      title="Dikembalikan"
                      value={borrowingStats?.returned || 0}
                      icon={RotateCcw}
                      color="accent"
                    />
                  </div>
                </div>

                <Separator />

                {/* Equipment Status Card */}
                <div>
                  <h2 className="mb-4 text-xl font-semibold">
                    Status Inventaris
                  </h2>
                  <GlassCard
                    intensity="low"
                    className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Status Inventaris Peralatan
                      </CardTitle>
                      <CardDescription>
                        Ringkasan kondisi inventaris laboratorium
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Item
                          </p>
                          <p className="text-4xl font-extrabold">
                            {equipmentStats?.total_items || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Tersedia
                          </p>
                          <p className="text-4xl font-extrabold text-success">
                            {equipmentStats?.available || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Sedang Dipinjam
                          </p>
                          <p className="text-4xl font-extrabold text-primary">
                            {equipmentStats?.borrowed || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-danger" />
                            Stok Rendah
                          </p>
                          <p className="text-4xl font-extrabold text-danger">
                            {equipmentStats?.low_stock || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {"< 5 item"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PackageOpen className="h-4 w-4 text-danger" />
                            Habis
                          </p>
                          <p className="text-4xl font-extrabold text-danger">
                            {equipmentStats?.out_of_stock || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stok 0
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Kategori
                          </p>
                          <p className="text-4xl font-extrabold">
                            {equipmentStats?.total_categories || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </GlassCard>
                </div>

                <Separator />

                {/* Laboratory Usage Card */}
                <div>
                  <h2 className="mb-4 text-xl font-semibold">
                    Penggunaan Laboratorium
                  </h2>
                  <GlassCard
                    intensity="low"
                    className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Status Laboratorium
                      </CardTitle>
                      <CardDescription>
                        Ringkasan penggunaan dan penjadwalan laboratorium
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Laboratorium
                          </p>
                          <p className="text-4xl font-extrabold">
                            {labStats?.total_labs || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Jadwal Aktif
                          </p>
                          <p className="text-4xl font-extrabold text-success">
                            {labStats?.active_schedules || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Booking Disetujui
                          </p>
                          <p className="text-4xl font-extrabold text-primary">
                            {labStats?.approved_bookings || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Booking Pending
                          </p>
                          <p className="text-4xl font-extrabold text-warning">
                            {labStats?.pending_bookings || 0}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Kapasitas
                          </p>
                          <p className="text-4xl font-extrabold">
                            {labStats?.total_capacity || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Mahasiswa
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </GlassCard>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 2: Borrowing */}
          <TabsContent value="borrowing" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Peralatan Paling Sering Dipinjam
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top 10 peralatan berdasarkan frekuensi peminjaman
                </p>
              </div>
              <Button
                onClick={exportTopBorrowed}
                variant="outline"
                disabled={topBorrowed.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Ekspor CSV
              </Button>
            </div>

            {loadingBorrowing ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : topBorrowed.length === 0 ? (
              <Card className="border-0 shadow-xl p-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada data peminjaman
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-25">Ranking</TableHead>
                      <TableHead>Kode Barang</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Frekuensi</TableHead>
                      <TableHead className="text-right">
                        Total Dipinjam
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topBorrowed.map((item, index) => (
                      <TableRow key={item.inventaris_id}>
                        <TableCell>{getRankingBadge(index)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.kode_barang}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.nama_barang}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.kategori}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.times_borrowed}x
                        </TableCell>
                        <TableCell className="text-right">
                          {item.total_borrowed} unit
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Equipment */}
          <TabsContent value="equipment" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Overview Inventaris
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ringkasan kondisi dan status inventaris peralatan
              </p>
            </div>

            {loadingEquipment ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-0 shadow-xl p-6">
                  <CardHeader>
                    <CardDescription>Total Item</CardDescription>
                    <CardTitle className="text-3xl">
                      {equipmentStats?.total_items || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-success">
                        {equipmentStats?.available || 0}
                      </span>{" "}
                      tersedia
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl p-6">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      Stok Rendah
                    </CardDescription>
                    <CardTitle className="text-3xl text-danger">
                      {equipmentStats?.low_stock || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatusBadge status="error" pulse={false}>
                      Perlu Restock
                    </StatusBadge>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl p-6">
                  <CardHeader>
                    <CardDescription>Kategori</CardDescription>
                    <CardTitle className="text-3xl">
                      {equipmentStats?.total_categories || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Jenis peralatan
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Laboratories */}
          <TabsContent value="labs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Utilisasi Laboratorium
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Analisis penggunaan dan jadwal per laboratorium
                </p>
              </div>
              <Button
                onClick={exportLabUtilization}
                variant="outline"
                disabled={labUtilization.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Ekspor CSV
              </Button>
            </div>

            {loadingLabs ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : labUtilization.length === 0 ? (
              <Card className="border-0 shadow-xl p-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada data laboratorium
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Lab</TableHead>
                      <TableHead>Nama Laboratorium</TableHead>
                      <TableHead className="text-right">Total Jadwal</TableHead>
                      <TableHead className="text-right">Total Jam</TableHead>
                      <TableHead className="text-right">Utilisasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labUtilization.map((lab) => (
                      <TableRow key={lab.laboratorium_id}>
                        <TableCell className="font-mono text-sm">
                          {lab.kode_lab}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lab.nama_lab}
                        </TableCell>
                        <TableCell className="text-right">
                          {lab.total_schedules}
                        </TableCell>
                        <TableCell className="text-right">
                          {lab.total_hours} jam
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge
                            status={getUtilizationStatus(
                              lab.utilization_percentage,
                            )}
                            pulse={false}
                          >
                            {lab.utilization_percentage.toFixed(1)}%
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <StatusBadge status="offline" pulse={false}>
                        {"< 50%"}
                      </StatusBadge>
                      <span className="text-muted-foreground">Rendah</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="success" pulse={false}>
                        50-75%
                      </StatusBadge>
                      <span className="text-muted-foreground">Optimal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="error" pulse={false}>
                        {"> 75%"}
                      </StatusBadge>
                      <span className="text-muted-foreground">Tinggi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 5: Activities */}
          <TabsContent value="activities" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Aktivitas Terbaru</h2>
              <p className="text-sm text-muted-foreground mt-1">
                15 aktivitas terakhir terkait peminjaman
              </p>
            </div>

            {loadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivities.length === 0 ? (
              <Card className="border-0 shadow-xl p-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada aktivitas</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl p-6">
                <CardContent className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "borrowing"
                            ? "bg-primary/10 text-primary"
                            : activity.type === "return"
                              ? "bg-success/10 text-success"
                              : activity.type === "approval"
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                        }`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{activity.user_name}</span>
                          <span>•</span>
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                      </div>
                      <StatusBadge
                        status={
                          activity.type === "borrowing"
                            ? "info"
                            : activity.type === "return"
                              ? "success"
                              : activity.type === "approval"
                                ? "success"
                                : "error"
                        }
                        pulse={false}
                      >
                        {activity.type === "borrowing"
                          ? "Pinjam"
                          : activity.type === "return"
                            ? "Kembali"
                            : activity.type === "approval"
                              ? "Disetujui"
                              : "Ditolak"}
                      </StatusBadge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
