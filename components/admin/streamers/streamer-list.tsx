"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "../load-states";
import { PageHeader } from "../page-header";
import { PagedList } from "../paged-list";
import { SearchField } from "../search-field";
import { useStreamersPage } from "./hooks/use-streamers-page";
import { StreamersTable } from "./streamers-table";
import { OperatorGate } from "../operator-gate";

/** Streamers by name, searchable from the URL; each opens its platform inventory. */
export function StreamerList() {
  const page = useStreamersPage();
  const { q } = page.filters;

  return (
    <OperatorGate>
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Streamers"
        description="Open a streamer to compare their platform videos against what we have scanned."
      />
      <SearchField
        value={q}
        onSearch={(next) => page.setFilters({ q: next })}
        label="Search streamers by name"
        placeholder="Streamer name"
        className="max-w-sm flex-none"
      />
      <PagedList
        page={page}
        noun={["streamer", "streamers"]}
        empty={
          <EmptyState title={q ? `No streamer names contain "${q}"` : "No streamers yet"}>
            {q ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => page.setFilters({})}>
                Clear search
              </Button>
            ) : (
              "Streamers appear once a channel is added to the catalog and linked to a person."
            )}
          </EmptyState>
        }
      >
        <StreamersTable streamers={page.items} />
      </PagedList>
    </div>
    </OperatorGate>
  );
}
