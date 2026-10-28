import { CircleAlert, Database, Radio } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { Button } from "@/components/ui/button";
import type { InventoryChannel } from "@/lib/operator-contract";
import { getPlatform } from "@/lib/platforms/registry";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { CountBreakdown } from "../count-breakdown";
import { EmptyState } from "../load-states";
import { InventoryTable } from "./inventory-table";
import {
  countInventoryStates,
  INVENTORY_FILTERS,
  INVENTORY_STATES,
  matchesInventoryFilter,
  type InventoryFilter,
} from "./lib/inventory";

function OriginNote({ channel }: { channel: InventoryChannel }) {
  const platform = getPlatform(channel.channel.platform).name;
  if (channel.origin === "error")
    return (
      <div role="alert" className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <CircleAlert aria-hidden className={cn("size-4 shrink-0", FAILED_TEXT)} />
          Could not list this channel's videos on {platform}
        </p>
        {channel.error && <p className={cn("text-xs break-words", MONO, FAILED_TEXT)}>{channel.error}</p>}
        <p className="text-muted-foreground">Showing only the recordings we already have.</p>
      </div>
    );
  const Icon = channel.origin === "live" ? Radio : Database;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {channel.origin === "live"
        ? `Live from ${platform}: its latest archives, matched against our recordings.`
        : `From ingestion jobs: the ${platform} videos ingestion has seen, matched against our recordings.`}
    </p>
  );
}

function EmptyChannel({ channel, filter, onShowAll }: { channel: InventoryChannel; filter: InventoryFilter; onShowAll: () => void }) {
  if (channel.items.length) {
    const label = INVENTORY_FILTERS.find((chip) => chip.value === filter)?.label.toLowerCase();
    return (
      <EmptyState title={`None of this channel's videos are ${label}`}>
        <Button variant="outline" size="sm" className="mt-2" onClick={onShowAll}>
          Show all {channel.items.length} videos
        </Button>
      </EmptyState>
    );
  }
  if (channel.origin === "jobs")
    return <EmptyState title="No videos yet">Videos appear here once ingestion discovers them on this channel.</EmptyState>;
  if (channel.origin === "live")
    return <EmptyState title="No archives">This channel has no archives on the platform and we have no recordings of it.</EmptyState>;
  return <EmptyState title="No recordings">We have no recordings of this channel to show while the platform is unreachable.</EmptyState>;
}

/** One channel of a streamer: where the list came from, counts per state, and the filtered video table. */
export function ChannelSection({
  channel,
  filter,
  onShowAll,
}: {
  channel: InventoryChannel;
  filter: InventoryFilter;
  onShowAll: () => void;
}) {
  const { platform, displayName, sourceId, id } = channel.channel;
  const name = displayName ?? sourceId;
  const items = channel.items.filter((item) => matchesInventoryFilter(item, filter));
  const headingId = `channel-${id}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
          <PlatformIcon platform={platform} className="size-4" />
          {name}
          <span className="font-normal text-muted-foreground tabular-nums">{channel.items.length}</span>
        </h2>
        {channel.items.length > 0 && <CountBreakdown counts={countInventoryStates(channel.items)} order={INVENTORY_STATES} labelled />}
      </div>
      <OriginNote channel={channel} />
      {items.length ? (
        <InventoryTable items={items} label={`${getPlatform(platform).name} videos of ${name}`} />
      ) : (
        <EmptyChannel channel={channel} filter={filter} onShowAll={onShowAll} />
      )}
    </section>
  );
}
