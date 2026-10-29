"use client";

import Image from "next/image";
import Link from "../console-link";
import { ExternalLink } from "lucide-react";
import type { NameState } from "@/lib/api-contract";
import type { OpsDetection } from "@/lib/operator-contract";
import { RANKS } from "@/lib/session-summary";
import { cn } from "@/lib/utils";
import { FactList } from "../data-table";
import { useInspectParam } from "../hooks/use-inspect-param";
import { IdChip } from "../id-chip";
import { detectionName, yesNo } from "../lib/detection";
import { DETECTION_FIELDS } from "../lib/detection-fields";
import { formatPercent, formatTimecode } from "../lib/format";
import { withInspect } from "../lib/inspect";

const LINK = "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11";

/** What a name state means for trusting the observed text; complete and legacy reads need no caveat. */
const NAME_CAVEATS: Partial<Record<NameState, string>> = {
  partial: "Observed text is incomplete, not a verified identity.",
  obstructed: "Observed text is obstructed, not a verified identity.",
  masked: "The name was hidden in the recording.",
  unreadable: "The name could not be read.",
};

function RankBadge({ rank }: { rank: string | null }) {
  const key = rank?.trim().toLowerCase();
  if (!key || !RANKS.some((value) => value === key)) return null;
  return <Image src={`/${key}.webp`} alt="" width={16} height={16} unoptimized className="size-4 shrink-0 object-contain" />;
}

/** Who the opponent was, where the detection sits, and the links out of the inspector. */
export function DetectionHeader({ detection }: { detection: OpsDetection }) {
  const { hrefFor } = useInspectParam();
  const name = detectionName(detection);
  const caveat = NAME_CAVEATS[detection.nameState] ?? (detection.username ? null : NAME_CAVEATS.unreadable);
  const summary = [
    detection.rank && DETECTION_FIELDS.rank.value(detection),
    detection.igd != null && DETECTION_FIELDS.igd.value(detection),
    detection.winsRemaining != null && `${detection.winsRemaining} wins left`,
    formatTimecode(detection.at),
  ].filter(Boolean);
  const self = { kind: "detection", id: detection.id } as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className={cn("text-base font-medium break-words", !detection.username && "text-muted-foreground")}>
          {name.text}
        </p>
        {caveat && <p className="text-xs text-muted-foreground">{caveat}</p>}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
          <RankBadge rank={detection.rank} />
          {summary.join(" · ")}
        </p>
      </div>
      <IdChip value={detection.id} label="Copy detection id" />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href={`/admin/recordings/${detection.recordingId}${withInspect("", self)}`} className={LINK}>
          Recording
        </Link>
        <Link href={hrefFor({ kind: "chunk", id: detection.chunkId })} scroll={false} className={LINK}>
          Chunk
        </Link>
        {detection.matchupId != null && (
          <Link href={`/matchups/${detection.matchupId}`} className={cn("tabular-nums", LINK)}>
            Matchup #{detection.matchupId}
          </Link>
        )}
        <a href={detection.sourceUrlAt} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1", LINK)}>
          Source at {formatTimecode(detection.at)}
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </div>
      <FactList
        facts={[
          ["Name confidence", formatPercent(detection.confidence)],
          ["Encounter confidence", formatPercent(detection.encounterConfidence)],
          ...(detection.truncated ? ([["Truncated", yesNo(true)]] as const) : []),
          ...(detection.noRightEdge ? ([["No right edge", yesNo(true)]] as const) : []),
        ]}
      />
    </div>
  );
}
