"use client";

import type { OpsDetection } from "@/lib/operator-contract";
import { FactList } from "../data-table";
import { EvidenceViewer } from "../evidence-viewer";
import type { EvidenceSelectionState } from "../hooks/use-evidence-selection";
import { DETECTION_FIELDS, fieldsWithoutEvidence, PHASE_LABELS } from "../lib/detection-fields";
import type { FrameGroup } from "../lib/evidence";
import { formatTimecode } from "../lib/format";
import { EmptyState } from "../load-states";
import { FieldRow } from "./field-row";

function FrameSection({
  detection,
  group,
  selection,
}: {
  detection: OpsDetection;
  group: FrameGroup;
  selection: EvidenceSelectionState;
}) {
  const open = group.reads.some((read) => read.field === selection.field);
  const headingId = `frame-${group.key.replace(/[^\w-]/g, "")}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-foreground tabular-nums">Frame at {formatTimecode(group.atMs / 1000)}</span>
        <span>{PHASE_LABELS[group.reads[0].evidence.phase]}</span>
        {group.reads.length > 1 && <span className="ml-auto tabular-nums">{group.reads.length} fields</span>}
      </h3>
      {open && (
        <EvidenceViewer
          reads={group.reads}
          url={group.screenshotUrl}
          atMs={group.atMs}
          selection={selection}
          sourceUrl={detection.sourceUrlAt}
        />
      )}
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {group.reads.map((read) => (
          <FieldRow
            key={read.field}
            detection={detection}
            read={read}
            selected={read.field === selection.field}
            onView={() => selection.select(read.field)}
          />
        ))}
      </ul>
    </section>
  );
}

function UnevidencedFields({ detection }: { detection: OpsDetection }) {
  const fields = fieldsWithoutEvidence(detection);
  if (!fields.length) return null;
  return (
    <section aria-labelledby="unevidenced-fields" className="flex flex-col gap-2">
      <h3 id="unevidenced-fields" className="text-xs font-medium text-muted-foreground">
        Read without frame evidence
      </h3>
      <FactList facts={fields.map((field) => [DETECTION_FIELDS[field].label, DETECTION_FIELDS[field].value(detection)])} />
    </section>
  );
}

/** Props for {@link FrameGroups}. */
export interface FrameGroupsProps {
  detection: OpsDetection;
  groups: FrameGroup[];
  selection: EvidenceSelectionState;
}

/**
 * Every field the detection read, grouped under the frame it came from, with
 * the evidence viewer opened inside the selected field's frame. Legacy
 * detections without per-field evidence show their detection frame instead.
 */
export function FrameGroups({ detection, groups, selection }: FrameGroupsProps) {
  if (!groups.length)
    return (
      <div className="flex flex-col gap-3">
        <EmptyState title="No per-field evidence">
          This detection was read before per-field evidence was recorded, so no regions are stored. The detection frame
          is shown as captured.
        </EmptyState>
        <EvidenceViewer reads={[]} url={detection.screenshotUrl} atMs={detection.at * 1000} selection={selection} sourceUrl={detection.sourceUrlAt} />
        <UnevidencedFields detection={detection} />
      </div>
    );
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <FrameSection key={group.key} detection={detection} group={group} selection={selection} />
      ))}
      <UnevidencedFields detection={detection} />
    </div>
  );
}
