/**
 * Split-panel authentication layout for SiPraktik AKMB.
 * Supports login, register, forgot-password, and reset-password variants.
 */

import type { ReactNode } from "react";
import {
  IconCloudCheck,
  IconDeviceLaptop,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import logoSiPraktik from "@/assets/logoSiPraktik.jpeg";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  variant?: "login" | "register" | "forgot" | "reset";
  children: ReactNode;
  className?: string;
}

const featureItems = [
  {
    icon: IconShieldCheck,
    title: "Akses berbasis role",
    description: "Admin, dosen, mahasiswa, dan laboran punya ruang kerja aman.",
  },
  {
    icon: IconCloudCheck,
    title: "Offline-first PWA",
    description: "Tetap siap dipakai saat koneksi praktikum tidak stabil.",
  },
  {
    icon: IconDeviceLaptop,
    title: "Data praktikum terpadu",
    description:
      "Jadwal, materi, presensi, logbook, dan inventaris dalam satu sistem.",
  },
];

const steps = [
  {
    step: "01",
    title: "Pilih Role",
    desc: "Pilih Mahasiswa, Dosen, atau Laboran.",
  },
  {
    step: "02",
    title: "Isi Formulir",
    desc: "Data diri dan identitas akademik.",
  },
  { step: "03", title: "Aktivasi", desc: "Verifikasi email & approval admin." },
];

const stats = [
  { value: "100%", label: "Offline-Ready" },
  { value: "Instant", label: "Sinkronisasi" },
  { value: "Aman", label: "Enkripsi SSL" },
];

// Brand gradient: navy → dark-blue → maroon (consistent with landing page)
const BRAND_GRADIENT =
  "linear-gradient(145deg, #0F172A 0%, #1E293B 55%, #7B1D3A 100%)";

function BrandPanel({
  compact = false,
  variant,
}: {
  compact?: boolean;
  variant?: string;
}) {
  if (compact) {
    return (
      <div
        style={{ background: BRAND_GRADIENT }}
        className="flex h-[72px] items-center gap-3 px-5 text-white md:hidden shadow-sm relative z-20"
      >
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md ring-1 ring-white/50">
          <img
            src={logoSiPraktik}
            alt="Logo SiPraktik"
            className="size-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold leading-tight text-white">
            SiPraktik AKMB
          </p>
          <p className="text-xs text-white/80 truncate">
            Akademi Kebidanan Mega Buana
          </p>
        </div>
      </div>
    );
  }

  const isRegister = variant === "register";

  return (
    <aside
      style={{ background: BRAND_GRADIENT }}
      className="relative hidden min-h-screen overflow-hidden p-10 text-white md:flex md:flex-col md:justify-between animate-[fade-in_300ms_ease_both]"
      aria-label="Brand SiPraktik AKMB"
    >
      {/* Subtle radial decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.08),transparent_34%)] animate-pulse duration-[8s]" />
      {/* Decorative large background text */}
      <div className="absolute bottom-0 left-6 font-serif font-bold italic leading-none select-none pointer-events-none text-white/[0.04]" style={{ fontSize: "clamp(5rem,10vw,9rem)" }}>
        Praktikum
      </div>

      {/* Top — Logo & App Name */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl ring-1 ring-white/70">
          <img
            src={logoSiPraktik}
            alt="Logo SiPraktik"
            className="size-full object-contain"
          />
        </div>
        <div>
          <p className="text-[22px] font-bold leading-tight text-white">
            SiPraktik AKMB
          </p>
          <p className="text-xs font-medium text-white/80">
            Akademi Kebidanan Mega Buana
          </p>
        </div>
      </div>

      {/* Middle — Headline & Features */}
      <div
        className={cn(
          "relative z-10 max-w-xl space-y-8",
          isRegister ? "my-6 animate-[fade-in_300ms_ease_both]" : "my-auto",
        )}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-small font-medium text-white ring-1 ring-white/20">
            <IconSparkles className="size-4" aria-hidden="true" />
            Sistem praktikum modern
          </div>
          <h1 className="max-w-[15ch] text-[40px] font-semibold leading-[1.15] text-white">
            Praktikum kebidanan lebih rapi, cepat, dan siap offline.
          </h1>
          <p className="max-w-md text-body text-white/85">
            Kelola pembelajaran praktik, penilaian, peminjaman alat, dan
            sinkronisasi data dengan pengalaman PWA yang ringan.
          </p>
        </div>

        <div className="space-y-3">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex gap-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-xs"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-small font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-small text-white/78">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Register-only extras */}
        {isRegister && (
          <div className="space-y-6 pt-4 animate-[fade-in_400ms_ease_both]">
            {/* Steps */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Alur Pendaftaran
              </p>
              <div className="grid grid-cols-3 gap-3">
                {steps.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur-xs flex flex-col justify-between min-h-[96px] hover:bg-white/8 transition duration-150"
                  >
                    <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded w-fit select-none" style={{ color: "#7B1D3A" }}>
                      {item.step}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white mt-2 leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/70 leading-normal mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-lg font-bold text-white leading-tight">
                    {s.value}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-white/60 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md animate-[fade-in_500ms_ease_both] mt-4">
              <p className="text-xs italic text-white/90 leading-relaxed">
                "Sangat memudahkan praktikum kebidanan saya! SiPraktik sangat
                responsif dan siap offline saat saya mencatat logbook di
                laboratorium."
              </p>
              <div className="flex items-center gap-2.5 mt-3">
                <div
                  className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white uppercase select-none"
                  style={{ background: "#7B1D3A" }}
                >
                  TM
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white">
                    Tiara Mahendra
                  </p>
                  <p className="text-[9px] text-white/60">
                    Mahasiswa Kebidanan, Angkatan 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-small font-medium text-white ring-1 ring-white/20">
        <IconDeviceLaptop className="size-4" aria-hidden="true" />
        Dapat diinstal sebagai aplikasi
      </div>
    </aside>
  );
}

export function AuthLayout({
  variant = "login",
  children,
  className,
}: AuthLayoutProps) {
  const isRegister = variant === "register";

  const brandPanel = <BrandPanel variant={variant} />;

  const formPanel = (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-bg-secondary py-5 px-6 md:min-h-screen md:p-10 lg:p-14 overflow-y-auto scroll-smooth">
      <div className="w-full max-w-[520px] space-y-6">
        <span className="sr-only">AKBID Mega Buana</span>
        <span className="sr-only">Sistem Praktikum Kebidanan</span>

        {/* Desktop mini logo header */}
        <div className="hidden md:flex items-center gap-4 animate-[fade-in_300ms_ease_both]">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            <img
              src={logoSiPraktik}
              alt="Logo SiPraktik"
              className="size-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "#7B1D3A" }}>
              SiPraktik AKMB
            </span>
            <span className="text-small font-medium text-text-muted">
              Selamat datang di Sistem Informasi Praktikum
            </span>
          </div>
        </div>

        {children}
      </div>
    </main>
  );

  return (
    <div
      className={cn(
        "min-h-screen bg-bg-secondary font-sans flex flex-col md:block",
        className,
      )}
    >
      <BrandPanel compact variant={variant} />
      <div
        className={cn(
          "grid min-h-[calc(100vh-72px)] grid-cols-1 md:min-h-screen",
          isRegister ? "md:grid-cols-[58fr_42fr]" : "md:grid-cols-[42fr_58fr]",
        )}
      >
        {isRegister ? (
          <>
            {formPanel}
            {brandPanel}
          </>
        ) : (
          <>
            {brandPanel}
            {formPanel}
          </>
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
