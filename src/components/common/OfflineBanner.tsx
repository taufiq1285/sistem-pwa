import { useState } from "react";
import { useOfflineContext } from "@/context/OfflineContext";
import { IconRefresh, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface OfflineBannerProps {
  onSync?: () => void;
  className?: string;
}

export function OfflineBanner({ onSync, className }: OfflineBannerProps) {
  const { isOffline } = useOfflineContext();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleSync = () => {
    if (onSync) {
      onSync();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`bg-amber-500 text-amber-950 px-4 py-3 rounded-xl border border-amber-400 shadow-sm flex items-center justify-between flex-wrap gap-2 transition-all duration-200 ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          Anda sedang offline — menampilkan data tersimpan
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          onClick={handleSync}
          disabled={isOffline}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-1 px-3 rounded shadow-xs disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          <IconRefresh className="h-3.5 w-3.5 mr-1.5 inline" />
          Sync sekarang
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-amber-600/20 transition-colors text-amber-950/80 hover:text-amber-950 cursor-pointer"
          aria-label="Dismiss"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default OfflineBanner;
