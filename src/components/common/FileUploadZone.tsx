/**
 * Accessible drag-and-drop file upload zone with validation and preview.
 */

import { useId, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconFile,
  IconFileTypePdf,
  IconPhoto,
  IconUpload,
} from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  accept: string[];
  maxSizeMB: number;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

function acceptsFile(file: File, accept: string[]): boolean {
  return accept.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.replace("/*", "/"));
    }
    return file.type === type;
  });
}

function formatFileSize(file: File): string {
  const sizeInMb = file.size / (1024 * 1024);
  if (sizeInMb >= 1) return `${sizeInMb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(file.size / 1024))} KB`;
}

function getFileIcon(file?: File | null) {
  if (!file) return IconUpload;
  if (file.type === "application/pdf") return IconFileTypePdf;
  if (file.type.startsWith("image/")) return IconPhoto;
  return IconFile;
}

export function FileUploadZone({
  accept,
  maxSizeMB,
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
}: FileUploadZoneProps) {
  const inputId = useId();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const acceptAttribute = accept.join(",");
  const FileIcon = getFileIcon(selectedFile);

  const acceptedLabel = useMemo(
    () => accept.map((type) => type.replace("application/", ".")).join(", "),
    [accept],
  );

  const validateAndSelect = (file: File) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Ukuran file maksimal ${maxSizeMB} MB.`);
      return;
    }

    if (!acceptsFile(file, accept)) {
      setError("Format file tidak didukung.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-muted bg-bg-primary p-8 transition",
        isDragOver && "border-role-accent bg-role-surface",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files.item(0);
        if (file) validateAndSelect(file);
      }}
    >
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={acceptAttribute}
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) validateAndSelect(file);
        }}
      />
      <label
        htmlFor={inputId}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            document.getElementById(inputId)?.click();
          }
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center outline-none"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-role-accent-light text-role-accent">
          <FileIcon className="size-6" aria-hidden="true" />
        </span>
        {selectedFile ? (
          <span>
            <span className="block text-small font-semibold text-text-primary">
              {selectedFile.name}
            </span>
            <span className="text-small text-text-muted">
              {formatFileSize(selectedFile)}
            </span>
          </span>
        ) : (
          <span>
            <span className="block text-small font-semibold text-text-primary">
              Seret file ke sini atau klik untuk memilih
            </span>
            <span className="text-small text-text-muted">
              {acceptedLabel} · maksimal {maxSizeMB} MB
            </span>
          </span>
        )}
      </label>

      {isUploading && (
        <div className="mt-4 space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-caption text-text-muted">
            Mengunggah {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {error && (
        <p className="field-error mt-4 flex items-center justify-center gap-1.5 text-small font-medium text-danger">
          <IconAlertCircle className="size-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUploadZone;
