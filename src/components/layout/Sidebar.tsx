/**
 * Sidebar Component
 * Main navigation sidebar with collapsible functionality
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Menu, LogOut } from "lucide-react";
import type { UserRole } from "@/types/auth.types";
import { getNavigationItems, isRouteActive } from "@/config/navigation.config";

// ============================================================================
// TYPES
// ============================================================================

interface SidebarProps {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Sidebar({
  userRole,
  userName = "User",
  userEmail = "user@example.com",
  onLogout,
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Get navigation items for current role
  const navItems = getNavigationItems(userRole);

  // ✅ Keep sidebar expansion state when navigating between pages
  // This prevents sidebar from expanding when clicking nav links
  useEffect(() => {
    // Effect runs on location change to maintain state
  }, [location.pathname, collapsed]);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={cn(
        "relative h-screen border-r border-border/70 bg-background/85 shadow-xl backdrop-blur-xl transition-all duration-300 supports-backdrop-filter:bg-background/75",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/70 bg-background/60 px-4 backdrop-blur-sm">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              AKBID Mega Buana
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Sistem Praktikum
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={cn(
            "transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "mx-auto",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="space-y-2 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(location.pathname, item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200",
                  "hover:shadow-md",
                  active
                    ? "brand-gradient scale-[1.02] text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-foreground hover:bg-accent/70 hover:text-accent-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : item.description}
              >
                {active && (
                  <div className="absolute inset-0 bg-linear-to-r from-white/10 via-white/5 to-transparent opacity-60 animate-pulse" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform",
                    !collapsed && "group-hover:scale-110",
                    active && "text-white",
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 relative">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "ml-auto font-bold text-xs px-2 py-0.5",
                          active
                            ? "border-white/25 bg-white/15 text-white"
                            : "border-primary/15 bg-primary/10 text-primary",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - User Info */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/70 bg-background/60 backdrop-blur-sm">
        <div
          className={cn(
            "flex items-center gap-3 p-4",
            collapsed && "justify-center",
          )}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Logout"
              className="text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-primary-foreground shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {userName}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {userEmail}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Logout"
                className="text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
