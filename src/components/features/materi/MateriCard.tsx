/**
 * MateriCard Component
 *
 * Purpose: Display learning material card with actions
 * Features:
 * - File type icon
 * - Title, description, file info
 * - Download/View actions
 * - Edit/Delete (for dosen)
 * - Publication status
 * - Download count
 */

import { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileCode,
  FileArchive,
  MoreVertical,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Materi } from "@/types/materi.types";
import { formatFileSize, getFileTypeCategory } from "@/lib/supabase/storage";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================================
// TYPES
// ============================================================================

interface MateriCardProps {
  materi: Materi;
  showActions?: boolean;
  showDosenActions?: boolean;
  onDownload?: (materi: Materi) => void;
  onView?: (materi: Materi) => void;
  onEdit?: (materi: Materi) => void;
  onDelete?: (materi: Materi) => void;
  className?: string;
}

// ============================================================================
// FILE TYPE ICONS
// ============================================================================

function getFileIcon(tipeFile: string): React.ReactNode {
  const category = getFileTypeCategory(tipeFile);
  const iconClass = "h-10 w-10";

  switch (category) {
    case "pdf":
      return <FileText className={cn(iconClass, "text-red-600")} />;
    case "document":
      return <FileText className={cn(iconClass, "text-blue-600")} />;
    case "spreadsheet":
      return <FileCode className={cn(iconClass, "text-green-600")} />;
    case "presentation":
      return <FileCode className={cn(iconClass, "text-orange-600")} />;
    case "image":
      return <FileImage className={cn(iconClass, "text-purple-600")} />;
    case "video":
      return <FileVideo className={cn(iconClass, "text-pink-600")} />;
    case "archive":
      return <FileArchive className={cn(iconClass, "text-yellow-600")} />;
    default:
      return <File className={cn(iconClass, "text-gray-600")} />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MateriCard({
  materi,
  showActions = true,
  showDosenActions = false,
  onDownload,
  onView,
  onEdit,
  onDelete,
  className,
}: MateriCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const materiAny = materi as any;
  const isActive = materiAny.is_active ?? true;
  const downloadCount = materiAny.download_count ?? 0;
  const mingguKe = materi.minggu_ke;

  const canView = ["pdf", "image", "video"].includes(
    getFileTypeCategory(materi.tipe_file || ""),
  );

  const createdDate = materi.created_at
    ? format(new Date(materi.created_at), "dd MMM yyyy", { locale: localeId })
    : "-";

  const dosenName = materi.dosen
    ? `${materi.dosen.gelar_depan || ""} ${materi.dosen.users.full_name} ${materi.dosen.gelar_belakang || ""}`.trim()
    : "Unknown";

  const mataKuliahName = materi.kelas?.mata_kuliah?.nama_mk || "-";

  const handleDownload = async () => {
    if (!onDownload) return;

    setIsDownloading(true);
    try {
      await onDownload(materi);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getFileIcon(materi.tipe_file || "")}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {materi.judul}
                </h3>
                {materi.deskripsi && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {materi.deskripsi}
                  </p>
                )}
              </div>

              {showDosenActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(materi)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(materi)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Published" : "Draft"}
              </Badge>

              {mataKuliahName && mataKuliahName !== "-" && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {mataKuliahName}
                </Badge>
              )}

              {materi.kelas?.nama_kelas && (
                <Badge variant="outline" className="text-xs">
                  {materi.kelas.nama_kelas}
                </Badge>
              )}

              {mingguKe && <Badge variant="outline">Minggu {mingguKe}</Badge>}

              <Badge variant="outline">
                {formatFileSize(materi.file_size || 0)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{dosenName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="truncate">{mataKuliahName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{createdDate}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>{downloadCount} downloads</span>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-4 border-t">
          <div className="flex gap-2 w-full">
            {canView && onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(materi)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Lihat
              </Button>
            )}

            {onDownload && (
              <Button
                variant={canView ? "outline" : "default"}
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================================
// LIST COMPONENT
// ============================================================================

interface MateriListProps {
  materiList: Materi[];
  showActions?: boolean;
  showDosenActions?: boolean;
  onDownload?: (materi: Materi) => void;
  onView?: (materi: Materi) => void;
  onEdit?: (materi: Materi) => void;
  onDelete?: (materi: Materi) => void;
  emptyMessage?: string;
  className?: string;
}

export function MateriList({
  materiList,
  showActions,
  showDosenActions,
  onDownload,
  onView,
  onEdit,
  onDelete,
  emptyMessage = "Belum ada materi",
  className,
}: MateriListProps) {
  if (materiList.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {materiList.map((materi) => (
        <MateriCard
          key={materi.id}
          materi={materi}
          showActions={showActions}
          showDosenActions={showDosenActions}
          onDownload={onDownload}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
