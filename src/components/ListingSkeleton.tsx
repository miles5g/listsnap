import React from "react";

const ListingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Item Detection Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-primary/20 animate-pulse" />
          <div className="h-4 w-28 rounded bg-primary/20 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-secondary/50 rounded-md px-3 py-3">
              <div className="h-3 w-10 rounded bg-muted-foreground/20 animate-pulse mb-2" />
              <div className="h-4 w-20 rounded bg-foreground/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Listing Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-primary/20 animate-pulse" />
          <div className="h-4 w-16 rounded bg-primary/20 animate-pulse" />
        </div>
        {/* Title */}
        <div className="mb-4">
          <div className="h-3 w-8 rounded bg-muted-foreground/20 animate-pulse mb-2" />
          <div className="h-5 w-3/4 rounded bg-foreground/10 animate-pulse" />
        </div>
        {/* Description */}
        <div className="mb-4">
          <div className="h-3 w-20 rounded bg-muted-foreground/20 animate-pulse mb-2" />
          <div className="space-y-1.5">
            <div className="h-4 w-full rounded bg-foreground/10 animate-pulse" />
            <div className="h-4 w-full rounded bg-foreground/10 animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-foreground/10 animate-pulse" />
          </div>
        </div>
        {/* Tags */}
        <div className="mb-4">
          <div className="h-3 w-8 rounded bg-muted-foreground/20 animate-pulse mb-2" />
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 w-14 rounded-full bg-primary/10 animate-pulse" />
            ))}
          </div>
        </div>
        {/* Price */}
        <div>
          <div className="h-3 w-24 rounded bg-muted-foreground/20 animate-pulse mb-2" />
          <div className="h-6 w-20 rounded bg-primary/20 animate-pulse" />
        </div>
      </div>

      {/* Export Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="h-4 w-16 rounded bg-primary/20 animate-pulse mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-md bg-secondary/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingSkeleton;
