/**
 * useInstallPrompt — PWA Install Prompt Hook
 *
 * Menangkap event `beforeinstallprompt` dari browser dan menyediakan fungsi
 * untuk memicu dialog installasi PWA secara programatik.
 *
 * Cara kerja:
 * 1. Browser menembak `beforeinstallprompt` saat PWA memenuhi kriteria installable
 * 2. Hook menyimpan event, mencegah prompt otomatis (e.preventDefault())
 * 3. Komponen UI bisa memanggil `promptInstall()` kapanpun (e.g. tombol Install)
 */

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Browser-native BeforeInstallPromptEvent (belum ada di TS lib standar)
 */
interface BeforeInstallPromptEvent extends Event {
  /** Tampilkan dialog install ke user */
  prompt(): Promise<void>;
  /** Hasil pilihan user setelah prompt */
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface UseInstallPromptResult {
  /** true jika PWA bisa diinstall (browser menembak beforeinstallprompt) */
  isInstallable: boolean;
  /** true jika app sudah berjalan di mode standalone (sudah terinstall) */
  isInstalled: boolean;
  /** Panggil untuk memunculkan dialog install browser */
  promptInstall: () => Promise<boolean>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan sebagai installed PWA (standalone/fullscreen)
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const isCurrentlyStandalone =
      standaloneQuery.matches ||
      // Safari iOS: navigator.standalone
      (
        "standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true
      );

    if (isCurrentlyStandalone) {
      setIsInstalled(true);
      return;
    }

    // Tangkap event beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Cegah browser menampilkan prompt mini-infobar otomatis
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Tandai sebagai terinstall saat browser menembak appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Perubahan display-mode (misal: user uninstall kemudian buka lagi di browser)
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  /**
   * Tampilkan dialog install browser dan kembalikan hasilnya.
   * @returns true jika user menerima, false jika menolak atau prompt tidak tersedia
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[PWA] Install prompt failed:", error);
      return false;
    }
  }, [deferredPrompt]);

  return { isInstallable, isInstalled, promptInstall };
}
