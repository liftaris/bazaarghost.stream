"use client";

import Link from "../console-link";
import type { IgdCorrection } from "@/lib/api-contract";
import { MONO } from "../constants";
import { useInspectParam } from "../hooks/use-inspect-param";
import { formatDateTime, MISSING } from "../lib/format";

/** Props for {@link IgdCorrectionNote}. */
export interface IgdCorrectionNoteProps {
  correction: IgdCorrection;
  /** The corrected day the detection now reports. */
  igd: number | null;
}

/** The day this detection reports was corrected after the read: to what, why, when, and from which reads. */
export function IgdCorrectionNote({ correction, igd }: IgdCorrectionNoteProps) {
  const { hrefFor } = useInspectParam();
  return (
    <section aria-labelledby="igd-correction" className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
      <h3 id="igd-correction" className="font-medium">
        Day corrected to <span className="tabular-nums">{igd ?? MISSING}</span>
      </h3>
      <p>{correction.reason}</p>
      <p className="text-xs text-muted-foreground">
        <time dateTime={correction.createdAt}>{formatDateTime(correction.createdAt)}</time>. The raw day is not returned yet;
        the Day frame below shows what was read.
      </p>
      {correction.sourceRefs.length > 0 && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          Based on
          {correction.sourceRefs.map((ref) => (
            <Link
              key={`${ref.detectionId}-${ref.field}`}
              href={hrefFor({ kind: "detection", id: ref.detectionId })}
              scroll={false}
              className="text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className={MONO}>{ref.detectionId.slice(0, 8)}</span> {ref.field}
            </Link>
          ))}
        </p>
      )}
    </section>
  );
}
