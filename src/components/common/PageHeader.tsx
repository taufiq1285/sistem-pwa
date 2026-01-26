/**
 * PageHeader Component
 * Reusable page header with title, description, breadcrumbs, and actions
 */

/**
 * PageHeader Component
 * Reusable page header with title, description, breadcrumbs, and actions
 */
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageHeader({
  title,
  description,
  breadcrumbs,
  action,
  showBack = false,
  onBack,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <span>/</span>}
              {breadcrumb.href ? (
                <button
                  onClick={() => navigate(breadcrumb.href!)}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">
                  {breadcrumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Back Button */}
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Kembali</span>
            </Button>
          )}

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-lg font-semibold max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {action && (
          <div className="shrink-0 flex items-center gap-2">{action}</div>
        )}
      </div>

      {/* Separator */}
      <Separator />
    </div>
  );
}

export default PageHeader;
