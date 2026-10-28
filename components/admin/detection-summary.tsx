"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { EvidenceField } from "@/lib/api-contract";
import type { OpsDetection } from "@/lib/operator-contract";
import { heroLabel } from "@/lib/session-summary";
import { cn } from "@/lib/utils";
import { MONO } from "./constants";
import { FactList } from "./data-table";
import { useInspectParam } from "./hooks/use-inspect-param";
import { useOpsResource } from "./hooks/use-ops-resource";
import { IdChip } from "./id-chip";
import { detectionName, orMissing, yesNo } from "./lib/detection";
import { formatTimecode, MISSING } from "./lib/format";
import { EmptyState, ErrorState, RowsSkeleton } from "./load-states";

const LINK = "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

function percent(value: number | null) {
  return value == null ? MISSING : `${Math.round(value * 100)}%`;
}

function DetectionFacts({ detection }: { detection: OpsDetection }) {
  const { hrefFor } = useInspectParam();
  const name = detectionName(detection);
  const tournament = detection.gameMode === "tournament";
  const evidence = Object.keys(detection.fieldEvidence) as EvidenceField[];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">
          {name.text}
          {name.note && <span className="ml-2 text-xs font-normal text-muted-foreground">{name.note}</span>}
        </p>
        <IdChip value={detection.id} label="Copy detection id" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={hrefFor({ kind: "chunk", id: detection.chunkId })} scroll={false} className={LINK}>
            Open chunk
          </Link>
          <Link href={`/admin/recordings/${detection.recordingId}`} className={LINK}>
            Open recording
          </Link>
          <a href={detection.sourceUrlAt} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1", LINK)}>
            Source at this moment
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>
      </div>
      <FactList
        facts={[
          ["Time", <span className={MONO}>{formatTimecode(detection.at)}</span>],
          ["Name state", detection.nameState],
          ["Rank", <span className="capitalize">{orMissing(detection.rank)}</span>],
          ["Day (IGD)", detection.igdCorrection ? `${orMissing(detection.igd)} (corrected: ${detection.igdCorrection.reason})` : orMissing(detection.igd)],
          ["Wins left", orMissing(detection.winsRemaining)],
          ["Ghost hero", heroLabel(detection.ghostHero)],
          ["Streamer hero", heroLabel(detection.streamerHero)],
          ["Lethal", yesNo(detection.lethal)],
          ["Game mode", orMissing(detection.gameMode)],
          ...(tournament
            ? ([["Tournament W–L", `${orMissing(detection.tournamentWins)}–${orMissing(detection.tournamentLosses)}`]] as const)
            : []),
          ["Confidence", percent(detection.confidence)],
          ["Encounter confidence", percent(detection.encounterConfidence)],
          ["Truncated", yesNo(detection.truncated)],
          ["No right edge", yesNo(detection.noRightEdge)],
          ["Matchup", orMissing(detection.matchupId)],
          ["Evidence", evidence.length ? evidence.join(", ") : MISSING],
        ]}
      />
    </div>
  );
}

/** A read-only list of what a detection read, with links to its chunk, recording and source. */
export function DetectionSummary({ id }: { id: string }) {
  const { data, error, reload } = useOpsResource("/detections/:id", { id });
  if (error?.status === 404) return <EmptyState title="No detection has this id" />;
  if (error) return <ErrorState title="Could not load this detection" error={error} onRetry={reload} />;
  if (!data) return <RowsSkeleton rows={10} />;
  return <DetectionFacts detection={data} />;
}
