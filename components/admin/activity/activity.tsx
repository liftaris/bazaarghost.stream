"use client";

import { Button } from "@/components/ui/button";
import { useRecordingsPage } from "../hooks/use-recordings-page";
import { EmptyState } from "../load-states";
import { PageHeader } from "../page-header";
import { PagedList } from "../paged-list";
import { FilterBar } from "./filter-bar";
import { RecordingsTable } from "./recordings-table";

/** Recordings by latest chunk activity, filterable from the URL and expandable to chunks. */
export function Activity() {
  const page = useRecordingsPage();
  const filtered = Object.values(page.filters).some(Boolean);

  return (
    <div className="@container flex flex-col gap-4">
      <PageHeader
        title="Activity"
        description="Recordings ordered by their latest chunk activity. Expand a row to see its chunks."
      />
      <FilterBar filters={page.filters} onChange={page.setFilters} />
      <PagedList
        page={page}
        noun={["recording", "recordings"]}
        empty={
          <EmptyState title={filtered ? "No recordings match these filters" : "No recordings yet"}>
            {filtered ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => page.setFilters({})}>
                Clear filters
              </Button>
            ) : (
              "Recordings appear here once the catalog adds them and chunks start processing."
            )}
          </EmptyState>
        }
      >
        <RecordingsTable recordings={page.items} />
      </PagedList>
    </div>
  );
}
