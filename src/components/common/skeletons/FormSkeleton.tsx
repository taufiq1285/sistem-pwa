import type { ReactElement } from "react";

export function FormSkeleton(): ReactElement {
  return (
    <div className="w-full space-y-5 p-6 border border-border/60 rounded-xl bg-card/80 shadow-xs">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label: 12px height */}
          <div className="skeleton-shimmer h-[12px] w-24 rounded-xs" />
          {/* Input: 40px height */}
          <div className="skeleton-shimmer h-[40px] w-full rounded-md" />
        </div>
      ))}
      <div className="pt-3">
        {/* Button: 40px height, 120px width */}
        <div className="skeleton-shimmer h-[40px] w-[120px] rounded-md" />
      </div>
    </div>
  );
}

export default FormSkeleton;
