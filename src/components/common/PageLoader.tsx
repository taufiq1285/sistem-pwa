/**
 * PageLoader Component
 * Suspense fallback shown while lazy-loaded pages are being fetched.
 */

import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
