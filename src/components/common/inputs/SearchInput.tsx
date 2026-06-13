/**
 * Search input with leading icon and clear action.
 */

import { forwardRef } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type"
> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, disabled, ...props }, ref) => (
    <div className="relative">
      <IconSearch
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        disabled={disabled}
        className={cn("pl-10 pr-10", className)}
        {...props}
      />
      {String(value ?? "").length > 0 && onClear && (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Bersihkan pencarian"
        >
          <IconX className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  ),
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
