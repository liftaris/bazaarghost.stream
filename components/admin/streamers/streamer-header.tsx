import { ExternalLink } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import type { OpsInventory } from "@/lib/operator-contract";
import { getPlatform } from "@/lib/platforms/registry";
import { IdChip } from "../id-chip";
import { PageHeader } from "../page-header";
import { channelUrl } from "./lib/channels";
import { StreamerAvatar } from "./streamer-avatar";

/** Avatar, name and id of a streamer, then each channel with a link out and its copyable platform id. */
export function StreamerHeader({ inventory }: { inventory: OpsInventory }) {
  const { streamer, channels } = inventory;
  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <StreamerAvatar streamer={streamer} className="size-9" />
            {streamer.displayName}
          </span>
        }
        description={
          <span className="flex items-center gap-2">
            Streamer <IdChip value={streamer.id} label="Copy streamer id" />
          </span>
        }
      />
      <ul aria-label="Channels" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {channels.map(({ channel }) => {
          const platform = getPlatform(channel.platform).name;
          const url = channelUrl(channel);
          const name = channel.displayName ?? channel.sourceId;
          return (
            <li key={channel.id} className="flex min-w-0 items-center gap-2">
              <PlatformIcon platform={channel.platform} className="size-3.5" />
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${name} on ${platform}`}
                  className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {name}
                  <ExternalLink aria-hidden className="size-3 text-muted-foreground" />
                </a>
              ) : (
                <span className="font-medium">{name}</span>
              )}
              <IdChip value={channel.sourceId} label={`Copy ${platform} channel id`} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
