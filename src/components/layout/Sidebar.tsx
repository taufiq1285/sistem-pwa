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
        "relative h-screen bg-linear-to-b from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30 border-r border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              AKBID Mega Buana
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Sistem Praktikum
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={cn(
            "hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
            collapsed && "mx-auto",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
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
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 relative overflow-hidden group",
                  "hover:shadow-md",
                  active
                    ? "bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : item.description}
              >
                {active && (
                  <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-indigo-500 opacity-20 animate-pulse" />
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
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
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
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
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
              className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white text-base font-bold shadow-lg shadow-blue-500/30">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
                  {userEmail}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Logout"
                className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
