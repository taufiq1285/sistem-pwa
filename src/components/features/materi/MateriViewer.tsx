/**
 * MateriViewer Component
 *
 * Purpose: View materi files inline (PDF, images, videos)
 * Features:
 * - PDF viewer
 * - Image viewer
 * - Video player
 * - Download button
 * - Fullscreen support
 */

import { useState } from "react";
import { Download, ExternalLink, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Materi } from "@/types/materi.types";
import { getFileTypeCategory, formatFileSize } from "@/lib/supabase/storage";
import { usePdfBlobUrl } from "@/lib/hooks/usePdfBlobUrl";

// ============================================================================
// TYPES
// ============================================================================

interface MateriViewerProps {
  /**
   * Materi to view
   */
  materi: Materi | null;

  /**
   * Is viewer open
   */
  open: boolean;

  /**
   * Callback when viewer closed
   */
  onClose: () => void;

  /**
   * Callback when download clicked
   */
  onDownload?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch PDF and open in new tab with correct Content-Type
 * This bypasses the Content-Type: application/json issue from Supabase Storage
 */
async function fetchAndOpenPdf(fileUrl: string) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch PDF");

    const blob = await response.blob();

    // Force create a new blob with correct MIME type
    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Open in new tab
    const newWindow = window.open(blobUrl, "_blank");
    if (!newWindow) {
      throw new Error("Failed to open new tab. Please check popup blocker.");
    }

    // Clean up blob URL after a delay (gives time for browser to load)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000); // 1 minute
  } catch (error) {
    console.error("Error opening PDF:", error);
    // Fallback: open original URL
    window.open(fileUrl, "_blank");
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MateriViewer({
  materi,
  open,
  onClose,
  onDownload,
}: MateriViewerProps) {
  const fileType = getFileTypeCategory(materi?.tipe_file || "");
  const canView = materi && ["pdf", "image", "video"].includes(fileType);

  // Use blob URL for PDF to bypass CORS
  const {
    blobUrl,
    loading: pdfLoading,
    error: pdfError,
  } = usePdfBlobUrl(materi || null, open && materi && fileType === "pdf");

  // Don't render anything if no materi or dialog is closed
  if (!materi || !open) return null;

  if (!canView) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => isOpen || onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{materi.judul}</DialogTitle>
            <DialogDescription>
              File ini tidak dapat ditampilkan. Silakan download untuk
              melihatnya.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            {onDownload && (
              <Button onClick={onDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen || onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{materi.judul}</DialogTitle>
              {materi.deskripsi ? (
                <DialogDescription className="mt-1">
                  {materi.deskripsi}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Preview materi {materi.judul}
                </DialogDescription>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                {formatFileSize(materi.file_size || 0)} •{" "}
                {fileType.toUpperCase()}
              </div>
            </div>

            <div className="flex gap-2">
              {onDownload && (
                <Button onClick={onDownload} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {fileType === "pdf" ? (
                <Button
                  onClick={() => {
                    // For PDF, fetch and open in new tab with correct Content-Type
                    fetchAndOpenPdf(materi.file_url);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Buka Tab Baru
                </Button>
              ) : (
                <Button
                  onClick={() => window.open(materi.file_url, "_blank")}
                  size="sm"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Buka Tab Baru
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Viewer Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {pdfLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Memuat PDF...</p>
              </div>
            </div>
          ) : pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p>Gagal memuat PDF</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pdfError.message}
                </p>
              </div>
            </div>
          ) : (
            <ViewerContent
              materi={materi}
              fileType={fileType}
              pdfBlobUrl={blobUrl}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// VIEWER CONTENT
// ============================================================================

interface ViewerContentProps {
  materi: Materi;
  fileType: string;
  pdfBlobUrl?: string | null;
}

function ViewerContent({ materi, fileType, pdfBlobUrl }: ViewerContentProps) {
  // For PDF, use blob URL if available to bypass CORS
  // For image and video, use direct URL
  const displayUrl =
    fileType === "pdf" && pdfBlobUrl ? pdfBlobUrl : materi.file_url;

  switch (fileType) {
    case "pdf":
      return <PDFViewer url={displayUrl} />;
    case "image":
      return <ImageViewer url={displayUrl} title={materi.judul} />;
    case "video":
      return <VideoViewer url={displayUrl} />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            File ini tidak dapat ditampilkan
          </p>
        </div>
      );
  }
}

// ============================================================================
// PDF VIEWER
// ============================================================================

function PDFViewer({ url }: { url: string }) {
  const [iframeError, setIframeError] = useState(false);

  // For PDF, embed it using iframe for inline viewing
  // If iframe fails, show fallback UI with download button
  if (iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg mb-2">PDF Viewer Tidak Tersedia</p>
        <p className="text-sm text-muted-foreground mb-6">
          Browser Anda tidak mendukung inline PDF viewing. Silakan buka di tab
          baru.
        </p>
        <Button onClick={() => window.open(url, "_blank")} size="lg">
          <ExternalLink className="h-4 w-4 mr-2" />
          Buka PDF di Tab Baru
        </Button>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      title="PDF Viewer"
      onError={() => {
        console.warn("PDF failed to load in iframe");
        setIframeError(true);
      }}
    />
  );
}

// ============================================================================
// IMAGE VIEWER
// ============================================================================

function ImageViewer({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <img
        src={url}
        alt={title}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

// ============================================================================
// VIDEO VIEWER
// ============================================================================

function VideoViewer({ url }: { url: string }) {
  return (
    <div className="flex items-center justify-center p-4 h-full">
      <video
        src={url}
        controls
        className="max-w-full max-h-full"
        preload="metadata"
      >
        Browser Anda tidak mendukung video player.
      </video>
    </div>
  );
}
