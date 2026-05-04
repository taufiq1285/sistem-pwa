import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCw, X } from "lucide-react";

export interface UpdatePromptProps {
  open: boolean;
  onUpdate: () => void | Promise<void>;
  onDismiss: () => void;
  isUpdating?: boolean;
  title?: string;
  description?: string;
}

export function UpdatePrompt({
  open,
  onUpdate,
  onDismiss,
  isUpdating = false,
  title = "Update Tersedia",
  description = "Versi baru aplikasi sudah tersedia.",
}: UpdatePromptProps) {
  if (!open) return null;

  return (
    <div
      id="pwa-update-notification"
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 left-1/2 z-[9999] w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border border-white/20 bg-gradient-to-r from-[#7A66D1] via-[#7460C8] to-[#5F7BE8] p-4 text-white shadow-[0_20px_60px_rgba(80,70,160,0.35)] backdrop-blur-md",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">
            {isUpdating ? "Menerapkan pembaruan aplikasi..." : description}
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="h-10 rounded-full bg-white px-4 text-[#5F5BE8] hover:bg-white/95"
          onClick={onUpdate}
          disabled={isUpdating}
        >
          <RotateCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
          {isUpdating ? "Memperbarui..." : "Perbarui Sekarang"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-10 rounded-full border border-white/20 px-3 text-white hover:bg-white/10 hover:text-white"
          onClick={onDismiss}
          disabled={isUpdating}
        >
          <X className="h-4 w-4" />
          Nanti
        </Button>
      </div>
    </div>
  );
}
