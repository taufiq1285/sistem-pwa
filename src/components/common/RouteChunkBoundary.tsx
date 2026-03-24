import type { ReactNode } from "react";
import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCcw, WifiOff } from "lucide-react";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { GlassCard } from "@/components/ui/glass-card";
import { CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes.config";

interface RouteChunkBoundaryProps {
  children: ReactNode;
}

interface RouteChunkBoundaryState {
  hasError: boolean;
  isChunkLoadError: boolean;
}

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("chunkloaderror") ||
    message.includes("loading chunk")
  );
}

export class RouteChunkBoundary extends Component<
  RouteChunkBoundaryProps,
  RouteChunkBoundaryState
> {
  public state: RouteChunkBoundaryState = {
    hasError: false,
    isChunkLoadError: false,
  };

  public static getDerivedStateFromError(error: unknown): RouteChunkBoundaryState {
    return {
      hasError: true,
      isChunkLoadError: isChunkLoadError(error),
    };
  }

  public componentDidCatch(error: unknown): void {
    console.error("RouteChunkBoundary caught route loading error", {
      error,
      online: navigator.onLine,
      pathname: window.location.pathname,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isOffline = !navigator.onLine;
    const title = isOffline
      ? "Halaman offline belum siap di perangkat ini"
      : "Halaman gagal dimuat";
    const description = isOffline
      ? "Aplikasi berhasil terbuka, tetapi file halaman ini belum tersimpan penuh di cache perangkat. Coba buka ulang saat online agar halaman ini ikut tersimpan untuk akses offline berikutnya."
      : "Terjadi gangguan saat memuat modul halaman. Muat ulang aplikasi untuk mencoba kembali dengan aset terbaru.";
    const Icon = isOffline ? WifiOff : AlertTriangle;

    return (
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative w-full max-w-xl">
          <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-primary/25 via-info/15 to-warning/20 blur-lg" />
          <GlassCard
            intensity="high"
            glow
            className="relative overflow-hidden rounded-4xl border border-white/20 bg-background/85 shadow-2xl"
          >
            <CardContent className="px-6 py-8 text-center sm:px-8 sm:py-10">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10 text-info">
                <Icon className="h-8 w-8" />
              </div>

              <div className="mb-2 text-2xl font-black text-foreground sm:text-3xl">
                {title}
              </div>

              <p className="mx-auto mb-3 max-w-md text-sm text-muted-foreground sm:text-base">
                {description}
              </p>

              {this.state.isChunkLoadError && (
                <p className="mx-auto mb-7 max-w-md text-xs text-muted-foreground/80 sm:text-sm">
                  Route chunk tidak tersedia untuk path <strong>{window.location.pathname}</strong>.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonEnhanced
                  onClick={this.handleReload}
                  className="h-11 shadow-lg shadow-primary/20"
                  leadingIcon={<RefreshCcw className="h-4 w-4" />}
                >
                  Muat Ulang
                </ButtonEnhanced>

                <ButtonEnhanced
                  asChild
                  variant="outline"
                  className="h-11 border-border/70 bg-background/80 text-foreground hover:bg-accent hover:text-accent-foreground"
                  leadingIcon={<Home className="h-4 w-4" />}
                >
                  <Link to={ROUTES.HOME}>Ke Beranda</Link>
                </ButtonEnhanced>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    );
  }
}

export default RouteChunkBoundary;
