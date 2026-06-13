import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";

interface DashboardSkeletonProps {
  role?: "admin" | "dosen" | "mahasiswa" | "laboran";
}

export function DashboardSkeleton({
  role,
}: DashboardSkeletonProps = {}): ReactElement {
  // Determine layout and numbers of cards based on role
  const isDosen = role === "dosen";
  const isAdmin = role === "admin";
  const isLaboran = role === "laboran";

  const statCols = isAdmin
    ? "grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    : isDosen
      ? "grid gap-4 md:grid-cols-3"
      : "grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4";

  const statCount = isAdmin ? 6 : isDosen ? 3 : 4;

  const contentCols = isAdmin
    ? "grid gap-6 md:grid-cols-2 lg:grid-cols-7"
    : isDosen
      ? "grid gap-6 xl:grid-cols-[1.35fr_1fr]"
      : "grid gap-6 lg:grid-cols-2";

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className={statCols}>
        {Array.from({ length: statCount }).map((_, index) => (
          <Card
            key={index}
            className="h-[96px] w-full rounded-xl border border-border/60 bg-card/85 p-5 backdrop-blur-xs flex items-center justify-between"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="skeleton-shimmer h-4 w-20 rounded-xs" />
              <div className="skeleton-shimmer h-7 w-12 rounded-xs" />
            </div>
            <div className="skeleton-shimmer h-10 w-10 rounded-xl shrink-0" />
          </Card>
        ))}
      </div>

      {/* Content Cards */}
      <div className={contentCols}>
        {isAdmin ? (
          <>
            <Card className="h-[350px] col-span-full lg:col-span-4 rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-32 rounded-xs" />
              </div>
              <div className="flex-1 skeleton-shimmer w-full rounded-lg" />
            </Card>
            <Card className="h-[350px] col-span-full lg:col-span-3 rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-32 rounded-xs" />
              </div>
              <div className="flex-1 skeleton-shimmer w-full rounded-lg" />
            </Card>
          </>
        ) : isLaboran ? (
          <>
            <Card className="h-[320px] lg:col-span-2 rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col">
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-48 rounded-xs" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="skeleton-shimmer h-4 w-full rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[92%] rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[85%] rounded-xs" />
              </div>
            </Card>
            <Card className="h-[240px] rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col">
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-32 rounded-xs" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="skeleton-shimmer h-4 w-[60%] rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[80%] rounded-xs" />
              </div>
            </Card>
            <Card className="h-[240px] rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col">
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-32 rounded-xs" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="skeleton-shimmer h-4 w-[70%] rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[50%] rounded-xs" />
              </div>
            </Card>
          </>
        ) : (
          Array.from({ length: 2 }).map((_, cIndex) => (
            <Card
              key={cIndex}
              className="h-[240px] rounded-xl border border-border/60 bg-card/85 p-6 backdrop-blur-xs flex flex-col"
            >
              <div className="flex items-center gap-2 pb-4 border-b border-border/60 mb-4 shrink-0">
                <div className="skeleton-shimmer h-5 w-5 rounded-full" />
                <div className="skeleton-shimmer h-5 w-32 rounded-xs" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="skeleton-shimmer h-4 w-full rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[92%] rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[85%] rounded-xs" />
                <div className="skeleton-shimmer h-4 w-[60%] rounded-xs" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardSkeleton;
