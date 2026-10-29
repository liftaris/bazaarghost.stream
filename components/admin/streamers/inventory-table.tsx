import Link from "../console-link";
import { ExternalLink } from "lucide-react";
import type { Availability, InventoryItem } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { FAILED_TEXT, MONO } from "../constants";
import { DataTable } from "../data-table";
import { formatDateTime, formatSeconds, MISSING } from "../lib/format";
import { ChunkMiniBar, StatusChip } from "../status-chip";

const AVAILABILITY_TEXT: Record<Availability, string> = {
  available: "text-foreground",
  checking: "text-muted-foreground",
  unknown: "text-muted-foreground",
  unavailable: FAILED_TEXT,
  expired: FAILED_TEXT,
};

const LINK = "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:-my-3 pointer-coarse:py-3";

function TitleCell({ item }: { item: InventoryItem }) {
  const text = item.title ?? <span className={cn("text-xs", MONO)}>{item.sourceId}</span>;
  if (!item.url) return <span className="block max-w-60 truncate @3xl:max-w-[26rem]">{text}</span>;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      title={`${item.title ?? item.sourceId} (opens on the platform)`}
      className={cn("relative z-10 flex max-w-60 min-w-0 items-center gap-1.5 @3xl:max-w-[26rem]", LINK)}
    >
      <span className="truncate">{text}</span>
      <ExternalLink aria-hidden className="size-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const opens = item.recordingId != null;
  return (
    <tr className={cn("relative", opens && "hover:bg-muted/60")}>
      <td className="max-w-64 min-w-36">
        <StatusChip status={item.state} />
        {item.reason && (
          <p title={item.reason} className={cn("truncate text-xs", item.state === "failed" ? FAILED_TEXT : "text-muted-foreground")}>
            {item.reason}
          </p>
        )}
      </td>
      <td className="min-w-48">
        <TitleCell item={item} />
      </td>
      <td className="whitespace-nowrap text-muted-foreground" title={formatDateTime(item.publishedAt)}>
        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-US", { dateStyle: "medium" }) : MISSING}
      </td>
      <td className="text-right whitespace-nowrap">{formatSeconds(item.durationSeconds)}</td>
      <td className="w-28">{item.chunkCounts ? <ChunkMiniBar counts={item.chunkCounts} className="w-20" /> : MISSING}</td>
      <td className={cn("whitespace-nowrap", item.availability ? AVAILABILITY_TEXT[item.availability] : "text-muted-foreground")}>
        {item.availability ?? MISSING}
      </td>
      <td className="whitespace-nowrap">
        {opens ? (
          <Link
            href={`/admin/recordings/${item.recordingId}`}
            aria-label={`Open recording ${item.recordingId}`}
            className={cn("tabular-nums after:absolute after:inset-0", LINK)}
          >
            {item.recordingId}
          </Link>
        ) : (
          <span className="text-muted-foreground">{MISSING}</span>
        )}
      </td>
    </tr>
  );
}

/** One channel's videos newest first; rows we have a recording for open it. */
export function InventoryTable({ items, label }: { items: InventoryItem[]; label: string }) {
  return (
    <DataTable label={label}>
      <thead>
        <tr>
          <th scope="col">State</th>
          <th scope="col">Title</th>
          <th scope="col">Published</th>
          <th scope="col" className="text-right!">
            Duration
          </th>
          <th scope="col">Chunks</th>
          <th scope="col">Availability</th>
          <th scope="col">Recording</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <InventoryRow key={`${item.sourceId}:${item.recordingId ?? ""}`} item={item} />
        ))}
      </tbody>
    </DataTable>
  );
}
