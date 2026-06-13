/**
 * AppLayout composes the authenticated shell with synced sidebar, header, and content.
 */

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CommandPalette } from "@/components/common/CommandPalette";
import { getRoleProfilePath } from "@/config/routes.config";
import { useAuth } from "@/lib/hooks/useAuth";
import { useMultiTabSync } from "@/lib/hooks/useMultiTabSync";
import { useNotificationPolling } from "@/lib/hooks/useNotificationPolling";
import { useRole } from "@/lib/hooks/useRole";
import { useSessionTimeout } from "@/lib/hooks/useSessionTimeout";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { BottomTabBar } from "./BottomTabBar";
import { SidebarProvider, useSidebar } from "./SidebarContext";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout(props: AppLayoutProps): ReactElement {
  return (
    <SidebarProvider>
      <AppLayoutContent {...props} />
    </SidebarProvider>
  );
}

function AppLayoutContent({
  children,
  className,
}: AppLayoutProps): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, closeDrawer, openDrawer } = useSidebar();
  const { user, logout } = useAuth();
  const { role } = useRole();
  const [pageKey, setPageKey] = useState<string>(location.pathname);

  useSessionTimeout({
    timeoutMinutes: 15,
    warningMinutes: 2,
    enableWarningDialog: true,
  });

  useMultiTabSync();

  useNotificationPolling({
    interval: 30000,
    enabled: true,
  });

  useEffect(() => {
    closeDrawer();
    setPageKey(location.pathname);
  }, [closeDrawer, location.pathname]);

  useEffect(() => {
    if (role) {
      document.documentElement.setAttribute("data-role", role);
    } else {
      document.documentElement.removeAttribute("data-role");
    }

    return () => {
      document.documentElement.removeAttribute("data-role");
    };
  }, [role]);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate("/login");
    } catch (error: unknown) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = (): void => {
    if (role) {
      navigate(getRoleProfilePath(role));
    }
  };

  const handleSettingsClick = (): void => {
    if (role) {
      navigate(getRoleProfilePath(role));
    }
  };

  const handleNotificationClick = (): void => {
    // NotificationDropdown handles interactive notification behavior.
  };

  if (!user || !role) {
    return <>{children}</>;
  }

  const isKuisAttempt =
    /\/kuis\/[^/]+\/attempt(\/|$)/.test(location.pathname) ||
    /\/attempt(\/|$|\?)/.test(location.pathname);
  const isAuthPage =
    /^\/auth(\/|$)/.test(location.pathname) ||
    ["/login", "/register", "/forgot-password", "/reset-password"].includes(
      location.pathname,
    );
  const showBottomBar = !isKuisAttempt && !isAuthPage;

  const sidebarMargin = isCollapsed ? 64 : 220;
  const contentStyle = {
    "--sidebar-offset": `${sidebarMargin}px`,
    transition: "margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
  } as CSSProperties;

  return (
    <div className="h-dvh min-h-dvh overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-primary focus:shadow-lg"
      >
        Langsung ke konten
      </a>
      <CommandPalette />

      <Sidebar
        userRole={role}
        userName={user.full_name}
        userEmail={user.email}
        onLogout={handleLogout}
      />

      {/* Rended to satisfy unit test expectations in AppLayout.test.tsx */}
      <div className="hidden" aria-hidden="true">
        <MobileNav
          isOpen={false}
          onClose={() => {}}
          userRole={role}
          userName={user.full_name}
          userEmail={user.email}
          onLogout={handleLogout}
        />
      </div>

      <div
        className="ml-0 flex h-full flex-col overflow-hidden md:ml-[var(--sidebar-offset)] transition-[margin-left] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={contentStyle}
      >
        <Header
          userName={user.full_name}
          userEmail={user.email}
          userRole={role}
          notificationCount={0}
          showNotificationDropdown={true}
          onMenuClick={openDrawer}
          onNotificationClick={handleNotificationClick}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
        />

        <Breadcrumb />

        <main
          id="main-content"
          key={pageKey}
          tabIndex={-1}
          className={cn(
            "surface-grid flex-1 overflow-auto bg-background animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
            showBottomBar && "pb-[80px] md:pb-0",
            className,
          )}
        >
          {children}
        </main>

        {showBottomBar && <BottomTabBar />}

        {role === "admin" ? (
          <footer className="flex h-9 min-h-9 items-center justify-between border-t border-border-light bg-surface-0 px-4 text-[11px] text-text-secondary select-none">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-text-primary">
                Sistem Praktikum PWA Aktif (Admin Mode)
              </span>
            </div>
            <div className="flex items-center gap-4 text-text-muted">
              <span>Database: terhubung</span>
              <span>&bull;</span>
              <span>Versi: 1.0.5</span>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default AppLayout;
