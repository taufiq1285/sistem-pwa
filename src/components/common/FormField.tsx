/**
 * Reusable form field wrapper with label, hint, error, and valid state.
 */

import type { ReactNode } from "react";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  isValid?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  name,
  label,
  required = false,
  hint,
  error,
  isValid = false,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={name}
          className="text-[13px] font-medium leading-none text-text-secondary"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {isValid && !error && (
          <IconCircleCheck
            className="size-3.5 animate-fade-in text-success"
            aria-label={`${label} valid`}
          />
        )}
      </div>
      {children}
      {hint && !error && <p className="text-small text-text-muted">{hint}</p>}
      {error && (
        <p
          id={`${name}-error`}
          role="alert"
          className="field-error flex items-center gap-1.5 text-small font-medium text-danger"
        >
          <IconAlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
