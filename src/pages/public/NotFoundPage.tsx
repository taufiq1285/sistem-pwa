/**
 * NotFoundPage (404)
 * Displayed when user navigates to a route that doesn't exist
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes.config";
import { ArrowLeft, Compass, Home, SearchX } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-slate-50 via-blue-50/70 to-amber-50/80 px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-44 w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-blue-700/40 via-sky-500/35 to-amber-400/40 blur-lg" />
        <Card className="relative overflow-hidden rounded-4xl border border-blue-100/70 bg-white/90 shadow-2xl backdrop-blur-xl">
          <CardContent className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="text-center">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <SearchX className="h-8 w-8" />
              </div>

              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Compass className="h-3.5 w-3.5" />
                Halaman tidak ditemukan
              </div>

              <div className="mb-2 text-5xl font-black tracking-tight text-blue-900 sm:text-6xl">
                404
              </div>

              <h1 className="mb-2 text-2xl font-black text-slate-900 sm:text-3xl">
                Halaman Tidak Ditemukan
              </h1>

              <p className="mx-auto mb-7 max-w-md text-sm text-slate-600 sm:text-base">
                Maaf, halaman yang Anda tuju tidak tersedia atau sudah dipindahkan.
                Gunakan tombol di bawah untuk kembali ke alur utama aplikasi.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="h-11 bg-blue-700 text-white shadow-lg shadow-blue-900/15 hover:bg-blue-800"
                >
                  <Link to={ROUTES.HOME}>
                    <Home className="mr-2 h-4 w-4" />
                    Ke Beranda
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Link to={ROUTES.LOGIN}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Ke Login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
