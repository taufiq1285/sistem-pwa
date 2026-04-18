/**
 * InstallPWAButton — Tombol Install Aplikasi PWA
 *
 * Muncul secara otomatis hanya jika browser mendukung dan app belum terinstall.
 * Tersembunyi setelah user menginstall atau menolak.
 */

import { useState } from "react";
import { Download, Smartphone, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";

// ============================================================================
// COMPONENT
// ============================================================================

export function InstallPWAButton() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Jangan render jika sudah terinstall, tidak bisa diinstall, atau sudah ditutup
  if (isInstalled || !isInstallable || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();

    if (accepted) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }

    setInstalling(false);
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-semibold text-success border border-success/30">
        <CheckCircle2 className="h-4 w-4" />
        <span className="hidden sm:inline">Berhasil diinstall!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        id="pwa-install-btn"
        variant="outline"
        size="sm"
        onClick={handleInstall}
        disabled={installing}
        title="Install aplikasi untuk akses offline lebih cepat"
        className="gap-2 border-primary/40 text-primary hover:bg-primary/5 transition-all duration-200 hover:border-primary hover:shadow-sm"
      >
        {installing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <span className="hidden sm:inline">Menginstall...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
            <Smartphone className="h-4 w-4 sm:hidden" />
          </>
        )}
      </Button>

      {/* Tombol dismiss kecil */}
      <button
        onClick={() => setDismissed(true)}
        title="Tutup"
        aria-label="Tutup banner install"
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default InstallPWAButton;
