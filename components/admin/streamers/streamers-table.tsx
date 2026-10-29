import Link from "../console-link";
import { PlatformIcon } from "@/components/platform-icon";
import type { OpsStreamer } from "@/lib/operator-contract";
import { getPlatform } from "@/lib/platforms/registry";
import { RECORDING_PIPELINE } from "../constants";
import { CountBreakdown } from "../count-breakdown";
import { DataTable } from "../data-table";
import { formatCount } from "../lib/format";
import { StreamerAvatar } from "./streamer-avatar";

function StreamerRow({ streamer }: { streamer: OpsStreamer }) {
  return (
    <tr className="relative hover:bg-muted/60">
      <td className="min-w-48">
        <div className="flex items-center gap-2.5">
          <StreamerAvatar streamer={streamer} />
          <Link
            href={`/admin/streamers/${streamer.id}`}
            className="truncate font-medium after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {streamer.displayName}
          </Link>
        </div>
      </td>
      <td>
        <ul aria-label="Channels" className="flex items-center gap-1.5 text-muted-foreground">
          {streamer.channels.map((channel) => (
            <li key={channel.id} title={`${getPlatform(channel.platform).name} · ${channel.displayName ?? channel.sourceId}`}>
              <PlatformIcon platform={channel.platform} className="size-3.5" />
            </li>
          ))}
        </ul>
      </td>
      <td className="text-right">{formatCount(streamer.recordings)}</td>
      <td className="min-w-40">
        <CountBreakdown counts={streamer.recordingCounts} order={RECORDING_PIPELINE} />
      </td>
    </tr>
  );
}

/** Streamers by name with their channels and recording counts; each row opens the streamer's inventory. */
export function StreamersTable({ streamers }: { streamers: OpsStreamer[] }) {
  return (
    <DataTable label="Streamers">
      <thead>
        <tr>
          <th scope="col">Streamer</th>
          <th scope="col">Channels</th>
          <th scope="col" className="text-right!">
            Recordings
          </th>
          <th scope="col">By status</th>
        </tr>
      </thead>
      <tbody>
        {streamers.map((streamer) => (
          <StreamerRow key={streamer.id} streamer={streamer} />
        ))}
      </tbody>
    </DataTable>
  );
}
