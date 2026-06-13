import type { ReactElement } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUnreadNotifications } from "@/lib/hooks/useUnreadNotifications";
import { isRouteActive } from "@/config/navigation.config";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  IconHome,
  IconUsers,
  IconBuilding,
  IconClipboardCheck,
  IconDots,
  IconCalendar,
  IconNotebook,
  IconAward,
  IconUser,
  IconBook,
  IconPackage,
  IconFileCheck,
  IconFileAnalytics,
  IconLogout,
  IconSchool,
  IconTool,
  IconUserCheck,
  IconSpeakerphone,
  IconBell,
  IconRefresh,
  IconDatabase,
  IconPencil,
  IconFileText,
} from "@tabler/icons-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: "more-sheet";
}

export function BottomTabBar(): ReactElement | null {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!user || !user.role) {
    return null;
  }

  const role = user.role;

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate("/login");
    } catch (error: unknown) {
      console.error("Logout error:", error);
    }
  };

  const getTabItems = (): TabItem[] => {
    switch (role) {
      case "admin":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: IconHome,
            href: "/admin/dashboard",
          },
          {
            id: "users",
            label: "Pengguna",
            icon: IconUsers,
            href: "/admin/users",
          },
          {
            id: "lab",
            label: "Lab",
            icon: IconBuilding,
            href: "/admin/laboratories",
          },
          {
            id: "peminjaman",
            label: "Peminjaman",
            icon: IconClipboardCheck,
            href: "/admin/peminjaman",
          },
          {
            id: "lebih",
            label: "Lebih",
            icon: IconDots,
            action: "more-sheet" as const,
          },
        ];
      case "dosen":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: IconHome,
            href: "/dosen/dashboard",
          },
          {
            id: "jadwal",
            label: "Jadwal",
            icon: IconCalendar,
            href: "/dosen/jadwal",
          },
          {
            id: "kuis",
            label: "Kuis",
            icon: IconNotebook,
            href: "/dosen/kuis",
          },
          {
            id: "nilai",
            label: "Nilai",
            icon: IconAward,
            href: "/dosen/penilaian",
          },
          {
            id: "profil",
            label: "Profil",
            icon: IconUser,
            action: "more-sheet" as const,
          },
        ];
      case "mahasiswa":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: IconHome,
            href: "/mahasiswa/dashboard",
          },
          {
            id: "jadwal",
            label: "Jadwal",
            icon: IconCalendar,
            href: "/mahasiswa/jadwal",
          },
          {
            id: "kuis",
            label: "Kuis",
            icon: IconNotebook,
            href: "/mahasiswa/kuis",
          },
          {
            id: "materi",
            label: "Materi",
            icon: IconBook,
            href: "/mahasiswa/materi",
          },
          {
            id: "nilai",
            label: "Nilai",
            icon: IconAward,
            href: "/mahasiswa/nilai",
          },
        ];
      case "laboran":
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: IconHome,
            href: "/laboran/dashboard",
          },
          {
            id: "inventaris",
            label: "Inventaris",
            icon: IconPackage,
            href: "/laboran/inventaris",
          },
          {
            id: "persetujuan",
            label: "Persetujuan",
            icon: IconFileCheck,
            href: "/laboran/persetujuan",
          },
          {
            id: "jadwal",
            label: "Jadwal",
            icon: IconCalendar,
            href: "/laboran/jadwal",
          },
          {
            id: "laporan",
            label: "Laporan",
            icon: IconFileAnalytics,
            href: "/laboran/laporan",
          },
        ];
      default:
        return [];
    }
  };

  const getSheetItems = () => {
    switch (role) {
      case "admin":
        return [
          { label: "Kelas", icon: IconSchool, href: "/admin/kelas" },
          { label: "Equipments", icon: IconTool, href: "/admin/equipments" },
          {
            label: "Peminjaman Aktif",
            icon: IconClipboardCheck,
            href: "/admin/peminjaman-aktif",
          },
          {
            label: "Manajemen Assignment",
            icon: IconUserCheck,
            href: "/admin/manajemen-assignment",
          },
          {
            label: "Pengumuman",
            icon: IconSpeakerphone,
            href: "/admin/announcements",
          },
          { label: "Notifikasi", icon: IconBell, href: "/admin/notifikasi" },
          {
            label: "Sinkronisasi Offline",
            icon: IconRefresh,
            href: "/admin/offline-sync",
          },
          { label: "Profil Saya", icon: IconUser, href: "/admin/profil" },
        ];
      case "dosen":
        return [
          { label: "Bank Soal", icon: IconDatabase, href: "/dosen/bank-soal" },
          {
            label: "Review Logbook",
            icon: IconPencil,
            href: "/dosen/logbook-review",
          },
          {
            label: "Peminjaman Alat",
            icon: IconPackage,
            href: "/dosen/peminjaman",
          },
          { label: "Kehadiran", icon: IconUserCheck, href: "/dosen/kehadiran" },
          { label: "Materi", icon: IconFileText, href: "/dosen/materi" },
          { label: "Notifikasi", icon: IconBell, href: "/dosen/notifikasi" },
          {
            label: "Sinkronisasi Offline",
            icon: IconRefresh,
            href: "/dosen/offline-sync",
          },
          { label: "Profil Saya", icon: IconUser, href: "/dosen/profil" },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabItems();
  const sheetItems = getSheetItems();

  const renderTab = (item: TabItem): ReactElement => {
    const isActive = item.href
      ? isRouteActive(location.pathname, item.href)
      : isSheetOpen;
    const Icon = item.icon;

    // Show badge if there are unread notifications
    // Render badge on 'dashboard' (mahasiswa/laboran), or the profile/more tab (dosen/admin)
    const hasNotificationBadge =
      unreadCount > 0 &&
      ((item.id === "dashboard" &&
        (role === "mahasiswa" || role === "laboran")) ||
        (item.action === "more-sheet" &&
          (role === "dosen" || role === "admin")));

    if (item.action === "more-sheet") {
      return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen} key={item.id}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center h-full py-1 text-xs font-medium focus:outline-hidden cursor-pointer active:scale-[0.97] transition-all duration-100"
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-150 ease-out",
                    !isActive && "text-muted-foreground hover:text-foreground",
                  )}
                  style={{
                    color: isActive ? "var(--role-accent)" : undefined,
                    backgroundColor: isActive
                      ? "var(--role-surface)"
                      : "transparent",
                  }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                {hasNotificationBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] bg-[#ef4444] rounded-full animate-pulse" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium transition-all duration-150 ease-out",
                  isActive ? "font-semibold" : "text-muted-foreground",
                )}
                style={{
                  color: isActive ? "var(--role-accent)" : undefined,
                }}
              >
                {item.label}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto pt-4"
          >
            {/* Drag Handle Bar */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <SheetHeader className="pb-3 border-b border-border">
              <SheetTitle>Menu Tambahan</SheetTitle>
            </SheetHeader>
            <div className="py-4 grid grid-cols-3 gap-y-5 gap-x-2">
              {sheetItems.map((sheetItem) => {
                const SheetIcon = sheetItem.icon;
                const isSheetItemActive = isRouteActive(
                  location.pathname,
                  sheetItem.href,
                );

                return (
                  <Link
                    key={sheetItem.label}
                    to={sheetItem.href}
                    onClick={() => setIsSheetOpen(false)}
                    className="relative flex flex-col items-center p-2 rounded-lg hover:bg-muted text-center active:scale-[0.97] transition-all duration-100"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full mb-1",
                        isSheetItemActive
                          ? "bg-(--role-surface) text-(--role-accent)"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <SheetIcon className="w-5 h-5 shrink-0" />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium truncate w-full px-1",
                        isSheetItemActive
                          ? "text-(--role-accent) font-semibold"
                          : "text-foreground",
                      )}
                    >
                      {sheetItem.label}
                    </span>
                    {sheetItem.label === "Notifikasi" && unreadCount > 0 && (
                      <span className="absolute top-2 right-4 w-[6px] h-[6px] bg-[#ef4444] rounded-full animate-pulse" />
                    )}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsSheetOpen(false);
                  void handleLogout();
                }}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 text-center cursor-pointer active:scale-[0.97] transition-all duration-100"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 mb-1">
                  <IconLogout className="w-5 h-5 shrink-0" />
                </div>
                <span className="text-xs font-medium truncate w-full">
                  Keluar
                </span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.href || ""}
        className="flex flex-1 flex-col items-center justify-center h-full py-1 text-xs font-medium focus:outline-hidden active:scale-[0.97] transition-transform duration-100"
      >
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-7 rounded-full transition-all duration-150 ease-out",
              !isActive && "text-muted-foreground hover:text-foreground",
            )}
            style={{
              color: isActive ? "var(--role-accent)" : undefined,
              backgroundColor: isActive ? "var(--role-surface)" : "transparent",
            }}
          >
            <Icon className="w-5 h-5 shrink-0" />
          </div>
          {hasNotificationBadge && (
            <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] bg-[#ef4444] rounded-full animate-pulse" />
          )}
        </div>
        <span
          className={cn(
            "text-[10px] mt-0.5 font-medium transition-all duration-150 ease-out",
            isActive ? "font-semibold" : "text-muted-foreground",
          )}
          style={{
            color: isActive ? "var(--role-accent)" : undefined,
          }}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex items-center justify-around bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-t-[0.5px] border-border"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map((item) => renderTab(item))}
    </div>
  );
}

export default BottomTabBar;
