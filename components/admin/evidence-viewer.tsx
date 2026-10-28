"use client";

import { Crop, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CroppedFrame, FrameImage } from "./detection/frame-image";
import { RegionOutlines } from "./detection/region-outlines";
import { SamplesStrip } from "./detection/samples-strip";
import type { EvidenceSelectionState } from "./hooks/use-evidence-selection";
import { sourceUrlAt } from "./lib/detection";
import { DETECTION_FIELDS } from "./lib/detection-fields";
import { cropFrame, type FieldRead } from "./lib/evidence";
import { formatTimecode } from "./lib/format";

const LINK =
  "inline-flex items-center gap-1 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:min-h-11";

/** Props for {@link EvidenceViewer}. */
export interface EvidenceViewerProps {
  /** Every read taken from this frame; empty for legacy detections. */
  reads: FieldRead[];
  /** The stored frame. */
  url: string | null;
  /** Frame time in milliseconds, used when no read carries its own. */
  atMs: number;
  selection: EvidenceSelectionState;
  /** The detection's source link, moved to whichever frame is on screen. */
  sourceUrl: string;
}

function aspectOf(reads: FieldRead[]): number | null {
  for (const { evidence } of reads)
    if (evidence.sourceWidth && evidence.sourceHeight) return evidence.sourceWidth / evidence.sourceHeight;
  return null;
}

/**
 * One stored frame with the selected field's region outlined and the frame's
 * other regions drawn quieter. Crops to the region on demand, steps through the
 * read's samples, and links to the moment in the source video.
 */
export function EvidenceViewer({ reads, url, atMs, selection, sourceUrl }: EvidenceViewerProps) {
  const read = reads.find((r) => r.field === selection.field);
  const samples = read?.evidence.samples ?? [];
  const sample = selection.sample === null ? null : samples[selection.sample];
  const shownUrl = sample ? sample.screenshotUrl : url;
  const shownMs = sample?.atMs ?? read?.evidence.atMs ?? atMs;
  const time = formatTimecode(shownMs / 1000);
  const crop = read && !sample ? cropFrame(read.evidence) : null;
  const cropped = selection.crop && crop !== null;
  const label = read ? DETECTION_FIELDS[read.field].label : "Detection";

  return (
    <div className="flex flex-col gap-2" data-evidence-viewer={read?.field ?? "frame"}>
      {cropped ? (
        <CroppedFrame url={shownUrl} alt={`${label} region at ${time}`} crop={crop} />
      ) : (
        <FrameImage url={shownUrl} alt={`${label} frame at ${time}`} aspectRatio={aspectOf(reads)}>
          {!sample && <RegionOutlines reads={reads} selected={selection.field} />}
        </FrameImage>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {read && (
          <Button
            variant="outline"
            size="sm"
            aria-pressed={cropped}
            disabled={!crop || !shownUrl}
            title={crop ? undefined : sample ? "Regions are recorded for the chosen read only" : "This read has no region"}
            onClick={selection.toggleCrop}
            className={cn("mr-auto pointer-coarse:h-11", cropped && "border-primary bg-muted")}
          >
            <Crop aria-hidden />
            Crop to region
          </Button>
        )}
        <a href={sourceUrlAt(sourceUrl, shownMs / 1000)} target="_blank" rel="noreferrer" className={LINK}>
          Source at {time}
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
        {shownUrl && (
          <a href={shownUrl} target="_blank" rel="noreferrer" className={LINK}>
            Open image
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        )}
      </div>
      {sample && (
        <p className="text-xs text-muted-foreground">
          Sample at {time}. Regions are recorded for the chosen read only.
        </p>
      )}
      {read && samples.length > 0 && (
        <SamplesStrip evidence={read.evidence} samples={samples} shown={selection.sample} onShow={selection.showSample} />
      )}
    </div>
  );
}
