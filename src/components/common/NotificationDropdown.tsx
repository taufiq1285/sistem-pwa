/**
 * NotificationDropdown Component
 *
 * Dropdown notification panel that shows recent announcements
 * Displayed when user clicks the bell icon
 */

import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUnreadNotifications } from "@/lib/hooks/useUnreadNotifications";
import { useRole } from "@/lib/hooks/useRole";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Pengumuman } from "@/types/common.types";

const MAX_DISPLAY = 5; // Maximum announcements to display in dropdown

/**
 * Get badge variant based on priority
 */
function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return { variant: "destructive" as const, label: "Penting" };
    case "medium":
      return { variant: "default" as const, label: "Menengah" };
    case "low":
      return { variant: "secondary" as const, label: "Biasa" };
    default:
      return { variant: "secondary" as const, label: "Info" };
  }
}

/**
 * Single notification item
 */
function NotificationItem({ announcement }: { announcement: Pengumuman }) {
  const badge = getPriorityBadge(announcement.prioritas || "low");

  return (
    <div className="flex flex-col gap-1 py-3 px-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-2">
            {announcement.judul}
          </p>
        </div>
        <Badge variant={badge.variant} className="text-xs shrink-0">
          {badge.label}
        </Badge>
      </div>
      {announcement.created_at && (
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(announcement.created_at)}
        </p>
      )}
    </div>
  );
}

/**
 * Empty state when no notifications
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">Tidak ada pengumuman</p>
    </div>
  );
}

/**
 * NotificationDropdown Component
 */
export function NotificationDropdown() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { notifications, unreadCount, loading } = useUnreadNotifications();

  // Get recent notifications (max 5)
  const recentNotifications = notifications.slice(0, MAX_DISPLAY);

  const handleViewAll = () => {
    if (role) {
      navigate(`/${role}/pengumuman`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} baru
            </Badge>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">Memuat...</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ScrollArea className="h-[320px]">
              <div className="px-2">
                {recentNotifications.map((announcement, index) => (
                  <div key={announcement.id}>
                    <NotificationItem announcement={announcement} />
                    {index < recentNotifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleViewAll}
              >
                Lihat Semua Pengumuman
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationDropdown;
