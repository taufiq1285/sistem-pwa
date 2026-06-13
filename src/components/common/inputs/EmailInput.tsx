/**
 * Email input with leading mail icon.
 */

import { forwardRef } from "react";
import { IconMail } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EmailInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type"
>;

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <IconMail
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="email"
        className={cn("pl-10", className)}
        {...props}
      />
    </div>
  ),
);

EmailInput.displayName = "EmailInput";

export default EmailInput;
