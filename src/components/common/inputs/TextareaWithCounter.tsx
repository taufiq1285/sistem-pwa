/**
 * Textarea with character counter and max length feedback.
 */

import { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaWithCounterProps extends React.ComponentPropsWithoutRef<
  typeof Textarea
> {
  value?: string;
  maxLength: number;
}

export const TextareaWithCounter = forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(({ className, value, maxLength, ...props }, ref) => {
  const count = String(value ?? "").length;
  const isOverLimit = count > maxLength;

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={cn("pb-8", className)}
        {...props}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-2 right-3 text-caption text-text-muted",
          isOverLimit && "font-semibold text-danger",
        )}
      >
        {count} / {maxLength} karakter
      </span>
    </div>
  );
});

TextareaWithCounter.displayName = "TextareaWithCounter";

export default TextareaWithCounter;
