/**
 * AppLayout Component
 * Main application layout with header, sidebar, and content area
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';  // ✅ UNCOMMENT
import { useRole } from '@/lib/hooks/useRole';   // ✅ UNCOMMENT
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

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
  
  // ✅ USE REAL AUTH (Uncomment these lines)
  const { user, logout } = useAuth();
  const { role } = useRole();
  
  
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();  // ✅ USE REAL LOGOUT (remove comment)
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle navigation to profile
  const handleProfileClick = () => {
    if (role) {
      navigate(`/${role}/profil`);
    }
  };

  // Handle navigation to settings
  const handleSettingsClick = () => {
    if (role) {
      navigate(`/${role}/pengaturan`);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    if (role) {
      navigate(`/${role}/notifikasi`);
    }
  };

  // If no user, don't render layout
  if (!user || !role) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
          notificationCount={0} // TODO: Get from notifications API
          onMenuClick={() => setMobileNavOpen(true)}
          onNotificationClick={handleNotificationClick}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className={cn('flex-1 overflow-auto bg-gray-50', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;