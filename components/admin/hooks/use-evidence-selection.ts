"use client";

import { useState } from "react";
import type { EvidenceField } from "@/lib/api-contract";
import type { FrameGroup } from "../lib/evidence";

/** Which read the evidence viewer shows, and how. */
export interface EvidenceSelection {
  field: EvidenceField | null;
  /** Index into the read's samples, or null for the chosen read itself. */
  sample: number | null;
  crop: boolean;
}

/** The viewer selection plus the actions that change it. */
export interface EvidenceSelectionState extends EvidenceSelection {
  /** Show another field's read; the crop choice carries over, the sample does not. */
  select: (field: EvidenceField) => void;
  showSample: (index: number | null) => void;
  toggleCrop: () => void;
}

function firstField(groups: FrameGroup[]): EvidenceField | null {
  const withImage = groups.find((group) => group.screenshotUrl !== null) ?? groups[0];
  return withImage?.reads[0]?.field ?? null;
}

/**
 * Track the field, sample and crop the evidence viewer shows. Starts on the
 * earliest read that has an image so a frame is visible on open.
 * @param groups Reads grouped by frame, from `groupByFrame`.
 * @returns {@link EvidenceSelectionState}
 */
export function useEvidenceSelection(groups: FrameGroup[]): EvidenceSelectionState {
  const [selection, setSelection] = useState<EvidenceSelection>(() => ({
    field: firstField(groups),
    sample: null,
    crop: false,
  }));
  return {
    ...selection,
    select: (field) => setSelection((s) => ({ ...s, field, sample: null })),
    showSample: (sample) => setSelection((s) => ({ ...s, sample })),
    toggleCrop: () => setSelection((s) => ({ ...s, crop: !s.crop })),
  };
}
