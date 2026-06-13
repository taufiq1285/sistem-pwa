/**
 * Chart transformers convert domain data into Recharts-friendly structures.
 */

import type { UserRole } from "@/types/auth.types";
import type { Nilai } from "@/types/nilai.types";

export interface User {
  created_at?: string | null;
  role?: UserRole | string | null;
}

export interface Attendance {
  kelas?: string | null;
  kelas_nama?: string | null;
  week?: string | null;
  minggu?: string | null;
  persen?: number | null;
  percentage?: number | null;
  hadir?: number | null;
  total?: number | null;
}

export interface Grade {
  nilai_huruf?: string | null;
  grade?: string | null;
  nilai_akhir?: number | null;
  kelas?: {
    nama_kelas?: string | null;
    semester_ajaran?: number | null;
    mata_kuliah?: {
      nama_mk?: string | null;
    } | null;
  } | null;
}

export interface InventoryStatus {
  jumlah?: number | null;
  jumlah_tersedia?: number | null;
  kondisi?: string | null;
}

export interface LabSchedule {
  hari?: string | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
}

export interface UserGrowthPoint {
  month: string;
  admin: number;
  dosen: number;
  mahasiswa: number;
  laboran: number;
}

export interface AttendancePoint {
  kelas: string;
  persen: number;
}

export interface RoleDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export interface GradeDistributionPoint {
  grade: string;
  count: number;
}

export interface GradeCompetencyPoint {
  kompetensi: string;
  nilai: number;
}

export interface GradeTrendPoint {
  semester: string;
  nilai: number;
}

export interface InventoryStatusPoint {
  name: string;
  value: number;
  color: string;
}

export interface LabHeatmapCell {
  day: string;
  hour: string;
  value: number;
}

const roleColors: Record<UserRole, string> = {
  admin: "#6d28d9",
  dosen: "#1d4ed8",
  mahasiswa: "#0d9488",
  laboran: "#c2410c",
};

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
});

const getMonthKey = (date: Date): string =>
  `${monthFormatter.format(date)} ${date.getFullYear()}`;

const normalizeRole = (role?: string | null): UserRole | null => {
  if (
    role === "admin" ||
    role === "dosen" ||
    role === "mahasiswa" ||
    role === "laboran"
  ) {
    return role;
  }

  return null;
};

const toPercent = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

export function transformUserGrowthData(users: User[]): UserGrowthPoint[] {
  const now = new Date();
  const monthMap = new Map<string, UserGrowthPoint>();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = getMonthKey(date);
    monthMap.set(key, {
      month: key,
      admin: 0,
      dosen: 0,
      mahasiswa: 0,
      laboran: 0,
    });
  }

  users.forEach((user) => {
    if (!user.created_at) {
      return;
    }

    const role = normalizeRole(user.role);
    if (!role) {
      return;
    }

    const key = getMonthKey(new Date(user.created_at));
    const point = monthMap.get(key);
    if (point) {
      point[role] += 1;
    }
  });

  return Array.from(monthMap.values());
}

export function transformAttendanceData(
  attendance: Attendance[],
): AttendancePoint[] {
  return attendance.map((item, index) => {
    const total = Number(item.total ?? 0);
    const hadir = Number(item.hadir ?? 0);
    const persen =
      item.persen ?? item.percentage ?? (total > 0 ? (hadir / total) * 100 : 0);

    return {
      kelas: item.kelas ?? item.kelas_nama ?? `Kelas ${index + 1}`,
      persen: toPercent(Number(persen)),
    };
  });
}

export function transformRoleDistribution(
  users: User[],
): RoleDistributionPoint[] {
  const counts: Record<UserRole, number> = {
    admin: 0,
    dosen: 0,
    mahasiswa: 0,
    laboran: 0,
  };

  users.forEach((user) => {
    const role = normalizeRole(user.role);
    if (role) {
      counts[role] += 1;
    }
  });

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: roleColors[name as UserRole],
    }));
}

export function transformGradeDistribution(
  grades: Grade[],
): GradeDistributionPoint[] {
  const counts: Record<string, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };

  grades.forEach((grade) => {
    const letter =
      grade.nilai_huruf?.charAt(0).toUpperCase() ||
      grade.grade?.charAt(0).toUpperCase() ||
      getLetterGrade(Number(grade.nilai_akhir ?? 0));
    counts[letter] = (counts[letter] ?? 0) + 1;
  });

  return Object.entries(counts).map(([grade, count]) => ({ grade, count }));
}

export function transformAdminUserGrowthSummary(
  growth: { month: string; users: number }[],
): UserGrowthPoint[] {
  return growth.map((item) => ({
    month: item.month,
    admin: 0,
    dosen: 0,
    mahasiswa: item.users,
    laboran: 0,
  }));
}

export function transformRoleDistributionSummary(
  distribution: { role: string; count: number }[],
): RoleDistributionPoint[] {
  return distribution.map((item) => {
    const role = normalizeRole(item.role.toLowerCase());

    return {
      name: item.role,
      value: item.count,
      color: role ? roleColors[role] : "var(--role-accent)",
    };
  });
}

export function transformLabUsageSummary(
  usage: { lab: string; usage: number }[],
): AttendancePoint[] {
  const maxUsage = Math.max(...usage.map((item) => item.usage), 0);

  return usage.map((item) => ({
    kelas: item.lab,
    persen: maxUsage > 0 ? toPercent((item.usage / maxUsage) * 100) : 0,
  }));
}

export function transformQuizProgressData(
  quizzes: { total_attempts: number; submitted_count: number }[],
): { name: string; value: number; fill: string }[] {
  const total = quizzes.reduce((sum, item) => sum + item.total_attempts, 0);
  const submitted = quizzes.reduce(
    (sum, item) => sum + item.submitted_count,
    0,
  );

  return [
    {
      name: "Selesai",
      value: total > 0 ? toPercent((submitted / total) * 100) : 0,
      fill: "var(--role-accent)",
    },
  ];
}

export function transformGradeCompetencyData(
  grades: Nilai[],
): GradeCompetencyPoint[] {
  const components = [
    ["Kuis", "nilai_kuis"],
    ["Tugas", "nilai_tugas"],
    ["UTS", "nilai_uts"],
    ["UAS", "nilai_uas"],
    ["Praktikum", "nilai_praktikum"],
    ["Kehadiran", "nilai_kehadiran"],
  ] as const;

  return components.map(([label, key]) => {
    const total = grades.reduce(
      (sum, grade) => sum + Number(grade[key] ?? 0),
      0,
    );

    return {
      kompetensi: label,
      nilai: grades.length > 0 ? Math.round(total / grades.length) : 0,
    };
  });
}

export function transformGradeTrendData(grades: Nilai[]): GradeTrendPoint[] {
  const map = new Map<string, { total: number; count: number }>();

  grades.forEach((grade) => {
    const semester = grade.kelas?.semester_ajaran
      ? `Semester ${grade.kelas.semester_ajaran}`
      : "Semester ?";
    const current = map.get(semester) ?? { total: 0, count: 0 };
    map.set(semester, {
      total: current.total + Number(grade.nilai_akhir ?? 0),
      count: current.count + 1,
    });
  });

  return Array.from(map.entries()).map(([semester, value]) => ({
    semester,
    nilai: value.count > 0 ? Math.round(value.total / value.count) : 0,
  }));
}

export function transformInventoryStatusData(stats: {
  totalInventaris: number;
  pendingApprovals: number;
  lowStockAlerts: number;
}): InventoryStatusPoint[] {
  const borrowed = Math.max(0, stats.pendingApprovals);
  const damaged = Math.max(0, stats.lowStockAlerts);
  const available = Math.max(0, stats.totalInventaris - borrowed - damaged);

  return [
    { name: "Tersedia", value: available, color: "var(--role-accent)" },
    { name: "Dipinjam", value: borrowed, color: "#f59e0b" },
    { name: "Rusak", value: damaged, color: "#ef4444" },
  ].filter((item) => item.value > 0);
}

export function transformLabUsageHeatmap(
  schedules: LabSchedule[],
): LabHeatmapCell[] {
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const hours = Array.from({ length: 12 }, (_, index) =>
    String(index + 7).padStart(2, "0"),
  );
  const cells = new Map<string, LabHeatmapCell>();

  days.forEach((day) => {
    hours.forEach((hour) => {
      cells.set(`${day}-${hour}`, { day, hour, value: 0 });
    });
  });

  schedules.forEach((schedule) => {
    const day = normalizeDay(schedule.hari);
    const hour = schedule.jam_mulai?.slice(0, 2);

    if (!day || !hour) {
      return;
    }

    const cell = cells.get(`${day}-${hour}`);
    if (cell) {
      cell.value += 1;
    }
  });

  return Array.from(cells.values());
}

function getLetterGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

function normalizeDay(day?: string | null): string | null {
  const normalized = day?.toLowerCase();

  if (!normalized) return null;
  if (normalized.startsWith("sen")) return "Sen";
  if (normalized.startsWith("sel")) return "Sel";
  if (normalized.startsWith("rab")) return "Rab";
  if (normalized.startsWith("kam")) return "Kam";
  if (normalized.startsWith("jum")) return "Jum";
  if (normalized.startsWith("sab")) return "Sab";
  if (normalized.startsWith("min")) return "Min";
  return null;
}
