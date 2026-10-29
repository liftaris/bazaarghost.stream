"use client";

import { useMemo } from "react";
import Link from "./console-link";
import type { OpsDetection } from "@/lib/operator-contract";
import { Skeleton } from "@/components/ui/skeleton";
import { DetectionHeader } from "./detection/detection-header";
import { FrameGroups } from "./detection/frame-groups";
import { IgdCorrectionNote } from "./detection/igd-correction";
import { useEvidenceSelection } from "./hooks/use-evidence-selection";
import { useInspectParam } from "./hooks/use-inspect-param";
import { useOpsResource } from "./hooks/use-ops-resource";
import { FIELD_ORDER } from "./lib/detection-fields";
import { groupByFrame } from "./lib/evidence";
import { EmptyState, ErrorState } from "./load-states";

function DetectionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading detection" className="flex flex-col gap-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="mt-2 aspect-video w-full rounded-lg" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

function DetectionDetails({ detection }: { detection: OpsDetection }) {
  const groups = useMemo(() => groupByFrame(detection.fieldEvidence, FIELD_ORDER), [detection.fieldEvidence]);
  const selection = useEvidenceSelection(groups);
  return (
    <div className="flex flex-col gap-5">
      <DetectionHeader detection={detection} />
      {detection.igdCorrection && <IgdCorrectionNote correction={detection.igdCorrection} igd={detection.igd} />}
      <FrameGroups detection={detection} groups={groups} selection={selection} />
    </div>
  );
}

/** Loads one detection into the inspector: what it read, and the frames and regions it read it from. */
export function DetectionInspector({ id }: { id: string }) {
  const { data, error, reload } = useOpsResource("/detections/:id", { id });
  const { hrefFor } = useInspectParam();

  if (error?.status === 404)
    return (
      <EmptyState title="No detection has this id">
        Chunk and detection ids look alike.{" "}
        <Link
          href={hrefFor({ kind: "chunk", id })}
          scroll={false}
          className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Open it as a chunk
        </Link>
      </EmptyState>
    );
  if (error) return <ErrorState title="Could not load this detection" error={error} onRetry={reload} />;
  if (!data) return <DetectionSkeleton />;
  return <DetectionDetails key={data.id} detection={data} />;
}
