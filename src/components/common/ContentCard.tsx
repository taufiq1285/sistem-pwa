import React from "react";
import type { LucideIcon } from "lucide-react";

interface ContentCardProps {
  title: string;
  icon?: React.ReactNode;
  link?: {
    label: string;
    onClick: () => void;
  };
  isEmpty?: boolean;
  emptyState?: {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  children?: React.ReactNode;
  className?: string;
}

export function ContentCard({
  title,
  icon,
  link,
  isEmpty = false,
  emptyState,
  children,
  className = "",
}: ContentCardProps) {
  return (
    <div className={`content-card ${className}`}>
      {/* Card Header */}
      <div className="content-card-header">
        <div className="content-card-header-left">
          {icon && <div className="content-card-header-icon">{icon}</div>}
          <h4 className="content-card-title">{title}</h4>
        </div>
        {link && (
          <button
            type="button"
            className="content-card-link"
            onClick={link.onClick}
          >
            {link.label}
          </button>
        )}
      </div>

      {/* Card Content or Empty State */}
      {isEmpty && emptyState ? (
        <div className="content-card-empty-state">
          {emptyState.icon && (
            <div className="content-card-empty-icon">
              {React.createElement(emptyState.icon, {
                style: { width: "36px", height: "36px" },
              })}
            </div>
          )}
          <h5 className="content-card-empty-title">{emptyState.title}</h5>
          {emptyState.subtitle && (
            <p className="content-card-empty-subtitle">{emptyState.subtitle}</p>
          )}
          {emptyState.action && (
            <button
              type="button"
              onClick={emptyState.action.onClick}
              className="mt-1 font-semibold transition-all hover:bg-muted/50 border border-border-default px-3 py-1.5 rounded-md text-[11px] text-text-secondary"
              style={{ background: "transparent" }}
            >
              {emptyState.action.label}
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default ContentCard;
