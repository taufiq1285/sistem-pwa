/**
 * Dashboard Skeleton Component
 * Loading state for dashboard with shimmer effect
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
                  <Skeleton className="h-8 w-16 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-4">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-32 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
            <Skeleton className="h-4 w-48 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-75 w-full bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm lg:col-span-3">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-32 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
            <Skeleton className="h-4 w-48 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
                  <Skeleton className="h-3 w-2/3 bg-muted/80 animate-[shimmer_1.8s_linear_infinite] bg-size-[200%_100%]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
