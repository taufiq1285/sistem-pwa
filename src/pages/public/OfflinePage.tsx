/**
 * Offline Page
 * Displayed when user is offline and route fallback is triggered
 */

import { Link } from "react-router-dom";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { GlassCard } from "@/components/ui/glass-card";
import { CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes.config";
import { Home, RefreshCcw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted to-primary/5 px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-warning/14 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-primary/35 via-info/20 to-warning/25 blur-lg" />
        <GlassCard
          intensity="high"
          glow
          className="relative overflow-hidden rounded-4xl border border-white/20 bg-background/85 shadow-2xl"
        >
          <CardContent className="px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10 text-info">
              <WifiOff className="h-8 w-8" />
            </div>

            <div className="mb-2 text-2xl font-black text-foreground sm:text-3xl">
              Anda Sedang Offline
            </div>

            <p className="mx-auto mb-7 max-w-md text-sm text-muted-foreground sm:text-base">
              Koneksi internet terputus. Beberapa fitur mungkin tidak tersedia
              sementara. Coba sambungkan kembali lalu muat ulang halaman.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonEnhanced
                onClick={handleReload}
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
