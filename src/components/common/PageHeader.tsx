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
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {breadcrumb.href ? (
                <button
                  onClick={() => navigate(breadcrumb.href!)}
                  className="transition-colors hover:text-slate-800"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span className="font-semibold text-slate-800">
                  {breadcrumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          {showBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mt-0.5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Kembali</span>
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {action}
          </div>
        )}
      </div>

      <Separator />
    </div>
  );
}

export default PageHeader;
