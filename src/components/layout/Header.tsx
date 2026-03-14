/**
 * Header Component
 * Top navigation bar with user menu and notifications
 */
import React from "react";
import { Bell, Menu, User, LogOut } from "lucide-react";
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
import type { UserRole } from "@/types/auth.types";
import { NotificationDropdown } from "@/components/common";
import { useRoleTheme } from "@/lib/hooks/useRoleTheme";
import { ConflictNotificationBadge } from "./ConflictNotificationBadge";

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
  userRole,
  notificationCount = 0,
  showNotificationDropdown = false,
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  onLogout,
  className,
}: HeaderProps) {
  const theme = useRoleTheme();

  const initial = userName
    ? userName.charAt(0).toUpperCase()
    : userEmail
      ? userEmail.charAt(0).toUpperCase()
      : "U";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-t-4 bg-background px-4 shadow-sm transition-colors duration-300 md:px-6",
        theme.accentBorder,
        className,
      )}
    >
      {/* Sisi Kiri: Tombol Menu (Mobile) */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-accent md:hidden"
          onClick={onMenuClick}
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sisi Kanan: Notifikasi & Profil */}
      <div className="flex items-center gap-2 md:gap-4">
        <ConflictNotificationBadge autoRefreshInterval={30000} />

        {showNotificationDropdown ? (
          <NotificationDropdown />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={onNotificationClick}
            aria-label="Lihat Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" />
              </span>
            )}
          </Button>
        )}

        <div className="hidden h-6 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex h-9 items-center gap-2.5 rounded-full pl-1 pr-2 hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring sm:pr-3"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm ring-2 ring-background",
                  theme.primaryBtn.split(" ")[0] || "bg-primary",
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
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
