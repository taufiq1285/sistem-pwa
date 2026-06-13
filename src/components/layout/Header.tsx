/**
 * Header Component
 * Top navigation bar with user menu and notifications
 */
import {
  IconBell,
  IconCommand,
  IconLogout,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import type { UserRole } from "@/types/auth.types";
import { NotificationDropdown } from "@/components/common";
import { InstallPWAButton } from "@/components/common/InstallPWAButton";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ConflictNotificationBadge } from "./ConflictNotificationBadge";

const formatDateShortMonth = (date: Date) => {
  const weekdays = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const d = weekdays[date.getDay()];
  const m = months[date.getMonth()];
  return `${d}, ${date.getDate()} ${m} ${date.getFullYear()}`;
};

// ─── Page Title Map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard Admin",
  "/admin/users": "Manajemen Pengguna",
  "/admin/laboratories": "Manajemen Laboratorium",
  "/admin/equipments": "Inventaris Peralatan",
  "/admin/kelas": "Manajemen Kelas",
  "/admin/mata-kuliah": "Mata Kuliah",
  "/admin/announcements": "Pengumuman",
  "/admin/roles": "Manajemen Peran",
  "/admin/sync": "Sinkronisasi Data",
  "/admin/analytics": "Analitik",
  "/admin/profile": "Profil Saya",
  "/dosen": "Dashboard Dosen",
  "/dosen/jadwal": "Jadwal Praktikum",
  "/dosen/kehadiran": "Data Kehadiran",
  "/dosen/logbook": "Review Logbook",
  "/dosen/penilaian": "Penilaian",
  "/dosen/materi": "Materi Kuliah",
  "/dosen/bank-soal": "Bank Soal",
  "/dosen/peminjaman": "Peminjaman Alat",
  "/dosen/pengumuman": "Pengumuman",
  "/dosen/profile": "Profil Saya",
  "/mahasiswa": "Dashboard Mahasiswa",
  "/mahasiswa/jadwal": "Jadwal Praktikum",
  "/mahasiswa/logbook": "Logbook Digital",
  "/mahasiswa/presensi": "Presensi",
  "/mahasiswa/nilai": "Nilai & Evaluasi",
  "/mahasiswa/materi": "Materi Kuliah",
  "/mahasiswa/pengumuman": "Pengumuman",
  "/mahasiswa/profile": "Profil Saya",
  "/laboran": "Dashboard Laboran",
  "/laboran/inventaris": "Inventaris Alat",
  "/laboran/laboratorium": "Manajemen Lab",
  "/laboran/peminjaman": "Peminjaman Aktif",
  "/laboran/jadwal": "Jadwal Lab",
  "/laboran/persetujuan": "Persetujuan",
  "/laboran/laporan": "Laporan",
  "/laboran/pengumuman": "Pengumuman",
  "/laboran/profile": "Profil Saya",
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  // Try exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Try longest prefix match
  const sorted = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length);
  const match = sorted.find((key) => pathname.startsWith(key));
  return match ? PAGE_TITLES[match] : "";
}

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  notificationCount?: number;
  showNotificationDropdown?: boolean; // Jika true, gunakan komponen dropdown khusus
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Header({
  userName,
  userEmail,
  notificationCount = 0,
  showNotificationDropdown = false,
  onMenuClick,
  onNotificationClick,
  onSettingsClick,
  onProfileClick,
  onLogout,
  className,
}: HeaderProps) {
  const pageTitle = usePageTitle();
  const { open: openCommandPalette } = useCommandPalette();

  const initial = userName
    ? userName.charAt(0).toUpperCase()
    : userEmail
      ? userEmail.charAt(0).toUpperCase()
      : "U";

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-40 flex h-[52px] w-full items-center justify-between border-b transition-colors duration-300 md:px-6",
        className,
      )}
      style={{
        height: "52px",
        backgroundColor: "var(--surface-0)",
        borderBottom: "1px solid var(--border-light)",
        padding: "0 24px",
      }}
    >
      {/* Kiri: Tombol Menu (Mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle Menu"
        >
          <IconMenu2 className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="flex flex-col justify-center">
          <h1
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {pageTitle || "Dashboard"}
          </h1>
        </div>
      </div>

      {/* Sisi Kanan: Notifikasi & Profil */}
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          type="button"
          variant="ghost"
          className="hidden h-[34px] min-w-35 items-center justify-between gap-2 rounded-sm border border-border-light bg-surface-0 px-2.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary sm:flex"
          onClick={openCommandPalette}
          aria-label="Buka command palette (Ctrl K atau Command K)"
        >
          <span className="flex min-w-0 items-center gap-2">
            <IconSearch className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate text-xs font-medium">Cari</span>
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded border border-border bg-surface-1 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted"
            aria-hidden="true"
          >
            <IconCommand className="size-3" />K
          </span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-sm border border-border-light bg-surface-0 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary sm:hidden"
          onClick={openCommandPalette}
          aria-label="Buka command palette (Ctrl K atau Command K)"
        >
          <IconSearch className="size-4" aria-hidden="true" />
        </Button>

        {/* Date badge */}
        <div
          className="hidden md:block select-none font-medium"
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--border-light)",
            padding: "4px 10px",
            borderRadius: "20px",
          }}
        >
          {formatDateShortMonth(new Date())}
        </div>

        <ConflictNotificationBadge autoRefreshInterval={30000} />

        {/* Tombol Install PWA — muncul otomatis jika belum terinstall */}
        <InstallPWAButton />

        <ThemeToggle />

        {showNotificationDropdown ? (
          <NotificationDropdown />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="group relative flex items-center justify-center h-[34px] w-[34px] rounded-sm border border-border-light bg-surface-0 text-text-muted hover:bg-surface-2 hover:text-text-muted transition-colors cursor-pointer"
            onClick={onNotificationClick}
            aria-label="Lihat Notifikasi"
            style={{ padding: 0 }}
          >
            <IconBell
              className="h-4 w-4 group-hover:animate-bell-ring"
              aria-hidden="true"
            />
            {notificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span
                  className="relative bg-[#ef4444] rounded-full border border-white"
                  style={{
                    width: "7px",
                    height: "7px",
                    display: "block",
                  }}
                />
              </span>
            )}
          </Button>
        )}

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative flex items-center justify-center h-[34px] w-[34px] rounded-sm border border-border-light bg-surface-0 text-text-muted hover:bg-surface-2 hover:text-text-muted transition-colors cursor-pointer"
          onClick={onSettingsClick}
          aria-label="Pengaturan"
          style={{ padding: 0 }}
        >
          <IconSettings className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex h-9 items-center gap-2.5 rounded-full pl-1 pr-2 hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring sm:pr-3"
              aria-label={`Menu pengguna ${userName || userEmail || "User"}`}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background bg-role-avatar-bg",
                )}
              >
                <span className="text-sm font-bold leading-none">
                  {initial}
                </span>
              </div>

              <div className="hidden flex-col items-start justify-center md:flex">
                <span className="max-w-30 truncate text-sm font-semibold leading-none text-foreground">
                  {userName || userEmail?.split("@")[0] || "User"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="mt-1 w-60 rounded-xl shadow-lg"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-3 font-normal">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-medium leading-none text-foreground">
                  {userName || userEmail?.split("@")[0] || "User Sistem"}
                </p>
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {onProfileClick && (
              <DropdownMenuItem
                onClick={onProfileClick}
                className="cursor-pointer py-2.5 text-sm font-medium text-foreground hover:bg-accent focus:bg-accent"
              >
                <IconUser
                  className="mr-2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Profil Saya</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <IconLogout className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
