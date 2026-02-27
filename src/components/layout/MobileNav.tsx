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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-xs bg-background transform transition-transform duration-300 ease-in-out md:hidden shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div>
              <h2 className="text-lg font-semibold">AKBID Mega Buana</h2>
              <p className="text-xs text-muted-foreground">Sistem Praktikum</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent text-accent-foreground",
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
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
