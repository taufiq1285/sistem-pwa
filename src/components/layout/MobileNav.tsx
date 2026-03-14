/**
 * MobileNav Component
 * Mobile navigation drawer with slide-in animation
 */

import { Link, useLocation } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth.types";
import { getNavigationItems, isRouteActive } from "@/config/navigation.config";
import { useRoleTheme } from "@/lib/hooks/useRoleTheme";

// ============================================================================
// TYPES
// ============================================================================

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileNav({
  isOpen,
  onClose,
  userRole,
  userName = "User",
  userEmail = "user@example.com",
  onLogout,
  className,
}: MobileNavProps) {
  const location = useLocation();
  const theme = useRoleTheme();

  // Get navigation items for current role
  const navItems = getNavigationItems(userRole);

  // Handle link click - close drawer
  const handleLinkClick = () => {
    onClose();
  };

  // Handle logout
  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-xs border-r border-white/10 text-white shadow-2xl backdrop-blur-xl transform transition-transform duration-300 ease-in-out md:hidden",
          theme.sidebarBg,
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="relative flex h-16 items-center justify-between border-b border-white/10 px-4">
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent",
                theme.headerGlow,
              )}
            />
            <div>
              <h2 className="text-lg font-semibold text-white">
                AKBID Mega Buana
              </h2>
              <p className="text-xs text-white/70">Sistem Praktikum</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close menu"
              className="text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div
            className={cn(
              "border-b border-white/10 px-4 py-4 bg-linear-to-r",
              theme.mobileBanner,
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br text-white shadow-md",
                  theme.avatarGradient,
                )}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {userName}
                </p>
                <p className="truncate text-xs text-white/70">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(location.pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "interactive-card flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      cn(
                        "hover:text-white hover:translate-x-0.5",
                        theme.sidebarHover,
                      ),
                      active && cn(theme.sidebarActive, "text-white shadow-sm"),
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge variant="secondary">{item.badge}</Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer - Logout */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive transition-all duration-200 hover:translate-x-0.5 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default MobileNav;
