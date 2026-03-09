/**
 * Header Component
 * Top navigation bar with user menu and notifications
 */

import { Bell, Menu, User, LogOut } from "lucide-react";
// import { Settings } from "lucide-react"; // ❌ DISABLED: Unused
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth.types";
import { ROLE_LABELS } from "@/types/role.types";
import { NotificationDropdown } from "@/components/common";
import { ConflictNotificationBadge } from "./ConflictNotificationBadge";

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  notificationCount?: number;
  showNotificationDropdown?: boolean; // If true, show dropdown instead of button
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  // onSettingsClick?: () => void; // ❌ DISABLED: Settings tidak dalam scope proposal
  onLogout?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Header({
  userName = "User",
  userEmail = "user@example.com",
  userRole,
  notificationCount = 0,
  showNotificationDropdown = false,
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  // onSettingsClick, // ❌ DISABLED: Settings tidak dalam scope proposal
  onLogout,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-background/65",
        className,
      )}
    >
      <div className="relative flex min-h-16 items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent" />
        {/* Left: Mobile menu button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden transition-all duration-200 hover:scale-105 hover:bg-accent active:scale-95"
            onClick={onMenuClick}
            title="Toggle menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </Button>

          {/* Page title or breadcrumb can go here */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {/* This can be dynamic based on current route */}
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications - Dropdown for dosen/mahasiswa/laboran, Button for admin */}
          {showNotificationDropdown ? (
            <NotificationDropdown />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative transition-all duration-200 hover:scale-105 hover:bg-accent/70 active:scale-95"
              onClick={onNotificationClick}
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background p-0 text-xs font-bold shadow-md"
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Conflict Notification Badge - FASE 3 Week 4 */}
          <ConflictNotificationBadge autoRefreshInterval={30000} />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full transition-all duration-200 hover:scale-105 hover:bg-accent active:scale-95"
                title="User menu"
              >
                <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-primary-foreground shadow-md ring-2 ring-background">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-base font-bold leading-none text-foreground">
                    {userName}
                  </p>
                  <p className="text-sm font-medium leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                  {userRole && (
                    <Badge
                      variant="secondary"
                      className="w-fit border border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                    >
                      {ROLE_LABELS[userRole]}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onProfileClick}
                className="cursor-pointer text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              {/* ❌ DISABLED: Menu Pengaturan - tidak dalam scope proposal */}
              {/* <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
