/**
 * Calendar Component
 * Custom calendar with month view and event display
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isValid,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types/jadwal.types";

// ============================================================================
// TYPES
// ============================================================================

interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  initialDate?: Date;
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// ============================================================================
// HELPERS - Safe date parsing to prevent RangeError: Invalid time value
// ============================================================================

/**
 * Safely parse an ISO date string.
 * Returns null if the value is missing or results in an invalid date.
 */
function safeParseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const date = parseISO(value);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Safely format a date string using date-fns format.
 * Returns the fallback string if the value is invalid.
 */
function safeFormatDate(
  value: string | null | undefined,
  formatStr: string,
  fallback = "--",
): string {
  const date = safeParseDate(value);
  if (!date) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Calendar({
  events = [],
  onEventClick,
  onDateClick,
  initialDate = new Date(),
  className,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // ============================================================================
  // CALENDAR LOGIC
  // ============================================================================

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: CalendarDay[] = [];
  let day = calendarStart;

  while (day <= calendarEnd) {
    const dayEvents = events.filter((event) => {
      // Guard: skip events with invalid/missing start dates
      const eventDate = safeParseDate(event.start);
      if (!eventDate) return false;
      return isSameDay(eventDate, day);
    });

    days.push({
      date: new Date(day),
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isToday(day),
      events: dayEvents,
    });

    day = addDays(day, 1);
  }

  // Group days into weeks
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {format(currentDate, "MMMM yyyy", { locale: localeId })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hari Ini
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
              <div
                key={d}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((calDay) => (
                  <div
                    key={calDay.date.toISOString()}
                    onClick={() => handleDateClick(calDay.date)}
                    className={cn(
                      "min-h-[80px] p-2 rounded-lg border transition-colors cursor-pointer",
                      "hover:bg-accent hover:border-accent-foreground/20",
                      !calDay.isCurrentMonth &&
                        "bg-muted/30 text-muted-foreground",
                      calDay.isToday && "border-primary border-2 bg-primary/5",
                    )}
                  >
                    {/* Date Number */}
                    <div
                      className={cn(
                        "text-sm font-medium mb-1",
                        calDay.isToday && "text-primary font-bold",
                      )}
                    >
                      {format(calDay.date, "d")}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {calDay.events.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                            "hover:opacity-80 transition-opacity",
                          )}
                          style={{
                            backgroundColor: event.color || "#3b82f6",
                            color: "white",
                          }}
                          title={event.title}
                        >
                          {safeFormatDate(event.start, "HH:mm")} {event.title}
                        </div>
                      ))}

                      {/* More events indicator */}
                      {calDay.events.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1.5">
                          +{calDay.events.length - 3} lainnya
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Calendar;
