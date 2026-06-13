/**
 * Submit button with idle, loading, success, and error presentation.
 */

import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { SubmitState } from "@/lib/hooks/useSubmitState";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  state: SubmitState;
  label: string;
  loadingLabel?: string;
  className?: string;
}

export function SubmitButton({
  state,
  label,
  loadingLabel,
  className,
}: SubmitButtonProps) {
  const isLoading = state === "loading";

  return (
    <Button
      type="submit"
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? "Sedang memproses, mohon tunggu" : undefined}
      className={cn("w-full", className)}
    >
      {state === "loading" && (
        <>
          <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
          {loadingLabel ?? "Menyimpan..."}
        </>
      )}
      {state === "success" && (
        <>
          <IconCheck className="size-4 text-emerald-200" aria-hidden="true" />
          Tersimpan!
        </>
      )}
      {(state === "idle" || state === "error") && label}
    </Button>
  );
}

export default SubmitButton;
