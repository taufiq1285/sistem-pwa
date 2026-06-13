import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";

interface CardListSkeletonProps {
  count?: number;
}

export function CardListSkeleton({
  count = 4,
}: CardListSkeletonProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="h-[120px] w-full rounded-xl border border-border/60 bg-card/85 p-5 backdrop-blur-xs flex flex-col justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="skeleton-shimmer h-5 w-48 rounded-xs" />
            <div className="skeleton-shimmer h-4 w-full rounded-xs" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="skeleton-shimmer h-4 w-24 rounded-xs" />
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default CardListSkeleton;
