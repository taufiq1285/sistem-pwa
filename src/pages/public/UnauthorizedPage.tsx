/**
 * UnauthorizedPage (403)
 * Displayed when user tries to access a route they don't have permission for
 */

import { useNavigate } from "react-router-dom";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { GlassCard } from "@/components/ui/glass-card";
import { CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { getRoleDashboard } from "@/config/routes.config";
import { ArrowLeft, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToDashboard = () => {
    if (user) {
      const dashboardPath = getRoleDashboard(user.role);
      navigate(dashboardPath);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted to-primary/5 px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-destructive/12 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-44 w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-primary/35 via-destructive/20 to-warning/25 blur-lg" />
        <GlassCard
          intensity="high"
          glow
          className="relative overflow-hidden rounded-4xl border border-white/20 bg-background/85 shadow-2xl"
        >
          <CardContent className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <LockKeyhole className="h-8 w-8" />
              </div>

              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                <ShieldAlert className="h-3.5 w-3.5" />
                Akses dibatasi oleh sistem
              </div>

              <div className="mb-2 text-5xl font-black tracking-tight text-destructive/80 sm:text-6xl">
                403
              </div>

              <h1 className="mb-2 text-2xl font-black text-foreground sm:text-3xl">
                Akses Ditolak
              </h1>

              <p className="mx-auto mb-7 max-w-md text-sm text-muted-foreground sm:text-base">
                Anda tidak memiliki izin untuk membuka halaman ini. Jika merasa
                ini kesalahan, silakan hubungi administrator sistem.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <ButtonEnhanced
                  onClick={handleGoToDashboard}
                  className="h-11 shadow-lg shadow-primary/20"
                  leadingIcon={<ShieldCheck className="h-4 w-4" />}
                >
                  Ke Dashboard
                </ButtonEnhanced>

                <ButtonEnhanced
                  onClick={handleGoBack}
                  variant="outline"
                  className="h-11 border-border/70 bg-background/80 text-foreground hover:bg-accent hover:text-accent-foreground"
                  leadingIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Kembali
                </ButtonEnhanced>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
