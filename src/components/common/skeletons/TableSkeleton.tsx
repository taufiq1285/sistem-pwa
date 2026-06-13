import type { ReactElement } from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
}: TableSkeletonProps): ReactElement {
  const widths = ["w-[60%]", "w-[80%]", "w-[50%]", "w-[70%]", "w-[40%]"];

  return (
    <div className="w-full border border-border/60 rounded-xl overflow-hidden bg-card shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4">
                  <div className="skeleton-shimmer h-4 w-20 rounded-xs opacity-75" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIndex) => (
              <tr
                key={rIndex}
                className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors"
              >
                {Array.from({ length: columns }).map((_, cIndex) => {
                  const widthClass = widths[cIndex % widths.length];
                  return (
                    <td key={cIndex} className="p-4">
                      <div
                        className={`skeleton-shimmer h-4 ${widthClass} rounded-xs`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableSkeleton;
