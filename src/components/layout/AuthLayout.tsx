/**
 * AuthLayout — Full-Screen Dark Split Panel
 * SiPraktik AKMB · 2026 Design
 *
 * Strategi dark form panel:
 *   Override CSS variables (--color-bg-*, --color-text-*, --color-border dll)
 *   pada container form panel → shadcn Input/Button/Label/Alert otomatis gelap
 *   TANPA mengubah logika LoginForm / RegisterForm / ForgotPasswordPage / ResetPasswordPage
 *
 * Aurora background: menggunakan class .aurora-bg + .aurora-orb-* dari index.css
 */

import type { ReactNode, CSSProperties } from "react";
import {
  IconCloudCheck,
  IconDeviceLaptop,
  IconShieldCheck,
  IconSparkles,
  IconQuote,
} from "@tabler/icons-react";
import logoSiPraktik from "@/assets/logoSiPraktik.jpeg";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  variant?: "login" | "register" | "forgot" | "reset";
  children: ReactNode;
  className?: string;
}

// ─── Brand content per variant ────────────────────────────────────────────

const VARIANT_CONTENT: Record<
  NonNullable<AuthLayoutProps["variant"]>,
  { headline: string; sub: string; testimonialIdx: number }
> = {
  login: {
    headline: "Praktikum kebidanan lebih rapi, cepat, dan siap offline.",
    sub: "Akses jadwal, logbook, kuis, presensi, dan semua fitur dalam satu platform terintegrasi.",
    testimonialIdx: 0,
  },
  register: {
    headline: "Daftarkan akun dan mulai kelola praktikum digital.",
    sub: "Pilih peran Anda, lengkapi data — akun aktif setelah disetujui administrator.",
    testimonialIdx: 0,
  },
  forgot: {
    headline: "Lupa kata sandi? Kami siap membantu.",
    sub: "Masukkan email Anda dan kami kirimkan link reset ke kotak masuk dalam hitungan detik.",
    testimonialIdx: 1,
  },
  reset: {
    headline: "Buat kata sandi baru yang lebih aman.",
    sub: "Gunakan kombinasi huruf, angka, dan simbol untuk melindungi akun Anda.",
    testimonialIdx: 2,
  },
};

const TESTIMONIALS = [
  {
    quote:
      "SiPraktik membuat pencatatan logbook jauh lebih mudah. Saya bisa mengisi dari mana saja, bahkan tanpa internet.",
    name: "Siti Rahayu",
    role: "Mahasiswi D3 Kebidanan, Angkatan 2023",
    initials: "SR",
  },
  {
    quote:
      "Pemulihan akun sangat cepat dan mudah. Link reset sampai dalam hitungan detik.",
    name: "Dr. Hani Fitriani",
    role: "Dosen Praktikum, D3 Kebidanan",
    initials: "HF",
  },
  {
    quote:
      "Keamanan sistem ini sangat terjaga. Reset password berjalan mulus dan data tetap aman.",
    name: "Budi Santoso",
    role: "Laboran, Laboratorium Kebidanan",
    initials: "BS",
  },
];

const FEATURES = [
  { Icon: IconShieldCheck, label: "Akses aman berbasis role" },
  { Icon: IconCloudCheck,  label: "Offline-ready PWA" },
  { Icon: IconDeviceLaptop,label: "Installable semua perangkat" },
];

const STEPS = [
  { step: "01", title: "Pilih Role",    desc: "Mahasiswa, Dosen, atau Laboran." },
  { step: "02", title: "Isi Formulir",  desc: "Data diri & identitas akademik." },
  { step: "03", title: "Aktivasi",      desc: "Verifikasi email & approval admin." },
];

const STATS = [
  { value: "100%",    label: "Offline-Ready" },
  { value: "Instant", label: "Sinkronisasi" },
  { value: "Aman",    label: "Enkripsi SSL" },
];

const AVATAR_COLORS = ["#7B1D3A", "#1E3A5F", "#1A5C3A", "#4A1D8F", "#5C3A1A"];
const AVATAR_INITIALS = ["SR", "HF", "BS", "NR", "DK"];

// ─── Dark CSS variable overrides ──────────────────────────────────────────
// Shadcn/Radix components use these vars → otomatis ikut jadi gelap

const DARK_FORM_VARS: CSSProperties = {
  // Surfaces
  ["--color-bg-primary" as string]:    "rgba(255,255,255,0.05)",
  ["--color-bg-secondary" as string]:  "transparent",
  ["--color-bg-tertiary" as string]:   "rgba(255,255,255,0.04)",
  // Text
  ["--color-text-primary" as string]:  "rgba(255,255,255,0.92)",
  ["--color-text-secondary" as string]:"rgba(255,255,255,0.62)",
  ["--color-text-muted" as string]:    "rgba(255,255,255,0.40)",
  ["--color-text-disabled" as string]: "rgba(255,255,255,0.22)",
  // Borders & inputs
  ["--color-border" as string]:        "rgba(255,255,255,0.1)",
  ["--color-border-strong" as string]: "rgba(255,255,255,0.18)",
  ["--color-input-background" as string]: "rgba(255,255,255,0.06)",
  // Shadcn semantic tokens
  ["--color-background" as string]:    "transparent",
  ["--color-foreground" as string]:    "rgba(255,255,255,0.92)",
  ["--color-card" as string]:          "rgba(255,255,255,0.06)",
  ["--color-card-foreground" as string]:"rgba(255,255,255,0.92)",
  ["--color-muted" as string]:         "rgba(255,255,255,0.06)",
  ["--color-muted-foreground" as string]:"rgba(255,255,255,0.42)",
  ["--color-border-light" as string]:  "rgba(255,255,255,0.08)",
  ["--color-border-default" as string]:"rgba(255,255,255,0.1)",
  ["--role-focus-ring" as string]:     "#9B2448",
  // Popover / select
  ["--color-popover" as string]:       "rgba(20,12,18,0.98)",
  ["--color-popover-foreground" as string]:"rgba(255,255,255,0.92)",
  // Input slot override
  ["--color-input" as string]:         "rgba(255,255,255,0.08)",
};

// ─── Brand Panel (left, desktop only) ────────────────────────────────────

function BrandPanel({
  variant = "login",
}: {
  variant?: NonNullable<AuthLayoutProps["variant"]>;
}) {
  const c = VARIANT_CONTENT[variant];
  const t = TESTIMONIALS[c.testimonialIdx];
  const isRegister = variant === "register";

  return (
    <aside
      className="relative hidden md:flex flex-col justify-between min-h-screen overflow-hidden p-10"
      style={{
        background:
          "linear-gradient(148deg, rgba(10,15,28,0.9) 0%, rgba(20,28,50,0.75) 50%, rgba(100,22,46,0.6) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
      aria-label="Brand SiPraktik AKMB"
    >
      {/* Radial highlights */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.06) 0%, transparent 40%), " +
          "radial-gradient(circle at 80% 85%, rgba(123,29,58,0.15) 0%, transparent 40%)",
      }} />

      {/* Decorative large word */}
      <div
        className="absolute bottom-0 right-0 font-serif font-bold italic leading-none select-none pointer-events-none overflow-hidden text-right pr-2"
        style={{ fontSize: "clamp(7rem,12vw,13rem)", color: "rgba(255,255,255,0.025)", lineHeight: 0.9 }}
      >
        {variant === "login" ? "Masuk" : variant === "register" ? "Daftar" : variant === "forgot" ? "Reset" : "Baru"}
      </div>

      {/* TOP — Logo */}
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "linear-gradient(135deg,#7B1D3A,#9B2448)",
              filter: "blur(12px)",
              opacity: 0.55,
            }}
          />
          <div className="relative size-14 rounded-2xl overflow-hidden ring-1 ring-white/20 bg-white p-0.5 shadow-xl">
            <img
              src={logoSiPraktik}
              alt="Logo SiPraktik"
              className="size-full object-contain"
            />
          </div>
        </div>
        <div>
          <p className="text-[20px] font-bold text-white leading-tight">
            SiPraktik AKMB
          </p>
          <p className="text-[10px] text-white/45 mt-0.5 uppercase tracking-[0.15em]">
            Akademi Kebidanan Mega Buana
          </p>
        </div>
      </div>

      {/* MIDDLE — Headline, sub, features */}
      <div className="relative z-10 my-auto py-8 max-w-sm space-y-7">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold text-white/50 uppercase tracking-[0.18em] ring-1 ring-white/10" style={{ background: "rgba(255,255,255,0.06)" }}>
            <IconSparkles className="size-3 text-rose-300/70" />
            Sistem Praktikum 2025
          </div>
        </div>

        <h2
          className="font-bold text-white leading-[1.1] tracking-tight"
          style={{
            fontFamily: "'Crimson Pro', 'Georgia', serif",
            fontSize: "clamp(1.9rem,2.8vw,3rem)",
            backgroundImage: "none",
          }}
        >
          {c.headline.split(" ").map((word, i) => {
            const highlight = ["offline.", "digital.", "membantu.", "aman."].includes(word.toLowerCase());
            return highlight ? (
              <span key={i} style={{ background: "linear-gradient(135deg,#f9a8b4,#fda4af)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {word}{" "}
              </span>
            ) : (
              <span key={i}>{word} </span>
            );
          })}
        </h2>

        <p className="text-[13px] text-white/42 leading-[1.7]">{c.sub}</p>

        <div className="space-y-2.5">
          {FEATURES.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-[12.5px] text-white/38">
              <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
                <Icon className="size-3.5 text-white/55" />
              </div>
              {label}
            </div>
          ))}
        </div>

        {/* Register steps */}
        {isRegister && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              Alur Pendaftaran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STEPS.map((s) => (
                <div key={s.step} className="rounded-xl p-3 ring-1 ring-white/8 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-[9px] font-bold bg-white rounded px-1.5 py-0.5 w-fit" style={{ color: "#7B1D3A" }}>{s.step}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-white leading-tight">{s.title}</p>
                    <p className="text-[10px] text-white/45 mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/8 text-center">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-[15px] font-bold text-white">{s.value}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/38 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM — Testimonial + social proof */}
      <div className="relative z-10 space-y-4">
        {/* Testimonial card */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <IconQuote className="size-4 text-rose-300/40" />
          <p className="text-[12.5px] text-white/55 leading-relaxed italic">
            "{t.quote}"
          </p>
          <div className="flex items-center gap-2.5">
            <div
              className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)" }}
            >
              {t.initials}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white/75">{t.name}</p>
              <p className="text-[9.5px] text-white/35">{t.role}</p>
            </div>
          </div>
        </div>

        {/* Avatar social proof */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {AVATAR_INITIALS.map((ini, i) => (
              <div
                key={i}
                className="size-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{
                  background: AVATAR_COLORS[i],
                  outline: "2px solid rgba(10,15,28,0.9)",
                }}
              >
                {ini}
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-white/32">
            <strong className="text-white/55">500+</strong> pengguna aktif
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile top bar ───────────────────────────────────────────────────────

const MOBILE_LABEL: Record<NonNullable<AuthLayoutProps["variant"]>, string> = {
  login:    "Masuk ke akun Anda",
  register: "Buat akun baru",
  forgot:   "Lupa kata sandi",
  reset:    "Atur ulang kata sandi",
};

function MobileBar({ variant = "login" }: { variant?: NonNullable<AuthLayoutProps["variant"]> }) {
  return (
    <div
      className="md:hidden flex items-center gap-3 px-5 py-3.5"
      style={{
        background: "rgba(5,8,15,0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="size-8 rounded-xl overflow-hidden bg-white p-0.5 flex-shrink-0">
        <img src={logoSiPraktik} alt="SiPraktik" className="size-full object-contain" />
      </div>
      <div>
        <p className="text-[13px] font-bold text-white leading-none" style={{ fontFamily: "'Crimson Pro', serif" }}>
          SiPraktik AKMB
        </p>
        <p className="text-[10px] text-white/38 mt-0.5">{MOBILE_LABEL[variant]}</p>
      </div>
    </div>
  );
}

// ─── AuthLayout ───────────────────────────────────────────────────────────

export function AuthLayout({ variant = "login", children, className }: AuthLayoutProps) {
  const isRegister = variant === "register";

  return (
    <div
      className={cn("relative min-h-screen w-full overflow-hidden font-sans", className)}
      style={{ background: "#05080F" }}
    >
      {/* Aurora background — reuse existing CSS classes from index.css */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.04,
        }}
      />

      {/* Mobile top bar */}
      <div className="relative z-20">
        <MobileBar variant={variant} />
      </div>

      {/* Main grid */}
      <div
        className={cn(
          "relative z-10 grid min-h-[calc(100vh-56px)] grid-cols-1 md:min-h-screen",
          isRegister
            ? "md:grid-cols-[55fr_45fr]"
            : "md:grid-cols-[45fr_55fr]",
        )}
      >
        {/* Brand panel — always left for login/forgot/reset, right for register */}
        {isRegister ? (
          <>
            {/* Form first (left) */}
            <FormPanel variant={variant}>{children}</FormPanel>
            {/* Brand second (right) */}
            <BrandPanel variant={variant} />
          </>
        ) : (
          <>
            {/* Brand first (left) */}
            <BrandPanel variant={variant} />
            {/* Form second (right) */}
            <FormPanel variant={variant}>{children}</FormPanel>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Form Panel ───────────────────────────────────────────────────────────

function FormPanel({
  variant = "login",
  children,
}: {
  variant?: NonNullable<AuthLayoutProps["variant"]>;
  children: ReactNode;
}) {
  return (
    <main
      className="relative flex items-center justify-center min-h-full overflow-y-auto py-8 px-6 md:p-10 lg:p-14"
      // CSS variable overrides — shadcn/radix components pick these up automatically
      // This makes all Input, Button, Label, Alert, etc. render in dark style
      // WITHOUT touching any form component logic
      style={{
        ...DARK_FORM_VARS,
        borderLeft: "1px solid rgba(255,255,255,0.065)",
      } as CSSProperties}
    >
      {/* Subtle glow behind form */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(123,29,58,0.08), transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-[480px] xl:max-w-[520px] space-y-6">
        {/* Screen-reader labels */}
        <span className="sr-only">AKBID Mega Buana</span>
        <span className="sr-only">Sistem Praktikum Kebidanan</span>

        {/* Desktop mini logo header */}
        <div className="hidden md:flex items-center gap-4 animate-[fade-in_300ms_ease_both]">
          <div className="size-12 rounded-2xl overflow-hidden flex-shrink-0 bg-white p-0.5 shadow-lg ring-1 ring-white/10">
            <img
              src={logoSiPraktik}
              alt="Logo SiPraktik"
              className="size-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: "#9B5070" }}
            >
              SiPraktik AKMB
            </span>
            <span className="text-small font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sistem Informasi Praktikum Kebidanan
            </span>
          </div>
        </div>

        {/* Form content (LoginForm / RegisterForm / ForgotPassword / ResetPassword) */}
        {children}
      </div>
    </main>
  );
}

export default AuthLayout;
