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

import { Download, ExternalLink } from "lucide-react";
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
// COMPONENT
// ============================================================================

export function MateriViewer({
  materi,
  open,
  onClose,
  onDownload,
}: MateriViewerProps) {
  if (!materi) return null;

  const fileType = getFileTypeCategory(materi.tipe_file || "");
  const canView = ["pdf", "image", "video"].includes(fileType);

  if (!canView) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{materi.judul}</DialogTitle>
              {materi.deskripsi && (
                <DialogDescription className="mt-1">
                  {materi.deskripsi}
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
              <Button
                onClick={() => window.open(materi.file_url, "_blank")}
                size="sm"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Buka Tab Baru
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Viewer Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <ViewerContent materi={materi} fileType={fileType} />
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
}

function ViewerContent({ materi, fileType }: ViewerContentProps) {
  switch (fileType) {
    case "pdf":
      return <PDFViewer url={materi.file_url} />;
    case "image":
      return <ImageViewer url={materi.file_url} title={materi.judul} />;
    case "video":
      return <VideoViewer url={materi.file_url} />;
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
  return (
    <div className="w-full h-full">
      <iframe src={url} className="w-full h-full border-0" title="PDF Viewer" />
    </div>
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
