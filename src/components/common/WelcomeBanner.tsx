import React from "react";
import type { UserRole } from "@/types/auth.types";

interface WelcomeBannerProps {
  role: UserRole;
  userName?: string;
  title?: string;
  subTitle: string;
  extraChips?: string[];
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
}

export function WelcomeBanner({
  role,
  userName,
  title,
  subTitle,
  extraChips = [],
  secondaryAction,
  primaryAction,
}: WelcomeBannerProps) {
  // Determine role tag text
  const getRoleTag = (userRole: UserRole) => {
    switch (userRole) {
      case "admin":
        return "ADMIN";
      case "dosen":
        return "DOSEN";
      case "laboran":
        return "LABORAN";
      case "mahasiswa":
        return "MAHASISWA";
      default:
        return String(userRole).toUpperCase();
    }
  };

  // Determine default title sapaan
  const getWelcomeTitle = () => {
    if (title) return title;
    if (role === "admin") return "Panel Administrasi";
    return `Selamat datang, ${userName || "User"}`;
  };

  return (
    <div className="welcome-banner">
      {/* Sisi Kiri */}
      <div className="relative z-10 flex-1 min-w-0">
        {/* Tag role */}
        <div className="welcome-banner-tag">{getRoleTag(role)}</div>

        {/* Judul sapaan */}
        <h2 className="welcome-banner-title">{getWelcomeTitle()}</h2>

        {/* Sub-judul */}
        <p className="welcome-banner-subtitle">{subTitle}</p>

        {/* Tag chips */}
        <div className="welcome-banner-chips">
          {/* Chip status online */}
          <div className="welcome-banner-chip-online">● Online</div>

          {/* Extra chips */}
          {extraChips.map((chip, idx) => (
            <div key={idx} className="welcome-banner-chip-extra">
              {chip}
            </div>
          ))}
        </div>
      </div>

      {/* Sisi Kanan */}
      <div className="welcome-banner-actions">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="welcome-banner-btn-secondary"
          >
            {secondaryAction.icon}
            <span>{secondaryAction.label}</span>
          </button>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="welcome-banner-btn-primary"
          >
            {primaryAction.icon}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default WelcomeBanner;
