/**
 * AppLayout Component
 * Main application layout with header, sidebar, and content area
 * ✅ Includes Session Timeout & Multi-Tab Sync for shared device protection
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth"; // ✅ UNCOMMENT
import { useRole } from "@/lib/hooks/useRole"; // ✅ UNCOMMENT
import { useSessionTimeout } from "@/lib/hooks/useSessionTimeout"; // ✅ NEW
import { useMultiTabSync } from "@/lib/hooks/useMultiTabSync"; // ✅ NEW
import { useNotificationPolling } from "@/lib/hooks/useNotificationPolling"; // ✅ NEW: Auto-refresh notifications
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AppLayout({ children, className }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ USE REAL AUTH (Uncomment these lines)
  const { user, logout } = useAuth();
  const { role } = useRole();

  // ✅ NEW: Session timeout (auto logout after 15 min inactivity)
  useSessionTimeout({
    timeoutMinutes: 15,
    warningMinutes: 2,
    enableWarningDialog: true,
  });

  // ✅ NEW: Multi-tab sync (auto logout if different user logs in another tab)
  useMultiTabSync();

  // ✅ NEW: Auto-refresh notifications every 30 seconds (without WebSocket)
  useNotificationPolling({
    interval: 30000, // 30 seconds
    enabled: true, // Can be toggled via settings if needed
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ✅ Close mobile nav when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout(); // ✅ USE REAL LOGOUT (remove comment)
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle navigation to profile
  const handleProfileClick = () => {
    if (role) {
      navigate(`/${role}/profil`);
    }
  };

  // ❌ DISABLED: Settings navigation - tidak dalam scope proposal
  // const handleSettingsClick = () => {
  //   if (role) {
  //     navigate(`/${role}/pengaturan`);
  //   }
  // };

  // Handle notification click - show dropdown for all roles including admin
  const handleNotificationClick = () => {
    // NotificationDropdown handles all clicks now
    // This is kept as fallback if needed
  };

  // Show notification dropdown for ALL roles (including admin)
  const showNotificationDropdown = true;

  // If no user, don't render layout
  if (!user || !role) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh min-h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          userRole={role}
          userName={user.full_name}
          userEmail={user.email}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userRole={role}
        userName={user.full_name}
        userEmail={user.email}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          userName={user.full_name}
          userEmail={user.email}
          userRole={role}
          notificationCount={0}
          showNotificationDropdown={showNotificationDropdown}
          onMenuClick={() => setMobileNavOpen(true)}
          onNotificationClick={handleNotificationClick}
          onProfileClick={handleProfileClick}
          // onSettingsClick={handleSettingsClick} // ❌ DISABLED
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className={cn("flex-1 overflow-auto bg-gray-50", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
