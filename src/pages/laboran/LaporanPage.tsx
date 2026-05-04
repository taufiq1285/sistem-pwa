/**
 * Halaman laporan laboran.
 *
 * Diposisikan sebagai pusat rekap dan ekspor data dengan 5 tab:
 * - Ringkasan
 * - Peminjaman
 * - Inventaris
 * - Laboratorium
 * - Riwayat
 */

import { useState, useEffect } from "react";
import type React from "react";
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
  Printer,
  CalendarRange,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type ReportPeriodFilter,
  type BorrowingStats,
  type EquipmentStats,
  type LabUsageStats,
  type TopBorrowedItem,
  type LabUtilization,
  type RecentActivity,
} from "@/lib/api/reports.api";

const reportPrintStyles = `
  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
  }

  @media print {
    body {
      background: #ffffff !important;
      color: #111827 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-print-root {
      font-size: 10.5px;
      line-height: 1.45;
    }

    .report-print-section {
      break-inside: auto;
      page-break-inside: auto;
      margin-top: 14px;
    }

    .report-print-section-first {
      margin-top: 18px;
    }

    .report-print-section-page {
      break-before: page;
      page-break-before: always;
      margin-top: 0;
      padding-top: 10px;
    }

    .report-print-header,
    .report-print-section-header,
    .report-print-footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .report-print-section-header {
      break-after: avoid;
      page-break-after: avoid;
    }

    .report-print-section-body {
      break-inside: auto;
      page-break-inside: auto;
    }

    .report-print-metrics {
      display: block;
    }

    .report-print-metric {
      display: block;
      margin-bottom: 6px;
      padding: 8px 10px !important;
    }

    .report-print-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .report-print-table thead {
      display: table-header-group;
    }

    .report-print-table tfoot {
      display: table-footer-group;
    }

    .report-print-table tr,
    .report-print-note {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .report-print-table th,
    .report-print-table td {
      word-break: break-word;
      white-space: normal;
      padding: 6px 8px !important;
      font-size: 10px;
    }

    .report-print-table th {
      font-size: 9.5px;
    }

    .report-print-title {
      font-size: 22px !important;
      line-height: 1.2 !important;
    }

    .report-print-subtitle,
    .report-print-meta,
    .report-print-note {
      font-size: 10px !important;
      line-height: 1.4 !important;
    }

    .report-print-metric-value {
      font-size: 16px !important;
    }

    .report-print-tight {
      margin-top: 10px !important;
    }
  }
`;

export default function LaporanPage() {
  const [period, setPeriod] = useState<ReportPeriodFilter>({});
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
    void loadAllData(period);
  }, []);

  /**
   * Load all statistics data
   */
  const loadAllData = async (nextPeriod: ReportPeriodFilter = period) => {
    await Promise.all([
      loadOverviewData(nextPeriod),
      loadBorrowingData(nextPeriod),
      loadEquipmentData(nextPeriod),
      loadLabsData(nextPeriod),
      loadActivitiesData(nextPeriod),
    ]);
  };

  /**
   * Load overview tab data
   */
  const loadOverviewData = async (nextPeriod: ReportPeriodFilter = period) => {
    setLoadingOverview(true);
    try {
      const [borrowing, equipment, labs] = await Promise.all([
        getBorrowingStats(nextPeriod),
        getEquipmentStats(),
        getLabUsageStats(nextPeriod),
      ]);
      setBorrowingStats(borrowing);
      setEquipmentStats(equipment);
      setLabStats(labs);
    } catch (error) {
      console.error("Failed to load overview data:", error);
      toast.error("Gagal memuat data ringkasan");
    } finally {
      setLoadingOverview(false);
    }
  };

  /**
   * Load borrowing tab data
   */
  const loadBorrowingData = async (nextPeriod: ReportPeriodFilter = period) => {
    setLoadingBorrowing(true);
    try {
      const data = await getTopBorrowedItems(10, nextPeriod);
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
  const loadEquipmentData = async (
    _nextPeriod: ReportPeriodFilter = period,
  ) => {
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
  const loadLabsData = async (nextPeriod: ReportPeriodFilter = period) => {
    setLoadingLabs(true);
    try {
      const data = await getLabUtilization(nextPeriod);
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
  const loadActivitiesData = async (
    nextPeriod: ReportPeriodFilter = period,
  ) => {
    setLoadingActivities(true);
    try {
      const data = await getRecentActivities(15, nextPeriod);
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
    await loadAllData(period);
    toast.success("Data berhasil dimuat ulang");
  };

  const handleApplyPeriod = async () => {
    toast.info("Menerapkan periode laporan...");
    await loadAllData(period);
    toast.success("Periode laporan diperbarui");
  };

  const handleResetPeriod = async () => {
    const clearedPeriod: ReportPeriodFilter = {};
    setPeriod(clearedPeriod);
    toast.info("Menampilkan seluruh data laporan...");
    await loadAllData(clearedPeriod);
    toast.success("Filter periode dibersihkan");
  };

  const handlePrintReport = () => {
    if (
      loadingOverview ||
      loadingBorrowing ||
      loadingEquipment ||
      loadingLabs ||
      loadingActivities
    ) {
      toast.info("Tunggu hingga seluruh data laporan selesai dimuat");
      return;
    }

    const printDocument = document.querySelector(
      '[data-testid="laporan-print-document"]',
    );

    if (!(printDocument instanceof HTMLElement)) {
      toast.error("Dokumen laporan belum siap untuk dicetak");
      return;
    }

    const printFrame = document.createElement("iframe");
    printFrame.setAttribute("title", "print-laporan-laboran");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";
    document.body.appendChild(printFrame);

    const printWindow = printFrame.contentWindow;

    if (!printWindow) {
      printFrame.remove();
      toast.error("Mesin print tidak dapat disiapkan. Coba lagi.");
      return;
    }

    const headMarkup = document.head.innerHTML;
    const printableMarkup = printDocument.outerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Laporan Pertanggungjawaban Laboran</title>
          ${headMarkup}
          <style>
            body {
              margin: 0;
              background: #ffffff;
              color: #111827;
            }

            .report-print-host {
              padding: 16px;
            }

            ${reportPrintStyles}
          </style>
        </head>
        <body>
          <main class="report-print-host">
            ${printableMarkup}
          </main>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    window.setTimeout(() => {
      printFrame.remove();
    }, 1000);
  };

  const renderLoadingState = (label: string) => (
    <Card className="border-0 shadow-xl p-6">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Memuat {label.toLowerCase()}...
        </p>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (
    icon: React.ReactNode,
    title: string,
    description: string,
  ) => (
    <Card className="border-0 shadow-xl p-6">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-muted-foreground">{icon}</div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

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

  const exportEquipmentSummary = () => {
    exportToCSV(
      [
        {
          total_items: equipmentStats?.total_items || 0,
          available: equipmentStats?.available || 0,
          borrowed: equipmentStats?.borrowed || 0,
          low_stock: equipmentStats?.low_stock || 0,
          out_of_stock: equipmentStats?.out_of_stock || 0,
          total_categories: equipmentStats?.total_categories || 0,
        },
      ],
      "ringkasan-inventaris",
      [
        { key: "total_items", header: "total_items" },
        { key: "available", header: "available" },
        { key: "borrowed", header: "borrowed" },
        { key: "low_stock", header: "low_stock" },
        { key: "out_of_stock", header: "out_of_stock" },
        { key: "total_categories", header: "total_categories" },
      ],
    );
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

  const formatPeriodLabel = () => {
    if (!period.startDate && !period.endDate) {
      return "Seluruh data yang tersedia";
    }

    if (period.startDate && period.endDate) {
      return `${period.startDate} s.d. ${period.endDate}`;
    }

    if (period.startDate) {
      return `Mulai ${period.startDate}`;
    }

    return `Sampai ${period.endDate}`;
  };

  const loadingAny =
    loadingOverview ||
    loadingBorrowing ||
    loadingEquipment ||
    loadingLabs ||
    loadingActivities;

  const printGeneratedAt = formatTimestamp(new Date().toISOString());
  const summaryMetrics = [
    {
      label: "Total Peminjaman",
      value: borrowingStats?.total_borrowings || 0,
    },
    {
      label: "Menunggu Persetujuan",
      value: borrowingStats?.pending || 0,
    },
    {
      label: "Disetujui",
      value: borrowingStats?.approved || 0,
    },
    {
      label: "Dikembalikan",
      value: borrowingStats?.returned || 0,
    },
    {
      label: "Total Inventaris",
      value: equipmentStats?.total_items || 0,
    },
    {
      label: "Total Laboratorium",
      value: labStats?.total_labs || 0,
    },
  ];

  const inventoryPrintMetrics = [
    {
      label: "Total Item",
      value: equipmentStats?.total_items || 0,
    },
    {
      label: "Tersedia",
      value: equipmentStats?.available || 0,
    },
    {
      label: "Stok Rendah",
      value: equipmentStats?.low_stock || 0,
    },
    {
      label: "Kategori",
      value: equipmentStats?.total_categories || 0,
    },
  ];

  const labPrintMetrics = [
    {
      label: "Total Laboratorium",
      value: labStats?.total_labs || 0,
    },
    {
      label: "Menunggu Persetujuan",
      value: labStats?.pending_bookings || 0,
    },
    {
      label: "Disetujui",
      value: labStats?.approved_bookings || 0,
    },
    {
      label: "Kapasitas Total",
      value: labStats?.total_capacity || 0,
    },
  ];

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="hidden print:block">
          <style>{reportPrintStyles}</style>
          <article
            data-testid="laporan-print-document"
            className="report-print-root bg-white font-serif text-[12px] leading-6 text-slate-900"
          >
            <header
              data-testid="print-header"
              className="report-print-header border-b-2 border-slate-900 pb-4"
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Dokumen Resmi
                  </p>
                  <h1 className="report-print-title text-3xl font-bold uppercase tracking-wide">
                    Laporan Pertanggungjawaban Laboran
                  </h1>
                  <p className="report-print-subtitle max-w-3xl text-sm text-slate-600">
                    Rekap resmi kegiatan laboratorium untuk kebutuhan
                    dokumentasi, evaluasi operasional, dan pertanggungjawaban
                    kegiatan.
                  </p>
                </div>
                <div className="report-print-meta border border-slate-300 px-4 py-3 text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold">Periode:</span>{" "}
                      {formatPeriodLabel()}
                    </p>
                    <p>
                      <span className="font-semibold">Dicetak pada:</span>{" "}
                      {printGeneratedAt}
                    </p>
                    <p>
                      <span className="font-semibold">Fungsi:</span> Rekap,
                      ekspor, dan print laporan
                    </p>
                  </div>
                </div>
              </div>
            </header>

            <section
              data-testid="print-section-ringkasan"
              className="report-print-section report-print-section-first mt-6 space-y-4"
            >
              <div className="report-print-section-header border-b border-slate-300 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  I. Ringkasan Laporan
                </h2>
                <p className="text-sm text-slate-600">
                  Ringkasan indikator utama laboratorium pada periode laporan.
                </p>
              </div>
              <div className="report-print-metrics report-print-tight grid grid-cols-1 gap-2">
                {summaryMetrics.map((metric) => (
                  <div
                    key={`summary-${metric.label}`}
                    className="report-print-metric break-inside-avoid border border-slate-300 px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      {metric.label}
                    </p>
                    <p className="report-print-metric-value mt-2 text-2xl font-bold leading-none">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              data-testid="print-section-peminjaman"
              className="report-print-section report-print-section-page mt-6 space-y-4"
            >
              <div className="report-print-section-header border-b border-slate-300 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  II. Rekap Peminjaman
                </h2>
                <p className="text-sm text-slate-600">
                  Daftar alat yang paling sering dipinjam sebagai gambaran
                  kebutuhan penggunaan alat pada periode laporan.
                </p>
              </div>
              <div className="report-print-section-body space-y-4">
                <div className="report-print-metrics report-print-tight grid grid-cols-1 gap-2 text-sm">
                  <div className="report-print-metric border border-slate-300 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Total Peminjaman
                    </p>
                    <p className="report-print-metric-value mt-1 text-xl font-bold">
                      {borrowingStats?.total_borrowings || 0}
                    </p>
                  </div>
                  <div className="report-print-metric border border-slate-300 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Total Alat Dipinjam
                    </p>
                    <p className="report-print-metric-value mt-1 text-xl font-bold">
                      {topBorrowed.reduce(
                        (sum, item) => sum + item.total_borrowed,
                        0,
                      )}{" "}
                      unit
                    </p>
                  </div>
                  <div className="report-print-metric border border-slate-300 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Jenis Alat Tercatat
                    </p>
                    <p className="report-print-metric-value mt-1 text-xl font-bold">
                      {topBorrowed.length}
                    </p>
                  </div>
                </div>
                {topBorrowed.length === 0 ? (
                  <p className="report-print-note border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                    Tidak ada data peminjaman untuk dicetak pada periode ini.
                  </p>
                ) : (
                  <table
                    data-testid="print-table-peminjaman"
                    className="report-print-table w-full border-collapse border border-slate-300 text-sm"
                  >
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="border border-slate-300 px-3 py-2">
                          No.
                        </th>
                        <th className="border border-slate-300 px-3 py-2">
                          Kode Barang
                        </th>
                        <th className="border border-slate-300 px-3 py-2">
                          Nama Barang
                        </th>
                        <th className="border border-slate-300 px-3 py-2">
                          Kategori
                        </th>
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Frekuensi
                        </th>
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Total Dipinjam
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topBorrowed.map((item, index) => (
                        <tr
                          key={`print-borrowing-${item.inventaris_id}`}
                          className="break-inside-avoid"
                        >
                          <td className="border border-slate-300 px-3 py-2 align-top">
                            {index + 1}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top font-mono text-[11px]">
                            {item.kode_barang}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top font-semibold">
                            {item.nama_barang}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top">
                            {item.kategori}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-top">
                            {item.times_borrowed}x
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-top">
                            {item.total_borrowed} unit
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section
              data-testid="print-section-inventaris"
              className="report-print-section report-print-section-page mt-6 space-y-4"
            >
              <div className="report-print-section-header border-b border-slate-300 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  III. Rekap Inventaris
                </h2>
                <p className="text-sm text-slate-600">
                  Snapshot kondisi inventaris untuk menilai ketersediaan alat
                  dan kebutuhan tindak lanjut stok.
                </p>
              </div>
              <div className="report-print-metrics report-print-tight grid grid-cols-1 gap-2">
                {inventoryPrintMetrics.map((metric) => (
                  <div
                    key={`inventory-${metric.label}`}
                    className="report-print-metric break-inside-avoid border border-slate-300 px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      {metric.label}
                    </p>
                    <p className="report-print-metric-value mt-1 text-xl font-bold">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              data-testid="print-section-laboratorium"
              className="report-print-section report-print-section-page mt-6 space-y-4"
            >
              <div className="report-print-section-header border-b border-slate-300 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  IV. Rekap Laboratorium
                </h2>
                <p className="text-sm text-slate-600">
                  Ringkasan kapasitas, status persetujuan, dan utilisasi
                  laboratorium pada periode laporan.
                </p>
              </div>
              <div className="report-print-section-body space-y-4">
                <div className="report-print-metrics report-print-tight grid grid-cols-1 gap-2">
                  {labPrintMetrics.map((metric) => (
                    <div
                      key={`lab-${metric.label}`}
                      className="report-print-metric break-inside-avoid border border-slate-300 px-4 py-3"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        {metric.label}
                      </p>
                      <p className="report-print-metric-value mt-1 text-xl font-bold">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                {labUtilization.length === 0 ? (
                  <p className="report-print-note border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                    Tidak ada data utilisasi laboratorium untuk dicetak pada
                    periode ini.
                  </p>
                ) : (
                  <table
                    data-testid="print-table-laboratorium"
                    className="report-print-table w-full border-collapse border border-slate-300 text-sm"
                  >
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="border border-slate-300 px-3 py-2">
                          Kode Lab
                        </th>
                        <th className="border border-slate-300 px-3 py-2">
                          Nama Laboratorium
                        </th>
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Total Jadwal
                        </th>
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Total Jam
                        </th>
                        <th className="border border-slate-300 px-3 py-2 text-right">
                          Utilisasi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {labUtilization.map((lab) => (
                        <tr
                          key={`print-lab-${lab.laboratorium_id}`}
                          className="break-inside-avoid"
                        >
                          <td className="border border-slate-300 px-3 py-2 align-top font-mono text-[11px]">
                            {lab.kode_lab}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 align-top font-semibold">
                            {lab.nama_lab}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-top">
                            {lab.total_schedules}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-top">
                            {lab.total_hours} jam
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right align-top">
                            {lab.utilization_percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section
              data-testid="print-section-riwayat"
              className="report-print-section report-print-section-page mt-6 space-y-4"
            >
              <div className="report-print-section-header border-b border-slate-300 pb-2">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  V. Riwayat Aktivitas
                </h2>
                <p className="text-sm text-slate-600">
                  Riwayat aktivitas operasional terbaru sebagai pelengkap
                  dokumentasi laporan utama.
                </p>
              </div>
              {recentActivities.length === 0 ? (
                <p className="report-print-note border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                  Tidak ada riwayat aktivitas untuk dicetak pada periode ini.
                </p>
              ) : (
                <table
                  data-testid="print-table-riwayat"
                  className="report-print-table w-full border-collapse border border-slate-300 text-sm"
                >
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="border border-slate-300 px-3 py-2">No.</th>
                      <th className="border border-slate-300 px-3 py-2">
                        Aktivitas
                      </th>
                      <th className="border border-slate-300 px-3 py-2">
                        Pengguna
                      </th>
                      <th className="border border-slate-300 px-3 py-2">
                        Waktu
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((activity, index) => (
                      <tr
                        key={`print-activity-${activity.id}`}
                        className="break-inside-avoid"
                      >
                        <td className="border border-slate-300 px-3 py-2 align-top">
                          {index + 1}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 align-top font-semibold">
                          {activity.description}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 align-top">
                          {activity.user_name}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 align-top">
                          {formatTimestamp(activity.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <footer
              data-testid="print-footer"
              className="report-print-footer mt-8 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500"
            >
              Dokumen ini dicetak dari fitur Laporan Laboran sebagai rekap dan
              pertanggungjawaban kegiatan laboratorium.
            </footer>
          </article>
        </div>

        <div className="print:hidden">
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
                      Laporan Laboratorium
                    </h1>
                    <p className="text-muted-foreground">
                      Pusat rekap, ekspor, dan print pertanggungjawaban kegiatan
                      laboratorium.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handlePrintReport}
                  variant="outline"
                  disabled={loadingAny}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Laporan
                </Button>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={loadingAny}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Muat Ulang Data
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            intensity="low"
            className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarRange className="h-4 w-4 text-primary" />
                Periode Laporan
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]">
                <div className="space-y-2">
                  <Label htmlFor="report-start-date">Tanggal Mulai</Label>
                  <Input
                    id="report-start-date"
                    type="date"
                    value={period.startDate || ""}
                    onChange={(event) =>
                      setPeriod((current) => ({
                        ...current,
                        startDate: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-end-date">Tanggal Akhir</Label>
                  <Input
                    id="report-end-date"
                    type="date"
                    value={period.endDate || ""}
                    onChange={(event) =>
                      setPeriod((current) => ({
                        ...current,
                        endDate: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleApplyPeriod} disabled={loadingAny}>
                    Terapkan Periode
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleResetPeriod}
                    variant="outline"
                    disabled={
                      loadingAny && !period.startDate && !period.endDate
                    }
                  >
                    Reset Periode
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {period.startDate || period.endDate
                  ? `Laporan sedang memakai periode: ${formatPeriodLabel()}.`
                  : "Belum ada filter periode. Laporan memakai seluruh data yang tersedia."}
              </p>
              <p className="text-sm text-muted-foreground">
                Dokumen print disusun sebagai laporan resmi laboratorium dengan
                ringkasan, rekap per area, dan riwayat aktivitas sebagai
                pelengkap.
              </p>
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
                Ringkasan
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
                Riwayat
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Overview */}
            <TabsContent value="overview" className="space-y-6">
              {loadingOverview ? (
                <DashboardSkeleton />
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h2 className="mb-1 text-xl font-semibold">
                        Ringkasan Laporan
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Snapshot cepat kondisi laboratorium. Detail rekap dan
                        ekspor tersedia di tab data masing-masing.
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

                  <div className="grid gap-4 lg:grid-cols-3">
                    <GlassCard
                      intensity="low"
                      className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Peminjaman
                        </CardTitle>
                        <CardDescription>
                          Rekap status peminjaman untuk orientasi cepat.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total peminjaman
                          </span>
                          <span className="font-semibold text-foreground">
                            {borrowingStats?.total_borrowings || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Menunggu persetujuan
                          </span>
                          <span className="font-semibold text-warning">
                            {borrowingStats?.pending || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Gunakan tab `Peminjaman` untuk melihat rekap detail
                          dan ekspor CSV.
                        </div>
                      </CardContent>
                    </GlassCard>

                    <GlassCard
                      intensity="low"
                      className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Inventaris
                        </CardTitle>
                        <CardDescription>
                          Snapshot stok dan kategori inventaris laboratorium.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total item
                          </span>
                          <span className="font-semibold text-foreground">
                            {equipmentStats?.total_items || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Stok rendah
                          </span>
                          <span className="font-semibold text-danger">
                            {equipmentStats?.low_stock || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Gunakan tab `Inventaris` untuk membaca ringkasan stok
                          dan mengekspor data.
                        </div>
                      </CardContent>
                    </GlassCard>

                    <GlassCard
                      intensity="low"
                      className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Laboratorium
                        </CardTitle>
                        <CardDescription>
                          Snapshot kapasitas dan utilisasi laboratorium.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total laboratorium
                          </span>
                          <span className="font-semibold text-foreground">
                            {labStats?.total_labs || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Menunggu persetujuan
                          </span>
                          <span className="font-semibold text-warning">
                            {labStats?.pending_bookings || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Gunakan tab `Laboratorium` untuk melihat rekap
                          utilisasi dan ekspor CSV.
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
                  <h2 className="text-xl font-semibold">Rekap Peminjaman</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data alat paling sering dipinjam untuk kebutuhan rekap dan
                    ekspor.
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
                renderLoadingState("data peminjaman")
              ) : topBorrowed.length === 0 ? (
                renderEmptyState(
                  <TrendingUp className="h-12 w-12" />,
                  "Tidak ada data peminjaman",
                  "Belum ada rekap peminjaman yang bisa ditampilkan atau diekspor saat ini.",
                )
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Rekap Inventaris
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ringkasan kondisi stok dan kategori inventaris untuk rekap
                    dan ekspor.
                  </p>
                </div>
                <Button
                  onClick={exportEquipmentSummary}
                  variant="outline"
                  disabled={!equipmentStats}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ekspor CSV
                </Button>
              </div>

              {loadingEquipment ? (
                renderLoadingState("data inventaris")
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
                  <h2 className="text-xl font-semibold">Rekap Laboratorium</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rekap utilisasi, kapasitas, dan pemakaian laboratorium untuk
                    kebutuhan ekspor.
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
                renderLoadingState("data laboratorium")
              ) : labUtilization.length === 0 ? (
                renderEmptyState(
                  <Building2 className="h-12 w-12" />,
                  "Tidak ada data laboratorium",
                  "Belum ada rekap laboratorium yang bisa ditampilkan atau diekspor saat ini.",
                )
              ) : (
                <Card className="border-0 shadow-xl p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode Lab</TableHead>
                        <TableHead>Nama Laboratorium</TableHead>
                        <TableHead className="text-right">
                          Total Jadwal
                        </TableHead>
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
                <h2 className="text-xl font-semibold">Riwayat Aktivitas</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Aktivitas operasional terbaru sebagai pelengkap rekap utama,
                  bukan pusat ekspor laporan.
                </p>
              </div>

              {loadingActivities ? (
                renderLoadingState("riwayat aktivitas")
              ) : recentActivities.length === 0 ? (
                renderEmptyState(
                  <Activity className="h-12 w-12" />,
                  "Tidak ada riwayat aktivitas",
                  "Belum ada aktivitas operasional terbaru yang perlu ditampilkan saat ini.",
                )
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
                            <span>-</span>
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
    </div>
  );
}
