/**
 * Sidebar Component
 * Main navigation sidebar with collapsible functionality
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Menu, LogOut } from 'lucide-react';
import type { UserRole } from '@/types/auth.types';
import { getNavigationItems, isRouteActive } from '@/config/navigation.config';

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
  userName = 'User',
  userEmail = 'user@example.com',
  onLogout,
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  console.log('[Sidebar RENDER] Collapsed:', collapsed, 'Path:', location.pathname);

  // Get navigation items for current role
  const navItems = getNavigationItems(userRole);

  // ✅ Keep sidebar expansion state when navigating between pages
  // This prevents sidebar from expanding when clicking nav links
  useEffect(() => {
    console.log('[Sidebar EFFECT] Location:', location.pathname, '| Collapsed:', collapsed);
  }, [location.pathname, collapsed]);

  // Debug: Log when collapse state changes
  const handleToggleCollapse = () => {
    console.log('[Sidebar TOGGLE] From:', collapsed, 'To:', !collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={cn(
        'relative h-screen bg-background border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-semibold">AKBID Mega Buana</h2>
            <p className="text-xs text-muted-foreground">Sistem Praktikum</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={cn(collapsed && 'mx-auto')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(location.pathname, item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  active && 'bg-accent text-accent-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.label : item.description}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <Badge variant="secondary" className="ml-auto">
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
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background">
        <div
          className={cn(
            'flex items-center gap-3 p-4',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                title="Logout"
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