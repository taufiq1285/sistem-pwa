/**
 * EventDialog Component
 * Modal dialog for displaying event details with actions
 */

import {
  Clock,
  MapPin,
  User,
  Calendar,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { CalendarEvent } from "@/types/jadwal.types";

// ============================================================================
// TYPES
// ============================================================================

interface EventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  showActions?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EventDialog({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  showActions = true,
}: EventDialogProps) {
  if (!event) return null;

  const startDate = parseISO(event.start);
  const endDate = parseISO(event.end);

  // ============================================================================
  // EVENT TYPE CONFIG
  // ============================================================================

  const getEventTypeConfig = () => {
    const configs = {
      class: {
        label: "Kelas Praktikum",
        color: "default" as const,
        icon: Calendar,
      },
      quiz: {
        label: "Tugas Praktikum",
        color: "destructive" as const,
        icon: FileText,
      },
      booking: {
        label: "Booking Lab",
        color: "secondary" as const,
        icon: Calendar,
      },
      exam: {
        label: "Ujian",
        color: "outline" as const,
        icon: FileText,
      },
    };

    return configs[event.type] || configs.class;
  };

  const typeConfig = getEventTypeConfig();
  const TypeIcon = typeConfig.icon;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    onEdit?.(event);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete?.(event);
    onOpenChange(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                <Badge variant={typeConfig.color}>{typeConfig.label}</Badge>
                {/* ✅ NEW: Status Badge */}
                <StatusBadge
                  status={event.metadata?.status || "pending"}
                  size="sm"
                />
              </div>
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="space-y-3">
            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Tanggal</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Waktu</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")} WIB
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          {event.location && (
            <>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Lokasi</p>
                  <p className="text-sm text-muted-foreground">
                    {event.location}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description/Topic */}
          {event.description && (
            <>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Topik</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata (Additional Info) */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">Informasi Tambahan</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {event.metadata.kelas_id && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kelas ID:</span>
                    <span className="font-mono text-xs">
                      {event.metadata.kelas_id.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {event.metadata.laboratorium_id && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Lab ID:</span>
                    <span className="font-mono text-xs">
                      {event.metadata.laboratorium_id.slice(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Color Indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: event.color || "#3b82f6" }}
            />
            <span className="text-sm text-muted-foreground">Event Color</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <DialogFooter className="flex-row justify-end gap-2">
            {onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
            )}
            {onEdit && (
              <Button onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EventDialog;
