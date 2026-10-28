"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpsDetection } from "@/lib/operator-contract";
import { cn } from "@/lib/utils";
import { MONO } from "../constants";
import { useInspectParam } from "../hooks/use-inspect-param";
import { DETECTION_FIELDS } from "../lib/detection-fields";
import type { FieldRead } from "../lib/evidence";
import { formatPercent, formatTimecode } from "../lib/format";

/** How the read was made: method, model, prompt, why it was chosen, and where it was inherited from. */
function ReadProvenance({ evidence }: { evidence: FieldRead["evidence"] }) {
  const { hrefFor } = useInspectParam();
  const parts = [
    evidence.method,
    evidence.model,
    evidence.promptVersion && `prompt ${evidence.promptVersion}`,
    evidence.selectionReason,
  ].filter(Boolean);
  const inherited = evidence.inheritedFrom;
  return (
    <p className="col-span-full text-xs break-words text-muted-foreground">
      <span className={MONO}>{parts.join(" · ")}</span>
      {inherited && (
        <>
          {" · inherited from "}
          <Link
            href={hrefFor({ kind: "detection", id: inherited.detectionId })}
            scroll={false}
            className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {inherited.detectionId.slice(0, 8)}
          </Link>
          {` at ${formatTimecode(inherited.atMs / 1000)}`}
        </>
      )}
    </p>
  );
}

/** Props for {@link FieldRow}. */
export interface FieldRowProps {
  detection: OpsDetection;
  read: FieldRead;
  selected: boolean;
  onView: () => void;
}

/** One field: its value, confidence and provenance, with the action that shows its evidence. */
export function FieldRow({ detection, read, selected, onView }: FieldRowProps) {
  const field = DETECTION_FIELDS[read.field];
  return (
    <li
      className={cn(
        "grid grid-cols-[6.5rem_minmax(0,1fr)_2.75rem_auto] items-center gap-x-2 gap-y-0.5 px-3 py-2 text-sm tabular-nums",
        selected && "bg-muted",
      )}
    >
      <span className="text-muted-foreground">{field.label}</span>
      <span className="truncate font-medium" title={field.value(detection)}>
        {field.value(detection)}
      </span>
      <span className="text-right text-xs text-muted-foreground" title="Confidence">
        {formatPercent(read.evidence.confidence)}
      </span>
      <Button
        variant={selected ? "secondary" : "ghost"}
        size="xs"
        aria-pressed={selected}
        aria-label={`View ${field.label.toLowerCase()} evidence`}
        onClick={onView}
        className={cn("pointer-coarse:h-11", selected && "ring-1 ring-primary")}
      >
        <Eye aria-hidden />
        View
      </Button>
      <ReadProvenance evidence={read.evidence} />
    </li>
  );
}
