import { ExternalLink } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import type { OpsRecordingDetail } from "@/lib/operator-contract";
import { getPlatform } from "@/lib/platforms/registry";
import { MONO } from "../constants";
import { FactList } from "../data-table";
import { IdChip } from "../id-chip";
import { yesNo } from "../lib/detection";
import { formatCount, formatDateTime, formatSeconds, MISSING } from "../lib/format";
import { PageHeader } from "../page-header";
import { StatusChip } from "../status-chip";

/** Title, source, ids and the processing switches of one recording. */
export function RecordingHeader({ detail }: { detail: OpsRecordingDetail }) {
  const { recording, chunks, detections } = detail;
  const platform = getPlatform(recording.platform).name;
  return (
    <div className="@container flex flex-col gap-4">
      <PageHeader
        title={recording.title ?? <span className={MONO}>{recording.sourceId}</span>}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <PlatformIcon platform={recording.platform} decorative className="size-3.5" />
              {platform}
            </span>
            {recording.streamer && <span className="text-foreground">{recording.streamer.displayName}</span>}
            <span>{formatDateTime(recording.publishedAt)}</span>
            <span className="tabular-nums">{formatSeconds(recording.durationSeconds)}</span>
          </span>
        }
        actions={
          <a
            href={recording.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            Open on {platform}
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        }
      />
      <div className="grid gap-x-8 gap-y-3 rounded-lg border border-border p-3 @2xl:grid-cols-2">
        <FactList
          facts={[
            ["Status", <StatusChip status={recording.status} />],
            ["Recording id", <IdChip value={recording.id} label="Copy recording id" />],
            ["Source id", <IdChip value={recording.sourceId} label="Copy source id" />],
            ["Chunks", formatCount(chunks.length)],
            ["Detections", formatCount(detections.length)],
          ]}
        />
        <FactList
          facts={[
            ["Availability", recording.availability],
            ["Ready to process", yesNo(recording.readyForProcessing)],
            ["Processing enabled", yesNo(recording.processingEnabled)],
            ["Template", recording.templateVersion],
            ["Profile", recording.profile?.name ?? "Default"],
            ["Channel", recording.channel?.displayName ?? recording.channel?.sourceId ?? MISSING],
          ]}
        />
      </div>
    </div>
  );
}
