/**
 * Header Component
 * Top navigation bar with user menu and notifications
 */

import { Bell, Menu, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth.types';
import { ROLE_LABELS } from '@/types/role.types';

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  notificationCount?: number;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Header({
  userName = 'User',
  userEmail = 'user@example.com',
  userRole,
  notificationCount = 0,
  onMenuClick,
  onNotificationClick,
  onProfileClick,
  onSettingsClick,
  onLogout,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            title="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page title or breadcrumb can go here */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">
              {/* This can be dynamic based on current route */}
            </h1>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onNotificationClick}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                title="User menu"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                  {userRole && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {ROLE_LABELS[userRole]}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
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