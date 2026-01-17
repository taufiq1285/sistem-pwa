/**
 * Navigation Component
 * Orchestrator for Sidebar (desktop) and MobileNav (mobile)
 */

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import type { UserRole } from "@/types/auth.types";

// ============================================================================
// TYPES
// ============================================================================

interface NavigationProps {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Navigation({
  userRole,
  userName,
  userEmail,
  onLogout,
}: NavigationProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          onLogout={onLogout}
        />
      </div>

      {/* Mobile Navigation - Only visible on mobile */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
    </>
  );
}

export default Navigation;
