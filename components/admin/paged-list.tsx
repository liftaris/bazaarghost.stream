import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { CursorPages } from "./hooks/use-cursor-pages";
import { ErrorState, RowsSkeleton } from "./load-states";

/**
 * Load states around a cursor-paged table: skeleton, error with retry, the
 * caller's empty state, then the table with a count and "Load more".
 */
export function PagedList({
  page,
  noun,
  empty,
  children,
}: {
  page: Pick<CursorPages<unknown, unknown>, "items" | "loading" | "loadingMore" | "error" | "hasMore" | "loadMore" | "retry">;
  /** Singular and plural name of a row, such as `["recording", "recordings"]`. */
  noun: readonly [string, string];
  empty: ReactNode;
  children: ReactNode;
}) {
  const shown = page.items.length;
  if (!shown) {
    if (page.error) return <ErrorState title={`Could not load ${noun[1]}`} error={page.error} onRetry={page.retry} />;
    if (page.loading) return <RowsSkeleton rows={10} />;
    return empty;
  }
  return (
    <>
      {children}
      {page.error && <ErrorState title={`Could not load more ${noun[1]}`} error={page.error} onRetry={page.retry} />}
      <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
        <span>
          {shown} {noun[shown === 1 ? 0 : 1]}
          {page.hasMore ? " loaded" : ""}
        </span>
        {page.hasMore && (
          <Button variant="outline" size="sm" onClick={page.loadMore} disabled={page.loadingMore} className="pointer-coarse:h-11">
            {page.loadingMore ? "Loading…" : "Load more"}
          </Button>
        )}
      </div>
    </>
  );
}
