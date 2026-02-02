/**
 * FileUpload Component
 *
 * Purpose: Upload file laporan (PDF/Word) untuk tugas praktikum
 * Used by: QuizAttempt (mahasiswa), QuestionEditor (dosen preview)
 * Features: Drag & drop, preview, progress, validation
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  File,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  /**
   * Current uploaded file (if any)
   */
  value?: UploadedFile | null;

  /**
   * Callback when file is uploaded
   */
  onUpload: (file: UploadedFile) => void;

  /**
   * Callback when file is removed
   */
  onRemove?: () => void;

  /**
   * Upload function (should upload to Supabase Storage)
   */
  uploadFn: (file: File) => Promise<UploadedFile>;

  /**
   * Accepted file types
   */
  accept?: string;

  /**
   * Max file size in bytes (default: 20MB)
   */
  maxSize?: number;

  /**
   * Disable upload (e.g., when quiz is submitted)
   */
  disabled?: boolean;

  /**
   * Show download button for existing file
   */
  showDownload?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const DEFAULT_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip";

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="h-8 w-8 text-red-500" />,
  "application/msword": <FileText className="h-8 w-8 text-blue-500" />,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (
    <FileText className="h-8 w-8 text-blue-500" />
  ),
  "image/jpeg": <File className="h-8 w-8 text-green-500" />,
  "image/jpg": <File className="h-8 w-8 text-green-500" />,
  "image/png": <File className="h-8 w-8 text-green-500" />,
  "application/zip": <File className="h-8 w-8 text-yellow-500" />,
  default: <File className="h-8 w-8 text-gray-500" />,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(mimeType: string): React.ReactNode {
  return FILE_TYPE_ICONS[mimeType] || FILE_TYPE_ICONS.default;
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() || "FILE";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileUpload({
  value,
  onUpload,
  onRemove,
  uploadFn,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  showDownload = true,
  placeholder = "Seret file ke sini atau klik untuk memilih",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `Ukuran file terlalu besar. Maksimal ${formatFileSize(maxSize)}`;
    }

    // Check file type
    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const mimeType = file.type.toLowerCase();

    const isValidType = acceptedTypes.some(
      (type) =>
        type === fileExt ||
        type === mimeType ||
        (type.endsWith("/*") && mimeType.startsWith(type.replace("/*", "/"))),
    );

    if (!isValidType) {
      return `Tipe file tidak didukung. Gunakan: ${accept}`;
    }

    return null;
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Upload
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate progress (actual progress depends on upload implementation)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const uploadedFile = await uploadFn(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        onUpload(uploadedFile);

        // Reset progress after a short delay
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 500);
      } catch (err: any) {
        setError(err.message || "Gagal mengupload file");
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadFn, onUpload, maxSize, accept],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect],
  );

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const handleDownload = () => {
    if (value?.url) {
      window.open(value.url, "_blank");
    }
  };

  // ============================================================================
  // RENDER - UPLOADED FILE
  // ============================================================================

  if (value) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-4">
          {/* File Icon */}
          <div className="shrink-0ite rounded-lg border shadow-sm">
            {getFileIcon(value.type)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" title={value.name}>
              {value.name}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{getFileExtension(value.name)}</span>
              <span>•</span>
              <span>{formatFileSize(value.size)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {showDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {!disabled && onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-destructive hover:text-destructive"
                title="Hapus file"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Success indicator */}
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>File berhasil diupload</span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - UPLOAD AREA
  // ============================================================================

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragging && "border-primary bg-primary/5",
          !isDragging &&
            !disabled &&
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "cursor-not-allowed opacity-50 bg-muted",
          isUploading && "pointer-events-none",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Mengupload file...</p>
              <Progress value={uploadProgress} className="mt-2 h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {uploadProgress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div
                className={cn(
                  "p-4 rounded-full",
                  isDragging ? "bg-primary/10" : "bg-muted",
                )}
              >
                <Upload
                  className={cn(
                    "h-8 w-8",
                    isDragging ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isDragging ? "Lepaskan file di sini" : placeholder}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, Word, Gambar, atau ZIP • Maks. {formatFileSize(maxSize)}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={disabled}>
              Pilih File
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default FileUpload;
