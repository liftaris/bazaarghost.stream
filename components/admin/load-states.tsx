import type { ReactNode } from "react";
import { CircleAlert, RotateCw } from "lucide-react";
import type { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FAILED_TEXT } from "./constants";

/** Names what failed, shows the server's reason, and offers a retry. */
export function ErrorState({
  title,
  error,
  onRetry,
  className,
}: {
  title: string;
  error: ApiError;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-start gap-2 rounded-lg border border-border p-4", className)}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <CircleAlert aria-hidden className={cn("size-4", FAILED_TEXT)} />
        {title}
      </p>
      <p className="text-sm text-muted-foreground">
        {error.status === 0 ? "The console API could not be reached." : error.message}
        {error.status > 0 && <span className="tabular-nums"> (HTTP {error.status})</span>}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw aria-hidden />
        Try again
      </Button>
    </div>
  );
}

/** Explains why a list is empty and what would fill it. */
export function EmptyState({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border border-dashed border-border p-4", className)}>
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

/** Placeholder rows in the shape of a dense table while data loads. */
export function RowsSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
