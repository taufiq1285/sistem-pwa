/**
 * useUnreadNotifications Hook
 *
 * Fetches and manages unread notifications/announcements for current user
 * Only for dosen, mahasiswa, laboran (not admin)
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getAllAnnouncements } from "@/lib/api/announcements.api";
import type { Pengumuman } from "@/types/common.types";
import type { UserRole } from "@/types/auth.types";

interface UseUnreadNotificationsReturn {
  notifications: Pengumuman[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const UNREAD_THRESHOLD_DAYS = 7; // Pengumuman dianggap "baru" jika < 7 hari

/**
 * Filter announcements for specific role
 */
function filterAnnouncementsForRole(
  announcements: Pengumuman[],
  role: UserRole,
): Pengumuman[] {
  const now = new Date().toISOString();

  return announcements.filter((announcement) => {
    // Check if announcement is for this role or all roles
    const targetRoles = announcement.target_role || [];
    const isForRole = targetRoles.includes(role) || targetRoles.length === 0;

    // Check if announcement is currently active
    const isActive =
      (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
      (!announcement.tanggal_selesai || announcement.tanggal_selesai >= now);

    return isForRole && isActive;
  });
}

/**
 * Count unread announcements (created within last 7 days)
 */
function countUnread(announcements: Pengumuman[]): number {
  const now = Date.now();
  const threshold = UNREAD_THRESHOLD_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms

  return announcements.filter((announcement) => {
    const createdAt = announcement.created_at
      ? new Date(announcement.created_at).getTime()
      : 0;
    const age = now - createdAt;

    // Count as unread if created within threshold
    return age < threshold;
  }).length;
}

/**
 * Sort announcements by priority and date
 */
function sortAnnouncements(announcements: Pengumuman[]): Pengumuman[] {
  return [...announcements].sort((a, b) => {
    // High priority first
    if (a.prioritas === "high" && b.prioritas !== "high") return -1;
    if (a.prioritas !== "high" && b.prioritas === "high") return 1;

    // Then by created date (newest first)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Hook to get unread notifications for current user
 * Only works for dosen, mahasiswa, laboran (returns empty for admin)
 */
export function useUnreadNotifications(): UseUnreadNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Pengumuman[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    // Only load for dosen, mahasiswa, laboran
    if (!user || !user.role || user.role === "admin") {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getAllAnnouncements();

      // Filter for current role
      const filtered = filterAnnouncementsForRole(data, user.role);

      // Sort by priority and date
      const sorted = sortAnnouncements(filtered);

      // Count unread
      const unread = countUnread(filtered);

      setNotifications(sorted);
      setUnreadCount(unread);
    } catch (err: any) {
      console.error("Error loading notifications:", err);
      setError(err.message || "Failed to load notifications");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: loadNotifications,
  };
}
