"use client";

import { Button } from "@/components/ui/button";
import { useRecordingsPage } from "../hooks/use-recordings-page";
import { EmptyState, ErrorState, RowsSkeleton } from "../load-states";
import { PageHeader } from "../page-header";
import { FilterBar } from "./filter-bar";
import { RecordingsTable } from "./recordings-table";

/** Recordings by latest chunk activity, filterable from the URL and expandable to chunks. */
export function Activity() {
  const page = useRecordingsPage();
  const filtered = Boolean(page.filters.status || page.filters.platform || page.filters.q);
  const shown = page.items.length;

  return (
    <div className="@container flex flex-col gap-4">
      <PageHeader
        title="Activity"
        description="Recordings ordered by their latest chunk activity. Expand a row to see its chunks."
      />
      <FilterBar filters={page.filters} onChange={page.setFilters} />

      {page.loading && !shown && <RowsSkeleton rows={10} />}
      {page.error && !shown && <ErrorState title="Could not load recordings" error={page.error} onRetry={page.retry} />}
      {!page.loading && !page.error && !shown && (
        <EmptyState title={filtered ? "No recordings match these filters" : "No recordings yet"}>
          {filtered ? (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => page.setFilters({})}>
              Clear filters
            </Button>
          ) : (
            "Recordings appear here once the catalog adds them and chunks start processing."
          )}
        </EmptyState>
      )}

      {shown > 0 && (
        <>
          <RecordingsTable recordings={page.items} />
          {page.error && <ErrorState title="Could not load more recordings" error={page.error} onRetry={page.retry} />}
          <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
            <span>
              {shown} recording{shown === 1 ? "" : "s"}
              {page.hasMore ? " loaded" : ""}
            </span>
            {page.hasMore && (
              <Button variant="outline" size="sm" onClick={page.loadMore} disabled={page.loadingMore}>
                {page.loadingMore ? "Loading…" : "Load more"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
