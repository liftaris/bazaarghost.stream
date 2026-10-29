"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, RowsSkeleton } from "../load-states";
import { PageHeader } from "../page-header";
import { PagedList } from "../paged-list";
import { CatalogTable } from "./catalog-table";
import { DispatchState } from "./dispatch-state";
import { useIngestionPage } from "./hooks/use-ingestion-page";
import { JobFilterBar } from "./job-filter-bar";
import { JobsTable } from "./jobs-table";
import { PlatformSwitches } from "./platform-switches";
import { OperatorGate } from "../operator-gate";

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function HeadSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading ingestion state" className="flex flex-col gap-6">
      <div className="grid gap-6 @3xl:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <RowsSkeleton rows={4} />
    </div>
  );
}

/** Platform switches, the dispatch singleton, Twitch catalog work and the filterable ingestion job table. */
export function Ingestion() {
  const page = useIngestionPage();
  const { latest } = page;
  const filtered = Boolean(page.filters.platform || page.filters.kind || page.filters.status);

  return (
    <OperatorGate>
    <div className="@container flex flex-col gap-6">
      <PageHeader title="Ingestion" description="How platform videos reach the catalog: switches, dispatch, Twitch catalog work and jobs." />
      {!latest && page.error && <ErrorState title="Could not load ingestion" error={page.error} onRetry={page.retry} />}
      {!latest && !page.error && <HeadSkeleton />}
      {latest && (
        <>
          <div className="grid gap-6 @3xl:grid-cols-2">
            <Section id="switches-heading" title="Platform switches" note="Read-only">
              <PlatformSwitches platforms={latest.platforms} />
            </Section>
            <Section id="dispatch-heading" title="Dispatch">
              <DispatchState dispatch={latest.dispatch} />
            </Section>
          </div>
          <Section id="catalog-heading" title="Twitch catalog work">
            {latest.catalog.length ? (
              <CatalogTable catalog={latest.catalog} />
            ) : (
              <EmptyState title="No catalog work">Twitch streamers get a row here once the catalog schedules them for an archive scan.</EmptyState>
            )}
          </Section>
          <Section id="jobs-heading" title="Jobs" note="Latest attempt first">
            <JobFilterBar filters={page.filters} onChange={page.setFilters} />
            <PagedList
              page={page}
              noun={["job", "jobs"]}
              empty={
                <EmptyState title={filtered ? "No jobs match these filters" : "No ingestion jobs yet"}>
                  {filtered ? (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => page.setFilters({})}>
                      Clear filters
                    </Button>
                  ) : (
                    "Discovery queues a job for each account and video it finds on an enabled platform."
                  )}
                </EmptyState>
              }
            >
              <JobsTable jobs={page.items} />
            </PagedList>
          </Section>
        </>
      )}
    </div>
    </OperatorGate>
  );
}
