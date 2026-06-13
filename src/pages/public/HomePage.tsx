/**
 * Landing Page – Sistem Praktikum PWA
 * Akademi Kebidanan Mega Buana
 *
 * Redesign: Aurora glassmorphism + Crimson Pro editorial typography
 * - Aurora animated background (uses existing .aurora-bg CSS classes)
 * - Glassmorphism cards (.glass-panel from index.css)
 * - Crimson Pro display font (.akbid-font-display from index.css)
 * - Fluid typography with clamp()
 * - Maroon #7B1D3A as brand color
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import akbidLogo from "@/assets/akbid-logo-asli.png";
import {
  ArrowRight, Bell, BookOpen, Brain, Calendar, CheckCircle,
  ClipboardList, FileText, FlaskConical, GraduationCap,
  BarChart2, Menu, Settings, Shield, Smartphone,
  Stethoscope, Wifi, WifiOff, Wrench, X,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────

const MODULES = [
  { icon: Calendar,      title: "Jadwal Praktikum",  desc: "Penjadwalan otomatis dengan notifikasi pengingat untuk semua peran.",       cls: "bg-rose-100/80 text-rose-700" },
  { icon: BookOpen,      title: "Logbook Digital",   desc: "Pencatatan kegiatan digital, mudah diisi dan tersimpan aman di cloud.",     cls: "bg-amber-100/80 text-amber-700" },
  { icon: ClipboardList, title: "Presensi",           desc: "Rekam kehadiran mahasiswa dan dosen secara real-time dan akurat.",           cls: "bg-blue-100/80 text-blue-700" },
  { icon: FileText,      title: "Materi & Bank Soal", desc: "Distribusi materi ajar dan bank soal langsung ke mahasiswa.",               cls: "bg-purple-100/80 text-purple-700" },
  { icon: BarChart2,     title: "Tugas & Penilaian",  desc: "Pengumpulan tugas dan penilaian terstruktur dengan laporan otomatis.",      cls: "bg-green-100/80 text-green-700" },
  { icon: Brain,         title: "Kuis Online",        desc: "Ujian digital dengan penilaian otomatis dan rekap hasil instan.",           cls: "bg-indigo-100/80 text-indigo-700" },
  { icon: Wrench,        title: "Peminjaman Alat",    desc: "Pengajuan dan persetujuan peminjaman peralatan lab secara digital.",        cls: "bg-orange-100/80 text-orange-700" },
  { icon: Bell,          title: "Notifikasi Pintar",  desc: "Push notification otomatis untuk setiap pembaruan penting.",               cls: "bg-teal-100/80 text-teal-700" },
];

const ROLES = [
  {
    icon: GraduationCap, role: "Mahasiswa", gradient: "from-rose-500 to-rose-700",
    desc: "Akses jadwal, logbook, presensi, dan nilai dari satu platform.",
    features: ["Lihat & konfirmasi jadwal", "Isi logbook digital harian", "Presensi satu ketuk", "Ikuti kuis & unduh materi", "Pantau nilai real-time"],
  },
  {
    icon: Stethoscope, role: "Dosen", gradient: "from-violet-500 to-violet-700",
    desc: "Kelola sesi praktikum, evaluasi mahasiswa, dan pantau progres.",
    features: ["Buat & kelola jadwal", "Verifikasi logbook mahasiswa", "Input & publish nilai", "Buat kuis & bank soal", "Ajukan peminjaman alat"],
  },
  {
    icon: FlaskConical, role: "Laboran", gradient: "from-teal-500 to-teal-700",
    desc: "Pantau penggunaan lab, inventaris alat, dan koordinasi dosen.",
    features: ["Monitoring jadwal lab", "Manajemen inventaris", "Proses peminjaman alat", "Laporan kondisi lab", "Notifikasi ketersediaan"],
  },
  {
    icon: Settings, role: "Administrator", gradient: "from-slate-600 to-slate-800",
    desc: "Kelola seluruh sistem: pengguna, kelas, mata kuliah, laboratorium.",
    features: ["Manajemen pengguna & peran", "Kelola kelas & mata kuliah", "Manajemen lab & alat", "Monitoring sinkronisasi", "Laporan & analitik"],
  },
];

const FLOW = [
  { step: "01", title: "Perencanaan",  desc: "Admin menyusun jadwal praktikum dan mendistribusikan ke semua pengguna." },
  { step: "02", title: "Pelaksanaan",  desc: "Mahasiswa presensi, mengisi logbook, dan mengakses materi secara digital." },
  { step: "03", title: "Evaluasi",     desc: "Dosen menilai logbook, memberi feedback, dan menginput nilai akhir." },
  { step: "04", title: "Sinkronisasi", desc: "Semua data tersimpan dan tersinkronisasi antar perangkat otomatis." },
];

const TICKER = [
  "✦ Jadwal Praktikum","✦ Logbook Digital","✦ Presensi Otomatis",
  "✦ Kuis Online","✦ Peminjaman Alat","✦ Bank Soal",
  "✦ Notifikasi Push","✦ PWA Installable","✦ Offline Ready",
  "✦ Manajemen Lab","✦ Sync Real-time","✦ Export Laporan",
];

// ─── useCounter hook ──────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          setCount(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ─── StatItem — own component so hook is called at top level ─────────────

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div className="text-center py-4 md:py-0">
      <p
        className="akbid-font-display font-bold leading-none"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
          background: "linear-gradient(135deg, #7B1D3A, #9B2448)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        <span ref={ref}>{count}</span>{suffix}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={scrolled ? { background: "rgba(248,250,252,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 1px 12px rgba(15,23,42,0.06)" } : {}}
    >
      <div className="app-container h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg,#7B1D3A,#4a0f22)" }}>
            {akbidLogo ? (
              <img src={akbidLogo} alt="AKBID" className="w-7 h-7 object-contain" />
            ) : (
              <FlaskConical className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <span className="akbid-font-display font-bold text-[13px] text-[var(--color-text-primary)] leading-none block tracking-tight">Sistem Praktikum</span>
            <span className="text-[10px] text-[var(--color-text-muted)] leading-none">AKBID Mega Buana</span>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {["Fitur", "Alur Kerja", "Peran"].map((l) => (
            <a key={l} href="#" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">{l}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-[var(--color-text-primary)] hover:text-[#7B1D3A] transition-colors">
            Masuk
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)" }}
          >
            Daftar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button className="md:hidden p-2 text-[var(--color-text-primary)]" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(248,250,252,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.5)" }}
          >
            <div className="app-container py-4 flex flex-col gap-4">
              {["Fitur", "Alur Kerja", "Peran"].map((l) => (
                <a key={l} href="#" className="text-sm font-medium text-[var(--color-text-primary)]">{l}</a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="flex-1 text-center px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-semibold rounded-xl">Masuk</Link>
                <Link to="/register" className="flex-1 text-center px-4 py-2.5 text-white text-sm font-semibold rounded-xl" style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)" }}>Daftar</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Decorative giant word */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span
          className="akbid-font-display font-bold italic text-[var(--color-text-primary)] whitespace-nowrap"
          style={{ fontSize: "clamp(8rem,22vw,18rem)", opacity: 0.025, lineHeight: 1 }}
        >
          Praktikum
        </span>
      </div>

      <div className="app-container relative grid lg:grid-cols-2 gap-14 items-center">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold rounded-full uppercase tracking-[0.2em] mb-7"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.6)", color: "#7B1D3A" }}
          >
            <Smartphone className="w-3 h-3" /> PWA · Offline Ready
          </span>

          <h1
            className="akbid-font-display font-bold leading-[1.05] tracking-tight text-[var(--color-text-primary)] mb-6"
            style={{ fontSize: "clamp(2.6rem,5vw,4.25rem)" }}
          >
            Kelola Praktikum<br />
            Lebih Mudah,{" "}
            <span style={{ background: "linear-gradient(135deg,#7B1D3A,#c0394f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Lebih Digital.
            </span>
          </h1>

          <p className="text-[1.0625rem] text-[var(--color-text-secondary)] leading-[1.75] mb-8 max-w-[430px]">
            Platform manajemen praktikum kebidanan yang menghubungkan mahasiswa, dosen, dan laboran dalam satu sistem terintegrasi — bekerja bahkan tanpa internet.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl text-[15px] hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)", boxShadow: "0 4px 16px rgba(123,29,58,0.3)" }}
            >
              Masuk ke Sistem <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl text-[15px] text-[var(--color-text-primary)] hover:opacity-90 transition-all"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.6)" }}
            >
              Lihat Fitur
            </a>
          </div>

          <div className="flex flex-wrap gap-5 text-[13px] text-[var(--color-text-muted)]">
            {["Akun dibuat oleh Admin", "Installable sebagai aplikasi", "Bisa dipakai offline"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7B1D3A" }} /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — App mockup */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: "linear-gradient(to right,#0F172A,#1E293B,#7B1D3A)" }}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>sistem-praktikum.akbid-megabuana.ac.id</span>
            </div>
            {/* Dashboard */}
            <div className="p-5" style={{ background: "rgba(255,255,255,0.45)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Selamat datang,</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Siti Nurhaliza · Mahasiswa</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                  <Wifi className="w-2.5 h-2.5" /> Online
                </span>
              </div>

              <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(123,29,58,0.06)", border: "1px solid rgba(123,29,58,0.1)" }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "#7B1D3A" }}>Jadwal Hari Ini</p>
                {[
                  { time: "08:00", title: "Praktikum Asuhan Kebidanan I", room: "Lab A" },
                  { time: "13:00", title: "Praktikum Keterampilan Dasar", room: "Lab B" },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 py-2 ${i === 0 ? "border-b" : ""}`} style={i === 0 ? { borderColor: "rgba(123,29,58,0.1)" } : {}}>
                    <span className="text-[10px] font-mono font-bold w-10" style={{ color: "#7B1D3A" }}>{s.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate">{s.title}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{s.room}</p>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7B1D3A" }} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[["Logbook","12/15","bg-rose-50 text-rose-700"],["Presensi","94%","bg-green-50 text-green-700"],["Nilai","A-","bg-violet-50 text-violet-700"]].map(([l,v,c],i) => (
                  <div key={i} className={`${c} rounded-lg p-2 text-center`}>
                    <p className="text-sm font-bold akbid-font-display">{v}</p>
                    <p className="text-[10px]">{l}</p>
                  </div>
                ))}
              </div>

              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2 text-white rounded-lg px-3 py-2"
                style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)" }}
              >
                <Bell className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] font-medium">Logbook Praktikum berhasil disimpan ✓</span>
              </motion.div>
            </div>
          </div>

          {/* Floating badges */}
          {[
            { Icon: Smartphone, text: "PWA Ready",    cls: "absolute -top-4 -right-4", dy: [0,6,0] as [number,number,number], delay: 0.5 },
            { Icon: WifiOff,    text: "Offline Mode", cls: "absolute -bottom-4 -left-4", dy: [0,-5,0] as [number,number,number], delay: 1 },
          ].map(({ Icon, text, cls, dy, delay }, i) => (
            <motion.div key={i}
              animate={{ y: dy }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay }}
              className={`${cls} glass-panel-strong rounded-xl px-3 py-2 flex items-center gap-2`}
            >
              <Icon className="w-4 h-4" style={{ color: "#7B1D3A" }} />
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="app-container mt-20">
        <div className="glass-panel rounded-2xl px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y-2 md:divide-y-0 md:divide-x divide-[var(--color-border)]">
            <StatItem value={4}   suffix=""   label="Peran Pengguna" />
            <StatItem value={8}   suffix="+"  label="Modul Aktif" />
            <StatItem value={100} suffix="%"  label="Berbasis Digital" />
            <StatItem value={24}  suffix="/7" label="Online & Offline" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────

function Ticker() {
  return (
    <div
      className="relative overflow-hidden py-4 my-10"
      style={{ background: "linear-gradient(to right,rgba(123,29,58,0.88),rgba(74,15,34,0.88),rgba(123,29,58,0.88))", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
    >
      <div className="marquee-track gap-10">
        {[...TICKER, ...TICKER].map((item, i) => (
          <span key={i} className="text-sm font-semibold whitespace-nowrap tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────

function Modules() {
  return (
    <section id="fitur" className="py-28 px-4">
      <div className="app-container">
        <div className="mb-16 max-w-2xl">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#7B1D3A" }}>— Modul Sistem</span>
          <h2
            className="akbid-font-display font-bold text-[var(--color-text-primary)] mt-4 leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}
          >
            Semua yang dibutuhkan<br />
            <em className="not-italic font-normal text-[var(--color-text-secondary)]" style={{ fontSize: "0.72em" }}>
              untuk praktikum kebidanan modern.
            </em>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.055 }}
                className="glass-panel rounded-xl p-5 h-full interactive-card"
              >
                <div className={`w-10 h-10 rounded-lg ${m.cls} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="akbid-font-display font-bold text-[var(--color-text-primary)] mb-1.5 text-[1.075rem] leading-tight">{m.title}</h3>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{m.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Flow ─────────────────────────────────────────────────────────────────

function FlowSection() {
  return (
    <section id="alur" className="py-28 px-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97),rgba(123,29,58,0.82))" }} />
      {/* Decorative large text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="akbid-font-display font-bold italic text-white whitespace-nowrap" style={{ fontSize: "clamp(6rem,18vw,15rem)", opacity: 0.03, lineHeight: 1 }}>Alur</span>
      </div>

      <div className="app-container relative">
        <div className="mb-16">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "rgba(252,165,165,0.8)" }}>— Alur Kerja</span>
          <h2
            className="akbid-font-display font-bold text-white mt-4 leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}
          >
            Dari perencanaan<br />
            <em className="not-italic font-normal" style={{ fontSize: "0.75em", color: "rgba(255,255,255,0.5)" }}>hingga evaluasi dan sinkronisasi.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          {FLOW.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="akbid-font-display font-bold text-white leading-none mb-2 select-none" style={{ fontSize: "clamp(3rem,5vw,5rem)", opacity: 0.12 }}>{f.step}</div>
              <div className="w-px h-6 mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
              <h3 className="akbid-font-display font-bold text-white mb-2 text-xl">{f.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Quote ────────────────────────────────────────────────────────────────

function Quote() {
  return (
    <section className="py-28 px-4">
      <div className="app-container max-w-4xl mx-auto">
        <div className="glass-panel rounded-2xl px-10 py-14 relative overflow-hidden">
          {/* Giant decorative quote mark */}
          <div
            className="absolute top-4 left-8 akbid-font-display font-bold leading-none select-none pointer-events-none"
            style={{ fontSize: "clamp(6rem,12vw,10rem)", color: "#7B1D3A", opacity: 0.1, lineHeight: 1 }}
          >"</div>
          <div className="relative">
            <p
              className="akbid-font-display italic text-[var(--color-text-primary)] leading-[1.5] mb-8"
              style={{ fontSize: "clamp(1.4rem,2.8vw,2.1rem)" }}
            >
              Dari logbook manual yang mudah hilang, ke sistem digital yang tersinkronisasi — praktikum kebidanan seharusnya seefisien ilmunya.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#7B1D3A,#9B2448)" }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">Tim Pengembang</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">AKBID Mega Buana</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────

function RolesSection() {
  return (
    <section id="peran" className="py-28 px-4">
      <div className="app-container">
        <div className="text-center mb-16">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#7B1D3A" }}>— Peran Pengguna</span>
          <h2
            className="akbid-font-display font-bold mt-4 text-[var(--color-text-primary)] leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}
          >
            Satu platform,{" "}
            <span style={{ background: "linear-gradient(135deg,#7B1D3A,#c0394f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              empat peran utama.
            </span>
          </h2>
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-4 max-w-xl mx-auto leading-relaxed">
            Setiap pengguna mendapatkan tampilan dan fitur yang disesuaikan dengan perannya.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ROLES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-xl overflow-hidden h-full interactive-card"
              >
                <div className={`bg-gradient-to-br ${r.gradient} px-5 pt-6 pb-10`}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="akbid-font-display text-2xl font-bold text-white mb-1 tracking-tight">{r.role}</h3>
                  <p className="text-[12.5px] leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>{r.desc}</p>
                </div>
                <div className="px-5 py-4 -mt-4 rounded-t-2xl" style={{ background: "rgba(255,255,255,0.55)" }}>
                  <ul className="space-y-2.5">
                    {r.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#7B1D3A" }} />
                        <span className="text-[13px] text-[var(--color-text-secondary)] leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="py-24 px-4">
      <div className="app-container max-w-4xl mx-auto relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0F172A,#1E293B,#7B1D3A)" }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
        {/* Decorative text */}
        <div className="absolute bottom-0 left-10 akbid-font-display font-bold italic leading-none select-none pointer-events-none" style={{ fontSize: "clamp(5rem,12vw,9rem)", color: "rgba(255,255,255,0.04)" }}>Mulai</div>

        <div className="relative px-8 py-16 text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 text-white text-[11px] font-bold rounded-full uppercase tracking-[0.2em] mb-6"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <Shield className="w-3 h-3" /> Akun dibuat oleh Administrator
          </span>
          <h2
            className="akbid-font-display font-bold text-white mb-5 leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
          >
            Siap memulai praktikum<br />yang lebih terorganisir?
          </h2>
          <p className="text-[15px] mb-9 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Hubungi administrator kampus Anda untuk mendapatkan akun dan mulai gunakan sistem praktikum digital AKBID Mega Buana.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white font-semibold rounded-xl text-[15px] hover:opacity-90 transition-colors"
              style={{ color: "#7B1D3A" }}
            >
              Masuk ke Sistem <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:admin@akbid-megabuana.ac.id"
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl text-white text-[15px] hover:opacity-80 transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Hubungi Admin
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-12 px-4" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.3)" }}>
      <div className="app-container grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg,#7B1D3A,#4a0f22)" }}>
              {akbidLogo ? (
                <img src={akbidLogo} alt="AKBID" className="w-7 h-7 object-contain" />
              ) : (
                <FlaskConical className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <span className="akbid-font-display font-bold text-[13px] text-[var(--color-text-primary)] leading-none block">Sistem Praktikum PWA</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">AKBID Mega Buana</span>
            </div>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-xs mb-4">
            Platform digital untuk mendukung kegiatan praktikum kebidanan secara efisien dan terstruktur.
          </p>
          <span className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
            <Smartphone className="w-3.5 h-3.5" style={{ color: "#7B1D3A" }} /> Installable sebagai aplikasi mobile
          </span>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-primary)] mb-4">Modul</p>
          <ul className="space-y-2">
            {["Jadwal Praktikum","Logbook Digital","Presensi","Bank Soal","Penilaian","Kuis Online","Peminjaman Alat","Notifikasi"].map((l) => (
              <li key={l}><a href="#" className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-primary)] mb-4">Pengguna</p>
          <ul className="space-y-2 mb-6">
            {["Mahasiswa","Dosen","Laboran","Administrator"].map((l) => (
              <li key={l}><a href="#" className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">{l}</a></li>
            ))}
          </ul>
          <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--color-text-primary)] mb-4">Informasi</p>
          <ul className="space-y-2">
            {["Tentang Sistem","Panduan Pengguna","Kontak"].map((l) => (
              <li key={l}><a href="#" className="text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-container mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-[var(--color-text-muted)]" style={{ borderTop: "1px solid rgba(255,255,255,0.3)" }}>
        <span>© 2026 Sistem Praktikum PWA — AKBID Mega Buana. Seluruh hak dilindungi.</span>
        <span className="flex items-center gap-1.5">
          <WifiOff className="w-3 h-3" style={{ color: "#7B1D3A" }} /> Tersedia dalam mode offline
        </span>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "var(--color-bg-secondary)" }}>
      {/* Aurora background — uses existing CSS classes from index.css */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      <div className="relative z-10">
        <NavBar />
        <main>
          <Hero />
          <Ticker />
          <Modules />
          <FlowSection />
          <Quote />
          <RolesSection />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default HomePage;
