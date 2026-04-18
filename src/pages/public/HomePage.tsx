/**
 * Landing Page – Sistem Praktikum PWA
 * Akademi Kebidanan Mega Buana
 *
 * Design  : ui-ux-pro-max (nextlevelbuilder) — Educational App #10
 * Style   : Feature-Rich Showcase + Claymorphism + Micro-interactions
 * Colors  : Indigo #4F46E5 + Orange #F97316
 * Fonts   : Outfit (heading) + Work Sans (body) — Geometric Modern
 *
 * Anti-template layers added:
 *  ① App UI Mockup (3-D browser frame with live dashboard preview)
 *  ② Scroll-reveal animations  (IntersectionObserver, no library)
 *  ③ Animated number counters  (requestAnimationFrame)
 *  ④ Marquee feature ticker    (CSS @keyframes, pause-on-hover)
 *  ⑤ SVG wave section dividers (dynamic, not flat borders)
 *  ⑥ Editorial quote section   (big typography, left-accent border)
 *  ⑦ Staggered card animations (data-delay 1-5)
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import akbidLogo from "@/assets/akbid-logo-asli.png";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FlaskConical,
  GraduationCap,
  BarChart3,
  Lock,
  MapPin,
  Shield,
  Smartphone,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

/* ─── Design Tokens (ui-ux-pro-max Educational App palette) ──── */
const C = {
  primary:   "#4F46E5",
  secondary: "#818CF8",
  cta:       "#F97316",
  ctaDark:   "#EA580C",
  bg:        "#EEF2FF",
  surface:   "#FFFFFF",
  alt:       "#F8FAFC",
  dark:      "#1E1B4B",
  body:      "#374151",
  muted:     "#6B7280",
  border:    "#E0E7FF",
  success:   "#059669",
  purple:    "#7C3AED",
} as const;

/* ─── SVG Wave Divider ─────────────────────────────────────────── */
function WaveDivider({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ display: "block", background: to, lineHeight: 0 }}>
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "72px", background: from }}
      >
        <path
          d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,0 L0,0 Z"
          fill={to}
        />
      </svg>
    </div>
  );
}

/* ─── Animated Counter (requestAnimationFrame) ─────────────────── */
function CountUp({
  target,
  suffix = "",
  duration = 1500,
  active,
}: {
  target: number;
  suffix?: string;
  duration?: number;
  active: boolean;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return (
    <>
      {val}
      {suffix}
    </>
  );
}

/* ─── App UI Mockup ────────────────────────────────────────────── */
function AppMockup() {
  const schedule = [
    { label: "Praktikum Anatomi",      time: "08:00–10:00", color: C.primary },
    { label: "Logbook Midwifery",      time: "10:30–12:00", color: C.cta },
    { label: "Evaluasi Laboratorium",  time: "13:00–15:00", color: C.purple },
  ];
  const stats = [
    { v: "12",  l: "Jadwal",    c: C.primary, bg: "#EEF2FF" },
    { v: "3",   l: "Tugas",     c: C.cta,     bg: "#FFF7ED" },
    { v: "98%", l: "Kehadiran", c: C.success, bg: "#F0FDF4" },
  ];

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      {/* ── Browser frame ─────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          border: `2px solid ${C.border}`,
          boxShadow:
            "0 32px 80px rgba(79,70,229,0.18), 0 8px 24px rgba(0,0,0,0.10)",
          transform: "rotateY(-6deg) rotateX(2deg)",
          transformStyle: "preserve-3d",
          background: C.surface,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            background: "#F1F5F9",
            borderBottom: "1px solid #E2E8F0",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", gap: "5px" }}>
            {["#FF5F57", "#FFBD2E", "#28CA41"].map((c) => (
              <span
                key={c}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: c,
                  display: "block",
                }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              background: "white",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "10px",
              color: "#94A3B8",
              textAlign: "center",
              maxWidth: "200px",
              margin: "0 auto",
            }}
          >
            sistem-praktikum.akbid.ac.id
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: "flex", height: "300px", overflow: "hidden" }}>
          {/* Sidebar */}
          <div
            style={{
              width: "52px",
              background: C.dark,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "14px 0",
              gap: "14px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.9)",
                }}
              />
            </div>
            {[true, false, false, false, false].map((active, i) => (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "9px",
                  background: active ? C.primary : "transparent",
                  border: active ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: active ? 1 : 0.4,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "3px",
                    border: "1.5px solid white",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div
            style={{
              flex: 1,
              background: "#F8FAFC",
              padding: "14px",
              overflow: "hidden",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    height: "9px",
                    width: "110px",
                    borderRadius: "4px",
                    background: C.dark,
                    marginBottom: "5px",
                  }}
                />
                <div
                  style={{
                    height: "7px",
                    width: "70px",
                    borderRadius: "4px",
                    background: "#CBD5E1",
                  }}
                />
              </div>
              <div
                style={{
                  height: "26px",
                  width: "72px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                  opacity: 0.9,
                }}
              />
            </div>
            {/* Stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "7px",
                marginBottom: "12px",
              }}
            >
              {stats.map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: s.bg,
                    border: `1.5px solid ${s.c}30`,
                    borderRadius: "10px",
                    padding: "8px 10px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: s.c,
                      fontFamily: "'Outfit', sans-serif",
                      margin: 0,
                    }}
                  >
                    {s.v}
                  </p>
                  <p
                    style={{
                      fontSize: "8px",
                      color: C.muted,
                      margin: 0,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
            {/* Schedule card */}
            <div
              style={{
                background: C.surface,
                borderRadius: "10px",
                border: `1.5px solid ${C.border}`,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    height: "8px",
                    width: "90px",
                    borderRadius: "3px",
                    background: C.dark,
                  }}
                />
                <div
                  style={{
                    height: "6px",
                    width: "40px",
                    borderRadius: "3px",
                    background: "#CBD5E1",
                  }}
                />
              </div>
              {schedule.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 0",
                    borderBottom: i < 2 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "32px",
                      borderRadius: "2px",
                      background: row.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: "7px",
                        width: "100px",
                        borderRadius: "3px",
                        background: "#1E293B",
                        marginBottom: "4px",
                      }}
                    />
                    <div
                      style={{
                        height: "6px",
                        width: "60px",
                        borderRadius: "3px",
                        background: "#CBD5E1",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "8px",
                      color: row.color,
                      fontWeight: 600,
                      padding: "2px 6px",
                      background: `${row.color}15`,
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating: saved notification */}
      <div
        style={{
          position: "absolute",
          bottom: "-14px",
          left: "-18px",
          background: "white",
          borderRadius: "14px",
          padding: "8px 14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: `2px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: "175px",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: C.success,
            flexShrink: 0,
            display: "block",
            animation: "float 2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: "11px", color: C.body, fontWeight: 600 }}>
          Logbook berhasil disimpan
        </span>
      </div>

      {/* Floating: PWA badge */}
      <div
        style={{
          position: "absolute",
          top: "-14px",
          right: "-14px",
          background: `linear-gradient(135deg, ${C.cta}, ${C.ctaDark})`,
          borderRadius: "12px",
          padding: "7px 14px",
          boxShadow: "0 6px 16px rgba(249,115,22,0.40)",
          animation: "float 4s ease-in-out infinite 1s",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "white",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          ✦ PWA Ready
        </span>
      </div>
    </div>
  );
}

/* ─── Marquee Ticker ───────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  { icon: <Calendar className="h-4 w-4" />,       text: "Jadwal Praktikum" },
  { icon: <BookOpen className="h-4 w-4" />,        text: "Logbook Digital" },
  { icon: <ClipboardCheck className="h-4 w-4" />, text: "Presensi Otomatis" },
  { icon: <BarChart3 className="h-4 w-4" />,       text: "Penilaian Real-time" },
  { icon: <Bell className="h-4 w-4" />,            text: "Notifikasi Push" },
  { icon: <Smartphone className="h-4 w-4" />,      text: "Installable PWA" },
  { icon: <Lock className="h-4 w-4" />,            text: "RBAC Security" },
  { icon: <Zap className="h-4 w-4" />,             text: "Offline Mode" },
  { icon: <Download className="h-4 w-4" />,        text: "Export Laporan" },
];

function MarqueeTicker() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      style={{
        background: C.dark,
        overflow: "hidden",
        padding: "11px 0",
        borderTop: `3px solid ${C.primary}`,
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <div
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 28px",
              color: "rgba(255,255,255,0.55)",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: C.secondary }}>{item.icon}</span>
            {item.text}
            {(i + 1) % MARQUEE_ITEMS.length === 0 && (
              <span
                style={{
                  marginLeft: "12px",
                  color: C.primary,
                  fontSize: "16px",
                  lineHeight: 1,
                }}
              >
                ◆
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page Component ──────────────────────────────────────── */
export function HomePage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  /* Scroll-reveal: one IntersectionObserver for all [data-reveal] */
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Counter trigger */
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Data (logic unchanged) ─────────────────────────────────── */
  const modules = [
    { no: "01", title: "Jadwal Praktikum", desc: "Penjadwalan sesi lab lintas kelas, dosen, dan laboran secara terpusat.", tag: "Jadwal", icon: <Calendar className="h-6 w-6" style={{ color: C.primary }} />, bg: "#EEF2FF", border: "#C7D2FE" },
    { no: "02", title: "Logbook Digital", desc: "Dokumentasi kegiatan praktikum, mudah diisi mahasiswa dan direview dosen.", tag: "Dokumentasi", icon: <BookOpen className="h-6 w-6" style={{ color: C.cta }} />, bg: "#FFF7ED", border: "#FED7AA" },
    { no: "03", title: "Presensi dan Kehadiran", desc: "Kehadiran tercatat cepat dan tersinkronisasi otomatis ke semua pihak.", tag: "Kehadiran", icon: <ClipboardCheck className="h-6 w-6" style={{ color: C.success }} />, bg: "#F0FDF4", border: "#BBF7D0" },
    { no: "04", title: "Materi dan Bank Soal", desc: "Dosen upload materi dan kelola bank soal untuk evaluasi berkelanjutan.", tag: "Akademik", icon: <BarChart3 className="h-6 w-6" style={{ color: C.purple }} />, bg: "#F5F3FF", border: "#DDD6FE" },
    { no: "05", title: "Tugas dan Penilaian", desc: "Pre-test, post-test, dan laporan tugas dalam satu alur penilaian terintegrasi.", tag: "Evaluasi", icon: <ClipboardList className="h-6 w-6" style={{ color: "#0891B2" }} />, bg: "#ECFEFF", border: "#A5F3FC" },
    { no: "06", title: "Notifikasi Real-time", desc: "Informasi jadwal, tugas, dan pengumuman tersampaikan tepat waktu ke semua peran.", tag: "Komunikasi", icon: <Bell className="h-6 w-6" style={{ color: C.cta }} />, bg: "#FFF7ED", border: "#FED7AA" },
  ];

  const flow = [
    { no: "01", title: "Perencanaan", desc: "Dosen dan laboran menyiapkan jadwal, ruang, dan kebutuhan alat laboratorium.", color: C.primary, bg: "#EEF2FF" },
    { no: "02", title: "Pelaksanaan", desc: "Mahasiswa menjalankan praktikum, mengisi presensi dan logbook secara langsung.", color: C.cta, bg: "#FFF7ED" },
    { no: "03", title: "Evaluasi", desc: "Dosen review logbook, memberi penilaian, dan umpan balik secara terstruktur.", color: C.purple, bg: "#F5F3FF" },
    { no: "04", title: "Sinkronisasi", desc: "Data tersimpan dan tersinkron aman ke server saat koneksi internet tersedia.", color: C.success, bg: "#F0FDF4" },
  ];

  const roles = [
    { label: "Mahasiswa", title: "Pelajar", icon: <GraduationCap className="h-7 w-7 text-white" />, color: C.primary, features: ["Akses jadwal praktikum", "Isi dan lihat logbook digital", "Kerjakan tugas dan lihat nilai", "Presensi otomatis", "Unduh materi praktikum"] },
    { label: "Dosen", title: "Pengajar", icon: <BookOpen className="h-7 w-7 text-white" />, color: C.cta, features: ["Kelola jadwal dan tugas", "Review dan nilai logbook", "Buat dan kelola bank soal", "Pantau kehadiran kelas", "Upload materi evaluasi"] },
    { label: "Laboran", title: "Teknisi Lab", icon: <FlaskConical className="h-7 w-7 text-white" />, color: C.purple, features: ["Kelola inventaris alat", "Persetujuan peminjaman", "Manajemen laboratorium", "Laporan operasional harian", "Koordinasi jadwal lab"] },
  ];

  /* ── JSX ────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen akbid-font-body overflow-x-hidden"
      style={{ backgroundColor: C.bg, color: C.body }}
    >
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          boxShadow: "0 1px 16px rgba(79,70,229,0.08)",
        }}
      >
        <div className="mx-auto flex h-[66px] max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <div
              style={{
                display: "flex",
                height: 40,
                width: 40,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                boxShadow: `0 4px 14px rgba(79,70,229,0.32)`,
              }}
            >
              <img src={akbidLogo} alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p
                className="text-[15px] font-semibold leading-tight"
                style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
              >
                Akademi Kebidanan Mega Buana
              </p>
              <p
                className="text-[11px] uppercase tracking-widest"
                style={{ color: C.muted }}
              >
                Sistem Informasi Praktikum
              </p>
            </div>
            <span
              className="hidden md:inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})` }}
            >
              PWA
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/login">
              <ButtonEnhanced
                size="sm"
                className="cursor-pointer font-semibold transition-all duration-200 hover:scale-[1.03]"
                style={{
                  background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                  color: "#fff",
                  border: "none",
                  boxShadow: `0 4px 14px rgba(79,70,229,0.35)`,
                }}
              >
                Masuk
              </ButtonEnhanced>
            </Link>
            <Link to="/register">
              <ButtonEnhanced
                size="sm"
                variant="outline"
                className="cursor-pointer font-semibold transition-colors duration-200 hover:bg-indigo-50"
                style={{ borderColor: C.border, color: C.primary }}
              >
                Daftar
              </ButtonEnhanced>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: C.bg, minHeight: "90vh", display: "flex", alignItems: "center" }}
      >
        {/* Ambient blobs */}
        <div
          className="pointer-events-none absolute right-0 top-0 rounded-full"
          style={{ width: 600, height: 600, opacity: 0.22, background: `radial-gradient(circle, ${C.primary}, transparent 70%)`, filter: "blur(80px)" }}
        />
        <div
          className="pointer-events-none absolute -left-32 bottom-0 rounded-full"
          style={{ width: 400, height: 400, opacity: 0.14, background: `radial-gradient(circle, ${C.cta}, transparent 70%)`, filter: "blur(80px)" }}
        />

        <div
          className="relative mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-4 py-16 sm:px-6 lg:gap-10 lg:py-20"
          style={{ width: "100%", gridTemplateColumns: "repeat(1, minmax(0, 1fr))" }}
        >
          <div className="grid grid-cols-1 gap-12 lg:gap-10 lg:grid-cols-[1.2fr_1fr]">
            {/* Left: Copy */}
            <div className="flex flex-col justify-center" data-reveal>
              {/* Eyebrow */}
              <div
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2"
                style={{
                  background: `linear-gradient(90deg, rgba(79,70,229,0.10), rgba(129,140,248,0.06))`,
                  border: `1px solid ${C.border}`,
                }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: C.primary }} />
                <span
                  className="text-[12px] font-semibold uppercase tracking-widest"
                  style={{ color: C.primary, fontFamily: "'Outfit', sans-serif" }}
                >
                  Sistem Informasi Praktikum · AKBID Mega Buana
                </span>
              </div>

              {/* Headline */}
              <h1
                className="mb-5"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: C.dark,
                  fontSize: "clamp(42px, 5vw, 68px)",
                  fontWeight: 800,
                  lineHeight: 1.03,
                }}
              >
                Kelola Praktikum
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${C.primary} 0%, ${C.cta} 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Lebih Mudah.
                </span>
              </h1>

              <p
                className="mb-3 text-[20px] font-medium"
                style={{ fontFamily: "'Outfit', sans-serif", color: C.muted }}
              >
                Satu platform, semua yang dibutuhkan.
              </p>

              <p
                className="mb-8 max-w-[460px] text-[16px] leading-[1.8]"
                style={{ color: C.body }}
              >
                Platform berbasis web untuk jadwal, logbook, tugas, presensi, dan
                pengelolaan laboratorium yang dirancang khusus untuk AKBID Mega Buana.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link to="/login">
                  <ButtonEnhanced
                    className="group cursor-pointer px-7 py-3 text-[15px] font-bold text-white transition-all duration-200 hover:scale-[1.04]"
                    style={{
                      background: `linear-gradient(135deg, ${C.cta}, ${C.ctaDark})`,
                      boxShadow: `0 6px 20px rgba(249,115,22,0.40)`,
                      border: "none",
                    }}
                  >
                    Masuk ke Sistem
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </ButtonEnhanced>
                </Link>
                <span
                  className="cursor-default text-[14px] underline underline-offset-4"
                  style={{ color: C.muted }}
                >
                  Belum punya akun? Hubungi admin
                </span>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                {[
                  { icon: <Shield className="h-4 w-4" />, label: "RBAC Security",   color: C.primary },
                  { icon: <Wifi className="h-4 w-4" />,   label: "Offline Ready",   color: C.success },
                  { icon: <Smartphone className="h-4 w-4" />, label: "Installable PWA", color: C.cta },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5" style={{ color: C.muted }}>
                    <span style={{ color: b.color }}>{b.icon}</span>
                    <span className="text-[13px] font-medium">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stats + Mockup */}
            <div className="hidden lg:flex flex-col gap-5" data-reveal data-delay="2">
              {/* Animated stats bar */}
              <div
                ref={statsRef}
                className="overflow-hidden rounded-3xl"
                style={{
                  border: `3px solid ${C.border}`,
                  background: C.surface,
                  boxShadow: `6px 6px 0px rgba(79,70,229,0.10)`,
                }}
              >
                <div className="grid grid-cols-3">
                  {[
                    { target: 4,   suffix: "",  label: "Peran",   color: C.primary },
                    { target: 7,   suffix: "+", label: "Modul",   color: C.cta },
                    { target: 100, suffix: "%", label: "Digital", color: C.success },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="px-4 py-5 text-center"
                      style={{ borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}
                    >
                      <p
                        className="text-[34px] font-extrabold leading-none"
                        style={{ fontFamily: "'Outfit', sans-serif", color: s.color }}
                      >
                        <CountUp target={s.target} suffix={s.suffix} active={statsActive} />
                      </p>
                      <p
                        className="mt-1 text-[11px] font-semibold uppercase tracking-widest"
                        style={{ color: C.muted }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="px-4 py-2 text-center text-[11px]"
                  style={{ color: C.muted, borderTop: `1px solid ${C.border}` }}
                >
                  Akademi Kebidanan Mega Buana · Sistem Terintegrasi
                </div>
              </div>

              {/* 3-D App mockup */}
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────── */}
      <MarqueeTicker />

      {/* ── VALUE STRIP ────────────────────────────────────────── */}
      <section style={{ background: C.primary }}>
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 sm:grid-cols-3 px-4 sm:px-6">
          {[
            { icon: <CheckCircle2 className="h-5 w-5 text-white" />, t: "Data Tersinkron",     s: "Semua aktivitas tercatat real-time" },
            { icon: <Shield className="h-5 w-5 text-white" />,        t: "Akses Berbasis Peran", s: "Setiap pengguna lihat yang relevan" },
            { icon: <Smartphone className="h-5 w-5 text-white" />,    t: "Bisa Diinstal di HP", s: "PWA tanpa perlu Play Store" },
          ].map((item, idx) => (
            <div
              key={item.t}
              className={`flex items-center gap-4 px-4 py-5 ${idx < 2 ? "border-b sm:border-b-0 sm:border-r border-indigo-400/30" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                {item.icon}
              </span>
              <div>
                <p
                  className="text-[14px] font-bold text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {item.t}
                </p>
                <p className="text-[13px] text-indigo-200">{item.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wave → modules */}
      <WaveDivider from={C.primary} to={C.alt} />

      {/* ── MODULES ────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6" style={{ background: C.alt }}>
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12" data-reveal>
            <span
              className="mb-3 inline-flex rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest"
              style={{ background: `${C.primary}15`, color: C.primary }}
            >
              Modul Utama
            </span>
            <h2
              className="text-[38px] font-extrabold leading-tight sm:text-[44px]"
              style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
            >
              Semua kebutuhan praktikum,
              <br />
              <span style={{ color: C.primary }}>dalam satu sistem.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <div
                key={m.no}
                data-reveal
                data-delay={String((i % 3) + 1)}
                className="group cursor-default rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: m.bg,
                  border: `3px solid ${m.border}`,
                  boxShadow: `5px 5px 0px ${m.border}`,
                }}
              >
                <p
                  className="mb-4 text-[52px] font-extrabold leading-none opacity-10"
                  style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
                >
                  {m.no}
                </p>
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: C.surface, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
                >
                  {m.icon}
                </div>
                <h3
                  className="mb-2 text-[18px] font-bold"
                  style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
                >
                  {m.title}
                </h3>
                <p className="mb-4 text-[14px] leading-[1.7]" style={{ color: C.body }}>
                  {m.desc}
                </p>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    background: C.surface,
                    color: C.muted,
                    border: `1.5px solid ${m.border}`,
                  }}
                >
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave → flow */}
      <WaveDivider from={C.alt} to={C.bg} />

      {/* ── FLOW ───────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6" style={{ background: C.bg }}>
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12" data-reveal>
            <span
              className="mb-3 inline-flex rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest"
              style={{ background: `${C.cta}15`, color: C.cta }}
            >
              Alur Praktikum
            </span>
            <h2
              className="text-[38px] font-extrabold leading-tight sm:text-[44px]"
              style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
            >
              Dari perencanaan{" "}
              <span style={{ color: C.cta }}>hingga evaluasi.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((f, i) => (
              <div
                key={f.no}
                data-reveal
                data-delay={String(i + 1)}
                className="rounded-3xl p-5 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: f.bg,
                  border: `3px solid ${f.color}30`,
                  boxShadow: `5px 5px 0px ${f.color}18`,
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-[14px] font-extrabold text-white"
                  style={{
                    background: f.color,
                    boxShadow: `0 4px 14px ${f.color}40`,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {f.no}
                </div>
                <p
                  className="mb-0.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: f.color }}
                >
                  Tahap {f.no}
                </p>
                <h3
                  className="mb-2 text-[18px] font-bold"
                  style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
                >
                  {f.title}
                </h3>
                <p className="text-[14px] leading-[1.7]" style={{ color: C.body }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE (editorial section) ──────────────────────────── */}
      <section
        data-reveal
        style={{ background: C.dark, padding: "80px 24px" }}
      >
        <div className="mx-auto max-w-[860px]">
          {/* Blockquote */}
          <div
            style={{
              borderLeft: `6px solid ${C.cta}`,
              paddingLeft: "36px",
            }}
          >
            <p
              style={{
                color: C.secondary,
                fontFamily: "'Outfit', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Mengapa Platform Ini?
            </p>
            <blockquote
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(22px, 3vw, 36px)",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.38,
                margin: 0,
              }}
            >
              "Dari logbook manual ke sistem digital — satu platform untuk semua
              kebutuhan praktikum kebidanan, dari perencanaan hingga evaluasi."
            </blockquote>
            <p
              style={{
                marginTop: "20px",
                color: "rgba(255,255,255,0.35)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              — Sistem Informasi Praktikum, AKBID Mega Buana
            </p>
          </div>

          {/* Mini stats row */}
          <div
            className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {[
              { v: "100%",   l: "Data terdigitalisasi",       c: C.secondary },
              { v: "4 Peran", l: "Pengguna terintegrasi",     c: C.cta },
              { v: "Offline", l: "Bisa diakses tanpa internet", c: C.success },
            ].map((s) => (
              <div
                key={s.l}
                style={{ borderTop: `2px solid ${s.c}45`, paddingTop: "16px" }}
              >
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: s.c,
                    margin: 0,
                  }}
                >
                  {s.v}
                </p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)", margin: 0 }}>
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave → roles */}
      <WaveDivider from={C.dark} to={C.alt} />

      {/* ── ROLES ──────────────────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6" style={{ background: C.alt }}>
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-12" data-reveal>
            <span
              className="mb-3 inline-flex rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest"
              style={{ background: `${C.purple}15`, color: C.purple }}
            >
              Untuk Siapa?
            </span>
            <h2
              className="text-[38px] font-extrabold leading-tight sm:text-[44px]"
              style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
            >
              Dibuat untuk{" "}
              <span style={{ color: C.purple }}>semua peran.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {roles.map((r, i) => (
              <div
                key={r.label}
                data-reveal
                data-delay={String(i + 1)}
                className="overflow-hidden rounded-3xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: C.surface,
                  border: `3px solid ${r.color}25`,
                  boxShadow: `6px 6px 0px ${r.color}12`,
                }}
              >
                <div
                  className="px-6 py-5"
                  style={{
                    background: `linear-gradient(135deg, ${r.color}10, ${r.color}04)`,
                    borderBottom: `2px solid ${r.color}18`,
                  }}
                >
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: r.color,
                      boxShadow: `0 4px 14px ${r.color}40`,
                    }}
                  >
                    {r.icon}
                  </div>
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{
                      background: `${r.color}15`,
                      color: r.color,
                      border: `1.5px solid ${r.color}30`,
                    }}
                  >
                    {r.label}
                  </span>
                  <h3
                    className="mt-2 text-[22px] font-bold"
                    style={{ fontFamily: "'Outfit', sans-serif", color: C.dark }}
                  >
                    {r.title}
                  </h3>
                </div>
                <div className="px-6 py-4">
                  {r.features.map((ft) => (
                    <div
                      key={ft}
                      className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
                      style={{ borderColor: "#F1F5F9" }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: r.color }} />
                      <span className="text-[14px]" style={{ color: C.body }}>
                        {ft}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave → CTA */}
      <WaveDivider from={C.alt} to={C.primary} />

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6"
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, #6D28D9 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 rounded-full opacity-20"
          style={{
            width: 320,
            height: 320,
            background: `radial-gradient(circle, ${C.cta}, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        <div className="relative mx-auto max-w-[640px] text-center" data-reveal>
          <span className="mb-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-white">
            Mulai Menggunakan
          </span>
          <h2
            className="mb-4 text-[42px] font-extrabold leading-tight text-white sm:text-[50px]"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Siap untuk praktikum
            <br />
            <span className="opacity-75">yang lebih terorganisir?</span>
          </h2>
          <p className="mb-8 text-[15px] leading-[1.75] text-white/70">
            Sistem ini dikelola institusi. Akun diberikan oleh admin AKBID Mega Buana.
            Hubungi administrator untuk mendapatkan akses.
          </p>
          <Link to="/login">
            <ButtonEnhanced
              className="group cursor-pointer px-10 py-3.5 text-[15px] font-bold text-white transition-all duration-200 hover:scale-[1.04]"
              style={{
                background: `linear-gradient(135deg, ${C.cta}, ${C.ctaDark})`,
                border: "none",
                boxShadow: "0 8px 28px rgba(249,115,22,0.50)",
              }}
            >
              Masuk ke Sistem
              <ArrowRight className="ml-2 inline h-4 w-4 transition-transform group-hover:translate-x-1" />
            </ButtonEnhanced>
          </Link>
          <p className="mt-4 text-[13px] text-white/40">
            Belum punya akun? Hubungi admin kampus untuk pendaftaran.
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer
        className="px-4 pb-8 pt-12 sm:px-6"
        style={{ background: C.dark, borderTop: `4px solid ${C.primary}` }}
      >
        <div className="mx-auto max-w-[1100px]">
          <div
            className="mb-8 grid grid-cols-1 gap-8 border-b pb-8 sm:grid-cols-[1.5fr_1fr]"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div
                  style={{
                    display: "flex",
                    height: 40,
                    width: 40,
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                    boxShadow: `0 4px 14px rgba(79,70,229,0.40)`,
                  }}
                >
                  <img src={akbidLogo} alt="Logo" className="h-7 w-7 object-contain" />
                </div>
                <div>
                  <p
                    className="text-[15px] font-semibold text-white/80"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Akademi Kebidanan Mega Buana
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-white/30">
                    Sistem Informasi Praktikum
                  </p>
                </div>
              </div>
              <p className="max-w-[320px] text-[14px] leading-[1.8] text-white/35">
                Platform digital untuk mendukung pembelajaran praktikum kebidanan
                yang efisien dan terstruktur di AKBID Mega Buana.
              </p>
            </div>

            <div>
              <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-white/25">
                Informasi Institusi
              </p>
              <div className="space-y-3 text-[14px] text-white/35">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: C.cta }} />
                  Akademi Kebidanan Mega Buana, Indonesia
                </div>
                <div className="flex items-start gap-2">
                  <Users className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: C.cta }} />
                  Mahasiswa · Dosen · Laboran · Admin
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="mt-[2px] h-3.5 w-3.5 shrink-0" style={{ color: C.cta }} />
                  Dapat diinstal sebagai PWA di perangkat mobile
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[13px] text-white/15">
            &copy; {new Date().getFullYear()} Akademi Kebidanan Mega Buana. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
