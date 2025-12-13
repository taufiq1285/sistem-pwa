/**
 * AuthLayout Component
 * Simple layout for authentication pages (login, register, etc.)
 */

import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
        className,
      )}
    >
      {/* Header/Branding */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AKBID Mega Buana
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sistem Praktikum Kebidanan
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} AKBID Mega Buana. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AuthLayout;
