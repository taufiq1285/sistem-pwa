import type { ReactElement } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  resetError?: () => void;
}

export function ErrorFallback({
  message,
  error,
  onRetry,
  resetError,
}: ErrorFallbackProps): ReactElement {
  const displayMessage =
    message || error?.message || "Terjadi kesalahan sistem yang tidak terduga.";
  const handleRetry = onRetry || resetError;

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 bg-destructive/5 rounded-2xl text-center max-w-lg mx-auto my-8 shadow-xs backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 text-destructive mb-4">
        <IconAlertTriangle className="h-7 w-7 animate-[pulse_2s_infinite]" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Terjadi Kesalahan
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-md break-words">
        {displayMessage}
      </p>
      {handleRetry && (
        <Button
          onClick={handleRetry}
          variant="destructive"
          className="px-6 rounded-xl flex items-center gap-2 font-semibold active:scale-[0.97] transition-transform duration-100 cursor-pointer"
        >
          <IconRefresh className="h-4 w-4 shrink-0" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

export default ErrorFallback;
