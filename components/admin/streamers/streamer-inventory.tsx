"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpsResource } from "../hooks/use-ops-resource";
import { EmptyState, ErrorState, RowsSkeleton } from "../load-states";
import { ChannelSection } from "./channel-section";
import { useInventoryFilter } from "./hooks/use-inventory-filter";
import { InventoryFilterChips } from "./inventory-filter-chips";
import { countInventoryFilters } from "./lib/inventory";
import { StreamerHeader } from "./streamer-header";
import { OperatorGate } from "../operator-gate";

function InventorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading inventory" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <Skeleton className="h-7 w-full max-w-2xl" />
      <RowsSkeleton rows={8} />
    </div>
  );
}

/** A streamer's channels, each comparing the platform's videos against our recordings, filtered from the URL. */
export function StreamerInventory({ id }: { id: number }) {
  const { data, error, reload } = useOpsResource("/streamers/:id/inventory", { id });
  const { filter, setFilter } = useInventoryFilter();

  if (error?.status === 404)
    return (
      <OperatorGate>
        <EmptyState title={`No streamer ${id}`}>
          <Link href="/admin/streamers" className="text-foreground underline underline-offset-4">
            Back to streamers
          </Link>
        </EmptyState>
      </OperatorGate>
    );
  if (error) return (
    <OperatorGate>
      <ErrorState title={`Could not load streamer ${id}`} error={error} onRetry={reload} />
    </OperatorGate>
  );
  if (!data) return <OperatorGate><InventorySkeleton /></OperatorGate>;

  const counts = countInventoryFilters(data.channels.flatMap((channel) => channel.items));
  return (
    <OperatorGate>
      <StreamerHeader inventory={data} />
      {data.channels.length ? (
        <>
          <InventoryFilterChips value={filter} counts={counts} onChange={setFilter} />
          {data.channels.map((channel) => (
            <ChannelSection key={channel.channel.id} channel={channel} filter={filter} onShowAll={() => setFilter("all")} />
          ))}
        </>
      ) : (
        <EmptyState title="No channels">Link a channel to this streamer to compare its videos here.</EmptyState>
      )}
    </OperatorGate>
  );
}
