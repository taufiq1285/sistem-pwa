/**
 * PWA Install Prompt Component
 *
 * Shows installation instructions based on device:
 * - iOS: Shows "Add to Home Screen" instructions
 * - Android/Desktop: Shows install button
 * - Already installed: Hidden
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  Share2,
  Download,
  Apple,
  Chrome,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { isIOS, isAndroid, isStandalone } from "@/lib/utils/device-detect";

export function PWAInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) {
      return;
    }

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
      if (isIOS()) {
        setIsOpen(true);
      }
    }, 3000);

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowPrompt(true);
      setIsOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handler as any);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Per my observation: The outcome can be 'accepted' or 'dismissed'
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsOpen(false);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowPrompt(false);
  };

  // Don't show if:
  // - Already installed as PWA
  // - No prompt to show
  // - User dismissed
  if (isStandalone() || !showPrompt || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Install Aplikasi
          </DialogTitle>
          <DialogDescription>
            {isIOS()
              ? "Install aplikasi di iPhone Anda untuk akses offline dan pengalaman seperti native app."
              : "Install aplikasi untuk akses offline dan pengalaman terbaik."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isIOS() ? (
            // iOS Instructions
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Apple className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">iOS Installation</p>
                  <p className="text-sm text-muted-foreground">
                    Untuk iPhone & iPad
                  </p>
                </div>
              </div>

              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                  <p>
                    Tap <strong>Share</strong> button{" "}
                    <Share2 className="inline h-4 w-4 mx-1" />
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    3
                  </span>
                  <p>
                    Tap <strong>"Add"</strong> to install
                  </p>
                </li>
              </ol>

              {/* Visual Guide */}
              <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
                <div className="text-center space-y-2">
                  <div className="flex justify-center items-center gap-2">
                    <Smartphone className="h-12 w-12 text-blue-500" />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Share2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tap Share → Add to Home Screen
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Android/Desktop Instructions
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                {isAndroid() ? (
                  <>
                    <Download className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Android Installation</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome/Edge browser
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Chrome className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Desktop Installation</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome/Edge browser
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Klik tombol <strong>Install</strong> di bawah untuk menginstal
                  aplikasi:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>✅ Akses offline penuh</li>
                  <li>✅ Tampilan seperti native app</li>
                  <li>✅ Notifikasi update otomatis</li>
                  <li>✅ Lebih cepat dan ringan</li>
                </ul>
              </div>

              <Button
                onClick={handleInstall}
                className="w-full"
                size="lg"
                disabled={!deferredPrompt}
              >
                <Download className="mr-2 h-5 w-5" />
                Install Aplikasi
              </Button>

              {!deferredPrompt && (
                <p className="text-xs text-center text-muted-foreground">
                  Install button akan muncul di address bar browser (icon +)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            Nanti Saja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
