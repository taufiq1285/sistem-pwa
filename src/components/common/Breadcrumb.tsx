/**
 * Breadcrumb renders route handle labels from React Router matches.
 */

import type { ReactElement } from "react";
import { Link, useLocation, useMatches } from "react-router-dom";
import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface RouteHandle {
  breadcrumb?: string;
}

interface BreadcrumbProps {
  className?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  dosen: "Dosen",
  mahasiswa: "Mahasiswa",
  laboran: "Laboran",
  kuis: "Kuis",
  jadwal: "Jadwal",
  logbook: "Logbook",
  materi: "Materi",
  nilai: "Nilai",
  presensi: "Presensi",
  notifikasi: "Notifikasi",
  profil: "Profil",
  users: "Pengguna",
  laboratories: "Laboratorium",
  equipments: "Peralatan",
  peminjaman: "Peminjaman",
  "peminjaman-aktif": "Peminjaman Aktif",
  announcements: "Pengumuman",
  "offline-sync": "Sinkronisasi Offline",
};

function hasBreadcrumbHandle(handle: unknown): handle is RouteHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "breadcrumb" in handle &&
    typeof (handle as RouteHandle).breadcrumb === "string"
  );
}

function compactBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items.length <= 4) {
    return items;
  }

  return [
    items[0],
    { label: "..." },
    items[items.length - 2],
    items[items.length - 1],
  ];
}

function formatSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isTechnicalSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8,}/i.test(segment) ||
    segment.length > 24
  );
}

function buildPathBreadcrumbs(
  pathname: string,
  leafItem?: BreadcrumbItem,
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const parentSegments = leafItem ? segments.slice(0, -1) : segments;
  const items: BreadcrumbItem[] = [];
  let href = "";

  parentSegments.forEach((segment) => {
    href += `/${segment}`;
    if (isTechnicalSegment(segment)) {
      return;
    }

    items.push({
      label: formatSegmentLabel(segment),
      href,
    });
  });

  if (leafItem) {
    const previous = items[items.length - 1];
    if (!previous || previous.label !== leafItem.label) {
      items.push(leafItem);
    }
  }

  return items;
}

export function Breadcrumb({
  className,
}: BreadcrumbProps): ReactElement | null {
  const location = useLocation();
  let matches: ReturnType<typeof useMatches> = [];
  try {
    matches = useMatches();
  } catch (e) {
    matches = [];
  }
  const matchedItems = matches
    .filter((match) => hasBreadcrumbHandle(match.handle))
    .map<BreadcrumbItem>((match) => ({
      label: (match.handle as RouteHandle).breadcrumb ?? "",
      href: match.pathname,
    }))
    .filter((item) => item.label.trim().length > 0);
  const items =
    matchedItems.length > 1
      ? matchedItems
      : buildPathBreadcrumbs(location.pathname, matchedItems[0]);

  if (items.length <= 1) {
    return null;
  }

  const visibleItems = compactBreadcrumbs(items);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex h-10 items-center gap-1 border-b border-border-light bg-surface-0 px-4 text-xs md:px-6",
        className,
      )}
    >
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;
        const key = `${item.label}-${item.href ?? index}`;

        return (
          <span key={key} className="flex min-w-0 items-center gap-1">
            {index > 0 ? (
              <IconChevronRight
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            ) : null}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "truncate",
                  isLast ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="truncate text-muted-foreground hover:underline"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
