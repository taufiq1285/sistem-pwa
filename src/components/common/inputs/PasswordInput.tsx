/**
 * Password input with lock icon and visibility toggle.
 */

import { forwardRef, useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type"
>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative">
        <IconLock
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <Input
          ref={ref}
          type={isVisible ? "text" : "password"}
          disabled={disabled}
          className={cn("pl-10 pr-10", className)}
          {...props}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsVisible((value) => !value)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        >
          {isVisible ? (
            <IconEyeOff className="size-4" aria-hidden="true" />
          ) : (
            <IconEye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
