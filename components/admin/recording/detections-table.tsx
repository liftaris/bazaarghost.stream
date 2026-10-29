"use client";

import { useState } from "react";
import Link from "../console-link";
import { Button } from "@/components/ui/button";
import type { OpsDetectionRow } from "@/lib/operator-contract";
import { heroLabel } from "@/lib/session-summary";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import { DataTable } from "../data-table";
import { useInspectParam } from "../hooks/use-inspect-param";
import { detectionName, orMissing } from "../lib/detection";
import { formatTimecode } from "../lib/format";
import { EmptyState } from "../load-states";

const FIRST_ROWS = 200;

function DetectionRow({ detection }: { detection: OpsDetectionRow }) {
  const { target, hrefFor } = useInspectParam();
  const inspected = target?.kind === "detection" && target.id === detection.id;
  const name = detectionName(detection);
  return (
    <tr aria-current={inspected || undefined} className={cn("relative hover:bg-muted/60", inspected && "bg-muted")}>
      <td>
        <Link
          href={hrefFor({ kind: "detection", id: detection.id })}
          scroll={false}
          aria-label={`Inspect detection at ${formatTimecode(detection.at)}`}
          className={cn("text-xs after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring", MONO)}
        >
          {formatTimecode(detection.at)}
        </Link>
      </td>
      <td className="max-w-56 truncate">
        <span className={cn(!detection.username && "text-muted-foreground")}>{name.text}</span>
        {name.note && <span className="ml-1.5 text-xs text-muted-foreground">{name.note}</span>}
      </td>
      <td className="capitalize">{orMissing(detection.rank)}</td>
      <td className="text-right">{orMissing(detection.igd)}</td>
      <td className="text-right">{orMissing(detection.winsRemaining)}</td>
      <td className="whitespace-nowrap">
        {heroLabel(detection.ghostHero)} <span className="text-muted-foreground">vs</span> {heroLabel(detection.streamerHero)}
      </td>
    </tr>
  );
}

/** Every detection of the recording; each row opens the detection inspector. */
export function DetectionsTable({ detections }: { detections: OpsDetectionRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? detections : detections.slice(0, FIRST_ROWS);
  return (
    <section aria-labelledby="detections-heading" className="flex flex-col gap-2">
      <h2 id="detections-heading" className="text-sm font-semibold">
        Detections <span className="font-normal text-muted-foreground tabular-nums">{detections.length}</span>
      </h2>
      {detections.length ? (
        <DataTable label="Detections">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Name</th>
              <th scope="col">Rank</th>
              <th scope="col" className="text-right!">Day</th>
              <th scope="col" className="text-right!">Wins left</th>
              <th scope="col">Ghost vs streamer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((detection) => (
              <DetectionRow key={detection.id} detection={detection} />
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState title="No detections yet">Detections appear as chunks complete.</EmptyState>
      )}
      {rows.length < detections.length && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setShowAll(true)}>
          Show all {detections.length}
        </Button>
      )}
    </section>
  );
}
