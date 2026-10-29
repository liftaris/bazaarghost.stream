import Link from "../console-link";
import type { OpsIngestion } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { DataTable } from "../data-table";
import { MISSING } from "../lib/format";
import { RelativeTime } from "../relative-time";
import { StatusChip } from "../status-chip";
import { StreamerAvatar } from "../streamers/streamer-avatar";

/** Twitch catalog work per streamer, active work first; each streamer opens its inventory. */
export function CatalogTable({ catalog }: { catalog: OpsIngestion["catalog"] }) {
  return (
    <DataTable label="Twitch catalog work">
      <thead>
        <tr>
          <th scope="col">Streamer</th>
          <th scope="col">State</th>
          <th scope="col" className="text-right!">
            Attempts
          </th>
          <th scope="col">Last error</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        {catalog.map((work) => (
          <tr key={work.streamer.id} className="relative hover:bg-muted/60">
            <td className="min-w-44">
              <div className="flex items-center gap-2">
                <StreamerAvatar streamer={work.streamer} className="size-6" />
                <Link
                  href={`/admin/streamers/${work.streamer.id}`}
                  className="truncate font-medium after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {work.streamer.displayName}
                </Link>
              </div>
            </td>
            <td>
              <StatusChip status={work.state} />
            </td>
            <td className="text-right">{work.attempts}</td>
            <td
              className={cn("relative z-10 max-w-[24rem] truncate text-xs", MONO, work.lastError ? FAILED_TEXT : "text-muted-foreground")}
              title={work.lastError ?? undefined}
            >
              {work.lastError ?? MISSING}
            </td>
            <td>
              <RelativeTime iso={work.dueAt} />
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  );
}
