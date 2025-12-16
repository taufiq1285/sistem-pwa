/**
 * CalendarEvent Component
 * Display individual calendar event with details
 */

import { Clock, MapPin, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/jadwal.types";

// ============================================================================
// TYPES
// ============================================================================

interface CalendarEventProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  variant?: "compact" | "detailed";
  showDate?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CalendarEvent({
  event,
  onClick,
  variant = "compact",
  showDate = false,
  className,
}: CalendarEventProps) {
  const startDate = parseISO(event.start);
  const endDate = parseISO(event.end);

  const handleClick = () => {
    onClick?.(event);
  };

  // ============================================================================
  // EVENT TYPE BADGE
  // ============================================================================

  const getEventTypeBadge = () => {
    const typeLabels = {
      class: "Kelas",
      quiz: "Tugas",
      booking: "Booking",
      exam: "Ujian",
    };

    const typeColors = {
      class: "default",
      quiz: "destructive",
      booking: "secondary",
      exam: "outline",
    } as const;

    return (
      <Badge variant={typeColors[event.type]} className="text-xs">
        {typeLabels[event.type]}
      </Badge>
    );
  };

  // ============================================================================
  // RENDER - COMPACT VARIANT
  // ============================================================================

  if (variant === "compact") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer",
          "hover:bg-accent transition-colors",
          className
        )}
        style={{
          borderLeft: `4px solid ${event.color || "#3b82f6"}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{event.title}</span>
            {getEventTypeBadge()}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - DETAILED VARIANT
  // ============================================================================

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      style={{
        borderLeft: `4px solid ${event.color || "#3b82f6"}`,
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base truncate">{event.title}</h4>
          </div>
          {getEventTypeBadge()}
        </div>

        {/* Date (if showDate enabled) */}
        {showDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            <span>
              {format(startDate, "EEEE, d MMMM yyyy", { locale: localeId })}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </Card>
  );
}

export default CalendarEvent;
