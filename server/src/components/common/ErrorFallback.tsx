/**
 * ErrorFallback Component
 * Displays user-friendly error message with recovery options
 */

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
  showDetails?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ErrorFallback({
  error,
  resetError,
  showDetails = import.meta.env.DEV,
  className,
}: ErrorFallbackProps) {
  const errorMessage = error?.message || "Terjadi kesalahan yang tidak terduga";
  const errorStack = error?.stack;

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className={cn(
        "flex min-h-[400px] w-full items-center justify-center p-4",
        className,
      )}
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Oops! Terjadi Kesalahan</h2>
          <p className="text-muted-foreground">
            Maaf, terjadi kesalahan saat memproses permintaan Anda
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">{errorMessage}</AlertDescription>
          </Alert>

          {/* Error Details (Development Only) */}
          {showDetails && errorStack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Detail Error (Development Mode)
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-4 text-xs">
                {errorStack}
              </pre>
            </details>
          )}

          {/* User Actions */}
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm font-medium">Anda dapat mencoba:</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Refresh halaman ini</li>
              <li>• Kembali ke halaman utama</li>
              <li>• Periksa koneksi internet Anda</li>
              <li>• Hubungi administrator jika masalah berlanjut</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          {resetError && (
            <Button
              onClick={resetError}
              variant="default"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          )}

          <Button
            onClick={handleReload}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Halaman
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Ke Beranda
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ErrorFallback;
