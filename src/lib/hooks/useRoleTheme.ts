import { useAuth } from "./useAuth";
import type { UserRole } from "@/types/auth.types";

export type RoleTheme = {
  sidebarBg: string;
  sidebarHover: string;
  sidebarActive: string;
  accentText: string;
  accentBorder: string;
  badgeBg: string;
  primaryBtn: string;
  softBtn: string;
  headerGlow: string;
  avatarGradient: string;
  mobileBanner: string;
};

export const themeConfig: Record<UserRole, RoleTheme> = {
  admin: {
    sidebarBg: "bg-slate-950/95",
    sidebarHover: "hover:bg-slate-800/80",
    sidebarActive: "bg-slate-800/90 border-l-4 border-slate-300 text-white shadow-lg shadow-slate-950/20",
    accentText: "text-slate-600",
    accentBorder: "border-t-4 border-slate-600",
    badgeBg: "bg-slate-100 text-slate-800 border border-slate-200",
    primaryBtn: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm",
    softBtn: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    headerGlow: "via-slate-400/35",
    avatarGradient: "from-slate-700 via-slate-800 to-slate-950",
    mobileBanner: "from-slate-500/15 via-slate-400/5 to-transparent",
  },
  dosen: {
    sidebarBg: "bg-emerald-950/95",
    sidebarHover: "hover:bg-emerald-800/75",
    sidebarActive: "bg-emerald-800/90 border-l-4 border-emerald-300 text-white shadow-lg shadow-emerald-950/20",
    accentText: "text-emerald-600",
    accentBorder: "border-t-4 border-emerald-600",
    badgeBg: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    softBtn: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
    headerGlow: "via-emerald-400/35",
    avatarGradient: "from-emerald-500 via-emerald-700 to-emerald-950",
    mobileBanner: "from-emerald-500/15 via-emerald-400/5 to-transparent",
  },
  mahasiswa: {
    sidebarBg: "bg-indigo-950/95",
    sidebarHover: "hover:bg-indigo-800/75",
    sidebarActive: "bg-indigo-800/90 border-l-4 border-indigo-300 text-white shadow-lg shadow-indigo-950/20",
    accentText: "text-indigo-600",
    accentBorder: "border-t-4 border-indigo-600",
    badgeBg: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    primaryBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
    softBtn: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700",
    headerGlow: "via-indigo-400/35",
    avatarGradient: "from-indigo-500 via-indigo-700 to-indigo-950",
    mobileBanner: "from-indigo-500/15 via-indigo-400/5 to-transparent",
  },
  laboran: {
    sidebarBg: "bg-amber-950/95",
    sidebarHover: "hover:bg-amber-800/75",
    sidebarActive: "bg-amber-800/90 border-l-4 border-amber-300 text-white shadow-lg shadow-amber-950/20",
    accentText: "text-amber-600",
    accentBorder: "border-t-4 border-amber-600",
    badgeBg: "bg-amber-100 text-amber-800 border border-amber-200",
    primaryBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm",
    softBtn: "bg-amber-50 hover:bg-amber-100 text-amber-700",
    headerGlow: "via-amber-400/35",
    avatarGradient: "from-amber-400 via-amber-600 to-amber-950",
    mobileBanner: "from-amber-500/15 via-amber-400/5 to-transparent",
  },
};

export function useRoleTheme() {
  const { user } = useAuth();

  const metadataRole = (user as { user_metadata?: { role?: UserRole } } | null)
    ?.user_metadata?.role;

  const role = user?.role ?? metadataRole ?? "admin";

  return themeConfig[role] ?? themeConfig.admin;
}
