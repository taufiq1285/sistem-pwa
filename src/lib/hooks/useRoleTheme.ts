import { useEffect } from "react";
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
    sidebarBg: "bg-role-sidebar-bg",
    sidebarHover: "hover:bg-role-sidebar-dark/45",
    sidebarActive:
      "bg-role-accent text-white shadow-lg shadow-role-sidebar-dark/20",
    accentText: "text-role-accent-text",
    accentBorder: "border-role-accent",
    badgeBg: "bg-role-label-bg text-role-label-text border border-role-accent/10",
    primaryBtn: "bg-role-accent hover:bg-role-accent-hover text-white shadow-sm",
    softBtn: "bg-role-accent-light hover:bg-role-accent-light/80 text-role-accent-text",
    headerGlow: "via-role-accent/35",
    avatarGradient: "bg-role-avatar-bg",
    mobileBanner: "bg-gradient-to-r from-role-banner-from to-role-banner-to",
  },
  dosen: {
    sidebarBg: "bg-role-sidebar-bg",
    sidebarHover: "hover:bg-role-sidebar-dark/45",
    sidebarActive:
      "bg-role-accent text-white shadow-lg shadow-role-sidebar-dark/20",
    accentText: "text-role-accent-text",
    accentBorder: "border-role-accent",
    badgeBg: "bg-role-label-bg text-role-label-text border border-role-accent/10",
    primaryBtn: "bg-role-accent hover:bg-role-accent-hover text-white shadow-sm",
    softBtn: "bg-role-accent-light hover:bg-role-accent-light/80 text-role-accent-text",
    headerGlow: "via-role-accent/35",
    avatarGradient: "bg-role-avatar-bg",
    mobileBanner: "bg-gradient-to-r from-role-banner-from to-role-banner-to",
  },
  mahasiswa: {
    sidebarBg: "bg-role-sidebar-bg",
    sidebarHover: "hover:bg-role-sidebar-dark/45",
    sidebarActive:
      "bg-role-accent text-white shadow-lg shadow-role-sidebar-dark/20",
    accentText: "text-role-accent-text",
    accentBorder: "border-role-accent",
    badgeBg: "bg-role-label-bg text-role-label-text border border-role-accent/10",
    primaryBtn: "bg-role-accent hover:bg-role-accent-hover text-white shadow-sm",
    softBtn: "bg-role-accent-light hover:bg-role-accent-light/80 text-role-accent-text",
    headerGlow: "via-role-accent/35",
    avatarGradient: "bg-role-avatar-bg",
    mobileBanner: "bg-gradient-to-r from-role-banner-from to-role-banner-to",
  },
  laboran: {
    sidebarBg: "bg-role-sidebar-bg",
    sidebarHover: "hover:bg-role-sidebar-dark/45",
    sidebarActive:
      "bg-role-accent text-white shadow-lg shadow-role-sidebar-dark/20",
    accentText: "text-role-accent-text",
    accentBorder: "border-role-accent",
    badgeBg: "bg-role-label-bg text-role-label-text border border-role-accent/10",
    primaryBtn: "bg-role-accent hover:bg-role-accent-hover text-white shadow-sm",
    softBtn: "bg-role-accent-light hover:bg-role-accent-light/80 text-role-accent-text",
    headerGlow: "via-role-accent/35",
    avatarGradient: "bg-role-avatar-bg",
    mobileBanner: "bg-gradient-to-r from-role-banner-from to-role-banner-to",
  },
};

const userRoles = ["admin", "dosen", "mahasiswa", "laboran"] as const satisfies readonly UserRole[];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

function getAuthUserRole(user: ReturnType<typeof useAuth>["user"]): UserRole | null {
  if (!user) return null;

  if (isUserRole(user.role)) {
    return user.role;
  }

  const metadata =
    typeof user.user_metadata === "object" && user.user_metadata !== null
      ? (user.user_metadata as Record<string, unknown>)
      : null;

  return isUserRole(metadata?.role) ? metadata.role : null;
}

export function useRoleTheme(): void {
  const { user } = useAuth();
  const role = getAuthUserRole(user);

  useEffect(() => {
    const root = document.documentElement;

    if (!role) {
      root.removeAttribute("data-role");
      return;
    }

    root.setAttribute("data-role", role);

    return () => {
      root.removeAttribute("data-role");
    };
  }, [role]);
}

export function useRoleThemeConfig(): RoleTheme {
  const { user } = useAuth();
  const role = getAuthUserRole(user) ?? "admin";

  return themeConfig[role] ?? themeConfig.admin;
}
