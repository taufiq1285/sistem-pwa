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
        "sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-md",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={onMenuClick}
            title="Toggle menu"
          >
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
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
              className="relative hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              onClick={onNotificationClick}
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800 shadow-lg"
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
                className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="User menu"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white text-base font-bold shadow-lg shadow-blue-500/30 ring-2 ring-white dark:ring-slate-700">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col space-y-2">
                  <p className="text-base font-bold leading-none text-slate-900 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-sm font-medium leading-none text-slate-600 dark:text-slate-400">
                    {userEmail}
                  </p>
                  {userRole && (
                    <Badge
                      variant="secondary"
                      className="w-fit text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                    >
                      {ROLE_LABELS[userRole]}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onProfileClick}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                className="text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
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
